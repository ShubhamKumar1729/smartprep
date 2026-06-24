const express = require("express");
const router = express.Router();
const { getDashboard, getTopics, getReadiness } = require("../controllers/analyticsController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/dashboard", getDashboard);
router.get("/topics", getTopics);
router.get("/readiness", getReadiness);

module.exports = router;