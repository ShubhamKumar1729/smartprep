const Test = require("../models/Test");
const TestQuestion = require("../models/TestQuestion");
const Attempt = require("../models/Attempt");
const testService = require("../services/testService");
const { sendSuccess, sendError, sendPaginated } = require("../utils/responseHelper");

const getTests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search = "", sort = "-createdAt" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = { userId: req.user._id };
    if (search) query.title = { $regex: search, $options: "i" };

    const [tests, total] = await Promise.all([
      Test.find(query)
        .populate("collectionId", "title")
        .populate("fileId", "originalName")
        .sort(sort).skip(skip).limit(limitNum).lean(),
      Test.countDocuments(query),
    ]);

    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(total / limitNum),
      totalItems: total,
      hasNextPage: pageNum < Math.ceil(total / limitNum),
      hasPrevPage: pageNum > 1,
    };

    return sendPaginated(res, tests, pagination, "Tests fetched");
  } catch (error) {
    next(error);
  }
};

const getTest = async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, userId: req.user._id })
      .populate("collectionId", "title")
      .populate("fileId", "originalName");
    if (!test) return sendError(res, 404, "Test not found");

    const attemptCount = await Attempt.countDocuments({ testId: test._id, userId: req.user._id });
    return sendSuccess(res, 200, "Test fetched", { test: { ...test.toObject(), attemptCount } });
  } catch (error) {
    next(error);
  }
};

const deleteTest = async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.params.id, userId: req.user._id });
    if (!test) return sendError(res, 404, "Test not found");

    await TestQuestion.deleteMany({ testId: test._id });
    await test.deleteOne();
    return sendSuccess(res, 200, "Test deleted");
  } catch (error) {
    next(error);
  }
};

const getTestQuestions = async (req, res, next) => {
  try {
    const test = await Test.findOne({ _id: req.params.testId, userId: req.user._id });
    if (!test) return sendError(res, 404, "Test not found");

    const questions = await testService.getTestQuestions(req.params.testId);
    const sanitized = questions.map((q) => ({
      _id: q._id, question: q.question,
      questionType: q.questionType, difficulty: q.difficulty,
      options: q.options, order: q.order,
    }));

    return sendSuccess(res, 200, "Questions fetched", { questions: sanitized, total: sanitized.length });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTests, getTest, deleteTest, getTestQuestions };