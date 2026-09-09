const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema(
  {
    roomCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    players: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    problems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Problem",
      },
    ],

    status: {
      type: String,
      enum: ["waiting", "in-progress", "finished"],
      default: "waiting",
    },

    /*
     * Battle timing
     *
     * Each question gets 15 minutes.
     *
     * 5 questions × 15 minutes = 75 minutes maximum.
     */

    questionDurationSeconds: {
      type: Number,
      default: 900,
      min: 1,
    },

    totalDurationSeconds: {
      type: Number,
      default: 4500,
      min: 1,
    },

    startTime: {
      type: Date,
      default: null,
    },

    endTime: {
      type: Date,
      default: null,
    },

    /*
     * Individual player progress.
     *
     * Each player has their own current question
     * and question timer.
     */

    playerProgress: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        currentQuestion: {
          type: Number,
          default: 0,
          min: 0,
        },

        questionStartedAt: {
          type: Date,
          default: null,
        },

        finished: {
          type: Boolean,
          default: false,
        },
      },
    ],

    /*
     * Scoring
     */

    scores: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },

        points: {
          type: Number,
          default: 0,
          min: 0,
        },

        solvedProblems: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Problem",
          },
        ],
      },
    ],

    winner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Battle", battleSchema);