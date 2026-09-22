require('dotenv').config();

function required(name, fallback) {
  const val = process.env[name] !== undefined ? process.env[name] : fallback;
  return val;
}

module.exports = {
  port: parseInt(required('PORT', '4000'), 10),
  baseUrl: required('BASE_URL', 'http://localhost:4000'),
  nodeEnv: required('NODE_ENV', 'development'),

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  magicLinkExpiryMinutes: parseInt(required('MAGIC_LINK_EXPIRY_MINUTES', '15'), 10),
  sessionExpiryDays: parseInt(required('SESSION_EXPIRY_DAYS', '180'), 10),

  smtp: {
    host: required('SMTP_HOST', ''),
    port: parseInt(required('SMTP_PORT', '587'), 10),
    secure: required('SMTP_SECURE', 'false') === 'true',
    user: required('SMTP_USER', ''),
    pass: required('SMTP_PASS', ''),
    from: required('SMTP_FROM', 'AgroVista Monthly <no-reply@agrovistamonthly.com>')
  },

  razorpay: {
    keyId: required('RAZORPAY_KEY_ID', ''),
    keySecret: required('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: required('RAZORPAY_WEBHOOK_SECRET', '')
  },

  currency: required('CURRENCY', 'INR')
};
