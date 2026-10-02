---
title: The hard problem in agent memory is forgetting
slug: agent-memory-forgetting
date: 2026-10-02
description: Remembering is four lines of code and a vector store. Deciding what a system should stop believing, and when, has no library, no API call and no default. That decision can only be made on the write path, and almost nobody makes it.
tags:
  - applied-ai
  - agents
  - system-design
draft: false
---

Memory is the feature every agent framework shipped this year, and in most of them it is four lines. Embed the turn. Write a row. Search on the next turn. Paste the top hits into the prompt. That code demos beautifully and it rots by about week six, and when it rots it is not retrieval that broke.

In March a user tells your assistant the team has moved off its billing provider. In May they ask about an invoice and get a confident, detailed answer about the provider they left. They correct it. It apologises. Next session, same wrong answer.

Nothing in that system failed. The write succeeded, the index searched, the ranker ranked, and the dead fact really was the most similar text in the store. The system was not bad at remembering. It was perfect at remembering, which is the whole problem. Remembering is a dependency you install. Forgetting is the part you have to design, and it is where the engineering is.

## `forget()` does not mean what you need it to mean

Every memory SDK has a delete. None of them has the operation the product actually needs, which is: this was true, something happened, it must stop influencing answers from now on, and so must everything derived from it.

Four unrelated things get called forgetting, and they share nothing except the word.

| | What happened | What fires it |
|---|---|---|
| **Superseded** | They switched providers, moved city, changed teams | Another fact arriving |
| **Expired** | Nothing contradicted it, it just aged out | A clock, and the rate differs per fact by orders of magnitude |
| **Out of scope** | It was never about the person, it was about one task | The task ending |
| **Withdrawn** | They asked you to delete it, or [Article 17](https://gdpr-info.eu/art-17-gdpr/) did on their behalf | Something outside your system, and you do not get to argue |

"I am debugging a deploy right now" has a shelf life of an hour. "She is on the growth team" has about a year. "Prefers metric units" has no expiry at all. One eviction policy cannot serve those three, and a store that implements only the supersede path, which is the common case, keeps serving the other three with full confidence.

```mermaid Four ways a fact stops being true, the trigger for each, and what each trigger needs to have been recorded earlier. The right hand column is the point: three of the four fire long after the write, at a moment when the information needed to act on them is already gone.
flowchart LR
  F["A stored fact"] --> S["SUPERSEDED<br/>a newer fact<br/>contradicts it"]
  F --> E["EXPIRED<br/>nothing contradicted it,<br/>it simply aged out"]
  F --> O["SCOPED OUT<br/>it belonged to a task,<br/>the task ended"]
  F --> X["WITHDRAWN<br/>the user or the law<br/>says remove it"]
  S --> S2["Needs: what it<br/>contradicts, searched<br/>at the next write"]
  E --> E2["Needs: a shelf life,<br/>set when written,<br/>different per fact type"]
  O --> O2["Needs: an owner,<br/>task or person,<br/>recorded at the write"]
  X --> X2["Needs: provenance,<br/>every copy reachable<br/>from one identifier"]
  S2 --> W["All four decided<br/>at WRITE time.<br/>The read path knows<br/>none of this"]
  E2 --> W
  O2 --> W
  X2 --> W
```

## The clock can only be set at the write

At the moment a fact is written you have the turn in front of you. You can see whether the user stated a preference or thought out loud, whether a decision closed, whether this is about the person or about the ticket they are working today. By the time anything is read, weeks later, in another session, all of that is gone. The read path sees a row and a similarity score and is being asked to reconstruct context that was thrown away.

Which means a memory write is not one field. It is closer to this:

```python
store.write(
    fact="Billing runs through Acme Pay",
    subject="user:4471",
    scope="person",                       # person, or task:8812
    valid_from=now,
    ttl=days(365),                        # short by default, long is an argued exception
    supersedes=contradictions(subject="user:4471", about="billing"),
    source_turn="conv:9f21#turn:14",
)
```

Four of those seven arguments exist for no reason other than to let the fact die cleanly later. None of them can be filled in afterwards.

Make the default shelf life short. Not because short is better, but because an infinite default is the one nobody ever revisits, and a year later the store is full of confident claims about a person's life that no one has checked. A short default forces the long lived facts to be argued for, which is the only way you find out which ones they are. If your product is the record itself, a case file, an audit trail, anything where you can be asked later what the system believed on a given Tuesday, do the reverse: expire nothing, append with validity intervals, resolve at read. That costs you on every read forever and buys the ability to reconstruct a past state, which in a dispute is worth more than a cheap read.

Scope goes on at the write too. A fact carries a tenant and a person from the moment it is stored, so no read can reach across and a withdrawal request has exactly one identifier to follow. Isolation applied at read time is a filter, and a filter is something one code path eventually forgets.

## Writing less is the cheapest forgetting available

The strongest forgetting mechanism is not deletion. It is not writing the thing.

A per turn summariser writes a near duplicate of the same handful of facts, in slightly different words, every turn, forever. A few hundred turns in, the store holds dozens of fuzzy restatements, none of them wrong, all of them competing, and no single row to supersede. That ranking problem was manufactured by your own write policy.

Write on a signal instead: a preference stated, a decision closed, an identifier given, a tool call that succeeded with an argument the user supplied. Volume drops by an order of magnitude and every operation downstream gets easier, because there is less to rank, less to correct and less to destroy. The exception is long running support and sales, where a session spans days and nobody restates anything; there a missed fact means a human starting from zero, so write every turn and pay the compaction cost. That is a judgement about which of two mistakes hurts more in your setting, not a best practice.

## The delete returns success and the fact is still there

This is the failure that stays invisible longest, because the API call comes back fine.

You delete the row. The raw transcript still contains the sentence. The rolling summary written last month has it baked into a paragraph with no pointer back to the source. The prompt cache has it. Analytics copied it. And if any of that was swept into a fine tuning set, it is in weights, where there is no delete at all. The user asked you to forget one thing and you forgot it in one of six places.

A fact is only forgettable if, at write time, you recorded where it came from and every derived copy carries that identifier. Forgetting is a graph operation. The graph has to be built on the way in, because nobody is reconstructing it from a transcript in six months.

```mermaid One fact and the six places it ends up, with the single delete most systems implement shown against the five copies it never reaches. The dashed path is the one with no remedy: anything that reached a training set is in weights, which is the argument for never training on stored user memory.
flowchart TB
  U["User states a fact"] --> T["Raw transcript"]
  U --> M["Memory store row"]
  T --> R["Rolling summary<br/>written last month"]
  M --> I["Vector index entry"]
  M --> P["Prompt cache<br/>and served answers"]
  T --> A["Analytics and logs"]
  R -.-> FT["Fine tuning set"]
  A -.-> FT
  D["delete(fact_id)"] --> M
  D --> I
  FT --> Z["In weights.<br/>No delete exists.<br/>Do not train<br/>on user memory"]
```

If your retention story is genuinely simple, one store, no derived summaries, nothing exported, none of this applies and you should not pay for it. Most teams believe they are that case because nobody has drawn the picture above for their own system.

## Seven questions that decide when a fact dies

The whole policy, compressed. A write that cannot answer these should not happen.

1. When does this stop being true?
2. What does it contradict today?
3. Does it belong to the person or the task?
4. Who else may ever read it?
5. Which turn did it come from?
6. Where will copies of it land?
7. Would it earn a slot next turn?

Three decides the size of your store. Six decides whether you can honour a deletion request at all. Seven is the one people skip, and it is the real constraint: the budget is not disk, it is the few hundred tokens a fact has to compete for on the next turn.

Memory is the most requested agent feature and the least designed one. Store and search are the easy half and they already have vendors. What makes a system trustworthy after six months is all the other half: what expires, what gets overwritten, what belonged to a task that is over, what has to be destroyed and proven destroyed. Build that first and the remembering is mostly a database.
