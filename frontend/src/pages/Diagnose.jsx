import { useState, useEffect } from 'react';
import { obdAPI, historyAPI, youtubeAPI, vehicleAPI } from '../api';
import {
  ChevronRight, CheckCircle, Wrench,
  PoundSterling, BarChart2, Youtube, ArrowLeft, Zap
} from 'lucide-react';
import { VEHICLE_MAKES } from '../data/vehicleMakesModels';

const S = { INPUT: 'input', VEHICLE: 'vehicle', INTERVIEW: 'interview', RESULT: 'result' };

export default function Diagnose() {
  const [step,      setStep]      = useState(S.INPUT);
  const [code,      setCode]      = useState('');
  const [codeInfo,  setCodeInfo]  = useState(null);
  const [vehicle,   setVehicle]   = useState({
    reg: '', make: '', model: '', year: '',
    fuelType: '', colour: '', engineCapacity: '',
    motStatus: '', taxStatus: '', co2Emissions: '',
    makeOther: '', modelOther: ''
  });
  const [sessionId, setSessionId] = useState(null);
  const [messages,  setMessages]  = useState([]);
  const [input,     setInput]     = useState('');
  const [loading,   setLoading]   = useState(false);
  const [result,    setResult]    = useState(null);
  const [videos,    setVideos]    = useState([]);
  const [error,     setError]     = useState('');
  const [answered,  setAnswered]  = useState(0);
  const [total,     setTotal]     = useState(8);
  const [possibleCauses, setPossibleCauses] = useState([]);
  const [availableCodes, setAvailableCodes] = useState([]);
  const [manualVehicleEdit, setManualVehicleEdit] = useState(false);
  useEffect(() => {
    // Fetch a small sample of supported codes for the input screen
    obdAPI.listCodes(15)
      .then(r => setAvailableCodes(r.data.sample || []))
      .catch(() => setAvailableCodes([]));
  }, []);

  const reset = () => {
    setStep(S.INPUT); setCode(''); setCodeInfo(null);
    setVehicle({
      reg:'', make:'', model:'', year:'',
      fuelType:'', colour:'', engineCapacity:'',
      motStatus:'', taxStatus:'', co2Emissions:'',
      makeOther:'', modelOther:''
    });
    setSessionId(null); setMessages([]); setInput('');
    setResult(null); setVideos([]); setError('');
    setAnswered(0); setTotal(8); setPossibleCauses([]);
    setManualVehicleEdit(false);
  };

  /* Step 1 — look up code */
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await obdAPI.getCode(code.trim().toUpperCase());
      setCodeInfo(r.data);
      setStep(S.VEHICLE);
    } catch { setError('Failed to look up code. Please try again.'); }
    finally   { setLoading(false); }
  };

  /* Step 2 — start session */
  const handleVehicleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      // Build full vehicle context including any DVLA data
      const vehicleContext = {
        reg:            vehicle.reg,
        make:           vehicle.make,
        model:          vehicle.model,
        year:           vehicle.year,
        fuelType:       vehicle.fuelType,
        colour:         vehicle.colour,
        engineCapacity: vehicle.engineCapacity,
        motStatus:      vehicle.motStatus,
        taxStatus:      vehicle.taxStatus,
        co2Emissions:   vehicle.co2Emissions
      };

      const r = await obdAPI.startSession({
        code:        code.toUpperCase(),
        vehicleInfo: vehicleContext
      });
      setSessionId(r.data.sessionId);
      setTotal(r.data.totalQuestions || 5);
      setMessages([{ role: 'assistant', content: r.data.message }]);
      if (r.data.possibleCauses?.length > 0) {
        setPossibleCauses(r.data.possibleCauses);
      } else if (codeInfo?.causes?.length > 0) {
        setPossibleCauses(codeInfo.causes.map(c => ({
          id: c.id,
          name: c.name,
          likelihood: c.likelihood,
          costMin: c.costMin,
          costMax: c.costMax
        })));
      } else {
        setPossibleCauses([]);
      }
      setStep(S.INTERVIEW);
    } catch { setError('Failed to start diagnostic session.'); }
    finally   { setLoading(false); }
  };

  /* Step 3 — send answer */
  const handleAnswer = async (quickAnswer) => {
    const ans = quickAnswer || input.trim();
    if (!ans || loading) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: ans }]);
    setLoading(true);
    try {
      const r = await obdAPI.answer({ sessionId, answer: ans });
      setAnswered(r.data.answersGiven || answered + 1);

      if (r.data.isDone) {
        const diag = r.data.diagnosis || {};
        setResult(diag);
        setStep(S.RESULT);
        if (diag.youtubeQuery) {
          youtubeAPI.search(diag.youtubeQuery)
            .then(v => setVideos(v.data.videos || []))
            .catch(() => {});
        }
        historyAPI.save({
          obdCode: code.toUpperCase(),
          codeTitle: codeInfo?.title,
          vehicleReg: vehicle.reg,
          vehicleInfo: vehicle,
          sessionData: { messages },
          diagnosis: diag,
          severity: codeInfo?.severity
        }).catch(() => {});
      } else {
        setMessages(m => [...m, { role: 'assistant', content: r.data.message }]);
      }
    } catch { setError('Failed to process answer. Please try again.'); }
    finally   { setLoading(false); }
  };

  const diffLabel = (d) => ['','Very Easy','Easy','Moderate','Hard','Expert'][d] || '';
  const diffColor = (d) => ['','var(--green)','var(--green)','var(--yellow)','var(--red)','var(--red)'][d];

  /* ── STEP 1: Code input ── */
  if (step === S.INPUT) return (
    <div className="page container" style={{ maxWidth: 580 }}>
      <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.8rem', marginBottom:'0.4rem' }}>
        OBD Diagnosis
      </h1>
      <p style={{ color:'var(--text-muted)', marginBottom:'2rem' }}>
        Enter your fault code to begin the AI diagnostic interview
      </p>

      <div className="card">
        <form onSubmit={handleCodeSubmit}>
          <label className="label">Fault Code</label>
          <input
            className="input"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. P0300, P0420, P0171"
            style={{ fontSize:'1.3rem', letterSpacing:'3px', fontFamily:'Rajdhani', fontWeight:700 }}
            required
          />
          {error && <p style={{ color:'var(--red)', fontSize:'0.875rem', marginTop:'0.5rem' }}>{error}</p>}
          <button
            type="submit" className="btn btn-primary"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center', marginTop:'1rem' }}
          >
            {loading
              ? <><span className="spinner" style={{width:18,height:18}} /> Looking up...</>
              : <><ChevronRight size={18} /> Look Up Code</>
            }
          </button>
        </form>

        <div className="info-box" style={{ marginTop:'1.25rem' }}>
          💡 Read OBD codes with any cheap Bluetooth scanner + a free app like Torque or OBD Auto Doctor
        </div>

        {availableCodes.length > 0 && (
          <div style={{ marginTop:'1.2rem' }}>
            <div style={{ fontSize:'0.8rem', fontWeight:500, marginBottom:'0.4rem' }}>
              A few examples we understand:
            </div>
            <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'0.25rem', fontSize:'0.82rem', color:'var(--text-muted)' }}>
              {availableCodes.slice(0, 8).map(c => (
                <li key={c.code} style={{ display:'flex', gap:'0.4rem' }}>
                  <span style={{ fontFamily:'Rajdhani', fontWeight:700, minWidth:70 }}>{c.code}</span>
                  <span>{c.title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );

  /* ── STEP 2: Vehicle details ── */
  if (step === S.VEHICLE) return (
    <div className="page container" style={{ maxWidth: 580 }}>
      <button className="btn btn-ghost" style={{ marginBottom:'1.25rem', fontSize:'0.85rem' }} onClick={() => setStep(S.INPUT)}>
        <ArrowLeft size={15} /> Back
      </button>

      {/* Code summary card */}
      {codeInfo && (
        <div className="card fade-in" style={{
          marginBottom:'1.25rem',
          borderColor: codeInfo.severity === 'high' ? 'var(--red)'
                      : codeInfo.severity === 'medium' ? 'var(--yellow)'
                      : 'var(--border)'
        }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:'0.5rem' }}>
            <div>
              <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.6rem', color:'var(--orange)' }}>
                {codeInfo.code}
              </div>
              <div style={{ fontWeight:500 }}>{codeInfo.title}</div>
              <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.2rem' }}>{codeInfo.system}</div>
            </div>
            <span className={`badge badge-${codeInfo.severity || 'unknown'}`}>
              {codeInfo.severity || 'Unknown'}
            </span>
          </div>
          {codeInfo.known && codeInfo.causes?.length > 0 && (
            <div style={{ display:'flex', flexWrap:'wrap', gap:'0.4rem', marginTop:'1rem' }}>
              {codeInfo.causes.slice(0,3).map(c => (
                <span key={c.id} style={{
                  background:'var(--bg-elevated)', border:'1px solid var(--border)',
                  borderRadius:'6px', padding:'0.2rem 0.55rem',
                  fontSize:'0.78rem', color:'var(--text-muted)'
                }}>
                  {c.name}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h2 style={{ fontFamily:'Rajdhani', fontWeight:600, fontSize:'1.25rem', marginBottom:'0.5rem' }}>
          Vehicle Details
        </h2>
        <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', marginBottom:'1rem' }}>
          Enter your UK reg and tap <strong>Look up</strong> to fill in details from DVLA. You can still pick or edit make, model and year below.
        </p>

        <form onSubmit={handleVehicleSubmit} style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          <div>
            <label className="label">UK Registration Plate</label>
            <div style={{ display:'flex', gap:'0.5rem' }}>
              <input
                className="input"
                value={vehicle.reg}
                onChange={e => setVehicle(v => ({ ...v, reg: e.target.value.toUpperCase() }))}
                placeholder="e.g. AB12 CDE"
                style={{ flex:1, letterSpacing:'2px', fontWeight:600 }}
              />
              <button
                type="button"
                className="btn btn-outline"
                style={{ flexShrink:0 }}
                disabled={!vehicle.reg.trim() || loading}
                onClick={async () => {
                  try {
                    setLoading(true); setError('');
                    const plate = vehicle.reg.trim().replace(/\s/g, '');
                    const r = await vehicleAPI.lookupReg(plate);
                    const data = r.data;
                    // Match API make to our dropdown (case-insensitive, ignore accents) so Make field shows correctly
                    const norm = (s) => (s || '').toLowerCase().normalize('NFD').replace(/\p{M}/gu, '');
                    const makeMatch = VEHICLE_MAKES.find(m => norm(m) === norm(data.make));
                    const resolvedMake = makeMatch || (data.make ? 'Other' : '');
                    setVehicle(v => ({
                      ...v,
                      reg:            data.reg           || v.reg,
                      make:           resolvedMake,
                      makeOther:      makeMatch ? '' : (data.make || ''),
                      model:          data.model || data.vehicleModel || v.model,
                      modelOther:     v.modelOther,
                      year:           data.year != null ? String(data.year) : v.year,
                      colour:         data.colour       || v.colour,
                      fuelType:       data.fuelType     || v.fuelType,
                      engineCapacity: data.engineCapacity != null ? data.engineCapacity : v.engineCapacity,
                      motStatus:      data.motStatus    || v.motStatus,
                      taxStatus:      data.taxStatus    || v.taxStatus,
                      co2Emissions:   data.co2Emissions != null ? data.co2Emissions : v.co2Emissions
                    }));
                  } catch {
                    setError('Could not find vehicle. Check the plate and try again.');
                  } finally { setLoading(false); }
                }}
              >
                🔍 Lookup
              </button>
            </div>
          </div>

          {(vehicle.make || vehicle.makeOther || vehicle.year || vehicle.engineCapacity != null || vehicle.colour || vehicle.fuelType || vehicle.motStatus != null) && (
            <div className="card fade-in" style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', padding:'0.875rem 1rem' }}>
              <div style={{ fontSize:'0.95rem', fontWeight:600, marginBottom:'0.6rem' }}>
                {[
                  (vehicle.make && vehicle.make !== 'Other' ? vehicle.make : vehicle.makeOther),
                  (vehicle.model || vehicle.modelOther),
                  vehicle.year,
                  vehicle.engineCapacity != null ? `${vehicle.engineCapacity}cc` : null
                ].filter(Boolean).join(' • ') || 'Vehicle details not available'}
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.5rem 1rem', fontSize:'0.875rem' }}>
                {[
                  ['Model', (vehicle.model || vehicle.modelOther) || '— Add below if known'],
                  ['Colour', vehicle.colour],
                  ['Fuel type', vehicle.fuelType],
                  ['MOT status', vehicle.motStatus],
                  ['Tax status', vehicle.taxStatus],
                  ['CO₂', vehicle.co2Emissions != null ? `${vehicle.co2Emissions} g/km` : null]
                ].filter(([, val]) => val != null).map(([label, value]) => (
                  <div key={label} style={{ display:'flex', flexDirection:'column', gap:'0.15rem' }}>
                    <span style={{ color:'var(--text-muted)', fontSize:'0.78rem' }}>{label}</span>
                    <span style={{ fontWeight:500 }}>{value}</span>
                  </div>
                ))}
              </div>
              {manualVehicleEdit && (
                <div style={{ marginTop:'0.75rem', display:'flex', flexDirection:'column', gap:'0.75rem', fontSize:'0.85rem' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <div>
                      <label className="label" style={{ fontSize:'0.78rem' }}>Make</label>
                      <select
                        className="input"
                        value={vehicle.make}
                        onChange={e => setVehicle(v => ({ ...v, make: e.target.value, model: '', modelOther: '' }))}
                        style={{ cursor:'pointer', appearance:'auto' }}
                      >
                        <option value="">Select make...</option>
                        {VEHICLE_MAKES.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="label" style={{ fontSize:'0.78rem' }}>Model</label>
                      <input
                        className="input"
                        placeholder="e.g. Golf, Focus, Astra"
                        value={vehicle.model || vehicle.modelOther || ''}
                        onChange={e => setVehicle(v => ({ ...v, model: e.target.value, modelOther: '' }))}
                      />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
                    <div>
                      <label className="label" style={{ fontSize:'0.78rem' }}>Year</label>
                      <input
                        className="input"
                        value={vehicle.year}
                        onChange={e => setVehicle(v => ({ ...v, year: e.target.value }))}
                        placeholder="e.g. 2013"
                      />
                    </div>
                    <div>
                      <label className="label" style={{ fontSize:'0.78rem' }}>Engine (cc)</label>
                      <input
                        className="input"
                        value={vehicle.engineCapacity != null ? String(vehicle.engineCapacity) : ''}
                        onChange={e => {
                          const val = e.target.value.trim();
                          const num = val === '' ? null : Number(val);
                          setVehicle(v => ({ ...v, engineCapacity: Number.isNaN(num) ? v.engineCapacity : num }));
                        }}
                        placeholder="e.g. 1968"
                      />
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setManualVehicleEdit(v => !v)}
                style={{
                  marginTop:'0.75rem',
                  fontSize:'0.78rem',
                  color:'var(--orange)',
                  background:'none',
                  border:'none',
                  padding:0,
                  cursor:'pointer',
                  textAlign:'left'
                }}
              >
                Not your car? Click here to edit the details.
              </button>
            </div>
          )}

          {error && <p style={{ color:'var(--red)', fontSize:'0.875rem' }}>{error}</p>}

          <button
            type="submit" className="btn btn-primary"
            disabled={loading}
            style={{ width:'100%', justifyContent:'center' }}
          >
            {loading
              ? <><span className="spinner" style={{width:18,height:18}} /> Starting...</>
              : <><Zap size={18} /> Start AI Diagnosis</>
            }
          </button>
        </form>
      </div>
    </div>
  );

  /* ── STEP 3: Interview ── */
  if (step === S.INTERVIEW) return (
    <div style={{
      display:'flex', flexDirection:'column',
      height:'calc(100vh - 60px)',
      maxWidth:'680px', margin:'0 auto', padding:'0 1rem'
    }}>
      {/* Header */}
      <div style={{
        display:'flex', alignItems:'center', gap:'0.75rem',
        padding:'0.875rem 0', borderBottom:'1px solid var(--border)'
      }}>
        <div style={{
          width:38, height:38, background:'var(--orange)',
          borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0
        }}>
          <span style={{ fontFamily:'Rajdhani', fontWeight:700, color:'#000', fontSize:'0.9rem' }}>AI</span>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:600, fontSize:'0.95rem' }}>Auto Clarity Diagnostics</div>
          <div style={{ color:'var(--green)', fontSize:'0.75rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
            <span style={{ width:6, height:6, background:'var(--green)', borderRadius:'50%', display:'inline-block', animation:'pulse 2s infinite' }} />
            Diagnosing {code}
          </div>
        </div>
        {/* Progress */}
        <div style={{ textAlign:'right', fontSize:'0.8rem', color:'var(--text-muted)' }}>
          {answered}/{total} questions
          <div style={{ width:80, height:4, background:'var(--border)', borderRadius:2, marginTop:4 }}>
            <div style={{ width:`${(answered/total)*100}%`, height:'100%', background:'var(--orange)', borderRadius:2, transition:'width 0.4s' }} />
          </div>
        </div>
      </div>

      {/* Possible causes card */}
      {possibleCauses.length > 0 && (
        <div className="card fade-in" style={{
          marginTop:'0.75rem', marginBottom:'0.5rem',
          background:'var(--bg-elevated)', border:'1px solid var(--border)'
        }}>
          <div style={{ fontSize:'0.72rem', color:'var(--orange)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.5rem' }}>
            Possible causes we're narrowing down from
          </div>
          <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginBottom:'0.75rem', lineHeight:1.4 }}>
            Answer the questions below so we can narrow this down to the most likely cause.
          </p>
          <ul style={{ listStyle:'none', padding:0, margin:0, display:'flex', flexDirection:'column', gap:'0.5rem' }}>
            {possibleCauses.map((c, i) => (
              <li key={c.id || i} style={{
                display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'0.25rem',
                padding:'0.4rem 0.5rem', background:'var(--bg)', borderRadius:6, border:'1px solid var(--border)',
                fontSize:'0.875rem'
              }}>
                <span style={{ fontWeight:500 }}>{c.name}</span>
                <span style={{ display:'flex', alignItems:'center', gap:'0.5rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>
                  {typeof c.likelihood === 'number' && <span>{c.likelihood}% likely</span>}
                  {(c.costMin != null || c.costMax != null) && (c.costMin != null && c.costMax != null) && (
                    <span>
                      £{c.costMin}–£{c.costMax}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', display:'flex', flexDirection:'column', gap:'0.75rem', padding:'1rem 0' }}>
        {messages.map((m, i) => (
          <div key={i} className="fade-in" style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth:'82%', padding:'0.875rem 1rem',
              borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? 'var(--orange)' : 'var(--bg-elevated)',
              color: m.role === 'user' ? '#000' : 'var(--text)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              fontSize:'0.95rem', lineHeight:1.55
            }}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start' }}>
            <div style={{ background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'16px 16px 16px 4px', padding:'0.875rem 1.25rem' }}>
              <div style={{ display:'flex', gap:5 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{ width:8, height:8, background:'var(--orange)', borderRadius:'50%', display:'inline-block', animation:`pulse 1.4s ease-in-out ${i*0.2}s infinite` }} />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop:'1px solid var(--border)', paddingTop:'0.875rem', paddingBottom:'1rem' }}>
        <div style={{ display:'flex', gap:'0.4rem', marginBottom:'0.5rem', flexWrap:'wrap' }}>
          {['Yes','No','Not sure','Sometimes'].map(opt => (
            <button
              key={opt} className="btn btn-ghost"
              disabled={loading}
              onClick={() => handleAnswer(opt)}
              style={{ fontSize:'0.82rem', padding:'0.35rem 0.75rem' }}
            >
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input
            className="input"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !loading && handleAnswer()}
            placeholder="Type your answer..."
            disabled={loading}
          />
          <button
            className="btn btn-primary"
            onClick={() => handleAnswer()}
            disabled={loading || !input.trim()}
            style={{ flexShrink:0, padding:'0.875rem 1rem' }}
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {error && <p style={{ color:'var(--red)', fontSize:'0.8rem', marginTop:'0.5rem' }}>{error}</p>}
      </div>
    </div>
  );

  /* ── STEP 4: Result ── */
  if (step === S.RESULT) return (
    <div className="page container" style={{ maxWidth:700 }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', marginBottom:'1.75rem' }}>
        <CheckCircle size={30} color="var(--green)" style={{ flexShrink:0 }} />
        <div>
          <h1 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.7rem' }}>Diagnosis Complete</h1>
          <p style={{ color:'var(--text-muted)', fontSize:'0.875rem' }}>
            {code} — {codeInfo?.title}
          </p>
        </div>
      </div>

      {/* Root cause */}
      <div className="card fade-in" style={{ borderColor:'var(--orange)', marginBottom:'1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:'0.875rem' }}>
          <div>
            <div style={{ fontSize:'0.72rem', color:'var(--orange)', fontWeight:600, textTransform:'uppercase', letterSpacing:'1px', marginBottom:'0.3rem' }}>
              Most Likely Root Cause
            </div>
            {possibleCauses.length > 0 && (
              <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'0.25rem' }}>
                Narrowed down from {possibleCauses.length} possible cause{possibleCauses.length !== 1 ? 's' : ''}.
              </div>
            )}
            <h2 style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'1.5rem' }}>
              {result?.rootCause?.name || result?.fixTitle || 'See fix steps below'}
            </h2>
          </div>
          {result?.rootCause?.confidence && (
            <div style={{ textAlign:'center', flexShrink:0 }}>
              <div style={{ fontFamily:'Rajdhani', fontWeight:700, fontSize:'2rem', color:'var(--orange)', lineHeight:1 }}>
                {result.rootCause.confidence}%
              </div>
              <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>confidence</div>
            </div>
          )}
        </div>

        {result?.reasoning && (
          <p style={{ color:'var(--text-muted)', fontSize:'0.9rem', lineHeight:1.6, marginBottom:'1rem' }}>
            {result.reasoning}
          </p>
        )}

        <div style={{ display:'flex', gap:'1.25rem', flexWrap:'wrap' }}>
          {result?.estimatedCost && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', color:'var(--text-muted)', fontSize:'0.875rem' }}>
              <PoundSterling size={15} color="var(--orange)" />
              {result.estimatedCost}
            </div>
          )}
          {result?.difficulty && (
            <div style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.875rem', color: diffColor(result.difficulty) }}>
              <BarChart2 size={15} />
              {diffLabel(result.difficulty)} difficulty
            </div>
          )}
        </div>
      </div>

      {/* Fix steps */}
      {result?.fixSteps?.length > 0 && (
        <div className="card fade-in" style={{ marginBottom:'1rem' }}>
          <h3 style={{ fontFamily:'Rajdhani', fontWeight:600, fontSize:'1.2rem', marginBottom:'1.1rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Wrench size={18} color="var(--orange)" /> How to Fix It
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.875rem' }}>
            {result.fixSteps.map((s, i) => (
              <div key={i} style={{ display:'flex', gap:'0.875rem' }}>
                <div style={{
                  width:28, height:28, background:'var(--orange)', borderRadius:'50%',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  flexShrink:0, fontFamily:'Rajdhani', fontWeight:700, color:'#000', fontSize:'0.875rem'
                }}>
                  {i+1}
                </div>
                <p style={{ fontSize:'0.925rem', lineHeight:1.55, paddingTop:4 }}>{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Videos */}
      {videos.length > 0 && (
        <div className="fade-in" style={{ marginBottom:'1rem' }}>
          <h3 style={{ fontFamily:'Rajdhani', fontWeight:600, fontSize:'1.2rem', marginBottom:'0.875rem', display:'flex', alignItems:'center', gap:'0.5rem' }}>
            <Youtube size={18} color="#ff0000" /> Video Guides
          </h3>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
            {videos.map(v => (
              <a
                key={v.id}
                href={v.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card"
                style={{ display:'flex', gap:'0.875rem', alignItems:'center', textDecoration:'none' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <img src={v.thumbnail} alt={v.title} style={{ width:110, height:62, objectFit:'cover', borderRadius:6, flexShrink:0 }} />
                <div>
                  <div style={{ fontWeight:500, fontSize:'0.875rem', lineHeight:1.4 }}>{v.title}</div>
                  <div style={{ color:'var(--text-muted)', fontSize:'0.78rem', marginTop:'0.2rem' }}>{v.channel}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={reset}>New Diagnosis</button>
        <button className="btn btn-outline" onClick={() => window.location.href = '/mechanic'}>Find a Mechanic</button>
        <button className="btn btn-ghost"   onClick={() => window.location.href = '/history'}>View History</button>
      </div>
    </div>
  );

  return null;
}
