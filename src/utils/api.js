/**
 * API Configuration Utility
 * 
 * Centralizes the API base URL for all fetch calls.
 * In development, Vite's proxy handles /api → localhost:5000.
 * In production, VITE_API_URL points to the deployed backend.
 */

export const API_BASE = import.meta.env.VITE_API_URL || '';

/**
 * Build a full API URL from a path.
 * @param {string} path - API path starting with '/api/...'
 * @returns {string} Full URL
 */
export function apiUrl(path) {
  return `${API_BASE}${path}`;
}
