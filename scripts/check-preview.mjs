/**
 * Fetches the blog surfaces from a running server and reports what came back.
 * Usage: node scripts/check-preview.mjs http://localhost:4173
 *
 * Point it at a Vercel preview URL before asking for a merge. The thing being
 * checked is whether the prerendered HTML actually wins over the SPA catch all
 * rewrite, which is a property of the host, not of the build.
 */
const base = (process.argv[2] ?? 'http://localhost:4173').replace(/\/$/, '');

const paths = ['/blog', '/blog/pipeline-smoke-test', '/rss.xml', '/sitemap.xml', '/robots.txt', '/terminal', '/'];

for (const path of paths) {
  try {
    const res = await fetch(base + path, { redirect: 'manual' });
    const body = await res.text();
    const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? '';
    const desc = body.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    const canonical = body.match(/rel="canonical" href="([^"]*)"/)?.[1] ?? '';
    console.log(
      [
        path.padEnd(28),
        String(res.status).padEnd(4),
        (res.headers.get('content-type') ?? '').split(';')[0].padEnd(24),
        `${body.length}b`.padEnd(9),
        title ? `title="${title}"` : '',
        desc ? ` desc="${desc.slice(0, 60)}"` : '',
        canonical ? ` canonical=${canonical}` : '',
      ].join(' '),
    );
  } catch (error) {
    console.log(`${path.padEnd(28)} FAILED ${error.message}`);
  }
}
