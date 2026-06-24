const RiskScore = require("../models/RiskScore");

const riskRules = {
  face_missing: 10,
  multiple_faces: 20,
  tab_switch: 15,
  window_blur: 15,
  fullscreen_exit: 10,
  excessive_audio: 10,
  page_reload: 15,
};

const getRiskLevel = (score) => {
  if (score <= 20) return "low";
  if (score <= 50) return "medium";
  return "high";
};

const updateRiskScore = async ({ userId, testId, attemptId, eventType }) => {
  const riskDelta = riskRules[eventType] || 0;
  let risk = await RiskScore.findOne({ attemptId });

  if (!risk) {
    risk = await RiskScore.create({
      userId, testId, attemptId,
      riskScore: 0, riskLevel: "low",
    });
  }

  risk.riskScore += riskDelta;
  risk.riskLevel = getRiskLevel(risk.riskScore);

  if (risk.eventCounts && risk.eventCounts[eventType] !== undefined) {
    risk.eventCounts[eventType] += 1;
  }

  await risk.save();
  return { risk, riskDelta };
};

const initializeRiskScore = async ({ userId, testId, attemptId }) => {
  let risk = await RiskScore.findOne({ attemptId });
  if (!risk) {
    risk = await RiskScore.create({
      userId, testId, attemptId,
      riskScore: 0, riskLevel: "low", startedAt: new Date(),
    });
  }
  return risk;
};

const endRiskSession = async ({ attemptId }) => {
  return await RiskScore.findOneAndUpdate(
    { attemptId },
    { endedAt: new Date() },
    { new: true }
  );
};

module.exports = { riskRules, getRiskLevel, updateRiskScore, initializeRiskScore, endRiskSession };