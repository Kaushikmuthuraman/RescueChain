/**
 * Multer Configuration
 * File upload middleware configuration
 */

const multer = require('multer');

// Configure storage - use memory storage for IPFS uploads
const storage = multer.memoryStorage();

// File filter for images only
const fileFilter = (req, file, cb) => {
    // Accept image files only
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only image files (JPEG, PNG, HEIC) are allowed.'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max file size
    },
    fileFilter: fileFilter
});

module.exports = upload;
