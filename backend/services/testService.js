const Question = require("../models/Question");
const TestQuestion = require("../models/TestQuestion");

const getTestQuestions = async (testId) => {
  try {
    const testQuestions = await TestQuestion.find({ testId })
      .sort({ order: 1 })
      .populate("questionId");

    return testQuestions.map((tq) => ({
      order: tq.order,
      ...tq.questionId.toObject(),
    }));
  } catch (error) {
    throw error;
  }
};

const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

module.exports = { getTestQuestions, shuffleArray };