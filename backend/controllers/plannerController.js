const StudyPlan = require("../models/StudyPlan");
const studyPlannerService = require("../services/studyPlannerService");
const { sendSuccess } = require("../utils/responseHelper");

const generatePlan = async (req, res, next) => {
  try {
    const { target = "Upcoming Exam", duration = 7, hoursPerDay = 2 } = req.query;
    const studyPlan = await studyPlannerService.generateStudyPlan({
      userId: req.user._id,
      target,
      duration: parseInt(duration),
      hoursPerDay: parseInt(hoursPerDay),
    });
    return sendSuccess(res, 201, "Study plan generated", { studyPlan });
  } catch (error) {
    next(error);
  }
};

const getPlans = async (req, res, next) => {
  try {
    const plans = await StudyPlan.find({ userId: req.user._id }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Plans fetched", { plans });
  } catch (error) {
    next(error);
  }
};

module.exports = { generatePlan, getPlans };