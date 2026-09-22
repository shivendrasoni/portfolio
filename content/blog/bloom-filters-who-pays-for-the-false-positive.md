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
  Q["Lookup: is x in the set?"] --> BF{"All k bits set?"}
  BF -->|"No: definitely absent"| SKIP["Skip the expensive path.<br/>Always correct"]
  BF -->|"Yes: probably present"| VER["Authoritative check<br/>disk, index or service"]
  VER -->|"Present"| HIT["Proceed"]
  VER -->|"Absent"| WASTE["The false positive.<br/>Cost: one wasted check"]
  BF -.->|"verification skipped"| ACT["Act on 'probably'.<br/>Now it is a wrong answer"]
```

## The real tradeoff is who pays, and it is never the filter

The cost of a false positive is paid by whatever sits behind the filter, which means the correct false positive rate is a property of the consumer, not of the data structure.

Three call sites, three different answers.

A filter in front of local storage, deciding whether to read a file that probably does not contain the key. The false positive costs a read that would have happened anyway in the no filter design. Take a loose rate, take the memory saving, and do not think about it again.

A filter in front of another service, deciding whether to make a network call. Now the false positive costs a round trip, a connection from a pool, and a slot in somebody else's rate limit. This is where a loose rate becomes a capacity planning error, because at high query volume, a percentage of a large number is a service. My judgement: size this one against the callee's headroom, not against your memory budget, and tell the team that owns it what rate you chose.

A filter deciding something a user sees. Username availability, duplicate detection, whether an email was already sent, whether a document was already processed. Here the false positive is not a cost, it is a wrong answer, and the structure is being used outside its contract. The correct use is still available: let a negative result short circuit, and always verify a positive against the system of record. If the verification is too expensive to do on every positive, that is the finding. You do not have a filter problem, you have a design that cannot afford to be right.

## The rate you quote is per lookup, and nobody experiences a lookup

One percent sounds small because it is being compared to the wrong denominator.

Users do not experience lookups, they experience requests, and a request fans out. If a query touches 200 filters at one percent, the expected number of false positives per request is two, not 0.01, and the probability that a request sees at least one is close to nine in ten. The arithmetic is elementary and it is skipped constantly, because the rate is chosen by whoever wrote the storage layer and experienced by whoever wrote the request handler.

So size the filter against false positives per user visible operation. Work out how many probes a single request performs, multiply, and decide whether that number is acceptable in the units your product actually cares about: wasted reads per request, extra calls per second, or latency at the tail rather than at the median.

## The failure mode is not the false positive rate. It is the set outgrowing the filter

This is the part I would put on a runbook.

A bloom filter's false positive rate is a function of how full it is. Size it for ten million items, insert forty, and the rate is no longer one percent, it is high enough that the filter has stopped filtering while still consuming memory, still costing CPU, and still reporting success. Nothing errors. No alert fires. The system just gets slower, and the slowdown looks like the storage layer's fault.

Standard bloom filters cannot delete, so a shrinking set never recovers its bits either. The variants exist: counting bloom filters replace bits with small counters to allow removal at several times the space, and cuckoo filters support deletion while using less space than a space optimised bloom filter at moderately low false positive rates ([Fan, Andersen, Kaminsky and Mitzenmacher, CoNEXT 2014](https://dl.acm.org/doi/10.1145/2674005.2674994)). Both are reasonable. Neither removes the underlying requirement, which is that somebody owns the rebuild.

So the three things I would want written down before shipping one: the expected maximum n, the actual n exported as a metric, and the rebuild trigger. Log stores get this for free, because a filter is built per immutable file and dies with it. Long lived in memory filters are where this rots, and the symptom is a performance regression with no code change behind it.

```mermaid Choosing the rate from the consumer rather than the memory budget. The left branch is where most of the value is, and the right branch is where filters get misused.
flowchart TD
  S["Candidate: skip work using a probabilistic set"] --> C{"What does a false positive cost?"}
  C -->|"A local read that was going to happen anyway"| L["Loose rate, few bits per key, ignore it"]
  C -->|"A call into someone else's service"| N["Size against the callee's headroom, publish the rate"]
  C -->|"An answer a user or an auditor sees"| U{"Can every positive be verified against the system of record?"}
  U -->|Yes| V["Filter as a fast path, verification is mandatory"]
  U -->|No| X["Do not use a filter, use an exact index"]
  L --> M["Export n, cap n, own the rebuild"]
  N --> M
  V --> M
```

## Where the textbook framing is right

The strongest version of the opposing case: for the canonical use, a filter in front of on disk lookups in a log structured store, the memory versus accuracy framing really is the whole decision. The consumer is a disk read, the cost of being wrong is one wasted seek, the set is immutable and known at build time, and the rebuild question answers itself. That covers a large fraction of every bloom filter running in production today, and for that case the formula is genuinely all you need.

My objection is to carrying that framing out of the storage engine and into application code, where the set mutates, the consumer is a person or a payment, and nobody re-derives the rate when the traffic pattern changes.

Which gives a decision rather than a number. Before you add one, name the thing that pays for being wrong. If that thing is a wasted read, take the cheapest filter that helps and move on. If it is another team's service, tell them the rate. If it is a user, keep the filter as a fast path and never let it have the final word.

## Sources

- Bloom, [Space/Time Trade-offs in Hash Coding with Allowable Errors](https://dl.acm.org/doi/10.1145/362686.362692), Communications of the ACM, 1970.
- RocksDB, [RocksDB Bloom Filter](https://github.com/facebook/rocksdb/wiki/RocksDB-Bloom-Filter). Source of the bits per key table and of the guidance to compare a 3 bit filter against no filter under memory pressure.
- Fan, Andersen, Kaminsky and Mitzenmacher, [Cuckoo Filter: Practically Better Than Bloom](https://dl.acm.org/doi/10.1145/2674005.2674994), ACM CoNEXT 2014.
- Broder and Mitzenmacher, [Network Applications of Bloom Filters: A Survey](https://www.eecs.harvard.edu/~michaelm/postscripts/im2005b.pdf), Internet Mathematics, 2004.
