function required(name: string, fallback: string): string {
  const val = process.env[name];
  return val !== undefined && val !== '' ? val : fallback;
}

export const config = {
  appUrl: required('NEXT_PUBLIC_APP_URL', required('BASE_URL', 'http://localhost:3000')),
  nodeEnv: required('NODE_ENV', 'development'),

  supabase: {
    url: required('NEXT_PUBLIC_SUPABASE_URL', ''),
    anonKey: required('NEXT_PUBLIC_SUPABASE_ANON_KEY', ''),
    serviceRoleKey: required('SUPABASE_SERVICE_ROLE_KEY', '')
  },

  storageBuckets: {
    posters: required('SUPABASE_POSTERS_BUCKET', 'issue-posters'),
    issuePdfs: required('SUPABASE_ISSUE_PDFS_BUCKET', 'issue-pdfs'),
    submissionFiles: required('SUPABASE_SUBMISSION_FILES_BUCKET', 'submission-files'),
    adminEdits: required('SUPABASE_ADMIN_EDITS_BUCKET', 'admin-edits')
  },

  jwtSecret: required('JWT_SECRET', 'dev-only-insecure-secret-change-me'),
  jwtExpiryDays: parseInt(required('JWT_EXPIRY_DAYS', '7'), 10),
  sessionCookieName: required('SESSION_COOKIE_NAME', 'agrovista_session'),

  razorpay: {
    keyId: required('RAZORPAY_KEY_ID', ''),
    keySecret: required('RAZORPAY_KEY_SECRET', ''),
    webhookSecret: required('RAZORPAY_WEBHOOK_SECRET', '')
  },

  currency: required('CURRENCY', 'INR'),

  smtp: {
    host: required('SMTP_HOST', ''),
    port: parseInt(required('SMTP_PORT', '587'), 10),
    secure: required('SMTP_SECURE', 'false') === 'true',
    user: required('SMTP_USER', ''),
    pass: required('SMTP_PASS', ''),
    from: required('SMTP_FROM', 'AgroVista <no-reply@agrovista.example>')
  },

  fast2sms: {
    apiKey: required('FAST2SMS_API_KEY', ''),
    smsEnabled: required('SMS_NOTIFICATIONS_ENABLED', 'false') === 'true'
  },

  adapters: {
    storage: required('STORAGE_ADAPTER', 'stub') as 'stub' | 'supabase',
    payment: required('PAYMENT_ADAPTER', 'stub') as 'stub' | 'razorpay',
    notifier: required('NOTIFIER_ADAPTER', 'stub') as 'stub' | 'email-sms'
  },

  sentry: {
    enabled: required('SENTRY_ENABLED', 'false') === 'true',
    dsn: required('SENTRY_DSN', '')
  }
};
