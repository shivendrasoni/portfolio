## The crossover is set by the follower distribution, not by traffic

The interview answer is @fanout on write, with a special case for celebrities@. That is the right shape and the wrong unit. It treats celebrity as a category of person when it is a property of a number, and the number that matters is not follower count on its own. It is follower count multiplied by post rate, divided by how often those followers actually read.

Work it as a ratio per account. Delivering at write time costs you followers times posts. Serving at read time costs you reads times accounts followed. A prolific account with a million dormant followers is the worst possible case for materialised delivery, because you write a million rows that nobody scans. A quiet account with a hundred thousand very active followers is the best possible case, because you write once and amortise across a large number of reads.

So the boundary is not @celebrities are different@. The boundary is a read to write ratio computed per author cohort, and it moves. It moves when a product launches notifications that pull people back into the app, because reads rise and materialisation gets cheaper. It moves when a growth campaign adds followers who never open the app, because writes rise against dead weight. If that ratio is not on a dashboard, the constant in your code is a guess someone made during a launch two years ago.

The opposite call, which I would genuinely make: for a product where feeds are read rarely, pure fanout on read is correct and materialisation is waste. Internal activity feeds, B2B audit streams, anything where the write happens for compliance and the read happens when something goes wrong. Those systems get built with materialised timelines because feed means Twitter in most engineers' heads, and then a storage bill arrives for rows nobody ever selected.

## The expensive part of fanout on write is not the writing

This is the claim I would defend hardest, and it is the one the whiteboard version never reaches.

Writing 30 billion rows a day is a solved problem. You buy machines. What is not solved is unwriting them. Every one of those rows is a denormalised copy, and copies have to be corrected when the truth changes. A user deletes a post. A user goes private. A user blocks someone. A post gets taken down by moderation. An account gets suspended. Each of those is a correction that has to find rows already scattered across millions of timelines, and none of them can be slow, because the ones that matter are the safety ones.

That is where the design decision actually bites. A materialised timeline is a cache with no TTL and legal consequences. Teams that pick fanout on write for read latency inherit a deletion pipeline they did not budget for, and the deletion pipeline is the part that is still being fixed three years later.

My judgement, and it is judgement: store references rather than copies in the materialised row. Write a post id and a timestamp, nothing else, and hydrate content at read time from a cache keyed by post id. You give up a little read latency and you buy the ability to delete, edit, or hide a post in one place. Deletion becomes a single write plus cache invalidation instead of a fanout of its own. The version that denormalises the post body into every timeline row is faster in a benchmark and is the version I would not ship.

```mermaid Read path for a follower of one high fanout account, with the deletion problem shown where it actually lands. Assumes references in timelines and hydration at read time.
sequenceDiagram
  participant U as User
  participant API as Feed API
  participant TL as Timeline store
  participant HF as High fanout timelines
  participant PC as Post cache
  U->>API: GET feed
  API->>TL: range scan, post ids only
  API->>HF: fetch recent posts for followed high fanout accounts
  TL-->>API: ids and timestamps
  HF-->>API: ids and timestamps
  API->>API: merge, apply visibility rules, rank
  API->>PC: hydrate post bodies by id
  PC-->>API: bodies, or miss to storage
  API-->>U: feed
  Note over PC: Deletion and moderation write here once.<br/>No fanout of corrections across timelines.
```

## Where the single strategy answer is right

The strongest version of the opposing case: most products never meet a celebrity. If the largest account in your system has ten thousand followers, fanout on write with no special case will run for years, the code is simple enough that a new engineer can hold it in their head, and every mechanism above is an operational cost with no matching benefit. That is a good argument and it is why I would ship exactly that for a product with a known ceiling.

What I would build in on day one is not the hybrid, it is the measurement that tells you when you need it: a distribution of followers per author, and a delivery cost per post, both on a dashboard rather than in a query someone runs after an incident. The hybrid is a week of work when you know you need it and a disaster when you discover it during a launch.

The judgement I would offer someone about to whiteboard this: do not answer @fanout on write or fanout on read@. Answer @here is the ratio I would compute per cohort, here is the ceiling I would set, here is how I would move an account across it without a migration, and here is how I delete a post afterwards@. The first answer is a preference. The second one is a design.

## Sources

- Krikorian, [Timelines at Scale](https://qconsf.com/sf2018/sf2012/dl/qcon-sanfran-2012/slides/RaffiKrikorian_TimelinesAtScale.pdf), QCon San Francisco 2012. Source of every Twitter number quoted above: 400 million tweets per day, 5,000 per second average, 7,000 per second daily peak, above 12,000 per second during large events, 30 billion deliveries per day, about 300,000 deliveries per second, 3.5 seconds at p50 to deliver to a million followers, above 300,000 queries per second on poll based timelines at 1 millisecond p50.
- Bronson et al., [TAO: Facebook's Distributed Data Store for the Social Graph](https://www.usenix.org/conference/atc13/technical-sessions/presentation/bronson), USENIX ATC 2013. The read dominated social graph workload that makes precomputation attractive in the first place.
