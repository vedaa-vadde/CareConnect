/**
 * Misc helper utilities
 */

// Paginate a query
const getPagination = (query) => {
  const page = Math.max(1, parseInt(query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

// Build sort options from query
const getSortOptions = (query, allowedFields = []) => {
  const sort = {};
  if (query.sortBy && allowedFields.includes(query.sortBy)) {
    sort[query.sortBy] = query.order === 'asc' ? 1 : -1;
  } else {
    sort.createdAt = -1;
  }
  return sort;
};

// Sanitize file paths for public URL
const getFileUrl = (filename) => {
  if (!filename) return null;
  return `/uploads/${filename}`;
};

// Format INR amount
const formatINR = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

// Check time overlap
const timesOverlap = (start1, end1, start2, end2) => {
  const s1 = new Date(`1970-01-01T${start1}:00`);
  const e1 = new Date(`1970-01-01T${end1}:00`);
  const s2 = new Date(`1970-01-01T${start2}:00`);
  const e2 = new Date(`1970-01-01T${end2}:00`);
  return s1 < e2 && e1 > s2;
};

module.exports = { getPagination, getSortOptions, getFileUrl, formatINR, timesOverlap };
