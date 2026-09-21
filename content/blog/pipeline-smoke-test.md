---
title: Pipeline smoke test, not a real post
slug: pipeline-smoke-test
date: 2026-09-21
description: Scaffolding used to verify the blog build, routes, feeds and link previews. Delete before merge.
tags:
  - scaffolding
draft: false
---

SCAFFOLDING. This file exists only to prove the pipeline works end to end. It is
not writing, it contains no claims, and it is deleted or replaced before this
branch merges.

## What this file checks

Every stage of the build touches this file: frontmatter validation, markdown to
HTML, heading anchors, the table of contents, reading time, the RSS item, the
sitemap entry, and the prerendered HTML file that link preview bots read.

### Anchors and nesting

This third level heading confirms the table of contents renders nested entries
and that each heading gets a stable id.

## Formatting the renderer must handle

A table, because a technical post uses them.

| Stage | Output |
| --- | --- |
| Loader | validated frontmatter |
| Markdown | HTML plus a table of contents |
| Feeds | rss.xml, sitemap.xml, robots.txt |
| Prerender | one static HTML file per post |

A quote, because steel manning the other side usually needs one.

> Build time work costs nothing at runtime. Runtime work costs every reader.

A fenced code block, highlighted at build time:

```ts
export function readingMinutes(wordCount: number): number {
  return Math.max(1, Math.round(wordCount / 220));
}
```

Inline `code`, a [link to the repository](https://github.com/shivendrasoni/portfolio),
and a number range written as 10 to 15 so the house style check has something to
pass over.

## Sources

Nothing is claimed here, so nothing is cited. A real post carries this section
with a link for every third party number.
