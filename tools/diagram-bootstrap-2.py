#!/usr/bin/env python3
"""Applies the diagram edits to prose.css, package.json and content/blog/README.md.

Temporary helper, committed only so these edits can be applied on this branch
from CI, and deleted before merge.
"""
import collections
import json
import os
import sys

os.chdir(sys.argv[1] if len(sys.argv) > 1 else '.')

CSS = """
/* --- Diagrams -------------------------------------------------------------
 * Build time inlined SVG. No client side renderer, so these rules only have to
 * size and frame output that is already drawn.
 */

.blog-prose .blog-figure {
  margin: 2.25em 0;
  padding: 1.25rem 1rem 0.85rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0.5rem;
  background: rgba(255, 255, 255, 0.02);
}

.blog-prose .blog-figure-svg {
  overflow-x: auto;
}

.blog-prose .blog-figure svg {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  margin: 0 auto;
}

.blog-prose .blog-figure figcaption {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.55);
  font-size: 0.85rem;
  line-height: 1.5;
  text-align: left;
}
"""

p = 'src/components/blog/prose.css'
s = open(p).read()
if '.blog-figure' not in s:
    open(p, 'w').write(s.rstrip() + '\n' + CSS)
    print('patched', p)

p = 'package.json'
pkg = json.load(open(p), object_pairs_hook=collections.OrderedDict)
if 'diagrams' not in pkg['scripts']:
    scripts = collections.OrderedDict()
    for k, v in pkg['scripts'].items():
        scripts[k] = v
        if k == 'build':
            scripts['diagrams'] = 'node scripts/render-diagrams.mjs'
            scripts['diagrams:check'] = 'node scripts/render-diagrams.mjs --check'
    pkg['scripts'] = scripts
    open(p, 'w').write(json.dumps(pkg, indent=2) + '\n')
    print('patched', p)

DOCS = """## Diagrams

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

"""

p = 'content/blog/README.md'
s = open(p).read()
if '## Diagrams' not in s:
    assert '## Notes' in s, 'content/blog/README.md: "## Notes" not found'
    open(p, 'w').write(s.replace('## Notes', DOCS + '## Notes', 1))
    print('patched', p)

print('bootstrap 2 done')
