const express = require("express");
const router = express.Router();
const { getTests, getTest, deleteTest, getTestQuestions } = require("../controllers/testController");
const { startTest, saveAnswer, submitTest, getResult, getHistory } = require("../controllers/attemptController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getTests);
router.post("/start", startTest);
router.post("/save-answer", saveAnswer);
router.post("/submit", submitTest);
router.get("/history", getHistory);
router.get("/result/:attemptId", getResult);
router.get("/questions/:testId", getTestQuestions);
router.get("/:id", getTest);
router.delete("/:id", deleteTest);

module.exports = router;