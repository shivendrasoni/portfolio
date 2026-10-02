---
title: Agent memory is a write path problem, not a read path problem
slug: agent-memory-write-path
date: 2026-10-02
description: Most memory bugs look like retrieval failures and are decided much earlier, at the moment a turn is summarised and stored. Memory is not additive, correction is the operation most designs never implement, and the binding constraint is the context budget at the start of the next turn rather than the size of the store.
tags:
  - applied-ai
  - agents
  - system-design
draft: false
---

A user tells your assistant in March that the team has moved off the old billing provider. In May they ask a question about invoices and the assistant answers confidently, in detail, about the provider they left. The user corrects it. It apologises. Next session it is back to the old provider again, because the correction was a message and the provider was a memory.

Everyone calls this a retrieval problem. The fix is assumed to be a better embedding, a bigger top k, a reranker. It is almost never any of those. The wrong fact was retrieved perfectly well. The system simply wrote something in March that it had no way to revise in May, and the quality of what came back in May was fixed at the moment it was written.

One line on a neighbour and then I will leave it alone: my post on [when retrieval is the wrong tool](/blog/rag-when-retrieval-is-wrong) is about fetching documents you did not write and do not control. This is the opposite situation. These are facts your own system chose to keep, about one user, which means you own the write and every property of that fact is a decision somebody made.

## The lossy step happens before anything is ever retrieved

The common shape is simple enough to draw in a sentence. A turn ends, a model summarises it, the summary goes into a store with an embedding, and at the start of the next turn you search that store and paste the hits into the prompt.

The summarisation is where the damage is done. A summariser is trained to produce something that reads well, and reading well means resolving ambiguity, dropping hedges and collapsing specifics into categories. "I think we are probably going to go with the Mumbai region, Rahul wants Singapore for latency but it is not decided" becomes "User plans to deploy in Mumbai". The tentativeness is gone, the disagreement is gone, Rahul is gone. Three weeks later the agent will be very sure about Mumbai, and the one piece of information that would have been worth keeping, that this was contested and open, cannot be recovered from the store because it was never in it.

**My judgement: write memory on an explicit signal, not on every turn.** A per turn write fills the store with restatements of the same handful of facts in slightly different words, and once it is full of near duplicates you have manufactured a retrieval problem that did not exist. An explicit signal can be a user stating a preference, a decision being made, an identifier or an account detail appearing, or a tool call succeeding with an argument the user supplied. The volume is a fraction of a per turn write and the hit quality is better, because what is in there is worth being in there.

**The opposite call, and it is not rare.** In a long running support or sales context where the session spans days, the user never restates anything, and the cost of missing a fact is a human picking up the thread from nothing, write every turn and pay the compaction cost. Your users will not announce which sentence mattered. If a missed fact is worse for you than a noisy store, keep everything and clean up later. That is a judgement about which of the two mistakes hurts you more, not a best practice.

```mermaid The write path drawn as a policy rather than as a pipeline, with four outcomes instead of one. Notice that the verbatim branch and the drop branch both exist for the same reason: a summarised version of either would be worse than the real thing, in opposite directions. Most implementations collapse all four of these into a single summarise and store step, which is why what comes back later is always a paraphrase.
flowchart TB
  T["Turn ends"] --> Q{"Did anything happen<br/>worth keeping?"}
  Q -->|"No signal:<br/>chat, clarification,<br/>restated context"| D["Drop.<br/>The transcript<br/>already has it"]
  Q -->|"Yes"| K{"Does the exact<br/>wording carry<br/>the meaning?"}
  K -->|"Preference, identifier,<br/>number, name, constraint"| V["Store VERBATIM,<br/>with the sentence<br/>it came from"]
  K -->|"A long episode:<br/>what was tried,<br/>what happened"| S["Summarise,<br/>keep a pointer<br/>to the transcript"]
  V --> C{"Does this contradict<br/>something already<br/>stored?"}
  S --> C
  C -->|"No"| W["Write as new,<br/>with source turn<br/>and a shelf life"]
  C -->|"Yes"| R["CORRECT: supersede<br/>the old fact, keep it<br/>readable, record why"]
  D --> X["Nothing written"]
```

## Memory is not additive, and that is the assumption that breaks

Almost every memory design treats the store as something that grows. New facts go in. Old facts stay. Nothing ever argues with anything else.

Users are not like that. People change their minds, change jobs, change tools, change their address, change what they want from you. A memory store that only appends will eventually hold two facts that cannot both be true, and when both are retrieved the model has no basis for preferring the newer one. Worse than no basis, actually: a stored memory reads as settled knowledge while the current message reads as one person talking, so the stale fact often wins the argument. The user then watches your system insist on something about their own life that they personally corrected six weeks ago.

**Correction is the missing operation.** Most designs implement write and search and call it memory. The operation that keeps a store honest over months is the one where a new fact looks for what it contradicts, marks it superseded with a timestamp and a reason, and leaves the old version readable rather than deleted. That costs a comparison at write time against the handful of facts the new one is near, which is a small search in a per user partition, not a global one.

**The opposite call.** If you are in a setting where the record itself is the product, or where you may be asked later what the system believed at a particular moment, never mutate. Append with validity intervals and resolve at read time instead. It is more work on every read forever, and it is the right trade when being able to reconstruct a past state matters more than a cheap read.

```mermaid The same two facts in an append only store and in a store with correction, followed from the write that caused the problem rather than from the answer that exposed it. The gap between turn 2 and turn 40 is the part that makes this hard to catch in testing: the write looks correct on the day, and the failure arrives weeks later in a different session, by which time it presents as a retrieval bug.
sequenceDiagram
  participant U as User
  participant W as Write path
  participant M as Memory store
  U->>W: Turn 2, March: "we are on Provider A"
  W->>M: write fact A, no shelf life
  U->>W: Turn 40, May: "we left Provider A in March"
  Note over W,M: APPEND ONLY: new fact written beside the old one.<br/>Both now retrievable, neither marked wrong.
  W->>M: write fact B
  M-->>U: Turn 41: answers with A, the better embedding match
  Note over W,M: WITH CORRECTION: the write searches for<br/>what B contradicts before storing it.
  W->>M: supersede A with B, keep A readable, record the turn
  M-->>U: Turn 41: answers with B, and can say when it changed
```

## The constraint is not storage, it is the next prompt

Memory gets designed as though the limit is how much you can keep. Storage is cheap, so the store is treated as unbounded and the hard question is deferred.

The real limit sits somewhere else. At the start of the next turn you have a context budget, it is fixed, and memory does not get it to itself. It is shared with the system prompt, the tool definitions, the retrieved documents, and the recent conversation, all of which have their own claim. Memory is competing for the smallest slice of that, and it loses, because the tool definitions cannot be trimmed and the recent turns cannot be dropped without the assistant losing the thread.

So the question that matters is not how many facts you can store about a user. It is which ones earn a place in a budget measured in a few hundred tokens, every single turn, forever. That reframes the write. If a fact will never be worth one of those slots, writing it was not free and it was not harmless either, because it is now a near duplicate competing with the facts that do deserve the space.

**My judgement: give memory a fixed token budget and make facts compete for it, rather than giving it a row limit.** A row limit tells you nothing about cost. A budget forces the ranking question at the moment it actually binds, and it makes the behaviour predictable across users whose stores differ wildly in size.

**The opposite call.** A small set of profile level facts, the user's name, their role, their language, their account tier, should be pinned and resident rather than ranked. They are tiny, they are almost always relevant, and letting them compete means they occasionally lose to something situational, which reads to the user as the system forgetting who they are.

## Shelf life belongs on the write, not the read

Facts decay at wildly different rates. A name is good for years. A job title is good for a year or two. "I am debugging a deploy right now" is good for an hour, and if it survives into next week it is not memory, it is a ghost.

The person best placed to say which of those applies is whoever is writing the fact, at the moment of writing, with the turn in front of them. The read path has none of that. So the shelf life goes on at write time and the read path filters by it. Memory that was written with no expiry is memory that will one day be confidently wrong at exactly the moment it matters, and it will look like a retrieval bug when it happens.

The same argument applies to isolation. Scope the write by tenant and by user, so there is no path by which a read can ever reach across. Isolation enforced at read is a filter somebody forgets in one code path.

## Seven questions before a turn writes anything

The policy, compressed. If a write cannot answer these, it should not happen.

1. Did anything change, or did the user restate?
2. Whose fact is this, exactly?
3. Does the exact wording carry the meaning?
4. What does this contradict in the store?
5. How long is this true for?
6. Which turn did it come from?
7. Would this earn a slot next turn?

Question seven is the one most designs never ask, and it is the only one that connects the write to the cost it creates.

## What this comes down to

Memory is the most requested agent feature and the least designed one, and most of what is published about it is a tour of a vendor's API with store and search as the only verbs. The interesting decisions all sit on the write: what gets kept word for word, what gets paraphrased and therefore lost, what gets dropped on purpose, what gets corrected, and how long any of it is allowed to stay true. Get those wrong and no amount of retrieval quality will save you, because the system will retrieve precisely what you asked it to keep.
