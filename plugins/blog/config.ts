/**
 * Build time blog configuration and shared types.
 * Nothing in plugins/ is ever bundled into the client.
 */

export const SITE_URL = 'https://shivendrasoni.com';
export const BLOG_TITLE = 'Shivendra Soni';
export const BLOG_DESCRIPTION =
  'Engineering notes on building and running AI systems in production.';
export const AUTHOR_NAME = 'Shivendra Soni';
export const CONTENT_DIR = 'content/blog';
/** Committed, build time rendered diagram SVG. Written by scripts/render-diagrams.mjs. */
export const DIAGRAM_DIR = 'content/blog/diagrams';
export const WORDS_PER_MINUTE = 220;

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export const HIGHLIGHT_THEME = 'github-dark-default';
export const HIGHLIGHT_LANGS = [
  'bash',
  'css',
  'diff',
  'html',
  'javascript',
  'json',
  'jsx',
  'markdown',
  'python',
  'sql',
  'tsx',
  'typescript',
  'yaml',
];

export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

/** Serialisable post metadata. This is what reaches the client bundle. */
export interface BlogPostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  updated?: string;
  tags: string[];
  readingMinutes: number;
  wordCount: number;
  canonical: string;
  ogImage?: string;
  toc: TocEntry[];
}

export interface BlogPost extends BlogPostMeta {
  html: string;
  draft: boolean;
  sourceFile: string;
}

export function fail(file: string, message: string): never {
  // Vite already prefixes plugin errors with the plugin name.
  throw new Error(`${file}: ${message}`);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}
