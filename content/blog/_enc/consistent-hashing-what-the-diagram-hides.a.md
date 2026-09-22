---
title: Consistent hashing, and the three things the ring diagram never tells you
slug: consistent-hashing-what-the-diagram-hides
date: 2026-09-22
description: The ring solves rebalancing. It does not solve hot shards, its load balance is weaker than the picture suggests, and the virtual node count nobody revisits is a real operational decision.
tags:
  - system-design
  - distributed-systems
  - hashing
draft: false
---

Take the obvious design first, because it is the one everybody writes before they know the word consistent. You have eight cache nodes, so you send each key to `hash(key) % 8`. It is one line, it is fast, and the distribution is as even as your hash function.

Then you add a ninth node. Every key whose hash modulo 9 differs from its hash modulo 8 now lives on the wrong machine, and that is roughly eight keys in nine. Your cache hit rate goes to approximately 11 percent for as long as it takes to refill, and every one of those misses becomes a read against the database you bought the cache to protect. Adding capacity is what takes you down. That failure is not exotic, it is arithmetic, and it is the entire reason consistent hashing exists.

Karger and colleagues published the fix in 1997: hash nodes and keys into the same circular space, and let each key belong to the first node clockwise from it ([Karger et al., STOC 1997](https://dl.acm.org/doi/10.1145/258533.258660)). Add or remove a node and only the keys in that node's arc move. Everything else stays where it is.

That is the part every explanation covers, and it is correct. Below it sit three things the diagram does not say, and all three are operational.

I have not operated a large Dynamo style ring myself. My prior comes from the PhonePe merchant ecosystem, which takes tens to hundreds of millions of requests a day, and from what that volume teaches you about the gap between a uniform design and a uniform workload. Where a claim rests on judgement rather than a measurement, the sentence says so.

