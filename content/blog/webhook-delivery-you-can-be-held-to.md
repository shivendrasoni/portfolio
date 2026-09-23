---
title: Design webhook delivery you can be held to
slug: webhook-delivery-you-can-be-held-to
date: 2026-09-14
description: Sending an HTTP request is not the problem. The problem is the consumer that was down for six hours, wants the backlog, wants it in order, and is sharing your worker pool with everyone who stayed up.
tags:
  - system-design
  - integrations
  - reliability
draft: false
---

A consumer of your webhooks goes down at 02:00 and comes back at 08:00. In those six hours you generated forty thousand events for them. At 08:00 they would like all forty thousand, in the order they happened, and they would like the rest of your customers not to have noticed that any of this occurred.

Every hard decision in webhook design is contained in that paragraph, and none of them are about how to make an HTTP POST.

I have not built a webhook platform end to end. My prior comes from the PhonePe merchant ecosystem, which takes tens to hundreds of millions of requests a day, and what that teaches you about integration surfaces is that the partner's bad night becomes your support queue, every time. This post is the design I would argue for, reasoned from the structure of the problem, with the published behaviour of systems that do this at scale as the reference points. Where a claim rests on judgement rather than a measurement, the sentence says so.

## The unit of design is the endpoint, not the event

The first structural decision, and the one that determines whether the rest of the system is fixable: delivery state belongs per endpoint, not per event.

If you model this as one global queue of pending deliveries, a single dead consumer consumes your retry capacity, and the length of your queue is set by your worst customer. Every delivery worker is eventually blocked on a socket timeout to an endpoint that has been down since Tuesday.

```mermaid Delivery state per endpoint. The dotted transition is the one most implementations omit, and omitting it is what turns one dead consumer into a platform incident: without a circuit that opens, healthy endpoints queue behind an unhealthy one for the length of its timeout, every attempt.
flowchart TD
  NEW["Event created"] --> PEND["Pending for endpoint E"]
  PEND --> SEND{"POST, timeout 5s"}
  SEND -->|"2xx"| DONE["Delivered, logged"]
  SEND -->|"4xx, not 429"| PERM["Permanent failure, no retry"]
  SEND -->|"5xx, 429 or timeout"| BACK["Backoff with jitter"]
  BACK --> ATT{"Within retention?"}
  ATT -->|"Yes"| PEND
  ATT -->|"No"| EXP["Expired, available for replay only"]
  BACK -.->|"consecutive failures over threshold"| OPEN["Endpoint circuit open:<br/>stop attempting, park the backlog"]
  OPEN --> PROBE["Probe on a slow timer"]
  PROBE -->|"Healthy"| DRAIN["Drain at a controlled rate"]
  DRAIN --> PEND
```

The circuit is not a performance optimisation. It is the thing that makes the six hour outage a property of one endpoint's queue depth rather than a property of your delivery tier.

## Claim one: most consumers do not want ordering, they want currency

Ordering is the requirement consumers state and it is usually not the requirement they have. What they actually need is to not apply a stale update over a fresh one.

That distinction matters because the two have very different prices. Guaranteeing order means a single in flight delivery per ordering key, which means one slow response blocks every subsequent event for that key, which means head of line blocking is now a designed in feature of your system. Guaranteeing currency means putting a monotonically increasing version on the resource in every payload and letting the consumer drop anything older than what it already has. That costs one integer and allows full parallelism.

So my default would be parallel delivery plus a version field, documented loudly, with the consumer responsible for discarding stale events.

The case for making the opposite call, because it exists and it is not rare. When the events are not snapshots of a resource but increments to one, order is not a convenience, it is correctness. A sequence of balance adjustments cannot be reordered and cannot be made idempotent by version comparison. If your event model is fundamentally a log of deltas rather than a series of state announcements, pay for ordering, accept head of line blocking, and shard the ordering key as finely as the domain allows so that the blocking is contained. The better move, where the domain permits it, is to change the event model so the deltas carry the resulting state as well, which converts an ordering requirement into a currency requirement.

## Claim two: the retry schedule is a promise about retention, so publish it

A retry policy is usually written as an implementation detail and it is actually a contract. It tells the consumer how long they may be down before data is lost, which is the single number their own architecture depends on.

Stripe's is a useful published example: undelivered events are automatically resent for up to three days, and events remain retrievable through the API for 30 days ([Stripe, process undelivered webhook events](https://docs.stripe.com/webhooks/process-undelivered-events)). Those are two different windows doing two different jobs. The three days is the automatic system's patience. The 30 days is the consumer's escape hatch for anything worse than that.

I would hold to both, and to the separation. Automatic retries should expire early enough that your queues have a bounded worst case, while the event history lives long enough that a customer with a genuinely bad week can recover without a support ticket. A system that retries forever has no bound on its own backlog. A system that retries for three days and then deletes the evidence has converted a recoverable outage into data loss.

## Claim three: replay and retry will overlap, and the consumer will not expect it

Once you give consumers a replay API, they will replay events that your automatic retries are still delivering. Stripe is explicit about this: manually processed events are still considered undelivered and the automatic retries continue ([same source](https://docs.stripe.com/webhooks/process-undelivered-events)).

That is the correct behaviour and it should be stated in the first paragraph of your webhook documentation rather than a subsection, because it makes consumer side idempotency mandatory rather than advisory. The consumer will receive the same event twice, from two different mechanisms, possibly concurrently. If your documentation buries that, you have shipped a system whose correct use is undiscoverable.

The concrete design that follows: every event carries a stable identifier that does not change across retries or replays, and the documentation shows a handler that checks that identifier before doing work. Not as a best practice note at the bottom. As the example.

```mermaid Backlog drain after a six hour consumer outage. The rate limiter on the drain is the part that is usually missing: a consumer that just came back is the least able to absorb the full backlog at line rate, and delivering it at line rate is how you take them down a second time.
sequenceDiagram
  participant P as Producer
  participant Q as Per endpoint queue
  participant C as Consumer
  P->>Q: events accumulate, 6 hours
  Q->>C: probe
  C-->>Q: 200
  Note over Q: circuit closes, drain begins
  Q->>C: deliver at capped rate, bounded concurrency
  C-->>Q: 200
  Q->>C: next batch
  C-->>Q: 429 too many requests
  Note over Q: honour the consumer's own limit,<br/>halve the drain rate
  Q->>C: resume slower
  C-->>Q: 200
  Note over Q,C: backlog cleared, no second outage
```

Honouring a 429 from the consumer during a drain is the small detail that separates a delivery system people trust from one they build a queue in front of.

## What the standard treatment gets wrong about signatures

The usual advice is to sign the payload with HMAC and have the consumer verify it. That is necessary and it is not replay protection, which is what people believe they have bought.

A signature proves the body came from you. It does not prove it is not a copy of a message you sent last week, captured and re sent by anyone who saw it. Replay protection requires a timestamp inside the signed material and a consumer that rejects anything outside a tolerance window. If the timestamp is not in the signed payload, it can be edited.

Two more things I would build in from the start, because retrofitting them is painful. Sign the raw bytes and tell consumers not to re serialise before verifying, since a framework that reorders JSON keys will break every signature in a way that looks like an attack. And support two active signing secrets at once, because a rotation with a single secret means every consumer must deploy in the same instant that you do, which means nobody ever rotates.

## When to give up on an endpoint

A dead endpoint should eventually be disabled, and the interesting question is what counts as dead and how you tell them.

My judgement: consecutive failures over a long period, not a count of failures, because a high volume endpoint fails a thousand times in the time a low volume one fails twice. Disable on sustained total failure over a period measured in days, notify through a channel that does not depend on the failing integration, which usually means email to the account owner and a visible state in the dashboard, and keep the events in history so re enabling can replay them.

The case against auto disabling at all: it converts a partial outage into a total one at the worst possible moment, and if your health detection is wrong you have just cut off a working customer. That risk is why the threshold should be conservative and the notification should go out well before the disable, not with it.

A webhook system is judged entirely on the day a consumer has a bad night. Design for that day and the normal path takes care of itself.

## Sources

- Stripe, [Process undelivered webhook events](https://docs.stripe.com/webhooks/process-undelivered-events). Source of the three day automatic retry window, the 30 day event retention, and the statement that manually processed events continue to be retried automatically.
- Stripe, [Receive Stripe events in your webhook endpoint](https://docs.stripe.com/webhooks). Source of the signature verification requirements, including the need for the raw request body.
- Marc Brooker, [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), AWS Architecture Blog, 2015. Source of the jitter behaviour used in the retry schedule.
