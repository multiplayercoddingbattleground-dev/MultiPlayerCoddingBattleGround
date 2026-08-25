const mongoose = require("mongoose");

const battleSchema = new mongoose.Schema(
  {
    roomCode: { type: String, required: true, unique: true },
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    problem: { type: mongoose.Schema.Types.ObjectId, ref: "Problem" },
    status: {
      type: String,
      enum: ["waiting", "in-progress", "finished"],
      default: "waiting",
    },
    startTime: { type: Date },
    endTime: { type: Date },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Battle", battleSchema);
