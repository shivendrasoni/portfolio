/**
 * Types for the virtual modules produced by plugins/blog.
 *
 * The post bodies are compiled to HTML at build time, so the client never
 * loads a markdown parser, a YAML parser or a syntax highlighter.
 */

declare module 'virtual:blog' {
  import type { BlogPostMeta } from '@/types/blog';

  export const posts: BlogPostMeta[];
  export const bodies: Record<string, () => Promise<{ default: string }>>;
  export function findPost(slug: string): BlogPostMeta | undefined;
}
