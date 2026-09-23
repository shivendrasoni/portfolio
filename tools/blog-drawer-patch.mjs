// TEMPORARY, removed by this branch's final commit.
// Wires the post index drawer into the two blog routes and adds a plain list of
// posts to the prerendered HTML. Written as a patch rather than as whole file
// upserts so the diff a reviewer reads is the change itself.
import fs from 'node:fs';

const ROOT = process.argv[2] ? process.argv[2] + '/' : '';

function patch(p, pairs) {
  let t = fs.readFileSync(ROOT + p, 'utf8');
  for (const [from, to] of pairs) {
    if (!t.includes(from)) {
      console.error('NOT FOUND in ' + p + ':\n' + from);
      process.exit(1);
    }
    t = t.replace(from, to);
  }
  fs.writeFileSync(ROOT + p, t);
  console.log('patched ' + p);
}

patch('src/artifacts/blog/[slug].tsx', [
  [
    "import PageHead from '@/components/blog/PageHead';",
    "import PageHead from '@/components/blog/PageHead';\nimport PostDrawer from '@/components/blog/PostDrawer';",
  ],
  [
    '      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">\n        <nav\n          aria-label="Breadcrumb"',
    '      <PostDrawer currentSlug={post.slug} />\n      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">\n        <nav\n          aria-label="Breadcrumb"',
  ],
]);

patch('src/artifacts/blog/index.tsx', [
  [
    "import PostCard from '@/components/blog/PostCard';",
    "import PostCard from '@/components/blog/PostCard';\nimport PostDrawer from '@/components/blog/PostDrawer';",
  ],
  [
    '      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">\n        <header className="mb-14">',
    '      <PostDrawer />\n      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">\n        <header className="mb-14">',
  ],
]);

patch('plugins/blog/prerender.ts', [
  [
    'export function renderPostPage(shell: string, post: BlogPost): string {',
    "function staticPostIndex(posts: BlogPost[], currentSlug: string): string {\n  const items = posts\n    .map((entry) =>\n      entry.slug === currentSlug\n        ? `<li>${escapeHtml(entry.title)}</li>`\n        : `<li><a href=\"/blog/${entry.slug}\">${escapeHtml(entry.title)}</a></li>`,\n    )\n    .join('');\n  return `<nav aria-label=\"All posts\"><h2>All writing</h2><ul>${items}</ul></nav>`;\n}\n\nexport function renderPostPage(shell: string, post: BlogPost, all: BlogPost[] = []): string {",
  ],
  [
    "    '</article>',\n    '</main>',",
    "    '</article>',\n    staticPostIndex(all, post.slug),\n    '</main>',",
  ],
]);

patch('plugins/blog/index.ts', [
  ['renderPostPage(shell, post));', 'renderPostPage(shell, post, posts));'],
]);
