const express = require("express");
const router = express.Router();
const { getAchievements, getXP, getLeaderboard } = require("../controllers/achievementController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/", getAchievements);
router.get("/xp", getXP);
router.get("/leaderboard", getLeaderboard);

module.exports = router;