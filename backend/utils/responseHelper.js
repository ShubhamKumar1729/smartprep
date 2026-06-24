const sendSuccess = (res, statusCode = 200, message = "Success", data = {}) => {
  return res.status(statusCode).json({ success: true, message, data });
};

const sendError = (res, statusCode = 500, message = "Server Error", errors = null) => {
  const response = { success: false, message };
  if (errors) response.errors = errors;
  return res.status(statusCode).json(response);
};

const sendPaginated = (res, data, pagination, message = "Success") => {
  return res.status(200).json({ success: true, message, data, pagination });
};

module.exports = { sendSuccess, sendError, sendPaginated };