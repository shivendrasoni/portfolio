---
title: A semantic cache is a hash table that skipped the equality check
slug: semantic-cache-missing-equality-check
date: 2026-09-27
description: A dictionary hashes the key and then compares the full key before it returns anything. A semantic cache does the first half and calls it a lookup. The comparison was always missing, and until this month the only way to add it cost more than the cache saved.
tags:
  - applied-ai
  - caching
  - system-design
draft: false
---

A dictionary lookup does two things. It hashes the key to find a bucket, and then it compares the full key against whatever is sitting in that bucket. The hash narrows the search. The comparison is the part that makes the answer correct. Take the second step out and you still have something that returns a value quickly, and it no longer has any idea whether that value belongs to the key you asked about.

That is a semantic cache. Embedding the query is the hash. The nearest neighbour search is the bucket. There is no comparison step. I wrote one of these two years ago, [vector-cache](https://github.com/shivendrasoni/vector-cache), put it out under MIT, and then left it where it was, because the missing half was not subtle and the only instrument I had to fill it was a second model call, which is precisely the cost the cache exists to remove.

## The failure this produces, stated once

I have already written the failure mode up at length in [semantic caching, and the day it serves the wrong answer](/blog/semantic-caching-wrong-answer), so here it is in two paragraphs and then I will move on.

Cosine similarity between two embedded questions measures whether they look alike as text. What you need before serving a cached answer is whether they have the same answer. Those correlate, which is why the technique works, and they come apart hardest at pairs differing by one negation or one number. "Chocolate cake without gluten" and "chocolate cake with gluten" sit close enough in most embedding spaces to clear any threshold you would actually ship. So do "best laptops under $300" and "best laptops under $500". High similarity and opposite meaning arrive together, which is the worst distribution a failure can have.

And the failure does not look like a failure. A wrong hit returns 200, returns fast, returns cheap, and increments the hit rate, so any control loop wired to that metric, including the adaptive threshold I shipped in that library, is rewarded for producing more of them. Tuning the threshold moves you along a line between missing real hits and serving wrong ones. It never adds the step that is not there.

```mermaid Both lookups narrow the search the same way. Only the left one verifies before it returns, and the dotted box is the step no semantic cache implements, including the one I wrote in 2024. A hash collision in a dictionary is caught by the comparison; a near neighbour in a semantic cache is served.
flowchart TB
  subgraph HT["Hash table lookup"]
    direction TB
    K["Key"] --> H["Hash the key"]
    H --> B["Bucket,<br/>a few entries"]
    B --> C{"Full key<br/>equal?"}
    C -->|"Yes"| V["Return<br/>the value"]
    C -->|"No"| M1["Miss, or<br/>probe on"]
  end
  subgraph SC["Semantic cache lookup"]
    direction TB
    Q["Query"] --> E["Embed the query"]
    E --> A["Nearest neighbour<br/>shortlist, top k"]
    A --> T{"Cosine above<br/>threshold?"}
    T -->|"Yes"| V2["Return the<br/>cached answer"]
    T -->|"No"| M2["Miss, call<br/>the model"]
    V2 -.-> X["No comparison exists here.<br/>Nothing asks whether the two<br/>questions share an answer"]
  end
```

## The check was never impossible, it was priced wrong

Here is the part I want to be precise about, because it is the difference between a 2024 argument and a 2026 one.

The equality check was always available in principle. Take the incoming query and the candidate entry, and ask a model whether the cached answer actually answers this question. That is a real check and it works. It also costs a model call on the read path, with tokens to pay for, prose to parse on the way back, and a latency in the same order of magnitude as the call you were trying to avoid. Spending a generation to decide whether to skip a generation is not a cache.

So the check did not get skipped because nobody thought of it. It got skipped because the only instrument for producing a verdict was built to produce paragraphs, and the price of a paragraph was the entire budget.

What changed this month is narrower than the reaction to it suggests. Decision only models, which TypeSafe calls [System One](https://docs.typesafe.ai/introduction), do not generate text at all. You send a state and a set of typed questions, and you get back typed answers with calibrated probabilities, every question evaluated in parallel against the same state in one request. Jev, the first of them, went into early access on 15 September 2026. TypeSafe's own model page lists it at [$0.042 per million input tokens with output free](https://docs.typesafe.ai/models), and quotes a response time in the low hundreds of milliseconds, which my own pull request marks as not independently verified, because I have not measured it and neither has anyone I would cite.

Generation did not get cheaper. A verdict did. That is a smaller claim than the launch coverage made, and a more useful one, because it turns a missing equality check from a constraint into a choice.

## What the check looks like once you write it down

I have [opened a pull request on vector-cache](https://github.com/shivendrasoni/vector-cache/pull/6) adding an optional judge in front of every hit. It is open rather than merged, and it is a library rather than anything running in production, so read it as a design and not as a result. With no judge configured, nothing changes.

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

The part that matters is not which model sits behind `JevJudge`. It is where each decision is taken.

```mermaid The lookup path once a judge is set, with the two decisions taken without a model at all. The judge sees at most the top three candidates and costs one request for all of them, and every error edge leads to a miss, so an outage costs hit rate and never correctness.
flowchart TD
  Q["Query, nearest neighbour<br/>shortlist of 3"] --> F{"Similarity<br/>below 0.80?"}
  F -->|"Yes"| MISS["Miss: call the model"]
  F -->|"No"| N{"Same numbers in both queries?<br/>compared in plain code"}
  N -->|"No"| MISS
  N -->|"Yes"| C{"Similarity 0.95 or above,<br/>and no negation on one side only?"}
  C -->|"Yes"| HIT["Serve the cached answer,<br/>no judge call"]
  C -->|"No"| J["Judge, one request:<br/>a match question and a separate<br/>negation question per candidate"]
  J -->|"Match at or above 0.9"| HIT
  J -->|"Below 0.5"| MISS
  J -->|"In between: uncertain"| LOG["Miss, logged for calibration"]
  J -->|"Error or timeout"| MISS
```

Four things in there are worth arguing about, and each is a place where the call could reasonably have gone the other way.

### The numbers are compared in code, and that is not a shortcut

`numbers_match` pulls the numerals out of both queries, normalises them so that 1,000 and 1000 agree, and drops the candidate when the sets differ. No judge call, no model, no probability. A regular expression and a set comparison.

That looks like a strange thing to put in front of a model you are paying for, until you read TypeSafe's own [jaggedness page for jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13), which says plainly that the model struggles with numeric precision and with date comparison, and advises keeping arithmetic in code. So both fuzzy components here, the embedding and the decision model, are weak in the same place, and that place carries the entire content of "under $300" against "under $500". Where both of them are weak and the predicate is exactly decidable, the predicate belongs in code. It is also the cheapest step in the path, which is why it runs first.

The opposite case, and it is real. The guard is naive on purpose: it does not understand "two" or "a couple", and a cached query mentioning a version number will refuse to match one that does not. That costs hits silently, in a way that never appears as an error. On a corpus where quantities are written as words I would normalise number words first, or drop the guard and let the judge see the pair. What I would not do is route the numeric decision through the model because the model is the smarter component, because on this question it is not.

The negation guard is built the other way round on purpose. When the negation counts differ, the candidate is not rejected, it is sent to the judge, because a word list cannot tell "gluten free" from "without gluten". A false alarm there costs one request, and forcing a miss instead would cost a legitimate hit. The guard that can be certain rejects. The guard that can only be suspicious escalates.

### It fails closed, and the cost of that is a thundering herd

Every error path in the judge returns no match. Timeout, rate limit, malformed response, provider outage: all of them become a cache miss, and the cacheability check behaves the same way, so a failure there leaves the response unstored rather than stored unchecked.

That is the only defensible default when the alternative is serving a wrong answer during an incident, but the cost deserves naming. Failing closed converts your entire hit rate into traffic against the expensive model at once, a load spike on your most expensive dependency at the moment another dependency is already unhealthy. On a real read path I would put the judge behind a circuit breaker that, once open, stops calling it and falls back to a similarity threshold high enough to behave like an exact matcher. The degraded mode should be a smaller cache, not no cache.

The opposite call, in one case. If the cached answers carry a commitment to a user, a price, an eligibility rule, a policy statement, then full misses during a judge outage is the correct and boring behaviour, and the spike is the bill for having been right.

### The band is the cost control, not the model choice

Arguments about putting a verifier in a path go straight to which model to use. The bill is actually set by how often you call it. Below 0.80 no candidate is worth verifying. At or above 0.95 the pair is served with no judge call, unless one query carries a negation the other lacks, which is the single exception because that is the region where high similarity and opposite meaning live together. The judge only sees the band in between, one request for up to three candidates.

So its cost tracks the width of that band and the shape of your query distribution rather than your traffic. I would start narrow and widen it using the pairs the code already logs as uncertain, which is why that band is a logged state and not a silent miss. Those pairs are the calibration set and they are free to collect.

Where I would skip the band and judge every candidate: a domain where near duplicate phrasings with different answers are the normal traffic rather than the tail, support queues about accounts and plans being the obvious one. There the top of the similarity range is not the safe region, it is the dangerous one.

### The judge is an interface, and the question is asked twice

`BaseJudge` has two methods and no vendor in it. The Jev implementation is one file, and another decision model behind the same request shape is a configuration change rather than a fork. Same reasoning as the embedding interface in the original library: the component most likely to be replaced within a year should be the easiest to replace.

The second half is the piece I would keep even if everything else changed. Each candidate produces two questions in the same request. The match question asks whether a correct answer to the cached query would also answer this one. The negation question asks, separately, whether the two queries differ by a negation or an exclusion, and a yes vetoes the match however confident the match was. Splitting a judgement into atomic questions and combining them in code is what the decision model documentation recommends anyway, and here it does one specific thing: it stops a strong overall impression of similarity from drowning the single feature most likely to invert the answer.

## The part that is larger than caching

A semantic cache is the clearest case because the missing step is so obvious once you put it beside a dictionary. It is not the only one.

Anything that retrieves by approximate similarity and then acts on the result has the same shape. Retrieval for a model context ranks by distance and passes the top k through untouched. Deduplication merges records that look alike. A cheap classifier routes a request and nothing downstream asks whether the route was right. In each of those a verification step existed in the design space and was priced out, because the only verdict available cost a generation, so the fuzzy shortlist became the answer by default.

Decision models change the price of a verdict and nothing else. That makes every one of those systems a place where the check is now a choice, including the choice not to add it, which is a fine answer when being wrong is cheap. The check was never optional in a hash table. It only looked optional here because nobody could afford it, and that has stopped being true.

## Sources

- [vector-cache](https://github.com/shivendrasoni/vector-cache), my own library, MIT, and [pull request 6](https://github.com/shivendrasoni/vector-cache/pull/6), open at the time of writing, which adds the judge, the guards and the cacheability check described here. Source of the band, the accept and reject probabilities, the fail closed behaviour and the code above.
- TypeSafe AI, [Introduction](https://docs.typesafe.ai/introduction) and [Models](https://docs.typesafe.ai/models). Source of the System One description, the typed questions evaluated in parallel in one request, and the price of $0.042 per million input tokens with output free. Prices and response times there are the vendor's own and are not independently verified here.
- TypeSafe AI, [Jev 1.13 jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13). The published weaknesses on numeric precision, counting and date comparison, and the advice to keep arithmetic in code, which is why the number guard exists.
