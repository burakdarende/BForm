const fetch = require('node-fetch');

const verifyTurnstile = async (token) => {
  console.log('🔍 Turnstile verification started');
  console.log('🔑 Token received:', token ? 'VAR' : 'YOK');
  
  // Temporarily bypass in development
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️  Bypassing Turnstile verification in development mode');
    return true;
  }
  
  const secretKey = process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY;
  console.log('🔑 Secret key:', secretKey ? 'VAR' : 'YOK');
  
  if (!secretKey) {
    console.error('❌ Cloudflare Turnstile secret key is not set');
    return false;
  }

  const verificationUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  try {
    const response = await fetch(verificationUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        secret: secretKey,
        response: token
      })
    });

    const data = await response.json();

    if (data.success) {
      console.log('✅ Turnstile verification successful');
      return true;
    } else {
      console.warn('⚠️  Turnstile verification failed:', data['error-codes']);
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying Turnstile token:', error);
    return false;
  }
};

module.exports = {
  verifyTurnstile
};

