const nlpService = require("./nlpService");

const generateDefinitionFlashcards = (definitions) => {
  return definitions.map((def) => ({
    question: `What is ${def.term}?`,
    answer: def.definition,
    cardType: "definition",
  }));
};

const generateConceptFlashcards = (topics) => {
  return topics
    .filter((t) => t.content && t.content.length > 30)
    .map((topic) => ({
      question: `Explain ${topic.title}`,
      answer: topic.content.substring(0, 300),
      cardType: "concept",
    }));
};

const generateFormulaFlashcards = (text) => {
  try {
    const formulas = nlpService.extractFormulas(text);
    return formulas
      .filter((f) => f.formula.length > 3)
      .map((formula) => ({
        question: `What is the formula: ${formula.formula.split("=")[0]}?`,
        answer: formula.formula,
        cardType: "formula",
      }));
  } catch {
    return [];
  }
};

const generateAllFlashcards = (text, topics, definitions) => {
  const definitionCards = generateDefinitionFlashcards(definitions);
  const conceptCards = generateConceptFlashcards(topics);
  const formulaCards = generateFormulaFlashcards(text);
  return [...definitionCards, ...conceptCards, ...formulaCards];
};

module.exports = {
  generateDefinitionFlashcards,
  generateConceptFlashcards,
  generateFormulaFlashcards,
  generateAllFlashcards,
};