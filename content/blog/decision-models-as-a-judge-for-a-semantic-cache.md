---
title: Decision models as a judge for a semantic cache
slug: decision-models-as-a-judge-for-a-semantic-cache
date: 2026-09-27
description: Checking an answer is a smaller job than writing one, and software has never been able to use that asymmetry, because a verdict cost the same as a generation. Decision only models change that one price. What you ask for, how you calibrate it and when you skip it is the actual design work, and a semantic cache is the clearest place to do it.
tags:
  - applied-ai
  - caching
  - system-design
draft: false
---

Checking an answer is a smaller job than producing one. You can tell in a second that the parcel on your doorstep is not the thing you ordered, and it took a factory, a warehouse and a van to put it there. Software has never been able to use that asymmetry. The only component that could decide whether an answer fitted a question was the same component that wrote answers, at the same price, so checks got left out of designs that would obviously have been better with them. Not because nobody thought of them, but because a check cost about as much as the work it was checking.

Decision only models change that one price and nothing else. What I want to write about is what you do with a cheaper verdict: how to ask for one, how to tell whether it is any good when you have nothing to measure it against, and when not to ask at all. The worked example is a semantic cache, because that is the code I have in front of me.

## The setting, in one paragraph

A semantic cache stores answers and hands one back when a new question means the same thing as an old one, deciding "means the same thing" by the distance between two embeddings. Two questions differing by one negation or one number sit almost on top of each other in that geometry and have opposite answers, so the cache serves the answer to a question nobody asked, with a 200 and no error anywhere. I wrote one of these two years ago, [vector-cache](https://github.com/shivendrasoni/vector-cache), and put it down because the only fix I had was a second model call. Why the check belongs there is [the previous post](/blog/semantic-cache-missing-equality-check), and the failure itself is [semantic caching, and the day it serves the wrong answer](/blog/semantic-caching-wrong-answer). I have since [opened a pull request](https://github.com/shivendrasoni/vector-cache/pull/6) adding it as an option, and everything below came out of writing it. It is a library and an open pull request, so read it as design work and not as a result.

## What a judge will do, and what it will not

A decision only model does not write. You hand it a state and a list of typed questions, and it returns typed answers with probabilities, every question evaluated against that same state inside one request. TypeSafe calls the class [System One](https://docs.typesafe.ai/introduction) and put the first one, Jev, into early access on 15 September 2026, priced on their [model page](https://docs.typesafe.ai/models) at $0.042 per million input tokens with output free, which is the vendor's own figure and not something I have measured.

The property that matters is not the price. It is that a judge rules on what is in front of it and cannot supply what is not, so the question has to be answerable from the text you send. "Is this answer correct" is not, and a judge asked it still returns a confident number, which is the dangerous part: you get a shape that looks like a check and is actually a mood. "Would a correct answer to this stored question also answer this new one" is answerable, because both questions are in the request. The exception is a state that carries the ground truth, a policy paragraph, a price row, the record itself, and then correctness questions are fair, because that is the check a careful person would run with the same page open. The rule is not never ask about truth, it is never ask about anything you did not send.

The vendor publishes its weaknesses too. The [known weaknesses page for jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13) names numeric precision, dates and negation, and advises keeping arithmetic in code, which is why the pull request compares numbers in a regular expression before calling anything. What carries anywhere else is the habit: read the weakness page of the model you are about to hand a veto to, because it tells you where to put plain code.

## Writing a verdict question that gets the same answer twice

A judge is only useful if it is boring: the same pair, asked the same way, should come back the same way on Tuesday.

Ask one thing per question, because a question covering three ideas returns one number, and when it lands at 0.7 you cannot tell which of the three is wobbling. Type the output, because probabilities compare across runs while sentences do not, and a sentence invites you to read reassurance into it. Send the state once and ask several questions of it, because the billing unit is the request: another question about a state you have already sent is close to free, another candidate is not. That last one runs against the instinct generating models build in you, where a panel of narrow questions is the expensive option and here it is the cheap one.

The fourth habit is the one I would defend hardest. Make the question directional. Containment is not symmetry: a stored answer to a broad question often answers a narrower one, while the reverse is usually false, so "would a correct answer to the stored question also answer this one" is a better question than "do these two mean the same thing". Where I would not do it: queues where the query is closer to a command than a question, account and billing traffic being the obvious case, because there a difference in either direction matters and the symmetric question is the honest one.

```mermaid The shape of one lookup. The state travels once and the questions are asked of it, so the bill tracks candidates rather than questions, and the rule that turns two probabilities into a decision lives in your code rather than in the model. Storing an answer runs its own separate verdict on the write path, so a cache with a judge has two call sites and not one.
flowchart LR
  S["State, sent once:<br/>the new question plus<br/>up to three stored candidates"]
  S --> Q1["Question one:<br/>would a correct answer to the<br/>stored question answer this one?"]
  S --> Q2["Question two:<br/>do the two differ by a<br/>negation or an exclusion?"]
  Q1 --> P1["Typed answer<br/>and a probability"]
  Q2 --> P2["Typed answer<br/>and a probability"]
  P1 --> C["Combined in your code"]
  P2 --> C
  C --> A["Accept: serve<br/>the stored answer"]
  C --> R["Reject: miss"]
  C --> U["Uncertain: miss,<br/>and written to a log"]
```

## Two questions and a veto, rather than one question with a caveat

The pull request asks each candidate a match question and, separately, a negation question, where a yes to the second cancels the first however confident it was. I described that split in the previous post as a mechanism. The reason to prefer it is worth arguing, and it is not really about negation.

A compound question returns one number for several ideas, so when it lands in the middle you are guessing which half moved, and a number you cannot attribute is a number you cannot calibrate. Two questions give you two series to watch separately, which is the difference between a component you can tune and one you can only replace. The other reason is that not all evidence should be averaged. A veto says one signal, when present, outranks everything else, and no weighting of a single score expresses that. Negation is the clearest instance here because it is the feature most likely to invert an answer while barely moving the distance between two vectors. Anywhere you can name a feature like that, it wants its own question and its own branch in code.

The opposite case: every question is a surface you maintain, and one that almost never changes the outcome is noise you pay attention tax on. I would read the counters after a while and delete any question that has not flipped a decision. The default is not many questions, it is one question per thing that can independently ruin the answer.

## Calibrating a judge you cannot benchmark

Here is the awkward part nobody writes down. You are about to gate your cache on a probability and you have no labelled pairs from your own traffic to pick the threshold with. Public benchmarks do not help, because what you need to know is how this model behaves on your users' phrasing, and nobody has that but you.

What you do have is a system already running and already wrong sometimes. So run the judge in shadow first: call it on hits you are serving anyway, record the verdict, change nothing about what the user gets. At the end of a traffic cycle you are holding a pile of disagreements between what you served and what the judge thought. That is your evaluation set, and reading a few hundred by hand is a morning's work that teaches you more about your own query distribution than a month of dashboards.

Then measure the right thing. Accuracy against a set built from the judge's own opinions is circular. What you can honestly count is the disagreement rate, and what those disagreements look like to a person reading them, in two piles: the judge rejected something you were serving, which is the case for turning it on, and the judge accepted something you would have missed, which is the case for widening the band. The pairs the judge itself calls uncertain belong in the same queue, because they sit where the thresholds are least sure, and throwing them away only means inventing a sampling strategy later to recover the same set.

Choose the two thresholds from the cost of the two mistakes rather than from a score. A miss costs one generation, which you can price exactly. A wrong answer costs whatever a confidently wrong answer costs in your product, nothing much on a recipe suggestion, a refund and an apology on an eligibility question. Those two numbers place the accept threshold better than any F score, and they are numbers a business person can give you.

Where I would break my own rule: if you already know wrong answers are reaching users, do not spend a week in shadow mode gathering evidence for something you have been told. Turn the judge on at a conservative accept threshold, take the hit rate loss, and calibrate while enforcing. Shadow mode is a discipline for systems that are not currently hurting anybody.

```mermaid Calibration when you have no labelled data. The shadow phase is the only period in which a wrong verdict costs nothing, which makes it the right place to try thresholds you would never ship. The review queue it feeds is small on purpose, because only disagreements and uncertain pairs reach it, so the labelling bill is set by how unsure the system is rather than by how much traffic it takes.
flowchart TD
  T["Live traffic, judge off"] --> H["Hits served on<br/>similarity alone"]
  H --> SH["Shadow: judge called,<br/>verdict recorded,<br/>response unchanged"]
  SH --> D{"Judge and threshold<br/>disagree?"}
  D -->|"No"| X["Discard: no information"]
  D -->|"Yes"| RQ["Review queue"]
  SH --> UN["Pairs in the<br/>uncertain band"]
  UN --> RQ
  RQ --> HR["Read by a person:<br/>a real save, or a lost hit?"]
  HR --> TH["Set accept and reject from<br/>the cost of each mistake"]
  TH --> EN["Enforce, judge on"]
  EN --> UN2["Uncertain pairs<br/>keep arriving"]
  UN2 --> RQ
```

## When a judge is the wrong tool

When the predicate is exactly decidable, it belongs in code. Numbers, dates, currency, identifiers, anything a comparison operator can settle. Cheaper, faster, and it cannot be talked round.

When being wrong is cheap, skip the check. Search suggestions, related reading, the second tab of results. A verdict in front of a low stakes guess is a cost with no matching benefit, and affordable is not free. The same holds in reverse: if a miss hurts more than a wrong answer does, the right design is a loose threshold and an easy way for a person to report a bad answer.

The one I would put on a wall is this. A judge rules only on the text you send it, so it cannot see freshness, authority or permission. It will not tell you the stored answer predates the policy change, that the source was a support ticket rather than the handbook, or that this user may not see this record. Ask anyway and you get a number that looks like an assurance, which quietly launders a stale entry into a verified one. Those three belong to expiry, provenance and an authorisation check, all plain engineering, and a judge in front of them is a distraction rather than a substitute. The nearest thing worth asking at write time is whether an answer is the kind of thing that goes stale, which is a question about the text and therefore answerable, and the pull request does ask it before storing. Whether a given entry has since gone stale is a different question, and no verdict model answers it.

## Scores order, verdicts admit

The reason this goes past caching is that most of our fuzzy machinery produces scores, and a score is an ordering rather than a decision. Retrieval ranks passages and passes the top few through, deduplication sorts pairs by similarity, a router picks the highest scoring branch, a cascade escalates below a line. Every one of those has an opinion about which candidate is best and none at all about whether the best candidate is good enough, and the line that converts one into the other is a number somebody picked once and nobody has revisited.

A verdict is the missing half: a gate rather than an ordering, with a reason attached and a third state for do not know. We did not leave gates out because ordering is better. We left them out because a gate meant a generation, and a generation per candidate is not a shortlist, it is the work itself. That is the constraint that moved this month, and it moved for gates specifically.

So the question stopped being whether you can afford to verify, and became what you verify, how you ask, what you do when the answer lands in the middle, and where you would be better off writing four lines of Python. Which model you buy is the least interesting decision on that list, and it is the one everyone is arguing about.

## Sources

- [vector-cache](https://github.com/shivendrasoni/vector-cache), my own library, MIT, and [pull request 6](https://github.com/shivendrasoni/vector-cache/pull/6), open at the time of writing. Source of the judge interface, the separate negation question, the uncertain band that is logged rather than discarded, the cacheability check on the write path and the counters.
- TypeSafe AI, [Introduction](https://docs.typesafe.ai/introduction) and [Models](https://docs.typesafe.ai/models). Source of the System One description, typed questions evaluated against one state inside a single request, and the price of $0.042 per million input tokens with output free. Prices and response times published there are the vendor's own and are not independently verified here.
- TypeSafe AI, [Jev 1.13 known weaknesses](https://docs.typesafe.ai/model-jaggedness/jev-1.13). Numeric precision, dates and negation, and the advice to keep arithmetic in code, which is the design reason for the plain code guards.
