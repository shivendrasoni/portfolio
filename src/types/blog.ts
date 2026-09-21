/**
 * Client side view of a blog post.
 *
 * Mirrors BlogPostMeta in plugins/blog/config.ts. The two are deliberately
 * separate files because plugins/ is compiled by tsconfig.node.json and src/ by
 * tsconfig.app.json, and a file cannot belong to both projects. If you add a
 * frontmatter field, change both.
 */

export interface TocEntry {
  id: string;
  text: string;
  depth: number;
}

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
