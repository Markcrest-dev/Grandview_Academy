/**
 * Shared input validation helpers.
 * Lightweight validators — no external library dependency.
 */

/**
 * Validate an email address format.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/**
 * Validate that a string is non-empty after trimming.
 * @param {string} value
 * @returns {boolean}
 */
export function isNonEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validate a date string (YYYY-MM-DD format).
 * @param {string} dateStr
 * @returns {boolean}
 */
export function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== 'string') return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validate that a value is one of the allowed enum values.
 * @param {string} value
 * @param {string[]} allowed
 * @returns {boolean}
 */
export function isEnum(value, allowed) {
  return allowed.includes(value);
}

/**
 * Parse pagination params from query string with defaults.
 * @param {Object} query - Express req.query
 * @returns {{ page: number, limit: number, offset: number }}
 */
export function parsePagination(query) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Validate required fields and return an object of errors.
 * @param {Object} body - The request body
 * @param {string[]} fields - Required field names
 * @returns {Object|null} - Field errors object, or null if all valid
 */
export function validateRequired(body, fields) {
  const errors = {};

  for (const field of fields) {
    if (!body[field] || (typeof body[field] === 'string' && !body[field].trim())) {
      errors[field] = `${field} is required`;
    }
  }

  return Object.keys(errors).length > 0 ? errors : null;
}
