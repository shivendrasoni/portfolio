---
title: Design a URL shortener that survives a hot key
slug: url-shortener-hot-key
date: 2026-09-22
description: The standard system design answer optimises the write path, which is the easy half. What breaks a shortener in production is the distribution of reads, and one link is enough to do it.
tags:
  - system-design
  - caching
  - scalability
draft: false
---

Ask an engineer to design a URL shortener and you usually get a good answer to the wrong question. Base62 encoding. A counter or a hash. Shard by code. Put a cache in front of the database. All correct, and almost all of it about the write path.

The write path is the easy half. Writes arrive at a rate you chose when you sized the system. Reads arrive at a rate the internet chooses, and not evenly. One link in front of a few million people inside ten minutes will take down a design that comfortably handles a hundred times that traffic spread across a million links.

I have not built a URL shortener. My prior comes from somewhere else: the PhonePe merchant ecosystem takes tens to hundreds of millions of requests a day, and what stays with you at that volume is that aggregate capacity tells you almost nothing about whether you are about to fall over. The dashboards are green. One partition is not.

## State the assumptions on the page, not in your head

These are assumptions, not measurements. Pick different ones and the sizing changes, the argument does not.

| Assumption | Value |
| --- | --- |
| New links | 100 million per year |
| Redirects | 10 billion per year |
| Read to write ratio | 100 to 1 |
| Average redirect rate | roughly 320 per second |
| Peak on a single code | unbounded, and that is the point |
| Stored row | code, target, owner, created, expiry, roughly 500 bytes |
| Retention | 5 years |

Five years of links at 500 bytes each is about 250 GB. That fits on one machine. Say it out loud, because it kills a branch of the usual conversation: you are not sharding for capacity, you are sharding for read throughput and blast radius. Conflating those is how people end up with 64 shards and one of them on fire.

## The write path, and why I would spend ten minutes on it

Two ways to make a code. Hash the URL and truncate, or issue a counter and base62 encode it.

Counters win on density. A 7 character base62 code gives about 3.5 trillion values, a counter uses them in order, so codes stay short forever and collisions are structurally impossible. Truncating a hash to 7 characters over 100 million links puts you in birthday collision territory, so every write needs a read to check plus a retry loop.

I would take the hash instead when enumeration is in the threat model. A sequential base62 counter is trivially walkable, and if someone can scan your codes they can scan your customers' links. Even then the right fix is usually a counter plus a keyed permutation, not a content hash, which earns its place only when deduplicating identical targets is a product requirement.

Issue IDs from a per region counter with the region baked into the code. No global coordination, nothing single to lose, and the code tells you which region minted it. That sounds cosmetic until you are debugging cross region replication lag at two in the morning.

That is the write path. Solved, cheap, and the part the interview grades hardest.

```mermaid Redirect and write paths at the assumed target of 10 billion redirects a year, roughly 320 per second average, 100 to 1 read to write
flowchart LR
  CL[Client] --> EDGE[Edge cache]
  EDGE -->|hit, returns 302| CL
  EDGE --> RS[Redirect service]
  RS --> KV[(Hot code cache)]
  KV -->|miss| ST[(Sharded store, 250 GB total)]
  RS -.->|async, never blocking| Q[[Click event queue]]
  Q --> AN[(Analytics store)]
  WR[Write API] --> IDG[Per region ID issuer]
  IDG --> ST
```

Two things on that diagram are decisions rather than drawing. The click path is dotted because it must never sit in the redirect's critical path: analytics is the first thing people accidentally make synchronous and the first thing that takes the redirect down with it. And the ID issuer is per region, so the write path holds no global lock.

## The read path is the whole problem

Web request popularity is not uniform and it is not close. Breslau, Cao, Fan, Phillips and Shenker established in [Web Caching and Zipf-like Distributions](https://pages.cs.wisc.edu/~cao/papers/zipf-implications.html) (INFOCOM 1999) that page requests from a fixed user community follow a Zipf-like distribution, with the exponent varying from trace to trace. Every system that serves links to humans still looks like that.

Most treatments stop at "the distribution is skewed, so cache the hot items". True, and not the dangerous part. The dangerous part is that the hot set is not stable. The top thousand codes this hour are mostly not the top thousand codes last hour, because a short link is attached to a piece of content and content has a lifecycle measured in minutes.

This is the assumption in the standard treatment that does not survive production. Skew gets modelled as a static property of the key space. In production it is a moving target, and that kills an entire class of mitigation: anything that needs a human, an alert or a control loop to identify the hot key first is operating on a timescale longer than the incident. By the time you have found it, it has moved.

The design constraint is therefore not "detect and handle hot keys". It is absorb a hot key without knowing which one it is.

The honest opposite case: if your hot set genuinely is stable, say a shortener serving a fixed catalogue of permanent marketing links, then a pinned list loaded into every process at startup is simpler, cheaper and more predictable than any adaptive machinery. I would take the pin list in that world without apology. Adaptive systems cost you understandability, and you should only buy that when the workload actually moves.

## One hot key, in numbers you can check

Storage engines have a per partition ceiling and it is lower than people expect. AWS documents that [every partition in a DynamoDB table is designed to deliver a maximum of 3,000 read units per second and 1,000 write units per second](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html), where one read unit is one strongly consistent read of an item up to 4 KB. Our row is about 500 bytes, so one code fits in one read unit and a single partition serves roughly 3,000 strongly consistent reads per second of it.

Put that against the workload. The whole system averages 320 redirects per second. One link landing on a large audience passes 3,000 per second by itself without the global average moving noticeably. The table is not overloaded. One partition is, and every other code that hashed into that partition is now being throttled by a link it has nothing to do with.

That is the shape of the failure, and it is why adding shards does not fix it. More shards divides the key space. It does not divide a key.

## A cache is a load balancer that happens to also be fast

This is what I think the standard answer gets most wrong. The cache arrives as a latency optimisation and gets sized against the working set: hold the hot 1 percent, get a 90 percent hit rate, move on.

Size it against the backends instead. Fan, Lim, Andersen and Kaminsky proved in [Small Cache, Big Effect](https://pdl.cmu.edu/ftp/HECStorage/socc11_caching.pdf) (SOCC 2011) that a small popularity based front end cache is enough to guarantee load balancing across a randomly partitioned backend, and that the necessary cache size is O(n log n) in the number of backend nodes n, depending only on n and not on how many items the system stores.

That changes the conversation. It stops being "what fraction of 500 million links can I afford to hold in memory", a budget argument you always lose, and becomes "I have 64 storage nodes, so a few thousand entries in front of them is provably enough to stop any one node being hammered". A cache that small fits in process: no extra cluster, no network hop, and one per redirect server rather than a shared tier that becomes its own hot partition. It is also the answer to the churning hot set, because a popularity based cache does not need to be told which key is hot. It finds out on the second request, which is the only timescale fast enough.

```mermaid Read path with a cache miss and a concurrent hot key, showing coalescing and the single fetch that reaches storage
sequenceDiagram
  participant C1 as Client A
  participant C2 as Clients B to Z
  participant RS as Redirect service
  participant LC as In process cache
  participant ST as Storage partition
  C1->>RS: GET /aZ3k9Qp
  RS->>LC: lookup
  LC-->>RS: miss, marks fetch in flight
  RS->>ST: read once
  C2->>RS: GET /aZ3k9Qp, thousands, same instant
  RS->>LC: lookup
  LC-->>RS: miss, fetch already in flight
  Note over RS,LC: waiters attach to the in flight fetch<br/>instead of each issuing a read
  ST-->>RS: target URL
  RS->>LC: store with jittered TTL
  RS-->>C1: 302
  RS-->>C2: 302
  Note over RS,ST: storage sees one read, not thousands
```

The line doing the real work is the one where the second request finds a fetch already in flight and waits. Without it, a miss on a hot key sends the whole crowd at one partition simultaneously, which is the exact failure the cache was installed to prevent.

## The miss is more dangerous than the hit

When a hot entry expires, every request being served from memory arrives at storage in the same instant. That is a cache stampede, and it is worse than having no cache, because it converts smooth high load into a periodic spike synchronised to your TTL.

Two mitigations, and I would use both. Request coalescing, as in the diagram. And probabilistic early expiry, where a request finding an entry near the end of its life refreshes it early with a probability that rises as expiry approaches. Vattani, Chierichetti and Lowenstein formalised that as XFetch in [Optimal Probabilistic Cache Stampede Prevention](https://www.vldb.org/pvldb/vol8/p886-vattani.pdf) (VLDB 2015). Its practical virtue is that it needs no tuning: the hotter a key is, the more likely it is to be refreshed before it ever expires.

If you hash requests to a shared cache tier instead, the same problem reappears as an unbalanced tier. Mirrokni, Thorup and Zadimoghaddam's [consistent hashing with bounded loads](https://research.google/blog/consistent-hashing-with-bounded-loads/) puts a capacity ceiling on each node and spills past it; Google reports that when Vimeo implemented it in haproxy it cut their cache bandwidth by a factor of almost 8. A uniform ring does not give uniform load when the requests are not uniform. Consistent hashing distributes the cold keys nicely. It does not solve a hot one.

## 301 versus 302 is an operations decision

The textbook answer is 301, because a permanent redirect is cached by browsers and intermediaries and therefore reduces load. That is true, and it is the strongest hot key defence available, since a request that never reaches you costs nothing.

It is also the decision I would most often make the other way.

A cached 301 means you cannot revoke the link, cannot change the target, and cannot count the click. None of those are edge cases. Revocation is a safety requirement the moment a user can shorten a URL pointing anywhere, retargeting is a feature people pay for, and for most shorteners the click data is the actual business. Trading it for infrastructure savings is an engineering decision quietly overriding a commercial one.

So: 302 by default with a short max age rather than none, and 301 reserved for links the product has explicitly marked immutable and unmonitored. Make it a per link property rather than a global constant.

## Where the standard answer is right

Most shorteners never meet a hot key that matters. For an internal tool or a fixed set of campaign links, one cache and one database will run for years, and the operational cost of everything above is real and permanent. Every adaptive layer is something that can misbehave at three in the morning.

The steel manned version is not "reads are easy". It is "reads are easy until one key exceeds a partition, most systems never get there, so do not pay for it until the distribution tells you to". Good argument, and it is why I would ship the simple version first. What I would build in from day one is not the machinery but the measurement: per key request counters at the edge with a high water mark. Cheap, boring, and it tells you the day the assumption breaks.

The judgement I would offer someone about to whiteboard this: you are graded on ID generation and you get paged about read distribution. Design for the second one.

## Sources

- Breslau, Cao, Fan, Phillips and Shenker, [Web Caching and Zipf-like Distributions: Evidence and Implications](https://pages.cs.wisc.edu/~cao/papers/zipf-implications.html), IEEE INFOCOM 1999.
- Fan, Lim, Andersen and Kaminsky, [Small Cache, Big Effect: Provable Load Balancing for Randomly Partitioned Cluster Services](https://pdl.cmu.edu/ftp/HECStorage/socc11_caching.pdf), ACM SOCC 2011.
- Amazon Web Services, [Best practices for designing and using partition keys effectively in DynamoDB](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/bp-partition-key-design.html).
- Vattani, Chierichetti and Lowenstein, [Optimal Probabilistic Cache Stampede Prevention](https://www.vldb.org/pvldb/vol8/p886-vattani.pdf), VLDB 2015.
- Mirrokni, Thorup and Zadimoghaddam, [Consistent Hashing with Bounded Loads](https://research.google/blog/consistent-hashing-with-bounded-loads/), Google Research.
