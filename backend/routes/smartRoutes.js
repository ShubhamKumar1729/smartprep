const express = require("express");
const router = express.Router();
const {
  getOrCreateCollection, getFiles, autoProcess,
  generateSummary, generateNotes, generateFlashcards, createInstantTest,
} = require("../controllers/smartController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/collection", getOrCreateCollection);
router.get("/files", getFiles);
router.post("/process", autoProcess);
router.post("/summary", generateSummary);
router.post("/notes", generateNotes);
router.post("/flashcards", generateFlashcards);
router.post("/create-test", createInstantTest);

module.exports = router;