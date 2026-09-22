const express = require('express');
const fs = require('fs');
const path = require('path');
const { optionalAuth } = require('../middleware/auth');
const db = require('../db');

const router = express.Router();
const issuesPath = path.join(__dirname, '..', 'data', 'issues.json');

function loadIssues() {
  const raw = fs.readFileSync(issuesPath, 'utf8');
  return JSON.parse(raw);
}

/** Strip fields the client should never see (the server-side source PDF path). */
function toPublicIssue(issue, purchasedSet) {
  const { sourcePdf, ...publicFields } = issue;
  return {
    ...publicFields,
    purchased: purchasedSet.has(issue.id)
  };
}

/** GET /api/issues — list, with a "purchased" flag if the caller is logged in. */
router.get('/', optionalAuth, (req, res) => {
  const issues = loadIssues();
  const purchasedSet = new Set(req.userEmail ? db.getPurchasedIssueIds(req.userEmail) : []);
  res.json(issues.map((i) => toPublicIssue(i, purchasedSet)));
});

/** GET /api/issues/:id — single issue metadata. */
router.get('/:id', optionalAuth, (req, res) => {
  const issues = loadIssues();
  const issue = issues.find((i) => i.id === req.params.id);
  if (!issue) return res.status(404).json({ error: 'not_found' });
  const purchasedSet = new Set(req.userEmail ? db.getPurchasedIssueIds(req.userEmail) : []);
  res.json(toPublicIssue(issue, purchasedSet));
});

module.exports = router;
module.exports.loadIssues = loadIssues;
