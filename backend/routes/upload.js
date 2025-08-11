const express = require('express');
const router = express.Router();
const { upload, processImage } = require('../services/imageUpload');
const path = require('path'); // Added for preview route

// Single image upload
router.post('/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    console.log('📸 Image upload received:', {
      originalName: req.file.originalname,
      size: req.file.size,
      mimeType: req.file.mimetype
    });

    // Process image (convert to WebP)
    const processedImage = await processImage(req.file.buffer, req.file.originalname);

    console.log('✅ Image processed successfully:', processedImage);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        filename: processedImage.filename,
        originalName: processedImage.originalName,
        mimeType: processedImage.mimeType,
        url: processedImage.url
      }
    });

  } catch (error) {
    console.error('❌ Image upload error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Image upload failed',
      error: error.message
    });
  }
});

// Multiple images upload
router.post('/images', upload.array('images', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided'
      });
    }

    console.log('📸 Multiple images upload received:', req.files.length, 'files');

    const processedImages = [];

    for (const file of req.files) {
      try {
        const processedImage = await processImage(file.buffer, file.originalname);
        processedImages.push({
          filename: processedImage.filename,
          originalName: processedImage.originalName,
          mimeType: processedImage.mimeType,
          url: processedImage.url
        });
      } catch (error) {
        console.error(`Failed to process ${file.originalname}:`, error);
      }
    }

    console.log('✅ Images processed:', processedImages.length, 'successful');

    res.json({
      success: true,
      message: `${processedImages.length} images uploaded successfully`,
      data: processedImages
    });

  } catch (error) {
    console.error('❌ Multiple images upload error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Images upload failed',
      error: error.message
    });
  }
});

// Get image for preview
router.get('/preview/:filename', (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, '../uploads/images', filename);
    
    // Set CORS headers
    res.header('Access-Control-Allow-Origin', process.env.FRONTEND_URL || 'http://localhost:3000');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    res.sendFile(filePath);
  } catch (error) {
    console.error('❌ Image preview error:', error);
    res.status(404).json({ error: 'Image not found' });
  }
});

module.exports = router;
