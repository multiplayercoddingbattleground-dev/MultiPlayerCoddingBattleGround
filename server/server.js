require("dotenv").config();

const http = require("http");
const app = require("./app");
const connectDB = require("./config/db");
const Battle = require("./models/Battle");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

/*
|--------------------------------------------------------------------------
| BATTLE TIMING
|--------------------------------------------------------------------------
|
| 15 minutes per question.
|
| 5 questions × 15 minutes = 75 minutes maximum.
|
*/

const QUESTION_DURATION_SECONDS = Number(
  process.env.QUESTION_DURATION_SECONDS || 900
);

const DEFAULT_TOTAL_QUESTIONS = 5;

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

/*
|--------------------------------------------------------------------------
| IN-MEMORY ROOMS
|--------------------------------------------------------------------------
*/

const rooms = new Map();

/*
|--------------------------------------------------------------------------
| ROOM HELPERS
|--------------------------------------------------------------------------
*/

function getRoom(roomCode) {
  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, {
      players: [],

      status: "waiting",

      selectedProblems: [],

      startedAt: null,

      questionDurationSeconds:
        QUESTION_DURATION_SECONDS,

      totalDurationSeconds:
        QUESTION_DURATION_SECONDS *
        DEFAULT_TOTAL_QUESTIONS,

      endedAt: null,

      winner: null,

      /*
       * Global 75-minute battle timer.
       */

      battleEndTimer: null,

      /*
       * Checks player question timers every second.
       */

      questionTimerInterval: null,
    });
  }

  return rooms.get(roomCode);
}

/*
|--------------------------------------------------------------------------
| PLAYER PROGRESS
|--------------------------------------------------------------------------
*/

function createPlayerProgress() {
  return {
    currentQuestion: 0,

    questionStartedAt: null,

    finished: false,
  };
}

function getPlayer(room, userId, socketId = null) {
  if (!room) {
    return null;
  }

  return room.players.find((player) => {
    if (
      userId &&
      String(player.id) === String(userId)
    ) {
      return true;
    }

    if (
      socketId &&
      player.socketId === socketId
    ) {
      return true;
    }

    return false;
  });
}

function getQuestionCount(room) {
  if (
    room &&
    Array.isArray(room.selectedProblems) &&
    room.selectedProblems.length > 0
  ) {
    return room.selectedProblems.length;
  }

  return DEFAULT_TOTAL_QUESTIONS;
}

/*
|--------------------------------------------------------------------------
| TIMER HELPERS
|--------------------------------------------------------------------------
*/

function getBattleRemainingSeconds(room) {
  if (!room) {
    return 0;
  }

  if (!room.startedAt) {
    return room.totalDurationSeconds;
  }

  if (room.status === "ended") {
    return 0;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - room.startedAt) / 1000
  );

  return Math.max(
    0,
    room.totalDurationSeconds -
      elapsedSeconds
  );
}

function getQuestionRemainingSeconds(
  room,
  player
) {
  if (!room || !player) {
    return 0;
  }

  if (room.status === "ended") {
    return 0;
  }

  if (player.finished) {
    return 0;
  }

  if (!player.questionStartedAt) {
    return room.questionDurationSeconds;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() -
      player.questionStartedAt) /
      1000
  );

  return Math.max(
    0,
    room.questionDurationSeconds -
      elapsedSeconds
  );
}

function getQuestionTimerPayload(
  roomCode,
  room,
  player
) {
  const questionCount =
    getQuestionCount(room);

  return {
    roomCode,

    userId: player.id,

    questionIndex:
      player.currentQuestion,

    questionNumber:
      player.currentQuestion + 1,

    totalQuestions:
      questionCount,

    questionStartedAt:
      player.questionStartedAt,

    questionDurationSeconds:
      room.questionDurationSeconds,

    remainingSeconds:
      getQuestionRemainingSeconds(
        room,
        player
      ),

    battleStartedAt:
      room.startedAt,

    battleDurationSeconds:
      room.totalDurationSeconds,

    battleRemainingSeconds:
      getBattleRemainingSeconds(room),

    status: room.status,

    finished:
      player.finished,
  };
}

function emitQuestionTimer(
  roomCode,
  room,
  player
) {
  if (
    !player ||
    !player.socketId
  ) {
    return;
  }

  io.to(player.socketId).emit(
    "question-timer",
    getQuestionTimerPayload(
      roomCode,
      room,
      player
    )
  );
}

function emitAllQuestionTimers(
  roomCode,
  room
) {
  if (!room) {
    return;
  }

  room.players.forEach((player) => {
    emitQuestionTimer(
      roomCode,
      room,
      player
    );
  });
}

/*
|--------------------------------------------------------------------------
| CLEAR TIMERS
|--------------------------------------------------------------------------
*/

function clearBattleTimers(room) {
  if (!room) {
    return;
  }

  if (room.battleEndTimer) {
    clearTimeout(room.battleEndTimer);

    room.battleEndTimer = null;
  }

  if (room.questionTimerInterval) {
    clearInterval(
      room.questionTimerInterval
    );

    room.questionTimerInterval = null;
  }
}

/*
|--------------------------------------------------------------------------
| DATABASE SYNCHRONIZATION
|--------------------------------------------------------------------------
*/

async function syncBattleStart(
  roomCode,
  room
) {
  try {
    const battle =
      await Battle.findOne({
        roomCode,
      });

    if (!battle) {
      console.warn(
        `MongoDB battle not found for room ${roomCode}`
      );

      return;
    }

    battle.status = "in-progress";

    battle.startTime =
      new Date(room.startedAt);

    battle.endTime = null;

    battle.questionDurationSeconds =
      room.questionDurationSeconds;

    battle.totalDurationSeconds =
      room.totalDurationSeconds;

    battle.winner = null;

    battle.playerProgress =
      room.players.map((player) => ({
        user: player.id,
        currentQuestion:
          player.currentQuestion,

        questionStartedAt:
          player.questionStartedAt
            ? new Date(
                player.questionStartedAt
              )
            : new Date(room.startedAt),

        finished:
          player.finished,
      }));

    await battle.save();

    console.log(
      `MongoDB battle synchronized: ${roomCode}`
    );
  } catch (error) {
    console.error(
      `Failed to synchronize battle start for ${roomCode}:`,
      error.message
    );
  }
}

async function syncPlayerProgress(
  roomCode,
  room,
  player
) {
  try {
    const battle =
      await Battle.findOne({
        roomCode,
      });

    if (!battle) {
      return;
    }

    const progress =
      battle.playerProgress.find(
        (item) =>
          String(item.user) ===
          String(player.id)
      );

    if (progress) {
      progress.currentQuestion =
        player.currentQuestion;

      progress.questionStartedAt =
        player.questionStartedAt
          ? new Date(
              player.questionStartedAt
            )
          : null;

      progress.finished =
        player.finished;
    } else {
      battle.playerProgress.push({
        user: player.id,

        currentQuestion:
          player.currentQuestion,

        questionStartedAt:
          player.questionStartedAt
            ? new Date(
                player.questionStartedAt
              )
            : null,

        finished:
          player.finished,
      });
    }

    await battle.save();
  } catch (error) {
    console.error(
      `Failed to synchronize player progress for ${roomCode}:`,
      error.message
    );
  }
}

async function syncBattleEnd(
  roomCode,
  room
) {
  try {
    const battle =
      await Battle.findOne({
        roomCode,
      });

    if (!battle) {
      return;
    }

    battle.status = "finished";

    battle.endTime =
      room.endedAt
        ? new Date(room.endedAt)
        : new Date();

    await battle.save();

    console.log(
      `MongoDB battle finished: ${roomCode}`
    );
  } catch (error) {
    console.error(
      `Failed to synchronize battle end for ${roomCode}:`,
      error.message
    );
  }
}

/*
|--------------------------------------------------------------------------
| ROOM BROADCAST
|--------------------------------------------------------------------------
*/

function broadcastRoom(roomCode) {
  const room = rooms.get(roomCode);

  if (!room) {
    return;
  }

  io.to(roomCode).emit(
    "room-state",
    {
      players:
        room.players,

      status:
        room.status,

      selectedProblems:
        room.selectedProblems,

      startedAt:
        room.startedAt,

      /*
       * Keep these names for compatibility
       * with existing frontend code.
       */

      durationSeconds:
        room.totalDurationSeconds,

      remainingSeconds:
        getBattleRemainingSeconds(room),

      questionDurationSeconds:
        room.questionDurationSeconds,

      totalDurationSeconds:
        room.totalDurationSeconds,

      endedAt:
        room.endedAt,

      winner:
        room.winner,
    }
  );
}

/*
|--------------------------------------------------------------------------
| END BATTLE
|--------------------------------------------------------------------------
*/

async function endBattle(roomCode) {
  const room = rooms.get(roomCode);

  if (!room) {
    return;
  }

  // Prevent ending the same battle multiple times
  if (room.status === "ended") {
    return;
  }

  room.status = "ended";
  room.endedAt = Date.now();

  // ------------------------------------------------------------
  // DETERMINE WINNER FROM PLAYER SCORES
  // ------------------------------------------------------------

  let winner = null;
  let highestScore = -1;

  room.players.forEach((player) => {
    const score = Number(player.score || player.points || 0);

    // Keep player score normalized
    player.score = score;
    player.points = score;

    if (score > highestScore) {
      highestScore = score;
      winner = player;
    }
  });

  // ------------------------------------------------------------
  // HANDLE TIE
  // ------------------------------------------------------------

  if (room.players.length > 0) {
    const topScore = Math.max(
      ...room.players.map((player) =>
        Number(player.score || player.points || 0)
      )
    );

    const topPlayers = room.players.filter(
      (player) =>
        Number(player.score || player.points || 0) === topScore
    );

    if (topPlayers.length > 1) {
      winner = null;

      console.log(
        `Battle ${roomCode} ended in a tie at ${topScore} points.`
      );
    }
  }

  // Store winner in room
  if (winner) {
    room.winner = {
      id: winner.id,
      name: winner.name || winner.username || "Player",
      username: winner.username || null,
      score: Number(
        winner.score || winner.points || 0
      ),
    };

    console.log(
      `Winner for ${roomCode}: ${
        winner.name || winner.username || winner.id
      } (${winner.score || winner.points || 0} points)`
    );
  } else {
    room.winner = null;

    console.log(
      `No winner for ${roomCode}.`
    );
  }

  // ------------------------------------------------------------
  // MARK ALL PLAYERS FINISHED
  // ------------------------------------------------------------

  room.players.forEach((player) => {
    player.finished = true;
  });

  // ------------------------------------------------------------
  // STOP ALL TIMERS
  // ------------------------------------------------------------

  clearBattleTimers(room);

  // ------------------------------------------------------------
  // BROADCAST FINAL ROOM STATE
  // ------------------------------------------------------------

  broadcastRoom(roomCode);

  emitAllQuestionTimers(
    roomCode,
    room
  );

  // ------------------------------------------------------------
  // FINAL BATTLE TIMER EVENT
  // ------------------------------------------------------------

  io.to(roomCode).emit(
    "battle-timer",
    {
      roomCode,

      startedAt:
        room.startedAt,

      durationSeconds:
        room.totalDurationSeconds,

      remainingSeconds: 0,

      status: "ended",

      endedAt:
        room.endedAt,

      winner:
        room.winner,
    }
  );

  // ------------------------------------------------------------
  // BATTLE ENDED EVENT
  // ------------------------------------------------------------

  io.to(roomCode).emit(
    "battle-ended",
    {
      roomCode,

      startedAt:
        room.startedAt,

      durationSeconds:
        room.totalDurationSeconds,

      remainingSeconds: 0,

      status: "ended",

      endedAt:
        room.endedAt,

      winner:
        room.winner,

      players:
        room.players,

      message:
        "Battle time is over. Submissions are no longer accepted.",
    }
  );

  // ------------------------------------------------------------
  // SAVE FINAL BATTLE STATE TO MONGODB
  // ------------------------------------------------------------

  await syncBattleEnd(
    roomCode,
    room
  );

  console.log(
    `Battle ended: ${roomCode}`
  );
}

/*
|--------------------------------------------------------------------------
| FINISH PLAYER
|--------------------------------------------------------------------------
*/

async function finishPlayer(
  roomCode,
  room,
  player
) {
  if (!player) {
    return;
  }

  player.finished = true;

  await syncPlayerProgress(
    roomCode,
    room,
    player
  );

  emitQuestionTimer(
    roomCode,
    room,
    player
  );

  io.to(player.socketId).emit(
    "all-questions-completed",
    {
      roomCode,

      userId:
        player.id,

      totalQuestions:
        getQuestionCount(room),

      message:
        "You have completed all questions.",
    }
  );

  broadcastRoom(roomCode);

  /*
   * If every player has completed all
   * questions, finish the battle.
   */

  const allFinished =
    room.players.length > 0 &&
    room.players.every(
      (item) => item.finished
    );

  if (allFinished) {
    await endBattle(roomCode);
  }
}

/*
|--------------------------------------------------------------------------
| ADVANCE PLAYER TO NEXT QUESTION
|--------------------------------------------------------------------------
*/

async function advancePlayerToNextQuestion(
  roomCode,
  room,
  player,
  reason = "manual"
) {
  if (!room || !player) {
    return;
  }

  if (room.status === "ended") {
    return;
  }

  if (player.finished) {
    return;
  }

  const totalQuestions =
    getQuestionCount(room);

  const currentIndex =
    player.currentQuestion;

  if (
    currentIndex >=
    totalQuestions - 1
  ) {
    await finishPlayer(
      roomCode,
      room,
      player
    );

    return;
  }

  player.currentQuestion =
    currentIndex + 1;

  player.questionStartedAt =
    Date.now();

  player.finished = false;

  await syncPlayerProgress(
    roomCode,
    room,
    player
  );

  io.to(player.socketId).emit(
    "question-changed",
    {
      roomCode,

      userId:
        player.id,

      previousQuestionIndex:
        currentIndex,

      questionIndex:
        player.currentQuestion,

      questionNumber:
        player.currentQuestion + 1,

      totalQuestions,

      questionStartedAt:
        player.questionStartedAt,

      questionDurationSeconds:
        room.questionDurationSeconds,

      reason,
    }
  );

  emitQuestionTimer(
    roomCode,
    room,
    player
  );

  broadcastRoom(roomCode);

  console.log(
    `Player ${player.username} moved to Q${player.currentQuestion + 1}/${totalQuestions} in ${roomCode} (${reason})`
  );
}

/*
|--------------------------------------------------------------------------
| CHECK QUESTION TIMERS
|--------------------------------------------------------------------------
*/

async function checkQuestionTimers(
  roomCode,
  room
) {
  if (!room) {
    return;
  }

  if (room.status !== "active") {
    return;
  }

  /*
   * First check the global 75-minute
   * battle limit.
   */

  if (
    getBattleRemainingSeconds(room) <= 0
  ) {
    await endBattle(roomCode);

    return;
  }

  /*
   * Then check every player's
   * individual 15-minute question timer.
   */

  for (
    const player of room.players
  ) {
    if (player.finished) {
      emitQuestionTimer(
        roomCode,
        room,
        player
      );

      continue;
    }

    const remaining =
      getQuestionRemainingSeconds(
        room,
        player
      );

    emitQuestionTimer(
      roomCode,
      room,
      player
    );

    if (remaining <= 0) {
      const questionIndex =
        player.currentQuestion;

      const totalQuestions =
        getQuestionCount(room);

      io.to(player.socketId).emit(
        "question-time-up",
        {
          roomCode,

          userId:
            player.id,

          questionIndex,

          questionNumber:
            questionIndex + 1,

          totalQuestions,

          message:
            `Time is up for Question ${questionIndex + 1}. Moving to the next question.`,
        }
      );

      await advancePlayerToNextQuestion(
        roomCode,
        room,
        player,
        "time-up"
      );

      if (room.status === "ended") {
        return;
      }
    }
  }
}

/*
|--------------------------------------------------------------------------
| START QUESTION TIMER SYSTEM
|--------------------------------------------------------------------------
*/

function startBattleTimers(
  roomCode,
  room
) {
  if (!room) {
    return;
  }

  clearBattleTimers(room);

  /*
   * Global 75-minute hard limit.
   */

  room.battleEndTimer =
    setTimeout(async () => {
      await endBattle(roomCode);
    }, room.totalDurationSeconds * 1000);

  /*
   * Individual question timers.
   */

  room.questionTimerInterval =
    setInterval(async () => {
      try {
        await checkQuestionTimers(
          roomCode,
          room
        );
      } catch (error) {
        console.error(
          `Question timer error for ${roomCode}:`,
          error
        );
      }
    }, 1000);
}

/*
|--------------------------------------------------------------------------
| SOCKET.IO
|--------------------------------------------------------------------------
*/

io.on("connection", (socket) => {
  console.log(
    `Socket connected: ${socket.id}`
  );

  /*
  |--------------------------------------------------------------------------
  | JOIN ROOM
  |--------------------------------------------------------------------------
  */

  socket.on(
    "join-room",
    async ({
      roomCode,
      userId,
      username,
      isHost,
    } = {}) => {
      try {
        if (!roomCode) {
          return;
        }

        const code = String(roomCode)
          .trim()
          .toUpperCase();

        const room = getRoom(code);

        socket.join(code);

        socket.data.roomCode =
          code;

        socket.data.userId =
          userId;

        socket.data.username =
          username || "Coder";

        let existingPlayer =
          room.players.find(
            (player) =>
              String(player.id) ===
              String(userId)
          );

        if (!existingPlayer) {
          existingPlayer = {
            id:
              userId ||
              socket.id,

            username:
              username ||
              "Coder",

            isHost: Boolean(
              isHost ||
                room.players.length === 0
            ),

            ready: true,

            socketId:
              socket.id,

            currentQuestion: 0,

            questionStartedAt:
              null,

            finished: false,
          };

          room.players.push(
            existingPlayer
          );
        } else {
          existingPlayer.socketId =
            socket.id;

          if (username) {
            existingPlayer.username =
              username;
          }

          /*
           * If reconnecting during an active
           * battle, preserve their question.
           */

          if (
            room.status === "active" &&
            !existingPlayer.questionStartedAt
          ) {
            existingPlayer.questionStartedAt =
              Date.now();
          }
        }

        /*
         * Waiting/ready states.
         */

        if (
          room.status !== "active" &&
          room.status !== "ended"
        ) {
          if (room.players.length >= 2) {
            room.status = "ready";
          } else {
            room.status = "waiting";
          }
        }

        /*
         * If active, make sure timers exist.
         */

        if (
          room.status === "active"
        ) {
          const battleRemaining =
            getBattleRemainingSeconds(
              room
            );

          if (
            battleRemaining <= 0
          ) {
            await endBattle(code);
          } else {
            if (
              !room.battleEndTimer ||
              !room.questionTimerInterval
            ) {
              startBattleTimers(
                code,
                room
              );
            }

            if (
              !existingPlayer.questionStartedAt
            ) {
              existingPlayer.questionStartedAt =
                Date.now();

              await syncPlayerProgress(
                code,
                room,
                existingPlayer
              );
            }

            emitQuestionTimer(
              code,
              room,
              existingPlayer
            );
          }
        }

        broadcastRoom(code);

        socket.emit(
          "battle-timer",
          {
            roomCode: code,

            startedAt:
              room.startedAt,

            durationSeconds:
              room.totalDurationSeconds,

            remainingSeconds:
              getBattleRemainingSeconds(
                room
              ),

            status:
              room.status,

            endedAt:
              room.endedAt,

            winner:
              room.winner,
          }
        );

        socket.emit(
          "question-timer",
          getQuestionTimerPayload(
            code,
            room,
            existingPlayer
          )
        );

        socket
          .to(code)
          .emit(
            "player-joined",
            {
              players:
                room.players,
            }
          );

        console.log(
          `${username || "Coder"} joined ${code}`
        );

        console.log(
          `Room ${code} players: ${room.players.length}`
        );
      } catch (error) {
        console.error(
          "join-room error:",
          error
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | START BATTLE
  |--------------------------------------------------------------------------
  */

  socket.on(
    "start-battle",
    async ({
      roomCode,
      selectedProblems,
    } = {}) => {
      try {
        if (!roomCode) {
          return;
        }

        const code = String(roomCode)
          .trim()
          .toUpperCase();

        const room = getRoom(code);

        if (
          room.status === "active" ||
          room.status === "ended"
        ) {
          return;
        }

        if (
          Array.isArray(
            selectedProblems
          )
        ) {
          room.selectedProblems =
            selectedProblems;
        }

        const totalQuestions =
          getQuestionCount(room);

        room.status = "active";

        room.startedAt =
          Date.now();

        room.questionDurationSeconds =
          QUESTION_DURATION_SECONDS;

        room.totalDurationSeconds =
          QUESTION_DURATION_SECONDS *
          totalQuestions;

        room.endedAt = null;

        room.winner = null;

        /*
         * Initialize every player's
         * question progress.
         */

        room.players.forEach(
          (player) => {
            player.currentQuestion = 0;

            player.questionStartedAt =
              room.startedAt;

            player.finished = false;
          }
        );

        /*
         * Save battle timing/progress
         * into MongoDB.
         */

        await syncBattleStart(
          code,
          room
        );

        /*
         * Start both:
         *
         * 1. 75-minute maximum battle timer
         * 2. Individual 15-minute question timers
         */

        startBattleTimers(
          code,
          room
        );

        broadcastRoom(code);

        const timerPayload = {
          roomCode: code,

          startedAt:
            room.startedAt,

          durationSeconds:
            room.totalDurationSeconds,

          remainingSeconds:
            getBattleRemainingSeconds(
              room
            ),

          status:
            room.status,

          endedAt:
            room.endedAt,

          winner:
            room.winner,
        };

        io.to(code).emit(
          "battle-started",
          {
            ...timerPayload,

            selectedProblems:
              room.selectedProblems,

            questionDurationSeconds:
              room.questionDurationSeconds,

            totalDurationSeconds:
              room.totalDurationSeconds,

            totalQuestions,
          }
        );

        /*
         * Send each player their
         * own question timer.
         */

        room.players.forEach(
          (player) => {
            emitQuestionTimer(
              code,
              room,
              player
            );
          }
        );

        console.log(
          `Battle started: ${code}`
        );

        console.log(
          `Questions: ${totalQuestions}`
        );

        console.log(
          `Per-question duration: ${room.questionDurationSeconds} seconds`
        );

        console.log(
          `Total duration: ${room.totalDurationSeconds} seconds`
        );

        console.log(
          `Started at: ${new Date(
            room.startedAt
          ).toISOString()}`
        );
      } catch (error) {
        console.error(
          "start-battle error:",
          error
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | NEXT QUESTION
  |--------------------------------------------------------------------------
  */

  socket.on(
    "next-question",
    async ({
      roomCode,
      userId,
    } = {}) => {
      try {
        if (!roomCode) {
          return;
        }

        const code = String(roomCode)
          .trim()
          .toUpperCase();

        const room =
          rooms.get(code);

        if (!room) {
          return;
        }

        if (
          room.status !== "active"
        ) {
          return;
        }

        const player =
          getPlayer(
            room,
            userId ||
              socket.data.userId,
            socket.id
          );

        if (!player) {
          return;
        }

        /*
         * Do not allow moving forward
         * if the global battle has ended.
         */

        if (
          getBattleRemainingSeconds(
            room
          ) <= 0
        ) {
          await endBattle(code);

          return;
        }

        await advancePlayerToNextQuestion(
          code,
          room,
          player,
          "manual"
        );
      } catch (error) {
        console.error(
          "next-question error:",
          error
        );
      }
    }
  );

  /*
  |--------------------------------------------------------------------------
  | SUBMISSION NOTIFICATION
  |--------------------------------------------------------------------------
  */

  socket.on(
    "submission-submitted",
    (payload = {}) => {
      if (!payload?.roomCode) {
        console.warn(
          "submission-submitted received without roomCode"
        );

        return;
      }

      const code = String(
        payload.roomCode
      )
        .trim()
        .toUpperCase();

      const room =
        rooms.get(code);

      if (!room) {
        console.warn(
          `submission-submitted: room ${code} does not exist`
        );

        return;
      }

      if (
        room.status === "ended"
      ) {
        return;
      }

      socket
        .to(code)
        .emit(
          "submission-submitted",
          {
            roomCode: code,

            battleId:
              payload.battleId ||
              null,

            userId:
              payload.userId ||
              socket.data.userId ||
              null,

            problemId:
              payload.problemId ||
              null,

            status:
              payload.status ||
              null,

            questionIndex:
              payload.questionIndex ??
              null,
          }
        );

      console.log(
        `Submission notification: ${code} | user=${payload.userId || socket.data.userId || socket.id} | problem=${payload.problemId || "unknown"} | status=${payload.status || "unknown"}`
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | LEAVE ROOM
  |--------------------------------------------------------------------------
  */

  socket.on(
    "leave-room",
    ({
      roomCode,
      userId,
    } = {}) => {
      if (!roomCode) {
        return;
      }

      const code = String(roomCode)
        .trim()
        .toUpperCase();

      const room =
        rooms.get(code);

      if (!room) {
        socket.leave(code);

        return;
      }

      room.players =
        room.players.filter(
          (player) =>
            String(player.id) !==
              String(userId) &&
            player.socketId !==
              socket.id
        );

      socket.leave(code);

      if (
        room.players.length === 0
      ) {
        clearBattleTimers(room);

        rooms.delete(code);

        console.log(
          `Room deleted: ${code}`
        );

        return;
      }

      /*
       * Do not reset active/ended battles.
       */

      if (
        room.status !== "active" &&
        room.status !== "ended"
      ) {
        room.status =
          room.players.length >= 2
            ? "ready"
            : "waiting";
      }

      broadcastRoom(code);

      socket
        .to(code)
        .emit(
          "player-left",
          {
            players:
              room.players,
          }
        );

      console.log(
        `Player left room: ${code}`
      );
    }
  );

  /*
  |--------------------------------------------------------------------------
  | DISCONNECT
  |--------------------------------------------------------------------------
  */

  socket.on(
    "disconnect",
    () => {
      console.log(
        `Socket disconnected: ${socket.id}`
      );

      const code =
        socket.data.roomCode;

      if (!code) {
        return;
      }

      const room =
        rooms.get(code);

      if (!room) {
        return;
      }

      /*
       * IMPORTANT:
       *
       * Do NOT remove a player's progress
       * from an active battle.
       *
       * We keep the player in the room and
       * clear only their socket connection.
       *
       * This allows reconnecting without
       * resetting their question timer.
       */

      const player =
        room.players.find(
          (item) =>
            item.socketId ===
            socket.id
        );

      if (player) {
        player.socketId = null;
      }

      /*
       * Only remove disconnected players
       * before a battle starts.
       */

      if (
        room.status !== "active" &&
        room.status !== "ended"
      ) {
        room.players =
          room.players.filter(
            (item) =>
              item.socketId !== null
          );
      }

      if (
        room.players.length === 0
      ) {
        clearBattleTimers(room);

        rooms.delete(code);

        console.log(
          `Room deleted after disconnect: ${code}`
        );

        return;
      }

      if (
        room.status !== "active" &&
        room.status !== "ended"
      ) {
        room.status =
          room.players.length >= 2
            ? "ready"
            : "waiting";
      }

      broadcastRoom(code);

      socket
        .to(code)
        .emit(
          "player-left",
          {
            players:
              room.players,
          }
        );

      console.log(
        `Player disconnected from room ${code}`
      );
    }
  );
});

/*
|--------------------------------------------------------------------------
| START SERVER
|--------------------------------------------------------------------------
*/

async function startServer() {
  try {
    await connectDB();

    httpServer.listen(
      PORT,
      () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );

        console.log(
          "Socket.IO ready"
        );

        console.log(
          `Question duration: ${QUESTION_DURATION_SECONDS} seconds`
        );

        console.log(
          `Default total duration: ${QUESTION_DURATION_SECONDS * DEFAULT_TOTAL_QUESTIONS} seconds`
        );
      }
    );
  } catch (error) {
    console.error(
      "Failed to start server:",
      error
    );

    process.exit(1);
  }
}

startServer();