/**
 * Generated at build time and written as real static files into dist, so that
 * Vercel serves them from the filesystem rather than falling through the
 * SPA catch all rewrite.
 */

import {
  AUTHOR_NAME,
  BLOG_DESCRIPTION,
  BLOG_TITLE,
  SITE_URL,
  escapeHtml,
  postUrl,
  type BlogPost,
} from './config';

/** Routes that exist outside the blog and still belong in the sitemap. */
const STATIC_ROUTES = ['/', '/terminal', '/blog'];

function rfc822(date: string): string {
  return new Date(`${date}T09:00:00+05:30`).toUTCString();
}

export function renderRss(posts: BlogPost[]): string {
  const latest = posts[0]?.date;
  const items = posts
    .map((post) => {
      const url = postUrl(post.slug);
      return [
        '    <item>',
        `      <title>${escapeHtml(post.title)}</title>`,
        `      <link>${url}</link>`,
        `      <guid isPermaLink="true">${url}</guid>`,
        `      <pubDate>${rfc822(post.date)}</pubDate>`,
        `      <description>${escapeHtml(post.description)}</description>`,
        ...post.tags.map((tag) => `      <category>${escapeHtml(tag)}</category>`),
        '    </item>',
      ].join('\n');
    })
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>${escapeHtml(`${BLOG_TITLE} | Writing`)}</title>`,
    `    <link>${SITE_URL}/blog</link>`,
    `    <description>${escapeHtml(BLOG_DESCRIPTION)}</description>`,
    '    <language>en</language>',
    `    <managingEditor>${escapeHtml(AUTHOR_NAME)}</managingEditor>`,
    latest ? `    <lastBuildDate>${rfc822(latest)}</lastBuildDate>` : '',
    `    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ]
    .filter((line) => line !== '')
    .join('\n');
}

export function renderSitemap(posts: BlogPost[]): string {
  const urls = [
    ...STATIC_ROUTES.map((route) => ({
      loc: route === '/' ? SITE_URL : `${SITE_URL}${route}`,
      lastmod: undefined as string | undefined,
    })),
    ...posts.map((post) => ({ loc: postUrl(post.slug), lastmod: post.updated ?? post.date })),
  ];

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls.map((url) =>
      [
        '  <url>',
        `    <loc>${url.loc}</loc>`,
        url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>` : '',
        '  </url>',
      ]
        .filter((line) => line !== '')
        .join('\n'),
    ),
    '</urlset>',
    '',
  ].join('\n');
}

export function renderRobots(): string {
  return ['User-agent: *', 'Allow: /', '', `Sitemap: ${SITE_URL}/sitemap.xml`, ''].join('\n');
}
