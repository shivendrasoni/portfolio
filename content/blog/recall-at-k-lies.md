---
title: Vector search internals, and why recall at k lies to you
slug: recall-at-k-lies
date: 2026-09-21
description: Recall is measured against what brute force in the same embedding space would have returned, not against the answer the user wanted. It is a measure of agreement with your own index, and a filter is enough to break the graph it is measured on.
tags:
  - applied-ai
  - search
  - system-design
draft: false
---

The dashboard says recall at 10 is 0.98. The support queue says search is broken. Both are correct, and the gap between them is not a monitoring problem.

Recall at k, as everyone computes it, is the overlap between what your approximate index returned and what an exhaustive scan of the same vectors under the same distance metric would have returned. That is a real and useful number. It measures exactly one thing: whether the index found the nearest neighbours. It says nothing at all about whether the nearest neighbours were the right answer, because it was computed inside the embedding space rather than against the user's intent.

So a system can be at 0.98 recall and be badly wrong, and the 0.02 is not where the wrongness is.

## Two different errors, one of which you measure

Retrieval has two error sources stacked on each other.

Representation error is the embedding putting the right document far from the query. Retrieval error is the index failing to find a document that the embedding did place nearby. Recall at k measures the second. In most production systems the first is larger, and it is invisible to every dashboard built on recall.

That is the most useful practical consequence of the whole topic: raising recall from 0.95 to 0.99 is a real engineering cost and often buys nothing a user can feel, because the documents you were missing were the fifth through tenth nearest in a space that had already ranked the correct document twentieth. The honest measurement is against human labelled answers for real queries, which is slower to build and is the only one that moves when you improve things.

## The mechanism, briefly, because one parameter matters more than the rest

HNSW builds a multi layer proximity graph, where each element appears in layers up to a randomly chosen maximum with exponentially decaying probability, and search starts at the sparse top layer and descends, greedily walking toward the query at each level ([Malkov and Yashunin, 2016](https://arxiv.org/abs/1603.09320)). The degree of each node is bounded by a parameter usually called `m`, and the size of the candidate list during search by `ef`.

```mermaid HNSW search as a descent. The parameter on each arrow is the one that moves that stage. Build time parameters are fixed in memory and rebuild cost, the search parameter is the only one you can move per query, which is why it is the one to expose.
flowchart TD
  ENTRY["Entry point, top layer<br/>sparse, long edges"] -->|"greedy walk"| L2["Layer 2<br/>medium density"]
  L2 -->|"greedy walk"| L1["Layer 1"]
  L1 -->|"best first search,<br/>candidate list size ef"| L0["Layer 0<br/>every element, degree bounded by m"]
  L0 --> OUT["Top k returned"]
  BUILD["Build time: m and ef_construction.<br/>Fixed cost in memory and index build"] -.-> L0
  RUN["Query time: ef.<br/>Recall against latency, tunable live"] -.-> OUT
```

The operational reading of this: `m` and `ef_construction` are capacity decisions you pay for permanently, and `ef` is a dial you can turn at request time. I would set `m` conservatively for memory, set `ef_construction` high enough that the build is good because you only pay it once, and do all runtime tuning on `ef`, per query class rather than globally. A query behind an autocomplete box and a query behind a compliance search do not deserve the same latency budget or the same recall.

The case for raising `m` anyway, which is the next claim's problem in advance: filters.

## Claim one: filtered search is where production falls off the benchmark

Benchmarks measure unfiltered search. Production almost never does unfiltered search. There is a tenant identifier, a document type, a date range, a permission scope.

The naive implementation is to filter during traversal: walk the graph, skip nodes that fail the predicate. This works until it abruptly does not, and the reason is structural rather than a matter of degree. Removing a random fraction of nodes from a graph is percolation, and there is a critical threshold at roughly one over the average degree below which the graph fragments into disconnected components. Qdrant's write up of this is the clearest public treatment I know of, including the observation that the threshold moves with `m` and does not depend on the number of points ([Filterable HNSW without recall loss](https://qdrant.tech/articles/filterable-hnsw/)).

Below that threshold your greedy walk gets trapped in a component that does not contain the answer. Not degraded. Trapped. Recall does not slope downward as the filter tightens, it falls off.

```mermaid What a selective filter does to graph traversal. The failure is not gradual: above the percolation threshold the surviving graph is connected and search works, below it the graph is in pieces and the walk cannot reach the answer at any ef.
flowchart LR
  subgraph A["Loose filter, most nodes survive"]
    A1["entry"] --> A2["node"] --> A3["node"] --> A4["nearest neighbour found"]
  end
  subgraph B["Selective filter, below 1 over average degree"]
    B1["entry"] --> B2["node"]
    B2 --> B3["dead end: neighbours filtered out"]
    B4["nearest neighbour<br/>in a disconnected component"]
  end
  NOTE["Threshold moves with m,<br/>not with collection size"] -.-> B
```

The mitigations are known and none of them are free. Build extra edges within each filterable category so the subgraph stays connected, which costs memory and only works for categories known at build time. Or detect selectivity at query time and choose a different strategy.

## Claim two: when a scan beats an index, and it is more often than people think

If the filter reduces the candidate set to a small enough number, the correct answer is to abandon the index and compute exact distances over the survivors. It is exactly correct, it has no recall to measure, and below some size it is faster than a graph walk because it is a linear pass over contiguous memory with no pointer chasing.

The threshold is a property of your data layout and your hardware, not a number anyone can give you from outside. My position is that every serious vector search deployment should have measured it and should have the crossover wired into the query planner, and that most have neither. The planner needs a cardinality estimate for the filter, which is the same problem a relational database solved decades ago and which vector databases are re learning: you need statistics on the payload fields, not just on the vectors.

The opposite case: a filter that looks selective on average can be unselective for one tenant. If your crossover uses an estimate rather than a measurement, a single large tenant will fall on the wrong side of it and get the worst of both plans. Cap the scan by absolute candidate count, not by estimated selectivity, and fall back to the graph when the cap is exceeded.

## Claim three: the assumption that does not survive production is that the index is static

Benchmarks build an index once and query it. Real collections take writes, and worse, deletions.

Deletion in a graph index is not deletion. The usual implementation tombstones the node and filters it out at query time, because actually removing it would require repairing every edge that pointed to it. So the graph keeps the deleted node's edges as structure, keeps paying for it in memory, and slowly degrades as the ratio of tombstones rises: the walk spends its candidate budget on nodes it will discard.

The consequence is that a long lived index has a maintenance schedule whether you planned one or not, and the failure is a slow drift in recall that nobody attributes to churn because nothing changed in the code. I would measure recall against a fixed held out query set on a schedule and treat a decline as the trigger for a rebuild, rather than rebuilding on a calendar, which either wastes compute or arrives late.

One more thing that follows from the same fact and gets discovered the hard way: changing the embedding model invalidates the entire index, and there is no incremental path. Every vector has to be recomputed and the graph rebuilt. That is a migration with a cost proportional to your corpus, and it needs to be in the plan on the day you pick the first model, along with the decision about whether you can afford to run two indexes during the cutover.

Recall at k is a good engineering metric for the component and a bad product metric for the system. Keep it for regression testing the index and never let it appear on a slide next to the words search quality.

## Sources

- Yury Malkov and Dmitry Yashunin, [Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs](https://arxiv.org/abs/1603.09320), 2016. Source of the layer structure, the exponentially decaying layer assignment, and the bounded degree parameter.
- Andrei Vasnetsov, [Filterable HNSW without recall loss](https://qdrant.tech/articles/filterable-hnsw/), Qdrant, 2019. Source of the percolation threshold at one over average degree, the observed dependency on the degree parameter, and the absence of dependency on collection size.
