const express = require('express');
const { requireAuth } = require('../middleware/auth');
const db = require('../db');
const pdfRender = require('../services/pdfRender');
const { loadIssues } = require('./issues');

const router = express.Router();

function getIssueOr404(req, res) {
  const issue = loadIssues().find((i) => i.id === req.params.issueId);
  if (!issue) {
    res.status(404).json({ error: 'not_found' });
    return null;
  }
  return issue;
}

function requirePurchase(req, res, issue) {
  if (!db.hasPurchased(req.userEmail, issue.id)) {
    res.status(402).json({
      error: 'payment_required',
      message: 'Please purchase this issue to read it.',
      issueId: issue.id,
      price: issue.price
    });
    return false;
  }
  return true;
}

/**
 * GET /api/viewer/:issueId/meta
 * Returns how many pages to fetch. 401 if not logged in, 402 if logged in
 * but hasn't purchased this issue.
 */
router.get('/:issueId/meta', requireAuth, async (req, res) => {
  const issue = getIssueOr404(req, res);
  if (!issue) return;
  if (!requirePurchase(req, res, issue)) return;

  try {
    const pageCount = await pdfRender.getPageCount(issue);
    res.json({ issueId: issue.id, title: issue.title, pageCount });
  } catch (err) {
    console.error('Failed to render issue', issue.id, err);
    res.status(500).json({ error: 'render_failed' });
  }
});

/**
 * GET /api/viewer/:issueId/page/:pageNumber
 * Streams ONE watermarked page image. No Content-Disposition: attachment
 * (so it renders inline, not as a "Save File" prompt), no caching, and it
 * only ever exists as an image — never the underlying PDF bytes.
 */
router.get('/:issueId/page/:pageNumber', requireAuth, async (req, res) => {
  const issue = getIssueOr404(req, res);
  if (!issue) return;
  if (!requirePurchase(req, res, issue)) return;

  const pageNumber = parseInt(req.params.pageNumber, 10);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return res.status(400).json({ error: 'invalid_page' });
  }

  try {
    const buffer = await pdfRender.getWatermarkedPage(issue, pageNumber, req.userEmail);
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'inline',
      'Cache-Control': 'no-store, no-cache, must-revalidate, private',
      Pragma: 'no-cache',
      // Discourages embedding this image in a different site.
      'Cross-Origin-Resource-Policy': 'same-origin'
    });
    res.send(buffer);
  } catch (err) {
    console.error('Failed to render page', issue.id, pageNumber, err);
    res.status(404).json({ error: 'page_not_found' });
  }
});

module.exports = router;
