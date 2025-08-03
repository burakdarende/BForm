import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import type { RegisterCredentials } from '../../types';

const Register: React.FC = () => {
  const { register: registerUser, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterCredentials & { confirmPassword: string }>();

  const password = watch('password');

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterCredentials & { confirmPassword: string }) => {
    try {
      setIsSubmitting(true);
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
    } catch (error) {
      // Error handling is done in useAuth hook
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gradient mb-2">BForm</h1>
            <h2 className="text-2xl font-bold text-gray-900">
              Hesap Oluşturun
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Zaten hesabınız var mı?{' '}
              <Link
                to="/login"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Giriş yapın
              </Link>
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="field-group">
              <label htmlFor="name" className="field-label">
                Ad Soyad
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                className={`form-input ${errors.name ? 'border-red-500' : ''}`}
                placeholder="Adınız ve soyadınız"
                {...register('name', {
                  required: 'Ad soyad gerekli',
                  minLength: {
                    value: 2,
                    message: 'Ad soyad en az 2 karakter olmalı',
                  },
                })}
              />
              {errors.name && (
                <p className="field-error">{errors.name.message}</p>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="email" className="field-label">
                Email Adresi
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                className={`form-input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="ornek@email.com"
                {...register('email', {
                  required: 'Email adresi gerekli',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Geçerli bir email adresi girin',
                  },
                })}
              />
              {errors.email && (
                <p className="field-error">{errors.email.message}</p>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="password" className="field-label">
                Şifre
              </label>
              <input
                id="password"
                type="password"
                autoComplete="new-password"
                className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="En az 6 karakter"
                {...register('password', {
                  required: 'Şifre gerekli',
                  minLength: {
                    value: 6,
                    message: 'Şifre en az 6 karakter olmalı',
                  },
                })}
              />
              {errors.password && (
                <p className="field-error">{errors.password.message}</p>
              )}
            </div>

            <div className="field-group">
              <label htmlFor="confirmPassword" className="field-label">
                Şifre Tekrar
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className={`form-input ${errors.confirmPassword ? 'border-red-500' : ''}`}
                placeholder="Şifrenizi tekrar girin"
                {...register('confirmPassword', {
                  required: 'Şifre tekrarı gerekli',
                  validate: (value) =>
                    value === password || 'Şifreler eşleşmiyor',
                })}
              />
              {errors.confirmPassword && (
                <p className="field-error">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex justify-center py-3"
            >
              {isSubmitting ? (
                <>
                  <div className="loading-spinner mr-2"></div>
                  Hesap Oluşturuluyor...
                </>
              ) : (
                'Hesap Oluştur'
              )}
            </button>
          </div>

          <div className="text-sm text-gray-500 text-center">
            Hesap oluşturarak{' '}
            <Link to="/terms" className="text-primary-600 hover:text-primary-500">
              Kullanım Şartları
            </Link>{' '}
            ve{' '}
            <Link to="/privacy" className="text-primary-600 hover:text-primary-500">
              Gizlilik Politikası
            </Link>
            'nı kabul etmiş olursunuz.
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;