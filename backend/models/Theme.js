const mongoose = require('mongoose');

const themeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  id: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  type: {
    type: String,
    enum: ['light', 'dark'],
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  colors: {
    primary: {
      type: String,
      required: true
    },
    background: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    inputBorder: {
      type: String,
      required: true
    },
    placeholder: {
      type: String,
      required: true
    }
  },
  preview: {
    type: String,
    required: true
  },
  shapes: {
    enabled: {
      type: Boolean,
      default: false
    },
    shapes: [{
      type: {
        type: String,
        enum: ['circle', 'triangle', 'square', 'blob'],
        required: true
      },
      size: {
        type: Number,
        required: true
      },
      color: {
        type: String,
        required: true
      },
      opacity: {
        type: Number,
        required: true
      },
      x: {
        type: Number,
        required: true
      },
      y: {
        type: Number,
        required: true
      },
      rotation: {
        type: Number,
        required: true
      }
    }]
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Ensure only one default theme
themeSchema.pre('save', async function(next) {
  if (this.isDefault) {
    await this.constructor.updateMany(
      { _id: { $ne: this._id } }, 
      { isDefault: false }
    );
  }
  next();
});

module.exports = mongoose.model('Theme', themeSchema);