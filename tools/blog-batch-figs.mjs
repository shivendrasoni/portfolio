// Prints the committed SVG paths a single post depends on, so the workflow can
// commit each post together with its own figures rather than in one blob dump.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { CONFIG_FINGERPRINT } from '../scripts/diagram-palette.mjs';
import { extractDiagrams } from '../scripts/diagram-scan.mjs';

const NL = String.fromCharCode(10);
const slug = process.argv[2];
const file = slug + '.md';
const full = path.join('content/blog', file);
const markdown = fs.readFileSync(full, 'utf8');
const diagrams = extractDiagrams(markdown, file);
const out = [];
for (const d of diagrams) {
  const hash = crypto
    .createHash('sha256')
    .update(CONFIG_FINGERPRINT + NL + d.source.trim())
    .digest('hex')
    .slice(0, 12);
  const p = path.join('content/blog/diagrams', hash + '.svg');
  if (!fs.existsSync(p)) {
    console.error('missing render for ' + file + ': ' + p);
    process.exit(1);
  }
  out.push(p);
}
process.stdout.write(out.join(' '));
