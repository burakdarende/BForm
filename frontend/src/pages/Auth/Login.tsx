import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../hooks/useAuth';
import type { LoginCredentials } from '../../types';

const Login: React.FC = () => {
  const { login, isAuthenticated, isLoading } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginCredentials>();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: LoginCredentials) => {
    try {
      setIsSubmitting(true);
      await login(data);
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
              Hesabınıza Giriş Yapın
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Henüz hesabınız yok mu?{' '}
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Kayıt olun
              </Link>
            </p>
          </div>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
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
                autoComplete="current-password"
                className={`form-input ${errors.password ? 'border-red-500' : ''}`}
                placeholder="Şifrenizi girin"
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
                  Giriş Yapılıyor...
                </>
              ) : (
                'Giriş Yap'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/forgot-password"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              Şifrenizi mi unuttunuz?
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;