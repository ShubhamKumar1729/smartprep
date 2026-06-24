const { body, validationResult } = require("express-validator");
const { sendError } = require("../utils/responseHelper");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 400, "Validation failed", errors.array());
  }
  next();
};

const validateRegister = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2-50 characters"),
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Min 8 characters"),
  body("confirmPassword").notEmpty().withMessage("Please confirm password")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
  handleValidationErrors,
];

const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Invalid email").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateProfileUpdate = [
  body("name").trim().notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("2-50 characters"),
  handleValidationErrors,
];

const validatePasswordChange = [
  body("currentPassword").notEmpty().withMessage("Current password is required"),
  body("newPassword").notEmpty().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("Min 8 characters"),
  body("confirmPassword").notEmpty().withMessage("Please confirm password")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("Passwords do not match");
      return true;
    }),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange,
};