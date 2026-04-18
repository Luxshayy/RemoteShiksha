const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const authMiddleware = require('../middleware/authMiddleware');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/chat', authMiddleware, async (req, res) => {
  try {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: 'Messages are required' });
    }

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: `You are an expert AI teacher on RemoteShiksha, an online learning platform.
Your job is to help students understand concepts clearly and patiently.
- Give clear, structured explanations
- Use simple examples and analogies
- Break down complex topics step by step
- Encourage students when they are struggling
- If asked something outside of education, politely redirect to learning topics
- Keep responses concise but complete`
        },
        ...messages
      ]
    });

    const reply = completion.choices[0].message.content;
    res.json({ reply });

  } catch (error) {
    console.log('Groq AI error:', error);
    res.status(500).json({ message: 'AI service error' });
  }
});

module.exports = router;