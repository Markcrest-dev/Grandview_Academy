/**
 * Standardised API response helpers.
 * Ensures all endpoints return consistent JSON structure.
 */

/**
 * Send a success response.
 *
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {*} [options.data] - Response payload
 * @param {string} [options.message] - Optional message
 * @param {number} [options.statusCode=200] - HTTP status
 * @param {Object} [options.pagination] - Pagination metadata
 */
export function sendSuccess(res, { data = null, message = null, statusCode = 200, pagination = null } = {}) {
  const response = { success: true };

  if (message) response.message = message;
  if (data !== null) response.data = data;
  if (pagination) response.pagination = pagination;

  res.status(statusCode).json(response);
}

/**
 * Send an error response.
 *
 * @param {import('express').Response} res
 * @param {Object} options
 * @param {string} options.message - Error message
 * @param {number} [options.statusCode=400] - HTTP status
 * @param {Object} [options.errors] - Field-level validation errors
 */
export function sendError(res, { message, statusCode = 400, errors = null } = {}) {
  const response = {
    success: false,
    message,
  };

  if (errors) response.errors = errors;

  res.status(statusCode).json(response);
}

/**
 * Create a custom API error with a status code.
 *
 * @param {string} message
 * @param {number} statusCode
 * @returns {Error}
 */
export function createApiError(message, statusCode = 500) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
