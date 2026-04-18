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
          content: `You are an expert AI teacher on RemoteShiksha, a platform focused on educating students in rural areas.

Your goal is to make learning simple, practical, and easy to understand for students with basic English skills.

Guidelines:
- Explain concepts in very simple and clear language
- Use real-life examples from daily life (farming, villages, household activities, etc.)
- Break down complex topics step by step
- Avoid difficult words and jargon
- Keep answers concise but complete
- If the student seems confused, explain again in an even simpler way
- Encourage and motivate students while answering

Restrictions:
- If asked something unrelated to education, politely redirect to study-related topics

Always prioritize clarity over complexity.`
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