const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true
  },
  options: [
    {
      type: String,
      required: true
    }
  ],
  correctAnswer: {
    type: Number,
    required: true
  }
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Course",
    required: true
  },
  duration: {
    type: Number,
    default: 10
  },
  questions: [questionSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Quiz", quizSchema);