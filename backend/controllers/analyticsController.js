const analyticsService = require("../services/analyticsService");
const { sendSuccess } = require("../utils/responseHelper");

const getDashboard = async (req, res, next) => {
  try {
    const data = await analyticsService.generateAnalyticsSnapshot(req.user._id);
    return sendSuccess(res, 200, "Analytics fetched", data);
  } catch (error) {
    next(error);
  }
};

const getTopics = async (req, res, next) => {
  try {
    const topics = await analyticsService.calculateTopicPerformance(req.user._id);
    return sendSuccess(res, 200, "Topics fetched", topics);
  } catch (error) {
    next(error);
  }
};

const getReadiness = async (req, res, next) => {
  try {
    const readiness = await analyticsService.calculateReadinessScore(req.user._id);
    return sendSuccess(res, 200, "Readiness fetched", readiness);
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard, getTopics, getReadiness };