/**
 * The mermaid palette and headless Chromium flags used to render diagrams, plus
 * a fingerprint of the palette.
 *
 * The fingerprint is part of the content address of every rendered SVG, so
 * changing a colour here invalidates the committed renders instead of leaving
 * them silently stale. It is published to
 * content/blog/diagrams/render-config.json, which the build plugin reads.
 */

import crypto from 'node:crypto';

/** Dark only, to match the site. tailwind.config.mjs sets darkMode: ["class"]
 * but the class is never applied and there is no theme toggle, so there is no
 * light surface for a second palette to serve. */
export const MERMAID_CONFIG = {
  theme: 'base',
  // <text> labels rather than <foreignObject>, so the diagram survives a reader
  // that strips HTML and stays legible without the page stylesheet.
  htmlLabels: false,
  flowchart: { htmlLabels: false, curve: 'basis', padding: 12 },
  sequence: { useMaxWidth: true, mirrorActors: false },
  themeVariables: {
    darkMode: true,
    background: 'transparent',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
    fontSize: '14px',
    primaryColor: '#18181b',
    primaryTextColor: '#e4e4e7',
    primaryBorderColor: '#6b6b75',
    secondaryColor: '#111113',
    tertiaryColor: '#0a0a0a',
    lineColor: '#71717a',
    textColor: '#a1a1aa',
    mainBkg: '#18181b',
    nodeBorder: '#6b6b75',
    clusterBkg: '#0f0f11',
    clusterBorder: '#27272a',
    edgeLabelBackground: '#0a0a0a',
    actorBkg: '#18181b',
    actorBorder: '#6b6b75',
    actorTextColor: '#e4e4e7',
    actorLineColor: '#52525b',
    signalColor: '#a1a1aa',
    signalTextColor: '#a1a1aa',
    labelBoxBkgColor: '#18181b',
    labelBoxBorderColor: '#6b6b75',
    labelTextColor: '#e4e4e7',
    loopTextColor: '#a1a1aa',
    noteBkgColor: '#1f1f23',
    noteBorderColor: '#6b6b75',
    noteTextColor: '#e4e4e7',
    sequenceNumberColor: '#0a0a0a',
  },
};

// Headless Chromium in a container has no usable sandbox.
export const PUPPETEER_CONFIG = { args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] };

/**
 * The rendered SVG depends on the diagram source AND on the palette above, so
 * both go into the content address. Otherwise changing a colour here would leave
 * every committed diagram silently stale, which is the exact failure the build
 * check exists to prevent. The fingerprint is published to
 * content/blog/diagrams/render-config.json and the build plugin reads the same
 * file, so the two sides cannot drift.
 */
export const CONFIG_FINGERPRINT = crypto
  .createHash('sha256')
  .update(JSON.stringify(MERMAID_CONFIG))
  .digest('hex')
  .slice(0, 12);
