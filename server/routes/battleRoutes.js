const express = require("express");

const {
  createBattle,
  joinBattle,
  getBattle,
  startBattle,
} = require("../controllers/battleController");

const { protect } = require("../middleware/auth");

const router = express.Router();

/*
|--------------------------------------------------------------------------
| Battle Routes
|--------------------------------------------------------------------------
*/

// Create a new battle room
router.post("/", protect, createBattle);

// Join an existing battle room
router.post("/:roomCode/join", protect, joinBattle);

// Start the battle
router.put("/:roomCode/start", protect, startBattle);

// Get battle room details
router.get("/:roomCode", protect, getBattle);

module.exports = router;
