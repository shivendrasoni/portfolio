/**
 * Diagrams, resolved at build time from committed SVG.
 *
 * A post authors a diagram as a ```mermaid fence, so the source lives in the
 * markdown and is reviewable in a PR diff. The SVG is rendered OFFLINE by
 * scripts/render-diagrams.mjs and committed under content/blog/diagrams. This
 * plugin only looks the rendered file up by a hash of the fence body and inlines
 * it, which means:
 *   - the deploy build needs no browser and no diagram library,
 *   - the client downloads zero diagram JavaScript,
 *   - the diagram is inside the prerendered HTML that search and unfurls read.
 *
 * A missing or stale render FAILS THE BUILD. A post must never ship without the
 * diagram its argument depends on.
 */

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { DIAGRAM_DIR, escapeHtml, fail } from './config';
import { figureFile, intrinsicSize, registerFigure } from './figures';
import { dropDuplicateUnreferencedIds, namespaceIds, sanitiseSvg } from './svg';

export interface DiagramContext {
  root: string;
  /** Source file name, used only in error messages. */
  file: string;
}

/**
 * The renderer publishes a fingerprint of the mermaid palette it used. It is
 * part of the content address, so changing the palette invalidates every
 * committed SVG instead of leaving them silently stale.
 */
const fingerprintCache = new Map<string, string>();

function renderConfigFingerprint(ctx: DiagramContext): string {
  const cached = fingerprintCache.get(ctx.root);
  if (cached) return cached;

  const configPath = path.join(ctx.root, DIAGRAM_DIR, 'render-config.json');
  if (!fs.existsSync(configPath)) {
    fail(
      ctx.file,
      `this post contains a diagram but ${DIAGRAM_DIR}/render-config.json is missing. ` +
        'Run "npm run diagrams" and commit content/blog/diagrams.',
    );
  }
  const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8')) as { fingerprint?: unknown };
  if (typeof parsed.fingerprint !== 'string' || parsed.fingerprint === '') {
    fail(ctx.file, `${DIAGRAM_DIR}/render-config.json has no "fingerprint" string`);
  }
  fingerprintCache.set(ctx.root, parsed.fingerprint);
  return parsed.fingerprint;
}

/** Content address of a fence body plus the palette it was rendered with.
 * Whitespace normalised so reindenting a diagram does not orphan its render. */
export function diagramHash(fingerprint: string, source: string): string {
  const normalised = source.replace(/\r\n/g, '\n').trim();
  return crypto
    .createHash('sha256')
    .update(`${fingerprint}\n${normalised}`)
    .digest('hex')
    .slice(0, 12);
}

/**
 * The info string is `mermaid` followed by an optional caption:
 *   ```mermaid Write path for a new short link
 * The caption becomes the figcaption and part of the accessible name, so it is
 * required: a diagram with no caption is a diagram nobody can cite.
 */
export function parseDiagramInfo(
  infostring: string,
): { kind: 'mermaid' | 'svg'; caption: string } | null {
  const trimmed = infostring.trim();
  if (/^mermaid(\s|$)/.test(trimmed)) {
    return { kind: 'mermaid', caption: trimmed.slice('mermaid'.length).trim() };
  }
  // A hand authored figure. mermaid cannot draw some shapes (a hash ring is the
  // standing example), so the SVG source itself lives in the markdown: still
  // text, still reviewable in the diff, still zero client JavaScript, and it
  // needs no offline render step because there is nothing to render.
  if (/^svg(\s|$)/.test(trimmed)) {
    return { kind: 'svg', caption: trimmed.slice('svg'.length).trim() };
  }
  return null;
}

/**
 * Returns the <figure> HTML for one diagram fence, or throws with the exact
 * command that fixes it.
 */
export function renderDiagram(
  ctx: DiagramContext,
  source: string,
  caption: string,
  index: number,
  kind: 'mermaid' | 'svg' = 'mermaid',
): string {
  if (caption === '') {
    fail(
      ctx.file,
      `diagram ${index} has no caption. Write the caption on the fence: ` +
        '```mermaid Write path for a new short link',
    );
  }

  if (kind === 'svg') {
    return figure(ctx, source, caption, hashOfSource(source), index);
  }

  const hash = diagramHash(renderConfigFingerprint(ctx), source);
  const svgPath = path.join(ctx.root, DIAGRAM_DIR, `${hash}.svg`);

  if (!fs.existsSync(svgPath)) {
    fail(
      ctx.file,
      `diagram ${index} ("${caption}") has no rendered SVG at ` +
        `${DIAGRAM_DIR}/${hash}.svg. The diagram source changed or was never rendered. ` +
        'Run "npm run diagrams" and commit the result.',
    );
  }

  return figure(ctx, fs.readFileSync(svgPath, 'utf8'), caption, hash, index);
}

/** Content address of a hand authored figure. No palette fingerprint: nothing
 * was rendered, so there is no renderer version to invalidate against. */
function hashOfSource(source: string): string {
  return crypto
    .createHash('sha256')
    .update(source.replace(/\r\n/g, '\n').trim())
    .digest('hex')
    .slice(0, 12);
}

/**
 * Sanitise, namespace, publish as files, and wrap in <picture>.
 *
 * Identical treatment for rendered and hand authored SVG, so a hand authored
 * figure cannot smuggle in a script, an event handler, or an id that restyles
 * another figure on the same page.
 *
 * The <source> is the SVG, so every browser shows the vector. The <img> is the
 * committed PNG with the site background baked in, which is what an importer or
 * a mail client copies when it cannot carry inline SVG, and what a reader sees
 * on a white page. A missing PNG FAILS THE BUILD for the same reason a missing
 * SVG does: a post must not ship without the figure its argument depends on.
 */
function figure(
  ctx: DiagramContext,
  rawSvg: string,
  caption: string,
  hash: string,
  index: number,
): string {
  const raw = sanitiseSvg(ctx.file, rawSvg);
  const svg = namespaceIds(dropDuplicateUnreferencedIds(raw), hash);
  const labelId = `d${hash}-caption`;

  const pngPath = path.join(ctx.root, DIAGRAM_DIR, `${hash}.png`);
  if (!fs.existsSync(pngPath)) {
    fail(
      ctx.file,
      `diagram ${index} ("${caption}") has no PNG fallback at ` +
        `${DIAGRAM_DIR}/${hash}.png. Run "npm run diagrams" and commit the result.`,
    );
  }
  registerFigure({ hash, svg, pngPath });

  const size = intrinsicSize(svg);
  const dimensions = size ? ` width="${size.width}" height="${size.height}"` : '';
  // The caption is the accessible name of the figure and the alt text of the
  // image: one sentence, one source of truth, and it travels with the <img>
  // into anything that copies the image and drops the <figcaption>.
  const alt = escapeHtml(caption);

  return (
    `<figure class="blog-figure" role="group" aria-labelledby="${labelId}">` +
    `<div class="blog-figure-svg">` +
    `<picture>` +
    `<source srcset="${figureFile(hash, 'svg')}" type="image/svg+xml" />` +
    `<img src="${figureFile(hash, 'png')}" alt="${alt}"${dimensions} loading="lazy" decoding="async" />` +
    `</picture>` +
    `</div>` +
    `<figcaption id="${labelId}">${escapeHtml(caption)}</figcaption>` +
    `</figure>`
  );
}
