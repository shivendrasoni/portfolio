#!/usr/bin/env node
/**
 * Renders every figure fence in content/blog/*.md to committed files.
 *
 * A ```mermaid fence becomes a committed SVG plus a committed PNG. A hand
 * authored ```svg fence keeps its source in the markdown and only needs the
 * PNG. The PNG exists because importers, feed readers and mail clients copy
 * <img> and drop SVG; see scripts/rasterise.mjs for why it has an opaque
 * background and why it is never re-rendered in place.
 *
 * Run this locally when a diagram is added or changed, then commit the SVG
 * alongside the post:
 *
 *   npm run diagrams          render anything missing
 *   npm run diagrams -- --force   re-render everything
 *   npm run diagrams -- --check   report only, non zero exit if stale
 *
 * Deliberately NOT part of "npm run build". mermaid-cli pulls a full Chromium
 * and hundreds of megabytes of node_modules to produce output that is byte
 * identical between deploys, so it does not belong in npm ci on Vercel or in CI.
 * The build reads the committed SVG and fails loudly if one is missing.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { CONFIG_FINGERPRINT, MERMAID_CONFIG, PUPPETEER_CONFIG } from './diagram-palette.mjs';
import { extractDiagrams, listPosts } from './diagram-scan.mjs';
import { findChrome, rasterise } from './rasterise.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content/blog');
const DIAGRAM_DIR = path.join(CONTENT_DIR, 'diagrams');

// Pinned. An unpinned renderer means a lockfile-free dependency silently
// changing every committed diagram on someone else's machine.
const MERMAID_CLI = '@mermaid-js/mermaid-cli@11.17.0';

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const CHECK = args.has('--check');

/** Content address of a mermaid fence: source plus the palette it renders with. */
function hashOf(source) {
  return crypto
    .createHash('sha256')
    .update(`${CONFIG_FINGERPRINT}\n${source.replace(/\r\n/g, '\n').trim()}`)
    .digest('hex')
    .slice(0, 12);
}

/** Content address of a hand authored ```svg fence. No palette fingerprint:
 * nothing is rendered, so there is no renderer version to invalidate against.
 * Must stay identical to hashOfSource in plugins/blog/diagrams.ts. */
function hashOfSource(source) {
  return crypto
    .createHash('sha256')
    .update(source.replace(/\r\n/g, '\n').trim())
    .digest('hex')
    .slice(0, 12);
}

function render(source, outFile) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'mmd-'));
  try {
    const input = path.join(tmp, 'diagram.mmd');
    const configFile = path.join(tmp, 'config.json');
    const puppeteerFile = path.join(tmp, 'puppeteer.json');
    fs.writeFileSync(input, `${source}\n`);
    fs.writeFileSync(configFile, JSON.stringify(MERMAID_CONFIG));
    fs.writeFileSync(puppeteerFile, JSON.stringify(PUPPETEER_CONFIG));
    execFileSync(
      'npx',
      [
        '-y',
        MERMAID_CLI,
        '--input', input,
        '--output', outFile,
        '--outputFormat', 'svg',
        '--backgroundColor', 'transparent',
        '--configFile', configFile,
        '--puppeteerConfigFile', puppeteerFile,
      ],
      { stdio: ['ignore', 'ignore', 'pipe'] },
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const posts = listPosts(CONTENT_DIR);
  const diagrams = [];
  for (const name of posts) {
    const markdown = fs.readFileSync(path.join(CONTENT_DIR, name), 'utf8');
    diagrams.push(...extractDiagrams(markdown, name));
  }

  if (diagrams.length === 0) {
    console.log('No figure fences found in content/blog. Nothing to render.');
    return;
  }

  fs.mkdirSync(DIAGRAM_DIR, { recursive: true });
  fs.writeFileSync(
    path.join(DIAGRAM_DIR, 'render-config.json'),
    `${JSON.stringify(
      {
        renderer: MERMAID_CLI,
        fingerprint: CONFIG_FINGERPRINT,
        note: 'Written by scripts/render-diagrams.mjs. The build reads fingerprint to address rendered SVG. Do not edit by hand.',
      },
      null,
      2,
    )}\n`,
  );
  const wanted = new Set();
  const missing = [];
  // Chromium is only needed if something actually has to be rasterised, so a
  // --check run on a machine without it still works.
  let chrome = null;

  for (const diagram of diagrams) {
    const isMermaid = diagram.kind !== 'svg';
    const hash = isMermaid ? hashOf(diagram.source) : hashOfSource(diagram.source);
    const where = `${diagram.file}:${diagram.line}  ${diagram.caption}`;

    // 1. The SVG. Hand authored figures keep their source in the markdown, so
    //    there is nothing to render and nothing to commit.
    const svgFile = path.join(DIAGRAM_DIR, `${hash}.svg`);
    if (isMermaid) {
      wanted.add(`${hash}.svg`);
      const haveSvg = fs.existsSync(svgFile);
      if (haveSvg && !FORCE) {
        console.log(`ok      ${hash}.svg  ${where}`);
      } else if (CHECK) {
        missing.push(`${diagram.file}:${diagram.line} -> ${hash}.svg  ${diagram.caption}`);
      } else {
        process.stdout.write(`render  ${hash}.svg  ${diagram.file}:${diagram.line} ... `);
        render(diagram.source, svgFile);
        console.log(`${fs.statSync(svgFile).size} bytes`);
      }
    }

    // 2. The PNG fallback, for every figure of either kind. Rendered only when
    //    missing: PNG bytes are not reproducible across machines, so
    //    re-rendering an existing one would churn the repository for nothing.
    wanted.add(`${hash}.png`);
    const pngFile = path.join(DIAGRAM_DIR, `${hash}.png`);
    if (fs.existsSync(pngFile)) {
      console.log(`ok      ${hash}.png  ${where}`);
      continue;
    }
    if (CHECK) {
      missing.push(`${diagram.file}:${diagram.line} -> ${hash}.png  ${diagram.caption}`);
      continue;
    }
    const svg = isMermaid ? fs.readFileSync(svgFile, 'utf8') : diagram.source;
    process.stdout.write(`raster  ${hash}.png  ${diagram.file}:${diagram.line} ... `);
    chrome = chrome ?? findChrome();
    rasterise(svg, pngFile, chrome);
    console.log(`${fs.statSync(pngFile).size} bytes`);
  }

  // Orphans are reported, never deleted automatically: a post on another branch
  // may still reference one.
  const orphans = fs
    .readdirSync(DIAGRAM_DIR)
    .filter((n) => (n.endsWith('.svg') || n.endsWith('.png')) && !wanted.has(n));
  if (orphans.length > 0) {
    console.log(
      `\n${orphans.length} committed figure file no longer referenced by any post: ${orphans.join(', ')}`,
    );
    console.log('Delete them by hand once you are sure no branch still uses them.');
  }

  if (CHECK && missing.length > 0) {
    console.error('\nStale or missing figure renders:');
    for (const line of missing) console.error(`  ${line}`);
    console.error('\nRun "npm run diagrams" and commit content/blog/diagrams.');
    process.exit(1);
  }
}

main();
