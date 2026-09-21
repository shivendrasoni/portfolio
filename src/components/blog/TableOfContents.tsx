import type { TocEntry } from '@/types/blog';

/**
 * Section index for a long post. A deep piece is navigated and shared by
 * section, so every heading has a stable id and a linkable anchor.
 */
export default function TableOfContents({ entries }: { entries: TocEntry[] }) {
  if (entries.length < 3) return null;

  return (
    <nav aria-label="On this page" className="mb-12 border-l border-white/10 pl-4">
      <p className="mb-2 text-[11px] uppercase tracking-[0.18em] text-white/40">On this page</p>
      <ul className="space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className={entry.depth > 2 ? 'pl-4' : undefined}>
            <a
              href={`#${entry.id}`}
              className="text-[13.5px] text-white/60 transition-colors hover:text-white"
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
