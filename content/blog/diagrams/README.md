# content/blog/diagrams

Generated files. Do not edit by hand and do not add anything here yourself.

Every `.svg` in this directory is the rendered output of one ` ```mermaid ` fence
in a post, written by `scripts/render-diagrams.mjs`. The file name is the first
12 hex characters of a SHA-256 over the palette fingerprint and the diagram
source, so the render is content addressed: change the diagram by one character
and the build looks for a different file and fails until you re-render.

`render-config.json` records the pinned renderer version and the fingerprint of
the mermaid palette the SVG was produced with. The build reads the same
fingerprint, which is why changing a colour in `scripts/diagram-palette.mjs`
invalidates every committed diagram instead of leaving them silently stale.

## Workflow

```bash
npm run diagrams          # render anything missing, skip what is current
npm run diagrams -- --force   # re-render everything
npm run diagrams:check    # report only, non zero exit if anything is stale
```

Commit the SVG alongside the post that references it. `npm run build` never
renders diagrams: it reads what is committed and fails with the exact file name
and fix command if a render is missing.

Unreferenced SVG is reported by `npm run diagrams` but never deleted
automatically, because a post on another branch may still use it.
