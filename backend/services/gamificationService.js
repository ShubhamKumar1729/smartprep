const Achievement = require("../models/Achievement");
const UserXP = require("../models/UserXP");
const Attempt = require("../models/Attempt");

const calculateLevel = (xp) => Math.floor(xp / 500) + 1;

const addXP = async (userId, xp) => {
  let userXP = await UserXP.findOne({ userId });
  if (!userXP) {
    userXP = await UserXP.create({ userId, totalXP: 0, level: 1 });
  }
  userXP.totalXP += xp;
  userXP.level = calculateLevel(userXP.totalXP);
  userXP.lastActivityDate = new Date();
  await userXP.save();
  return userXP;
};

const awardAchievement = async ({ userId, badge, description, xp }) => {
  try {
    const existing = await Achievement.findOne({ userId, badge });
    if (existing) return existing;

    const achievement = await Achievement.create({ userId, badge, description, xp, earnedAt: new Date() });
    await addXP(userId, xp);
    return achievement;
  } catch {
    return null;
  }
};

const updateStreak = async (userId) => {
  let userXP = await UserXP.findOne({ userId });
  if (!userXP) userXP = await UserXP.create({ userId });

  const attempts = await Attempt.find({ userId, status: "submitted" }).sort({ submittedAt: -1 });
  const uniqueDates = [...new Set(attempts.map((a) => new Date(a.submittedAt).toISOString().slice(0, 10)))];

  let streak = 0;
  const today = new Date();
  for (let i = 0; i < uniqueDates.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    if (uniqueDates.includes(expected.toISOString().slice(0, 10))) streak++;
    else break;
  }

  userXP.currentStreak = streak;
  userXP.longestStreak = Math.max(userXP.longestStreak, streak);
  await userXP.save();

  if (streak >= 7) {
    await awardAchievement({ userId, badge: "7 Day Study Streak", description: "7 days in a row!", xp: 150 });
  }

  return userXP;
};

const processAttemptAchievements = async (userId, attempt) => {
  await addXP(userId, 20);
  const totalAttempts = await Attempt.countDocuments({ userId, status: "submitted" });

  if (totalAttempts === 1) {
    await awardAchievement({ userId, badge: "First Test Completed", description: "Completed first test.", xp: 100 });
  }
  if (totalAttempts >= 10) {
    await awardAchievement({ userId, badge: "10 Tests Completed", description: "Completed 10 tests.", xp: 250 });
  }
  if (attempt.percentage >= 90) {
    await awardAchievement({ userId, badge: "90% Score Achieved", description: "Scored 90%+.", xp: 200 });
  }
  if (attempt.percentage === 100) {
    await awardAchievement({ userId, badge: "Perfect Score", description: "Scored 100%!", xp: 300 });
  }

  await updateStreak(userId);
};

module.exports = { addXP, awardAchievement, updateStreak, processAttemptAchievements };