const express = require("express");
const { getProfile, getLeaderboard } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/leaderboard", getLeaderboard);
router.get("/:id", protect, getProfile);

module.exports = router;
