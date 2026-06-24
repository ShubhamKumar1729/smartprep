const express = require("express");
const router = express.Router();
const { register, login, getProfile, updateProfile, changePassword } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { validateRegister, validateLogin, validateProfileUpdate, validatePasswordChange } = require("../middleware/validationMiddleware");

router.post("/register", validateRegister, register);
router.post("/login", validateLogin, login);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, validateProfileUpdate, updateProfile);
router.put("/change-password", protect, validatePasswordChange, changePassword);

module.exports = router;