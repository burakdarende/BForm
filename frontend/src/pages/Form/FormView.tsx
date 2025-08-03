import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import toast from 'react-hot-toast';
import type { Form, FormField } from '../../types';

interface FormResponse {
  [fieldId: string]: any;
}

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
  const containerRef = useRef<HTMLDivElement>(null);

  const { register, control, watch, setValue, formState: { errors }, trigger } = useForm();

  useEffect(() => {
    if (slug === 'preview') {
      // Load preview form from localStorage
      const previewData = localStorage.getItem('preview_form');
      if (previewData) {
        try {
          const formData = JSON.parse(previewData);
          setForm(formData);
          setIsLoading(false);
        } catch (error) {
          toast.error('Önizleme verileri yüklenemedi');
          navigate('/');
        }
      } else {
        toast.error('Önizleme verileri bulunamadı');
        navigate('/');
      }
    } else if (slug) {
      loadForm(slug);
    }
  }, [slug]);

  // Set saved values for fields when step changes
  useEffect(() => {
    if (form && form.fields && form.fields[currentStep]) {
      const currentField = form.fields[currentStep];
      const savedValue = responses[currentField.id];
      if (savedValue !== undefined) {
        setValue(currentField.id, savedValue);
      }
    }
  }, [currentStep, form, responses, setValue]);

  // Apply theme and custom colors
  useEffect(() => {
    const applyTheme = async () => {
      if (form?.styling) {
        console.log('FormView: Applying theme, form styling:', form.styling);
        const root = document.documentElement;
        
        // If form has a theme (not no-theme), load theme from database
        if (form.styling.theme && form.styling.theme !== 'no-theme') {
          console.log('FormView: Loading theme from database:', form.styling.theme);
          try {
            const response = await fetch('/api/themes');
            if (response.ok) {
              const themes = await response.json();
              console.log('FormView: Available themes:', themes);
              const selectedTheme = themes.find((theme: any) => theme.id === form.styling.theme);
              
              if (selectedTheme) {
                console.log('FormView: Found theme, applying colors:', selectedTheme);
                root.style.setProperty('--primary-color', selectedTheme.colors.primary);
                root.style.setProperty('--theme-background', selectedTheme.colors.background);
                root.style.setProperty('--text-color', selectedTheme.colors.text);
                root.style.setProperty('--input-border-color', selectedTheme.colors.inputBorder);
                root.style.setProperty('--placeholder-color', selectedTheme.colors.placeholder);
                console.log('FormView: CSS variables applied');
                return;
              } else {
                console.log('FormView: Theme not found in database');
              }
            }
          } catch (error) {
            console.error('FormView: Failed to load theme:', error);
          }
        } else {
          console.log('FormView: No theme selected or no-theme selected');
        }
        
        // Fallback to custom colors or default values
        console.log('FormView: Using fallback colors');
        root.style.setProperty('--primary-color', form.styling.customColors?.primary || form.styling.primaryColor || '#3B82F6');
        root.style.setProperty('--theme-background', form.styling.customColors?.background || form.styling.backgroundColor || '#FFFFFF');
        root.style.setProperty('--text-color', form.styling.customColors?.text || form.styling.textColor || '#1F2937');
        root.style.setProperty('--input-border-color', form.styling.customColors?.inputBorder || form.styling.primaryColor + '4D' || '#3B82F64D');
        root.style.setProperty('--placeholder-color', form.styling.customColors?.placeholder || '#64748B80');
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
    } catch (error) {
      toast.error('Form yüklenemedi');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNext = async () => {
    if (!form || isSubmitting) return;

    const currentField = form.fields[currentStep];
    if (!currentField) return;

    // Validate current field
    const isValid = await trigger(currentField.id);
    if (!isValid) return;

    // Save current response
    const currentValue = watch(currentField.id);
    setResponses(prev => ({
      ...prev,
      [currentField.id]: currentValue
    }));

    if (currentStep < form.fields.length - 1) {
      // Prevent multiple rapid clicks
      if (isTransitioning) return;
      
      setIsTransitioning(true);
      
      // Single smooth animation
      if (containerRef.current) {
        containerRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        containerRef.current.style.transform = 'translateY(-50px)';
        containerRef.current.style.opacity = '0';
      }
      
      // Change step and animate in
      setTimeout(() => {
        setCurrentStep(currentStep + 1);
        
        // Set saved value for next field if it exists
        const nextField = form.fields[currentStep + 1];
        if (nextField) {
          const savedValue = responses[nextField.id];
          setValue(nextField.id, savedValue || ''); // Set saved value or empty
        }
        
        if (containerRef.current) {
          containerRef.current.style.transform = 'translateY(50px)';
          
          // Immediate animation back to position
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.style.transform = 'translateY(0)';
              containerRef.current.style.opacity = '1';
            }
          });
          
          // Clean up after animation
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.transition = '';
            }
            setIsTransitioning(false);
          }, 300);
        }
      }, 150);
    } else {
      // Submit form
      await handleSubmit();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0 && !isTransitioning) {
      setIsTransitioning(true);
      
      // Save current response before going back
      const currentField = form.fields[currentStep];
      const currentValue = watch(currentField.id);
      setResponses(prev => ({
        ...prev,
        [currentField.id]: currentValue
      }));
      
      if (containerRef.current) {
        containerRef.current.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
        containerRef.current.style.transform = 'translateY(50px)';
        containerRef.current.style.opacity = '0';
      }
      
      setTimeout(() => {
        setCurrentStep(currentStep - 1);
        
        // Set saved value for previous field
        const prevField = form.fields[currentStep - 1];
        if (prevField) {
          const savedValue = responses[prevField.id];
          setValue(prevField.id, savedValue || '');
        }
        
        if (containerRef.current) {
          containerRef.current.style.transform = 'translateY(-50px)';
          
          requestAnimationFrame(() => {
            if (containerRef.current) {
              containerRef.current.style.transform = 'translateY(0)';
              containerRef.current.style.opacity = '1';
            }
          });
          
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.transition = '';
            }
            setIsTransitioning(false);
          }, 300);
        }
      }, 150);
    }
  };

  const handleSubmit = async () => {
    if (!form) return;

    try {
      setIsSubmitting(true);
      
      // Final response with current field
      const currentField = form.fields[currentStep];
      const currentValue = watch(currentField.id);
      const finalResponses = {
        ...responses,
        [currentField.id]: currentValue
      };

      // Convert responses to backend format
      const formattedResponses = Object.entries(finalResponses)
        .filter(([fieldId, value]) => value !== '' && value !== null && value !== undefined)
        .map(([fieldId, value]) => {
          const field = form.fields.find(f => f.id === fieldId);
          return {
            fieldId,
            fieldLabel: field?.label || 'Unknown Field',
            fieldType: field?.type || 'text',
            value: String(value) // Ensure value is string
          };
        });

      console.log('Submitting form:', {
        slug: form.slug,
        responses: formattedResponses
      });

      const response = await fetch(`/api/responses/submit/${form.slug}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          responses: formattedResponses
        })
      });

      if (response.ok) {
        const result = await response.json();
        setSuccessMessage(result.message || form.settings?.successMessage || 'Formunuz başarıyla gönderildi!');
        setIsSubmitted(true);
        
        // Smooth scroll to success
        if (containerRef.current) {
          containerRef.current.style.transition = 'all 0.5s ease-out';
          containerRef.current.style.transform = 'translateY(-30px)';
          containerRef.current.style.opacity = '0';
          
          setTimeout(() => {
            if (containerRef.current) {
              containerRef.current.style.transform = 'translateY(0)';
              containerRef.current.style.opacity = '1';
            }
          }, 200);
        }
      } else {
        const errorData = await response.json();
        console.error('Submit error:', errorData);
        throw new Error(errorData.message || 'Form gönderilemedi');
      }
    } catch (error) {
      console.error('Submit form error:', error);
      toast.error('Form gönderme hatası: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderField = (field: FormField) => {
    const getValidationRules = (field: FormField) => {
      const rules: any = {};
      
      if (field.required) {
        rules.required = `${field.label} zorunludur`;
      }
      
      if (field.type === 'email') {
        rules.validate = (value: string) => {
          if (!value && !field.required) return true; // Allow empty if not required
          if (!value && field.required) return `${field.label} zorunludur`;
          
          const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
          return emailRegex.test(value.trim()) || '❌ Geçerli bir email adresi girin (örn: ornek@email.com)';
        };
      }
      
      if (field.type === 'phone') {
        rules.validate = (value: string) => {
          if (!value && !field.required) return true; // Allow empty if not required
          if (!value && field.required) return `${field.label} zorunludur`;
          
          const cleanPhone = value.replace(/\s/g, ''); // Remove spaces
          const phoneRegex = /^05[0-9]{9}$/; // Turkish mobile format
          return phoneRegex.test(cleanPhone) || '❌ Geçerli bir telefon numarası girin (örn: 05XX XXX XX XX)';
        };
      }
      
      if (field.type === 'date') {
        rules.validate = (value: string) => {
          if (!value && !field.required) return true;
          if (!value && field.required) return `${field.label} zorunludur`;
          return true; // Valid date format handled by input type="date"
        };
      }
      
      return rules;
    };

    // Get automatic placeholder for specific field types
    const getPlaceholder = (field: FormField) => {
      if (field.type === 'email') {
        return 'ornek@eposta.com';
      }
      if (field.type === 'phone') {
        return '05XX XXX XX XX';
      }
      return field.placeholder || '';
    };

    const registerProps = register(field.id, getValidationRules(field));
    
    const fieldProps = {
      ...registerProps,
      placeholder: getPlaceholder(field),
      className: "typeform-input"
    };

    switch (field.type) {
      case 'text':
        return (
          <input
            type="text"
            {...fieldProps}
            placeholder={currentField.placeholder || 'Cevabınızı yazın...'}
            className="typeform-input"
            autoFocus
            autoComplete="off"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );

      case 'email':
        return (
          <input
            type="email"
            {...registerProps}
            placeholder="ornek@eposta.com"
            className="typeform-input"
            autoFocus
            autoComplete="email"
            inputMode="email"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );

      case 'textarea':
        return (
          <textarea
            {...fieldProps}
            placeholder={currentField.placeholder || 'Cevabınızı yazın...'}
            className="typeform-input"
            rows={4}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );

      case 'phone':
        return (
          <input
            type="tel"
            {...registerProps}
            placeholder="05XX XXX XX XX"
            className="typeform-input"
            autoFocus
            autoComplete="tel"
            inputMode="tel"
            maxLength={14}
            onInput={(e) => {
              const target = e.target as HTMLInputElement;
              let value = target.value.replace(/\D/g, ''); // Remove non-digits
              
              // Auto-prefix with 05 if starting to type
              if (value.length === 1 && value !== '0') {
                value = '05' + value;
              } else if (value.length >= 2 && !value.startsWith('05')) {
                value = '05' + value.slice(value.startsWith('0') ? 1 : 0);
              }
              
              // Limit to 11 digits (05XXXXXXXXX)
              if (value.length > 11) value = value.slice(0, 11);
              
              // Format as 05XX XXX XX XX
              if (value.length > 7) {
                // 05XX XXX XX XX format
                value = value.slice(0, 4) + ' ' + value.slice(4, 7) + ' ' + value.slice(7, 9) + ' ' + value.slice(9);
              } else if (value.length > 4) {
                // 05XX XXX format
                value = value.slice(0, 4) + ' ' + value.slice(4);
              }
              
              target.value = value;
              setValue(field.id, value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );

      case 'number':
        return (
          <input
            type="number"
            {...fieldProps}
            autoFocus
            inputMode="numeric"
            pattern="[0-9]*"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );

      case 'select':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue(field.id, option.value);
                  setTimeout(handleNext, 150);
                }}
                className="typeform-option"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case 'radio':
        return (
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setValue(field.id, option.value);
                  setTimeout(handleNext, 150);
                }}
                className="typeform-option"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option.label}</span>
              </button>
            ))}
          </div>
        );

      case 'date':
        return (
          <input
            type="date"
            {...fieldProps}
            autoFocus
            style={{
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            onChange={(e) => {
              setValue(field.id, e.target.value);
              if (e.target.value) {
                setTimeout(handleNext, 800);
              }
            }}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            {...fieldProps}
            autoFocus
            style={{
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            onChange={(e) => {
              setValue(field.id, e.target.value);
              if (e.target.value) {
                setTimeout(handleNext, 800);
              }
            }}
          />
        );

      case 'yes-no':
        return (
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => {
                setValue(field.id, 'yes');
                setTimeout(handleNext, 150);
              }}
              className="typeform-yesno yes"
            >
              ✅ Evet
            </button>
            <button
              type="button"
              onClick={() => {
                setValue(field.id, 'no');
                setTimeout(handleNext, 150);
              }}
              className="typeform-yesno no"
            >
              ❌ Hayır
            </button>
          </div>
        );

      default:
        return (
          <input
            type="text"
            {...fieldProps}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleNext();
              }
            }}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="typeform-loading">
        <div className="loading-spinner"></div>
        <p>Form yükleniyor...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="typeform-error">
        <h1>Form bulunamadı</h1>
        <p>Aradığınız form mevcut değil.</p>
      </div>
    );
  }

  const currentField = !isSubmitted ? form.fields[currentStep] : null;
  const progress = !isSubmitted ? ((currentStep + 1) / form.fields.length) * 100 : 100;

  const themeClass = form?.styling?.theme === 'no-theme' ? '' : (form?.styling?.theme || 'theme-classic-blue');
  
  console.log('Current theme:', themeClass, 'Form styling:', form?.styling);

  return (
    <div 
      className={`typeform-container ${themeClass}`}
    >
      {/* Progress Bar */}
      <div className="typeform-progress">
        <div 
          className="typeform-progress-bar"
          style={{ 
            width: `${progress}%`,
            backgroundColor: form.styling?.primaryColor || '#3B82F6'
          }}
        />
      </div>

      {/* Question */}
      <div className="typeform-question-container">
        <div 
          className={`typeform-question ${isTransitioning ? 'transitioning' : ''}`}
          ref={containerRef}
        >
          {isSubmitted ? (
            /* Success Message */
            <div className="success-container">
              <div className="success-header">
                <div className="success-icon">
                  ✅
                </div>
                <h1 className="success-title">
                  Başarılı!
                </h1>
                <p className="success-message">
                  {successMessage}
                </p>
              </div>
              
              <div className="success-actions">
                <div className="social-links">
                  <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="social-link instagram"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Bizi Instagram'da takip edin
                  </a>
                </div>
                
                                            <button
                              onClick={() => window.location.href = '/'}
                              className="new-form-button"
                              style={{ backgroundColor: form.styling?.primaryColor || '#3B82F6' }}
                            >
                              🏠 Anasayfaya Dön
                            </button>
              </div>
            </div>
          ) : currentField ? (
            <>
              {/* Question Number & Text */}
              <div className="question-header">
                <span className="question-number">{currentStep + 1}</span>
                <h1 className="question-text">
                  {currentField.label}
                  {currentField.required && <span className="required">*</span>}
                </h1>
                {currentField.description && (
                  <p className="question-description">{currentField.description}</p>
                )}
              </div>

              {/* Answer Input */}
              <div className="answer-container">
                {renderField(currentField)}
                {errors[currentField.id] && (
                  <p className="error-message">
                    {errors[currentField.id]?.message as string}
                  </p>
                )}
              </div>

              {/* Navigation */}
              <div className="typeform-navigation">
                {/* Previous Button */}
                {currentStep > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="nav-button prev-button"
                  >
                    ↑ Önceki
                  </button>
                )}

                {/* Next/Submit Button */}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting}
                  className="nav-button next-button"
                  style={{ backgroundColor: form.styling?.primaryColor || '#3B82F6' }}
                >
                  {isSubmitting ? (
                    <span className="flex items-center">
                      <div className="loading-spinner-sm mr-2"></div>
                      Gönderiliyor...
                    </span>
                  ) : currentStep < form.fields.length - 1 ? (
                    'OK ↓ Enter'
                  ) : (
                    '✓ Gönder'
                  )}
                </button>
              </div>

              {/* Keyboard Hint */}
              <div className="keyboard-hint">
                <span>Press <kbd>Enter</kbd> to continue</span>
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Powered by */}
      <div className="typeform-footer">
        <span>Powered by <strong>BForm</strong></span>
      </div>
    </div>
  );
};

export default FormView;