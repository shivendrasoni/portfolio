## Retrieval is a grounding mechanism, not a knowledge mechanism

This is the claim I would defend hardest, and it is the one that decides whether a project is worth starting.

Retrieval puts evidence in front of the model at answer time so the answer can be checked against something. That is grounding. It is not the same as the model knowing your domain. The distinction sounds academic until you look at the questions that arrive in production. @What is our refund window for annual plans@ is a lookup, and retrieval is exactly right for it. @How many of our contracts have a non standard refund window@ is not a lookup. It is an aggregation over the whole corpus, and there is no value of k that answers it, because the answer is not in any chunk. It is in all of them.

The seven failure points paper from Barnett and colleagues makes the same point from the field rather than from theory, and their conclusion is worth quoting in spirit: validating a RAG system is only feasible during operation, and robustness evolves rather than being designed in at the start ([Barnett et al., 2024](https://arxiv.org/abs/2401.05856)). Systems fail on the questions nobody wrote a test for, and aggregation questions are the first family nobody writes a test for.

So the honest triage looks like this. If the question is a lookup, retrieve. If the question is a computation over structured data, do not retrieve, run a query. A text to SQL call against your own database, or a plain function call, will beat any vector search on that class of question, and it will be auditable, which matters more than it sounds when finance asks where a number came from. If the question needs a traversal, the graph form earns its complexity, and only then.

```mermaid Retrieval triage. The branches that end without retrieval are the ones most teams never take, and the two on the right are cheaper to operate than any pipeline.
flowchart TD
  Q[@Incoming question@] --> A{@Is the answer a span of text that exists somewhere?@}
  A -->|No, it is a computation over records| SQL[@Query the system of record@]
  A -->|No, it needs a traversal of relationships| G[@Graph retrieval@]
  A -->|Yes| B{@Does the corpus fit in the context window?@}
  B -->|Yes| FULL[@Put the whole corpus in the prompt, cache it@]
  B -->|No| C{@Do queries contain exact strings: codes, names, versions?@}
  C -->|Yes| HY[@Hybrid: dense plus lexical@]
  C -->|No| D[@Dense retrieval@]
  HY --> RR{@Is precision at small k the constraint?@}
  D --> RR
  RR -->|Yes| RERANK[@Add a reranker, accept the latency@]
  RR -->|No| SHIP[@Ship it, measure recall, revisit@]
```

## Measure the retriever on its own or you will keep blaming the model

Most teams evaluate end to end: question in, answer graded. That measurement cannot separate a retriever that returned nothing useful from a model that ignored good evidence, so every regression gets attributed to the component people already suspect, which is the model.

The instrumentation I would insist on before any model upgrade is boring. Take a set of real questions from your own logs, not synthetic ones. Label the documents that actually answer them. Measure recall at the k you actually pass to the model. Then, separately, measure how often the model answers correctly when the right document is in context. Two numbers, two different repairs. Without them, a team can spend a quarter swapping models to fix a chunk size.

I would put the same instrument on the tail. The aggregate answer rate can look fine while a whole question shape fails, and a shape is what users notice, because a user who asks aggregation questions asks them all day.

## Where the standard pipeline deserves its reputation

The strongest version of the opposing case is not @retrieval always works@. It is this: retrieval is the only technique on the list that lets a non specialist team ship a grounded answer over private data in a week, with citations, without training anything, and with a repair path a support engineer can follow. Fine tuning cannot do that. Long context cannot do it once the corpus grows. A knowledge graph costs a modelling project before it answers a single question.

That is a real argument and it is why naive retrieval with a decent chunk strategy is the correct default for most products. My objection is not to the pipeline. It is to reaching for it on questions it structurally cannot answer, and then tuning it forever because the alternative would mean admitting the shape of the question was wrong.

## When fine tuning beats retrieval, and when it does not

Fine tuning teaches form: register, structure, the shape of a good answer in your domain, the refusal behaviour you want. Retrieval supplies facts that change. Teams reach for fine tuning to install knowledge, which is the one job it is worst at, because the facts go stale inside the weights and you cannot diff them.

The case where I would still fine tune first: a narrow, high volume task with a stable answer format, where latency and cost per call dominate and the knowledge barely moves. A classifier, a router, an extractor. Paying a retrieval round trip to decide which of six intents a message has is a design where somebody skipped the arithmetic.

Which is the same instinct as the rest of this piece. Retrieval is not free, it is a distributed system bolted to the front of a model, with its own consistency, its own staleness, its own failure modes and its own on call burden. It earns that cost when the question is a lookup over text that moves. When the question is a computation, a traversal, or a format, something cheaper and duller wins, and the team that reaches for the pipeline anyway will spend the next quarter tuning a retriever to answer a question no retriever can answer.

## Sources

- Anthropic, [Introducing Contextual Retrieval](https://www.anthropic.com/engineering/contextual-retrieval), 2024. Source of the 49 percent and 67 percent reductions in failed retrievals, and of the note that a knowledge base under roughly 200,000 tokens can go in the prompt.
- Barnett, Kurniawan, Thudumu, Brannelly and Abdelrazek, [Seven Failure Points When Engineering a Retrieval Augmented Generation System](https://arxiv.org/abs/2401.05856), 2024.
- Lewis et al., [Retrieval-Augmented Generation for Knowledge-Intensive NLP Tasks](https://arxiv.org/abs/2005.11401), NeurIPS 2020. The original formulation, worth reading for how narrow the original claim was.
- Liu et al., [Lost in the Middle: How Language Models Use Long Contexts](https://arxiv.org/abs/2307.03172), TACL 2023. Why the order of assembled context is a design decision, not a detail.
