// Run with: npm run prerender
// Rasterizes every issue's source PDF into cached page images up front, so
// the very first reader to open an issue doesn't wait for on-the-fly
// conversion. Safe to re-run any time; already-rendered issues are skipped.

const path = require('path');
const { loadIssues } = require('../routes/issues');
const pdfRender = require('../services/pdfRender');

(async () => {
  const issues = loadIssues();
  console.log(`Pre-rendering ${issues.length} issues...`);
  for (const issue of issues) {
    try {
      const pageCount = await pdfRender.getPageCount(issue);
      console.log(`✓ ${issue.id} — ${pageCount} pages`);
    } catch (err) {
      console.error(`✗ ${issue.id} — ${err.message}`);
    }
  }
  console.log('Done.');
})();
