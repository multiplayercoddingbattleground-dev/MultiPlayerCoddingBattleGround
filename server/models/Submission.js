const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    battle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Battle",
      required: true,
    },

    code: {
      type: String,
      required: true,
    },

    language: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    status: {
      type: String,
      enum: [
        "accepted",
        "wrong_answer",
        "runtime_error",
        "compile_error",
        "time_limit_exceeded",
        "pending",
        "failed",
      ],
      default: "pending",
    },

    testCasesPassed: {
      type: Number,
      default: 0,
      min: 0,
    },

    totalTestCases: {
      type: Number,
      default: 0,
      min: 0,
    },

    executionTime: {
      type: Number,
      default: 0,
      min: 0,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Submission",
  submissionSchema
);
