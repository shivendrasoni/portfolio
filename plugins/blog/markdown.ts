/**
 * Markdown to HTML, at build time.
 *
 * Code blocks are highlighted with Shiki before parsing, so the renderer stays
 * synchronous and the browser receives plain pre-coloured HTML. Headings get
 * stable anchor ids because a deep post is shared by section.
 */

import { Marked, Renderer } from 'marked';
import { createHighlighter, type Highlighter } from 'shiki';
import { parseDiagramInfo, renderDiagram, type DiagramContext } from './diagrams';
import {
  HIGHLIGHT_LANGS,
  HIGHLIGHT_THEME,
  escapeHtml,
  slugifyHeading,
  type TocEntry,
} from './config';

let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: [HIGHLIGHT_THEME],
      langs: HIGHLIGHT_LANGS,
    });
  }
  return highlighterPromise;
}

export interface RenderResult {
  html: string;
  toc: TocEntry[];
}

interface CodeToken {
  type: string;
  text?: string;
  lang?: string;
  tokens?: CodeToken[];
  depth?: number;
}

function collectCodeBlocks(tokens: CodeToken[], out: CodeToken[]): void {
  for (const token of tokens) {
    if (token.type === 'code') out.push(token);
    if (token.tokens) collectCodeBlocks(token.tokens, out);
  }
}

function codeKey(lang: string, text: string): string {
  return `${lang}\u0000${text}`;
}

export async function renderMarkdown(
  markdown: string,
  diagrams?: DiagramContext,
): Promise<RenderResult> {
  const marked = new Marked({ gfm: true, breaks: false });
  const tokens = marked.lexer(markdown) as unknown as CodeToken[];

  const codeTokens: CodeToken[] = [];
  collectCodeBlocks(tokens, codeTokens);

  const highlighted = new Map<string, string>();
  if (codeTokens.length > 0) {
    const highlighter = await getHighlighter();
    const known = new Set(highlighter.getLoadedLanguages());
    for (const token of codeTokens) {
      // A diagram fence is not code and is never highlighted.
      if (parseDiagramInfo(token.lang ?? '')) continue;
      const raw = (token.lang ?? '').trim().split(/\s+/)[0] ?? '';
      const lang = known.has(raw) ? raw : 'text';
      const text = token.text ?? '';
      highlighted.set(
        codeKey(token.lang ?? '', text),
        highlighter.codeToHtml(text, { lang, theme: HIGHLIGHT_THEME }),
      );
    }
  }

  const toc: TocEntry[] = [];
  const usedIds = new Set<string>();
  const renderer = new Renderer();

  let diagramCount = 0;
  renderer.code = (code: string, infostring: string | undefined) => {
    const diagram = parseDiagramInfo(infostring ?? '');
    if (diagram) {
      diagramCount += 1;
      if (!diagrams) {
        throw new Error(
          'a mermaid diagram fence was found but no diagram context was supplied',
        );
      }
      return renderDiagram(diagrams, code, diagram.caption, diagramCount);
    }
    const pre = highlighted.get(codeKey(infostring ?? '', code));
    if (pre) return `<div class="blog-code">${pre}</div>`;
    return `<div class="blog-code"><pre><code>${escapeHtml(code)}</code></pre></div>`;
  };

  renderer.heading = (text: string, level: number, raw: string) => {
    if (level !== 2 && level !== 3) {
      return `<h${level}>${text}</h${level}>`;
    }
    let id = slugifyHeading(raw) || `section-${toc.length + 1}`;
    let suffix = 2;
    while (usedIds.has(id)) {
      id = `${slugifyHeading(raw)}-${suffix}`;
      suffix += 1;
    }
    usedIds.add(id);
    toc.push({ id, text: raw.replace(/<[^>]*>/g, ''), depth: level });
    return (
      `<h${level} id="${id}" class="blog-heading">` +
      `<a class="blog-anchor" href="#${id}" aria-label="Link to this section">#</a>` +
      `${text}</h${level}>`
    );
  };

  renderer.link = (href: string, title: string | null | undefined, text: string) => {
    const attrs = title ? ` title="${escapeHtml(title)}"` : '';
    const external = /^https?:\/\//.test(href);
    const rel = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    return `<a href="${href}"${attrs}${rel}>${text}</a>`;
  };

  renderer.table = (header: string, body: string) =>
    `<div class="blog-table-wrap"><table><thead>${header}</thead><tbody>${body}</tbody></table></div>`;

  const html = marked.parser(tokens as never, { renderer }) as string;
  return { html, toc };
}

/** Plain text word count, used for reading time. */
export function countWords(markdown: string): number {
  const text = markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_~|-]/g, ' ');
  const words = text.split(/\s+/).filter(Boolean);
  return words.length;
}
