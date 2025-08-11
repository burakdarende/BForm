const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const Response = require('../models/Response');
const auth = require('../middleware/auth');
const emailService = require('../services/email');
const calendarService = require('../services/calendar');
const { getClientInfo } = require('../utils/helpers');
const { verifyTurnstile } = require('../services/turnstile');

const router = express.Router();

// Submit form response (public)
router.post('/submit/:slug', [
  body('responses').isArray({ min: 1 }),
  body('cf_token').notEmpty().withMessage('Captcha doğrulaması gerekli'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { responses, cf_token: turnstileToken } = req.body;
    const { slug } = req.params;

    // Verify Turnstile token (temporarily disabled)
    console.log('🔍 Turnstile verification temporarily disabled');
    const captchaIsValid = true; // await verifyTurnstile(turnstileToken);
    if (!captchaIsValid) {
      return res.status(403).json({ message: 'Captcha doğrulaması başarısız' });
    }

    const form = await Form.findOne({ 
      slug, 
      isActive: true,
      'settings.isPublic': true 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı veya aktif değil' });
    }

    const metadata = getClientInfo(req);

    const submitterInfo = {};
    responses.forEach(response => {
      if (response.fieldType === 'email') {
        submitterInfo.email = response.value;
      } else if (response.fieldType === 'phone') {
        submitterInfo.phone = response.value;
      } else if (response.fieldLabel.toLowerCase().includes('ad') || 
                 response.fieldLabel.toLowerCase().includes('isim')) {
        submitterInfo.name = response.value;
      }
    });

    const formResponse = new Response({
      form: form._id,
      formTitle: form.title,
      responses,
      metadata,
      submitterInfo,
      status: 'pending'
    });

    await formResponse.save();

    form.submissionCount += 1;
    form.lastSubmission = new Date();
    await form.save();

    processNotifications(form, formResponse, submitterInfo);

    res.status(201).json({
      message: form.settings.successMessage || 'Formunuz başarıyla gönderildi!',
      responseId: formResponse._id,
      redirectUrl: form.settings.redirectUrl
    });

  } catch (error) {
    console.error('Submit response error:', error);
    res.status(500).json({ message: 'Form gönderilirken hata oluştu' });
  }
});

// ... (rest of the file remains the same)
// Get responses for a form (protected)
router.get('/form/:formId', auth, async (req, res) => {
  try {
    const { formId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // Verify form ownership
    const form = await Form.findOne({ 
      _id: formId, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    // Get responses with pagination
    const responses = await Response.find({ form: formId })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Response.countDocuments({ form: formId });

    res.json({
      responses,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: responses.length,
        totalCount: total
      }
    });

  } catch (error) {
    console.error('Get responses error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get single response (protected)
router.get('/:responseId', auth, async (req, res) => {
  try {
    const response = await Response.findById(req.params.responseId)
      .populate('form', 'title slug');

    if (!response) {
      return res.status(404).json({ message: 'Yanıt bulunamadı' });
    }

    // Verify ownership
    const form = await Form.findOne({ 
      _id: response.form._id, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    res.json(response);

  } catch (error) {
    console.error('Get response error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update response status (protected)
router.patch('/:responseId/status', auth, [
  body('status').isIn(['pending', 'processed', 'completed', 'failed'])
], async (req, res) => {
  try {
    const { status, notes } = req.body;
    const response = await Response.findById(req.params.responseId);

    if (!response) {
      return res.status(404).json({ message: 'Yanıt bulunamadı' });
    }

    // Verify ownership
    const form = await Form.findOne({ 
      _id: response.form, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(403).json({ message: 'Bu yanıta erişim izniniz yok' });
    }

    response.status = status;
    if (notes) response.processingNotes = notes;
    await response.save();

    res.json({
      message: 'Yanıt durumu güncellendi',
      status: response.status
    });

  } catch (error) {
    console.error('Update response status error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Process notifications (async function)
async function processNotifications(form, response, submitterInfo) {
  try {
    const notifications = form.settings.notifications;

    // Send email notification
    if (notifications.email?.enabled) {
      try {
        await emailService.sendFormSubmissionEmail(form, response, submitterInfo);
        response.notifications.emailSent = true;
      } catch (error) {
        console.error('Email notification error:', error);
      }
    }

    // Create calendar event if form has appointment fields
    console.log('🔍 Calendar Debug:');
    console.log('- Form fields:', form.fields?.map(f => ({ type: f.type, isAppointment: f.isAppointment })));
    
    const hasAppointmentFields = form.fields?.some(field => 
      (field.type === 'date' || field.type === 'time') && field.isAppointment
    );
    
    console.log('- Has appointment fields:', hasAppointmentFields);
    
    if (hasAppointmentFields) {
      try {
        console.log('📅 Creating calendar appointment...');
        const eventId = await calendarService.createAppointment(
          form, 
          response, 
          submitterInfo
        );
        response.notifications.calendarCreated = true;
        response.notifications.calendarEventId = eventId;
        console.log('✅ Calendar event created:', eventId);
      } catch (error) {
        console.error('❌ Calendar notification error:', error);
      }
    }

    // Update response status
    response.status = 'processed';
    await response.save();

  } catch (error) {
    console.error('Process notifications error:', error);
    response.status = 'failed';
    await response.save();
  }
}

module.exports = router;
