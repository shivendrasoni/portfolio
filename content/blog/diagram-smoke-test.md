---
title: Diagram pipeline smoke test
slug: diagram-smoke-test
date: 2026-09-21
description: Scaffolding for the diagram pipeline PR. Not a real post, contains no claims and no numbers, deleted before merge.
tags:
  - scaffolding
draft: false
---

This file exists only to prove the diagram pipeline renders, inlines and
prerenders correctly. It is not content. It makes no claim about anything, states
no number, and is deleted before this branch is merged.

## Architecture diagram

```mermaid Example architecture, placeholder boxes only, no claim about any real system
flowchart LR
  A[Client] --> B[Edge]
  B --> C[Service]
  C --> D[(Store)]
  C --> E[(Cache)]
```

## Sequence diagram

```mermaid Example request sequence, placeholder participants only
sequenceDiagram
  participant C as Client
  participant S as Service
  participant K as Cache
  participant D as Store
  C->>S: request
  S->>K: read
  K-->>S: miss
  S->>D: read
  D-->>S: row
  S->>K: write
  S-->>C: response
```

## A code fence, which must still highlight normally

```typescript
export function placeholder(value: string): string {
  return value.trim();
}
```
