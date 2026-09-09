const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
      minlength: 6,
    },

    rating: {
      type: Number,
      default: 1200,
    },

    wins: {
      type: Number,
      default: 0,
    },

    losses: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ============================================================
// PASSWORD HASHING
// ============================================================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) {
    return;
  }

  this.password = await bcrypt.hash(this.password, 10);
});


// ============================================================
// PASSWORD COMPARISON
// ============================================================

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};


// ============================================================
// SAFE USER OBJECT
// ============================================================

userSchema.methods.toSafeObject = function () {
  const {
    _id,
    name,
    email,
    rating,
    wins,
    losses,
    createdAt,
  } = this;

  return {
    id: _id,
    name,
    email,
    rating,
    wins,
    losses,
    createdAt,
  };
};


module.exports = mongoose.model("User", userSchema);