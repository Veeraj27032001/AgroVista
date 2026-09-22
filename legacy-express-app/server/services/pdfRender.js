// Renders PDF pages to PNG images (via the poppler `pdftoppm` binary) and
// overlays a per-viewer watermark before the image is ever sent to a browser.
//
// The raw PDF file is NEVER served to the client — only individually
// rendered, watermarked page images are, through an authenticated route.
// This means there is no single file a reader can download that contains
// the whole issue, and every image that leaves the server is stamped with
// the viewer's email + a timestamp so a leaked screenshot can be traced
// back to an account.
//
// Requires poppler-utils installed on the host (`apt-get install poppler-utils`
// on Debian/Ubuntu, `brew install poppler` on macOS). This is a very common
// server dependency and has no Node native-module build issues.

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DATA_DIR = path.join(__dirname, '..', 'data');
const CACHE_DIR = path.join(__dirname, '..', 'cache');

function issueCacheDir(issueId) {
  return path.join(CACHE_DIR, issueId);
}

function rawPagePath(issueId, pageNumber) {
  return path.join(issueCacheDir(issueId), `page-${pageNumber}.png`);
}

/**
 * Rasterize every page of the issue's source PDF into the cache directory,
 * if it hasn't been done already. Cheap to call repeatedly — it's a no-op
 * once the cache exists. Run this ahead of time with `npm run prerender`
 * for instant first-page-loads, or let it happen lazily on first view.
 */
function ensureRendered(issue) {
  return new Promise((resolve, reject) => {
    const outDir = issueCacheDir(issue.id);
    const donePath = path.join(outDir, '.done');
    if (fs.existsSync(donePath)) {
      const pageCount = fs.readdirSync(outDir).filter((f) => f.startsWith('page-')).length;
      return resolve(pageCount);
    }

    fs.mkdirSync(outDir, { recursive: true });
    const sourcePdf = path.join(DATA_DIR, issue.sourcePdf);
    if (!fs.existsSync(sourcePdf)) {
      return reject(new Error(`Source PDF not found for issue ${issue.id}: ${sourcePdf}`));
    }

    // pdftoppm -png -r 150 input.pdf outDir/page
    // produces page-1.png, page-2.png, ... (poppler pads numbers only when >9 pages exist)
    execFile(
      'pdftoppm',
      ['-png', '-r', '150', sourcePdf, path.join(outDir, 'page')],
      (err) => {
        if (err) return reject(err);
        // Normalize filenames to page-1.png, page-2.png (no zero padding)
        // regardless of how many pages poppler decided to pad.
        const files = fs.readdirSync(outDir).filter((f) => /^page-\d+\.png$/.test(f) || /^page-\d+-\d+\.png$/.test(f));
        // poppler names files "page-1.png" already when using this exact prefix; just count them.
        const pageFiles = fs.readdirSync(outDir).filter((f) => f.startsWith('page-') && f.endsWith('.png'));
        fs.writeFileSync(donePath, String(pageFiles.length));
        resolve(pageFiles.length);
      }
    );
  });
}

/** How many pages this issue has (renders on first call, cached after). */
async function getPageCount(issue) {
  return ensureRendered(issue);
}

/**
 * Return a watermarked PNG buffer for a single page, stamped with the
 * viewer's email and the current date/time so it's traceable if shared.
 */
async function getWatermarkedPage(issue, pageNumber, viewerEmail) {
  await ensureRendered(issue);
  const filePath = rawPagePath(issue.id, pageNumber);
  if (!fs.existsSync(filePath)) {
    throw new Error('Page not found');
  }

  const base = sharp(filePath);
  const meta = await base.metadata();
  const width = meta.width || 1000;
  const height = meta.height || 1400;

  const stamp = `${viewerEmail} · ${new Date().toISOString().replace('T', ' ').slice(0, 16)} UTC · AgroVista Monthly`;
  const tileText = escapeXml(stamp);

  // Build a repeating diagonal watermark as an SVG overlay, composited on top
  // of the rendered page. This survives screenshots (unlike a CSS-only overlay).
  const svgWatermark = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <style>
        .wm { fill: rgba(20,20,15,0.16); font-size: ${Math.round(width / 34)}px; font-family: sans-serif; font-weight: bold; }
      </style>
      ${buildWatermarkTiles(tileText, width, height)}
    </svg>`;

  const outBuffer = await base
    .composite([{ input: Buffer.from(svgWatermark), top: 0, left: 0 }])
    .png()
    .toBuffer();

  return outBuffer;
}

function buildWatermarkTiles(text, width, height) {
  const tiles = [];
  const stepX = Math.round(width / 2.1);
  const stepY = Math.round(height / 5);
  let row = 0;
  for (let y = -stepY; y < height + stepY; y += stepY) {
    const offset = row % 2 === 0 ? 0 : stepX / 2;
    for (let x = -stepX; x < width + stepX; x += stepX) {
      tiles.push(
        `<text class="wm" x="${x + offset}" y="${y}" transform="rotate(-28 ${x + offset} ${y})">${text}</text>`
      );
    }
    row++;
  }
  return tiles.join('\n');
}

function escapeXml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

module.exports = { getPageCount, getWatermarkedPage };
