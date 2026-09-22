---
title: The needle in a haystack test, and what long context did not fix
slug: needle-in-a-haystack-long-context
date: 2026-09-22
description: A green needle chart means a model can find a sentence it has already seen the words of. Real corpora contradict themselves, real questions share no vocabulary with the answer, and both of those are missing from the test.
tags:
  - applied-ai
  - evaluation
  - long-context
draft: false
---

Somebody sends you the chart. Green almost everywhere, one corner slightly yellow, a million token context window along the bottom, and a caption saying the model achieves near perfect recall. The implied conclusion arrives with it: put everything in the prompt, retrieval is over.

The test behind that chart is simple enough to describe in a sentence. Take a long body of filler text, insert one sentence that answers a question, vary where you insert it and how much filler surrounds it, then ask the question and check whether the model repeats the sentence back. That is the needle in a haystack test, and it is a genuinely good smoke test. A model that fails it is not usable at length.

What it is not is evidence about your application, and three published results say why. I have not run these benchmarks myself. What I can tell you is which controls make a benchmark result worth acting on, and that is what the rest of this is.

## The test measures retrieval of a string you have already seen

The first crack is lexical. In the standard construction, the needle and the question share vocabulary, so the model can succeed by matching words rather than by understanding anything. Remove that overlap and the picture changes sharply.

The NoLiMa benchmark did exactly that: it built needles that require inferring a latent association instead of matching a literal string, and evaluated 13 models that all claim at least 128,000 tokens of context. At 32,000 tokens, 11 of them dropped below half of their own short context baseline. GPT-4o, one of the better performers, went from 99.3 percent at short length to 69.7 percent ([Modarressi et al., ICML 2025](https://arxiv.org/abs/2502.05167)).

The second crack is task complexity. RULER kept the needle idea but added variants with more needles, multi hop tracing, and aggregation. Its finding is the one to quote at anyone citing a context window as a capability: despite nearly perfect accuracy on the vanilla test, almost all models degrade as length grows, and although all of them claim 32,000 tokens or more, only half maintain satisfactory performance at 32,000 ([Hsieh et al., COLM 2024](https://arxiv.org/abs/2404.06654)).

The third crack is position, and it is the one you can actually do something about. Liu and colleagues showed performance is highest when the relevant information sits at the beginning or the end of the context and degrades significantly in the middle, including in models built for long context ([Lost in the Middle, TACL 2023](https://arxiv.org/abs/2307.03172)).

Those three results are usually read as a scoreboard. I would read them as a specification for the system you are building, which is a different activity.

```mermaid How the benchmark differs from a production query. Every box in the lower row is a divergence the score never sees, and the two on the right are the ones that generate support tickets.
flowchart TD
  T1[@The test<br/>one needle, known to exist@] --> T2[@Filler that never<br/>contradicts the needle@]
  T2 --> T3[@Question reuses<br/>the needle's words@]
  T3 --> T4[@Pass: repeat<br/>the sentence@]
  T4 --> CLAIM[@Claimed capability<br/>the green chart@]
  P1[@Production<br/>zero, one or many answers,<br/>existence unknown@] --> P2[@Corpus holds v1 and v2<br/>of the same policy@]
  P2 --> P3[@Question uses the<br/>customer's words@]
  P3 --> P4[@Pass: right answer,<br/>right source, or a refusal@]
  P4 --> REAL[@Observed capability<br/>the ticket queue@]
```

