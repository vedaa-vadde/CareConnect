const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../utils/response.util');

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const ALLOWED_DOC_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/';
    if (file.fieldname === 'documents') uploadPath += 'documents/';
    else if (file.fieldname === 'profileImage') uploadPath += 'profiles/';
    else if (file.fieldname === 'categoryImage') uploadPath += 'categories/';
    else if (file.fieldname === 'beforeImages' || file.fieldname === 'afterImages') uploadPath += 'evidence/';
    else if (file.fieldname === 'evidence') uploadPath += 'disputes/';
    else uploadPath += 'misc/';
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${uuidv4()}${ext}`);
  },
});

const fileFilter = (allowedTypes) => (req, file, cb) => {
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${allowedTypes.join(', ')}`), false);
  }
};

const uploadImages = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: fileFilter(ALLOWED_IMAGE_TYPES),
});

const uploadDocuments = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
  fileFilter: fileFilter(ALLOWED_DOC_TYPES),
});

// Error handler for multer errors
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendError(res, 'File too large. Maximum allowed size exceeded.', 400);
    }
    return sendError(res, `Upload error: ${err.message}`, 400);
  }
  if (err) {
    return sendError(res, err.message, 400);
  }
  next();
};

module.exports = { uploadImages, uploadDocuments, handleUploadError };
