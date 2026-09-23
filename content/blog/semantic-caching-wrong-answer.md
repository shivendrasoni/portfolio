---
title: Semantic caching, and the day it serves the wrong answer
slug: semantic-caching-wrong-answer
date: 2026-09-25
description: A cache that matches on meaning has a failure mode an exact cache cannot have. It can return a confidently wrong answer to a question nobody asked, and the hit rate metric you are optimising counts that as a success.
tags:
  - applied-ai
  - caching
  - system-design
draft: false
---

A while back I wrote a semantic cache for language model calls and put it out as a library. It is still public: [vector-cache](https://github.com/shivendrasoni/vector-cache). Embedding model, cache storage, vector store, cache manager and similarity evaluator all sit behind interfaces, and it works with Redis, Qdrant, ChromaDB, pgvector or Pinecone underneath.

This post is about one line in it. The default similarity threshold is 0.99.

That number is the whole argument. A threshold of 0.99 on cosine similarity means the cache will almost never hit. For a caching library, whose entire reason to exist is hitting, that looks like a bad default, and I would set it the same way again.

## What a semantic cache actually is

An ordinary cache keys on bytes. The query either matches the stored key or it does not, and when it matches, returning the stored value is correct by construction.

A semantic cache embeds the incoming query into a vector, searches for a stored query whose vector is close enough, and if it finds one, returns that stored query's answer. The key is no longer an identity, it is a judgement. And a judgement can be wrong in a way an identity cannot.

```mermaid The two paths through a semantic cache, with the failure the exact cache does not have. The third outcome is not an error state anywhere in the system: it returns a 200, it is fast, it is cheap, and it is wrong.
flowchart TD
  Q["Incoming query"] --> E["Embed"]
  E --> S{"Nearest stored query<br/>above threshold?"}
  S -->|"No"| MISS["Miss: call the model,<br/>store, return"]
  S -->|"Yes, genuinely the same question"| HIT["Hit: correct answer,<br/>cheap and fast"]
  S -->|"Yes, similar text,<br/>different question"| WRONG["Wrong hit: confident answer<br/>to a question nobody asked"]
  HIT --> M1["Counted as a hit"]
  WRONG --> M2["Also counted as a hit"]
  MISS --> M3["Counted as a miss"]
```

The diagram carries the point the prose keeps having to restate. There is no signal anywhere in that system that distinguishes the two right hand branches, and every metric you would naturally build treats them identically.

## Claim one: the threshold is a product decision, so the library must not make it

The cost of a wrong hit is not a property of the cache. It is a property of what sits downstream of it.

If the answer is a paraphrase of documentation and the user can see it is slightly off topic, a wrong hit is a mild annoyance. If the answer states a refund window, a dosage, a price, or an eligibility rule, a wrong hit is an incorrect statement made confidently by your product, delivered faster and more cheaply than the correct one would have been.

No library author knows which of those you are building. So the default has to be the one that is safe in the second case and merely disappointing in the first, which is a threshold so high that the cache behaves almost like an exact matcher and only fires on near identical phrasings. The user who wants hit rate can lower it deliberately, and in lowering it, has made a decision and knows they made it.

The opposite call, and where I would make it. If the cache sits in front of a non user facing path, a classifier, a tagger, an internal enrichment step whose output is checked by something else downstream, then the calculus reverses and I would start lower and tune up on observed errors. Same for a corpus of genuinely templated queries, where the variation between user phrasings is real but the underlying intent space is tiny. The rule I would hold to is not a number, it is a question: if this cache returns the wrong answer, who finds out, and how long does it take.

## Claim two: embedding distance measures paraphrase, not answer equivalence

This is the technical heart of it and it is why no threshold is entirely safe.

Cosine similarity between embedded questions measures how alike the questions are as text. What you need to know is whether they have the same answer. Those correlate well, which is why the technique works at all, and they come apart in exactly the places that matter most.

Negation is the clearest example. "Can I cancel after the trial ends" and "Can I cancel before the trial ends" differ by one short word and sit extremely close in most embedding spaces, and they have opposite answers. Numerals behave the same way: two queries that differ only in a quantity or a date are near neighbours, and the quantity is usually the entire content of the question. Entity substitution too, where the only difference between two queries is which account, which product or which region, which is to say the only difference is everything.

So the queries most likely to produce a wrong hit are the ones with the highest similarity and the most consequential difference. That is not an edge case at the tail, it is a structural property of the method, and it means the mitigation cannot be "raise the threshold" alone. What it argues for is normalising or extracting the parts that carry the meaning before you embed, so that quantities, dates, entities and negations become part of the cache key rather than part of the fuzzy match. A hybrid key, exact on the extracted facts and semantic on the rest, is materially safer than a single similarity number and it is more work.

## Claim three: chasing a hit rate optimises the metric that cannot see the failure

The library has a feature I marked alpha and left off by default, behind a flag called `use_adjustable_threshold`. When it is on, the cache walks the similarity threshold toward a target hit rate, by default 0.8, in small steps, by default 0.01, bounded by a floor and a ceiling. The README warns beside it that a high threshold "can cause non-relevant matches to be returned" and that it "should be used with caution".

I think that feature is genuinely useful and I also think it is the most dangerous thing in the library, for a reason worth spelling out: the control loop has no error signal.

```mermaid The adaptive threshold as a control loop. The dotted edge is the one that does not exist: nothing in the loop observes whether a hit was correct, so the only feedback is hit rate, and a wrong hit raises it. The loop is measuring the thing it is breaking.
flowchart LR
  T["Similarity threshold"] --> C["Cache decides hit or miss"]
  C --> H["Observed hit rate"]
  H --> CMP{"Below target hit rate?"}
  CMP -->|"Yes"| LOWER["Lower the threshold<br/>by the adjustment rate"]
  CMP -->|"No"| HOLD["Hold"]
  LOWER --> T
  C -.->|"was the hit correct?<br/>no signal exists here"| T
```

A controller with a single input will drive that input wherever you tell it to go. Ask for 0.8 and it will find a threshold that produces 0.8, and the cheapest way to produce 0.8 is to accept looser matches. Every wrong hit it produces makes the number it is optimising look better. That is the failure and it is not a bug in the implementation, it is what optimising an unlabelled proxy does.

Which is why it is off by default and marked alpha, and why I would only turn it on with a correctness signal wired in: a sampled fraction of hits sent to the model anyway and compared against the cached answer, feeding a measured wrong hit rate into the loop as a hard ceiling. Without that, the safe way to use adaptive thresholding is as a suggestion engine that reports what threshold would hit your target, and then a human decides whether to accept it.

## Where I would not cache semantically at all

Three cases, and they are categorical rather than matters of tuning.

Anything whose answer depends on state the query does not contain. "What is my balance" is a perfect semantic match across every user in the system and the answer is different for every one of them. If personalised content can reach a shared cache, the cache is a data leak with good latency. The mitigation is to partition the cache space per tenant and per user, which destroys most of the hit rate you were hoping for, which is itself the finding: if the queries are personal, semantic caching was not the right tool.

Anything time sensitive, where the correct answer today is a wrong answer next week and nothing in the similarity calculation knows what week it is. Invalidation in a semantic cache is harder than in an exact one, because you cannot enumerate the keys that a changed document affects.

And anything where the model's output is itself the audit record. If somebody may later ask what the system told a user and why, an answer that was generated for a different question and replayed is a difficult thing to explain.

The general form, which is the sentence I would keep from all of this: an exact cache can only ever be stale, and a semantic cache can be wrong. Those need different amounts of fear.

## Sources

- [vector-cache](https://github.com/shivendrasoni/vector-cache), my own library. Source of the default `initial_similarity_threshold` of 0.99, the bounds of 0.7 and 1.99, the `target_hit_rate` default of 0.8, the `adjustment_rate` default of 0.01, the `use_adjustable_threshold` flag defaulting to off, and the alpha warning quoted above. It is a library, not a deployment, and it has not been touched in a long time.
- Yury Malkov and Dmitry Yashunin, [Efficient and robust approximate nearest neighbor search using Hierarchical Navigable Small World graphs](https://arxiv.org/abs/1603.09320), 2016. The index structure underneath most of the vector stores a semantic cache would sit on.
