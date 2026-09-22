const express = require('express');
const { requireAuth } = require('../middleware/auth');
const razorpayService = require('../services/razorpay');
const db = require('../db');
const config = require('../config');
const { loadIssues } = require('./issues');

const router = express.Router();

/**
 * POST /api/payments/create-order   { issueId }
 * Must be logged in — the order (and therefore the eventual purchase
 * record) is tied to the signed-in email address from the start.
 */
router.post('/create-order', requireAuth, async (req, res) => {
  const { issueId } = req.body;
  const issue = loadIssues().find((i) => i.id === issueId);
  if (!issue) return res.status(404).json({ error: 'issue_not_found' });

  if (db.hasPurchased(req.userEmail, issueId)) {
    return res.status(409).json({ error: 'already_purchased', message: 'You already own this issue.' });
  }

  try {
    const order = await razorpayService.createOrder({
      amountRupees: issue.price,
      receipt: `${issueId}-${Date.now()}`,
      notes: { email: req.userEmail, issueId }
    });

    await db.createPendingPurchase({
      email: req.userEmail,
      issueId,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      issue: { id: issue.id, title: issue.title, price: issue.price }
    });
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    res.status(500).json({ error: 'order_failed', message: 'Could not start payment. Please try again.' });
  }
});

/**
 * POST /api/payments/verify   { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 * Called by the browser immediately after Razorpay Checkout reports success.
 * This is a convenience/fast-path confirmation; the webhook below is the
 * authoritative source of truth in case the browser closes before this runs.
 */
router.post('/verify', requireAuth, async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  const pending = db.findByOrderId(razorpay_order_id);
  if (!pending) return res.status(404).json({ error: 'order_not_found' });
  if (pending.email !== db.normalizeEmail(req.userEmail)) {
    return res.status(403).json({ error: 'order_email_mismatch' });
  }

  const valid = razorpayService.verifyPaymentSignature({
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    signature: razorpay_signature
  });

  if (!valid) {
    return res.status(400).json({ error: 'invalid_signature', message: 'Payment could not be verified.' });
  }

  const record = await db.markPurchasePaid({ orderId: razorpay_order_id, paymentId: razorpay_payment_id });
  res.json({ ok: true, issueId: record.issueId });
});

/**
 * POST /api/payments/webhook  (Razorpay server-to-server callback)
 * Mounted in server.js with a RAW body parser (signature verification needs
 * the exact raw bytes Razorpay sent). Configure this URL in the Razorpay
 * Dashboard under Settings > Webhooks, subscribed to "payment.captured".
 */
async function handleWebhook(req, res) {
  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, thanks to express.raw() in server.js

  const valid = razorpayService.verifyWebhookSignature({ rawBody, signature });
  if (!valid) {
    console.warn('Rejected Razorpay webhook with invalid signature');
    return res.status(400).json({ error: 'invalid_signature' });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody.toString('utf8'));
  } catch (e) {
    return res.status(400).json({ error: 'invalid_payload' });
  }

  if (payload.event === 'payment.captured' || payload.event === 'order.paid') {
    const paymentEntity = payload.payload && payload.payload.payment && payload.payload.payment.entity;
    if (paymentEntity) {
      const orderId = paymentEntity.order_id;
      const paymentId = paymentEntity.id;
      const existing = db.findByOrderId(orderId);
      if (existing && existing.status !== 'paid') {
        await db.markPurchasePaid({ orderId, paymentId });
        console.log(`Webhook confirmed payment for order ${orderId}`);
      }
    }
  }

  res.json({ received: true });
}

module.exports = { router, handleWebhook };
