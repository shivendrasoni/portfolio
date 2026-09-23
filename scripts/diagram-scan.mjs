/**
 * Finds the figure fences in content/blog/*.md.
 *
 * Deliberately the same line based scan the build plugin performs, so the
 * renderer and the build cannot disagree about what counts as a diagram.
 *
 * Two kinds:
 *   ```mermaid <caption>   rendered offline to a committed SVG
 *   ```svg <caption>       hand authored, source lives in the markdown
 * Both need a committed PNG fallback, so both are returned here.
 */

import fs from 'node:fs';

/** Fenced blocks whose info string starts with "mermaid" or "svg". Kept
 * deliberately simple and line based. */
export function extractDiagrams(markdown, file) {
  const lines = markdown.split('\n');
  const found = [];
  let open = null;
  lines.forEach((line, index) => {
    const fence = line.match(/^\s*```(.*)$/);
    if (!fence) {
      if (open) open.body.push(line);
      return;
    }
    if (open) {
      found.push({
        file,
        line: open.line,
        kind: open.kind,
        caption: open.caption,
        source: open.body.join('\n'),
      });
      open = null;
      return;
    }
    const info = fence[1].trim();
    if (/^mermaid(\s|$)/.test(info)) {
      open = {
        line: index + 1,
        kind: 'mermaid',
        caption: info.slice('mermaid'.length).trim(),
        body: [],
      };
    } else if (/^svg(\s|$)/.test(info)) {
      open = { line: index + 1, kind: 'svg', caption: info.slice('svg'.length).trim(), body: [] };
    } else {
      // A fence that is not a figure: swallow until it closes so a ```mermaid
      // inside a code sample is not treated as a diagram.
      open = { line: index + 1, kind: null, caption: null, body: [], ignore: true };
    }
  });
  if (open && !open.ignore) {
    throw new Error(`${file}: unterminated \`\`\`${open.kind} fence opened on line ${open.line}`);
  }
  return found.filter((d) => d.caption !== null);
}

export function listPosts(CONTENT_DIR) {
  if (!fs.existsSync(CONTENT_DIR)) return [];
  return fs
    .readdirSync(CONTENT_DIR)
    .filter((n) => n.endsWith('.md') && n !== 'README.md' && !n.startsWith('_'))
    .sort();
}
