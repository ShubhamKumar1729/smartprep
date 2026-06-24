const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { sendError } = require("../utils/responseHelper");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return sendError(res, 401, "Access denied. No token provided.");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return sendError(res, 401, "User not found.");
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return sendError(res, 401, "Invalid token.");
    }
    if (error.name === "TokenExpiredError") {
      return sendError(res, 401, "Token expired. Please login again.");
    }
    return sendError(res, 500, "Authentication error.");
  }
};

module.exports = { protect };