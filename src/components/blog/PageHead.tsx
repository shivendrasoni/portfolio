import { useEffect } from 'react';

/**
 * Keeps the document head correct after a client side navigation.
 *
 * The build already writes real static HTML for every blog URL, which is what
 * crawlers and link preview bots read since they do not run JavaScript. This
 * component only covers the case where the visitor arrives on one page and
 * navigates to another inside the running app.
 */

type MetaKind = 'name' | 'property';

function setMeta(kind: MetaKind, key: string, value: string | undefined) {
  const selector = `meta[${kind}="${key}"]`;
  const existing = document.head.querySelector<HTMLMetaElement>(selector);
  if (!value) {
    existing?.remove();
    return;
  }
  const tag = existing ?? document.createElement('meta');
  tag.setAttribute(kind, key);
  tag.setAttribute('content', value);
  if (!existing) document.head.appendChild(tag);
}

function setCanonical(href: string) {
  const existing = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  const tag = existing ?? document.createElement('link');
  tag.setAttribute('rel', 'canonical');
  tag.setAttribute('href', href);
  if (!existing) document.head.appendChild(tag);
}

export interface PageHeadProps {
  title: string;
  description: string;
  canonical: string;
  type?: 'article' | 'website';
  image?: string;
}

export default function PageHead({
  title,
  description,
  canonical,
  type = 'website',
  image,
}: PageHeadProps) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = title;

    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', canonical);
    setMeta('property', 'og:image', image);
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary');
    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', description);
    setMeta('name', 'twitter:image', image);
    setCanonical(canonical);

    return () => {
      document.title = previousTitle;
    };
  }, [title, description, canonical, type, image]);

  return null;
}
