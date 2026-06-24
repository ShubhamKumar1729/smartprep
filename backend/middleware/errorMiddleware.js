const { sendError } = require("../utils/responseHelper");

const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
};

const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Internal Server Error";

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `${field} already exists`;
    statusCode = 400;
  }

  if (err.name === "ValidationError") {
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(", ");
    statusCode = 400;
  }

  if (err.name === "CastError") {
    message = "Invalid ID format";
    statusCode = 400;
  }

  if (err.code === "LIMIT_FILE_SIZE") {
    message = "File size exceeds 50MB limit";
    statusCode = 400;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("Error:", err);
  }

  return sendError(res, statusCode, message);
};

module.exports = { notFound, errorHandler };