/**
 * Post processing for rendered diagram SVG, before it is inlined into a page.
 *
 * Split out of diagrams.ts so the lookup logic and the markup rewriting can be
 * read separately. Nothing here renders anything: the SVG already exists on disk.
 */

import { fail } from './config';

/**
 * Strips anything executable or externally referencing out of the rendered SVG.
 * mermaid-cli output contains none of this today; the guard is here so a future
 * renderer upgrade cannot quietly inject script into every reader's page.
 */
export function sanitiseSvg(file: string, svg: string): string {
  if (/<script[\s>]/i.test(svg)) {
    fail(file, 'rendered SVG contains a <script> element and will not be inlined');
  }
  if (/<foreignObject[\s>]/i.test(svg)) {
    fail(
      file,
      'rendered SVG contains <foreignObject>, which does not render in feed readers. ' +
        'Re-render with htmlLabels disabled.',
    );
  }
  return svg
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, '')
    .replace(/<\?xml[^>]*\?>\s*/i, '')
    .replace(/<!DOCTYPE[^>]*>\s*/i, '')
    .trim();
}

/**
 * mermaid emits a fixed root id ("my-svg"), a <style> block whose selectors are
 * scoped by that id, and short local ids such as "actor0" and "L_A_B_0". Two
 * diagrams on one page would therefore share ids and one stylesheet would style
 * the other. Namespacing everything with the content hash makes each figure self
 * contained.
 *
 * Verified against real mermaid-cli 11 output: every CSS selector in the emitted
 * <style> block is either scoped by the root id or an @keyframes rule whose
 * definition is identical between diagrams.
 */
export function namespaceIds(svg: string, hash: string): string {
  const prefix = `d${hash}`;
  // Root id and every selector and reference derived from it.
  let out = svg.split('my-svg').join(prefix);
  // Remaining short local ids.
  out = out.replace(/\bid="([^"]+)"/g, (match, id: string) =>
    id.startsWith(prefix) ? match : `id="${prefix}-${id}"`,
  );
  out = out.replace(/url\(#([^)]+)\)/g, (match, id: string) =>
    id.startsWith(prefix) ? match : `url(#${prefix}-${id})`,
  );
  out = out.replace(/\b(href|xlink:href)="#([^"]+)"/g, (match, attr: string, id: string) =>
    id.startsWith(prefix) ? match : `${attr}="#${prefix}-${id}"`,
  );
  return out;
}

/**
 * mermaid reuses a few ids inside a single diagram: a sequence diagram gives the
 * top and bottom actor box the same id, and a flowchart labels a path and its
 * label holder identically. Duplicate ids are invalid HTML. None of them is ever
 * referenced, so the attribute is simply dropped where it is both duplicated and
 * unreferenced. Referenced ids, including the root id the <style> block is scoped
 * by, are left untouched.
 */
export function dropDuplicateUnreferencedIds(svg: string): string {
  const counts = new Map<string, number>();
  for (const match of svg.matchAll(/\bid="([^"]+)"/g)) {
    const id = match[1];
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  const droppable = new Set<string>();
  for (const [id, count] of counts) {
    if (count > 1 && !svg.includes(`#${id}`)) droppable.add(id);
  }
  if (droppable.size === 0) return svg;
  return svg.replace(/\s?\bid="([^"]+)"/g, (match, id: string) =>
    droppable.has(id) ? '' : match,
  );
}
