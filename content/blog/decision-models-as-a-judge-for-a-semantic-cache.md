---
title: Decision models as a judge for a semantic cache
slug: decision-models-as-a-judge-for-a-semantic-cache
date: 2026-09-27
description: A semantic cache decides that two questions mean the same thing by how they look, and the pairs it gets most confidently wrong differ by one negation or one number. The missing step was always to verify the hit before serving it, and the only instrument for that verdict used to cost a whole generation. A decision model changes that price and nothing else.
tags:
  - applied-ai
  - caching
  - system-design
draft: false
---

By the middle of last year, everyone and their pets had tried a semantic cache and quietly switched it off. Not because it was slow, and not because it was hard to run. Because every so often it answered a question nobody had asked.

If you have not built one, the idea in plain terms. You ask a model something. The answer costs money and takes a second or two, so you keep it. When a question arrives that means the same thing as one you have already answered, you hand back the saved answer instead of paying for it again. An ordinary cache does this on exact bytes, which is safe and almost never fires, because two people asking the same thing rarely type the same characters. A semantic cache widens the word same from identical text to close in meaning. That is where the savings are, and it is also the whole problem, because the design now rests on one decision taken thousands of times a second: do these two questions mean the same thing.

I published one of these two years ago, then shot it.

It is called [vector-cache](https://github.com/shivendrasoni/vector-cache), it is MIT, and it works the way all of them work. Turn the question into a vector, find the nearest stored question, compare the distance to a threshold, serve the stored answer when the distance is small enough. I set the default threshold at 0.99, tight enough that it almost never matches, and wrote a line into the README saying a looser threshold can return matches that are not relevant and should be used with caution. Then I stopped working on it. The reason was not a bug I could not find. The design was missing a step, and I had no affordable way to add it.

## The word that flips the answer

Distance between two vectors measures whether two questions look alike as text. What you need before serving a saved answer is whether they have the same answer. Those agree most of the time, which is why the technique works at all, and they come apart hardest at pairs that differ by one negation or one number. "Places I must go today" and "places I must not go today" are near twins in every embedding space I have used, and they have opposite answers. "Best laptops under $300" and "best laptops under $500" differ by the only part of the sentence anyone cares about, and that part is a rounding error in the geometry.

What comes back in that case is not stale data. Stale data is last week's answer to your question, and every engineer knows how to reason about it. This is worse: another question's answer, returned with a 200, quickly and cheaply, with no exception, no retry and no error rate moving anywhere. It also counts as a hit, so any control loop wired to hit rate is rewarded for producing more of them, including the adaptive threshold I shipped in that library, which walks toward a target hit rate and cannot tell a good hit from a wrong one. I wrote that failure up at length in [semantic caching, and the day it serves the wrong answer](/blog/semantic-caching-wrong-answer), so I will leave it there and get on with the part I did something about.

```mermaid Where a wrong answer leaves the building. Every edge on this path is a success path, so the branch on the right is never retried, never logged as an error and never counted anywhere except as a hit. The only detector is a person downstream who notices the answer does not fit the question.
flowchart TD
  Q["New question"] --> E["Turn it into a vector"]
  E --> A["Find the nearest<br/>stored question"]
  A --> T{"Distance small<br/>enough?"}
  T -->|"No"| M["Miss: ask the model,<br/>store the answer"]
  T -->|"Yes"| S["Serve the stored answer"]
  S --> R1["Same meaning:<br/>money and a second saved"]
  S --> R2["Opposite meaning:<br/>a confident wrong answer,<br/>served with a 200"]
  R2 -.-> N["No error, no retry,<br/>counted as a hit"]
```

## The fix I could not afford

There was always an obvious missing step, and everyone who has built one of these has thought of it. Before serving, ask something whether the saved answer actually answers the new question. Not whether the questions look alike. Whether the answer fits.

The problem was the instrument. The only thing capable of that verdict was a model built to write paragraphs, so the check meant a second model call on the read path, with tokens to pay for, prose to parse on the way back, and a wait in the same range as the call you were trying to skip. Spending a generation to decide whether to skip a generation is not a cache. That is why I put the project down, and on those terms I would put it down again today.

What changed this month is narrower than the reaction to it. A decision only model does not write anything. You hand it a state and a set of typed questions, and it returns typed answers with calibrated probabilities, every question evaluated against the same state inside one request. TypeSafe calls the class [System One](https://docs.typesafe.ai/introduction) and put the first one, Jev, into early access on 15 September 2026. Their own [model page](https://docs.typesafe.ai/models) quotes $0.042 per million input tokens with output free, and a response time in the low hundreds of milliseconds. Both are the vendor's own numbers, and my pull request marks them as not independently verified, because I have not measured them.

Generation did not get cheaper. A verdict did. That is a smaller claim than launch week made and a more useful one, because a step that was priced out of a design for years is now a choice.

## What the missing step looks like written down

I have [opened a pull request on vector-cache](https://github.com/shivendrasoni/vector-cache/pull/6) that puts an optional judge in front of every hit. It is open rather than merged, and vector-cache is a library rather than anything I run, so read what follows as a design and not as a result. With no judge configured, nothing in the library changes.

```python
vector_cache = VectorCache(
    embedding_model=my_embedding_model,
    db=my_cache_storage,
    vector_store=my_vector_store,
    judge=JevJudge(mode="query", accept=0.9),
    judge_band=(0.80, 0.95),  # below: miss. above: direct hit. between: judged
    judge_top_k=3,            # candidates sent in one request
    check_cacheable=True,     # refuse to store time sensitive, personal or failed responses
)
```

The interesting part is not which model sits behind `JevJudge`. It is where each decision gets taken, and how many of them never reach a model at all.

```mermaid The lookup path once a judge is set. Two of the four decisions are taken in plain code with no model involved, the judge sees at most three candidates and costs one request for all of them, and every error edge leads to a miss, so an outage costs hit rate and never correctness.
flowchart TD
  Q["Question, plus the three<br/>nearest stored questions"] --> F{"Similarity<br/>below 0.80?"}
  F -->|"Yes"| MISS["Miss: ask the model"]
  F -->|"No"| N{"Same numbers on<br/>both sides?<br/>compared in plain code"}
  N -->|"No"| MISS
  N -->|"Yes"| C{"0.95 or above, and no<br/>negation on one side only?"}
  C -->|"Yes"| HIT["Serve the stored answer,<br/>no judge call"]
  C -->|"No"| J["Judge, one request:<br/>a match question and a separate<br/>negation question per candidate"]
  J -->|"Match at or above 0.9"| HIT
  J -->|"Below 0.5"| MISS
  J -->|"In between: uncertain"| LOG["Miss, logged for calibration"]
  J -->|"Error or timeout"| MISS
```

Four of those calls could reasonably have gone the other way, so they are worth arguing about rather than announcing.

### Numbers are compared in plain code, and that is not laziness

`numbers_match` pulls the numerals out of both questions, normalises them so 1,000 and 1000 agree, and drops the candidate when the sets differ. No model, no probability, a regular expression and a set comparison, and it runs before anything expensive.

That looks like an odd thing to put in front of a model you are paying for, until you read TypeSafe's own [published weaknesses for jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13), which says the model struggles with numeric precision and date comparison and advises keeping arithmetic in code. Both fuzzy components in this path, the embedding and the decision model, are weak in the same place, and that place is carrying the entire difference between $300 and $500. Where both of your clever components are weak and the question is exactly decidable, it belongs in code.

The opposite case is real. The guard is naive on purpose: it does not understand "two" or "a couple", and a stored question mentioning a version number will refuse to match one that does not. That costs hits silently, in a way that never shows up as an error. On a corpus where quantities are written as words I would normalise number words first, or drop the guard and let the judge see the pair. What I would not do is hand the numeric decision to the model because the model is the smarter component, because on this question it is not.

### It fails closed, and the bill for that is a thundering herd

Every error path in the judge returns no match. Timeout, rate limit, malformed response, provider outage, all of them become a cache miss, and the cacheability check behaves the same way, so a failure there leaves the answer unstored rather than stored unchecked.

That is the only defensible default when the alternative is serving a wrong answer during an incident, but the cost deserves saying out loud. Failing closed turns your entire hit rate into traffic against your most expensive dependency, at the moment another dependency is already unhealthy. On a real read path I would put the judge behind a circuit breaker that, once open, stops calling it and falls back to a similarity threshold tight enough to behave like an exact matcher. The degraded mode should be a smaller cache, not no cache.

The opposite call, in one case. If the stored answers carry a commitment to somebody, a price, an eligibility rule, a policy statement, then full misses during a judge outage is the correct and boring behaviour, and the traffic spike is the bill for having been right.

### The band is the cost control, not the model choice

Arguments about putting a verifier in a hot path go straight to which model to use. The bill is set by how often you call it. Below 0.80 no candidate is worth verifying. At 0.95 and above the stored answer is served with no judge call, unless one side carries a negation the other lacks, the single exception, because that is exactly the region where high similarity and opposite meaning live together. The judge only ever sees the band in between, one request for up to three candidates.

So the cost tracks the width of that band and the shape of your traffic rather than your volume. I would start it narrow and widen it using the pairs the code already logs as uncertain, which is why that middle result is a logged state and not a silent miss. Those pairs are a calibration set and they cost nothing to collect.

Where I would skip the band and judge every candidate: a domain where near identical phrasings with different answers are the normal traffic rather than the tail, support queues about accounts, plans and billing being the obvious case. There the top of the similarity range is not the safe region, it is the dangerous one.

### The negation question is asked separately, and it can veto

Each candidate produces two questions inside the same request. The match question asks whether a correct answer to the stored question would also answer the new one. The negation question asks, separately, whether the two differ by a negation or an exclusion, and a yes kills the match however confident the match was. Splitting a judgement into atomic questions and combining them in code is what the decision model documentation recommends anyway, and here it buys one thing: it stops a strong general impression of similarity from drowning the one feature most likely to invert the answer. The word list guard earlier in the path escalates to this question rather than rejecting outright, because it cannot tell "gluten free" from "without gluten", and a false alarm costs one request where a forced miss would cost a legitimate hit. The judge itself sits behind `BaseJudge`, two methods with no vendor in them, for the same reason the embedding model did in the original library.

## The part that is larger than caching

A semantic cache is the clearest example because the missing step is so easy to see once you have named it. It is not the only place it is missing.

Anything that retrieves by approximate similarity and then acts on what came back has the same shape. Retrieval for a model context ranks by distance and passes the top few through untouched. Deduplication merges records that look alike. A cheap classifier routes a request and nothing downstream asks whether the route was right. In each of those the verification step was priced out of the design, because the only verdict on offer cost a full generation, so the shortlist quietly became the answer.

Decision models change the price of a verdict and nothing else about the stack. That turns each of those into a choice, including the choice to leave the check out, which is the right answer whenever being wrong is cheap and somebody downstream will catch it. What changed is that it is now a decision somebody makes, rather than a step nobody could afford.

Decision only models do not make semantic caching faster. They make it correct, and that is a different and much larger thing.

## Sources

- [vector-cache](https://github.com/shivendrasoni/vector-cache), my own library, MIT, and [pull request 6](https://github.com/shivendrasoni/vector-cache/pull/6), open at the time of writing, which adds the judge, the guards and the cacheability check described here. Source of the band, the accept and reject probabilities and the code above.
- TypeSafe AI, [Introduction](https://docs.typesafe.ai/introduction) and [Models](https://docs.typesafe.ai/models). Source of the System One description and of the quoted price of $0.042 per million input tokens with output free. Prices and response times there are the vendor's own and are not independently verified here.
- TypeSafe AI, [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13). The published weaknesses on numeric precision, counting and date comparison, and the advice to keep arithmetic in code, which is why the number guard exists.
