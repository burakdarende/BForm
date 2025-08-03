const express = require('express');
const Form = require('../models/Form');
const Response = require('../models/Response');
const User = require('../models/User');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Admin dashboard stats
router.get('/dashboard', [auth, adminAuth], async (req, res) => {
  try {
    const stats = await Promise.all([
      Form.countDocuments({ owner: req.user.userId }),
      Response.countDocuments(),
      Form.countDocuments({ owner: req.user.userId, isActive: true }),
      Response.countDocuments({ 
        createdAt: { 
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        } 
      })
    ]);

    const recentForms = await Form.find({ owner: req.user.userId })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select('title slug submissionCount isActive updatedAt');

    const recentResponses = await Response.find()
      .populate('form', 'title slug')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('formTitle submitterInfo createdAt status');

    res.json({
      stats: {
        totalForms: stats[0],
        totalResponses: stats[1],
        activeForms: stats[2],
        weeklyResponses: stats[3]
      },
      recentForms,
      recentResponses
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get all users (super admin only)
router.get('/users', [auth, adminAuth], async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Update user status
router.patch('/users/:userId/status', [auth, adminAuth], async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { isActive },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Kullanıcı bulunamadı' });
    }

    res.json({
      message: `Kullanıcı ${isActive ? 'aktif' : 'pasif'} duruma getirildi`,
      user
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Get form analytics
router.get('/forms/:formId/analytics', [auth, adminAuth], async (req, res) => {
  try {
    const { formId } = req.params;
    const { period = '30' } = req.query; // days

    const form = await Form.findOne({ 
      _id: formId, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    // Response statistics
    const responseStats = await Response.aggregate([
      {
        $match: {
          form: form._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$createdAt'
            }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // Field analytics
    const fieldAnalytics = await Response.aggregate([
      {
        $match: {
          form: form._id,
          createdAt: { $gte: startDate }
        }
      },
      {
        $unwind: '$responses'
      },
      {
        $group: {
          _id: '$responses.fieldId',
          fieldLabel: { $first: '$responses.fieldLabel' },
          fieldType: { $first: '$responses.fieldType' },
          totalResponses: { $sum: 1 },
          values: { $push: '$responses.value' }
        }
      }
    ]);

    res.json({
      form: {
        id: form._id,
        title: form.title,
        slug: form.slug,
        totalSubmissions: form.submissionCount
      },
      responseStats,
      fieldAnalytics,
      period: parseInt(period)
    });

  } catch (error) {
    console.error('Form analytics error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

// Export responses as CSV
router.get('/forms/:formId/export', [auth, adminAuth], async (req, res) => {
  try {
    const { formId } = req.params;

    const form = await Form.findOne({ 
      _id: formId, 
      owner: req.user.userId 
    });

    if (!form) {
      return res.status(404).json({ message: 'Form bulunamadı' });
    }

    const responses = await Response.find({ form: formId })
      .sort({ createdAt: -1 });

    // Create CSV headers
    const headers = ['Tarih', 'Durum'];
    if (form.fields.length > 0) {
      form.fields.forEach(field => {
        headers.push(field.label);
      });
    }
    headers.push('Email', 'Telefon', 'IP');

    // Create CSV rows
    const rows = [headers];
    responses.forEach(response => {
      const row = [
        response.createdAt.toLocaleDateString('tr-TR'),
        response.status
      ];

      // Add field values
      form.fields.forEach(field => {
        const responseField = response.responses.find(r => r.fieldId === field.id);
        row.push(responseField ? responseField.value : '');
      });

      // Add metadata
      row.push(
        response.submitterInfo.email || '',
        response.submitterInfo.phone || '',
        response.metadata.ipAddress || ''
      );

      rows.push(row);
    });

    // Convert to CSV
    const csv = rows.map(row => 
      row.map(field => `"${field}"`).join(',')
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${form.slug}-responses.csv"`);
    res.send(csv);

  } catch (error) {
    console.error('Export responses error:', error);
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

module.exports = router;