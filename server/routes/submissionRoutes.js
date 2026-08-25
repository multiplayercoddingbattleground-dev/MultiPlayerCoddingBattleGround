const express = require("express");
const {
  runCode,
  submitCode,
  getBattleSubmissions,
} = require("../controllers/submissionController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/run", protect, runCode);
router.post("/", protect, submitCode);
router.get("/battle/:battleId", protect, getBattleSubmissions);

module.exports = router;
