import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Turnstile from 'react-turnstile';
import { useAuth } from '../hooks/useAuth';

const Home: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cfToken, setCfToken] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isLoading, isAuthenticated } = useAuth();

  // If user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cfToken) {
      setError('Lütfen captcha\'yı doğrulayın');
      return;
    }

    setError('');

    try {
      await login({ email, password, cf_token: cfToken });
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Giriş başarısız');
    }
  };

  // If user is authenticated, don't render login form
  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-primary flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            BForm
          </h1>
          <p className="text-gray-600">
            Form yönetim sistemi
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              E-posta
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E-posta adresiniz"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Şifre
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Şifreniz"
              required
            />
          </div>

          <div className="flex justify-center">
            <Turnstile
              sitekey="0x4AAAAAABqo_UdgY4xCpbat"
              onVerify={(token) => setCfToken(token)}
              onError={() => setError('Captcha doğrulanamadı')}
              onExpire={() => setCfToken('')}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !cfToken}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Home;