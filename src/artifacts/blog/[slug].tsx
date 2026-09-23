import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { bodies, findPost } from 'virtual:blog';
import PageHead from '@/components/blog/PageHead';
import PostDrawer from '@/components/blog/PostDrawer';
import TableOfContents from '@/components/blog/TableOfContents';
import { formatPostDate } from '@/components/blog/format';
import '@/components/blog/prose.css';

const SITE_URL = 'https://shivendrasoni.com';

/**
 * The router's catch all sends unknown paths to "/", which would make a wrong
 * slug look like a broken site. This route handles its own not found state
 * instead.
 */
function NotFound() {
  return (
    <main className="font-inter flex min-h-screen items-center justify-center bg-[#0a0a0a] px-6 text-white">
      <div className="max-w-md text-center">
        <p className="text-[12px] uppercase tracking-[0.18em] text-white/40">404</p>
        <h1 className="mt-4 text-[26px] font-semibold">That post does not exist</h1>
        <div className="mt-6 flex items-center justify-center gap-5 text-[14px]">
          <Link to="/blog" className="text-[#6fd3c2] underline underline-offset-4">
            All writing
          </Link>
          <Link to="/" className="text-white/60 underline underline-offset-4 hover:text-white">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function BlogPost() {
  const { slug = '' } = useParams();
  const post = findPost(slug);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loader = bodies[slug];
    if (!loader) {
      setHtml(null);
      return;
    }
    setHtml(null);
    loader()
      .then((mod) => {
        if (cancelled) return;
        setHtml(mod.default);
        // The body arrives after mount, so the browser has already given up on
        // any #section in the URL. Re-run the jump once the headings exist.
        const hash = window.location.hash.slice(1);
        if (hash) {
          window.requestAnimationFrame(() => {
            document.getElementById(hash)?.scrollIntoView();
          });
        }
      })
      .catch(() => {
        if (!cancelled) setHtml('');
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (!post) return <NotFound />;

  return (
    <main className="font-inter min-h-screen bg-[#0a0a0a] text-white antialiased">
      <PageHead
        title={`${post.title} | Shivendra Soni`}
        description={post.description}
        canonical={post.canonical}
        type="article"
        image={post.ogImage ? new URL(post.ogImage, SITE_URL).toString() : undefined}
      />
      <PostDrawer currentSlug={post.slug} />
      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
        <nav
          aria-label="Breadcrumb"
          className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-white/70"
        >
          <Link
            to="/"
            className="group inline-flex items-center gap-2 transition-colors hover:text-[#6fd3c2]"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="border-b border-white/25 pb-0.5 transition-colors group-hover:border-[#6fd3c2]">
              Shivendra Soni
            </span>
          </Link>
          <span aria-hidden="true" className="text-white/25">
            /
          </span>
          <Link
            to="/blog"
            className="border-b border-white/25 pb-0.5 transition-colors hover:border-[#6fd3c2] hover:text-[#6fd3c2]"
          >
            All writing
          </Link>
        </nav>

        <header className="mb-12 mt-8">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight sm:text-[40px]">
            {post.title}
          </h1>
          <p className="mt-4 text-[16px] leading-relaxed text-white/60">{post.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
            <time dateTime={post.date}>{formatPostDate(post.date)}</time>
            <span aria-hidden="true">/</span>
            <span>{post.readingMinutes} min read</span>
            {post.updated && (
              <>
                <span aria-hidden="true">/</span>
                <span>Updated {formatPostDate(post.updated)}</span>
              </>
            )}
          </div>
        </header>

        <TableOfContents entries={post.toc} />

        {html === null ? (
          <div className="h-40" aria-busy="true" />
        ) : (
          <article className="blog-prose" dangerouslySetInnerHTML={{ __html: html }} />
        )}

        <footer className="mt-16 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/10 pt-8 text-[13px]">
          <Link to="/blog" className="text-white/60 transition-colors hover:text-[#6fd3c2]">
            More writing
          </Link>
          <Link to="/" className="text-white/60 transition-colors hover:text-[#6fd3c2]">
            Back to shivendrasoni.com
          </Link>
        </footer>
      </div>
    </main>
  );
}
