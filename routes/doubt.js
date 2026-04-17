const express = require('express');
const router = express.Router();
const Doubt = require('../models/Doubt');
const authMiddleware = require('../middleware/authMiddleware');

// GET all doubts for a course
router.get('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const doubts = await Doubt.find({ course: req.params.courseId })
      .sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch doubts' });
  }
});

// POST a new doubt
router.post('/course/:courseId', authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Doubt cannot be empty' });
    }
    const doubt = new Doubt({
      course: req.params.courseId,
      question,
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role
    });
    await doubt.save();
    res.status(201).json(doubt);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post doubt' });
  }
});

// POST a reply to a doubt
router.post('/:doubtId/reply', authMiddleware, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: 'Reply cannot be empty' });
    }
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    doubt.replies.push({
      content,
      author: req.user.id,
      authorName: req.user.name,
      authorRole: req.user.role
    });
    await doubt.save();
    res.json(doubt);
  } catch (err) {
    res.status(500).json({ message: 'Failed to post reply' });
  }
});

// DELETE a doubt (only author or teacher)
router.delete('/:doubtId', authMiddleware, async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.doubtId);
    if (!doubt) return res.status(404).json({ message: 'Doubt not found' });

    const isAuthor = doubt.author.toString() === req.user.id;
    const isTeacher = req.user.role === 'teacher';

    if (!isAuthor && !isTeacher) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await doubt.deleteOne();
    res.json({ message: 'Doubt deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete doubt' });
  }
});

module.exports = router;