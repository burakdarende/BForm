const express = require('express');
const { body, validationResult } = require('express-validator');
const Form = require('../models/Form');
const Response = require('../models/Response');
const auth = require('../middleware/auth');
const emailService = require('../services/email');
const calendarService = require('../services/calendar');
// const whatsappService = require('../services/whatsapp'); // Temporarily disabled
const { getClientInfo } = require('../utils/helpers');

const router = express.Router();

// Submit form response (public)
router.post('/submit/:slug', [
  body('responses').isArray({ min: 1 }),
  // Add validation for email and phone fields
  body('responses.*.value').custom((value, { req, path }) => {
    const responseIndex = parseInt(path.split('[')[1].split(']')[0]);
    const response = req.body.responses[responseIndex];
    
    if (response.fieldType === 'email' && value) {
      const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
      if (!emailRegex.test(value)) {
        throw new Error('Geçerli bir email adresi girin');
      }
    }
    
    if (response.fieldType === 'phone' && value) {
      const phoneRegex = /^(\+90|0)?[5][0-9]{9}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        throw new Error('Geçerli bir telefon numarası girin');
      }
    }
    
    return true;
  })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { responses } = req.body;
    const { slug } = req.params;

    // Find the form
    const form = await Form.findOne({ 
      slug, 
      isActive: true,
      'settings.isPublic': true 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı veya aktif değil' });
    }

    // Get client information
    const metadata = getClientInfo(req);

    // Extract submitter info from responses
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

    // Create response record
    const formResponse = new Response({
      form: form._id,
      formTitle: form.title,
      responses,
      metadata,
      submitterInfo,
      status: 'pending'
    });

    await formResponse.save();

    // Update form submission count
    form.submissionCount += 1;
    form.lastSubmission = new Date();
    await form.save();

    // Process notifications asynchronously
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

    // Create calendar event
    if (notifications.calendar?.enabled && submitterInfo.email) {
      try {
        const eventId = await calendarService.createAppointment(
          form, 
          response, 
          submitterInfo
        );
        response.notifications.calendarCreated = true;
        response.notifications.calendarEventId = eventId;
      } catch (error) {
        console.error('Calendar notification error:', error);
      }
    }

    // Send WhatsApp message (temporarily disabled)
    // if (notifications.whatsapp?.enabled && submitterInfo.phone) {
    //   try {
    //     const messageSid = await whatsappService.sendConfirmationMessage(
    //       submitterInfo.phone,
    //       form,
    //       response
    //     );
    //     response.notifications.whatsappSent = true;
    //     response.notifications.whatsappMessageSid = messageSid;
    //   } catch (error) {
    //     console.error('WhatsApp notification error:', error);
    //   }
    // }

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