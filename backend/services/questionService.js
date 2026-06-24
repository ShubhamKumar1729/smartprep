const nlpService = require("./nlpService");

const generateMCQs = (text, topics, definitions, keywords, count = 10) => {
  try {
    const questions = [];
    const sentences = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 30 && s.trim().length < 200);

    definitions.slice(0, Math.floor(count / 3)).forEach((def) => {
      const wrongOptions = generateWrongOptions(def.definition, keywords, 3);
      if (wrongOptions.length >= 3) {
        const allOptions = shuffleArray([def.definition, ...wrongOptions]);
        questions.push({
          questionType: "mcq",
          difficulty: "medium",
          question: `What is the correct definition of "${def.term}"?`,
          options: allOptions,
          answer: def.definition,
          explanation: `${def.term}: ${def.definition}`,
        });
      }
    });

    topics.slice(0, Math.floor(count / 3)).forEach((topic) => {
      if (topic.content && topic.content.length > 30) {
        const wrongOptions = generateWrongOptions(topic.title, keywords, 3);
        if (wrongOptions.length >= 3) {
          const allOptions = shuffleArray([topic.title, ...wrongOptions]);
          questions.push({
            questionType: "mcq",
            difficulty: "easy",
            question: `Which topic does this describe: "${topic.content.substring(0, 80)}..."?`,
            options: allOptions,
            answer: topic.title,
            explanation: `This refers to ${topic.title}.`,
          });
        }
      }
    });

    const importantSentences = nlpService.extractImportantSentences(text, 15);
    importantSentences.slice(0, count - questions.length).forEach((sentence) => {
      const words = sentence.split(" ");
      if (words.length > 5) {
        const keyWord = words[Math.floor(words.length / 2)];
        const questionText = sentence.replace(keyWord, "______");
        const wrongOptions = keywords
          .filter((k) => k !== keyWord && k.length > 3)
          .slice(0, 3);

        if (wrongOptions.length >= 3) {
          const allOptions = shuffleArray([keyWord, ...wrongOptions]);
          questions.push({
            questionType: "mcq",
            difficulty: "hard",
            question: `Fill: "${questionText}"`,
            options: allOptions,
            answer: keyWord,
            explanation: `Complete sentence: ${sentence}`,
          });
        }
      }
    });

    return questions.slice(0, count);
  } catch {
    return [];
  }
};

const generateTrueFalse = (text, definitions, count = 10) => {
  try {
    const questions = [];
    const sentences = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 20 && s.trim().length < 150);

    sentences.slice(0, Math.floor(count / 2)).forEach((sentence) => {
      questions.push({
        questionType: "truefalse",
        difficulty: "easy",
        question: sentence.trim(),
        options: ["True", "False"],
        answer: "True",
        explanation: "This statement is correct based on the document.",
      });
    });

    definitions.slice(0, Math.floor(count / 2)).forEach((def) => {
      questions.push({
        questionType: "truefalse",
        difficulty: "medium",
        question: `${def.term} is not related to ${def.definition
          .split(" ")
          .slice(0, 5)
          .join(" ")}...`,
        options: ["True", "False"],
        answer: "False",
        explanation: `${def.term} is defined as: ${def.definition}`,
      });
    });

    return questions.slice(0, count);
  } catch {
    return [];
  }
};

const generateFillBlanks = (text, keywords, count = 10) => {
  try {
    const questions = [];
    const sentences = text
      .split(/[.!?]+/)
      .filter((s) => s.trim().length > 30 && s.trim().length < 200);

    sentences.slice(0, count).forEach((sentence) => {
      const trimmed = sentence.trim();
      const keywordInSentence = keywords.find((kw) =>
        trimmed.toLowerCase().includes(kw.toLowerCase())
      );

      if (keywordInSentence) {
        const blanked = trimmed.replace(new RegExp(keywordInSentence, "i"), "______");
        questions.push({
          questionType: "fillinblanks",
          difficulty: "medium",
          question: blanked,
          options: [],
          answer: keywordInSentence,
          explanation: `Complete sentence: ${trimmed}`,
        });
      }
    });

    return questions.slice(0, count);
  } catch {
    return [];
  }
};

const generateShortAnswers = (topics, definitions, count = 10) => {
  try {
    const questions = [];

    definitions.slice(0, Math.floor(count / 2)).forEach((def) => {
      questions.push({
        questionType: "shortanswer",
        difficulty: "easy",
        question: `Define ${def.term}.`,
        options: [],
        answer: def.definition,
        explanation: "",
      });
    });

    topics.slice(0, Math.floor(count / 2)).forEach((topic) => {
      if (topic.content && topic.content.length > 30) {
        questions.push({
          questionType: "shortanswer",
          difficulty: "medium",
          question: `Briefly explain ${topic.title}.`,
          options: [],
          answer: topic.content.substring(0, 200),
          explanation: "",
        });
      }
    });

    return questions.slice(0, count);
  } catch {
    return [];
  }
};

const generateVivaQuestions = (topics, definitions, keywords, text) => {
  try {
    const questions = [];

    definitions.slice(0, 5).forEach((def) => {
      questions.push({
        questionType: "viva",
        difficulty: "easy",
        question: `What do you mean by ${def.term}?`,
        options: [],
        answer: def.definition,
        explanation: "Basic definition question",
      });
    });

    topics.slice(0, 5).forEach((topic) => {
      questions.push({
        questionType: "viva",
        difficulty: "medium",
        question: `How does ${topic.title} work? Explain with an example.`,
        options: [],
        answer: topic.content || `${topic.title} involves...`,
        explanation: "Conceptual understanding question",
      });
    });

    for (let i = 0; i < Math.min(5, topics.length - 1); i++) {
      questions.push({
        questionType: "viva",
        difficulty: "hard",
        question: `Compare ${topics[i].title} with ${
          topics[i + 1]?.title || "related concepts"
        }.`,
        options: [],
        answer: `${topics[i].title} and ${topics[i + 1]?.title} differ in...`,
        explanation: "Advanced analytical question",
      });
    }

    return questions;
  } catch {
    return [];
  }
};

const generateWrongOptions = (correctAnswer, keywords, count = 3) => {
  try {
    const options = keywords
      .filter(
        (kw) =>
          kw !== correctAnswer &&
          kw.length > 3 &&
          !correctAnswer.toLowerCase().includes(kw.toLowerCase())
      )
      .slice(0, count);

    while (options.length < count) {
      options.push(`Option ${options.length + 1}`);
    }

    return options;
  } catch {
    return ["Option A", "Option B", "Option C"];
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

module.exports = {
  generateMCQs,
  generateTrueFalse,
  generateFillBlanks,
  generateShortAnswers,
  generateVivaQuestions,
};