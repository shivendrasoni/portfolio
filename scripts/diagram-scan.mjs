/**
 * Finds the mermaid fences in content/blog/*.md.
 *
 * Deliberately the same line based scan the build plugin performs, so the
 * renderer and the build cannot disagree about what counts as a diagram.
 */

import fs from 'node:fs';
import path from 'node:path';

/** Same fence scan the build plugin uses: fenced blocks whose info string
 * starts with "mermaid". Kept deliberately simple and line based. */
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
        caption: open.caption,
        source: open.body.join('\n'),
      });
      open = null;
      return;
    }
    const info = fence[1].trim();
    if (/^mermaid(\s|$)/.test(info)) {
      open = { line: index + 1, caption: info.slice('mermaid'.length).trim(), body: [] };
    } else {
      // A non mermaid fence: swallow until it closes so a ```mermaid inside a
      // code sample is not treated as a diagram.
      open = { line: index + 1, caption: null, body: [], ignore: true };
    }
  });
  if (open && !open.ignore) {
    throw new Error(`${file}: unterminated \`\`\`mermaid fence opened on line ${open.line}`);
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
