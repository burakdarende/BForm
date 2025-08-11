const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '../uploads/images');

const ensureUploadsDir = async () => {
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    console.error('Error creating uploads directory:', error);
  }
};

// Initialize upload directory
ensureUploadsDir();

// Configure multer for memory storage (we'll process before saving)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check if file is an image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Process and convert image to WebP
const processImage = async (buffer, filename) => {
  try {
    // Generate unique filename
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const webpFilename = `${timestamp}_${randomId}.webp`;
    const filePath = path.join(uploadDir, webpFilename);

    // Convert to WebP with compression
    await sharp(buffer)
      .webp({ 
        quality: 85, // Good quality with compression
        effort: 4    // Good compression efficiency
      })
      .resize(1920, 1920, { // Max 1920x1920, maintain aspect ratio
        fit: 'inside',
        withoutEnlargement: true
      })
      .toFile(filePath);

    return {
      filename: webpFilename,
      originalName: filename,
      mimeType: 'image/webp',
      path: filePath,
      url: `/uploads/images/${webpFilename}`
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
};

// Get file info
const getFileInfo = async (filePath) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
};

// Delete file
const deleteFile = async (filename) => {
  try {
    const filePath = path.join(uploadDir, filename);
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    console.error(`Failed to delete file ${filename}:`, error);
    return false;
  }
};

module.exports = {
  upload,
  processImage,
  getFileInfo,
  deleteFile,
  uploadDir
};
