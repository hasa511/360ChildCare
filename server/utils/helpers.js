import jwt from 'jsonwebtoken';

/** Wraps async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Error with an HTTP status code. */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

export const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

/** Returns a local date as YYYY-MM-DD. */
export const toDateStr = (d = new Date()) => {
  const date = new Date(d);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/** Returns an array of the last `n` dates (YYYY-MM-DD), oldest first. */
export const lastNDates = (n) => {
  const dates = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(toDateStr(d));
  }
  return dates;
};

export const isValidDateStr = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);

/** Escapes user input for safe use in a RegExp. */
export const escapeRegex = (s = '') => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Compares ObjectIds / populated docs / strings. */
export const sameId = (a, b) => String(a?._id ?? a) === String(b?._id ?? b);

/** Picks only allowed keys from an object (prevents mass-assignment). */
export const pick = (obj = {}, keys = []) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});