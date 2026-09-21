import { Link } from 'react-router-dom';
import type { BlogPostMeta } from '@/types/blog';
import { formatPostDate } from './format';

export default function PostCard({ post }: { post: BlogPostMeta }) {
  return (
    <li className="border-t border-white/10 py-8 first:border-t-0 first:pt-0">
      <Link to={`/blog/${post.slug}`} className="group block">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] uppercase tracking-[0.16em] text-white/40">
          <time dateTime={post.date}>{formatPostDate(post.date)}</time>
          <span aria-hidden="true">/</span>
          <span>{post.readingMinutes} min read</span>
        </div>
        <h2 className="mt-3 text-[22px] font-semibold leading-snug text-white transition-colors group-hover:text-[#6fd3c2] sm:text-[26px]">
          {post.title}
        </h2>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-white/60">
          {post.description}
        </p>
        {post.tags.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="rounded-full border border-white/10 px-2.5 py-1 text-[11px] text-white/45"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </Link>
    </li>
  );
}
