const crypto = require("crypto");
const Battle = require("../models/Battle");
const Problem = require("../models/Problem");

const generateRoomCode = () => crypto.randomBytes(3).toString("hex").toUpperCase();

const createBattle = async (req, res, next) => {
  try {
    const problem = await Problem.findOne().sort({ createdAt: 1 });
    const battle = await Battle.create({
      roomCode: generateRoomCode(),
      players: [req.userId],
      problem: problem ? problem._id : undefined,
    });
    res.status(201).json(battle);
  } catch (err) {
    next(err);
  }
};

const joinBattle = async (req, res, next) => {
  try {
    const { roomCode } = req.params;
    const battle = await Battle.findOne({ roomCode });
    if (!battle) return res.status(404).json({ message: "Battle room not found" });
    if (battle.status !== "waiting") {
      return res.status(400).json({ message: "Battle already started or finished" });
    }
    if (!battle.players.includes(req.userId)) {
      battle.players.push(req.userId);
      await battle.save();
    }
    res.json(battle);
  } catch (err) {
    next(err);
  }
};

const getBattle = async (req, res, next) => {
  try {
    const battle = await Battle.findOne({ roomCode: req.params.roomCode })
      .populate("players", "name rating")
      .populate("problem", "title difficulty");
    if (!battle) return res.status(404).json({ message: "Battle room not found" });
    res.json(battle);
  } catch (err) {
    next(err);
  }
};

module.exports = { createBattle, joinBattle, getBattle };
