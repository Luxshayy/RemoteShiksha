const express = require("express");
const router = express.Router();

const Lecture = require("../models/Lecture");
const Course = require("../models/Course");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const { cloudinary, upload } = require("../config/cloudinary");

// ================= CREATE LECTURE (Teacher Only) =================
router.post(
  "/create/:courseId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { title, content } = req.body;
      const { courseId } = req.params;

      if (!title || !content) {
        return res.status(400).json({
          message: "Title and content required"
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

      const lecture = await Lecture.create({
        title,
        content,
        course: courseId
      });

      res.status(201).json(lecture);

    } catch (error) {
      res.status(500).json({
        message: "Server error while creating lecture",
        error
      });
    }
  }
);


// ================= GET LECTURES BY COURSE ID =================
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

      const lectures = await Lecture.find({ course: courseId })
        .sort({ createdAt: 1 });

      res.json(lectures);

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching lectures",
        error
      });
    }
  }
);


// ================= GET SINGLE LECTURE BY ID =================
router.get(
  "/:lectureId",
  authMiddleware,
  async (req, res) => {
    try {
      const { lectureId } = req.params;

      const lecture = await Lecture.findById(lectureId)
        .populate("course", "teacher students");

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }

      const course = lecture.course;

      const isTeacher = course.teacher.toString() === req.user.id;
      const isStudent = course.students.includes(req.user.id);
      const isAdmin = req.user.role === "admin";

      if (!isTeacher && !isStudent && !isAdmin) {
        return res.status(403).json({
          message: "Access denied"
        });
      }

      res.json(lecture);

    } catch (error) {
      res.status(500).json({
        message: "Server error while fetching lecture",
        error
      });
    }
  }
);


// ================= UPDATE LECTURE (Teacher Only) =================
router.put(
  "/:lectureId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { lectureId } = req.params;
      const { title, content } = req.body;

      const lecture = await Lecture.findById(lectureId).populate("course");

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }

      // Ensure teacher owns the course
      if (lecture.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      if (title !== undefined) lecture.title = title;
      if (content !== undefined) lecture.content = content;

      await lecture.save();

      res.json(lecture);

    } catch (error) {
      res.status(500).json({
        message: "Server error while updating lecture",
        error
      });
    }
  }
);

// ================= DELETE LECTURE (Teacher Only) =================
router.delete(
  "/:lectureId",
  authMiddleware,
  roleMiddleware(["teacher"]),
  async (req, res) => {
    try {
      const { lectureId } = req.params;

      const lecture = await Lecture.findById(lectureId).populate("course");

      if (!lecture) {
        return res.status(404).json({
          message: "Lecture not found"
        });
      }

      // Ensure teacher owns the course
      if (lecture.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({
          message: "Not authorized"
        });
      }

      await lecture.deleteOne();

      res.json({
        message: "Lecture deleted successfully"
      });

    } catch (error) {
      res.status(500).json({
        message: "Server error while deleting lecture",
        error
      });
    }
  }
);

// ================= UPLOAD ATTACHMENT =================
router.post(
  "/:lectureId/upload",
  authMiddleware,
  upload.single("file"),
  async (req, res) => {
    try {
      const { lectureId } = req.params;

      const lecture = await Lecture.findById(lectureId).populate("course");

      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      if (lecture.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // Upload buffer directly to Cloudinary
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "remoteshiksha", resource_type: "auto" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        stream.end(req.file.buffer);
      });

      const attachment = {
        filename: req.file.originalname,
        url: uploadResult.secure_url,
        resourceType: uploadResult.resource_type
      };

      lecture.attachments.push(attachment);
      await lecture.save();

      res.json({
        message: "File uploaded successfully",
        attachment
      });

    } catch (error) {
      console.log("UPLOAD ERROR:", error);
      res.status(500).json({
        message: "Server error while uploading file",
        error
      });
    }
  }
);

// ================= DELETE ATTACHMENT =================
router.delete(
  "/:lectureId/attachment/:attachmentId",
  authMiddleware,
  async (req, res) => {
    try {
      const { lectureId, attachmentId } = req.params;

      const lecture = await Lecture.findById(lectureId).populate("course");

      if (!lecture) {
        return res.status(404).json({ message: "Lecture not found" });
      }

      if (lecture.course.teacher.toString() !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      lecture.attachments = lecture.attachments.filter(
        a => a._id.toString() !== attachmentId
      );

      await lecture.save();

      res.json({ message: "Attachment deleted successfully" });

    } catch (error) {
      res.status(500).json({
        message: "Server error while deleting attachment",
        error
      });
    }
  }
);

module.exports = router;