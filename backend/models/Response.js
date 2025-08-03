const mongoose = require('mongoose');

const responseFieldSchema = new mongoose.Schema({
  fieldId: {
    type: String,
    required: true
  },
  fieldType: {
    type: String,
    required: true
  },
  fieldLabel: {
    type: String,
    required: true
  },
  value: mongoose.Schema.Types.Mixed, // Can be string, number, array, etc.
  files: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String
  }]
});

const responseSchema = new mongoose.Schema({
  form: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Form',
    required: true
  },
  formTitle: {
    type: String,
    required: true
  },
  responses: [responseFieldSchema],
  metadata: {
    ipAddress: String,
    userAgent: String,
    browser: String,
    os: String,
    device: String,
    country: String,
    city: String,
    referrer: String
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  submitterInfo: {
    email: String,
    name: String,
    phone: String
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'completed', 'failed'],
    default: 'pending'
  },
  processingNotes: String,
  notifications: {
    emailSent: {
      type: Boolean,
      default: false
    },
    calendarCreated: {
      type: Boolean,
      default: false
    },
    whatsappSent: {
      type: Boolean,
      default: false
    },
    calendarEventId: String,
    emailMessageId: String,
    whatsappMessageSid: String
  }
}, {
  timestamps: true
});

// Indexes for better performance
responseSchema.index({ form: 1, createdAt: -1 });
responseSchema.index({ status: 1 });
responseSchema.index({ 'submitterInfo.email': 1 });

// Virtual for getting submission date in local format
responseSchema.virtual('submissionDate').get(function() {
  return this.createdAt.toLocaleDateString('tr-TR');
});

module.exports = mongoose.model('Response', responseSchema);