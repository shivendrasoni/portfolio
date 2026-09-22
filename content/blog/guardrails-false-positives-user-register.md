---
title: Guardrails that fired on the wrong people
slug: guardrails-false-positives-user-register
date: 2026-09-22
description: A user said "you are the bomb" and the safety layer stopped the conversation. The library passed our tests because our tests were written by engineers, and real users do not talk like engineers.
tags:
  - applied-ai
  - guardrails
  - production
draft: false
---

"You are the bomb."

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
  U["User message"] --> IN{"Input classifier"}
  IN -->|"flagged"| B1["Blocked before the model sees it"]
  IN -->|"passed"| M["Model"]
  M --> OUT{"Output classifier"}
  OUT -->|"flagged"| B2["Response withheld after generation cost is paid"]
  OUT -->|"passed"| R["Response to user"]
  B1 -.-> UX["Generic refusal, no reason, no appeal, no ticket"]
  B2 -.-> UX
  UX -.-> LOST["User retries, rephrases, or leaves. None of it is logged as a failure"]
  R --> DONE["Conversation continues"]
```

Two things on that diagram are decisions rather than drawing. The output classifier fires after generation, so a false block there costs the full token spend and the full latency and then delivers nothing, which is the most expensive possible way to be wrong. And the dotted path terminates: in most implementations there is no appeal route, so the event never becomes data.

## Your test set encodes your register, not your users'

This is the claim I would defend hardest, and it is the one that would have saved us.

Test cases for a safety layer get written by the people building it. They write what they imagine an attack looks like, which is roughly what they would type if they were attacking their own system: explicit, structured, a bit adversarial, and written in the register of somebody who knows what a classifier is.

Real users write in their own register. They use slang that overlaps with violence, "the bomb", "killing it", "this is insane". They use professional vocabulary with an unfortunate second meaning. They are blunt, they are regional, they type in a second or third language, and they are not thinking about your threshold at all. The distance between those two vocabularies is where every false positive we saw lived.

So a test suite that passes proves your system handles the attacks you thought of. It says nothing about the traffic you will get, and the gap is not a matter of degree. It is a different distribution.

The practical consequence I would apply on any similar project: before launch, take a sample of real messages from the actual product, run the classifier over them offline, and read every flag by hand. Not synthetic prompts, not a red team exercise. Real traffic, human reviewed. It is a boring afternoon and it is the only test that samples the distribution you are about to serve.

## Tuning the threshold is the wrong repair

When false blocks start arriving, the instinct is to raise the threshold, and it feels responsive because the complaints stop. What actually happened is that you slid along a fixed curve and bought fewer false blocks with more false allows. If the original threshold was chosen for a reason, you have just silently overruled that reason under pressure.

The repair that works is moving the curve, and the only thing that moves it is examples from your own distribution. That is what fine tuning on real examples does, and why the written rubric matters as much as the training data: without it, three reviewers label the same borderline message three different ways and the model learns the disagreement.

```mermaid The loop that turns invisible blocks into training data. Sampling blocks is the step nobody schedules, because in every dashboard a block looks like the system working.
flowchart TD
  PROD["Production traffic"] --> CLS["Classifier"]
  CLS --> ALW["Allowed"]
  CLS --> BLK[("Blocked messages")]
  BLK --> SMP["Weekly random<br/>sample of blocks"]
  SMP --> REV["Human review against<br/>a written rubric"]
  REV --> FP["Labelled<br/>false positives"]
  REV --> TP["Labelled<br/>true positives"]
  FP --> SET[("Fine tuning set from<br/>your own register")]
  TP --> SET
  SET --> FT["Fine tune, re-evaluate<br/>on held out real traffic"]
  FT --> CLS
  REV -.->|"reviewers disagree"| RUB["Rubric is ambiguous.<br/>Fix it before training"]
```

That reviewer disagreement metric is the underrated one. If two reviewers disagree on a meaningful share of borderline cases, no amount of training data will fix the model, because the label itself is not defined. Fix the rubric, then train.

## When I would take the false blocks

The opposite case is real and I want to state it as strongly as the main argument.

Where the action is irreversible or regulated, the asymmetry flips. Moving money, changing a medical or legal record, sending something to a regulator, anything where being wrong once is unrecoverable. There, a false block costs a user some friction and a false allow costs something you cannot undo, so I would set the threshold tight, accept the complaints, and staff the path that resolves them. The same logic applies to a brand new product with no reputation to spend: early on, being annoying is survivable and being unsafe is not.

What makes that a real decision rather than a shrug is the second half. If you choose to over block, you own the recovery path: a specific message rather than a generic refusal, a route to a human, and a queue somebody actually works. Choosing strictness without staffing the appeal is not caution, it is offloading your threshold choice onto users.

And that is the general lesson I took from our version of this. The guardrail was not the mistake. Believing our test suite represented our users was the mistake, and the fix was not a better library, it was reading what real people had actually said and letting that rewrite the classifier. If you run a product where a safety layer sits between a user and the thing they came for, the number to put on a dashboard this week is not how many messages you blocked. It is how many of them you were wrong about.

## Sources

- Röttger, Kirk, Vidgen, Attanasio, Bianchi and Hovy, [XSTest: A Test Suite for Identifying Exaggerated Safety Behaviours in Large Language Models](https://arxiv.org/abs/2308.01263), NAACL 2024. Source of the 250 safe prompts and 200 unsafe contrasts.
- Cui, Chiang, Stoica and Hsieh, [OR-Bench: An Over-Refusal Benchmark for Large Language Models](https://arxiv.org/abs/2405.20947), ICML 2025. Source of the 80,000 over refusal prompts, ten categories, roughly 1,000 hard prompts, 600 toxic controls, and 32 models across 8 families.
