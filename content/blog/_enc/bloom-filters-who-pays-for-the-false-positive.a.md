---
title: Bloom filters, and the cost of being wrong cheaply
slug: bloom-filters-who-pays-for-the-false-positive
date: 2026-09-22
description: The interesting tradeoff is not memory against accuracy. It is who downstream pays for a false positive, and whether the rate you designed for survives the set outgrowing the filter.
tags:
  - system-design
  - data-structures
  - performance
draft: false
---

Two systems use a bloom filter with the same one percent false positive rate. In the first, a false positive costs one disk read that returns nothing, and the caller carries on. In the second, a false positive means the signup form tells a user that the username they chose is taken when it is free.

Same data structure, same parameters, same maths. One of them is a performance optimisation and the other is a bug that a support team will be explaining for a year.

That is the whole subject. The sizing formula is not the interesting part of a bloom filter, and it is the only part most explanations discuss.

## The mechanism, quickly

A bloom filter is a bit array plus k hash functions. To insert, hash the item k ways and set those k bits. To query, hash the same k ways and read those bits. If any bit is zero the item is definitely absent. If all are one, the item is probably present, because those bits might have been set by other items. False positives are possible, false negatives are not, and you cannot remove an item without risking a false negative for something else.

The sizing is standard: with m bits and n items, the optimal number of hash functions is about 0.7 times m over n, and you need roughly 10 bits per item for one percent. That is a formula, not a decision. RocksDB publishes the decision version of the same thing, which is far more useful, in terms of how much of the possible benefit each setting buys ([RocksDB bloom filter documentation](https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter)):

| Bits per key | False positive rate | As effective as 100 bits per key |
| --- | --- | --- |
| 1.5 | 50 percent | 50 percent |
| 2.9 | 25 percent | 75 percent |
| 4.9 | 10 percent | 90 percent |
| 9.9 | 1 percent | 99 percent |
| 15.5 | 0.1 percent | 99.9 percent |

Read that table twice, because it contains the least intuitive fact in this area. A filter at 50 percent false positives still removes half the wasted work. RocksDB's own guidance says it plainly: if memory pressure is the concern, the comparison to make is a 3 bit filter against no filter, not a 10 bit filter against no filter. Teams under memory pressure usually delete the filter entirely, when the honest move is to shrink it and keep most of the benefit.

```mermaid Lookup path, with the verification step that decides whether a false positive is invisible or user facing. The dotted edge is the one teams omit, and omitting it is the design error rather than the filter itself.
flowchart TD
  Q[@Lookup: is x in the set?@] --> BF{@All k bits set?@}
  BF -->|@No: definitely absent@| SKIP[@Skip the expensive path.<br/>Always correct@]
  BF -->|@Yes: probably present@| VER[@Authoritative check<br/>disk, index or service@]
  VER -->|@Present@| HIT[@Proceed@]
  VER -->|@Absent@| WASTE[@The false positive.<br/>Cost: one wasted check@]
  BF -.->|@verification skipped@| ACT[@Act on 'probably'.<br/>Now it is a wrong answer@]
```

