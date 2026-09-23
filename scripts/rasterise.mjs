/**
 * SVG to PNG, offline, with the site background baked in.
 *
 * Why a PNG exists at all: the page shows the SVG, but syndication importers,
 * feed readers and mail clients copy <img> and drop or refuse SVG. Without a
 * raster the figure disappears, and the figures carry information the prose
 * does not repeat.
 *
 * Why the background is opaque: the palette is dark only. A transparent PNG
 * would put near white labels on a white page and render the figure unreadable
 * in exactly the places the PNG exists to serve.
 *
 * Renderer: a headless Chromium already on the machine, driven through its own
 * --screenshot flag. No extra npm dependency, nothing added to npm ci, and the
 * same engine that rendered the SVG in the first place.
 *
 * Reproducibility, stated plainly: rendered PNG bytes depend on the font stack
 * of the rendering machine, so unlike the SVG they are NOT byte identical
 * across machines. That is why a PNG is only rendered when it is missing, never
 * re-rendered because something looks different. The SVG stays the reviewable,
 * reproducible artefact; the PNG is a fallback rendering of it.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/** Site background. Matches bg-[#0a0a0a] on the blog routes. */
export const FIGURE_BACKGROUND = '#0a0a0a';
/** Breathing room so labels never touch the edge of the image. */
export const FIGURE_PADDING = 24;
/** Rendered at 2x so the raster is still sharp where it is displayed wide. */
export const FIGURE_SCALE = 2;

const CANDIDATES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
];

export function findChrome() {
  for (const candidate of CANDIDATES) {
    if (candidate && fs.existsSync(candidate)) return candidate;
  }
  throw new Error(
    'No Chrome or Chromium found for PNG rendering. Install one, or set CHROME_PATH.',
  );
}

/** Intrinsic size of an SVG: width/height attributes first, viewBox second. */
export function svgSize(svg) {
  const head = svg.slice(0, svg.indexOf('>') + 1);
  const width = Number.parseFloat((head.match(/\swidth="([\d.]+)(?:px)?"/) ?? [])[1] ?? '');
  const height = Number.parseFloat((head.match(/\sheight="([\d.]+)(?:px)?"/) ?? [])[1] ?? '');
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width, height };
  }
  const viewBox = (head.match(/\sviewBox="([^"]+)"/) ?? [])[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every(Number.isFinite) && parts[2] > 0 && parts[3] > 0) {
      return { width: parts[2], height: parts[3] };
    }
  }
  throw new Error('SVG has neither usable width/height nor a viewBox');
}

/**
 * Wide diagrams are rendered at a capped width so a single PNG cannot be
 * 3000 pixels across on a platform that scales images down to a column.
 */
const MAX_WIDTH = 1200;

export function rasterise(svg, outFile, chrome = findChrome()) {
  const natural = svgSize(svg);
  const scale = Math.min(1, MAX_WIDTH / natural.width);
  const width = Math.round(natural.width * scale);
  const height = Math.round(natural.height * scale);

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'figpng-'));
  try {
    // The SVG is loaded as a file rather than inlined into the HTML, so nothing
    // in it can be reinterpreted as page markup.
    const svgFile = path.join(tmp, 'figure.svg');
    fs.writeFileSync(svgFile, svg);
    const html =
      '<!doctype html><meta charset="utf-8">' +
      `<style>html,body{margin:0;padding:0;background:${FIGURE_BACKGROUND}}` +
      `body{padding:${FIGURE_PADDING}px;box-sizing:border-box}` +
      `img{display:block;width:${width}px;height:${height}px}</style>` +
      '<img src="figure.svg">';
    const htmlFile = path.join(tmp, 'figure.html');
    fs.writeFileSync(htmlFile, html);

    execFileSync(
      chrome,
      [
        '--headless',
        '--no-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--hide-scrollbars',
        `--force-device-scale-factor=${FIGURE_SCALE}`,
        `--window-size=${width + FIGURE_PADDING * 2},${height + FIGURE_PADDING * 2}`,
        `--screenshot=${outFile}`,
        `file://${htmlFile}`,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );

    if (!fs.existsSync(outFile) || fs.statSync(outFile).size === 0) {
      throw new Error(`Chromium produced no PNG at ${outFile}`);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}
