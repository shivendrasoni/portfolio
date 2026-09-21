/**
 * Prints the route tree vite-plugin-pages generates, so routing behaviour is
 * verified rather than assumed.
 *
 * This exists because a nested directory under src/artifacts produces a parent
 * route with no element, and main.tsx renders route.element directly. A parent
 * without an element mounts nothing and the page is silently blank.
 */
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true }, logLevel: 'error' });
const mod = await server.ssrLoadModule('virtual:generated-pages-react');

function describe(routes, depth = 0) {
  for (const route of routes) {
    const pad = '  '.repeat(depth);
    const kind = route.index ? '(index)' : `path=${JSON.stringify(route.path)}`;
    console.log(`${pad}${kind} element=${route.element ? 'yes' : 'NONE'}`);
    if (route.children) describe(route.children, depth + 1);
  }
}

describe(mod.default);
await server.close();
