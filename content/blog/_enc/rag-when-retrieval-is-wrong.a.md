---
title: RAG, its types, and when retrieval is the wrong tool
slug: rag-when-retrieval-is-wrong
date: 2026-09-22
description: Most teams debug a retrieval problem as if it were a model problem. Retrieval grounds an answer, it does not give a model knowledge, and there is a class of question no retrieval strategy will ever answer.
tags:
  - applied-ai
  - rag
  - retrieval
draft: false
---

The ticket usually says @the model is hallucinating@. Sometimes it says @the model got dumber this week@. It almost never says @the paragraph that answers this question was split across a page break, so it now lives in two chunks and neither of them scores well against the query@.

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
  DOC[@Source documents@] --> CH[@Chunking<br/>answer split across chunks@]
  CH --> EMB[@Embedding<br/>domain terms out of distribution@]
  EMB --> IDX[(@Index<br/>stale or mixed model versions@)]
  Q[@User query@] --> QE[@Query rewrite<br/>pronouns and context lost@]
  QE --> IDX
  IDX --> TOPK[@Top k<br/>the recall ceiling is set here@]
  TOPK --> RR[@Rerank<br/>precision recovered, recall never is@]
  RR --> CTX[@Context assembly<br/>order and truncation@]
  CTX --> GEN[@Generation<br/>the only stage anyone watches@]
  GEN --> ANS[@Answer@]
```

Two things on that diagram are decisions rather than drawing. The recall ceiling is set at the top k step, so a reranker can improve precision and can never recover a document the retriever did not return. And query rewriting sits before the index, which is where most multi turn products lose the thread: the user says @what about the second one@, the retriever sees @what about the second one@, and no amount of reranking saves it.

## Agentic retrieval is a latency decision wearing a quality costume

The pitch for letting the model run its own searches is that it recovers from a bad first query. True, and it is presented as strictly better than one shot retrieval, which it is not. Each extra hop is another model call, another index round trip, and another chance to wander. One shot retrieval has a latency you can put in a contract. A loop has a distribution with a long tail, and the tail is where your p99 lives.

My rule of thumb, offered as judgement rather than as a measured result: if a human support agent would find the answer with one search, the system should too, and a loop there is paying interest on a query rewriting problem. Where I would take the loop is research shaped work, where the right query genuinely depends on what the first result said, and where a user is willing to wait because they asked for an investigation rather than a fact. Those two cases look similar in a demo and behave nothing alike under load.

