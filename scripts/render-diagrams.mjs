#!/usr/bin/env node
/**
 * Renders every ```mermaid fence in content/blog/*.md to a committed SVG.
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

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'content/blog');
const DIAGRAM_DIR = path.join(CONTENT_DIR, 'diagrams');

// Pinned. An unpinned renderer means a lockfile-free dependency silently
// changing every committed diagram on someone else's machine.
const MERMAID_CLI = '@mermaid-js/mermaid-cli@11.17.0';

const args = new Set(process.argv.slice(2));
const FORCE = args.has('--force');
const CHECK = args.has('--check');

function hashOf(source) {
  return crypto
    .createHash('sha256')
    .update(`${CONFIG_FINGERPRINT}\n${source.replace(/\r\n/g, '\n').trim()}`)
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
    console.log('No mermaid fences found in content/blog. Nothing to render.');
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

  for (const diagram of diagrams) {
    const hash = hashOf(diagram.source);
    wanted.add(`${hash}.svg`);
    const outFile = path.join(DIAGRAM_DIR, `${hash}.svg`);
    const exists = fs.existsSync(outFile);

    if (exists && !FORCE) {
      console.log(`ok      ${hash}.svg  ${diagram.file}:${diagram.line}  ${diagram.caption}`);
      continue;
    }
    if (CHECK) {
      missing.push(`${diagram.file}:${diagram.line} -> ${hash}.svg  ${diagram.caption}`);
      continue;
    }

    process.stdout.write(`render  ${hash}.svg  ${diagram.file}:${diagram.line} ... `);
    render(diagram.source, outFile);
    const bytes = fs.statSync(outFile).size;
    console.log(`${bytes} bytes`);
  }

  // Orphans are reported, never deleted automatically: a post on another branch
  // may still reference one.
  const orphans = fs
    .readdirSync(DIAGRAM_DIR)
    .filter((n) => n.endsWith('.svg') && !wanted.has(n));
  if (orphans.length > 0) {
    console.log(
      `\n${orphans.length} committed SVG no longer referenced by any post: ${orphans.join(', ')}`,
    );
    console.log('Delete them by hand once you are sure no branch still uses them.');
  }

  if (CHECK && missing.length > 0) {
    console.error('\nStale or missing diagram renders:');
    for (const line of missing) console.error(`  ${line}`);
    console.error('\nRun "npm run diagrams" and commit content/blog/diagrams.');
    process.exit(1);
  }
}

main();
