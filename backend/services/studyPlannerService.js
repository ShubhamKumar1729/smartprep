const StudyPlan = require("../models/StudyPlan");
const analyticsService = require("./analyticsService");

const generateStudyPlan = async ({ userId, target = "Upcoming Exam", duration = 7, hoursPerDay = 2 }) => {
  const { topics } = await analyticsService.generateAnalyticsSnapshot(userId);

  let priorityTopics = [];

  if (topics.weakTopics.length > 0) {
    priorityTopics = topics.weakTopics.map((t) => ({ topic: t.topic, priority: "high" }));
  } else if (topics.topicPerformance.length > 0) {
    priorityTopics = topics.topicPerformance.slice(0, 5).map((t) => ({ topic: t.topic, priority: "medium" }));
  } else {
    priorityTopics = [
      { topic: "Revise uploaded notes", priority: "medium" },
      { topic: "Practice generated MCQs", priority: "medium" },
      { topic: "Review flashcards", priority: "medium" },
    ];
  }

  const plan = [];
  for (let day = 1; day <= duration; day++) {
    const topic = priorityTopics[(day - 1) % priorityTopics.length];
    let title = `Day ${day}: ${topic.topic}`;
    if (day === duration - 1) title = `Day ${day}: Mock Test Practice`;
    if (day === duration) title = `Day ${day}: Final Revision`;

    const tasks =
      day === duration
        ? ["Revise all weak topics.", "Review flashcards.", "Go through wrong answers.", "Take a revision quiz."]
        : day === duration - 1
        ? ["Attempt a full mock test.", "Analyze mistakes.", "Revise incorrect answers."]
        : [`Study ${topic.topic}.`, "Read generated notes.", "Practice 10-20 MCQs.", "Review flashcards."];

    plan.push({ day, title, topics: [topic.topic], tasks });
  }

  return await StudyPlan.create({ userId, target, duration, hoursPerDay, topics: priorityTopics, plan, generatedDate: new Date() });
};

module.exports = { generateStudyPlan };