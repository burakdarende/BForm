const mongoose = require('mongoose');
const Theme = require('../models/Theme');

const INITIAL_THEMES = [
  {
    name: 'Classic Blue',
    id: 'theme-classic-blue',
    type: 'light',
    icon: '🔵',
    colors: {
      primary: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937',
      inputBorder: '#3B82F64D',
      placeholder: '#64748B80'
    },
    preview: '#3B82F6',
    isDefault: true
  },
  {
    name: 'Midnight Dark',
    id: 'theme-midnight-dark',
    type: 'dark',
    icon: '🌙',
    colors: {
      primary: '#06B6D4',
      background: '#0F172A',
      text: '#F1F5F9',
      inputBorder: '#06B6D44D',
      placeholder: '#94A3B880'
    },
    preview: '#0F172A',
    isDefault: false
  },
  {
    name: 'Purple Dream',
    id: 'theme-purple-dream',
    type: 'light',
    icon: '💜',
    colors: {
      primary: '#A855F7',
      background: '#FEFBFF',
      text: '#2D1B69',
      inputBorder: '#A855F74D',
      placeholder: '#7C3AED80'
    },
    preview: '#A855F7',
    isDefault: false
  },
  {
    name: 'Forest Green',
    id: 'theme-forest-green',
    type: 'light',
    icon: '🌲',
    colors: {
      primary: '#22C55E',
      background: '#F0FDF4',
      text: '#14532D',
      inputBorder: '#22C55E4D',
      placeholder: '#16A34A80'
    },
    preview: '#22C55E',
    isDefault: false
  },
  {
    name: 'Sunset Orange',
    id: 'theme-sunset-orange',
    type: 'light',
    icon: '🧡',
    colors: {
      primary: '#F97316',
      background: '#FFF7ED',
      text: '#9A3412',
      inputBorder: '#F973164D',
      placeholder: '#EA580C80'
    },
    preview: '#F97316',
    isDefault: false
  },
  {
    name: 'Ocean Teal',
    id: 'theme-ocean-teal',
    type: 'light',
    icon: '🌊',
    colors: {
      primary: '#14B8A6',
      background: '#F0FDFA',
      text: '#134E4A',
      inputBorder: '#14B8A64D',
      placeholder: '#0F766E80'
    },
    preview: '#14B8A6',
    isDefault: false
  },
  {
    name: 'Rose Pink',
    id: 'theme-rose-pink',
    type: 'light',
    icon: '🌹',
    colors: {
      primary: '#F43F5E',
      background: '#FFF1F2',
      text: '#881337',
      inputBorder: '#F43F5E4D',
      placeholder: '#E11D4880'
    },
    preview: '#F43F5E',
    isDefault: false
  },
  {
    name: 'Cosmic Purple',
    id: 'theme-cosmic-purple',
    type: 'dark',
    icon: '🌌',
    colors: {
      primary: '#8B5CF6',
      background: '#1E1B4B',
      text: '#E0E7FF',
      inputBorder: '#8B5CF64D',
      placeholder: '#A78BFA80'
    },
    preview: '#8B5CF6',
    isDefault: false
  },
  {
    name: 'Emerald Glow',
    id: 'theme-emerald-glow',
    type: 'light',
    icon: '💚',
    colors: {
      primary: '#10B981',
      background: '#ECFDF5',
      text: '#064E3B',
      inputBorder: '#10B9814D',
      placeholder: '#059F6980'
    },
    preview: '#10B981',
    isDefault: false
  },
  {
    name: 'Cyber Blue',
    id: 'theme-cyber-blue',
    type: 'dark',
    icon: '⚡',
    colors: {
      primary: '#06B6D4',
      background: '#164E63',
      text: '#E0F7FA',
      inputBorder: '#06B6D44D',
      placeholder: '#0891B280'
    },
    preview: '#06B6D4',
    isDefault: false
  }
];

async function seedThemes() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://mongo:27017/bform');
    console.log('✅ Connected to MongoDB');

    // Clear existing themes
    await Theme.deleteMany({});
    console.log('🗑️  Cleared existing themes');

    // Insert initial themes
    await Theme.insertMany(INITIAL_THEMES);
    console.log(`✅ Added ${INITIAL_THEMES.length} themes`);

    console.log('🎨 Theme seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Theme seeding failed:', error);
    process.exit(1);
  }
}

seedThemes();