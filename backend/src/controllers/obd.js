const fs      = require('fs');
const path    = require('path');
const obdData = require('../data/obd-codes.json');
const grok    = require('../services/groq');
const { v4: uuidv4 } = require('uuid');

// In-memory sessions (swap for Redis in production)
const sessions = {};

// Lightweight index of CSV OBD codes for fallback lookups
let csvIndex = null;
function loadCsvIndex() {
  if (csvIndex) return csvIndex;

  try {
    const csvPath = path.join(__dirname, '..', 'data', 'obd-trouble-codes.csv');
    const raw = fs.readFileSync(csvPath, 'utf8');
    const lines = raw.split(/\r?\n/).filter(Boolean);
    const [, ...rows] = lines; // skip header

    const index = {};
    for (const line of rows) {
      const parts = line.split(',');
      if (!parts.length) continue;
      const code = (parts[0] || '').trim().toUpperCase();
      if (!code) continue;

      const title    = (parts[1] || '').trim();
      const system   = (parts[2] || '').trim();
      const severity = (parts[3] || '').trim() || 'medium';

      index[code] = { code, title, system, severity };
    }
    csvIndex = index;
  } catch (e) {
    // If CSV load fails, we just fall back to JSON-only behaviour
    console.error('Failed to load OBD trouble code CSV:', e.message);
    csvIndex = {};
  }

  return csvIndex;
}

const csvCodes = loadCsvIndex();

exports.getCode = (req, res) => {
  const code = req.params.code.toUpperCase();
  const data = obdData[code];
  if (data) {
    return res.json({ ...data, known: true });
  }

  // Fallback to CSV metadata if we don't have a rich JSON definition
  const csv = csvCodes[code];
  if (csv) {
    return res.json({
      code: csv.code,
      title: csv.title || `OBD Code ${csv.code}`,
      system: csv.system || 'Unknown',
      severity: csv.severity || 'medium',
      known: true,
      fromCsv: true
    });
  }

  return res.json({
    code,
    known: false,
    title: 'Unknown Code — AI will still diagnose this',
    system: 'Unknown',
    severity: 'unknown'
  });
};

exports.startSession = async (req, res) => {
  try {
    const { code, vehicleInfo } = req.body;
    const upper = code.toUpperCase();
    const local = obdData[upper] || null;

    const sessionId = uuidv4();
    sessions[sessionId] = {
      userId: req.user.id,
      code: upper,
      vehicleInfo: vehicleInfo || {},
      local,
      answers: [],
      messages: [],
      possibleCauses: local ? local.causes : null,
      status: 'in_progress'
    };

    const system = buildSystem(upper, local, vehicleInfo);
    let first;
    let possibleCauses = null;

    if (local) {
      first = await grok.chat(
        system, [],
        'Introduce yourself in one sentence then ask the first diagnostic question. Be friendly and concise.'
      );
      possibleCauses = local.causes.map(c => ({
        id: c.id,
        name: c.name,
        likelihood: c.likelihood,
        costMin: c.costMin,
        costMax: c.costMax
      }));
    } else {
      first = await grok.chat(
        system, [],
        'Return ONLY valid JSON, no other text. Include: (1) "possibleCauses" — array of 3–5 possible causes for this code, each with "name" and "likelihood" (number 1–99); (2) "message" — one short friendly sentence introducing yourself, then the first diagnostic question. Example shape: {"possibleCauses":[{"name":"Cause A","likelihood":40},{"name":"Cause B","likelihood":30}],"message":"Hi, I\'m Auto Clarity. First question: ..."}'
      );
      try {
        const clean = first.replace(/```json\n?|\n?```/g, '').trim();
        const parsed = JSON.parse(clean);
        if (parsed.possibleCauses && Array.isArray(parsed.possibleCauses) && parsed.message) {
          possibleCauses = parsed.possibleCauses.map((c, i) => ({
            id: c.id || `c${i + 1}`,
            name: c.name || 'Unknown cause',
            likelihood: typeof c.likelihood === 'number' ? c.likelihood : 20,
            costMin: c.costMin,
            costMax: c.costMax
          }));
          first = parsed.message;
          sessions[sessionId].possibleCauses = possibleCauses;
        }
      } catch {
        /* use first as plain message, possibleCauses stays null */
      }
    }

    sessions[sessionId].messages.push({ role: 'assistant', content: first });
    const payload = {
      sessionId,
      message: first,
      totalQuestions: local ? local.questions.length : 8
    };
    if (possibleCauses && possibleCauses.length > 0)
      payload.possibleCauses = possibleCauses;
    res.json(payload);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start session' });
  }
};

exports.answerQuestion = async (req, res) => {
  try {
    const { sessionId, answer } = req.body;
    const s = sessions[sessionId];
    if (!s || s.userId !== req.user.id)
      return res.status(404).json({ error: 'Session not found' });

    s.answers.push(answer);
    s.messages.push({ role: 'user', content: answer });

    const maxQ   = s.local ? s.local.questions.length : 8;
    const isDone = s.answers.length >= maxQ;
    const system = buildSystem(s.code, s.local, s.vehicleInfo);

    const instruction = isDone
      ? `Based on all the answers, give your FINAL DIAGNOSIS. Return ONLY valid JSON, no other text:
{"isDone":true,"rootCause":{"id":"c1","name":"Cause name","confidence":85},"reasoning":"2 sentence explanation","fixTitle":"Fix name","fixSteps":["Step 1","Step 2","Step 3"],"estimatedCost":"£20-£80","difficulty":2,"youtubeQuery":"search query for youtube"}`
      : 'Ask the next diagnostic question. Include occasional questions like "Have you recently changed or replaced [relevant part]?" or "Have you checked [X]?" to narrow down the possible causes. Keep each question to one sentence, no preamble.';

    const reply = await grok.chat(system, s.messages, instruction);
    s.messages.push({ role: 'assistant', content: reply });

    if (isDone) {
      s.status = 'complete';
      try {
        const clean   = reply.replace(/```json\n?|\n?```/g, '').trim();
        const diagnosis = JSON.parse(clean);
        s.diagnosis = diagnosis;
        return res.json({ isDone: true, diagnosis, sessionId });
      } catch {
        return res.json({ isDone: true, sessionId, rawResponse: reply });
      }
    }

    res.json({ isDone: false, message: reply, answersGiven: s.answers.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to process answer' });
  }
};

function buildSystem(code, local, vehicleInfo) {
  const csv = csvCodes[code] || null;

  const v = vehicleInfo
    ? `${vehicleInfo.year || ''} ${vehicleInfo.make || ''} ${vehicleInfo.model || ''}`.trim() || 'Not specified'
    : 'Not specified';

  const extra = vehicleInfo && [
    vehicleInfo.reg && `Reg: ${vehicleInfo.reg}`,
    vehicleInfo.colour && `Colour: ${vehicleInfo.colour}`,
    vehicleInfo.fuelType && `Fuel: ${vehicleInfo.fuelType}`,
    vehicleInfo.engineCapacity && `Engine: ${vehicleInfo.engineCapacity}cc`,
    vehicleInfo.motStatus && `MOT: ${vehicleInfo.motStatus}`,
    vehicleInfo.taxStatus && `Tax: ${vehicleInfo.taxStatus}`,
    vehicleInfo.co2Emissions != null && `CO₂: ${vehicleInfo.co2Emissions} g/km`
  ].filter(Boolean).join(', ');
  const vehicleContext = extra ? ` (${extra})` : '';

  const causes = local
    ? local.causes.map(c => `${c.name} (${c.likelihood}% likely)`).join(', ')
    : 'Unknown — use your general knowledge';

  return `You are Auto Clarity's AI diagnostic engine helping UK car owners diagnose OBD fault codes.

Vehicle: ${v}${vehicleContext}
OBD Code: ${code}
Code: ${local?.title || csv?.title || 'Unknown code — diagnose using general knowledge'}
System: ${local?.system || csv?.system || 'Unknown'}
Possible causes by likelihood: ${causes}

Rules:
- Ask targeted yes/no or multiple-choice questions to narrow down the root cause
- After a few symptom questions, ask at least one or two "Have you recently changed or replaced [part]?" or "Have you checked [X]?" type questions to rule causes in or out
- Be conversational and friendly — plain English, no jargon
- UK context: use miles, £ for costs, say petrol/diesel not gas
- Keep each question short and clear
- Your FINAL diagnosis must be one of the possible causes listed above (or the list you gave for unknown codes) — pick the single most likely cause based on the user's answers
- After ${local ? local.questions.length : 8} questions you MUST output the JSON diagnosis
- When outputting diagnosis: ONLY output valid JSON, absolutely no other text`;
}

// User-friendly list of available codes (sample only to avoid 3000+ items)
exports.listCodes = (req, res) => {
  const allCsv = Object.values(csvCodes);
  const sampleSize = Math.min(Number(req.query.limit) || 50, 200);
  const sample = allCsv.slice(0, sampleSize).map(c => ({
    code: c.code,
    title: c.title,
    system: c.system,
    severity: c.severity
  }));

  res.json({
    total: allCsv.length,
    sample
  });
};
