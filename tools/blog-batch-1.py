import io, re, sys

p = 'plugins/blog/diagrams.ts'
s = io.open(p, encoding='utf-8').read()

old_parse = """export function parseDiagramInfo(infostring: string): { caption: string } | null {
  const trimmed = infostring.trim();
  if (!/^mermaid(\\s|$)/.test(trimmed)) return null;
  return { caption: trimmed.slice('mermaid'.length).trim() };
}"""

new_parse = """export function parseDiagramInfo(
  infostring: string,
): { kind: 'mermaid' | 'svg'; caption: string } | null {
  const trimmed = infostring.trim();
  if (/^mermaid(\\s|$)/.test(trimmed)) {
    return { kind: 'mermaid', caption: trimmed.slice('mermaid'.length).trim() };
  }
  // A hand authored figure. mermaid cannot draw some shapes (a hash ring is the
  // standing example), so the SVG source itself lives in the markdown: still
  // text, still reviewable in the diff, still zero client JavaScript, and it
  // needs no offline render step because there is nothing to render.
  if (/^svg(\\s|$)/.test(trimmed)) {
    return { kind: 'svg', caption: trimmed.slice('svg'.length).trim() };
  }
  return null;
}"""

assert old_parse in s
s = s.replace(old_parse, new_parse)

old_sig = """export function renderDiagram(
  ctx: DiagramContext,
  source: string,
  caption: string,
  index: number,
): string {
  if (caption === '') {
    fail(
      ctx.file,
      `diagram ${index} has no caption. Write the caption on the fence: ` +
        '```mermaid Write path for a new short link',
    );
  }

  const hash = diagramHash(renderConfigFingerprint(ctx), source);"""

new_sig = """export function renderDiagram(
  ctx: DiagramContext,
  source: string,
  caption: string,
  index: number,
  kind: 'mermaid' | 'svg' = 'mermaid',
): string {
  if (caption === '') {
    fail(
      ctx.file,
      `diagram ${index} has no caption. Write the caption on the fence: ` +
        '```mermaid Write path for a new short link',
    );
  }

  if (kind === 'svg') {
    return figure(ctx, source, caption, hashOfSource(source));
  }

  const hash = diagramHash(renderConfigFingerprint(ctx), source);"""

assert old_sig in s
s = s.replace(old_sig, new_sig)

old_tail = """  const raw = sanitiseSvg(ctx.file, fs.readFileSync(svgPath, 'utf8'));
  const svg = namespaceIds(dropDuplicateUnreferencedIds(raw), hash);
  const labelId = `d${hash}-caption`;

  return (
    `<figure class="blog-figure" role="group" aria-labelledby="${labelId}">` +
    `<div class="blog-figure-svg">${svg}</div>` +
    `<figcaption id="${labelId}">${escapeHtml(caption)}</figcaption>` +
    `</figure>`
  );
}"""

new_tail = """  return figure(ctx, fs.readFileSync(svgPath, 'utf8'), caption, hash);
}

/** Content address of a hand authored figure. No palette fingerprint: nothing
 * was rendered, so there is no renderer version to invalidate against. */
function hashOfSource(source: string): string {
  return crypto
    .createHash('sha256')
    .update(source.replace(/\\r\\n/g, '\\n').trim())
    .digest('hex')
    .slice(0, 12);
}

/** Sanitise, namespace and wrap. Identical treatment for rendered and hand
 * authored SVG, so a hand authored figure cannot smuggle in a script, an event
 * handler, or an id that restyles another figure on the same page. */
function figure(ctx: DiagramContext, rawSvg: string, caption: string, hash: string): string {
  const raw = sanitiseSvg(ctx.file, rawSvg);
  const svg = namespaceIds(dropDuplicateUnreferencedIds(raw), hash);
  const labelId = `d${hash}-caption`;

  return (
    `<figure class="blog-figure" role="group" aria-labelledby="${labelId}">` +
    `<div class="blog-figure-svg">${svg}</div>` +
    `<figcaption id="${labelId}">${escapeHtml(caption)}</figcaption>` +
    `</figure>`
  );
}"""

assert old_tail in s
s = s.replace(old_tail, new_tail)
io.open(p, 'w', encoding='utf-8').write(s)

m = 'plugins/blog/markdown.ts'
t = io.open(m, encoding='utf-8').read()
old = "      return renderDiagram(diagrams, code, diagram.caption, diagramCount);"
new = "      return renderDiagram(diagrams, code, diagram.caption, diagramCount, diagram.kind);"
assert old in t
t = t.replace(old, new)
io.open(m, 'w', encoding='utf-8').write(t)
print('patched')
