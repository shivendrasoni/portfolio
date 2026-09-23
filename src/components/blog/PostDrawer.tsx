import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { posts } from 'virtual:blog';
import { formatPostDate } from '@/components/blog/format';

/**
 * Collapsible index of every post, as a left hand drawer.
 *
 * Design constraints this satisfies:
 *   1. Closed by default and rendered as an overlay, so it never occupies
 *      layout space and never covers the prose unless the reader opens it.
 *      That is the same behaviour on a phone and on a wide monitor.
 *   2. No new data. Post metadata is already in `virtual:blog`, which both blog
 *      routes already import, so the only cost is this component.
 *   3. Nothing here runs during prerender. The static HTML written by the build
 *      plugin carries its own plain list of links for crawlers.
 */
export default function PostDrawer({ currentSlug }: { currentSlug?: string }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, close]);

  if (posts.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls="blog-post-drawer"
        aria-label="Open the index of posts"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 inline-flex items-center gap-2 rounded-md border border-white/15 bg-[#0a0a0a]/85 px-3 py-2 text-[12px] uppercase tracking-[0.14em] text-white/60 backdrop-blur transition-colors hover:border-[#6fd3c2]/60 hover:text-[#6fd3c2] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd3c2]"
      >
        <span aria-hidden="true" className="flex flex-col gap-[3px]">
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
          <span className="block h-px w-4 bg-current" />
        </span>
        Index
      </button>

      <div
        aria-hidden={!open}
        className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      >
        <div
          onClick={close}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
        />
        <div
          id="blog-post-drawer"
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="All posts"
          tabIndex={-1}
          className={`absolute inset-y-0 left-0 flex w-[19rem] max-w-[86vw] flex-col border-r border-white/10 bg-[#0d0d0d] shadow-2xl outline-none transition-transform duration-200 ease-out ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div>
              <Link
                to="/blog"
                onClick={close}
                className="text-[15px] font-semibold text-white transition-colors hover:text-[#6fd3c2]"
              >
                Writing
              </Link>
              <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/35">
                {posts.length} posts
              </p>
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Close the index"
              className="-mr-1 rounded p-1 text-[18px] leading-none text-white/45 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#6fd3c2]"
            >
              &times;
            </button>
          </div>

          <nav aria-label="All posts" className="flex-1 overflow-y-auto px-2 py-3">
            <ul>
              {posts.map((post) => {
                const active = post.slug === currentSlug;
                return (
                  <li key={post.slug}>
                    <Link
                      to={`/blog/${post.slug}`}
                      onClick={close}
                      aria-current={active ? 'page' : undefined}
                      className={`block rounded-md px-3 py-2.5 transition-colors ${
                        active
                          ? 'bg-white/[0.06] text-[#6fd3c2]'
                          : 'text-white/70 hover:bg-white/[0.04] hover:text-white'
                      }`}
                    >
                      <span className="block text-[13.5px] leading-snug">{post.title}</span>
                      <span className="mt-1 block text-[10.5px] uppercase tracking-[0.14em] text-white/30">
                        {formatPostDate(post.date)} / {post.readingMinutes} min
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-white/10 px-5 py-4 text-[13px]">
            <Link
              to="/"
              onClick={close}
              className="inline-flex items-center gap-2 text-white/55 transition-colors hover:text-[#6fd3c2]"
            >
              <span aria-hidden="true">&larr;</span> Back to shivendrasoni.com
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
