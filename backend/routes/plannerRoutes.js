const express = require("express");
const router = express.Router();
const { generatePlan, getPlans } = require("../controllers/plannerController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.get("/generate", generatePlan);
router.get("/", getPlans);

module.exports = router;