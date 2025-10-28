// Validation regex patterns
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const phoneRegex = /^(?:\+?91[- ]?)?[6-9]\d{9}$/;
const pincodeRegex = /^[1-9][0-9]{5}$/;

// Check if string is valid ObjectId
function isObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Normalize input to array
function normalizeToArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map((s) => s.trim()).filter(Boolean);
  return String(value).split(',').map((s) => s.trim()).filter(Boolean);
}

// Escape regex special characters
function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Validate email
function validateEmail(email) {
  return emailRegex.test(email);
}

// Validate phone
function validatePhone(phone) {
  return phoneRegex.test(phone);
}

// Validate pincode
function validatePincode(pincode) {
  return pincodeRegex.test(pincode);
}

// Format error response
function errorResponse(message, statusCode = 500) {
  return {
    success: false,
    message,
    statusCode
  };
}

// Format success response
function successResponse(data, message = 'Success') {
  return {
    success: true,
    message,
    data
  };
}

// Async route handler wrapper
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  emailRegex,
  phoneRegex,
  pincodeRegex,
  isObjectId,
  normalizeToArray,
  escapeRegex,
  validateEmail,
  validatePhone,
  validatePincode,
  errorResponse,
  successResponse,
  asyncHandler
};
