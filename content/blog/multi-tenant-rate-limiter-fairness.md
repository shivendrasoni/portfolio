---
title: Design a multi tenant rate limiter that is fair, not just safe
slug: multi-tenant-rate-limiter-fairness
date: 2026-09-17
description: Rate limiters get built as capacity controls and then get used as fairness controls. The noisy neighbour in a real system is almost never an attacker, it is your largest and best paying customer, and a limit that treats those two the same is the design error.
tags:
  - system-design
  - multi-tenancy
  - reliability
draft: false
---

The tenant hammering your API at four in the afternoon is not a script kiddie. It is the customer with the largest contract, running their end of month batch, doing exactly what they signed up to do.

That is the whole difficulty. A rate limiter designed to stop abuse has one job and a clear conscience. A rate limiter in a multi tenant system is deciding how to divide a shared resource between paying customers who all have legitimate claims to it, and that is not a safety problem, it is an allocation problem. The mechanisms look identical. The questions they answer are not.

## The tiers, and what each one is actually for

A production system ends up with several limiters that people conflate because they are all implemented with counters.

```mermaid The request path with each control at the tier where it can see what it needs. The distinction the labels carry: the first three decide using a property of the caller, the last one decides using the state of the system and does not care who is calling.
flowchart TD
  REQ["Incoming request"] --> EDGE{"Edge: per IP and connection"}
  EDGE -->|"Over"| R429A["429, abuse control"]
  EDGE -->|"Under"| TEN{"Per tenant: contracted rate"}
  TEN -->|"Over"| R429B["429, contract enforcement"]
  TEN -->|"Under"| CLASS{"Per tenant per class:<br/>reads, writes, reports"}
  CLASS -->|"Over"| R429C["429, one workload cannot<br/>starve the tenant's own others"]
  CLASS -->|"Under"| SHED{"Global: is the system healthy?"}
  SHED -->|"Degraded"| DROP["Shed lowest priority work.<br/>Decided on system state, not caller"]
  SHED -->|"Healthy"| SVC["Service"]
```

Stripe describes running four different limiter types in production and names the request rate limiter as by far the most important, while treating load shedding as a separate mechanism that makes its decision from the state of the whole system rather than from who is calling ([Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters)). That separation is the part worth stealing. A limiter answers "is this caller taking more than their share", a shedder answers "can we serve anything right now". Teams build one component that tries to do both and it ends up doing neither well, because the first should be on all the time and the second should be off almost always.

## Claim one: a good limiter is idle when the system is idle

The standard design assigns each tenant a fixed rate and enforces it always. It is simple, it is predictable, and it wastes capacity continuously and annoys customers for no gain.

If your service is at 20 percent utilisation and a tenant at their contracted 100 requests per second sends 140, rejecting the 40 buys you nothing. There is no contention. You have burned goodwill and generated a support ticket in order to protect headroom you were not using.

The design I would argue for is limits that bind under contention and relax when there is slack: a guaranteed floor per tenant that is always honoured, plus access to spare capacity that is reclaimed the instant somebody else needs their floor. That is max min fairness, and it turns the limiter from a tax into a scheduler.

The case for the opposite call, which is strong enough that many good systems make it. Elastic limits are unpredictable for the caller. A customer who has been getting 400 requests per second for a month builds a batch job around it, and the day your platform gets busy their job takes four times as long and they call it an outage. Fixed limits are worse for utilisation and better for everyone's ability to plan, and if your product promise is predictability rather than throughput, take the fixed limit and publish it. The hybrid I would actually ship is a contracted floor that is guaranteed and never elastic, plus clearly labelled burst capacity that is explicitly best effort in the documentation and in the response headers.

## Claim two: limit the scarce resource, not the request count

Requests are a proxy for load and a bad one. One call reads a cached row in two milliseconds. Another runs a report across a year of data and occupies a connection for four seconds. Counting both as one unit means your limit is calibrated for whichever mix you had on the day you set it.

So the useful limiter counts work, not calls: a cost assigned per endpoint, or better, measured cost charged back after execution, with the tenant's budget denominated in something that maps to the thing you actually run out of. Usually that is database connection time or CPU seconds, rarely requests per second.

The honest objection: cost based limits are hard for a customer to reason about. "You get 1000 requests per minute" can be implemented by a client developer in an afternoon. "You get 60 seconds of database time per minute" cannot, unless you expose the accounting. If you go cost based, you owe the caller visibility: the cost of the call they just made and the balance remaining, in response headers, on every response. Without that you have built a limit nobody can code against, and they will discover it by being throttled.

## Claim three: the counting algorithm is the least important decision

Interview answers spend their time on the algorithm. Token bucket against leaky bucket against sliding window log against sliding window counter, and the boundary burst problem in fixed windows.

That discussion matters at the margin and it is not where production systems fail. They fail because the counter is local and the traffic is not.

Run the limiter in each of twenty API nodes with a local counter and a tenant limit divided by twenty, and you have assumed the tenant's requests distribute evenly across nodes. They do not. They arrive over a small number of keep alive connections, which pin to a small number of nodes, so a tenant well under their global limit gets throttled on one node while nineteen others sit idle. The symptom is a customer reporting 429s that your dashboards say are impossible.

The fixes are all about where the state lives rather than how it is computed. A shared store that every node consults, which is correct and adds a network hop to the critical path of every request. Or local counters with periodic reconciliation against a shared view, which is approximate and survives the store being down. My judgement is the second for anything where a brief overshoot is acceptable, which is most rate limiting, because a limiter that fails closed when its datastore blips has become the outage it was installed to prevent. Fail open, alarm loudly, and make the approximation explicit in the contract by setting the enforced limit slightly above the published one.

## The failure mode that a global limit cannot see

The reason all of this matters is that the naive design has a specific and reproducible way of hurting exactly the customers you most want to keep.

```mermaid One large tenant against a global capacity limit. Nothing here is a bug. Every component behaves as configured, and the outcome is that the smallest tenants experience a total outage while the system reports being at its healthy limit.
flowchart TD
  T1["Tenant A: batch job,<br/>8,000 rps"] --> GL{"Global cap: 10,000 rps"}
  T2["Tenant B: 200 rps"] --> GL
  T3["Tenant C: 50 rps"] --> GL
  GL -->|"admitted, arrived first"| A["A gets 8,000"]
  GL -->|"remaining headroom"| REST["B and C compete for what is left"]
  REST --> FAIL["Small tenants see 429s<br/>they did not cause"]
  GL --> DASH["Dashboard: 100 percent of cap,<br/>system healthy"]
  FAIL --> SUP["Support tickets from<br/>the tenants using least capacity"]
```

A global cap is a safety control that is completely blind to fairness. It protects the service and distributes the pain in proportion to nothing in particular, usually favouring whoever is fastest to retry, which is the tenant with the most infrastructure.

The case for a hard global cap anyway, because there is one. When the failure mode of overload is not degradation but collapse, a hard cap well below the collapse point is the only control that reliably works, and fairness is a luxury compared to staying up. Per tenant fairness requires per tenant state, which costs something on every request, and in a genuinely capacity constrained system that cost is the first thing you cut. My position is that a global cap should exist and should sit above the per tenant controls, not instead of them, and that it should be treated as the last line rather than the design.

The line I would put at the top of the design document: a rate limiter is a policy expressed as code, and if you cannot write down the policy in a sentence a salesperson could read to a customer, the code is not going to express it correctly either.

## Sources

- Stripe, [Scaling your API with rate limiters](https://stripe.com/blog/rate-limiters). Source of the four limiter types in production, the primacy of the request rate limiter, and the distinction between a rate limiter and a load shedder deciding on whole system state.
- Amazon Web Services, [Amazon SQS message quotas](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/quotas-messages.html). Reference for how a large provider expresses limits per action and per partition rather than as a single global number.
