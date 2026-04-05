const express = require("express");
const router = express.Router();

const User = require("../models/User");
const Course = require("../models/Course");
const Lecture = require("../models/Lecture");
const Quiz = require("../models/Quiz");
const Result = require("../models/Result");

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { cloudinary } = require("../config/cloudinary");


// ================= GET STATS =================
router.get(
  "/stats",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const totalUsers = await User.countDocuments();
      const totalStudents = await User.countDocuments({ role: "student" });
      const totalTeachers = await User.countDocuments({ role: "teacher" });
      const totalCourses = await Course.countDocuments();
      const totalQuizzes = await Quiz.countDocuments();
      const totalResults = await Result.countDocuments();

      res.json({
        totalUsers,
        totalStudents,
        totalTeachers,
        totalCourses,
        totalQuizzes,
        totalResults
      });

    } catch (error) {
      res.status(500).json({ message: "Error fetching stats", error });
    }
  }
);


// ================= GET ALL USERS =================
router.get(
  "/users",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (error) {
      res.status(500).json({ message: "Error fetching users", error });
    }
  }
);


// ================= DELETE USER (with cascade) =================
router.delete(
  "/user/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      if (req.params.id === req.user.id) {
        return res.status(400).json({
          message: "You cannot delete your own account"
        });
      }

      // Delete all courses taught by this teacher
      const courses = await Course.find({ teacher: req.params.id });

      for (const course of courses) {
        // Delete Cloudinary attachments from lectures
        const lectures = await Lecture.find({ course: course._id });
        for (const lecture of lectures) {
          for (const attachment of lecture.attachments) {
            try {
              const publicId = attachment.url.split("/").pop().split(".")[0];
              await cloudinary.uploader.destroy(
                "remoteshiksha/" + publicId,
                { resource_type: attachment.resourceType }
              );
            } catch (e) {
              console.log("Cloudinary delete error:", e.message);
            }
          }
        }

        await Lecture.deleteMany({ course: course._id });
        await Quiz.deleteMany({ course: course._id });
        await Course.findByIdAndDelete(course._id);
      }

      // Delete results for this student
      await Result.deleteMany({ student: req.params.id });

      // Delete the user
      await User.findByIdAndDelete(req.params.id);

      res.json({ message: "User and all related data deleted" });

    } catch (error) {
      res.status(500).json({ message: "Error deleting user", error });
    }
  }
);


// ================= GET ALL COURSES =================
router.get(
  "/courses",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      const courses = await Course.find()
        .populate("teacher", "name email");
      res.json(courses);
    } catch (error) {
      res.status(500).json({ message: "Error fetching courses", error });
    }
  }
);


// ================= DELETE COURSE (with cascade) =================
router.delete(
  "/course/:id",
  authMiddleware,
  roleMiddleware(["admin"]),
  async (req, res) => {
    try {
      // Delete Cloudinary attachments from lectures
      const lectures = await Lecture.find({ course: req.params.id });

      for (const lecture of lectures) {
        for (const attachment of lecture.attachments) {
          try {
            const publicId = attachment.url.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(
              "remoteshiksha/" + publicId,
              { resource_type: attachment.resourceType }
            );
          } catch (e) {
            console.log("Cloudinary delete error:", e.message);
          }
        }
      }

      await Lecture.deleteMany({ course: req.params.id });
      await Quiz.deleteMany({ course: req.params.id });
      await Course.findByIdAndDelete(req.params.id);

      res.json({ message: "Course and all related data deleted" });

    } catch (error) {
      res.status(500).json({ message: "Error deleting course", error });
    }
  }
);


module.exports = router;