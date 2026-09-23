---
title: Design a job system for work that takes minutes, not milliseconds
slug: job-system-for-slow-work
date: 2026-09-08
description: Queue defaults were chosen for tasks that finish in under a second. Model calls do not, and when a long job meets a short visibility timeout the redelivery is not a retry, it is a second worker doing the same work at the same time.
tags:
  - system-design
  - queues
  - applied-ai
  - reliability
draft: false
---

The default visibility timeout on an Amazon SQS queue is 30 seconds ([SQS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html)). The default in most other queue libraries is the same order of magnitude, because the defaults were chosen when a job meant resizing an image or sending an email.

Now put a job on that queue that calls a language model twice, waits on a document conversion, and writes a report. Four minutes, on a good day. At the 30 second mark the message becomes visible again, another worker picks it up, and you have two workers doing the same work concurrently. Neither of them is retrying. Nobody failed. The queue did exactly what it was configured to do.

That is the shape of every problem in this area. The machinery is mature and well documented, and every default in it assumes the work is short. When the work is long, the defaults do not degrade gracefully, they invert.

## The lifecycle, with the branches that matter

A job system for slow work needs a state machine that is explicit about the difference between a job that is still running, a job that died, and a job that failed in a way that will fail again.

```mermaid Worker lifecycle for long running work. The two shaded outcomes are the ones the defaults conflate: a worker that is still making progress and a worker that has died look identical to a queue, and only an application level heartbeat tells them apart.
flowchart TD
  Q["Message claimed"] --> RUN["Worker executing"]
  RUN --> HB{"Heartbeat renewed?"}
  HB -->|"Yes, still progressing"| RUN
  HB -->|"No, worker gone"| REQ["Requeue: real redelivery"]
  RUN --> OK["Success: record outcome, ack"]
  RUN --> ERR{"Failed"}
  ERR -->|"Transient: dependency down"| BACK["Backoff with jitter, retry"]
  ERR -->|"Permanent: bad input"| DLQ["Dead letter, do not retry"]
  BACK --> ATT{"Attempts exhausted?"}
  ATT -->|"No"| Q
  ATT -->|"Yes"| DLQ
  REQ --> Q
```

The distinction the diagram carries and the prose usually skips is that a timeout is not evidence of failure. It is evidence that you stopped hearing from the worker, which is a different claim, and the correct response to it is different too.

## Claim one: heartbeat, do not lengthen the timeout

The obvious fix for a four minute job on a 30 second timeout is a 10 minute timeout. It works, and I would not do it as the general answer.

A long visibility timeout buys safety against duplicates by paying for it with recovery time. If the worker dies one second after claiming the message, that message is invisible for the full timeout before anyone else can touch it. You have taken a failure that should cost seconds and made it cost as long as your worst case job. At any real concurrency you also start hitting in flight message limits, because messages sit claimed for a long time and the limit is on claimed messages, not on throughput.

So the shape I would argue for is a short timeout plus an explicit heartbeat: the worker extends the claim every few seconds while it is making progress. Death is then detected at heartbeat resolution rather than at job duration, and the claim is only as long as the work actually needs.

The opposite case, and it is common enough to name. If your jobs are uniform, short enough to redo cheaply, and your workers are on managed infrastructure that rarely dies mid task, a generous fixed timeout is less code and fewer moving parts than a heartbeat you have to keep correct. Heartbeating is a mechanism that can itself be buggy, and a heartbeat that keeps renewing while the job is wedged on a socket read is worse than no heartbeat, because it makes a stuck job immortal. If you implement one, tie it to observed progress, not to the process being alive.

## Claim two: make the last side effect idempotent first, not the first one

Every guide says make your jobs idempotent. Real jobs have several side effects in sequence, and you rarely get to make all of them idempotent at once, so the question is ordering.

The instinct is to protect the first side effect, because it is the one that runs on every attempt. My judgement is the opposite: protect the last one first, because it is usually the one the outside world can see. A duplicated internal row is an operational annoyance. A duplicated payout, notification, or webhook is somebody else's incident.

The structural move that follows is to order the job so that everything reversible happens first and the irreversible, externally visible effect happens last and exactly once, guarded by a key. That gives you a job you can safely re run from the top, which is worth more than a job where every step is individually protected by a mechanism nobody has tested.

## Claim three: retries are correlated, and that is what turns them into a storm

The standard treatment models a retry as an independent second chance. It is not. Failures in a job system are correlated almost by definition, because the usual cause is one shared dependency being unavailable, which means every in flight job fails at roughly the same moment and every one of them retries at roughly the same moment.

The classic result here is worth reading rather than summarising: with capped exponential backoff and no jitter, retries cluster into synchronised waves, and adding randomness to the sleep more than halves the total call count in a simulation with 100 contending clients ([Exponential Backoff And Jitter, AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/)). Full jitter, sleeping a random interval between zero and the cap rather than the cap itself, is the version to implement.

```mermaid A retry storm and the two controls that cut it. Backoff alone moves the load later without spreading it, which is why the recovery attempt is often what keeps the dependency down.
flowchart TD
  DEP["Shared dependency degrades"] --> F["All in flight jobs fail together"]
  F --> NOJ["Retry at a fixed interval:<br/>synchronised wave"]
  NOJ --> DEP
  F --> BJ["Backoff plus full jitter:<br/>attempts spread over the window"]
  BJ --> CB{"Circuit breaker open?"}
  CB -->|"Yes"| PARK["Park the work, stop calling"]
  CB -->|"No"| RETRY["Retry at a rate the dependency can absorb"]
  PARK --> DRAIN["Drain deliberately when healthy"]
```

The part of this that applies specifically to slow work: a retry of a four minute job costs four minutes of capacity, not four milliseconds. Retrying a long job during an outage does not just add load to the dependency, it consumes the worker pool you will need to drain the backlog when the dependency recovers. That is why a circuit breaker matters more here than in a fast queue. Stopping calls entirely is what preserves the ability to catch up later.

## The assumption that does not survive production: that one retry policy fits the queue

Queues are configured per queue and failures arrive per cause. A malformed input will fail identically on all five attempts and should go to the dead letter queue on the first one. A provider returning 503 will succeed on the third attempt and should be retried patiently. A job that failed halfway through and left state behind should not be retried at all until someone decides what to do with the partial work.

One `maxReceiveCount` cannot express those. So the retry decision belongs in the worker, which knows what it was doing, not in the queue configuration, which knows only how many times it handed the message out. The worker classifies the failure and either acks and records a permanent failure, or signals a retry with the delay it thinks is appropriate.

## When to drop the work instead

The option that gets left out of job system designs is not doing the work.

Some work has a shelf life. A personalisation refresh, a cache warm, a recommendation recompute, a non urgent notification that is now eight hours late. Retrying it after the outage is over does not deliver the value, it just delivers the load. I would put an explicit deadline in the message envelope and have workers discard anything past it, then count the discards as a first class metric.

The case against, stated fairly: this is only safe when the work is genuinely regenerable and the next run will produce the same or a better result. Anything carrying a user's intent, a payment, a state transition or an audit obligation gets parked for human decision, never discarded. The failure mode of a deadline is silent data loss, so the deadline belongs in the payload where it is visible in a log, not in a config file where it is a default nobody remembers setting.

The whole design reduces to one sentence worth arguing over. In a system for slow work, capacity is the scarce resource and every mechanism you choose is really a decision about who gets to consume it during an incident.

## Sources

- Amazon Web Services, [Amazon SQS visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html). Source of the 30 second default and of the in flight message limit on standard queues.
- Marc Brooker, [Exponential Backoff And Jitter](https://aws.amazon.com/blogs/architecture/exponential-backoff-and-jitter/), AWS Architecture Blog, 2015. Source of the jitter result, including the more than halved call count at 100 contending clients.
