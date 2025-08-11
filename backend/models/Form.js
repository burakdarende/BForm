const mongoose = require('mongoose');

const fieldSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: [
      'text', 'email', 'phone', 'number', 'textarea', 
      'select', 'radio', 'checkbox', 'date', 'time', 
      'datetime', 'file', 'image', 'rating', 'scale', 'yes-no'
    ]
  },
  label: {
    type: String,
    required: true
  },
  description: String,
  placeholder: String,
  required: {
    type: Boolean,
    default: false
  },
  options: [{
    label: String,
    value: String
  }],
  validation: {
    min: Number,
    max: Number,
    pattern: String,
    message: String
  },
  settings: {
    multiple: Boolean,
    allowOther: Boolean,
    maxFiles: Number,
    acceptedFileTypes: [String]
  },
  isAppointment: {
    type: Boolean,
    default: false
  }
});

const formSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  fields: [fieldSchema],
  settings: {
    isPublic: {
      type: Boolean,
      default: true
    },
    allowMultipleSubmissions: {
      type: Boolean,
      default: false
    },
    requireAuth: {
      type: Boolean,
      default: false
    },
    submitButton: {
      text: {
        type: String,
        default: 'Gönder'
      },
      color: {
        type: String,
        default: '#3B82F6'
      }
    },
    successMessage: {
      type: String,
      default: 'Formunuz başarıyla gönderildi!'
    },
    redirectUrl: String,
    notifications: {
      email: {
        enabled: {
          type: Boolean,
          default: true
        },
        to: [String],
        subject: String,
        template: String
      },
      calendar: {
        enabled: {
          type: Boolean,
          default: false
        },
        title: String,
        duration: {
          type: Number,
          default: 30
        }
      },
      whatsapp: {
        enabled: {
          type: Boolean,
          default: false
        },
        template: String,
        to: String
      }
    }
  },
  styling: {
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    backgroundColor: {
      type: String,
      default: '#FFFFFF'
    },
    textColor: {
      type: String,
      default: '#1F2937'
    },
    fontFamily: {
      type: String,
      default: 'Inter'
    },
    theme: {
      type: String,
      default: 'theme-classic-blue'
    },
    customColors: {
      primary: String,
      background: String,
      text: String,
      inputBorder: String,
      placeholder: String
    }
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  submissionCount: {
    type: Number,
    default: 0
  },
  lastSubmission: Date
}, {
  timestamps: true
});

// Index for faster queries
formSchema.index({ slug: 1 });
formSchema.index({ owner: 1 });
formSchema.index({ isActive: 1 });

module.exports = mongoose.model('Form', formSchema);
