const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const config = require('./config');

const authRoutes = require('./routes/auth');
const issuesRoutes = require('./routes/issues');
const paymentsRoutes = require('./routes/payments');
const viewerRoutes = require('./routes/viewer');

const app = express();

app.use(cors({ origin: config.baseUrl, credentials: true }));
app.use(cookieParser());

// IMPORTANT: the Razorpay webhook needs the raw, unparsed request body to
// verify its signature, so it's registered BEFORE the global express.json()
// middleware and given its own raw parser.
app.post(
  '/api/payments/webhook',
  express.raw({ type: '*/*' }),
  paymentsRoutes.handleWebhook
);

// All other routes can use normal JSON body parsing.
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/payments', paymentsRoutes.router);
app.use('/api/viewer', viewerRoutes);

// Static front-end (index.html, archive.html, issue.html, login.html, viewer.html, css/js/images)
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/healthz', (req, res) => res.json({ ok: true }));

app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(config.port, () => {
  console.log(`AgroVista Monthly server running on ${config.baseUrl} (port ${config.port})`);
  if (!config.razorpay.keyId) {
    console.warn('⚠️  RAZORPAY_KEY_ID is not set — payments will fail until you configure .env');
  }
  if (!process.env.SMTP_HOST) {
    console.warn('⚠️  SMTP_HOST is not set — magic links will be logged to this console instead of emailed');
  }
});
