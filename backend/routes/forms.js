const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const Response = require('../models/Response');
const auth = require('../middleware/auth');
const { generateSlug } = require('../utils/helpers');

const router = express.Router();

// Get all forms (public)
router.get('/public', async (req, res) => {
  try {
    const forms = await Form.find({ 
      isActive: true, 
      'settings.isPublic': true 
    })
    .select('title description slug styling submissionCount')
    .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    console.error('Get public forms error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get form by slug (public)
router.get('/public/:slug', async (req, res) => {
  try {
    const form = await Form.findOne({ 
      slug: req.params.slug, 
      isActive: true,
      'settings.isPublic': true 
    }).populate('owner', 'name email');

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    res.json(form);
  } catch (error) {
    console.error('Get form by slug error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get user's forms (protected)
router.get('/my', auth, async (req, res) => {
  try {
    const forms = await Form.find({ owner: req.user.userId })
      .sort({ updatedAt: -1 });

    res.json(forms);
  } catch (error) {
    console.error('Get user forms error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Create new form (protected)
router.post('/', auth, [
  body('title').trim().isLength({ min: 1 }),
  body('fields').isArray({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, description, fields, settings, styling } = req.body;

    // Generate unique slug
    let slug = generateSlug(title);
    let existingForm = await Form.findOne({ slug });
    let counter = 1;
    
    while (existingForm) {
      slug = `${generateSlug(title)}-${counter}`;
      existingForm = await Form.findOne({ slug });
      counter++;
    }

    const form = new Form({
      title,
      description,
      slug,
      fields,
      settings: {
        isPublic: true,
        ...settings,
        notifications: {
          email: {
            enabled: true,
            to: [req.user.email],
            ...settings?.notifications?.email
          },
          ...settings?.notifications
        }
      },
      styling,
      owner: req.user.userId,
      isActive: true
    });

    await form.save();

    res.status(201).json({
      message: 'Form başarıyla oluşturuldu',
      form
    });
  } catch (error) {
    console.error('Create form error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update form (protected)
router.put('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    // Update fields
    Object.assign(form, req.body);
    await form.save();

    res.json({
      message: 'Form başarıyla güncellendi',
      form
    });
  } catch (error) {
    console.error('Update form error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get single form (protected)
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Loading form ID:', req.params.id, 'for user:', req.user.userId);
    
    const form = await Form.findOne({ 
      _id: req.params.id, 
      owner: req.user.userId 
    });

    if (!form) {
      console.log('Form not found or access denied');
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    console.log('Form found:', form.title);
    res.json(form);
  } catch (error) {
    console.error('Get form error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Delete form (protected)
router.delete('/:id', auth, async (req, res) => {
  try {
    const form = await Form.findOneAndDelete({ 
      _id: req.params.id, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    // Also delete all responses
    await Response.deleteMany({ form: req.params.id });

    res.json({ message: 'Form başarıyla silindi' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Toggle form status (protected)
router.patch('/:id/toggle', auth, async (req, res) => {
  try {
    const form = await Form.findOne({ 
      _id: req.params.id, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    form.isActive = !form.isActive;
    await form.save();

    res.json({
      message: `Form ${form.isActive ? 'aktif' : 'pasif'} duruma getirildi`,
      isActive: form.isActive
    });
  } catch (error) {
    console.error('Toggle form error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;