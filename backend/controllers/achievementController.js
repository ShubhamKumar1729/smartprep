const Achievement = require("../models/Achievement");
const UserXP = require("../models/UserXP");
const { sendSuccess } = require("../utils/responseHelper");

const getAchievements = async (req, res, next) => {
  try {
    const achievements = await Achievement.find({ userId: req.user._id }).sort({ earnedAt: -1 });
    return sendSuccess(res, 200, "Achievements fetched", { achievements });
  } catch (error) {
    next(error);
  }
};

const getXP = async (req, res, next) => {
  try {
    let xp = await UserXP.findOne({ userId: req.user._id });
    if (!xp) xp = await UserXP.create({ userId: req.user._id, totalXP: 0, level: 1 });
    return sendSuccess(res, 200, "XP fetched", { xp });
  } catch (error) {
    next(error);
  }
};

const getLeaderboard = async (req, res, next) => {
  try {
    const leaderboard = await UserXP.find()
      .populate("userId", "name email")
      .sort({ totalXP: -1 })
      .limit(20);
    return sendSuccess(res, 200, "Leaderboard fetched", { leaderboard });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAchievements, getXP, getLeaderboard };