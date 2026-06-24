const evaluateAnswer = (question, selectedAnswer) => {
  if (!selectedAnswer || selectedAnswer.trim() === "") {
    return { isCorrect: false, isSkipped: true };
  }

  const correctAnswer = question.answer?.toLowerCase().trim();
  const userAnswer = selectedAnswer?.toLowerCase().trim();
  let isCorrect = false;

  switch (question.questionType) {
    case "mcq":
    case "truefalse":
      isCorrect = correctAnswer === userAnswer;
      break;
    case "fillinblanks":
      isCorrect =
        correctAnswer === userAnswer ||
        correctAnswer.includes(userAnswer) ||
        userAnswer.includes(correctAnswer);
      break;
    case "shortanswer":
    case "longanswer":
    case "viva":
      const correctWords = correctAnswer.split(" ").filter((w) => w.length > 3);
      const userWords = userAnswer.split(" ").filter((w) => w.length > 3);
      const matchCount = correctWords.filter((w) => userWords.includes(w)).length;
      isCorrect = matchCount >= Math.floor(correctWords.length * 0.5);
      break;
    default:
      isCorrect = correctAnswer === userAnswer;
  }

  return { isCorrect, isSkipped: false };
};

const calculateResult = (responses, totalQuestions) => {
  let correct = 0;
  let wrong = 0;
  let skipped = 0;

  responses.forEach((response) => {
    if (response.isSkipped) skipped++;
    else if (response.isCorrect) correct++;
    else wrong++;
  });

  const unanswered = totalQuestions - responses.length;
  skipped += unanswered;

  const percentage = Math.round((correct / totalQuestions) * 100);

  let grade = "F";
  if (percentage >= 90) grade = "A+";
  else if (percentage >= 80) grade = "A";
  else if (percentage >= 70) grade = "B";
  else if (percentage >= 60) grade = "C";
  else if (percentage >= 50) grade = "D";

  let remark = "Needs Improvement";
  if (percentage >= 90) remark = "Excellent! Outstanding!";
  else if (percentage >= 80) remark = "Great job! Well done!";
  else if (percentage >= 70) remark = "Good performance!";
  else if (percentage >= 60) remark = "Average. Keep practicing!";
  else if (percentage >= 50) remark = "Below average. More practice needed.";

  return { score: correct, percentage, correctAnswers: correct, wrongAnswers: wrong, skippedAnswers: skipped, totalQuestions, grade, remark };
};

module.exports = { evaluateAnswer, calculateResult };