const Attempt = require("../models/Attempt");
const Response = require("../models/Response");
const ExtractedContent = require("../models/ExtractedContent");
const Analytics = require("../models/Analytics");

const calculateBasicStats = async (userId) => {
  const attempts = await Attempt.find({ userId, status: "submitted" }).sort({ submittedAt: 1 });

  if (attempts.length === 0) {
    return { attempts: [], averageScore: 0, highestScore: 0, lowestScore: 0, totalTestsTaken: 0, averageAccuracy: 0, averageTimeTaken: 0, scoreTrend: [], accuracyTrend: [] };
  }

  const percentages = attempts.map((a) => a.percentage);
  const averageScore = Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length);
  const averageTimeTaken = Math.round(attempts.reduce((sum, a) => sum + (a.timeTaken || 0), 0) / attempts.length);

  const scoreTrend = attempts.map((a, index) => ({
    attempt: index + 1, score: a.percentage, date: a.submittedAt,
  }));

  return {
    attempts, averageScore,
    highestScore: Math.max(...percentages),
    lowestScore: Math.min(...percentages),
    totalTestsTaken: attempts.length,
    averageAccuracy: averageScore,
    averageTimeTaken,
    scoreTrend,
  };
};

const detectTopicFromQuestion = async (question) => {
  try {
    if (!question?.fileId) return "General";
    const extracted = await ExtractedContent.findOne({ fileId: question.fileId });
    if (!extracted) return "General";

    const text = `${question.question} ${question.answer || ""}`.toLowerCase();

    for (const topic of extracted.topics || []) {
      if (topic.title && text.includes(topic.title.toLowerCase())) return topic.title;
    }

    for (const keyword of extracted.keywords || []) {
      if (keyword && text.includes(keyword.toLowerCase())) return keyword;
    }

    if (extracted.topics?.length > 0) return extracted.topics[0].title;
    if (extracted.keywords?.length > 0) return extracted.keywords[0];
    return "General";
  } catch {
    return "General";
  }
};

const calculateTopicPerformance = async (userId) => {
  const attempts = await Attempt.find({ userId, status: "submitted" });
  const topicMap = {};

  for (const attempt of attempts) {
    const responses = await Response.find({ attemptId: attempt._id }).populate("questionId");
    for (const response of responses) {
      const question = response.questionId;
      if (!question) continue;
      const topic = await detectTopicFromQuestion(question);
      if (!topicMap[topic]) topicMap[topic] = { topic, total: 0, correct: 0 };
      topicMap[topic].total += 1;
      if (response.isCorrect) topicMap[topic].correct += 1;
    }
  }

  const topicPerformance = Object.values(topicMap).map((item) => ({
    topic: item.topic, total: item.total, correct: item.correct,
    accuracy: Math.round((item.correct / item.total) * 100),
  }));

  const weakTopics = topicPerformance
    .filter((t) => t.accuracy < 60)
    .sort((a, b) => a.accuracy - b.accuracy)
    .map((t) => ({ topic: t.topic, accuracy: t.accuracy }));

  const strongTopics = topicPerformance
    .filter((t) => t.accuracy >= 85)
    .sort((a, b) => b.accuracy - a.accuracy)
    .map((t) => ({ topic: t.topic, accuracy: t.accuracy }));

  return { topicPerformance, weakTopics, strongTopics };
};

const calculateReadinessScore = async (userId) => {
  const basic = await calculateBasicStats(userId);
  const topics = await calculateTopicPerformance(userId);

  if (basic.totalTestsTaken === 0) {
    return { readinessScore: 0, readinessStatus: "poor", recommendation: "Take at least one test." };
  }

  let score = basic.averageScore;
  score -= Math.min(topics.weakTopics.length * 5, 25);
  score += Math.min(topics.strongTopics.length * 3, 15);
  if (basic.totalTestsTaken >= 5) score += 5;
  if (basic.totalTestsTaken >= 10) score += 5;
  score = Math.max(0, Math.min(100, Math.round(score)));

  let status = "poor";
  if (score >= 85) status = "excellent";
  else if (score >= 70) status = "good";
  else if (score >= 50) status = "average";

  let recommendation = "Keep practicing regularly.";
  if (topics.weakTopics.length > 0) {
    recommendation = `Revise ${topics.weakTopics.slice(0, 3).map((t) => t.topic).join(", ")}.`;
  } else if (score >= 85) {
    recommendation = "You are exam ready!";
  }

  return { readinessScore: score, readinessStatus: status, recommendation };
};

const generateAnalyticsSnapshot = async (userId) => {
  const basic = await calculateBasicStats(userId);
  const topics = await calculateTopicPerformance(userId);
  const readiness = await calculateReadinessScore(userId);

  await Analytics.findOneAndUpdate(
    { userId },
    {
      userId,
      averageScore: basic.averageScore,
      highestScore: basic.highestScore,
      lowestScore: basic.lowestScore,
      totalTestsTaken: basic.totalTestsTaken,
      averageAccuracy: basic.averageAccuracy,
      averageTimeTaken: basic.averageTimeTaken,
      weakTopics: topics.weakTopics,
      strongTopics: topics.strongTopics,
      topicPerformance: topics.topicPerformance,
      readinessScore: readiness.readinessScore,
      readinessStatus: readiness.readinessStatus,
      lastCalculatedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return { basic, topics, readiness };
};

module.exports = { calculateBasicStats, calculateTopicPerformance, calculateReadinessScore, generateAnalyticsSnapshot };