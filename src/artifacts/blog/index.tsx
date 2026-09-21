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
        description="Engineering notes on building and running AI systems in production."
        canonical={`${SITE_URL}/blog`}
      />
      <div className="mx-auto w-full max-w-3xl px-6 py-24 sm:py-28">
        <header className="mb-14">
          <Link
            to="/"
            className="text-[12px] uppercase tracking-[0.18em] text-white/40 transition-colors hover:text-white"
          >
            Shivendra Soni
          </Link>
          <h1 className="mt-6 text-[34px] font-semibold leading-tight tracking-tight sm:text-[42px]">
            Writing
          </h1>
          <p className="mt-4 max-w-xl text-[15.5px] leading-relaxed text-white/55">
            Long form notes on building and running AI systems in production. Fewer posts, more
            detail.
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
