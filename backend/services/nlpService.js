const natural = require("natural");

const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;

const extractKeywords = (text, topN = 20) => {
  try {
    if (!text || text.length < 10) return [];
    const tfidf = new TfIdf();
    tfidf.addDocument(text);
    const keywords = [];
    tfidf.listTerms(0).forEach((item) => {
      if (item.term.length > 3 && !isStopWord(item.term) && item.tfidf > 0.1) {
        keywords.push(item.term);
      }
    });
    return keywords.slice(0, topN);
  } catch {
    return [];
  }
};

const extractTopics = (text) => {
  try {
    if (!text) return [];
    const lines = text.split("\n");
    const topics = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (
        trimmed.length > 3 &&
        trimmed.length < 100 &&
        trimmed === trimmed.charAt(0).toUpperCase() + trimmed.slice(1) &&
        !trimmed.endsWith(".") &&
        !trimmed.endsWith(",")
      ) {
        const contentLines = [];
        for (let i = index + 1; i < Math.min(index + 10, lines.length); i++) {
          if (lines[i].trim().length > 0) contentLines.push(lines[i].trim());
        }
        if (contentLines.length > 0) {
          topics.push({
            title: trimmed,
            content: contentLines.join(" ").substring(0, 500),
          });
        }
      }
    });
    return topics.slice(0, 20);
  } catch {
    return [];
  }
};

const extractDefinitions = (text) => {
  try {
    if (!text) return [];
    const definitions = [];
    const sentences = text.split(/[.!?]+/);
    const patterns = [
      /^(.+?)\s+is\s+(?:a|an|the)?\s+(.+)$/i,
      /^(.+?)\s+refers to\s+(.+)$/i,
      /^(.+?)\s+means\s+(.+)$/i,
      /^(.+?)\s+is defined as\s+(.+)$/i,
    ];

    sentences.forEach((sentence) => {
      const trimmed = sentence.trim();
      if (trimmed.length < 20 || trimmed.length > 300) return;
      patterns.forEach((pattern) => {
        const match = trimmed.match(pattern);
        if (match && match[1] && match[2]) {
          const term = match[1].trim();
          const definition = match[2].trim();
          if (term.length < 50 && definition.length > 10) {
            definitions.push({ term, definition });
          }
        }
      });
    });

    return definitions
      .filter((def, index, self) =>
        index === self.findIndex((d) => d.term === def.term)
      )
      .slice(0, 20);
  } catch {
    return [];
  }
};

const extractImportantSentences = (text, topN = 10) => {
  try {
    if (!text) return [];
    const sentences = text
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20 && s.length < 300);
    if (sentences.length === 0) return [];

    const keywords = extractKeywords(text, 30);
    const scored = sentences.map((sentence) => {
      let score = 0;
      const words = tokenizer.tokenize(sentence.toLowerCase());
      words.forEach((word) => {
        if (keywords.includes(word)) score += 2;
        if (word.length > 6) score += 0.5;
      });
      if (/\d+/.test(sentence)) score += 1;
      if (/important|key|main|primary|essential/i.test(sentence)) score += 2;
      return { sentence, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topN)
      .map((item) => item.sentence);
  } catch {
    return [];
  }
};

const extractFormulas = (text) => {
  try {
    if (!text) return [];
    const formulas = [];
    const lines = text.split("\n");
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (
        /[=+\-*/^()]+/.test(trimmed) &&
        trimmed.length < 200 &&
        /[A-Za-z]/.test(trimmed) &&
        /[\d=]/.test(trimmed)
      ) {
        formulas.push({ formula: trimmed, description: "" });
      }
    });
    return formulas.slice(0, 20);
  } catch {
    return [];
  }
};

const extractHeadings = (text) => {
  try {
    if (!text) return [];
    const lines = text.split("\n");
    const headings = [];
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (
        trimmed.length > 3 &&
        trimmed.length < 80 &&
        trimmed === trimmed.charAt(0).toUpperCase() + trimmed.slice(1) &&
        !trimmed.endsWith(".") &&
        trimmed.split(" ").length < 10
      ) {
        headings.push(trimmed);
      }
    });
    return [...new Set(headings)].slice(0, 30);
  } catch {
    return [];
  }
};

const getTextStats = (text) => {
  if (!text) return { wordCount: 0, sentences: 0, paragraphs: 0 };
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);
  return {
    wordCount: words.length,
    sentences: sentences.length,
    paragraphs: paragraphs.length,
  };
};

const isStopWord = (word) => {
  const stopWords = [
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
    "for", "of", "with", "by", "from", "is", "are", "was", "were",
    "be", "been", "being", "have", "has", "had", "do", "does", "did",
    "will", "would", "could", "should", "may", "might", "this", "that",
    "these", "those", "it", "its", "we", "you", "they", "he", "she",
    "not", "no", "can", "also", "as", "if", "then", "than", "so",
  ];
  return stopWords.includes(word.toLowerCase());
};

module.exports = {
  extractKeywords,
  extractTopics,
  extractDefinitions,
  extractImportantSentences,
  extractFormulas,
  extractHeadings,
  getTextStats,
  isStopWord,
};