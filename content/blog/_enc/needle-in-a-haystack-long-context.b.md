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
