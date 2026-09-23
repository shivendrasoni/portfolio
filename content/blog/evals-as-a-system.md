---
title: Evals as a system, not a notebook
slug: evals-as-a-system
date: 2026-09-30
description: Most eval sets are assembled from examples somebody watched work, which makes them a record of what was already fine. And a release gate cannot catch the most likely cause of a regression, because that change happens on somebody else's deploy schedule.
tags:
  - applied-ai
  - testing
  - system-design
draft: false
---

Look at where the examples in your eval set came from. Not what they test, where they came from.

In most teams the answer is that somebody sat with the feature during development, found inputs that produced good output, and saved them. That is a reasonable thing to do and it produces a set with a specific and severe property: every case in it is a case that worked at the moment it was added. The suite is a record of the system's past successes, and it will go green on the day the system breaks in a way nobody had thought of yet.

That is the first thing to fix, and it is a data provenance problem rather than a tooling problem, which is why buying an eval platform does not solve it.

## Claim one: an eval set can only detect what its provenance allows

A set built from curated development examples detects regression on the happy path. A set built from production failures detects recurrence of known bugs. A set sampled from real traffic detects a shift in aggregate quality. Those are three different instruments and teams usually own one and believe they own all three.

The composition I would argue for is explicitly three pools kept separate, because mixing them destroys the signal from each:

| Pool | Built from | Detects | Run when |
| --- | --- | --- | --- |
| Contract | Hand written assertions on required behaviour | Structural breakage | Every commit, blocking |
| Regression | Every production failure that was ever fixed | Recurrence | Every commit, blocking |
| Quality | Sampled from real traffic, stratified by intent | Aggregate drift | Scheduled, reported not blocking |

The regression pool is the one with the best return and the worst maintenance story. Every bug you fix should leave behind a case, which means the pool grows monotonically and eventually becomes a list of hard, weird, unrepresentative inputs. That is fine for its job and dangerous if you start reading its score as a measure of quality, because a system can hold every historical bug case and still be worse at the ordinary thing users actually do.

The opposite call, since the failure is symmetrical. A quality pool sampled purely from production traffic under represents everything rare, and rare is where the reputational failures live. Stratify it by intent rather than sampling uniformly, and accept that the resulting score is not an estimate of average user experience, because it is deliberately not weighted like your traffic.

## Claim two: use a model judge for comparison, not for scoring

Using a strong model as a judge is the only way most teams can afford to evaluate open ended output, and it works better than intuition suggests. The MT Bench work found strong judges reaching over 80 percent agreement with human preferences, which is about the level of agreement humans reach with each other ([Zheng et al., 2023](https://arxiv.org/abs/2306.05685)).

The same paper documents the failure modes, and they are the reason to be careful about how you use it rather than whether: position bias, verbosity bias, self enhancement bias, and limited reasoning on tasks that need it.

Those biases have a practical shape. Position bias means the judge favours whichever answer it sees first, so any pairwise comparison must be run in both orders and the result discarded if it flips. Verbosity bias means a longer answer wins, so a change that makes your system more concise will look like a regression. Self enhancement bias means a judge prefers output from its own family, which matters most when you are choosing between providers and have picked one of them to referee.

The design consequence I would hold to: a judge is reliable for "is A better than B" and unreliable for "how good is A out of ten". Absolute scores drift between judge versions, cannot be compared across time, and give you a number precise enough to put in a slide and not meaningful enough to act on. Comparative evaluation against a pinned baseline output survives all of it, because both sides of the comparison move together.

The case for absolute scoring anyway: comparison requires storing baseline outputs for every case and regenerating them whenever the baseline legitimately changes, which is real infrastructure. If you are early and choosing between a coarse absolute score and no eval at all, take the score, and know that its level means nothing and only its direction is information.

## Claim three: do not block a release on an aggregate quality score

This is the position I would defend hardest and it is the opposite of what the tooling encourages.

An aggregate quality score is noisy. It moves with sampling, with judge nondeterminism, with the provider's own variance. Put a hard gate on a noisy metric and one of two things happens. Either the gate fires on noise, somebody re runs it until it passes, and within a month it is understood by everyone as an obstacle rather than a signal. Or the threshold gets lowered to whatever stops the false alarms, at which point it is below the level any real regression would breach.

What belongs in the blocking path is the deterministic contract layer: valid structured output on every case, the right tool called for unambiguous inputs, no content from the banned categories, refusal where refusal is required, latency and cost per request inside budget, and zero recurrences from the regression pool. Those are pass or fail, they do not drift, and a failure in any of them is unambiguous.

```mermaid The release path with the two eval classes separated by what they can prove. Blocking on the right hand column is the common mistake: a noisy score with a hard threshold is either ignored or lowered, and both outcomes remove the signal.
flowchart TD
  PR["Change proposed"] --> C1["Contract pool:<br/>structure, tools, safety, budget"]
  PR --> C2["Regression pool:<br/>every past production failure"]
  C1 -->|"Any failure"| BLOCK["Blocked. Deterministic, no re run"]
  C2 -->|"Any recurrence"| BLOCK
  C1 -->|"Pass"| Q["Quality pool:<br/>judged pairwise against pinned baseline"]
  C2 -->|"Pass"| Q
  Q --> REP["Reported on the pull request:<br/>win, loss, tie with confidence"]
  REP --> HUMAN{"Human reads the losses"}
  HUMAN -->|"Acceptable"| SHIP["Ship"]
  HUMAN -->|"Not acceptable"| BACK["Back to the change"]
```

Reporting wins, losses and ties with the actual losing outputs attached is more useful than a number, because the engineer can read the five cases that got worse and decide whether they care. A score cannot tell them that and a diff can.

## Claim four: your release gate cannot see the most likely regression

Everything above is attached to your deploy. The most probable cause of your system getting worse is not your deploy.

You are calling a model you do not control, whose weights, system level behaviour, safety filters and default parameters can change without your involvement and without a version string changing in your code. Pinning a version helps and versions are retired on the provider's schedule, not yours. The change arrives with no pull request, no diff and no notification you will necessarily read.

So the eval has to run on a clock as well as on a commit, against a frozen control set, with the results stored as a time series rather than as a pass or fail. The specific design detail that makes this work: the control set must be held completely constant, including the prompt, the parameters, the seed if you have one, and the sampled inputs. The moment somebody improves the prompt, the series breaks and you have lost the baseline that lets you attribute a change to the provider rather than to yourselves.

```mermaid Drift detection against a provider you do not control. The control set is deliberately frozen, including the prompt, which is what makes the attribution possible: if the only thing that did not change is yours, the change is theirs.
flowchart LR
  CLK["Scheduled run, no deploy needed"] --> FROZEN["Frozen control set:<br/>inputs, prompt, parameters"]
  FROZEN --> CALL["Provider call"]
  CALL --> CMP["Compare against stored<br/>reference outputs"]
  CMP --> TS["Time series per metric"]
  TS --> ALERT{"Step change<br/>outside historical variance?"}
  ALERT -->|"Yes"| PAGE["Investigate provider,<br/>not your last commit"]
  ALERT -->|"No"| OK["No action"]
  DEPLOY["Your deploys"] -.->|"do not touch the frozen set"| FROZEN
```

The uncomfortable corollary is that improving your prompt and detecting provider drift are in direct tension, and you cannot have both from one artefact. Two copies: a frozen one for attribution, and a live one you are free to improve. Cheap to run, easy to forget, and the only thing that will tell you the truth on the day the answers get worse and nobody on your team changed anything.

An eval suite is not a test suite that happens to be probabilistic. It is a measurement system, and measurement systems need provenance, calibration, and a stated confidence interval before anyone is allowed to make a decision with them.

## Sources

- Lianmin Zheng et al., [Judging LLM as a Judge with MT Bench and Chatbot Arena](https://arxiv.org/abs/2306.05685), NeurIPS 2023 Datasets and Benchmarks Track. Source of the over 80 percent judge agreement with human preferences at the same level as human to human agreement, and of the position, verbosity and self enhancement biases.
