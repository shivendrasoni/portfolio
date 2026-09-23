---
title: Idempotency, and why exactly once is a story you tell the client
slug: idempotency-exactly-once-story
date: 2026-09-11
description: Exactly once delivery does not exist, exactly once effects do, and the gap between those two sentences is the entire engineering problem. The assumption that fails in production is not the mechanism, it is the width of the window.
tags:
  - system-design
  - distributed-systems
  - reliability
draft: false
---

"We need exactly once processing." It appears in a requirements document, everyone nods, and it goes into the design as though it were a configuration setting.

It is not achievable as written, and the useful move is not to explain the impossibility result and walk away. It is to notice that nobody actually wants exactly once delivery. What they want is that the customer is charged once, and those are different requirements with different solutions. One of them is impossible and the other is ordinary work.

## Why the strong version cannot be had

A sender transmits a message and waits for an acknowledgement. The acknowledgement does not arrive. The sender cannot distinguish between the message being lost, the message arriving and the work being done but the acknowledgement being lost, and everything being fine but slow. There is no number of extra messages that resolves this, because each extra message has the same problem.

So the sender picks. Give up, which is at most once and loses work. Send again, which is at least once and duplicates work. Those are the two options, and every system you have used has picked one of them.

Exactly once semantics do exist inside a closed system where the message log and the state being updated are the same system and can commit together, which is how transactional processing in a log based broker works. The property survives exactly as far as that transaction boundary. The moment the effect is a charge on a card, an email, or a call to a partner API, you are back to at least once with a sender that cannot see the outcome.

## The reframe that makes it tractable

Stop asking for exactly once delivery and ask for effects that are indistinguishable from having happened once. That is a property of the receiver, which is code you control, rather than a property of the network, which is not.

```mermaid The same duplicate, through two receivers. The key does not stop the second request arriving, it changes what the second request means, and the outcome the client sees is identical in both attempts.
flowchart TD
  C["Client sends request"] --> T{"Timeout, outcome unknown"}
  T --> C2["Client retries"]
  subgraph NOK["Without a key"]
    C2 --> S1["Server treats it as new"]
    S1 --> D1["Second charge created"]
    D1 --> X["Two charges, one intent"]
  end
  subgraph OK["With an idempotency key"]
    C2 --> S2{"Key seen before?"}
    S2 -->|"No"| EXEC["Execute, store result against key"]
    S2 -->|"Yes, complete"| REPLAY["Return the stored result"]
    S2 -->|"Yes, in flight"| CONF["409, tell the client to wait"]
  end
```

The third branch is the one that gets left out of implementations and causes the worst bugs. A duplicate that arrives while the first attempt is still running cannot be answered with a stored result, because there is not one yet. If you treat that as a miss you execute twice, which is the exact failure the key was for. The key has to be claimed at the start of processing, not written at the end.

## Claim one: the key belongs to the intent, not to the attempt

An idempotency key generated fresh on each retry is decoration. It has to be derived from the thing the caller meant to do, and generated once at the point the intent is formed, then reused for every attempt of that intent.

In practice this means the key gets created at the top of the call stack, by whatever component owns the business intent, and gets threaded down. Stripe's implementation is a good reference for the contract: the result of the first request is stored against the key regardless of whether it succeeded, subsequent requests with the same key return the same result, keys can be pruned after at least 24 hours, and reusing parameters that differ from the original request is an error rather than a silent overwrite ([Stripe idempotent requests](https://docs.stripe.com/api/idempotent_requests)).

That parameter comparison is the underrated part. Without it, a caller with a buggy key derivation can send two genuinely different operations under one key and receive the first one's result for both, which is a data corruption bug that looks like a success in every log you have.

There is a trap inside the same design worth naming, because it is the one I would guard hardest. If you store failures against the key too, and a request fails with a 500 due to a transient cause, then every retry with that key replays the 500 forever. The retry that would have worked can never run. Whether that is correct depends on whether the failure was before or after the side effect, so the honest implementation stores a terminal outcome only when it knows the side effect resolved, and stores nothing when it does not know, accepting that the unknown case is the one that needs a human.

## Claim two: the assumption that does not survive production is the window

Every dedupe mechanism has a window, whether it is stated or not. A key table with a time to live, a bloom filter sized for a day, a partition in a stream processor, a cache. The design assumes duplicates arrive close together, because network level retries do.

Duplicates in production are not all network retries. A user with a stuck tab reloads it the next morning. A partner's reconciliation job replays yesterday's failed calls on a nightly schedule. A queue that was paused during an incident drains six hours of backlog. An engineer re runs a migration. Those all arrive far outside any window sized for a retry loop, and when they do, the system does not report a dedupe failure. It reports success, twice.

So my judgement is to size the window against your slowest legitimate replay path, not your retry policy, and to know what that path is. If a partner can replay a day late, a 24 hour window is exactly one hour too short.

The case for the opposite call, which is real. An unbounded key store is not free and not obviously safer. It grows forever, it makes a genuinely repeated operation impossible to perform a second time on purpose, and it turns a legitimate identical request six months later into a silent replay of a stale result. Long windows convert one class of bug into another. The right answer is usually a bounded window plus detection for what escapes it, rather than a longer and longer window.

```mermaid A duplicate outside the dedupe window. Nothing errors, nothing is logged as a duplicate, and the only artefact is a second effect that looks like a legitimate first one. This is why the reconciliation pass exists.
sequenceDiagram
  participant P as Partner system
  participant A as Your API
  participant K as Key store, 24h TTL
  participant L as Ledger
  P->>A: create payout, key K1
  A->>K: claim K1
  A->>L: write payout
  A-->>P: 200, payout id X
  Note over K: 24 hours pass, K1 pruned
  P->>A: nightly replay of unacked calls, key K1
  A->>K: claim K1
  Note over K: no record, treated as new
  A->>L: write payout again
  A-->>P: 200, payout id Y
  Note over L: Two payouts, one intent.<br/>No error anywhere in the trace
```

## Claim three: for what you cannot prevent, build detection instead

Some effects cannot be made idempotent. You cannot un send an email. A partner API without a key parameter will accept your duplicate happily. A physical action has already happened.

For that class I would stop trying to prevent and start trying to detect, because a duplicate you find within minutes is an operational event and a duplicate you find in a quarterly audit is a liability. Concretely: a ledger of intents separate from the ledger of effects, and a reconciliation pass that compares them and alerts on any effect without a matching intent or any intent with two effects.

This is less satisfying than a correctness proof and it is what actually holds. It also has a property the preventive approach lacks: it catches duplicates caused by things outside your model, including the ones caused by a human running something twice.

The case against, so it is stated: reconciliation is a second system with its own bugs, its own on call load, and a tendency to be switched off when it gets noisy. It is worth building for money and for anything with an audit trail. It is over engineering for a notification nobody will miss.

Exactly once is a description of an outcome, not a mechanism. You get it by deciding which operations deserve a key, which deserve a ledger, and which deserve neither, and by being honest in the design document that the third category exists.

## Sources

- Stripe, [Idempotent requests](https://docs.stripe.com/api/idempotent_requests). Source of the stored result contract, the parameter mismatch error, and the statement that keys can be removed after at least 24 hours.
- Amazon Web Services, [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html). Source of the redelivery behaviour that produces duplicates in the first place.
