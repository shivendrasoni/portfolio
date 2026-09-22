---
title: Guardrails that fired on the wrong people
slug: guardrails-false-positives-user-register
date: 2026-09-22
description: A user said @you are the bomb@ and the safety layer stopped the conversation. The library passed our tests because our tests were written by engineers, and real users do not talk like engineers.
tags:
  - applied-ai
  - guardrails
  - production
draft: false
---

@You are the bomb.@

Somebody said that to a bot we had built, meaning it as a compliment, and the guardrail layer treated it as something to stop. Another person asked for a masseuse who is really good, or who gives great therapy. Ordinary sentence, ordinary intent, and the classifier read it as an insinuation.

This was while building a conversational AI product. We needed input and output guardrails, for the usual reason: you cannot let harmful content reach the model or leave it. We took a well known guardrails library from a major provider rather than building our own, which was the sensible call and I would make it again. It passed our test suite. Then it went to production and started tripping on genuine requests, and the disruption was real.

The cause was not intent. It was register. The way people actually talk can insinuate one thing while meaning another, and a classifier trained to notice insinuation cannot tell the difference. Ours could not. I call that a mistake of mine, because the test suite that cleared it was ours.

What we did to fix it is unglamorous: pulled it back, fine tuned on a large set of real examples, wrote internal rubrics, tested against those, then re-released. The rest of this is the general version, because the specific failure is common enough that the industry has benchmarks for it now.

## A guardrail is a classifier, and a classifier has two ways to be wrong

Everything downstream follows from one asymmetry that is usually left implicit.

A false allow lets something through that should have been stopped. A false block stops something that should have been allowed. Every threshold you can set trades one against the other, and you cannot reduce both by moving the threshold, because moving the threshold just slides along a curve fixed by the model.

The safety conversation is almost entirely about the first error. The product conversation should be almost entirely about the second, because that is the one your ordinary users meet. A false allow is a rare, sometimes serious event. A false block is a common, small, compounding one: a user who was trying to do a normal thing gets stopped, does not know why, and either leaves or contacts support. Multiply by a product handling 10 to 15 million conversations a year and a small percentage stops being small.

The published evidence says this is systemic rather than one team's bad luck. XSTest was built to measure exactly it, with 250 safe prompts that a well calibrated model should not refuse, paired with 200 unsafe contrasts, and it finds systematic failure modes in state of the art models ([Röttger et al., NAACL 2024](https://arxiv.org/abs/2308.01263)). OR-Bench scaled the same idea to 80,000 over refusal prompts across ten rejection categories, with about 1,000 hard ones and 600 toxic controls, and measured 32 models across 8 families ([Cui et al., ICML 2025](https://arxiv.org/abs/2405.20947)).

Those are not obscure results. They exist because over refusal turned out to be a general property of aligned systems, which means it is a default you inherit rather than a defect you introduce.

```mermaid Where a false block lands in a two classifier design. The dotted path is the entire user experience of a false positive, and in most implementations it contains no route back.
flowchart TD
  U[@User message@] --> IN{@Input classifier@}
  IN -->|@flagged@| B1[@Blocked before the model sees it@]
  IN -->|@passed@| M[@Model@]
  M --> OUT{@Output classifier@}
  OUT -->|@flagged@| B2[@Response withheld after generation cost is paid@]
  OUT -->|@passed@| R[@Response to user@]
  B1 -.-> UX[@Generic refusal, no reason, no appeal, no ticket@]
  B2 -.-> UX
  UX -.-> LOST[@User retries, rephrases, or leaves. None of it is logged as a failure@]
  R --> DONE[@Conversation continues@]
```

Two things on that diagram are decisions rather than drawing. The output classifier fires after generation, so a false block there costs the full token spend and the full latency and then delivers nothing, which is the most expensive possible way to be wrong. And the dotted path terminates: in most implementations there is no appeal route, so the event never becomes data.

