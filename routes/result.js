const express = require("express");
const router = express.Router();

const Result = require("../models/Result");
const authMiddleware = require("../middleware/authMiddleware");


// ================= GET MY RESULTS =================
router.get(
  "/my-results",
  authMiddleware,
  async (req, res) => {

    try {

      const results = await Result.find({
        student: req.user.id
      }).populate("quiz", "title");

      res.json(results);

    } catch (error) {

      res.status(500).json({
        message: "Error fetching results",
        error
      });

    }

  }
);

module.exports = router;