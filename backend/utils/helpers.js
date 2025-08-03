const crypto = require('crypto');

// Generate URL-friendly slug
const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[ğĞ]/g, 'g')
    .replace(/[üÜ]/g, 'u')
    .replace(/[şŞ]/g, 's')
    .replace(/[ıİ]/g, 'i')
    .replace(/[öÖ]/g, 'o')
    .replace(/[çÇ]/g, 'c')
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

// Extract client information from request
const getClientInfo = (req) => {
  const userAgent = req.get('User-Agent') || '';
  
  // Simple browser detection
  let browser = 'Unknown';
  if (userAgent.includes('Chrome')) browser = 'Chrome';
  else if (userAgent.includes('Firefox')) browser = 'Firefox';
  else if (userAgent.includes('Safari')) browser = 'Safari';
  else if (userAgent.includes('Edge')) browser = 'Edge';

  // Simple OS detection
  let os = 'Unknown';
  if (userAgent.includes('Windows')) os = 'Windows';
  else if (userAgent.includes('Mac')) os = 'macOS';
  else if (userAgent.includes('Linux')) os = 'Linux';
  else if (userAgent.includes('Android')) os = 'Android';
  else if (userAgent.includes('iOS')) os = 'iOS';

  // Simple device detection
  let device = 'Desktop';
  if (userAgent.includes('Mobile')) device = 'Mobile';
  else if (userAgent.includes('Tablet')) device = 'Tablet';

  return {
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    userAgent: userAgent,
    browser: browser,
    os: os,
    device: device,
    referrer: req.get('Referer') || 'Direct'
  };
};

// Generate random string
const generateRandomString = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Validate phone number (Turkish format)
const isValidPhone = (phone) => {
  const phoneRegex = /^(\+90|0)?5[0-9]{9}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

// Format phone number for WhatsApp
const formatPhoneForWhatsApp = (phone) => {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // Add country code if missing
  if (cleaned.startsWith('5') && cleaned.length === 10) {
    cleaned = '90' + cleaned;
  } else if (cleaned.startsWith('05') && cleaned.length === 11) {
    cleaned = '9' + cleaned;
  } else if (cleaned.startsWith('905') && cleaned.length === 13) {
    // Already has country code
  } else if (cleaned.startsWith('90') && cleaned.length === 12) {
    // Already has country code
  }
  
  return '+' + cleaned;
};

// Sanitize HTML content
const sanitizeHtml = (text) => {
  if (typeof text !== 'string') return text;
  
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

// Parse form response values
const parseResponseValue = (value, fieldType) => {
  switch (fieldType) {
    case 'number':
      return parseFloat(value) || 0;
    case 'checkbox':
      return Array.isArray(value) ? value : [value];
    case 'date':
      return new Date(value);
    default:
      return value;
  }
};

// Format date for display
const formatDate = (date, locale = 'tr-TR') => {
  return new Date(date).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

module.exports = {
  generateSlug,
  getClientInfo,
  generateRandomString,
  isValidEmail,
  isValidPhone,
  formatPhoneForWhatsApp,
  sanitizeHtml,
  parseResponseValue,
  formatDate
};