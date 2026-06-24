const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const Response = require("../models/Response");
const TestQuestion = require("../models/TestQuestion");
const testService = require("../services/testService");
const evaluationService = require("../services/evaluationService");
const gamificationService = require("../services/gamificationService");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHelper");

const startTest = async (req, res, next) => {
  try {
    const { testId } = req.body;
    if (!testId) return sendError(res, 400, "Test ID is required");

    const test = await Test.findById(testId);
    if (!test) return sendError(res, 404, "Test not found");
    if (!test.isActive) return sendError(res, 400, "This test is not active");

    const existingAttempt = await Attempt.findOne({ userId: req.user._id, testId, status: "started" });

    if (existingAttempt) {
      const questions = await testService.getTestQuestions(testId);
      const sanitized = questions.map((q) => ({
        _id: q._id, question: q.question, questionType: q.questionType,
        difficulty: q.difficulty, options: q.options, order: q.order,
      }));
      const savedResponses = await Response.find({ attemptId: existingAttempt._id });
      return sendSuccess(res, 200, "Resuming attempt", {
        attempt: existingAttempt, test, questions: sanitized, savedResponses, isResumed: true,
      });
    }

    const attempt = await Attempt.create({ userId: req.user._id, testId, status: "started", startedAt: new Date() });
    await Test.findByIdAndUpdate(testId, { $inc: { totalAttempts: 1 } });

    const questions = await testService.getTestQuestions(testId);
    const sanitized = questions.map((q) => ({
      _id: q._id, question: q.question, questionType: q.questionType,
      difficulty: q.difficulty, options: q.options, order: q.order,
    }));

    return sendSuccess(res, 201, "Test started", {
      attempt, test, questions: sanitized, savedResponses: [], isResumed: false,
    });
  } catch (error) {
    next(error);
  }
};

const saveAnswer = async (req, res, next) => {
  try {
    const { attemptId, questionId, selectedAnswer, isMarkedForReview } = req.body;
    const attempt = await Attempt.findOne({ _id: attemptId, userId: req.user._id, status: "started" });
    if (!attempt) return sendError(res, 404, "Active attempt not found");

    await Response.findOneAndUpdate(
      { attemptId, questionId },
      { attemptId, questionId, selectedAnswer: selectedAnswer || "", isSkipped: !selectedAnswer, isMarkedForReview: isMarkedForReview || false },
      { upsert: true, new: true }
    );

    return sendSuccess(res, 200, "Answer saved");
  } catch (error) {
    next(error);
  }
};

const submitTest = async (req, res, next) => {
  try {
    const { attemptId, timeTaken, responses: submittedResponses } = req.body;
    if (!attemptId) return sendError(res, 400, "Attempt ID is required");

    const attempt = await Attempt.findOne({ _id: attemptId, userId: req.user._id });
    if (!attempt) return sendError(res, 404, "Attempt not found");
    if (attempt.status === "submitted") return sendError(res, 400, "Already submitted");

    const testQuestions = await TestQuestion.find({ testId: attempt.testId }).populate("questionId");
    const totalQuestions = testQuestions.length;
    const evaluatedResponses = [];

    for (const tq of testQuestions) {
      const question = tq.questionId;
      const submitted = submittedResponses?.find((r) => r.questionId === question._id.toString());
      const selectedAnswer = submitted?.selectedAnswer || "";
      const evaluation = evaluationService.evaluateAnswer(question, selectedAnswer);

      await Response.findOneAndUpdate(
        { attemptId, questionId: question._id },
        { attemptId, questionId: question._id, selectedAnswer, isCorrect: evaluation.isCorrect, isSkipped: evaluation.isSkipped },
        { upsert: true, new: true }
      );

      evaluatedResponses.push({ questionId: question._id, isCorrect: evaluation.isCorrect, isSkipped: evaluation.isSkipped });
    }

    const result = evaluationService.calculateResult(evaluatedResponses, totalQuestions);

    const updatedAttempt = await Attempt.findByIdAndUpdate(
      attemptId,
      {
        status: "submitted", score: result.score, percentage: result.percentage,
        correctAnswers: result.correctAnswers, wrongAnswers: result.wrongAnswers,
        skippedAnswers: result.skippedAnswers, timeTaken: timeTaken || 0, submittedAt: new Date(),
      },
      { new: true }
    );

    await gamificationService.processAttemptAchievements(req.user._id, updatedAttempt);

    return sendSuccess(res, 200, "Test submitted", { attempt: updatedAttempt, result });
  } catch (error) {
    next(error);
  }
};

const getResult = async (req, res, next) => {
  try {
    const attempt = await Attempt.findOne({ _id: req.params.attemptId, userId: req.user._id })
      .populate("testId");
    if (!attempt) return sendError(res, 404, "Attempt not found");
    if (attempt.status !== "submitted") return sendError(res, 400, "Not yet submitted");

    const responses = await Response.find({ attemptId: attempt._id }).populate("questionId");
    const reviewData = responses.map((r) => ({
      question: r.questionId?.question,
      questionType: r.questionId?.questionType,
      options: r.questionId?.options,
      selectedAnswer: r.selectedAnswer,
      correctAnswer: r.questionId?.answer,
      explanation: r.questionId?.explanation,
      isCorrect: r.isCorrect,
      isSkipped: r.isSkipped,
    }));

    const grade =
      attempt.percentage >= 90 ? "A+" :
      attempt.percentage >= 80 ? "A" :
      attempt.percentage >= 70 ? "B" :
      attempt.percentage >= 60 ? "C" :
      attempt.percentage >= 50 ? "D" : "F";

    const remark =
      attempt.percentage >= 90 ? "Excellent!" :
      attempt.percentage >= 80 ? "Great job!" :
      attempt.percentage >= 70 ? "Good performance!" :
      attempt.percentage >= 60 ? "Average. Keep practicing!" : "Needs more practice.";

    return sendSuccess(res, 200, "Result fetched", {
      attempt,
      result: {
        score: attempt.score, percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers, wrongAnswers: attempt.wrongAnswers,
        skippedAnswers: attempt.skippedAnswers,
        totalQuestions: attempt.testId?.questionCount,
        timeTaken: attempt.timeTaken, grade, remark,
      },
      reviewData,
    });
  } catch (error) {
    next(error);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [attempts, total] = await Promise.all([
      Attempt.find({ userId: req.user._id, status: "submitted" })
        .populate("testId", "title duration questionCount")
        .sort({ submittedAt: -1 }).skip(skip).limit(limitNum).lean(),
      Attempt.countDocuments({ userId: req.user._id, status: "submitted" }),
    ]);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    };

    return sendPaginated(res, attempts, pagination, "History fetched");
  } catch (error) {
    next(error);
  }
};

module.exports = { startTest, saveAnswer, submitTest, getResult, getHistory };