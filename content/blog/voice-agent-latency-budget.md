---
title: Design a real time voice agent, and where the latency actually goes
slug: voice-agent-latency-budget
date: 2026-09-02
description: The model call is the part everyone optimises and it is rarely the largest term in the budget. Most of the delay a caller feels is spent deciding that they have finished speaking, and that decision is a product choice wearing a threshold's clothes.
tags:
  - system-design
  - applied-ai
  - voice
  - latency
draft: false
---

Put a stopwatch on one turn of a phone call with a voice agent. Not the whole call, one turn: the caller stops talking, and some number of milliseconds later they hear the first syllable come back. That single number is what people mean when they say an agent feels alive or feels like a machine, and almost every engineering conversation about it is aimed at the wrong part of it.

The usual conversation is about the model. Smaller model, faster provider, fewer output tokens, streaming enabled. All of that is real and none of it is usually the largest term. In a pipeline built out of speech recognition, a language model and speech synthesis, the biggest single contributor to perceived delay is normally the decision that the human has finished their sentence.

I have worked on systems carrying multiple million voice minutes per month, and this post is the design I would argue for, reasoned from the structure of the pipeline rather than from any one deployment. No vendor is named because the argument does not depend on one.

## The budget, stated properly

The only budget that matters runs from the end of user speech to first audio out. Not to last audio, not to the end of the model response, and not from the start of your handler. If your dashboard measures from the moment your code receives a final transcript, it is measuring the second half of a race and reporting the winner.

Written as a sum, the turn is roughly: endpoint detection, plus final transcript, plus whatever your own logic does before the model call, plus model time to first useful token, plus synthesis time to first audio chunk, plus network and jitter buffer on the way back.

```mermaid Turn budget from end of user speech to first audio out. The stages are ordered by when they happen, not by how much attention they normally get. Shapes are the design target for a conversational agent on a good network, not measurements of any particular deployment.
flowchart LR
  U["User stops speaking"] --> EP["Endpoint decision<br/>silence threshold plus<br/>turn model"]
  EP --> ASR["Final transcript<br/>flush of the<br/>streaming recogniser"]
  ASR --> APP["Your logic<br/>retrieval, tool calls,<br/>state lookups"]
  APP --> LLM["Model, first useful token<br/>not last token"]
  LLM --> TTS["Synthesis, first audio chunk<br/>not full utterance"]
  TTS --> NET["Transport and jitter buffer"]
  NET --> A["First audio reaches the ear"]
  EP -.->|"typically the largest single term"| A
  APP -.->|"the term nobody budgets for"| A
```

Two things fall out of drawing it this way. The first is that endpointing sits in front of everything, so it is paid on every single turn and it cannot be hidden behind streaming. The second is that your own logic, the retrieval call and the two database lookups and the tool invocation, is inside the budget even though it appears on nobody's latency slide.

## Claim one: turn detection is a product decision, not a threshold

The default way to decide a caller has finished is silence duration. Wait some number of milliseconds of non speech, declare the turn over, flush the transcript. Pick a short value and the agent interrupts people who pause to think. Pick a long value and the agent feels slow even when every downstream component is fast.

This is presented as a tuning parameter and it is not one. It is a decision about what kind of caller you are willing to be rude to. Short thresholds punish people who think out loud, people reading a number off a card, people speaking a second language, and older callers. Long thresholds punish the confident regular who wants to get through a menu in twenty seconds.

My judgement: do not set one global value, set it per expected utterance type, and let the dialogue state pick it. When you have just asked a yes or no question, you can be aggressive, because the space of valid answers is tiny and a wrong cut is cheap to recover from. When you have asked for a card number, an address or a date of birth, wait longer on purpose and accept sounding slower, because cutting somebody off mid number costs a full re-ask and the re-ask costs more than the wait you saved.

The case for the opposite call: if your product is a high volume front door where most turns are one or two words and the cost of a wrong cut is a single retry, a single aggressive global threshold is simpler, cheaper to reason about, and better. Complexity in turn handling has to earn its place, because it is the hardest part of the stack to debug after the fact.

Semantic turn detection, where a small model judges whether the utterance is syntactically and pragmatically complete, is the better version of this. It is also another inference call in the hottest part of the path, which is exactly where you cannot afford a slow one.

## Claim two: chasing human turn gaps is the wrong target

The research on human conversation is consistent and it is quoted a lot in this space. Gaps between turns in natural conversation average around 200 milliseconds, while the production system needs 600 milliseconds and up simply to encode a word, which is why the field concludes that speakers must be predicting the end of your sentence and preparing their reply before you finish it ([Levinson and Torreira, Frontiers in Psychology, 2015](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00731/full)).

The usual way that gets used is as a target: get under 200 milliseconds and the agent sounds human. I think that reads the finding backwards. Humans hit 200 milliseconds by predicting, not by being fast, and your pipeline cannot predict because it will not commit to a response until it knows what was said.

What I would target instead is variance. A system that answers in a consistent 700 milliseconds on every turn is experienced as a calm speaker. A system that averages 500 but goes to 2,500 whenever a retrieval call is slow is experienced as broken, because the caller has already started talking again by then and now both parties are speaking. So the number to put on the wall is the p95 of time to first audio, and the thing to engineer is the tail: timeouts on every dependency in the path, a cheap fallback phrase when a dependency misses its slot, and no unbounded work between transcript and model call.

## Claim three: barge in is a state problem, and the state that rots is what the user actually heard

Barge in, letting the caller interrupt, is usually specified as an audio feature: detect speech while we are talking, stop playback. Stopping playback is the easy half.

The hard half is that the model's conversation history now contains a message that was never fully delivered. You generated three sentences, the caller cut you off after four words, and unless you truncate the assistant turn to what was actually spoken before the interruption, the model proceeds on the assumption that the caller heard all three sentences. Every subsequent reference to that content is wrong, and the failure presents as the model being confused rather than as a bookkeeping bug, which is why it survives for months.

So the assumption that does not survive production is that the transcript you sent equals the conversation that happened. On an interrupted turn those are different documents, and the one that counts is the audio that left the speaker.

```mermaid A barge in, with the two pieces of state that must be corrected. Cancelling playback is the visible half. Truncating the assistant turn to the audio that was actually delivered is the half that quietly corrupts the conversation when it is skipped.
sequenceDiagram
  participant C as Caller
  participant V as Voice gateway
  participant S as Synthesis
  participant M as Model session
  M->>S: Three sentence response
  S->>V: Audio chunks
  V->>C: Playback begins
  C->>V: Speech detected during playback
  V->>S: Cancel synthesis
  V->>V: Stop playback, record<br/>delivered audio offset
  V->>M: Truncate assistant turn to<br/>delivered text only
  C->>V: Interrupting utterance
  V->>M: Append user turn
  Note over V,M: If the truncation step is skipped, the model<br/>believes content the caller never heard
```

## What the standard answer gets right

The steel man for optimising the model call is straightforward: it is the only stage where a single decision can remove hundreds of milliseconds at once, and the whole path is serial, so it is a legitimate place to start. If your agent takes four seconds to answer, it is not endpointing, it is something gross and the model call is a good first suspect.

The argument here is about what happens after that. Once the obvious fat is gone and you are in the range where the product feels almost right, further model optimisation buys you very little and turn handling buys you everything, because that is where the remaining time and all of the rudeness live.

Which is the thing I would write at the top of the design document. You are not building a fast pipeline, you are building a polite one. The caller does not have a stopwatch, they have a sense of whether they are being listened to, and that sense is set by when you decide they have stopped talking and by what you do when they decide you have.

## Sources

- Levinson and Torreira, [Timing in turn-taking and its implications for processing models of language](https://www.frontiersin.org/journals/psychology/articles/10.3389/fpsyg.2015.00731/full), Frontiers in Psychology, 2015. Source of the 200 millisecond average gap between turns and of the 600 millisecond and up production latency.
- Sacks, Schegloff and Jefferson, [A Simplest Systematics for the Organization of Turn-Taking for Conversation](https://www.jstor.org/stable/412243), Language, 1974. The original turn taking model the above builds on.
