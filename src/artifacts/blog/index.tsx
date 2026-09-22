import { Link } from 'react-router-dom';
import { posts } from 'virtual:blog';
import PageHead from '@/components/blog/PageHead';
import PostCard from '@/components/blog/PostCard';
import '@/components/blog/prose.css';

const SITE_URL = 'https://shivendrasoni.com';

export default function BlogIndex() {
  return (
    <main className="font-inter min-h-screen bg-[#0a0a0a] text-white antialiased">
      <PageHead
        title="Writing | Shivendra Soni"
        description="Long form notes, observations and opinions on building and running systems in production and at scale."
        canonical={`${SITE_URL}/blog`}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
        <header className="mb-14">
          <Link
            to="/"
            className="group inline-flex items-center gap-2 text-[13px] text-white/70 transition-colors hover:text-[#6fd3c2]"
          >
            <span aria-hidden="true">&larr;</span>
            <span className="border-b border-white/25 pb-0.5 transition-colors group-hover:border-[#6fd3c2]">
              Shivendra Soni
            </span>
          </Link>
          <h1 className="mt-6 text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">
            Writing
          </h1>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-white/55">
            Long form notes, observations and opinions on building and running systems in
            production and at scale. I try to go into as much depth as I possibly can here, so
            these might be a bit lengthy.
          </p>
          <a
            href="/rss.xml"
            className="mt-6 inline-block text-[12px] uppercase tracking-[0.16em] text-white/40 transition-colors hover:text-[#6fd3c2]"
          >
            RSS
          </a>
        </header>

        {posts.length === 0 ? (
          <p className="text-[15px] text-white/50">Nothing published yet.</p>
        ) : (
          <ul>
            {posts.map((post) => (
              <PostCard key={post.slug} post={post} />
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
