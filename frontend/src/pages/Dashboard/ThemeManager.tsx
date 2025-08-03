import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../../components/Layout/Layout';
import { api } from '../../api/client';
import { toast } from 'react-hot-toast';

interface Theme {
  _id: string;
  name: string;
  id: string;
  type: 'light' | 'dark';
  icon: string;
  colors: {
    primary: string;
    background: string;
    text: string;
    inputBorder: string;
    placeholder: string;
  };
  preview: string;
  isDefault: boolean;
  shapes?: {
    enabled: boolean;
    shapes: Array<{
      type: 'circle' | 'triangle' | 'square' | 'blob';
      size: number;
      color: string;
      opacity: number;
      x: number;
      y: number;
      rotation: number;
    }>;
  };
  createdAt: string;
}

const ThemeManager: React.FC = () => {
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTheme, setEditingTheme] = useState<Theme | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    id: '',
    type: 'light' as 'light' | 'dark',
    icon: '🎨',
    colors: {
      primary: '#3B82F6',
      background: '#FFFFFF',
      text: '#1F2937',
      inputBorder: '#3B82F64D',
      placeholder: '#64748B80'
    },
    preview: '#3B82F6',
    isDefault: false,
    shapes: {
      enabled: false,
      shapes: [] as Array<{
        type: 'circle' | 'triangle' | 'square' | 'blob';
        size: number;
        color: string;
        opacity: number;
        x: number;
        y: number;
        rotation: number;
      }>
    }
  });

  // Convert hex to HSL
  const hexToHsl = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    return [h * 360, s * 100, l * 100];
  };

  const generateRandomShapes = () => {
    const shapeTypes = ['circle', 'triangle', 'square', 'blob'] as const;
    const shapes = [];
    const baseColor = formData.colors.background;
    
    // Convert background color to HSL for better color harmonies
    const [baseHue, baseSat, baseLight] = hexToHsl(baseColor);
    
    // Generate 3-6 random shapes
    const shapeCount = Math.floor(Math.random() * 4) + 3;
    
    for (let i = 0; i < shapeCount; i++) {
      // Create harmonious color variations
      let colorVariant;
      
      if (baseLight > 50) {
        // Light background - use darker, more saturated variations
        const hueVariation = baseHue + (Math.random() * 60 - 30);
        const satVariation = Math.min(100, Math.max(20, baseSat + Math.random() * 40 - 10));
        const lightVariation = Math.max(10, baseLight - Math.random() * 40 - 20);
        colorVariant = `hsl(${hueVariation % 360}, ${satVariation}%, ${lightVariation}%)`;
      } else {
        // Dark background - use lighter variations
        const hueVariation = baseHue + (Math.random() * 40 - 20);
        const satVariation = Math.min(100, Math.max(30, baseSat + Math.random() * 30));
        const lightVariation = Math.min(90, baseLight + Math.random() * 50 + 20);
        colorVariant = `hsl(${hueVariation % 360}, ${satVariation}%, ${lightVariation}%)`;
      }
      
      shapes.push({
        type: shapeTypes[Math.floor(Math.random() * shapeTypes.length)],
        size: Math.random() * 200 + 50, // 50-250px
        color: colorVariant,
        opacity: Math.random() * 0.2 + 0.1, // 0.1-0.3 (daha şeffaf)
        x: Math.random() * 100, // 0-100%
        y: Math.random() * 100, // 0-100%
        rotation: Math.random() * 360
      });
    }
    
    setFormData(prev => ({
      ...prev,
      shapes: {
        enabled: true,
        shapes
      }
    }));
  };

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setIsLoading(true);
      const response = await api.themes.getAll();
      setThemes(response.data);
    } catch (error) {
      console.error('Load themes error:', error);
      toast.error('Temalar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      console.log('ThemeManager: Submitting theme, editingTheme:', editingTheme);
      console.log('ThemeManager: Form data:', formData);
      
      if (editingTheme) {
        console.log('ThemeManager: Updating theme with ID:', editingTheme._id);
        const result = await api.themes.update(editingTheme._id, formData);
        console.log('ThemeManager: Update result:', result);
        toast.success('Tema güncellendi');
      } else {
        console.log('ThemeManager: Creating new theme');
        const result = await api.themes.create(formData);
        console.log('ThemeManager: Create result:', result);
        toast.success('Tema oluşturuldu');
      }
      
      setEditingTheme(null);
      setShowCreateForm(false);
      resetForm();
      await loadThemes();
      console.log('ThemeManager: Theme operation completed successfully');
    } catch (error: any) {
      console.error('ThemeManager: Submit error:', error);
      toast.error(error.response?.data?.message || 'Hata oluştu');
    }
  };

  const handleDelete = async (themeId: string) => {
    if (!confirm('Bu temayı silmek istediğinizden emin misiniz?')) return;
    
    try {
      await api.themes.delete(themeId);
      toast.success('Tema silindi');
      loadThemes();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Silme hatası');
    }
  };

  const handleEdit = (theme: Theme) => {
    setEditingTheme(theme);
    setFormData({
      name: theme.name,
      id: theme.id,
      type: theme.type,
      icon: theme.icon,
      colors: theme.colors,
      preview: theme.preview,
      isDefault: theme.isDefault,
      shapes: (theme as any).shapes || {
        enabled: false,
        shapes: []
      }
    });
    setShowCreateForm(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      id: '',
      type: 'light',
      icon: '🎨',
      colors: {
        primary: '#3B82F6',
        background: '#FFFFFF',
        text: '#1F2937',
        inputBorder: '#3B82F64D',
        placeholder: '#64748B80'
      },
      preview: '#3B82F6',
      isDefault: false,
      shapes: {
        enabled: false,
        shapes: []
      }
    });
  };

  const generateThemeId = (name: string) => {
    const id = name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
    
    setFormData(prev => ({ ...prev, id: `theme-${id}` }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Temalar yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tema Yönetimi</h1>
            <p className="text-gray-600 mt-2">Form temalarını oluşturun ve yönetin</p>
          </div>
          <button
            onClick={() => {
              setShowCreateForm(true);
              setEditingTheme(null);
              resetForm();
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <span>+</span>
            Yeni Tema
          </button>
        </div>

        {/* Create/Edit Form */}
        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">
              {editingTheme ? 'Tema Düzenle' : 'Yeni Tema Oluştur'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema Adı
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData(prev => ({ ...prev, name: e.target.value }));
                      if (!editingTheme) generateThemeId(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Örn: Midnight Blue"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tema ID
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => setFormData(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="theme-midnight-blue"
                    disabled={!!editingTheme}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tip
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'light' | 'dark' }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    İkon
                  </label>
                  <input
                    type="text"
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="🎨"
                    required
                  />
                </div>
              </div>

              {/* Colors */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Renkler</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Primary Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.colors.primary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value },
                          preview: e.target.value
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colors.primary}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, primary: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Background Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.colors.background}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, background: e.target.value }
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colors.background}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, background: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Text Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.colors.text}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colors.text}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, text: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Placeholder Color
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={formData.colors.placeholder?.replace('80', '') || '#64748B'}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, placeholder: e.target.value + '80' }
                        }))}
                        className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.colors.placeholder}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          colors: { ...prev.colors, placeholder: e.target.value }
                        }))}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Shapes */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Arkaplan Şekilleri</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.shapes.enabled}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          shapes: { ...prev.shapes, enabled: e.target.checked }
                        }))}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">Random şekiller kullan</span>
                    </label>
                    
                    {formData.shapes.enabled && (
                      <button
                        type="button"
                        onClick={generateRandomShapes}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        🎲 Yeni Şekiller Oluştur
                      </button>
                    )}
                  </div>
                  
                  {formData.shapes.enabled && formData.shapes.shapes.length > 0 && (
                    <div className="text-xs text-gray-500">
                      {formData.shapes.shapes.length} şekil oluşturuldu
                    </div>
                  )}
                </div>
              </div>

              {/* Demo Preview */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-medium mb-4">Önizleme</h3>
                <div 
                  className="demo-preview relative p-6 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden"
                  style={{ 
                    backgroundColor: formData.colors.background,
                    color: formData.colors.text,
                    minHeight: '300px',
                    '--placeholder-color': formData.colors.placeholder
                  } as any}
                >
                  {/* Background Shapes */}
                  {formData.shapes.enabled && formData.shapes.shapes.map((shape, index) => (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        left: `${shape.x}%`,
                        top: `${shape.y}%`,
                        width: `${shape.size}px`,
                        height: `${shape.size}px`,
                        opacity: shape.opacity,
                        transform: `rotate(${shape.rotation}deg)`,
                        backgroundColor: shape.color,
                        borderRadius: shape.type === 'circle' ? '50%' : 
                                     shape.type === 'blob' ? '30% 70% 70% 30% / 30% 30% 70% 70%' : '0',
                        clipPath: shape.type === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : 'none',
                        zIndex: 1
                      }}
                    />
                  ))}
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2">Örnek Soru</h4>
                      <p className="text-sm opacity-75">Bu tema böyle görünecek</p>
                    </div>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Adınızı yazın..."
                        className="demo-preview-input w-full px-4 py-3 border-0 border-b-2 bg-transparent focus:outline-none relative z-20"
                        style={{ 
                          borderBottomColor: formData.colors.primary,
                          color: formData.colors.text,
                          '--placeholder-color': formData.colors.placeholder
                        } as any}
                      />
                      <button
                        className="px-6 py-2 rounded-lg text-white font-medium relative z-20"
                        style={{ backgroundColor: formData.colors.primary }}
                      >
                        Gönder
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isDefault" className="ml-2 text-sm text-gray-700">
                  Varsayılan tema olarak ayarla
                </label>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingTheme(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingTheme ? 'Güncelle' : 'Oluştur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Themes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div key={theme._id} className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{theme.icon}</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">{theme.name}</h3>
                    <p className="text-sm text-gray-500">{theme.type}</p>
                  </div>
                </div>
                {theme.isDefault && (
                  <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                    Varsayılan
                  </span>
                )}
              </div>
              
              <div className="mb-4">
                <div 
                  className="w-full h-3 rounded-full mb-2" 
                  style={{ backgroundColor: theme.preview }}
                />
                <div className="grid grid-cols-3 gap-2">
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: theme.colors.primary }}
                    title="Primary"
                  />
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: theme.colors.background }}
                    title="Background"
                  />
                  <div 
                    className="w-full h-8 rounded border"
                    style={{ backgroundColor: theme.colors.text }}
                    title="Text"
                  />
                </div>
              </div>
              
              <div className="text-xs text-gray-500 mb-4">
                <p>ID: {theme.id}</p>
                <p>Oluşturulma: {new Date(theme.createdAt).toLocaleDateString('tr-TR')}</p>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(theme)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded hover:bg-blue-100 text-sm"
                >
                  Düzenle
                </button>
                {!theme.isDefault && (
                  <button
                    onClick={() => handleDelete(theme._id)}
                    className="flex-1 bg-red-50 text-red-700 px-3 py-2 rounded hover:bg-red-100 text-sm"
                  >
                    Sil
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {themes.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg mb-4">🎨</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz tema yok</h3>
            <p className="text-gray-500 mb-4">İlk temanızı oluşturun</p>
            <button
              onClick={() => {
                setShowCreateForm(true);
                resetForm();
              }}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Yeni Tema Oluştur
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ThemeManager;