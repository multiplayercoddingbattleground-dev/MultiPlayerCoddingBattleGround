const Problem = require("../models/Problem");
const Battle = require("../models/Battle");
const Submission = require("../models/Submission");
const { executeCode } = require("../services/codeExecutionService");

const POINTS_BY_DIFFICULTY = {
  easy: 100,
  medium: 200,
  hard: 300,
};

const DEFAULT_QUESTION_DURATION_SECONDS = 15 * 60;
const DEFAULT_TOTAL_QUESTIONS = 5;
const DEFAULT_TOTAL_DURATION_SECONDS =
  DEFAULT_QUESTION_DURATION_SECONDS * DEFAULT_TOTAL_QUESTIONS;

/*
|--------------------------------------------------------------------------
| PROBLEM POINTS
|--------------------------------------------------------------------------
*/

const getProblemPoints = (difficulty) => {
  const normalizedDifficulty = String(
    difficulty || "easy"
  )
    .trim()
    .toLowerCase();

  return POINTS_BY_DIFFICULTY[normalizedDifficulty] || 100;
};

/*
|--------------------------------------------------------------------------
| TOTAL BATTLE DURATION
|--------------------------------------------------------------------------
|
| New system:
|
| Q1 = 15 min
| Q2 = 15 min
| Q3 = 15 min
| Q4 = 15 min
| Q5 = 15 min
|
| Total = 75 minutes = 4500 seconds
|
|--------------------------------------------------------------------------
*/

const getTotalBattleDurationSeconds = (battle) => {
  const totalDuration = Number(
    battle?.totalDurationSeconds
  );

  if (
    Number.isFinite(totalDuration) &&
    totalDuration > 0
  ) {
    return totalDuration;
  }

  /*
   * Backward compatibility.
   */

  const oldDuration = Number(
    battle?.durationSeconds
  );

  if (
    Number.isFinite(oldDuration) &&
    oldDuration > 0 &&
    oldDuration !== DEFAULT_QUESTION_DURATION_SECONDS
  ) {
    return oldDuration;
  }

  const questionCount =
    Array.isArray(battle?.problems) &&
    battle.problems.length > 0
      ? battle.problems.length
      : DEFAULT_TOTAL_QUESTIONS;

  return (
    DEFAULT_QUESTION_DURATION_SECONDS *
    questionCount
  );
};

/*
|--------------------------------------------------------------------------
| TOTAL BATTLE REMAINING TIME
|--------------------------------------------------------------------------
*/

const getBattleRemainingSeconds = (battle) => {
  if (!battle?.startTime) {
    return getTotalBattleDurationSeconds(battle);
  }

  const totalDurationSeconds =
    getTotalBattleDurationSeconds(battle);

  const startTime = new Date(
    battle.startTime
  ).getTime();

  if (!Number.isFinite(startTime)) {
    return totalDurationSeconds;
  }

  const elapsedSeconds = Math.floor(
    (Date.now() - startTime) / 1000
  );

  return Math.max(
    0,
    totalDurationSeconds - elapsedSeconds
  );
};

/*
|--------------------------------------------------------------------------
| RUN CODE
|--------------------------------------------------------------------------
*/

const runCode = async (
  req,
  res,
  next
) => {
  try {
    const {
      code,
      language,
      problemId,
    } = req.body;

    if (
      !code ||
      !language ||
      !problemId
    ) {
      return res.status(400).json({
        message:
          "code, language and problemId are required",
      });
    }

    const problem =
      await Problem.findById(problemId);

    if (!problem) {
      return res.status(404).json({
        message:
          "Problem not found",
      });
    }

    const sampleCases = [
      {
        input:
          problem.sampleInput,
        output:
          problem.sampleOutput,
      },
    ];

    const result =
      await executeCode({
        code,
        language,
        testCases: sampleCases,
      });

    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| SUBMIT CODE
|--------------------------------------------------------------------------
*/

const submitCode = async (
  req,
  res,
  next
) => {
  try {
    const {
      code,
      language,
      problemId,
      battleId,
    } = req.body;

    if (
      !code ||
      !language ||
      !problemId ||
      !battleId
    ) {
      return res.status(400).json({
        message:
          "code, language, problemId and battleId are required",
      });
    }

    /*
     * --------------------------------------------------
     * LOAD PROBLEM + BATTLE
     * --------------------------------------------------
     */

    const [problem, battle] =
      await Promise.all([
        Problem.findById(problemId),
        Battle.findById(battleId),
      ]);

    if (!problem) {
      return res.status(404).json({
        message:
          "Problem not found",
      });
    }

    if (!battle) {
      return res.status(404).json({
        message:
          "Battle not found",
      });
    }

    /*
     * --------------------------------------------------
     * BATTLE STATUS
     * --------------------------------------------------
     */

    if (
      battle.status ===
      "finished"
    ) {
      return res.status(403).json({
        message:
          "Battle has ended. Submissions are closed.",
      });
    }

    if (
      battle.status !==
      "in-progress"
    ) {
      return res.status(403).json({
        message:
          "Battle has not started yet.",
      });
    }

    /*
     * --------------------------------------------------
     * TOTAL BATTLE TIMER
     * --------------------------------------------------
     */

    const totalDurationSeconds =
      getTotalBattleDurationSeconds(
        battle
      );

    const battleRemainingSeconds =
      getBattleRemainingSeconds(
        battle
      );

    /*
     * Battle has completely
     * expired.
     */

    if (
      battleRemainingSeconds <= 0
    ) {
      battle.status =
        "finished";

      battle.endTime =
        new Date();

      await battle.save();

      return res.status(403).json({
        message:
          "Total battle time is over. Submissions are closed.",

        timer: {
          totalDurationSeconds,
          remainingSeconds: 0,
          questionDurationSeconds:
            Number(
              battle.questionDurationSeconds
            ) ||
            DEFAULT_QUESTION_DURATION_SECONDS,
        },
      });
    }

    /*
     * --------------------------------------------------
     * CURRENT QUESTION CHECK
     * --------------------------------------------------
     *
     * Each question has its own 15-minute timer.
     *
     * The backend's playerProgress contains:
     *
     * currentQuestion
     * questionStartedAt
     *
     */

    const playerProgress =
      Array.isArray(
        battle.playerProgress
      )
        ? battle.playerProgress.find(
            (player) =>
              String(
                player.user
              ) ===
              String(
                req.userId
              )
          )
        : null;

    let questionRemainingSeconds =
      Number(
        battle.questionDurationSeconds
      ) ||
      DEFAULT_QUESTION_DURATION_SECONDS;

    let currentQuestion = 0;

    if (playerProgress) {
      currentQuestion =
        Number(
          playerProgress.currentQuestion
        ) || 0;

      if (
        playerProgress.questionStartedAt
      ) {
        const questionStart =
          new Date(
            playerProgress.questionStartedAt
          ).getTime();

        if (
          Number.isFinite(
            questionStart
          )
        ) {
          const questionElapsed =
            Math.floor(
              (Date.now() -
                questionStart) /
                1000
            );

          questionRemainingSeconds =
            Math.max(
              0,
              questionRemainingSeconds -
                questionElapsed
            );
        }
      }
    }

    /*
     * IMPORTANT:
     *
     * Do not reject the submission solely because
     * the question timer reached zero.
     *
     * Socket.IO is responsible for moving the
     * player to the next question.
     *
     * We still enforce the complete 75-minute
     * server-side battle timer above.
     */

    /*
     * --------------------------------------------------
     * EXECUTE CODE
     * --------------------------------------------------
     */

    const result =
      await executeCode({
        code,
        language,
        testCases:
          problem.testCases,
      });

    /*
     * --------------------------------------------------
     * SAVE SUBMISSION
     * --------------------------------------------------
     */

    const submission =
      await Submission.create({
        user:
          req.userId,

        battle:
          battleId,

        code,

        language,

        status:
          result.status,

        testCasesPassed:
          result.testCasesPassed,

        totalTestCases:
          result.totalTestCases,

        executionTime:
          result.executionTime,
      });

    /*
     * --------------------------------------------------
     * SCORING
     * --------------------------------------------------
     */

    let pointsAwarded = 0;
    let totalScore = 0;
    let alreadySolved = false;

    const isAccepted =
      String(
        result.status || ""
      )
        .trim()
        .toLowerCase() ===
      "accepted";

    if (isAccepted) {
      const points =
        getProblemPoints(
          problem.difficulty
        );

      /*
       * Find player score.
       */

      let playerScore =
        battle.scores.find(
          (score) =>
            String(
              score.user
            ) ===
            String(
              req.userId
            )
        );

      /*
       * Create score if missing.
       */

      if (!playerScore) {
        battle.scores.push({
          user:
            req.userId,

          points: 0,

          solvedProblems: [],
        });

        playerScore =
          battle.scores[
            battle.scores.length - 1
          ];
      }

      /*
       * Check duplicate solve.
       */

      alreadySolved =
        Array.isArray(
          playerScore.solvedProblems
        ) &&
        playerScore.solvedProblems.some(
          (solvedProblemId) =>
            String(
              solvedProblemId
            ) ===
            String(
              problemId
            )
        );

      /*
       * Award points once.
       */

      if (!alreadySolved) {
        playerScore.points =
          Number(
            playerScore.points
          ) + points;

        if (
          !Array.isArray(
            playerScore.solvedProblems
          )
        ) {
          playerScore.solvedProblems =
            [];
        }

        playerScore.solvedProblems.push(
          problemId
        );

        pointsAwarded =
          points;
      }
    }

    /*
     * --------------------------------------------------
     * SAVE BATTLE
     * --------------------------------------------------
     */

    await battle.save();

    /*
     * --------------------------------------------------
     * CURRENT PLAYER SCORE
     * --------------------------------------------------
     */

    const currentPlayerScore =
      battle.scores.find(
        (score) =>
          String(
            score.user
          ) ===
          String(
            req.userId
          )
      );

    totalScore =
      Number(
        currentPlayerScore?.points
      ) || 0;

    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return res.status(201).json({
      submission,

      results:
        result.results,

      simulated:
        result.simulated,

      scoring: {
        accepted:
          isAccepted,

        problemDifficulty:
          problem.difficulty ||
          "easy",

        pointsAwarded,

        totalScore,

        alreadySolved,
      },

      progress: {
        currentQuestion,
        questionNumber:
          currentQuestion + 1,

        totalQuestions:
          Array.isArray(
            battle.problems
          ) &&
          battle.problems.length > 0
            ? battle.problems.length
            : DEFAULT_TOTAL_QUESTIONS,

        questionRemainingSeconds,

        questionDurationSeconds:
          Number(
            battle.questionDurationSeconds
          ) ||
          DEFAULT_QUESTION_DURATION_SECONDS,
      },

      timer: {
        totalDurationSeconds,

        remainingSeconds:
          getBattleRemainingSeconds(
            battle
          ),

        questionDurationSeconds:
          Number(
            battle.questionDurationSeconds
          ) ||
          DEFAULT_QUESTION_DURATION_SECONDS,
      },
    });
  } catch (err) {
    next(err);
  }
};

/*
|--------------------------------------------------------------------------
| GET BATTLE SUBMISSIONS
|--------------------------------------------------------------------------
*/

const getBattleSubmissions =
  async (
    req,
    res,
    next
  ) => {
    try {
      const submissions =
        await Submission.find({
          battle:
            req.params.battleId,
        })
          .populate(
            "user",
            "name"
          )
          .select(
            "-code"
          )
          .sort({
            submittedAt: 1,
          });

      return res.json(
        submissions
      );
    } catch (err) {
      next(err);
    }
  };

module.exports = {
  runCode,
  submitCode,
  getBattleSubmissions,
};