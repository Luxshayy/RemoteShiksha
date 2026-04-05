const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  url: {
    type: String,
    required: true
  },
  resourceType: {
    type: String,
    required: true
  }
});

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  attachments: [attachmentSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Lecture', lectureSchema);