import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import { generateId } from '../../utils';
import { api } from '../../api/client';
import type { Form, FormField, FieldType } from '../../types';

// Field types with icons
const FIELD_TYPES: Array<{
  type: FieldType;
  label: string;
  icon: string;
  description: string;
}> = [
  { type: 'text', label: 'Kısa Metin', icon: '📝', description: 'Tek satır metin girişi' },
  { type: 'textarea', label: 'Uzun Metin', icon: '📄', description: 'Çok satırlı metin girişi' },
  { type: 'email', label: 'Email', icon: '📧', description: 'Email adresi girişi' },
  { type: 'phone', label: 'Telefon', icon: '📞', description: 'Telefon numarası girişi' },
  { type: 'number', label: 'Sayı', icon: '🔢', description: 'Numerik değer girişi' },
  { type: 'select', label: 'Seçim Listesi', icon: '📋', description: 'Dropdown menüden seçim' },
  { type: 'radio', label: 'Tek Seçim', icon: '🔘', description: 'Radio button ile tek seçim' },
  { type: 'checkbox', label: 'Çok Seçim', icon: '☑️', description: 'Checkbox ile çok seçim' },
  { type: 'date', label: 'Tarih', icon: '📅', description: 'Tarih seçici' },
  { type: 'time', label: 'Saat', icon: '🕐', description: 'Saat seçici' },
  { type: 'rating', label: 'Puanlama', icon: '⭐', description: 'Yıldızlı puanlama sistemi' },
  { type: 'yes-no', label: 'Evet/Hayır', icon: '✅', description: 'İkili seçim (Evet/Hayır)' },
  { type: 'image', label: 'Görsel Yükleme', icon: '🖼️', description: 'Fotoğraf/görsel yükleme alanı' },
];

// Static fallback themes
const FALLBACK_THEMES = [
  { id: 'no-theme', name: 'No Theme', type: 'custom', icon: '⚪', preview: '#E5E7EB' },
  { id: 'theme-classic-blue', name: 'Classic Blue', type: 'light', icon: '🔵', preview: '#3B82F6' },
];

const FormBuilder: React.FC = () => {
  const { formId } = useParams();
  const navigate = useNavigate();
  const [availableThemes, setAvailableThemes] = useState(FALLBACK_THEMES);
  const [form, setForm] = useState<Partial<Form>>({
    title: 'Başlıksız Form',
    description: '',
    fields: [],
    settings: {
      isPublic: true,
      allowMultipleSubmissions: false,
      requireAuth: false,
      submitButton: {
        text: 'Gönder',
        color: '#3B82F6'
      },
      successMessage: 'Formunuz başarıyla gönderildi!',
      notifications: {
        email: {
          enabled: true,
          to: [],
          subject: '',
          template: ''
        },
        calendar: {
          enabled: false,
          title: '',
          duration: 30
        },
        whatsapp: {
          enabled: false,
          template: '',
          to: ''
        }
      }
    },
    styling: {
      primaryColor: '#3B82F6',
      backgroundColor: '#FFFFFF',
      textColor: '#1F2937',
      fontFamily: 'Inter',
      theme: 'no-theme',
      customColors: {
        primary: '#3B82F6',
        background: '#F8FAFC',
        text: '#1E293B',
        inputBorder: 'rgba(59, 130, 246, 0.3)',
        placeholder: 'rgba(100, 116, 139, 0.6)'
      }
    }
  });

  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [isLoading, setIsLoading] = useState(!!formId && formId !== 'new');

  const { register, control, handleSubmit, watch, setValue, formState: { errors } } = useForm();

  // Load themes on component mount
  useEffect(() => {
    loadThemes();
  }, []);

  // Load existing form if editing
  useEffect(() => {
    if (formId && formId !== 'new') {
      loadForm(formId);
    }
  }, [formId]);

  const loadThemes = async () => {
    try {
      const response = await api.themes.getAll();
      const themes = [
        { id: 'no-theme', name: 'No Theme', type: 'custom', icon: '⚪', preview: '#E5E7EB' },
        ...response.data.map((theme: any) => ({
          id: theme.id,
          name: theme.name,
          type: theme.type,
          icon: theme.icon,
          preview: theme.preview
        }))
      ];
      setAvailableThemes(themes);
    } catch (error) {
      console.error('Load themes error:', error);
      // Fallback themes already set
    }
  };

  const loadForm = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/forms/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const formData = await response.json();
        // If response has a 'form' property, use that; otherwise use the response directly
        const actualForm = formData.form || formData;
        setForm(actualForm);
        console.log('Loaded form:', actualForm);
      } else {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        toast.error('Form yüklenemedi: ' + (errorData.message || 'Bilinmeyen hata'));
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Load form error:', error);
      toast.error('Form yükleme hatası');
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  const addField = (type: FieldType) => {
    const newField: FormField = {
      id: generateId(),
      type,
      label: `${FIELD_TYPES.find(f => f.type === type)?.label || 'Alan'} ${(form.fields?.length || 0) + 1}`,
      description: '',
      placeholder: '',
      required: false,
      options: type === 'select' || type === 'radio' || type === 'checkbox' ? [
        { label: 'Seçenek 1', value: 'option1' },
        { label: 'Seçenek 2', value: 'option2' }
      ] : undefined,
      validation: {},
      settings: {}
    };

    setForm(prev => ({
      ...prev,
      fields: [...(prev.fields || []), newField]
    }));
    setSelectedField(newField);
  };

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    console.log('🔍 FormBuilder updateField:', fieldId, updates);
    
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.map(field => 
        field.id === fieldId ? { ...field, ...updates } : field
      ) || []
    }));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const removeField = (fieldId: string) => {
    setForm(prev => ({
      ...prev,
      fields: prev.fields?.filter(field => field.id !== fieldId) || []
    }));
    
    if (selectedField && selectedField.id === fieldId) {
      setSelectedField(null);
    }
  };

  const moveField = (fromIndex: number, toIndex: number) => {
    const fields = [...(form.fields || [])];
    const [movedField] = fields.splice(fromIndex, 1);
    fields.splice(toIndex, 0, movedField);
    
    setForm(prev => ({
      ...prev,
      fields
    }));
  };

  const saveForm = async () => {
    if (!form.title?.trim()) {
      toast.error('Form başlığı gerekli!');
      return;
    }
    
    if (!form.fields || form.fields.length === 0) {
      toast.error('En az bir alan eklemelisiniz!');
      return;
    }

    console.log('🔍 Saving form with fields:', form.fields.map(f => ({ 
      id: f.id, 
      type: f.type, 
      isAppointment: f.isAppointment 
    })));

    const formPayload = JSON.stringify(form);
    console.log('🔍 Actual API payload:', formPayload);
    console.log('🔍 Parsed back payload fields:', JSON.parse(formPayload).fields?.map(f => ({ id: f.id, type: f.type, isAppointment: f.isAppointment })));

    try {
      const isEditing = formId && formId !== 'new';
      const url = isEditing ? `/api/forms/${formId}` : '/api/forms';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formPayload
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(isEditing ? 'Form başarıyla güncellendi!' : 'Form başarıyla kaydedildi!');
        navigate('/dashboard');
      } else {
        throw new Error('Form kaydedilemedi');
      }
    } catch (error) {
      toast.error('Form kaydedilirken hata oluştu');
      console.error('Save error:', error);
    }
  };

  const publishForm = async () => {
    await saveForm(); // First save, then it's automatically published
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner mx-auto mb-4"></div>
          <p className="text-gray-600">Form yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="text-gray-400 hover:text-gray-600"
              >
                ← Geri
              </button>
              <div>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                  className="text-lg font-semibold bg-transparent border-none outline-none focus:bg-gray-50 px-2 py-1 rounded"
                  placeholder="Form başlığı..."
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`btn ${previewMode ? 'btn-primary' : 'btn-outline'}`}
              >
                {previewMode ? '📝 Düzenle' : '👀 Önizle'}
              </button>
              
              {/* Full Screen Preview Button */}
              <button
                onClick={() => {
                  // Open preview in new tab
                  const previewData = {
                    ...form,
                    _id: 'preview',
                    slug: 'preview'
                  };
                  localStorage.setItem('preview_form', JSON.stringify(previewData));
                  window.open('/preview', '_blank');
                }}
                className="btn btn-secondary"
                disabled={!form.fields || form.fields.length === 0}
              >
                🌟 Tam Ekran
              </button>
              
              <button
                onClick={saveForm}
                className="btn btn-outline"
              >
                💾 Kaydet
              </button>
              <button
                onClick={publishForm}
                className="btn btn-success"
              >
                🚀 Yayınla
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Field Types Sidebar */}
          {!previewMode && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Alan Türleri</h3>
                <div className="space-y-2">
                  {FIELD_TYPES.map((fieldType) => (
                    <button
                      key={fieldType.type}
                      onClick={() => addField(fieldType.type)}
                      className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border border-gray-200 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-lg">{fieldType.icon}</span>
                        <div>
                          <div className="font-medium text-sm">{fieldType.label}</div>
                          <div className="text-xs text-gray-500">{fieldType.description}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Form Builder */}
                      <div className={`${previewMode ? 'lg:col-span-4' : 'lg:col-span-2'}`}>
            <div className="bg-white rounded-xl shadow-soft p-8 min-h-96">
              {/* Form Title & Description Editor (Always Visible) */}
              <div className="text-center mb-8 border-b border-gray-200 pb-6">
                {previewMode ? (
                  <>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">
                      {form.title}
                    </h1>
                    {form.description && (
                      <p className="text-lg text-gray-600">
                        {form.description}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))}
                      className="text-3xl font-bold text-center w-full bg-transparent border-none outline-none focus:bg-gray-50 px-4 py-2 rounded mb-4"
                      placeholder="Form başlığını girin..."
                    />
                    <textarea
                      value={form.description || ''}
                      onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                      className="text-lg text-center w-full bg-transparent border-none outline-none focus:bg-gray-50 px-4 py-2 rounded resize-none"
                      placeholder="Form açıklaması (opsiyonel)..."
                      rows={2}
                    />
                  </>
                )}
              </div>

              {form.fields && form.fields.length > 0 ? (
                <div className="space-y-6">

                  {/* Form Fields */}
                  {form.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className={`field-item ${selectedField?.id === field.id ? 'active' : ''}`}
                      onClick={() => !previewMode && setSelectedField(field)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <label className="field-label">
                          {field.label}
                          {field.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        {!previewMode && (
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index > 0) moveField(index, index - 1);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={index === 0}
                            >
                              ↑
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (index < form.fields!.length - 1) moveField(index, index + 1);
                              }}
                              className="text-gray-400 hover:text-gray-600"
                              disabled={index === form.fields!.length - 1}
                            >
                              ↓
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(field.id);
                              }}
                              className="text-red-400 hover:text-red-600"
                            >
                              🗑️
                            </button>
                          </div>
                        )}
                      </div>

                      {field.description && (
                        <p className="field-help mb-3">{field.description}</p>
                      )}

                      {/* Field Rendering */}
                      {field.type === 'text' && (
                        <input
                          type="text"
                          className="form-input"
                          placeholder={field.placeholder}
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'textarea' && (
                        <textarea
                          className="form-textarea"
                          rows={4}
                          placeholder={field.placeholder}
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'email' && (
                        <input
                          type="email"
                          className="form-input"
                          placeholder="ornek@eposta.com"
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'phone' && (
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="05XX XXX XX XX"
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'number' && (
                        <input
                          type="number"
                          className="form-input"
                          placeholder={field.placeholder}
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'select' && (
                        <select className="form-select" disabled={!previewMode}>
                          <option value="">Seçiniz...</option>
                          {field.options?.map((option, idx) => (
                            <option key={idx} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      )}

                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center">
                              <input
                                type="radio"
                                name={field.id}
                                value={option.value}
                                className="form-radio"
                                disabled={!previewMode}
                              />
                              <span className="ml-2">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'checkbox' && (
                        <div className="space-y-2">
                          {field.options?.map((option, idx) => (
                            <label key={idx} className="flex items-center">
                              <input
                                type="checkbox"
                                value={option.value}
                                className="form-checkbox"
                                disabled={!previewMode}
                              />
                              <span className="ml-2">{option.label}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {field.type === 'date' && (
                        <input
                          type="date"
                          className="form-input"
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'time' && (
                        <input
                          type="time"
                          className="form-input"
                          disabled={!previewMode}
                        />
                      )}

                      {field.type === 'rating' && (
                        <div className="flex space-x-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              className="text-2xl text-gray-300 hover:text-yellow-400"
                              disabled={!previewMode}
                            >
                              ⭐
                            </button>
                          ))}
                        </div>
                      )}

                      {field.type === 'yes-no' && (
                        <div className="flex space-x-4">
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={field.id}
                              value="yes"
                              className="form-radio"
                              disabled={!previewMode}
                            />
                            <span className="ml-2">Evet</span>
                          </label>
                          <label className="flex items-center">
                            <input
                              type="radio"
                              name={field.id}
                              value="no"
                              className="form-radio"
                              disabled={!previewMode}
                            />
                            <span className="ml-2">Hayır</span>
                          </label>
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Submit Button */}
                  {previewMode && (
                    <div className="text-center pt-8">
                      <button
                        type="submit"
                        className="btn-primary btn-lg"
                        style={{ backgroundColor: form.settings?.submitButton?.color }}
                      >
                        {form.settings?.submitButton?.text || 'Gönder'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-4xl">📝</span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    Form oluşturmaya başlayın
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Sol taraftaki alan türlerinden birini seçerek formunuza ilk alanı ekleyin.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Field Settings Sidebar */}
          {!previewMode && selectedField && (
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-soft p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Alan Ayarları</h3>
                
                <div className="space-y-4">
                  <div className="field-group">
                    <label className="field-label">Alan Etiketi</label>
                    <input
                      type="text"
                      className="form-input"
                      value={selectedField.label}
                      onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                    />
                  </div>

                  <div className="field-group">
                    <label className="field-label">Açıklama</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      value={selectedField.description}
                      onChange={(e) => updateField(selectedField.id, { description: e.target.value })}
                    />
                  </div>

                  {/* Show placeholder input only for text, textarea, number fields */}
                  {!['email', 'phone'].includes(selectedField.type) && (
                    <div className="field-group">
                      <label className="field-label">Placeholder</label>
                      <input
                        type="text"
                        className="form-input"
                        value={selectedField.placeholder || ''}
                        onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                      />
                    </div>
                  )}

                  {/* Show info for email and phone fields */}
                  {selectedField.type === 'email' && (
                    <div className="field-group">
                      <label className="field-label">Placeholder</label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        📧 Email alanı otomatik olarak <code>"ornek@eposta.com"</code> placeholder'ını kullanır.
                      </p>
                    </div>
                  )}

                  {selectedField.type === 'phone' && (
                    <div className="field-group">
                      <label className="field-label">Placeholder & Format</label>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                        📱 Telefon alanı otomatik olarak:
                        <br />• <code>"05XX XXX XX XX"</code> placeholder gösterir
                        <br />• Otomatik <code>05</code> prefix ekler
                        <br />• Boşluklu format uygular
                      </p>
                    </div>
                  )}

                  <div className="field-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        className="form-checkbox"
                        checked={selectedField.required}
                        onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                      />
                      <span className="ml-2">Zorunlu alan</span>
                    </label>
                  </div>

                  {/* Randevu checkbox for date/time fields */}
                  {(selectedField.type === 'date' || selectedField.type === 'time') && (
                    <div className="field-group">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox"
                          checked={selectedField.isAppointment || false}
                          onChange={(e) => {
                            console.log('🔍 Checkbox changed:', e.target.checked, 'for field:', selectedField.id);
                            updateField(selectedField.id, { isAppointment: e.target.checked });
                          }}
                        />
                        <span className="ml-2">📅 Randevu alanı</span>
                      </label>
                      <p className="text-sm text-gray-600 mt-1">
                        Bu alan işaretlenirse, form gönderildiğinde Google Takvim'e randevu eklenir.
                      </p>
                    </div>
                  )}

                  {/* Options for select, radio, checkbox */}
                  {(selectedField.type === 'select' || selectedField.type === 'radio' || selectedField.type === 'checkbox') && (
                    <div className="field-group">
                      <label className="field-label">Seçenekler</label>
                      <div className="space-y-2">
                        {selectedField.options?.map((option, index) => (
                          <div key={index} className="flex space-x-2">
                            <input
                              type="text"
                              className="form-input flex-1"
                              value={option.label}
                              onChange={(e) => {
                                const newOptions = [...(selectedField.options || [])];
                                newOptions[index] = { ...option, label: e.target.value, value: e.target.value.toLowerCase().replace(/\s+/g, '_') };
                                updateField(selectedField.id, { options: newOptions });
                              }}
                            />
                            <button
                              onClick={() => {
                                const newOptions = selectedField.options?.filter((_, i) => i !== index);
                                updateField(selectedField.id, { options: newOptions });
                              }}
                              className="text-red-500 hover:text-red-700"
                            >
                              🗑️
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const newOptions = [...(selectedField.options || []), { 
                              label: `Seçenek ${(selectedField.options?.length || 0) + 1}`, 
                              value: `option${(selectedField.options?.length || 0) + 1}` 
                            }];
                            updateField(selectedField.id, { options: newOptions });
                          }}
                          className="btn btn-outline w-full"
                        >
                          + Seçenek Ekle
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Form Styling */}
                  <div className="field-group border-t pt-4 mt-6">
                    <label className="field-label mb-3">🎨 Form Tasarımı</label>
                    
                    <>
                      {form.styling?.theme === 'no-theme' && (
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">Arkaplan Rengi</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={form.styling?.backgroundColor || '#FFFFFF'}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  styling: {
                                    ...prev.styling,
                                    backgroundColor: e.target.value
                                  }
                                }))}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={form.styling?.backgroundColor || '#FFFFFF'}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  styling: {
                                    ...prev.styling,
                                    backgroundColor: e.target.value
                                  }
                                }))}
                                className="form-input flex-1 text-xs"
                                placeholder="#FFFFFF"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="text-sm text-gray-600 mb-2 block">Vurgu Rengi</label>
                            <div className="flex items-center space-x-2">
                              <input
                                type="color"
                                value={form.styling?.primaryColor || '#3B82F6'}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  styling: {
                                    ...prev.styling,
                                    primaryColor: e.target.value
                                  }
                                }))}
                                className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={form.styling?.primaryColor || '#3B82F6'}
                                onChange={(e) => setForm(prev => ({
                                  ...prev,
                                  styling: {
                                    ...prev.styling,
                                    primaryColor: e.target.value
                                  }
                                }))}
                                className="form-input flex-1 text-xs"
                                placeholder="#3B82F6"
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Theme Selection */}
                      <div className="field-group border-t pt-4 mt-6">
                        <label className="field-label mb-3">🎨 Tema Seçimi</label>
                        
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          {availableThemes.map((theme) => (
                            <button
                              key={theme.id}
                              onClick={() => setForm(prev => ({
                                ...prev,
                                styling: {
                                  ...prev.styling,
                                  theme: theme.id
                                }
                              }))}
                              className={`p-3 border-2 rounded-lg hover:bg-gray-50 transition-all text-left ${
                                form.styling?.theme === theme.id 
                                  ? 'border-blue-500 bg-blue-50' 
                                  : 'border-gray-300'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <span className="text-lg">{theme.icon}</span>
                                <div>
                                  <div className="text-xs font-medium">{theme.name}</div>
                                  <div className="text-xs text-gray-500">{theme.type}</div>
                                </div>
                              </div>
                              <div 
                                className="w-full h-2 rounded mt-2" 
                                style={{ backgroundColor: theme.preview }}
                              />
                            </button>
                          ))}
                        </div>


                      </div>
                    </>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default FormBuilder;