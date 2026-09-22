const Razorpay = require('razorpay');
const crypto = require('crypto');
const config = require('../config');

let client = null;
function getClient() {
  if (client) return client;
  if (!config.razorpay.keyId || !config.razorpay.keySecret) {
    throw new Error('Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  }
  client = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret
  });
  return client;
}

/** Creates a Razorpay order for one issue purchase. Amount is in the smallest currency unit (paise for INR). */
async function createOrder({ amountRupees, receipt, notes }) {
  const rp = getClient();
  const order = await rp.orders.create({
    amount: Math.round(amountRupees * 100),
    currency: config.currency,
    receipt,
    notes
  });
  return order;
}

/** Verifies the signature returned by Razorpay Checkout on the client after a successful payment. */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const expected = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  return expected === signature;
}

/** Verifies the signature Razorpay sends on server-to-server webhook calls. */
function verifyWebhookSignature({ rawBody, signature }) {
  if (!config.razorpay.webhookSecret) return false;
  const expected = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  return expected === signature;
}

module.exports = { createOrder, verifyPaymentSignature, verifyWebhookSignature };
