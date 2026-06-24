const nlpService = require("./nlpService");

const generateShortSummary = (text, topics, keywords) => {
  try {
    if (!text || text.length < 50) return "Insufficient content.";
    const sentences = nlpService.extractImportantSentences(text, 5);
    if (sentences.length === 0) {
      return text.split(" ").slice(0, 150).join(" ") + "...";
    }
    let summary = sentences.join(". ");
    const words = summary.split(" ");
    if (words.length > 200) summary = words.slice(0, 200).join(" ") + "...";
    return summary;
  } catch {
    return "Failed to generate summary.";
  }
};

const generateDetailedSummary = (text, topics, keywords) => {
  try {
    if (!text || text.length < 100) return "Insufficient content.";
    const sentences = nlpService.extractImportantSentences(text, 20);
    const definitions = nlpService.extractDefinitions(text);
    let summary = "";

    if (topics.length > 0) {
      summary += `This document covers: ${topics
        .slice(0, 5)
        .map((t) => t.title)
        .join(", ")}.\n\n`;
    }

    if (sentences.length > 0) {
      summary += sentences.join(". ") + ".\n\n";
    }

    if (definitions.length > 0) {
      summary += "Key Definitions:\n";
      definitions.slice(0, 5).forEach((def) => {
        summary += `${def.term}: ${def.definition}.\n`;
      });
    }

    if (keywords.length > 0) {
      summary += `\nKey concepts: ${keywords.slice(0, 10).join(", ")}.`;
    }

    const words = summary.split(" ");
    if (words.length > 1000) summary = words.slice(0, 1000).join(" ") + "...";
    return summary || "Unable to generate summary.";
  } catch {
    return "Failed to generate summary.";
  }
};

const generateChapterSummary = (text, topics) => {
  try {
    if (!topics || topics.length === 0) return [];
    return topics.slice(0, 10).map((topic) => {
      const sentences = (topic.content || "")
        .split(/[.!?]+/)
        .filter((s) => s.trim().length > 20)
        .slice(0, 5);
      return {
        title: topic.title,
        summary:
          sentences.length > 0
            ? sentences.join(". ") + "."
            : (topic.content || "").substring(0, 200) + "...",
      };
    });
  } catch {
    return [];
  }
};

const generateTopicSummary = (text, topics, keywords) => {
  try {
    if (!topics || topics.length === 0) return [];
    return topics.slice(0, 15).map((topic) => ({
      title: topic.title,
      summary: topic.content
        ? topic.content.substring(0, 300) + "..."
        : `This section covers ${topic.title}.`,
    }));
  } catch {
    return [];
  }
};

module.exports = {
  generateShortSummary,
  generateDetailedSummary,
  generateChapterSummary,
  generateTopicSummary,
};