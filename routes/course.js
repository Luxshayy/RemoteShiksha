const express = require('express');
const Course = require('../models/Course');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();


// ================= CREATE COURSE (Teacher Only) =================
router.post(
  '/create',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {
    try {
      const { title, description } = req.body;

      const newCourse = new Course({
        title,
        description,
        teacher: req.user.id
      });

      await newCourse.save();

      res.status(201).json({
        message: "Course created successfully",
        course: newCourse
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while creating course",
        error
      });
    }
  }
);


// ================= GET ALL COURSES =================
router.get(
  '/all',
  authMiddleware,
  async (req, res) => {
    try {
      const courses = await Course.find()
        .populate('teacher', 'name email');

      res.json({
        count: courses.length,
        courses
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching courses",
        error
      });
    }
  }
);


// ================= GET MY ENROLLED COURSES (Student Only) =================
router.get(
  '/my-courses',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {
    try {
      const courses = await Course.find({
        students: req.user.id
      }).populate('teacher', 'name email');

      res.json({
        count: courses.length,
        courses
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching enrolled courses",
        error
      });
    }
  }
);

// ================= GET COURSES TAUGHT BY TEACHER =================
router.get(
  '/my-teaching',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {
    try {

      const courses = await Course.find({
        teacher: req.user.id
      }).populate('teacher', 'name email');

      res.json({
        count: courses.length,
        courses
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching teaching courses",
        error
      });
    }
  }
);


// ================= GET SINGLE COURSE BY ID =================
router.get(
  '/:id',
  authMiddleware,
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id)
        .populate('teacher', 'name email');

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      res.json(course);

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching course",
        error
      });
    }
  }
);


// ================= ENROLL IN COURSE (Student Only) =================
router.post(
  '/:id/enroll',
  authMiddleware,
  roleMiddleware(['student']),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({
          message: "Course not found"
        });
      }

      if (course.students.includes(req.user.id)) {
        return res.status(400).json({
          message: "You are already enrolled in this course"
        });
      }

      course.students.push(req.user.id);
      await course.save();

      res.json({
        message: "Enrolled successfully",
        course
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error during enrollment",
        error
      });
    }
  }
);

// ================= GET COURSES CREATED BY TEACHER =================
router.get(
  "/my-teaching",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {

      const courses = await Course.find({
        teacher: req.user.id
      }).populate("teacher", "name email");

      res.json({
        count: courses.length,
        courses
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching teacher courses",
        error
      });
    }
  }
);

// ================= GO LIVE (Teacher Only) =================
router.post(
  '/:id/go-live',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {
    try {
      const { youtubeUrl } = req.body;

      if (!youtubeUrl) {
        return res.status(400).json({ message: 'YouTube URL required' });
      }

      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      course.liveStream.isLive = true;
      course.liveStream.youtubeUrl = youtubeUrl;
      await course.save();

      res.json({ message: 'Stream started', course });

    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
);


// ================= END LIVE (Teacher Only) =================
router.post(
  '/:id/end-live',
  authMiddleware,
  roleMiddleware(['teacher']),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.id);

      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }

      if (course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      course.liveStream.isLive = false;
      course.liveStream.youtubeUrl = '';
      await course.save();

      res.json({ message: 'Stream ended' });

    } catch (error) {
      res.status(500).json({ message: 'Server error', error });
    }
  }
);
module.exports = router;