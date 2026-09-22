---
title: The needle in a haystack test, and what long context did not fix
slug: needle-in-a-haystack-long-context
date: 2026-08-15
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
  T1["The test<br/>one needle, known to exist"] --> T2["Filler that never<br/>contradicts the needle"]
  T2 --> T3["Question reuses<br/>the needle's words"]
  T3 --> T4["Pass: repeat<br/>the sentence"]
  T4 --> CLAIM["Claimed capability<br/>the green chart"]
  P1["Production<br/>zero, one or many answers,<br/>existence unknown"] --> P2["Corpus holds v1 and v2<br/>of the same policy"]
  P2 --> P3["Question uses the<br/>customer's words"]
  P3 --> P4["Pass: right answer,<br/>right source, or a refusal"]
  P4 --> REAL["Observed capability<br/>the ticket queue"]
```

## The control that would embarrass a vendor

If I were grading a long context claim, I would ask for four things, and the useful ones are cheap.

Run the test at the claimed maximum length, not at a convenient fraction of it. Run it with needles that share no words with the question, which is NoLiMa's contribution and costs nothing but a rewrite of the needle set. Run it with several needles, where the correct answer requires all of them, which is RULER's multi needle variant. And run it with distractors: near duplicate passages that look like answers and are wrong.

That last one is the control almost nobody runs, and it is the one that matters most for a real corpus. It is also the one guaranteed to produce an ugly chart, which I take to be the actual reason it is rare rather than any technical obstacle.

## Your haystack contradicts itself, and the benchmark's does not

This is the claim I would defend hardest, and it is the gap between the test and every corpus I have worked with.

Benchmark filler is chosen to be irrelevant. Essays, books, synthetic text, anything that will not accidentally answer the question. That property is what makes the test clean, and no production corpus has it. A company knowledge base contains the 2023 refund policy and the 2025 refund policy. It contains a draft nobody deleted, a deck that summarised the policy incorrectly, and a support macro quoting a version that was superseded. There are four plausible needles and one correct one, and nothing in the document text says which is current.

The consequence is that the useful metric is not recall. It is precision under contradiction: when several passages match, how often does the system pick the authoritative one, and how often does it say that it found conflicting sources. A model at 99 percent needle recall can be wrong on most of that traffic, and it will be wrong confidently, because everything it retrieved genuinely looked like an answer.

The fix is not a model fix, which is why I care about the distinction. It is metadata: effective dates, document status, supersession links, ownership. Boring, and it is the actual product. I would rather ship a smaller, curated, version aware corpus against a mediocre model than the full document dump against the best model available, and that is a judgement rather than a measurement, so take it as one.

## Position is a property of your code, not of the model

The lost in the middle result is usually filed as a limitation. Read it again as an instruction: the beginning and the end of the context are the strong positions, and your application chooses what goes there.

Almost nobody chooses. The typical assembly step takes whatever the retriever returned, in score order or worse, in whatever order the database iterated, and concatenates it. That means the strongest evidence lands in the middle roughly as often as chance allows, and the fix is a comparison function, not a research project.

```mermaid Where the position of the evidence is actually decided. The model's context is the last box, and every decision that determines position happens in code you own.
sequenceDiagram
  participant App
  participant Ret as Retriever
  participant Asm as Context assembler
  participant LLM
  App->>Ret: query
  Ret-->>App: candidates with scores
  App->>Asm: candidates, system prompt, history
  Note over Asm: Decision 1: drop low scores, do not pad to fill the window
  Note over Asm: Decision 2: strongest evidence first and last, weakest in the middle
  Note over Asm: Decision 3: truncate oldest history, never the evidence
  Asm->>LLM: assembled context
  LLM-->>App: answer plus cited spans
  App->>App: verify each cited span exists in what was sent
```

The verification step at the end is the cheapest reliability win available in this whole area, and it is routinely skipped. Check that every span the model cites appears in the context you actually sent. If it does not, you have caught a fabrication with a string comparison rather than with an evaluation suite.

## The honest case for long context

The strongest version of the opposing argument is not that benchmarks are fine. It is that for many products the corpus is small, the questions are simple, and putting everything in the prompt removes an entire distributed system from the design. That is a serious engineering win, and prompt caching has made the cost argument much weaker than it was. If your whole corpus fits and your questions are lookups, the needle test is not a bad proxy for the thing you need, and building a retrieval pipeline to avoid a limitation you will never hit is its own kind of mistake.

What I object to is the inference chain that goes: green chart, therefore million token context, therefore no retrieval, therefore no evaluation. Each arrow in that chain drops a premise. The chart is a lexical retrieval test on a corpus that never contradicts itself, at a length nobody verified, in a position range the model handles best.

So the test to run before you trust the chart is your own, and it takes an afternoon. Fifty real questions from your logs. Your own corpus, including the stale documents, because those are in production whether or not they are in your eval. Measure how often the answer is right and cites the current source. That number is your capability. Everything else is somebody else's benchmark.

## Sources

- Modarressi et al., [NoLiMa: Long-Context Evaluation Beyond Literal Matching](https://arxiv.org/abs/2502.05167), ICML 2025. Source of the 13 models, the 11 dropping below half their short context baseline at 32,000 tokens, and the GPT-4o figures of 99.3 percent and 69.7 percent.
- Hsieh et al., [RULER: What's the Real Context Size of Your Long-Context Language Models?](https://arxiv.org/abs/2404.06654), COLM 2024. Source of the claim that only half of models claiming 32,000 tokens or more maintain satisfactory performance at that length.
- Liu et al., [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172), TACL 2023. Source of the position effect.
- Kamradt, [LLMTest_NeedleInAHaystack](https://github.com/gkamradt/LLMTest_NeedleInAHaystack), the original test implementation, worth reading to see how modest the original claim was.
