# content/blog

One markdown file per post. The file name must equal the slug, so
`content/blog/my-post.md` is served at `/blog/my-post`.

## Frontmatter

| Field | Required | Notes |
| --- | --- | --- |
| `title` | yes | Used in the page, the RSS item and the link preview |
| `slug` | yes | Lowercase words joined by single hyphens, must match the file name |
| `date` | yes | `YYYY-MM-DD`, publish date, also the sort key |
| `description` | yes | One or two sentences, this is what unfurls on LinkedIn, X and Slack |
| `tags` | yes | At least one |
| `draft` | yes | `true` keeps it out of the build, `/blog`, RSS and the sitemap |
| `canonical` | no | Defaults to the post URL on this site |
| `updated` | no | `YYYY-MM-DD`, shown next to the publish date |
| `ogImage` | no | Path or URL for the preview image |

Example:

```yaml
---
title: How we cut inference cost in half
slug: how-we-cut-inference-cost-in-half
date: 2026-10-14
description: What actually moved the number, and the two things that did not.
tags:
  - inference
  - cost
draft: false
---
```

## What the build enforces

The build fails, loudly, on any of these. It never skips a post quietly.

- A missing or empty required field
- A slug that does not match the file name, or is not lowercase and hyphenated
- A date that is not `YYYY-MM-DD` or is not a real date
- Two posts with the same slug
- An em dash or en dash anywhere in the prose. House style bans both. Write
  "10 to 15", not a dash. Code blocks and inline code are exempt

## Diagrams

Diagrams are authored as text in the post and rendered to SVG offline, so the
source is reviewable in the PR diff and the reader downloads no diagram
JavaScript. Write a mermaid fence with the caption on the fence line:

    ```mermaid Write path for a new short link, 50k writes per day assumed
    flowchart LR
      A[Client] --> B[API]
      B --> C[(Shard)]
    ```

Then render and commit:

```bash
npm run diagrams
```

Rules the build enforces:

- Every diagram needs a caption on the fence line. The caption is the
  `figcaption` and the accessible name of the figure
- The rendered SVG must be committed under `content/blog/diagrams`. A missing or
  stale render fails the build with the file name and the fix command
- Diagram labels are prose, so the em dash ban applies inside a mermaid fence

House rules the build cannot check: a diagram is planned in the outline rather
than added at the end, carries information that is not in the prose, states its
assumptions and scale targets on the diagram, and the argument has to survive a
reader who cannot see it.

## Notes

- Reading time is computed from the word count at 220 words per minute
- `##` and `###` headings get anchor ids and appear in the table of contents,
  which renders once a post has three or more of them
- Code fences are highlighted at build time, so no highlighter is shipped to
  readers. Supported languages are listed in `plugins/blog/config.ts`
- Third party numbers belong next to a link to whoever published them
