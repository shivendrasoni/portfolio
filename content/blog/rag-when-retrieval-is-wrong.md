---
title: RAG, its types, and when retrieval is the wrong tool
slug: rag-when-retrieval-is-wrong
date: 2026-07-17
description: Most teams debug a retrieval problem as if it were a model problem. Retrieval grounds an answer, it does not give a model knowledge, and there is a class of question no retrieval strategy will ever answer.
tags:
  - applied-ai
  - rag
  - retrieval
draft: false
---

The ticket usually says "the model is hallucinating". Sometimes it says "the model got dumber this week". It almost never says "the paragraph that answers this question was split across a page break, so it now lives in two chunks and neither of them scores well against the query".

That second sentence is the bug far more often than the first one is, and it is why the first thing I do with a retrieval complaint is stop looking at the model.

I have led conversational AI products running 10 to 15 million conversations a year, so my prior about where quality actually leaks in an applied AI system is a strong one. I have not run a document retrieval corpus at enterprise knowledge base size. Where a claim below rests on judgement rather than on something measured, the sentence says so.

## The types, stated quickly, because they are the commodity part

| Type | What it does | What it is good for |
| --- | --- | --- |
| Naive | Embed chunks, embed the query, take the nearest k | A first cut, and a lot of production traffic |
| Hybrid | Combine dense vectors with a lexical scorer such as BM25 | Exact strings: error codes, SKUs, names, version numbers |
| Reranked | Retrieve wide, then score candidates with a cross encoder | Precision at small k, when the context budget is tight |
| Graph | Retrieve over entities and relationships instead of text similarity | Questions that hop: this customer, their contracts, the clauses |
| Agentic | The model issues its own searches, reads, and searches again | Open ended research where the right query is not known upfront |

That table is the layer every RAG explainer has. It is correct, and it decides nothing. The decisions sit on either side of it.

## Chunking is the highest leverage choice in the pipeline and almost nobody treats it that way

The order teams work in is usually: pick a vector database, pick an embedding model, argue about which LLM, then accept whatever chunk size the framework example used. That is backwards. The chunk is the unit of retrieval. If the answer does not fit inside one chunk, no retriever can return the answer, and everything downstream is polish on a broken unit.

Anthropic published a measurement worth knowing here. Prefixing each chunk with a short generated description of where it sits in its document reduced failed retrievals by 49 percent, and by 67 percent when combined with reranking ([Anthropic, contextual retrieval](https://www.anthropic.com/engineering/contextual-retrieval)). Read that as a statement about chunking rather than about a clever trick. The gain came from putting back context that chunking had destroyed.

Now the opposite case, which matters more than the technique. If the corpus is small, do not build a retrieval pipeline at all. Anthropic's note in that same piece is that under roughly 200,000 tokens you can put the entire knowledge base in the prompt. A pipeline you never build has no chunking bug, no embedding version drift, no index to rebuild and no eval harness to keep alive. I would take the fat prompt every time until the corpus outgrows it, and I would treat the day it outgrows it as a real project rather than a config change.

```mermaid Where quality is lost in a retrieval pipeline. Failures compound left to right and get diagnosed right to left, which is why the model gets blamed for a chunking decision made months earlier.
flowchart TD
  DOC["Source documents"] --> CH["Chunking<br/>answer split across chunks"]
  CH --> EMB["Embedding<br/>domain terms out of distribution"]
  EMB --> IDX[("Index<br/>stale or mixed model versions")]
  Q["User query"] --> QE["Query rewrite<br/>pronouns and context lost"]
  QE --> IDX
  IDX --> TOPK["Top k<br/>the recall ceiling is set here"]
  TOPK --> RR["Rerank<br/>precision recovered, recall never is"]
  RR --> CTX["Context assembly<br/>order and truncation"]
  CTX --> GEN["Generation<br/>the only stage anyone watches"]
  GEN --> ANS["Answer"]
```

Two things on that diagram are decisions rather than drawing. The recall ceiling is set at the top k step, so a reranker can improve precision and can never recover a document the retriever did not return. And query rewriting sits before the index, which is where most multi turn products lose the thread: the user says "what about the second one", the retriever sees "what about the second one", and no amount of reranking saves it.

## Agentic retrieval is a latency decision wearing a quality costume

The pitch for letting the model run its own searches is that it recovers from a bad first query. True, and it is presented as strictly better than one shot retrieval, which it is not. Each extra hop is another model call, another index round trip, and another chance to wander. One shot retrieval has a latency you can put in a contract. A loop has a distribution with a long tail, and the tail is where your p99 lives.

My rule of thumb, offered as judgement rather than as a measured result: if a human support agent would find the answer with one search, the system should too, and a loop there is paying interest on a query rewriting problem. Where I would take the loop is research shaped work, where the right query genuinely depends on what the first result said, and where a user is willing to wait because they asked for an investigation rather than a fact. Those two cases look similar in a demo and behave nothing alike under load.

## Retrieval is a grounding mechanism, not a knowledge mechanism

This is the claim I would defend hardest, and it is the one that decides whether a project is worth starting.

Retrieval puts evidence in front of the model at answer time so the answer can be checked against something. That is grounding. It is not the same as the model knowing your domain. The distinction sounds academic until you look at the questions that arrive in production. "What is our refund window for annual plans" is a lookup, and retrieval is exactly right for it. "How many of our contracts have a non standard refund window" is not a lookup. It is an aggregation over the whole corpus, and there is no value of k that answers it, because the answer is not in any chunk. It is in all of them.

The seven failure points paper from Barnett and colleagues makes the same point from the field rather than from theory, and their conclusion is worth quoting in spirit: validating a RAG system is only feasible during operation, and robustness evolves rather than being designed in at the start ([Barnett et al., 2024](https://arxiv.org/abs/2401.05856)). Systems fail on the questions nobody wrote a test for, and aggregation questions are the first family nobody writes a test for.

So the honest triage looks like this. If the question is a lookup, retrieve. If the question is a computation over structured data, do not retrieve, run a query. A text to SQL call against your own database, or a plain function call, will beat any vector search on that class of question, and it will be auditable, which matters more than it sounds when finance asks where a number came from. If the question needs a traversal, the graph form earns its complexity, and only then.

```mermaid Retrieval triage. The branches that end without retrieval are the ones most teams never take, and the two on the right are cheaper to operate than any pipeline.
flowchart TD
  Q["Incoming question"] --> A{"Is the answer a span of text that exists somewhere?"}
  A -->|No, it is a computation over records| SQL["Query the system of record"]
  A -->|No, it needs a traversal of relationships| G["Graph retrieval"]
  A -->|Yes| B{"Does the corpus fit in the context window?"}
  B -->|Yes| FULL["Put the whole corpus in the prompt, cache it"]
  B -->|No| C{"Do queries contain exact strings: codes, names, versions?"}
  C -->|Yes| HY["Hybrid: dense plus lexical"]
  C -->|No| D["Dense retrieval"]
  HY --> RR{"Is precision at small k the constraint?"}
  D --> RR
  RR -->|Yes| RERANK["Add a reranker, accept the latency"]
  RR -->|No| SHIP["Ship it, measure recall, revisit"]
```

## Measure the retriever on its own or you will keep blaming the model

Most teams evaluate end to end: question in, answer graded. That measurement cannot separate a retriever that returned nothing useful from a model that ignored good evidence, so every regression gets attributed to the component people already suspect, which is the model.

The instrumentation I would insist on before any model upgrade is boring. Take a set of real questions from your own logs, not synthetic ones. Label the documents that actually answer them. Measure recall at the k you actually pass to the model. Then, separately, measure how often the model answers correctly when the right document is in context. Two numbers, two different repairs. Without them, a team can spend a quarter swapping models to fix a chunk size.

I would put the same instrument on the tail. The aggregate answer rate can look fine while a whole question shape fails, and a shape is what users notice, because a user who asks aggregation questions asks them all day.

## Where the standard pipeline deserves its reputation

The strongest version of the opposing case is not "retrieval always works". It is this: retrieval is the only technique on the list that lets a non specialist team ship a grounded answer over private data in a week, with citations, without training anything, and with a repair path a support engineer can follow. Fine tuning cannot do that. Long context cannot do it once the corpus grows. A knowledge graph costs a modelling project before it answers a single question.

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
