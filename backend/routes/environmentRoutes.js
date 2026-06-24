const express = require("express");
const router = express.Router();
const { saveCheck, getCheck } = require("../controllers/environmentController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);
router.post("/save", saveCheck);
router.get("/:testId", getCheck);

module.exports = router;