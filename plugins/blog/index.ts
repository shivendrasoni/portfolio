/**
 * Vite plugin: compiles content/blog/*.md at build time and exposes it to the
 * app through virtual modules.
 *
 * Design constraints this plugin exists to satisfy:
 *   1. No markdown parser, YAML parser or syntax highlighter in the client
 *      bundle. The output never changes between deploys, so parsing it in the
 *      browser would be tens of kB of JavaScript spent on a fixed result.
 *   2. Post bodies are split per post. Loading /blog must not download every
 *      article ever written.
 *   3. Invalid content fails the build loudly.
 *
 * Virtual modules:
 *   virtual:blog            metadata for every published post, plus a map of
 *                           slug to a dynamic importer for that post's HTML
 *   virtual:blog-body/SLUG  one post's compiled HTML, its own chunk
 */

import fs from 'node:fs';
import path from 'node:path';
import type { Plugin, ResolvedConfig } from 'vite';
import { CONTENT_DIR, type BlogPost, type BlogPostMeta } from './config';
import { loadPosts } from './load';
import { renderRobots, renderRss, renderSitemap } from './feeds';
import { renderIndexPage, renderPostPage } from './prerender';

const VIRTUAL_INDEX = 'virtual:blog';
const RESOLVED_INDEX = '\0virtual:blog';
const VIRTUAL_BODY = 'virtual:blog-body/';
const RESOLVED_BODY = '\0virtual:blog-body/';

function toMeta(post: BlogPost): BlogPostMeta {
  return {
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
    updated: post.updated,
    tags: post.tags,
    readingMinutes: post.readingMinutes,
    wordCount: post.wordCount,
    canonical: post.canonical,
    ogImage: post.ogImage,
    toc: post.toc,
  };
}

function indexModule(posts: BlogPost[]): string {
  const meta = JSON.stringify(posts.map(toMeta), null, 2);
  const importers = posts
    .map((post) => `  ${JSON.stringify(post.slug)}: () => import('${VIRTUAL_BODY}${post.slug}'),`)
    .join('\n');
  return [
    `export const posts = ${meta};`,
    '',
    'export const bodies = {',
    importers,
    '};',
    '',
    'export function findPost(slug) {',
    '  return posts.find((post) => post.slug === slug);',
    '}',
    '',
  ].join('\n');
}

export default function blogPlugin(): Plugin {
  let config: ResolvedConfig;
  let posts: BlogPost[] = [];
  // Rollup still runs closeBundle after a failed buildStart. Without this flag
  // a validation failure would rewrite rss.xml and sitemap.xml with an empty
  // post list, leaving a broken dist behind on a build that did not succeed.
  let loaded = false;

  async function reload(): Promise<void> {
    // Drafts are visible on the dev server and never in a production build.
    loaded = false;
    posts = await loadPosts(config.root, config.command === 'serve');
    loaded = true;
  }

  return {
    name: 'blog',
    enforce: 'pre',

    configResolved(resolved) {
      config = resolved;
    },

    async buildStart() {
      await reload();
      const dir = path.join(config.root, CONTENT_DIR);
      if (fs.existsSync(dir)) this.addWatchFile(dir);
      for (const post of posts) {
        this.addWatchFile(path.join(config.root, post.sourceFile));
      }
    },

    resolveId(id) {
      if (id === VIRTUAL_INDEX) return RESOLVED_INDEX;
      if (id.startsWith(VIRTUAL_BODY)) return `\0${id}`;
      return null;
    },

    load(id) {
      if (id === RESOLVED_INDEX) return indexModule(posts);
      if (id.startsWith(RESOLVED_BODY)) {
        const slug = id.slice(RESOLVED_BODY.length);
        const post = posts.find((item) => item.slug === slug);
        if (!post) return `export default '';`;
        return `export default ${JSON.stringify(post.html)};`;
      }
      return null;
    },

    configureServer(server) {
      const watched = path.join(config.root, CONTENT_DIR);
      server.watcher.add(watched);
      const invalidate = async (file: string) => {
        if (!file.startsWith(watched)) return;
        await reload();
        for (const id of [RESOLVED_INDEX, ...posts.map((p) => `${RESOLVED_BODY}${p.slug}`)]) {
          const mod = server.moduleGraph.getModuleById(id);
          if (mod) server.moduleGraph.invalidateModule(mod);
        }
        server.ws.send({ type: 'full-reload' });
      };
      server.watcher.on('add', invalidate);
      server.watcher.on('change', invalidate);
      server.watcher.on('unlink', invalidate);
    },

    /**
     * Written directly to disk rather than emitted as assets because the
     * prerendered pages need the final index.html, which Vite writes last.
     */
    closeBundle() {
      if (config.command !== 'build' || !loaded) return;
      const outDir = path.resolve(config.root, config.build.outDir);
      const shellPath = path.join(outDir, 'index.html');
      if (!fs.existsSync(shellPath)) return;
      const shell = fs.readFileSync(shellPath, 'utf8');

      fs.writeFileSync(path.join(outDir, 'rss.xml'), renderRss(posts));
      fs.writeFileSync(path.join(outDir, 'sitemap.xml'), renderSitemap(posts));
      fs.writeFileSync(path.join(outDir, 'robots.txt'), renderRobots());

      const blogDir = path.join(outDir, 'blog');
      fs.mkdirSync(blogDir, { recursive: true });
      // Flat here too: /blog resolves to blog.html under "cleanUrls". A
      // directory index at blog/index.html is only served for /blog/ on a plain
      // static server, and /blog is the URL people actually type and link.
      fs.writeFileSync(path.join(outDir, 'blog.html'), renderIndexPage(shell, posts));

      // Flat files, one per post, paired with "cleanUrls" in vercel.json so that
      // /blog/<slug> resolves against the filesystem before the SPA catch all
      // rewrite sees it. The directory form (blog/<slug>/index.html) was built
      // and measured first: a static server serves it at /blog/<slug>/ but lets
      // the extensionless /blog/<slug> fall through to the SPA shell, which is
      // the URL that actually gets shared.
      for (const post of posts) {
        fs.writeFileSync(path.join(blogDir, post.slug + '.html'), renderPostPage(shell, post, posts));
      }

      const label = posts.length === 1 ? 'post' : 'posts';
      config.logger.info(
        `[blog] prerendered ${posts.length} ${label}, rss.xml, sitemap.xml, robots.txt`,
      );
    },
  };
}
