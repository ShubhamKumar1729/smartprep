const ExamEnvironmentCheck = require("../models/ExamEnvironmentCheck");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const saveCheck = async (req, res, next) => {
  try {
    const { testId, attemptId, cameraStatus, microphoneStatus, faceStatus, singleFaceStatus, fullscreenStatus, permissionStatus } = req.body;
    if (!testId) return sendError(res, 400, "Test ID is required");

    const allPassed =
      cameraStatus === "passed" && microphoneStatus === "passed" &&
      faceStatus === "passed" && singleFaceStatus === "passed" &&
      fullscreenStatus === "passed" && permissionStatus === "passed";

    const check = await ExamEnvironmentCheck.create({
      userId: req.user._id, testId, attemptId: attemptId || null,
      cameraStatus: cameraStatus || "pending",
      microphoneStatus: microphoneStatus || "pending",
      faceStatus: faceStatus || "pending",
      singleFaceStatus: singleFaceStatus || "pending",
      fullscreenStatus: fullscreenStatus || "pending",
      permissionStatus: permissionStatus || "pending",
      allPassed, verifiedAt: new Date(),
    });

    return sendSuccess(res, 201, "Check saved", { check });
  } catch (error) {
    next(error);
  }
};

const getCheck = async (req, res, next) => {
  try {
    const check = await ExamEnvironmentCheck.findOne({
      testId: req.params.testId,
      userId: req.user._id,
    }).sort({ createdAt: -1 });
    return sendSuccess(res, 200, "Check fetched", { check });
  } catch (error) {
    next(error);
  }
};

module.exports = { saveCheck, getCheck };