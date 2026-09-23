/**
 * Figure assets: the files a diagram turns into on disk.
 *
 * Diagrams used to be inlined into the page as raw <svg>. That is the best
 * thing for a browser and the worst thing for every other consumer: syndication
 * importers, feed readers and mail clients copy <img> elements and drop inline
 * SVG, so a post arrived on Medium with holes where its figures were. The
 * figures carry information the prose deliberately does not repeat, so a hole
 * is not cosmetic.
 *
 * So each figure is now published as two files and referenced with <picture>:
 *   /blog/figures/<hash>.svg   what a browser takes, sharp at any zoom
 *   /blog/figures/<hash>.png   what an importer takes, dark background baked in
 *
 * Both are content addressed by the same hash the inliner used, so nothing about
 * authoring, review or the build's staleness checks changes. The PNG is rendered
 * offline by scripts/render-diagrams.mjs and committed, exactly like the SVG.
 */

export const FIGURE_DIR = 'blog/figures';
export const FIGURE_BASE = '/blog/figures';

export interface FigureAsset {
  hash: string;
  /** Sanitised, namespaced SVG markup, written out as a standalone file. */
  svg: string;
  /** Absolute path of the committed PNG fallback. */
  pngPath: string;
}

const assets = new Map<string, FigureAsset>();

export function resetFigures(): void {
  assets.clear();
}

export function registerFigure(asset: FigureAsset): void {
  assets.set(asset.hash, asset);
}

export function collectedFigures(): FigureAsset[] {
  return [...assets.values()];
}

export function figureFile(hash: string, ext: 'svg' | 'png'): string {
  return `${FIGURE_BASE}/${hash}.${ext}`;
}

/**
 * Intrinsic size, so the <img> can carry width and height and the page does not
 * reflow when the figure loads. width/height attributes first, viewBox second,
 * and a null result simply means the attributes are omitted rather than guessed.
 */
export function intrinsicSize(svg: string): { width: number; height: number } | null {
  const head = svg.slice(0, svg.indexOf('>') + 1);
  const width = Number.parseFloat(head.match(/\swidth="([\d.]+)(?:px)?"/)?.[1] ?? '');
  const height = Number.parseFloat(head.match(/\sheight="([\d.]+)(?:px)?"/)?.[1] ?? '');
  if (Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const viewBox = head.match(/\sviewBox="([^"]+)"/)?.[1];
  if (viewBox) {
    const parts = viewBox.trim().split(/[\s,]+/).map(Number);
    if (parts.length === 4 && parts.every((n) => Number.isFinite(n)) && parts[2] > 0 && parts[3] > 0) {
      return { width: Math.round(parts[2]), height: Math.round(parts[3]) };
    }
  }
  return null;
}
