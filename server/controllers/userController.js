const User = require("../models/User");

const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    next(err);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const users = await User.find()
      .sort({ rating: -1 })
      .limit(50)
      .select("name rating wins losses");
    res.json(users);
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, getLeaderboard };
