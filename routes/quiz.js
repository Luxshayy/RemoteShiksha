const express = require("express");
const router = express.Router();

const Quiz = require("../models/Quiz");
const Course = require("../models/Course");
const Result = require("../models/Result");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");


// ================= CREATE QUIZ =================
router.post(
  "/create/:courseId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {

      const { title, duration } = req.body;
      const { courseId } = req.params;

      if (!title) {
        return res.status(400).json({
          message: "Quiz title required"
        });
      }

      if (duration && (isNaN(duration) || duration < 1 || duration > 180)) {
        return res.status(400).json({
          message: "Duration must be between 1 and 180 minutes"
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      if (course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      const quiz = await Quiz.create({
        title,
        course: courseId,
        duration: duration || 10
      });

      res.status(201).json(quiz);

    } catch (error) {
      res.status(500).json({
        message: "Server error while creating quiz",
        error
      });
    }
  }
);


// ================= ADD QUESTION TO QUIZ =================
router.post(
  "/:quizId/question",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {

      const { quizId } = req.params;
      const { question, options, correctAnswer } = req.body;

      if (!question || !options || correctAnswer === undefined) {
        return res.status(400).json({
          message: "Question, options and correctAnswer required"
        });
      }

      if (options.length < 2) {
        return res.status(400).json({
          message: "At least two options required"
        });
      }

      const quiz = await Quiz.findById(quizId).populate("course");

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      if (quiz.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      quiz.questions.push({
        question,
        options,
        correctAnswer
      });

      await quiz.save();

      res.json({
        message: "Question added successfully",
        quiz
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while adding question",
        error
      });
    }
  }
);


// ================= GET QUIZZES BY COURSE =================
router.get(
  "/course/:courseId",
  authMiddleware,
  async (req, res) => {
    try {

      const { courseId } = req.params;

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      const isTeacher = course.teacher.toString() === req.user.id;
      const isStudent = course.students.includes(req.user.id);
      const isAdmin = req.user.role === "admin";

      if (!isTeacher && !isStudent && !isAdmin) {
        return res.status(403).json({
          message: "Access denied"
        });
      }

      const quizzes = await Quiz.find({ course: courseId });

      const sanitizedQuizzes = quizzes.map(quiz => ({
        _id: quiz._id,
        title: quiz.title,
        duration: quiz.duration,
        questions: quiz.questions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options
        }))
      }));

      res.json(sanitizedQuizzes);

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching quizzes",
        error
      });
    }
  }
);


// ================= SUBMIT QUIZ =================
router.post(
  "/submit/:quizId",
  authMiddleware,
  roleMiddleware(["student"]),
  async (req, res) => {
    try {

      const { answers } = req.body;

      const quiz = await Quiz.findById(req.params.quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      let score = 0;

      quiz.questions.forEach((q, index) => {
        if (answers[index] === q.correctAnswer) {
          score++;
        }
      });

      const result = await Result.create({
        student: req.user.id,
        quiz: quiz._id,
        score: score,
        total: quiz.questions.length
      });

      res.json({
        score: result.score,
        total: result.total
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while submitting quiz",
        error
      });
    }
  }
);


// ================= GET SINGLE QUIZ =================
router.get(
  "/:quizId",
  authMiddleware,
  async (req, res) => {
    try {

      const { quizId } = req.params;

      const quiz = await Quiz.findById(quizId);

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      const sanitizedQuiz = {
        _id: quiz._id,
        title: quiz.title,
        duration: quiz.duration,
        questions: quiz.questions.map(q => ({
          _id: q._id,
          question: q.question,
          options: q.options
        }))
      };

      res.json(sanitizedQuiz);

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching quiz",
        error
      });
    }
  }
);


// ================= DELETE QUIZ =================
router.delete(
  "/:quizId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {

      const { quizId } = req.params;

      const quiz = await Quiz.findById(quizId).populate("course");

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      if (quiz.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      await quiz.deleteOne();

      res.json({
        message: "Quiz deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while deleting quiz",
        error
      });
    }
  }
);


// ================= DELETE QUIZ QUESTION =================
router.delete(
  "/:quizId/question/:questionId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {

      const { quizId, questionId } = req.params;

      const quiz = await Quiz.findById(quizId).populate("course");

      if (!quiz) {
        return res.status(404).json({
          message: "Quiz not found"
        });
      }

      if (quiz.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      quiz.questions = quiz.questions.filter(
        q => q._id.toString() !== questionId
      );

      await quiz.save();

      res.json({
        message: "Question deleted successfully",
        quiz
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while deleting question",
        error
      });
    }
  }
);

module.exports = router;