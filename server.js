const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const SYSTEM_PROMPT = `You are an expert assistant on the Uttar Pradesh Semiconductor Policy 2024.
Only answer questions related to this policy. Topics you can help with:
- Objectives and vision of the UP Semiconductor Policy
- Investment incentives, subsidies, and financial benefits
- Land allotment and infrastructure support
- Employment generation targets
- Eligibility criteria for businesses and investors
- How to apply for benefits under this policy
- Comparison with other state semiconductor policies

If asked anything unrelated, politely redirect the user back to the topic.
Be clear, concise, and helpful — your audience is businessmen and investors.`;

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history } = req.body;

    const contents = [];

    if (history && history.length > 0) {
      for (const msg of history) {
        contents.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: msg.content }]
        });
      }
    }

    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents
        })
      }
    );

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text
      || 'Sorry, I could not generate a response. Please try again.';

    res.json({ reply });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
