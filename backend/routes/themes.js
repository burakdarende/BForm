const express = require('express');
const { body, validationResult } = require('express-validator');
const auth = require('../middleware/auth');
const Theme = require('../models/Theme');

const router = express.Router();

// Get all themes (public)
router.get('/', async (req, res) => {
  try {
    const themes = await Theme.find().sort({ createdAt: 1 });
    res.json(themes);
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get single theme
router.get('/:id', async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: 'Tema bulunamadı' });
    }
    res.json(theme);
  } catch (error) {
    console.error('Get theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Create new theme (protected)
router.post('/', auth, [
  body('name').trim().isLength({ min: 1 }).withMessage('Tema adı gerekli'),
  body('id').trim().isLength({ min: 1 }).withMessage('Tema ID gerekli'),
  body('type').isIn(['light', 'dark']).withMessage('Geçerli tip seçin'),
  body('icon').trim().isLength({ min: 1 }).withMessage('İkon gerekli'),
  body('colors.primary').isHexColor().withMessage('Geçerli primary renk'),
  body('colors.background').isHexColor().withMessage('Geçerli background renk'),
  body('colors.text').isHexColor().withMessage('Geçerli text renk'),
  body('preview').isHexColor().withMessage('Geçerli preview renk')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, id, type, icon, colors, preview, isDefault } = req.body;

    // Check if theme ID already exists
    const existingTheme = await Theme.findOne({ id });
    if (existingTheme) {
      return res.status(400).json({ message: 'Bu tema ID zaten kullanılıyor' });
    }

    const theme = new Theme({
      name,
      id,
      type,
      icon,
      colors: {
        primary: colors.primary,
        background: colors.background,
        text: colors.text,
        inputBorder: colors.inputBorder || `${colors.primary}4D`,
        placeholder: colors.placeholder || '#64748B80'
      },
      preview,
      isDefault: isDefault || false,
      createdBy: req.user.userId
    });

    await theme.save();

    res.status(201).json({
      message: 'Tema başarıyla oluşturuldu',
      theme
    });
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update theme (protected)
router.put('/:id', auth, [
  body('name').optional().trim().isLength({ min: 1 }),
  body('type').optional().isIn(['light', 'dark']),
  body('icon').optional().trim().isLength({ min: 1 }),
  body('colors.primary').optional().isHexColor(),
  body('colors.background').optional().isHexColor(),
  body('colors.text').optional().isHexColor(),
  body('preview').optional().isHexColor()
], async (req, res) => {
  try {
    console.log('Backend: PUT /api/themes/:id called with ID:', req.params.id);
    console.log('Backend: Request body:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Backend: Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      console.log('Backend: Theme not found with ID:', req.params.id);
      return res.status(404).json({ message: 'Tema bulunamadı' });
    }

    console.log('Backend: Theme found, current data:', JSON.stringify(theme, null, 2));

    // Update fields
    Object.keys(req.body).forEach(key => {
      if (key === 'colors') {
        theme.colors = { ...theme.colors, ...req.body.colors };
        console.log('Backend: Updated colors:', theme.colors);
      } else {
        theme[key] = req.body[key];
        console.log(`Backend: Updated ${key}:`, theme[key]);
      }
    });

    await theme.save();
    console.log('Backend: Theme saved successfully:', JSON.stringify(theme, null, 2));

    res.json({
      message: 'Tema başarıyla güncellendi',
      theme
    });
  } catch (error) {
    console.error('Update theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Reset theme to default colors (protected)
router.put('/:id/reset', auth, async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: 'Tema bulunamadı' });
    }

    // Reset colors to default colors
    theme.colors = { ...theme.defaultColors };
    await theme.save();

    res.json({
      message: 'Tema varsayılan renklerine döndürüldü',
      theme
    });
  } catch (error) {
    console.error('Reset theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Delete theme (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const theme = await Theme.findById(req.params.id);
    if (!theme) {
      return res.status(404).json({ message: 'Tema bulunamadı' });
    }

    if (theme.isDefault) {
      return res.status(400).json({ message: 'Varsayılan tema silinemez' });
    }

    await Theme.findByIdAndDelete(req.params.id);

    res.json({ message: 'Tema başarıyla silindi' });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Test email endpoint
router.post('/test-email', async (req, res) => {
  try {
    const emailService = require('../services/email');
    await emailService.testConnection();
    res.json({ success: true, message: 'Email bağlantısı başarılı!' });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;