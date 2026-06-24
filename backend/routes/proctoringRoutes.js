const express = require("express");
const router = express.Router();
const { startProctoring, recordEvent, endProctoring, getProctoringReport } = require("../controllers/proctoringController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/start", startProctoring);
router.post("/event", recordEvent);
router.post("/end", endProctoring);
router.get("/report/:attemptId", getProctoringReport);

module.exports = router;