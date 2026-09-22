## Three: removal is the easy case, and return is the expensive one

The diagram shows a node disappearing and its arc moving to the neighbour. Clean. What it does not show is the same node coming back.

A node that returns after twenty minutes holds data that was correct when it left. If ownership snaps back to it on rejoin, it starts serving stale values, so a real system must either invalidate on rejoin, which produces a thundering refill against the store, or hold ownership away until it has caught up, which means the membership view and the ownership view are different things and you now have two states to reason about. This is where an implementation stops being a hash function and becomes a distributed systems problem with a failure detector in it.

The second hidden cost is that @minimal keys move@ is a statement about keys, not about bytes or about time. Moving one nth of the key space can mean moving terabytes across a network that is also serving traffic, and during that window your replication factor is degraded, which is precisely when a second failure would be expensive. Capacity events therefore need to be planned for the recovery window, not for the steady state, and my judgement is that the honest planning number is how long a full partition rebuild takes under production load, measured once, written down, and re-measured when the data grows.

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
