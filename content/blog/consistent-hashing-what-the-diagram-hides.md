---
title: Consistent hashing, and the three things the ring diagram never tells you
slug: consistent-hashing-what-the-diagram-hides
date: 2026-08-06
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

```svg A ring with 3 physical nodes and 10 virtual nodes. The dashed arcs are the keys that move when node B is lost, which is the only thing the ring guarantees. It says nothing about how much traffic those keys carry.
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 660 440" width="660" height="440" font-family="Inter, ui-sans-serif, system-ui, sans-serif" role="img">
<circle cx="330" cy="210" r="140" fill="none" stroke="#3f3f46" stroke-width="2"/>
<path d="M 359.1 73.1 A 140 140 0 0 1 440.3 123.8" fill="none" stroke="#f4a6a6" stroke-width="7" stroke-dasharray="6 5"/>
<path d="M 366.2 345.2 A 140 140 0 0 1 286.7 343.1" fill="none" stroke="#f4a6a6" stroke-width="7" stroke-dasharray="6 5"/>
<path d="M 190.1 205.1 A 140 140 0 0 1 215.3 129.7" fill="none" stroke="#f4a6a6" stroke-width="7" stroke-dasharray="6 5"/>
<line x1="357.2" y1="81.9" x2="361" y2="64.3" stroke="#e4e4e7" stroke-width="3"/>
<text x="364.5" y="47.6" fill="#e4e4e7" font-size="13" text-anchor="middle" dominant-baseline="middle">A</text>
<line x1="433.2" y1="129.3" x2="447.4" y2="118.3" stroke="#f4a6a6" stroke-width="3"/>
<text x="460.8" y="107.8" fill="#f4a6a6" font-size="13" text-anchor="middle" dominant-baseline="middle">B</text>
<line x1="460.9" y1="205.4" x2="478.9" y2="204.8" stroke="#9fc7f0" stroke-width="3"/>
<text x="495.9" y="204.2" fill="#9fc7f0" font-size="13" text-anchor="middle" dominant-baseline="middle">C</text>
<line x1="433.2" y1="290.7" x2="447.4" y2="301.7" stroke="#e4e4e7" stroke-width="3"/>
<text x="460.8" y="312.2" fill="#e4e4e7" font-size="13" text-anchor="middle" dominant-baseline="middle">A</text>
<line x1="363.9" y1="336.5" x2="368.6" y2="353.9" stroke="#9fc7f0" stroke-width="3"/>
<text x="373" y="370.3" fill="#9fc7f0" font-size="13" text-anchor="middle" dominant-baseline="middle">C</text>
<line x1="289.5" y1="334.6" x2="284" y2="351.7" stroke="#f4a6a6" stroke-width="3"/>
<text x="278.7" y="367.9" fill="#f4a6a6" font-size="13" text-anchor="middle" dominant-baseline="middle">B</text>
<line x1="226.8" y1="290.7" x2="212.6" y2="301.7" stroke="#e4e4e7" stroke-width="3"/>
<text x="199.2" y="312.2" fill="#e4e4e7" font-size="13" text-anchor="middle" dominant-baseline="middle">A</text>
<line x1="199.1" y1="205.4" x2="181.1" y2="204.8" stroke="#9fc7f0" stroke-width="3"/>
<text x="164.1" y="204.2" fill="#9fc7f0" font-size="13" text-anchor="middle" dominant-baseline="middle">C</text>
<line x1="222.7" y1="134.9" x2="207.9" y2="124.5" stroke="#f4a6a6" stroke-width="3"/>
<text x="194" y="114.8" fill="#f4a6a6" font-size="13" text-anchor="middle" dominant-baseline="middle">B</text>
<line x1="285.2" y1="86.9" x2="279" y2="70" stroke="#e4e4e7" stroke-width="3"/>
<text x="273.2" y="54" fill="#e4e4e7" font-size="13" text-anchor="middle" dominant-baseline="middle">A</text>
<circle cx="387" cy="111.3" r="3.5" fill="#71717a"/>
<text x="379" y="125.1" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k1</text>
<circle cx="437.1" cy="171" r="3.5" fill="#71717a"/>
<text x="422.1" y="176.5" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k2</text>
<circle cx="435.7" cy="252.7" r="3.5" fill="#71717a"/>
<text x="420.9" y="246.7" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k3</text>
<circle cx="387" cy="308.7" r="3.5" fill="#71717a"/>
<text x="379" y="294.9" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k4</text>
<circle cx="318.1" cy="323.4" r="3.5" fill="#71717a"/>
<text x="319.8" y="307.5" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k5</text>
<circle cx="264.6" cy="303.4" r="3.5" fill="#71717a"/>
<text x="273.8" y="290.3" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k6</text>
<circle cx="218.5" cy="233.7" r="3.5" fill="#71717a"/>
<text x="234.1" y="230.4" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k7</text>
<circle cx="224.3" cy="167.3" r="3.5" fill="#71717a"/>
<text x="239.1" y="173.3" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k8</text>
<circle cx="259.8" cy="120.2" r="3.5" fill="#71717a"/>
<text x="269.7" y="132.8" fill="#71717a" font-size="11" text-anchor="middle" dominant-baseline="middle">k9</text>
<text x="330" y="192" fill="#a1a1aa" font-size="13" text-anchor="middle">3 physical nodes</text>
<text x="330" y="212" fill="#a1a1aa" font-size="13" text-anchor="middle">10 virtual nodes</text>
<text x="330" y="232" fill="#f4a6a6" font-size="13" text-anchor="middle">dashed arcs move if B dies</text>
<rect x="24" y="372" width="10" height="10" fill="#e4e4e7"/>
<text x="42" y="380" fill="#a1a1aa" font-size="12" dominant-baseline="middle">Node A: 4 vnodes</text>
<rect x="24" y="390" width="10" height="10" fill="#f4a6a6"/>
<text x="42" y="398" fill="#a1a1aa" font-size="12" dominant-baseline="middle">Node B: 3 vnodes, owns the dashed arcs</text>
<rect x="24" y="408" width="10" height="10" fill="#9fc7f0"/>
<text x="42" y="416" fill="#a1a1aa" font-size="12" dominant-baseline="middle">Node C: 3 vnodes</text>
<rect x="24" y="426" width="10" height="10" fill="#71717a"/>
<text x="42" y="434" fill="#a1a1aa" font-size="12" dominant-baseline="middle">keys, placed clockwise to the next vnode</text>
<text x="24" y="28" fill="#a1a1aa" font-size="12">Assumption: uniform hash, no load feedback. Ownership is the arc ending at a vnode, walking clockwise.</text>
</svg>
```

## One: it balances keys, not load

The guarantee is about key ranges. Every statement in the original result is about how many keys move, and how evenly the key space is divided. Nothing in it is about requests, bytes, or CPU.

Production workloads are not uniform over keys. One product, one video, one merchant, one campaign link takes a large multiple of everything else, and a perfectly uniform ring will route all of that traffic to exactly one node, because that is what it is designed to do. Consistent hashing solves the rebalancing problem. It does nothing whatsoever for the hot key problem, and reaching for it when the symptom is a hot shard is one of the more common misdiagnoses I see.

The distinction matters because the two problems have opposite fixes. Rebalancing wants stable ownership: the same key on the same node, so caches stay warm. Hot shards want the opposite: the same key spread across several nodes, so the load divides. You cannot get both from one mechanism, and a design that pretends otherwise has quietly chosen one.

The opposite case, stated plainly: if your node set almost never changes, do not use consistent hashing at all. Fixed capacity with a planned resharding window is better served by explicit range partitioning, because ranges give you scans, ordered iteration, and a partition map a human can read during an incident. The ring buys elasticity, and elasticity is worth real complexity only if membership actually churns.

## Two: the balance is worse than the picture, and the fix has a name

The standard ring picture shows arcs of comfortably similar size. Randomly placed points do not behave like that. Mirrokni, Thorup and Zadimoghaddam put the real bound plainly: the load balancing of consistent hashing is no better than a random assignment of clients to servers, so with n of each you expect many servers overloaded by a factor of order log n over log log n ([Consistent Hashing with Bounded Loads, 2016](https://arxiv.org/abs/1608.01350)). Their algorithm adds a capacity ceiling: pick a balancing parameter c greater than 1, allow no node above c times the mean, and overflow spills to the next node clockwise, at the cost of a constant expected number of extra moves per update.

Virtual nodes are the older answer to the same problem, and they are the parameter nobody revisits. Assigning each physical node many points on the ring smooths the distribution, which is why Dynamo used them and why the Dynamo paper lists the benefits in terms of failure dispersal and heterogeneous capacity ([DeCandia et al., SOSP 2007](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf)).

What the paper also records, and what almost no explainer repeats, is that Amazon changed the scheme in production. Their strategy 1, random tokens per node with partitioning by token value, is the design in every tutorial. They moved to strategy 3, a fixed number of equal sized partitions with tokens assigned out of that fixed set, and report that it achieved better efficiency and reduced the membership information held at each node by three orders of magnitude.

That is the single most useful sentence in the paper for anyone building this today, and it is the default I would take: do not hash keys onto nodes. Hash keys onto a large fixed number of partitions, then assign partitions to nodes in a map you can read, log, diff, and move by hand at three in the morning. Partition count becomes a decision you make once, ownership becomes data rather than a function, and rebalancing becomes a scheduled move of whole partitions instead of an emergent property of a hash.

More virtual nodes give smoother load and larger membership state, more gossip, slower failure detection and slower bootstrap. Fewer give the opposite. Picking that number once during a prototype and never looking at it again is not a neutral choice, it is a choice made by whoever wrote the example you copied.

```mermaid Request path with a capacity ceiling. The overflow branch is the difference between the ring in the diagram and a ring that survives a skewed workload, and it is the part that turns a hash lookup into a stateful decision.
flowchart TD
  K["Key"] --> H["hash(key)"]
  H --> RING["Walk clockwise to the next virtual node"]
  RING --> OWN["Owner: physical node behind that vnode"]
  OWN --> CAP{"Owner above c times mean load?"}
  CAP -->|No| SERVE["Serve from owner, cache stays warm"]
  CAP -->|"Yes, overflow"| NEXT["Next vnode clockwise with capacity"]
  NEXT --> SERVE2["Serve from overflow node, cold for this key"]
  SERVE2 -.->|"ownership churn costs hit rate"| COST["Duplicate copies, extra invalidation"]
  HEALTH["Health and load feedback"] -.-> CAP
```

Two things on that diagram are decisions rather than drawing. The capacity test reads live load, which means ownership is no longer a pure function of the key and two clients can disagree about the owner during a load spike. And the dotted cost edge is the thing people forget to price: every overflow creates a second cached copy of the same key, so a ceiling that is set too tight trades a hot node for a fleet wide drop in hit rate.

## Three: removal is the easy case, and return is the expensive one

The diagram shows a node disappearing and its arc moving to the neighbour. Clean. What it does not show is the same node coming back.

A node that returns after twenty minutes holds data that was correct when it left. If ownership snaps back to it on rejoin, it starts serving stale values, so a real system must either invalidate on rejoin, which produces a thundering refill against the store, or hold ownership away until it has caught up, which means the membership view and the ownership view are different things and you now have two states to reason about. This is where an implementation stops being a hash function and becomes a distributed systems problem with a failure detector in it.

The second hidden cost is that "minimal keys move" is a statement about keys, not about bytes or about time. Moving one nth of the key space can mean moving terabytes across a network that is also serving traffic, and during that window your replication factor is degraded, which is precisely when a second failure would be expensive. Capacity events therefore need to be planned for the recovery window, not for the steady state, and my judgement is that the honest planning number is how long a full partition rebuild takes under production load, measured once, written down, and re-measured when the data grows.

Hence the fixed partition map again. Whole partition moves are schedulable, throttleable, observable and reversible. An emergent arc handoff is none of those.

## Where the ring is exactly right

The strongest version of the opposing case: when membership genuinely churns, the ring is unbeaten. Distributed caches where nodes come and go, storage systems that must grow without a maintenance window, load balancers hashing sessions onto backends behind an autoscaler. In all of those, the alternative is a coordination service that has to be consulted on every request, and a hash you can compute locally with no round trip is worth a lot of complexity elsewhere.

There is also a simpler variant worth knowing. If the buckets can be numbered sequentially, jump consistent hash gives better distribution than the ring with no storage at all, in about five lines of code ([Lamping and Veach, 2014](https://arxiv.org/abs/1406.2294)). The constraint that buckets must be numbered is why it suits data storage more than distributed caching, and that constraint is also exactly what a fixed partition map gives you for free.

So the judgement I would offer: reach for the ring when membership is unpredictable, reach for a fixed partition map when it is not, and in either case know that you have solved where keys live and have not touched how much traffic they bring. The ring diagram is a picture of ownership. Your incident will be about load.

## Sources

- Karger, Lehman, Leighton, Panigrahy, Levine and Lewin, [Consistent Hashing and Random Trees](https://dl.acm.org/doi/10.1145/258533.258660), ACM STOC 1997.
- DeCandia et al., [Dynamo: Amazon's Highly Available Key-value Store](https://www.allthingsdistributed.com/files/amazon-dynamo-sosp2007.pdf), SOSP 2007. Source of the virtual node rationale and of the strategy 1 to strategy 3 change, including the three orders of magnitude reduction in per node membership metadata.
- Mirrokni, Thorup and Zadimoghaddam, [Consistent Hashing with Bounded Loads](https://arxiv.org/abs/1608.01350), 2016. Source of the claim that plain consistent hashing balances no better than random assignment, and of the bounded load guarantee.
- Lamping and Veach, [A Fast, Minimal Memory, Consistent Hash Algorithm](https://arxiv.org/abs/1406.2294), 2014.
