const crypto = require("crypto");
const mongoose = require("mongoose");

const Battle = require("../models/Battle");
const Problem = require("../models/Problem");

// ============================================================
// GENERATE ROOM CODE
// ============================================================

const generateRoomCode = () => {
  return crypto
    .randomBytes(3)
    .toString("hex")
    .toUpperCase();
};

// ============================================================
// POPULATE BATTLE
// ============================================================

const populateBattle = (query) => {
  return query
    .populate(
      "host",
      "name username email rating"
    )
    .populate(
      "players",
      "name username email rating"
    )
    .populate(
      "problems",
      "title difficulty description constraints examples starterCode"
    )
    .populate(
      "winner",
      "name username email rating"
    );
};

// ============================================================
// CREATE BATTLE
// ============================================================

const createBattle = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    let roomCode;
    let existingBattle;

    do {
      roomCode =
        generateRoomCode();

      existingBattle =
        await Battle.findOne({
          roomCode,
        });
    } while (existingBattle);

    const battle =
      await Battle.create({
        roomCode,
        host: userId,

        // Host is automatically player 1
        players: [userId],

        problems: [],

        status: "waiting",
      });

    const populatedBattle =
      await populateBattle(
        Battle.findById(
          battle._id
        )
      );

    console.log(
      "BATTLE CREATED:",
      {
        roomCode,
        host: String(userId),
        players:
          populatedBattle.players?.map(
            (player) =>
              String(player._id)
          ),
      }
    );

    return res.status(201).json(
      populatedBattle
    );
  } catch (err) {
    console.error(
      "CREATE BATTLE ERROR:",
      err
    );

    next(err);
  }
};

// ============================================================
// JOIN BATTLE
// ============================================================

const joinBattle = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.userId;

    const roomCode =
      String(
        req.params.roomCode || ""
      )
        .trim()
        .toUpperCase();

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (!roomCode) {
      return res.status(400).json({
        message:
          "Room code is required",
      });
    }

    const battle =
      await Battle.findOne({
        roomCode,
      });

    // --------------------------------------------------------
    // ROOM NOT FOUND
    // --------------------------------------------------------

    if (!battle) {
      return res.status(404).json({
        message:
          "Battle room not found",
      });
    }

    console.log(
      "========================================"
    );

    console.log(
      "JOIN BATTLE DEBUG"
    );

    console.log(
      "Room Code:",
      roomCode
    );

    console.log(
      "Joining User ID:",
      String(userId)
    );

    console.log(
      "Existing MongoDB Players:",
      battle.players.map(
        (player) =>
          String(player)
      )
    );

    console.log(
      "Existing Player Count:",
      battle.players.length
    );

    console.log(
      "========================================"
    );

    // --------------------------------------------------------
    // BATTLE ALREADY STARTED
    // --------------------------------------------------------

    if (
      battle.status !==
      "waiting"
    ) {
      return res.status(400).json({
        message:
          "Battle has already started or finished",
      });
    }

    // --------------------------------------------------------
    // CHECK IF USER ALREADY JOINED
    // --------------------------------------------------------

    const alreadyJoined =
      battle.players.some(
        (player) =>
          String(player) ===
          String(userId)
      );

    if (alreadyJoined) {
      console.log(
        "USER ALREADY EXISTS IN BATTLE:",
        String(userId)
      );

      const populatedBattle =
        await populateBattle(
          Battle.findById(
            battle._id
          )
        );

      return res.json(
        populatedBattle
      );
    }

    // --------------------------------------------------------
    // MAXIMUM 2 PLAYERS
    // --------------------------------------------------------

    if (
      battle.players.length >= 2
    ) {
      return res.status(400).json({
        message:
          "Battle room is full",
      });
    }

    // --------------------------------------------------------
    // ADD PLAYER 2
    // --------------------------------------------------------

    battle.players.push(
      userId
    );

    await battle.save();

    console.log(
      "PLAYER ADDED TO MONGODB:",
      String(userId)
    );

    console.log(
      "UPDATED PLAYER COUNT:",
      battle.players.length
    );

    console.log(
      "UPDATED PLAYERS:",
      battle.players.map(
        (player) =>
          String(player)
      )
    );

    // --------------------------------------------------------
    // RETURN POPULATED BATTLE
    // --------------------------------------------------------

    const populatedBattle =
      await populateBattle(
        Battle.findById(
          battle._id
        )
      );

    return res.json(
      populatedBattle
    );
  } catch (err) {
    console.error(
      "JOIN BATTLE ERROR:",
      err
    );

    next(err);
  }
};

// ============================================================
// GET BATTLE
// ============================================================

const getBattle = async (
  req,
  res,
  next
) => {
  try {
    const roomCode =
      String(
        req.params.roomCode || ""
      )
        .trim()
        .toUpperCase();

    if (!roomCode) {
      return res.status(400).json({
        message:
          "Room code is required",
      });
    }

    const battle =
      await populateBattle(
        Battle.findOne({
          roomCode,
        })
      );

    if (!battle) {
      return res.status(404).json({
        message:
          "Battle room not found",
      });
    }

    console.log(
      "GET BATTLE:",
      {
        roomCode,
        players:
          battle.players?.map(
            (player) =>
              String(player._id)
          ),
        playerCount:
          battle.players?.length,
        status:
          battle.status,
      }
    );

    return res.json(
      battle
    );
  } catch (err) {
    console.error(
      "GET BATTLE ERROR:",
      err
    );

    next(err);
  }
};

// ============================================================
// START BATTLE
// ============================================================

const startBattle = async (
  req,
  res,
  next
) => {
  try {
    const userId = req.userId;

    const roomCode =
      String(
        req.params.roomCode || ""
      )
        .trim()
        .toUpperCase();

    const selectedProblems =
      Array.isArray(
        req.body?.problems
      )
        ? req.body.problems
        : [];

    // --------------------------------------------------------
    // AUTHENTICATION
    // --------------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        message:
          "Authentication required",
      });
    }

    if (!roomCode) {
      return res.status(400).json({
        message:
          "Room code is required",
      });
    }

    // --------------------------------------------------------
    // FIND BATTLE
    // --------------------------------------------------------

    const battle =
      await Battle.findOne({
        roomCode,
      });

    if (!battle) {
      return res.status(404).json({
        message:
          "Battle room not found",
      });
    }

    // --------------------------------------------------------
    // DEBUG DATABASE STATE
    // --------------------------------------------------------

    console.log(
      "========================================"
    );

    console.log(
      "START BATTLE DATABASE DEBUG"
    );

    console.log(
      "Room Code:",
      roomCode
    );

    console.log(
      "Host User ID:",
      String(userId)
    );

    console.log(
      "MongoDB Players:",
      battle.players.map(
        (player) =>
          String(player)
      )
    );

    console.log(
      "MongoDB Player Count:",
      battle.players.length
    );

    console.log(
      "Selected Problems:",
      selectedProblems
    );

    console.log(
      "========================================"
    );

    // --------------------------------------------------------
    // HOST CHECK
    // --------------------------------------------------------

    if (
      String(battle.host) !==
      String(userId)
    ) {
      return res.status(403).json({
        message:
          "Only the host can start the battle",
      });
    }

    // --------------------------------------------------------
    // ALREADY STARTED
    // --------------------------------------------------------

    if (
      battle.status ===
        "in-progress" ||
      battle.status ===
        "finished"
    ) {
      const populatedBattle =
        await populateBattle(
          Battle.findById(
            battle._id
          )
        );

      return res.json(
        populatedBattle
      );
    }

    // --------------------------------------------------------
    // STATUS CHECK
    // --------------------------------------------------------

    if (
      battle.status !==
      "waiting"
    ) {
      return res.status(400).json({
        message:
          "Battle cannot be started in its current state",
      });
    }

    // --------------------------------------------------------
    // PLAYER COUNT CHECK
    // --------------------------------------------------------

    if (
      battle.players.length < 2
    ) {
      return res.status(400).json({
        message:
          "At least 2 players are required to start the battle",
      });
    }

    // --------------------------------------------------------
    // PROBLEM COUNT CHECK
    // --------------------------------------------------------

    if (
      selectedProblems.length === 0
    ) {
      return res.status(400).json({
        message:
          "Please select at least one problem",
      });
    }

    if (
      selectedProblems.length > 5
    ) {
      return res.status(400).json({
        message:
          "You can select a maximum of 5 problems",
      });
    }

    // --------------------------------------------------------
    // UNIQUE PROBLEM IDS
    // --------------------------------------------------------

    const uniqueProblemIds = [
      ...new Set(
        selectedProblems
          .map((id) =>
            String(id).trim()
          )
          .filter(Boolean)
      ),
    ];

    if (
      uniqueProblemIds.length ===
      0
    ) {
      return res.status(400).json({
        message:
          "Please select at least one valid problem",
      });
    }

    if (
      uniqueProblemIds.length > 5
    ) {
      return res.status(400).json({
        message:
          "You can select a maximum of 5 unique problems",
      });
    }

    // --------------------------------------------------------
    // VALIDATE OBJECT IDS
    // --------------------------------------------------------

    const invalidIds =
      uniqueProblemIds.filter(
        (id) =>
          !mongoose.Types.ObjectId.isValid(
            id
          )
      );

    if (
      invalidIds.length > 0
    ) {
      return res.status(400).json({
        message:
          "One or more selected problems have invalid IDs",
      });
    }

    // --------------------------------------------------------
    // CHECK PROBLEMS EXIST
    // --------------------------------------------------------

    const problems =
      await Problem.find({
        _id: {
          $in: uniqueProblemIds,
        },
      }).select("_id");

    if (
      problems.length !==
      uniqueProblemIds.length
    ) {
      return res.status(400).json({
        message:
          "One or more selected problems do not exist",
      });
    }

    // --------------------------------------------------------
    // UPDATE BATTLE
    // --------------------------------------------------------

    battle.problems =
      uniqueProblemIds;

    battle.status =
      "in-progress";

    battle.startTime =
      new Date();

    await battle.save();

    console.log(
      "BATTLE STARTED SUCCESSFULLY:",
      {
        roomCode,
        players:
          battle.players.map(
            (player) =>
              String(player)
          ),
        problems:
          uniqueProblemIds,
      }
    );

    // --------------------------------------------------------
    // RETURN UPDATED BATTLE
    // --------------------------------------------------------

    const populatedBattle =
      await populateBattle(
        Battle.findById(
          battle._id
        )
      );

    return res.json(
      populatedBattle
    );
  } catch (err) {
    console.error(
      "START BATTLE ERROR:",
      err
    );

    next(err);
  }
};

// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  createBattle,
  joinBattle,
  getBattle,
  startBattle,
};