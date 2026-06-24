const nlpService = require("./nlpService");

const generateQuickNotes = (text, keywords, definitions) => {
  try {
    if (!text || text.length < 50) return { content: "", bulletPoints: [] };
    const sentences = nlpService.extractImportantSentences(text, 15);
    const bulletPoints = [];

    sentences.forEach((sentence) => {
      if (sentence.length > 20 && sentence.length < 200) {
        bulletPoints.push(sentence.trim());
      }
    });

    definitions.slice(0, 5).forEach((def) => {
      bulletPoints.push(`${def.term}: ${def.definition}`);
    });

    return { content: bulletPoints.map((p) => `• ${p}`).join("\n"), bulletPoints };
  } catch {
    return { content: "", bulletPoints: [] };
  }
};

const generateDetailedNotes = (text, topics, definitions, keywords) => {
  try {
    if (!text) return { content: "", bulletPoints: [] };
    let content = "";
    const bulletPoints = [];

    if (topics.length > 0) {
      topics.slice(0, 10).forEach((topic) => {
        content += `\n## ${topic.title}\n`;
        if (topic.content) {
          content += topic.content + "\n";
          bulletPoints.push(`${topic.title}: ${topic.content.substring(0, 100)}`);
        }
      });
    }

    if (definitions.length > 0) {
      content += "\n## Key Definitions\n";
      definitions.forEach((def) => {
        content += `• **${def.term}**: ${def.definition}\n`;
        bulletPoints.push(`${def.term}: ${def.definition}`);
      });
    }

    if (keywords.length > 0) {
      content += "\n## Important Keywords\n";
      content += keywords.slice(0, 15).join(", ");
    }

    return { content, bulletPoints };
  } catch {
    return { content: "", bulletPoints: [] };
  }
};

const generateRevisionNotes = (text, keywords, topics) => {
  try {
    if (!text) return { content: "", bulletPoints: [] };
    const bulletPoints = [];

    if (keywords.length > 0) {
      bulletPoints.push(`Key Terms: ${keywords.slice(0, 8).join(", ")}`);
    }

    if (topics.length > 0) {
      topics.slice(0, 8).forEach((topic) => bulletPoints.push(topic.title));
    }

    const sentences = nlpService.extractImportantSentences(text, 5);
    sentences.forEach((s) => { if (s.length < 100) bulletPoints.push(s); });

    return {
      content: bulletPoints.map((p) => `• ${p}`).join("\n"),
      bulletPoints,
    };
  } catch {
    return { content: "", bulletPoints: [] };
  }
};

const generateFormulaSheet = (text) => {
  try {
    const formulas = nlpService.extractFormulas(text);
    const bulletPoints = formulas.map((f) => f.formula);
    return {
      content: formulas.map((f) => `• ${f.formula}`).join("\n"),
      formulas,
      bulletPoints,
    };
  } catch {
    return { content: "", formulas: [], bulletPoints: [] };
  }
};

module.exports = {
  generateQuickNotes,
  generateDetailedNotes,
  generateRevisionNotes,
  generateFormulaSheet,
};