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
  K[@Key@] --> H[@hash(key)@]
  H --> RING[@Walk clockwise to the next virtual node@]
  RING --> OWN[@Owner: physical node behind that vnode@]
  OWN --> CAP{@Owner above c times mean load?@}
  CAP -->|No| SERVE[@Serve from owner, cache stays warm@]
  CAP -->|@Yes, overflow@| NEXT[@Next vnode clockwise with capacity@]
  NEXT --> SERVE2[@Serve from overflow node, cold for this key@]
  SERVE2 -.->|@ownership churn costs hit rate@| COST[@Duplicate copies, extra invalidation@]
  HEALTH[@Health and load feedback@] -.-> CAP
```

Two things on that diagram are decisions rather than drawing. The capacity test reads live load, which means ownership is no longer a pure function of the key and two clients can disagree about the owner during a load spike. And the dotted cost edge is the thing people forget to price: every overflow creates a second cached copy of the same key, so a ceiling that is set too tight trades a hot node for a fleet wide drop in hit rate.

