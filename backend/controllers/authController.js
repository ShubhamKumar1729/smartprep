const User = require("../models/User");
const Attempt = require("../models/Attempt");
const File = require("../models/File");
const generateToken = require("../utils/generateToken");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return sendError(res, 400, "Email already registered");

    const user = await User.create({ name, email, password });
    const token = generateToken(user._id);

    return sendSuccess(res, 201, "Account created successfully", {
      user: { _id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select("+password");
    if (!user) return sendError(res, 401, "Invalid email or password");

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) return sendError(res, 401, "Invalid email or password");

    const token = generateToken(user._id);
    return sendSuccess(res, 200, "Login successful", {
      user: { _id: user._id, name: user.name, email: user.email, createdAt: user.createdAt },
      token,
    });
  } catch (error) {
    next(error);
  }
};

const getProfile = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const [testsCount, filesCount] = await Promise.all([
      Attempt.countDocuments({ userId, status: "submitted" }),
      File.countDocuments({ userId }),
    ]);

    return sendSuccess(res, 200, "Profile fetched", {
      user: { _id: req.user._id, name: req.user.name, email: req.user.email, createdAt: req.user.createdAt },
      stats: { totalTests: testsCount, totalFiles: filesCount },
    });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id, { name }, { new: true, runValidators: true }
    );
    return sendSuccess(res, 200, "Profile updated", {
      user: { _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, createdAt: updatedUser.createdAt },
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select("+password");
    const isValid = await user.comparePassword(currentPassword);
    if (!isValid) return sendError(res, 400, "Current password is incorrect");

    user.password = newPassword;
    await user.save();
    const token = generateToken(user._id);
    return sendSuccess(res, 200, "Password changed successfully", { token });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getProfile, updateProfile, changePassword };