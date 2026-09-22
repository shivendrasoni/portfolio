---
title: Fanout on write versus fanout on read, and where the boundary actually sits
slug: feed-fanout-write-versus-read
date: 2026-09-22
description: The interview answer picks one strategy for the whole system. Production picks per account, and the thing that sets the boundary is the follower count distribution, not the request rate.
tags:
  - system-design
  - scalability
  - feeds
draft: false
---

Start with one write. A user with 200 followers posts. If you deliver at write time, that is 200 inserts into 200 timelines, and the read that follows is a single range scan. If you deliver at read time, that is one insert and then a merge across 200 lists every time any of those followers opens the app.

Now change one number. The same user has 20 million followers. Same code path, same query, and the write just became 20 million inserts.

Nothing about the request rate changed. The system did not get busier. One row in a users table was different, and that is the whole subject of this post.

Twitter published the arithmetic in 2012, and the shape has not changed since. Around 400 million tweets per day, roughly 5,000 per second on average, about 7,000 per second at daily peak, above 12,000 per second during large events. Deliveries into timelines from those same tweets: 30 billion per day, roughly 21 million per minute, about 300,000 per second, with 3.5 seconds at p50 to reach a million followers. Reads sat above 300,000 queries per second against materialised timelines at 1 millisecond p50 ([Krikorian, Timelines at Scale, QCon SF 2012](https://qconsf.com/sf2018/sf2012/dl/qcon-sanfran-2012/slides/RaffiKrikorian_TimelinesAtScale.pdf)).

Put those two lines next to each other. Five thousand writes per second in, three hundred thousand deliveries per second out. The input rate is a rounding error. The multiplier is the system.

I have not built a feed at that scale. My prior comes from the PhonePe merchant ecosystem, which takes tens to hundreds of millions of requests a day, and the thing that stays with you at that volume is that the average tells you almost nothing about what is about to break. Here the average is even more misleading than usual, because the multiplier is not a constant, it is a distribution with a tail that includes actual celebrities.

## State the two designs honestly before picking

| | Fanout on write | Fanout on read |
| --- | --- | --- |
| Cost at post time | One insert per follower | One insert |
| Cost at read time | One range scan | One merge across every followed account |
| Storage | The whole graph, materialised | Posts only |
| Latency profile | Predictable reads, spiky writes | Predictable writes, spiky reads |
| What breaks it | A high follower account | A user who follows thousands of accounts |
| What it is really doing | Precomputing a join | Executing a join per request |

That last row is the one worth keeping. Neither design is clever. They are the two ends of a decision about when you pay for a join, which is a decision databases have been making since long before anybody had a feed.

```mermaid Hybrid delivery. The boundary is a per account property, not a global mode, and the merge at read time is what makes the boundary movable without a migration.
flowchart TD
  P[@Post created@] --> CLS{@Author cohort: followers above the fanout ceiling?@}
  CLS -->|@No, ordinary account@| FQ[[@Delivery queue@]]
  FQ --> TL[(@Materialised timelines, one row per follower@)]
  CLS -->|@Yes, high fanout account@| AUT[(@Author timeline only, not delivered@)]
  R[@Follower opens the app@] --> M[@Merge at read time@]
  TL --> M
  AUT --> M
  M --> RANK[@Ranking and filtering@]
  RANK --> OUT[@Rendered feed@]
  ADMIN[@Ceiling tuned per cohort, per region, per incident@] -.-> CLS
```

Two things on that diagram are decisions rather than drawing. The cohort test is a property on the author, evaluated at post time, so moving an account across the boundary is a flag flip and not a migration. And the ranking stage sits after the merge, which is the detail that quietly ends the debate: once a feed is ranked, the materialised timeline stopped being a feed and became a candidate set.

