import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Turnstile from 'react-turnstile';
import type { Form, FormField } from '../../types';

interface FormResponse {
  [fieldId: string]: any;
}

import ImageUploadField from '../../components/FormFields/ImageUploadField';

const FormView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [responses, setResponses] = useState<FormResponse>({});
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [themeShapes, setThemeShapes] = useState<any[]>([]);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileLoaded, setTurnstileLoaded] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingAccepted, setMarketingAccepted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { register, watch, setValue, formState: { errors }, trigger } = useForm();

  useEffect(() => {
    if (slug === 'preview') {
      const previewData = localStorage.getItem('preview_form');
      if (previewData) {
        try {
          const formData = JSON.parse(previewData);
          setForm(formData);
        } catch {
          toast.error('Önizleme verileri yüklenemedi');
          navigate('/');
        }
      } else {
        toast.error('Önizleme verileri bulunamadı');
        navigate('/');
      }
      setIsLoading(false);
    } else if (slug) {
      loadForm(slug);
    }
  }, [slug]);

  useEffect(() => {
    if (form && form.fields && form.fields[currentStep]) {
      const currentField = form.fields[currentStep];
      const savedValue = responses[currentField.id];
      if (savedValue !== undefined) {
        setValue(currentField.id, savedValue);
      }
    }
  }, [currentStep, form, responses, setValue]);

  useEffect(() => {
    const applyTheme = async () => {
      if (form?.styling) {
        const root = document.documentElement;
        if (form.styling.theme && form.styling.theme !== 'no-theme') {
          try {
            const response = await fetch(`/api/themes?t=${Date.now()}`);
            if (response.ok) {
              const themes = await response.json();
              const selectedTheme = themes.find((theme: any) => theme.id === form.styling.theme);
              if (selectedTheme) {
                root.style.setProperty('--primary-color', selectedTheme.colors.primary);
                root.style.setProperty('--theme-background', selectedTheme.colors.background);
                root.style.setProperty('--text-color', selectedTheme.colors.text);
                root.style.setProperty('--input-border-color', selectedTheme.colors.inputBorder);
                root.style.setProperty('--placeholder-color', selectedTheme.colors.placeholder);
                setThemeShapes(selectedTheme.shapes?.enabled ? selectedTheme.shapes.shapes : []);
                return;
              }
            }
          } catch {}
        }
        root.style.setProperty('--primary-color', form.styling.customColors?.primary || form.styling.primaryColor || '#3B82F6');
        root.style.setProperty('--theme-background', form.styling.customColors?.background || form.styling.backgroundColor || '#FFFFFF');
        root.style.setProperty('--text-color', form.styling.customColors?.text || form.styling.textColor || '#1F2937');
        root.style.setProperty('--input-border-color', form.styling.customColors?.inputBorder || `${form.styling.primaryColor}4D` || '#3B82F64D');
        root.style.setProperty('--placeholder-color', form.styling.customColors?.placeholder || '#64748B80');
        setThemeShapes([]);
      }
    };
    applyTheme();
  }, [form?.styling]);

  const loadForm = async (formSlug: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/forms/public/${formSlug}`);
      if (response.ok) {
        const formData = await response.json();
        setForm(formData);
      } else {
        toast.error('Form bulunamadı');
        navigate('/');
      }
    } catch {
      toast.error('Form yüklenemedi');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    try {
      const id = toast.loading('Görsel yükleniyor...');
      const response = await fetch('/api/upload/image', { method: 'POST', body: formData });
      const result = await response.json();
      toast.dismiss(id);
      if (result.success) return result.data.url;
      throw new Error(result.message || 'Görsel yüklenemedi');
    } catch (error: any) {
      toast.error(`Yükleme hatası: ${error.message}`);
      return null;
    }
  };

  const handleNext = async () => {
    if (!form || isSubmitting) return;
    const currentField = form.fields[currentStep];
    if (!currentField) return;

    const isValid = await trigger(currentField.id);
    if (!isValid) return;

    const currentValue = watch(currentField.id);
    setResponses(prev => ({ ...prev, [currentField.id]: currentValue }));

    if (currentStep < form.fields.length - 1) {
      if (isTransitioning) return;
      setIsTransitioning(true);
      if (containerRef.current) {
        containerRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        containerRef.current.style.transform = 'translateY(-50px)';
        containerRef.current.style.opacity = '0';
      }
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        const nextField = form.fields[currentStep + 1];
        if (nextField) {
          const savedValue = responses[nextField.id];
          setValue(nextField.id, savedValue || '');
        }
        if (containerRef.current) {
          containerRef.current.style.transform = 'translateY(50px)';
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.style.transform = 'translateY(0)';
              containerRef.current.style.opacity = '1';
            }
          });
          setTimeout(() => {
            if (containerRef.current) containerRef.current.style.transition = '';
            setIsTransitioning(false);
          }, 300);
        }
      }, 150);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!form) return;
    try {
      setIsSubmitting(true);
      const currentField = form.fields[currentStep];
      const currentValue = watch(currentField.id);
      const finalResponses = { ...responses, [currentField.id]: currentValue };

      const formattedResponses = Object.entries(finalResponses)
        .filter(([, value]) => value !== '' && value !== null && value !== undefined)
        .map(([fieldId, value]) => {
          const field = form.fields.find(f => f.id === fieldId);
          return {
            fieldId,
            fieldLabel: field?.label || 'Bilinmeyen Alan',
            fieldType: field?.type || 'text',
            value: String(value),
          };
        });

      const response = await fetch(`/api/responses/submit/${form.slug}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          responses: formattedResponses,
          cf_token: turnstileToken,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message || form.settings?.successMessage || 'Formunuz başarıyla gönderildi!');
        setIsSubmitted(true);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Form gönderilemedi');
      }
    } catch (error: any) {
      toast.error(`Form gönderme hatası: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const { ref, ...rest } = register(field.id, field.validations);

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleNext();
      }
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'number':
      case 'textarea': {
        const InputComponent: any = field.type === 'textarea' ? 'textarea' : 'input';
        return (
          <InputComponent
            {...rest}
            ref={ref}
            id={field.id}
            type={field.type === 'phone' ? 'tel' : field.type}
            placeholder={field.placeholder || 'Cevabınızı buraya yazın...'}
            className="typeform-input"
            onKeyDown={handleKeyDown}
            rows={field.type === 'textarea' ? 4 : undefined}
          />
        );
      }
      case 'image':
        return <ImageUploadField field={field} handleImageUpload={handleImageUpload} setValue={setValue} watch={watch} />;
      case 'date':
        return (
          <input
            {...rest}
            ref={ref}
            id={field.id}
            type="date"
            className="typeform-input"
            lang="tr"
            onKeyDown={handleKeyDown}
          />
        );
      case 'time': {
        const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
          const [hours, minutes] = e.target.value.split(':').map(Number);
          const roundedMinutes = Math.round(minutes / 15) * 15;
          const formattedMinutes = String(roundedMinutes).padStart(2, '0');
          const formattedHours = String(hours).padStart(2, '0');
          setValue(field.id, `${formattedHours}:${formattedMinutes}`, { shouldDirty: true, shouldTouch: true });
          // @ts-ignore
          rest.onChange?.(e);
        };
        return (
          <input
            {...rest}
            ref={ref}
            onChange={handleTimeChange}
            id={field.id}
            type="time"
            className="typeform-input"
            step="900"
            onKeyDown={handleKeyDown}
          />
        );
      }
      default:
        return <p>Desteklenmeyen alan türü: {field.type}</p>;
    }
  };

  if (isLoading) return <div className="loading-screen">Yükleniyor...</div>;
  if (!form || !form.fields || form.fields.length === 0)
    return <div className="error-screen">Form yüklenemedi veya formda hiç alan yok.</div>;

  const currentField = form.fields[currentStep];

  return (
    <div
      className="typeform-container"
      style={{ '--primary-color': (form.styling?.primaryColor as any) } as React.CSSProperties}
    >
      <main className="typeform-question-container" ref={containerRef}>
        {!isSubmitted ? (
          <div className="typeform-question">
            <div className="question-header">
              <h1 className="question-text">{currentField.label}</h1>
              {currentField.description && <p className="question-description">{currentField.description}</p>}
            </div>

            <div className="answer-container">
              {renderField(currentField)}
              {errors[currentField.id] && (
                <p className="error-message">{errors[currentField.id]?.message as string}</p>
              )}
            </div>

            <div className="typeform-navigation flex flex-col items-stretch gap-4">
              {currentStep === form.fields.length - 1 && (
                <>
                  <div className="consent-checkboxes flex flex-col gap-3">
                    <div className="checkbox-item">
                      <label className="flex items-center gap-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={privacyAccepted}
                          onChange={(e) => setPrivacyAccepted(e.target.checked)}
                          className="mt-0 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 leading-6">
                          Kişisel verilerimin işlenmesi ile alakalı{' '}
                          <a
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            Gizlilik Politikası
                          </a>
                          'nı okudum, anladım.
                        </span>
                      </label>
                    </div>
                    <div className="checkbox-item">
                      <label className="flex items-center gap-5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marketingAccepted}
                          onChange={(e) => setMarketingAccepted(e.target.checked)}
                          className="mt-0 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700 leading-6">
                          Tarafıma{' '}
                          <a
                            href="#"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 underline"
                            onClick={(e) => e.preventDefault()}
                          >
                            ticari elektronik ileti
                          </a>
                          ' gönderilmesini onaylıyorum. Bu onayı istediğim zaman geri alabilirim.
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="turnstile-container text-center">
                    <Turnstile
                      sitekey="0x4AAAAAABqo_UdgY4xCpbat"
                      onVerify={(token) => setTurnstileToken(token)}
                      onExpire={() => setTurnstileToken(null)}
                      onError={() => toast.error('Captcha yüklenemedi.')}
                      onLoad={() => setTurnstileLoaded(true)}
                      theme="light"
                    />
                  </div>
                </>
              )}

              <button
                type="button"
                onClick={handleNext}
                disabled={
                  isSubmitting ||
                  (currentStep === form.fields.length - 1 && (!turnstileToken || !privacyAccepted || !marketingAccepted))
                }
                className="nav-button next-button w-full"
              >
                {isSubmitting ? 'Gönderiliyor...' : currentStep < form.fields.length - 1 ? 'OK' : 'Gönder'}
              </button>
            </div>
          </div>
        ) : (
          <div className="success-container">
            <div className="success-header">
              <div className="success-icon">🎉</div>
              <h1 className="success-title">{successMessage}</h1>
              <p className="success-message">Yanıtlarınız için teşekkür ederiz.</p>
            </div>
            <div className="success-actions">
              <a
                href="https://www.instagram.com/bdrmotion"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-instagram"
              >
                <svg className="instagram-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
                Instagram'dan Takip Et
              </a>
              <button onClick={() => navigate('/')} className="btn-home">
                🏠 Anasayfaya Dön
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default FormView;
