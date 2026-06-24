const Attempt = require("../models/Attempt");
const ProctoringEvent = require("../models/ProctoringEvent");
const RiskScore = require("../models/RiskScore");
const riskService = require("../services/riskService");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const startProctoring = async (req, res, next) => {
  try {
    const { attemptId, testId } = req.body;
    if (!attemptId || !testId) return sendError(res, 400, "Attempt ID and Test ID required");

    const attempt = await Attempt.findOne({ _id: attemptId, userId: req.user._id });
    if (!attempt) return sendError(res, 404, "Attempt not found");

    const risk = await riskService.initializeRiskScore({ userId: req.user._id, testId, attemptId });

    await ProctoringEvent.create({
      userId: req.user._id, testId, attemptId,
      eventType: "proctoring_started", severity: "info", riskDelta: 0,
      metadata: { userAgent: req.headers["user-agent"] },
    });

    return sendSuccess(res, 201, "Proctoring started", { risk });
  } catch (error) {
    next(error);
  }
};

const recordEvent = async (req, res, next) => {
  try {
    const { attemptId, testId, eventType, severity = "info", metadata = {} } = req.body;
    if (!attemptId || !testId || !eventType) return sendError(res, 400, "Required fields missing");

    const attempt = await Attempt.findOne({ _id: attemptId, userId: req.user._id });
    if (!attempt) return sendError(res, 404, "Attempt not found");

    const { risk, riskDelta } = await riskService.updateRiskScore({
      userId: req.user._id, testId, attemptId, eventType,
    });

    const event = await ProctoringEvent.create({
      userId: req.user._id, testId, attemptId,
      eventType, severity, riskDelta, metadata, timestamp: new Date(),
    });

    return sendSuccess(res, 201, "Event recorded", { event, risk });
  } catch (error) {
    next(error);
  }
};

const endProctoring = async (req, res, next) => {
  try {
    const { attemptId, testId } = req.body;
    if (!attemptId || !testId) return sendError(res, 400, "Required fields missing");

    await ProctoringEvent.create({
      userId: req.user._id, testId, attemptId,
      eventType: "proctoring_ended", severity: "info", riskDelta: 0,
    });

    const risk = await riskService.endRiskSession({ attemptId });
    return sendSuccess(res, 200, "Proctoring ended", { risk });
  } catch (error) {
    next(error);
  }
};

const getProctoringReport = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const attempt = await Attempt.findOne({ _id: attemptId, userId: req.user._id }).populate("testId", "title");
    if (!attempt) return sendError(res, 404, "Attempt not found");

    const events = await ProctoringEvent.find({ attemptId, userId: req.user._id }).sort({ timestamp: 1 });
    const risk = await RiskScore.findOne({ attemptId, userId: req.user._id });

    const summary = {};
    events.forEach((event) => {
      summary[event.eventType] = (summary[event.eventType] || 0) + 1;
    });

    return sendSuccess(res, 200, "Proctoring report", { attempt, events, risk, summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { startProctoring, recordEvent, endProctoring, getProctoringReport };