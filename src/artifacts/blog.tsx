import { Outlet } from 'react-router-dom';

/**
 * Parent route for /blog.
 *
 * vite-plugin-pages nests src/artifacts/blog/* under a "blog" route, and
 * main.tsx renders route.element for each top level route. Without this file
 * that parent route has no element, so both /blog and /blog/:slug mount
 * nothing and the page is blank. Verified with scripts/print-routes.mjs.
 *
 * It is deliberately a pass through. Page chrome belongs to the pages.
 */
export default function BlogLayout() {
  return <Outlet />;
}
