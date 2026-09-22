// Minimal JSON-file "database" for purchases.
//
// This is intentionally simple so the whole project runs with zero external
// services besides Razorpay + SMTP. For real production traffic, swap this
// module for a proper database (Postgres/MySQL/Mongo) — the function
// signatures below are the only thing the rest of the app depends on, so
// you can reimplement this file against a real DB without touching routes.

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const PURCHASES_FILE = path.join(DATA_DIR, 'purchases.json');

function ensureFile() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(PURCHASES_FILE)) fs.writeFileSync(PURCHASES_FILE, '[]', 'utf8');
}

function readAll() {
  ensureFile();
  const raw = fs.readFileSync(PURCHASES_FILE, 'utf8');
  try {
    return JSON.parse(raw || '[]');
  } catch (e) {
    console.error('purchases.json is corrupted, resetting to empty array:', e.message);
    return [];
  }
}

// A tiny write queue so concurrent requests never interleave writes and
// corrupt the JSON file.
let writeQueue = Promise.resolve();
function writeAll(records) {
  writeQueue = writeQueue.then(() => {
    fs.writeFileSync(PURCHASES_FILE, JSON.stringify(records, null, 2), 'utf8');
  });
  return writeQueue;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Has this email already purchased this issue? */
function hasPurchased(email, issueId) {
  const emailNorm = normalizeEmail(email);
  return readAll().some(
    (p) => p.email === emailNorm && p.issueId === issueId && p.status === 'paid'
  );
}

/** All issueIds this email currently has access to. */
function getPurchasedIssueIds(email) {
  const emailNorm = normalizeEmail(email);
  return readAll()
    .filter((p) => p.email === emailNorm && p.status === 'paid')
    .map((p) => p.issueId);
}

/** Find a purchase record by Razorpay order id (used for idempotency). */
function findByOrderId(orderId) {
  return readAll().find((p) => p.orderId === orderId) || null;
}

/** Insert a new "pending" purchase row when a Razorpay order is created. */
async function createPendingPurchase({ email, issueId, orderId, amount, currency }) {
  const records = readAll();
  records.push({
    id: orderId,
    email: normalizeEmail(email),
    issueId,
    orderId,
    paymentId: null,
    amount,
    currency,
    status: 'pending',
    createdAt: new Date().toISOString(),
    paidAt: null
  });
  await writeAll(records);
}

/** Mark a pending purchase as paid once Razorpay confirms the payment. */
async function markPurchasePaid({ orderId, paymentId }) {
  const records = readAll();
  const record = records.find((p) => p.orderId === orderId);
  if (!record) return null;
  record.status = 'paid';
  record.paymentId = paymentId;
  record.paidAt = new Date().toISOString();
  await writeAll(records);
  return record;
}

module.exports = {
  normalizeEmail,
  hasPurchased,
  getPurchasedIssueIds,
  findByOrderId,
  createPendingPurchase,
  markPurchasePaid
};
