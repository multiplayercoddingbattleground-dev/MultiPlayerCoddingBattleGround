const express = require("express");
const { createBattle, joinBattle, getBattle } = require("../controllers/battleController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, createBattle);
router.post("/:roomCode/join", protect, joinBattle);
router.get("/:roomCode", protect, getBattle);

module.exports = router;
