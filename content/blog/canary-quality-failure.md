---
title: You cannot canary a quality failure
slug: canary-quality-failure
date: 2026-10-08
description: Progressive delivery tools gate a rollout on error rate and latency, and a prompt or model change that makes answers worse returns 200 at normal latency. The release safety net was built for failures that announce themselves, so it passes the one failure a model change actually causes. What to watch instead, how long each substitute signal makes you wait, and why your control group moves without a deploy.
tags:
  - applied-ai
  - system-design
  - reliability
  - evaluation
draft: false
---

Flagger ships with exactly two built in checks: [request success rate and request duration](https://docs.flagger.app/usage/metrics), the first counting non 5xx responses and the second a P99 in milliseconds. Argo Rollouts is built the same way, and [its canonical analysis example](https://argo-rollouts.readthedocs.io/en/stable/features/analysis/) aborts a rollout when a Prometheus success rate query comes back under 95 percent three times in a row. Both are good tools. I would reach for either one on a normal service without thinking about it.

Now change a prompt and ship it through that same machinery. The new version returns 200. It returns in the same 900 milliseconds the old one did. It answers the question with a confident, fluent, slightly wrong answer, and it does that for every request on the canary slice for every minute of the analysis window. Success rate holds at 100 percent. The gate promotes. The automated rollback trigger never fires, because from where it sits there was never anything to roll back from.

That gap is structural rather than a configuration mistake. Progressive delivery assumes a bad release is loud: processes crash, dependencies time out, status codes change. A quality regression is silent at the transport layer by construction, since the thing that got worse is the content of a body that was always well formed. One line on a neighbour and then I will leave it alone: my post on [evals as a system](/blog/evals-as-a-system) argues for keeping an aggregate quality score out of the blocking path and running a frozen control set on a clock to catch provider drift. Both still hold. This post is about the minutes during a release itself, when neither of those is what the rollout controller is reading.

## What the gate is actually reading

Here is the whole analysis block from a Flagger canary, which is the shape most teams inherit:

```yaml
analysis:
  interval: 1m
  threshold: 5
  maxWeight: 50
  stepWeight: 10
  metrics:
    - name: request-success-rate
      thresholdRange:
        min: 99
      interval: 1m
    - name: request-duration
      thresholdRange:
        max: 500
      interval: 1m
```

Two numbers, both about the envelope. Here is a single log line from the canary arm of a support agent during a release that this block promoted:

```json
{
  "ts": "2026-10-08T11:42:03Z",
  "arm": "canary",
  "status": 200,
  "latency_ms": 870,
  "tokens_out": 214,
  "tool_calls": 1,
  "answer": "Your refund has been processed and should appear in 3 to 5 days.",
  "ground_truth": "no refund was issued, the policy window closed in August"
}
```

Every field the rollout controller can see is healthy. The one field that matters is not in the telemetry at all, and on most systems there is no process that could have filled it in within the rollout window.

So the first decision is what you gate on, and the two options are an offline eval that blocks the release, or a slice of real traffic read through substitute signals. **I would ship to a slice and read the substitutes**, because an offline eval scores the cases somebody already thought to write down, and release risk concentrates in the cases they did not. Where the agent takes an irreversible or regulated action, invert that and block on the eval, accepting a slower release, since a substitute signal only tells you after a real person was affected. I wrote about the design of that first case in [agents and irreversible actions](/blog/agent-irreversible-actions).

```mermaid Two failure classes arriving at the same rollout gate. The left path closes in seconds because the signal and the controller share a clock. The right path has no instrument inside the analysis window at all, so the promotion decision is made on evidence that only describes the left path. The practical consequence is that automated rollback, the feature teams value most in progressive delivery, is available for exactly the failure mode a model change is least likely to produce.
flowchart TB
  R["Canary arm<br/>10 percent of traffic"] --> A["Transport failure:<br/>5xx, timeout,<br/>crash loop"]
  R --> B["Quality failure:<br/>200, normal latency,<br/>worse answer"]
  A --> A1["Read by:<br/>request-success-rate<br/>request-duration"]
  B --> B1["Read by:<br/>no metric in<br/>the analysis block"]
  A1 --> A2["Detected in<br/>one scrape interval"]
  B1 --> B2["Detected when a<br/>human notices,<br/>or never"]
  A2 --> P["Automatic rollback<br/>fires"]
  B2 --> Q["Rollout promotes,<br/>dashboards green"]
```

## The substitute signals, and how long each one makes you wait

Nothing in this table is a measurement of mine. It is an ordering, and the ordering is the useful part, because a signal that reads slower than your rollout window cannot drive a rollback no matter how good it is.

| Signal | What it tells you | Roughly when it is readable |
| --- | --- | --- |
| Output guard verdict, schema or policy check | The answer was malformed or out of bounds | Same request |
| Retry or regenerate on the same turn | The user read it and rejected it | Seconds |
| Conversation abandoned mid task | The user gave up | Minutes, and only once a session timeout defines it |
| Escalation to a human, or handoff rate | The system could not finish the job | Minutes to hours |
| Explicit thumbs down | Something was bad enough to report | Hours, from a self selected minority |
| Ticket, chargeback, public complaint | It cost money or reputation | Days |

**Pick at least one signal whose lag is shorter than the window you are prepared to leave a bad release running, and instrument it before the rollout rather than after.** On a conversational product that usually means same turn regeneration and escalation rate, both of which are cheap to count and awkward to game. The opposite case is real on batch and asynchronous work, where there is no user sitting there to retry and the fastest honest signal is a downstream human rejecting the output hours later. On those systems the answer is a slower rollout, not a faster signal, so size the canary so that hours of exposure is an acceptable loss.

```mermaid Substitute signals ordered by the delay between a worse answer and a number you can act on, with the analysis window from a canary config like the one above drawn across them. Only the first two rows resolve inside that window, which is the argument for instrumenting them specifically rather than relying on the feedback you already collect. Thumbs down, the signal most products ship first, sits well outside the window and is drawn from whoever is annoyed enough to click.
flowchart LR
  E["Worse answer<br/>served"] --> S1["Guard verdict<br/>same request"]
  S1 --> S2["Same turn retry<br/>seconds"]
  S2 --> W{"Analysis window<br/>closes here,<br/>minutes"}
  W --> S3["Abandonment<br/>minutes"]
  S3 --> S4["Human takeover<br/>minutes to hours"]
  S4 --> S5["Thumbs down<br/>hours, self selected"]
  S5 --> S6["Ticket or complaint<br/>days"]
  W -.-> D["Promotion decision<br/>is made with S1 and S2<br/>or with nothing"]
```

## Pin the snapshot in both arms, and measure the control in the same window

Canary analysis compares two arms and assumes one of them holds still. I have argued elsewhere that provider drift needs its own frozen control set on a clock, and that is still the right instrument for the slow question. During a release the question is narrower, and the vendor documentation is worth reading closely before you trust your baseline.

Anthropic's [model IDs and versioning page](https://platform.claude.com/docs/en/about-claude/models/model-ids-and-versions) says the short aliases accepted for models before the 4.6 generation, such as `claude-sonnet-4-5`, resolve to whichever dated snapshot is most recent for that minor version. Pin the full ID and the weights are fixed, which is the guarantee you want. The same page then says the serving infrastructure around those fixed weights, including the request router, safety classifiers and sampling logic, does change, and that such updates can produce minor differences in output.

Two rules follow for a rollout specifically. Every arm, including the control, runs the pinned snapshot ID, so an alias cannot move one side of your comparison mid release. And the control arm gets measured on live traffic inside the same window as the canary, rather than compared against figures recorded before the release, because a stored baseline describes a system that may have been rebuilt underneath you since.

## Slice by tenant, not by request

When you do put a change in front of real traffic, the unit of exposure decides what the user experiences. **I would slice by tenant.** A user who gets the new prompt on one request in ten experiences a system that contradicts itself between messages rather than a variant, and the support ticket they open will be about the contradiction rather than about either version.

Tenant slicing costs you statistical comfort, since tenants are lumpy and a handful of heavy accounts dominate the sample. On a consumer surface with no account boundary, hash the user ID into a stable bucket instead and keep them there for the whole rollout.

One trap underneath both choices: a shared cache crosses the arms. If the control and the canary read the same semantic cache, the canary serves answers the old prompt generated and you end up measuring the cache instead of the change. Key the cache on the prompt version, or disable it on the canary arm for the duration. Caching has its own failure modes before you add a rollout to it, which I went through in [the post on semantic caches returning the wrong answer](/blog/semantic-caching-wrong-answer).

## Eight questions before a prompt change meets real traffic

1. Which number moves when the answer gets worse?
2. How long until that number is readable?
3. Is that shorter than your rollback window?
4. What measures the control arm this week?
5. Is every arm on a pinned snapshot ID?
6. Is the slice a tenant, not a request?
7. Do both arms share a cache?
8. Who aborts the rollout, and by when?

Question three is the one that decides whether progressive delivery is doing anything for you here. If every signal you have reads slower than the window, the rollout is being watched rather than gated, and the honest response is to make the slice small enough that the hours you will take to notice are hours you can afford to lose.

Write the answers down before the release rather than after. Once a change is live and the dashboards are green, the available numbers will argue for whatever decision you already made.
