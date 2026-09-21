#!/usr/bin/env python3
"""Applies the diagram edits to plugins/blog/markdown.ts and load.ts.

Temporary helper, committed only so these edits can be applied on this branch
from CI, and deleted before merge. Every edit is an exact string replacement
that fails loudly if the target text is not present.
"""
import os
import sys

os.chdir(sys.argv[1] if len(sys.argv) > 1 else '.')


def edit(path, old, new):
    s = open(path).read()
    if new in s:
        print('already applied:', path)
        return
    assert old in s, f'{path}: target text not found'
    open(path, 'w').write(s.replace(old, new, 1))
    print('patched', path)


edit(
    'plugins/blog/markdown.ts',
    "import {\n  HIGHLIGHT_LANGS,",
    "import { parseDiagramInfo, renderDiagram, type DiagramContext } from './diagrams';\n"
    "import {\n  HIGHLIGHT_LANGS,",
)
edit(
    'plugins/blog/markdown.ts',
    "export async function renderMarkdown(markdown: string): Promise<RenderResult> {",
    "export async function renderMarkdown(\n"
    "  markdown: string,\n"
    "  diagrams?: DiagramContext,\n"
    "): Promise<RenderResult> {",
)
edit(
    'plugins/blog/markdown.ts',
    "    for (const token of codeTokens) {\n      const raw",
    "    for (const token of codeTokens) {\n"
    "      // A diagram fence is not code and is never highlighted.\n"
    "      if (parseDiagramInfo(token.lang ?? '')) continue;\n"
    "      const raw",
)
edit(
    'plugins/blog/markdown.ts',
    "  renderer.code = (code: string, infostring: string | undefined) => {\n    const pre",
    "  let diagramCount = 0;\n"
    "  renderer.code = (code: string, infostring: string | undefined) => {\n"
    "    const diagram = parseDiagramInfo(infostring ?? '');\n"
    "    if (diagram) {\n"
    "      diagramCount += 1;\n"
    "      if (!diagrams) {\n"
    "        throw new Error(\n"
    "          'a mermaid diagram fence was found but no diagram context was supplied',\n"
    "        );\n"
    "      }\n"
    "      return renderDiagram(diagrams, code, diagram.caption, diagramCount);\n"
    "    }\n"
    "    const pre",
)
edit(
    'plugins/blog/load.ts',
    "async function loadOne(dir: string, fileName: string): Promise<BlogPost> {",
    "async function loadOne(root: string, dir: string, fileName: string): Promise<BlogPost> {",
)
edit(
    'plugins/blog/load.ts',
    "const { html, toc } = await renderMarkdown(body);",
    "const { html, toc } = await renderMarkdown(body, { root, file: fileName });",
)
edit(
    'plugins/blog/load.ts',
    "posts.push(await loadOne(dir, file));",
    "posts.push(await loadOne(root, dir, file));",
)
edit(
    'plugins/blog/load.ts',
    """  let inFence = false;
  lines.forEach((line, index) => {
    if (/^\\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;""",
    """  let fenceInfo: string | null = null;
  lines.forEach((line, index) => {
    const fence = line.match(/^\\s*```(.*)$/);
    if (fence) {
      fenceInfo = fenceInfo === null ? fence[1].trim() : null;
      return;
    }
    // A diagram label is published prose, so mermaid fences are NOT exempt.
    // Mermaid syntax uses ASCII hyphens, never the characters banned here.
    const exemptFence = fenceInfo !== null && !/^mermaid(\\s|$)/.test(fenceInfo);
    if (exemptFence) return;""",
)
print('bootstrap 1 done')
