---
title: The hard problem in agent memory is forgetting
slug: agent-memory-forgetting
date: 2026-10-02
description: Remembering is a library call. Deciding what a system should stop believing, and when, is the part nobody designs. A fact can stop being true in four different ways and each one needs a different mechanism, all of them on the write path, because the read path has none of the context needed to decide.
tags:
  - applied-ai
  - agents
  - system-design
draft: false
---

A user tells your assistant in March that the team has moved off its billing provider. In May they ask about invoices and the assistant answers confidently, in detail, about the provider they left. The user corrects it. It apologises. Next session it is back to the old provider again.

Read that again and notice what did not fail. Storage worked. The embedding worked. Retrieval found the most relevant thing in the store and handed it over. Every component did its job. The system was not bad at remembering, it was perfect at remembering, and that is exactly what was wrong with it. Nothing in it was ever going to decide that a fact it had been told was now dead.

This is the part that gets skipped. Remembering, in 2026, is close to a library call: pick a store, embed, search, paste the hits into the prompt. Forgetting has no library. There is no `forget()` in anyone's memory API that means what you actually need it to mean, which is "this was true, something happened, and it must stop influencing answers from now on." So people build the half that has an SDK and ship the other half as an open question, and the open question is the one users notice.

One line on a neighbour and then I will leave it alone: my post on [when retrieval is the wrong tool](/blog/rag-when-retrieval-is-wrong) is about fetching documents you did not write and do not control. This is the opposite situation. These are facts your own system chose to keep, about one person, which means you own the write and every property of that fact, including how long it gets to live, is a decision somebody made or avoided making.

## A fact can stop being true in four different ways

This is the distinction that the word "forgetting" hides, and it is the reason a single eviction policy never works. Four different things get called forgetting and each needs its own mechanism.

A fact can be **superseded**. The user moved, changed jobs, switched providers. There is a new fact and it contradicts the old one. The trigger is another fact arriving.

It can **expire**. Nothing contradicted it, it simply aged out. "I am debugging a deploy right now" was true for an hour. "She is on the growth team" was true for about a year. The trigger is time, and the clock rate is wildly different per fact.

It can be **scoped out**. It was never a fact about the person, it was a fact about one task, and the task ended. Most of what a per turn summariser writes is this: context that was load bearing for twenty minutes and is noise forever afterwards. The trigger is the end of the episode it belonged to.

It can be **withdrawn**. The user asks you to delete it, or a regulator does on their behalf. The [right to erasure](https://gdpr-info.eu/art-17-gdpr/) is not a ranking problem, it is a hard requirement with no "mostly" in it. The trigger is external and you do not get to argue with it.

A system that only implements one of these is not a memory system with a gap, it is a memory system that is confidently wrong in three different ways and only looks broken in one.

```mermaid Four ways a fact stops being true, the trigger that fires each one, and the only moment at which each can be decided cheaply. The right hand column is the point of the diagram: three of the four triggers arrive long after the write, which is precisely why the metadata they need has to be attached at the write. A system that implements only the supersede path, which is the common case, will still be serving expired and out of scope facts with full confidence.
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

## Only the write knows enough to set the clock

Here is the structural reason this ends up on the write path rather than somewhere more convenient.

At the moment a fact is written you have the turn in front of you. You can see whether the user stated a preference or thought out loud, whether a decision closed or stayed open, whether this is about the person or about the ticket they happen to be working. By the time anything is read, weeks later, in a different session, all of that is gone. The read path sees a row and a similarity score. Asking it to work out whether a fact has aged badly is asking it to reconstruct context that was thrown away at the write.

**My judgement: every fact gets a shelf life at write time, and the default is short rather than infinite.** Not because short is better, but because the default is the only one you will set honestly. If the default is infinite, nobody revisits it, and a store accumulates confident claims about a person's life that nobody has checked in a year. A short default forces the exception to be argued for, which means the long lived facts are the ones somebody actually thought about.

**The opposite call, and it is a real one.** If you are in a setting where the record itself is the product, or where you can be asked later what the system believed at a particular moment, never expire anything. Append with validity intervals and resolve at read time. You pay for it on every read forever, and you buy the ability to reconstruct a past state, which in a dispute is worth more than a cheap read.

The same logic puts ownership on the write. Scope every fact to a tenant and a person at the moment it is stored, so no read can reach across, and so a withdrawal request has one identifier to follow. Isolation enforced at read time is a filter that somebody eventually forgets in one code path.

## Writing less is the cheapest forgetting there is

The strongest forgetting mechanism available to you is not deleting things. It is not writing them.

A per turn summariser writes a near duplicate of the same handful of facts in slightly different words, every turn, forever. Within a few hundred turns the store holds dozens of fuzzy restatements, none of them wrong, all of them competing. Now the ranking problem you have is one you manufactured, and the forgetting problem is harder than it needed to be because there is no single row to supersede.

**My judgement: write on an explicit signal, not on every turn.** A preference stated, a decision closed, an identifier appearing, a tool call that succeeded with an argument the user supplied. The volume drops by an order of magnitude and every subsequent operation, ranking, correction, expiry, deletion, gets easier because there is less to reason about.

**The opposite call.** In long running support or sales, where a session spans days and the user never restates anything, a missed fact means a human picking up the thread from nothing. There, write every turn and pay the compaction cost. This is a judgement about which of the two mistakes hurts you more in your setting, not a best practice.

There is a second reason to write less, and it is the one that bites later. Every fact you store is a fact you may one day have to find and destroy. Provenance is cheap to attach at the write and almost impossible to reconstruct afterwards.

## A deleted fact has copies, and the copies are the bug

This is where most memory designs quietly fail, and it fails invisibly because the delete call returns success.

You remove the row from the memory store. Meanwhile the original transcript still has the sentence. The rolling conversation summary, generated a month ago, has the fact baked into a paragraph with no pointer back to the source. The prompt cache has it. Your analytics pipeline copied it. If any of that got into a fine tuning set, it is now in weights and there is nothing to delete at all. The user asked you to forget something and you forgot it in one of six places.

**My judgement: a fact is only forgettable if, at write time, you recorded where it came from and every derived copy carries that identifier.** Forgetting is a graph operation, not a row operation, and the graph has to be built on the way in.

**The opposite call.** If your retention story is genuinely simple, a single store, no derived summaries, nothing exported, then all of this is overhead and you should not pay it. Be honest about which one you are. Most teams believe they are the simple case because nobody has drawn the copies.

```mermaid One fact and the six places it ends up, with the single delete that most systems implement marked against the five copies it does not reach. The dashed path is the one that cannot be undone at all: anything that reached a training set is in weights, and no delete exists for it, which is the argument for never training on stored user memory in the first place.
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

## Seven questions that decide when a fact dies

The policy, compressed. If a write cannot answer these, it should not happen.

1. When does this stop being true?
2. What does it contradict today?
3. Does it belong to the person or the task?
4. Who else may ever read it?
5. Which turn did it come from?
6. Where will copies of it land?
7. Would it earn a slot next turn?

Question three is the one that quietly decides the size of your store. Question six is the one that decides whether you can honour a deletion request at all.

## What this comes down to

Memory is the most requested agent feature and the least designed one, and most of what is written about it is a tour of a vendor's API with store and search as the only verbs. Those two are the easy half. The decisions that make a system trustworthy over months are all decisions about ending things: what expires, what gets superseded, what belonged to a task that is over, what has to be destroyed and proven destroyed. None of those can be bolted on at read time, because by then the context that would have let you decide is gone. Build the forgetting first and the remembering is mostly a database.
