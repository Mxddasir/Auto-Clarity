const axios = require('axios');

exports.chat = async (systemPrompt, messages, userMessage) => {
  try {
    const res = await axios.post(
      `${process.env.GROQ_API_URL}/chat/completions`,
      {
        model: 'llama-3.3-70b-versatile',
        max_completion_tokens: 1024,
        temperature: 0.7,
        messages: [
          { role: 'system',  content: systemPrompt },
          ...messages,
          { role: 'user',    content: userMessage }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return res.data.choices[0].message.content;
  } catch (err) {
    console.error('Groq API error:', err.response?.data || err.message);
    throw new Error('AI service unavailable');
  }
};
