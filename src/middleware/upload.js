/**
 * Upload Middleware
 * Configures multer for file uploads
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getCairoTimestampForFile } = require('../utils/CairoTimestampForFile');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
 const uniqueSuffix = `${getCairoTimestampForFile()}_${Math.round(Math.random() * 1E9)}`;
     cb(null, `restore_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// File filter - only accept ZIP files
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.zip'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only ZIP files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

module.exports = upload;