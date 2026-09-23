/**
 * Static prerender of the blog routes.
 *
 * Reason this exists: link preview bots (LinkedIn, X, Slack, WhatsApp) and some
 * crawlers do not execute JavaScript. On a plain SPA every post would unfurl
 * with the site wide title and no description no matter what React sets in the
 * head. Writing one real HTML file per post fixes that without turning the site
 * into a framework.
 *
 * The React app still owns the page once it boots. createRoot clears the
 * container, so the prerendered markup is a crawler payload and a first paint,
 * not a hydration target.
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

const ROOT_MARKER = '<div id="root"></div>';

function meta(name: string, content: string): string {
  return `    <meta name="${name}" content="${escapeHtml(content)}" />`;
}

function og(property: string, content: string): string {
  return `    <meta property="${property}" content="${escapeHtml(content)}" />`;
}

interface HeadOptions {
  title: string;
  description: string;
  canonical: string;
  type: 'article' | 'website';
  image?: string;
  publishedAt?: string;
  updatedAt?: string;
  tags?: string[];
  jsonLd?: string;
}

function buildHead(options: HeadOptions): string {
  const image = options.image ? new URL(options.image, SITE_URL).toString() : undefined;
  const lines = [
    `    <title>${escapeHtml(options.title)}</title>`,
    meta('description', options.description),
    `    <link rel="canonical" href="${options.canonical}" />`,
    og('og:type', options.type),
    og('og:title', options.title),
    og('og:description', options.description),
    og('og:url', options.canonical),
    og('og:site_name', BLOG_TITLE),
    meta('twitter:card', image ? 'summary_large_image' : 'summary'),
    meta('twitter:title', options.title),
    meta('twitter:description', options.description),
  ];
  if (image) {
    lines.push(og('og:image', image), meta('twitter:image', image));
  }
  if (options.publishedAt) {
    lines.push(og('article:published_time', options.publishedAt));
  }
  if (options.updatedAt) {
    lines.push(og('article:modified_time', options.updatedAt));
  }
  for (const tag of options.tags ?? []) {
    lines.push(og('article:tag', tag));
  }
  if (options.jsonLd) {
    lines.push(`    <script type="application/ld+json">${options.jsonLd}</script>`);
  }
  return lines.join('\n');
}

/**
 * Replaces the shell's own title and injects blog head tags, then swaps a
 * static body into #root.
 */
function compose(shell: string, head: string, body: string): string {
  const withoutTitle = shell.replace(/\s*<title>[\s\S]*?<\/title>/, '');
  const withHead = withoutTitle.replace('</head>', `${head}\n  </head>`);
  return withHead.replace(ROOT_MARKER, `<div id="root">${body}</div>`);
}

function articleJsonLd(post: BlogPost): string {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated ?? post.date,
    author: { '@type': 'Person', name: AUTHOR_NAME, url: SITE_URL },
    mainEntityOfPage: { '@type': 'WebPage', '@id': postUrl(post.slug) },
    keywords: post.tags.join(', '),
    url: postUrl(post.slug),
  };
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

function staticPostIndex(posts: BlogPost[], currentSlug: string): string {
  const items = posts
    .map((entry) =>
      entry.slug === currentSlug
        ? `<li>${escapeHtml(entry.title)}</li>`
        : `<li><a href="/blog/${entry.slug}">${escapeHtml(entry.title)}</a></li>`,
    )
    .join('');
  return `<nav aria-label="All posts"><h2>All writing</h2><ul>${items}</ul></nav>`;
}

export function renderPostPage(shell: string, post: BlogPost, all: BlogPost[] = []): string {
  const head = buildHead({
    // Bare title, no site suffix. Anything that republishes a post reads
    // <title> verbatim, so a suffix here becomes part of the headline on the
    // other platform. og:site_name already carries the site name, and the
    // index page below keeps the suffix because it has no headline of its own.
    title: post.title,
    description: post.description,
    canonical: post.canonical,
    type: 'article',
    image: post.ogImage,
    publishedAt: post.date,
    updatedAt: post.updated,
    tags: post.tags,
    jsonLd: articleJsonLd(post),
  });

  // The article is the only thing inside <main>, and the list of other posts
  // sits outside it in a <footer>. Readers that extract "the content" of a page
  // pick the densest container: with the index inside <main> a republished copy
  // can end up with sixteen unrelated titles appended to the argument.
  const body = [
    '<main class="blog-static">',
    '<article class="blog-static-article">',
    `<h1>${escapeHtml(post.title)}</h1>`,
    `<p>${escapeHtml(post.description)}</p>`,
    // Date only. Reading time is shown by the site itself, and a republished
    // copy usually computes and shows its own, so carrying ours produces two.
    `<p><time datetime="${post.date}">${post.date}</time></p>`,
    `<div class="blog-prose">${post.html}</div>`,
    '</article>',
    '</main>',
    `<footer class="blog-static-footer">${staticPostIndex(all, post.slug)}</footer>`,
  ].join('');

  return compose(shell, head, body);
}

export function renderIndexPage(shell: string, posts: BlogPost[]): string {
  const head = buildHead({
    title: `Writing | ${BLOG_TITLE}`,
    description: BLOG_DESCRIPTION,
    canonical: `${SITE_URL}/blog`,
    type: 'website',
  });

  const items = posts
    .map(
      (post) =>
        `<li><a href="/blog/${post.slug}">${escapeHtml(post.title)}</a>` +
        `<p>${escapeHtml(post.description)}</p>` +
        `<time datetime="${post.date}">${post.date}</time></li>`,
    )
    .join('');

  const body = `<main class="blog-static"><h1>Writing</h1><ul>${items}</ul></main>`;
  return compose(shell, head, body);
}
