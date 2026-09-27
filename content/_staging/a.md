---
title: Decision models as a judge for a semantic cache
slug: decision-models-as-a-judge-for-a-semantic-cache
date: 2026-09-27
description: Checking an answer is a smaller job than writing one, and software has never been able to use that asymmetry, because a verdict cost the same as a generation. Decision only models change that one price. What you ask for, how you calibrate it and when you skip it is the actual design work, and a semantic cache is the clearest place to do it.
tags:
  - applied-ai
  - caching
  - system-design
draft: false
---

Checking an answer is a smaller job than producing one. You can tell in a second that the parcel on your doorstep is not the thing you ordered, and it took a factory, a warehouse and a van to put it there. Software has never been able to use that asymmetry. The only component that could decide whether an answer fitted a question was the same component that wrote answers, at the same price, so checks got left out of designs that would obviously have been better with them. Not because nobody thought of them, but because a check cost about as much as the work it was checking.

Decision only models change that one price and nothing else. What I want to write about is what you do with a cheaper verdict: how to ask for one, how to tell whether it is any good when you have nothing to measure it against, and when not to ask at all. The worked example is a semantic cache, because that is the code I have in front of me.

## The setting, in one paragraph

A semantic cache stores answers and hands one back when a new question means the same thing as an old one, deciding "means the same thing" by the distance between two embeddings. Two questions differing by one negation or one number sit almost on top of each other in that geometry and have opposite answers, so the cache serves the answer to a question nobody asked, with a 200 and no error anywhere. I wrote one of these two years ago, [vector-cache](https://github.com/shivendrasoni/vector-cache), and put it down because the only fix I had was a second model call. Why the check belongs there is [the previous post](/blog/semantic-cache-missing-equality-check), and the failure itself is [semantic caching, and the day it serves the wrong answer](/blog/semantic-caching-wrong-answer). I have since [opened a pull request](https://github.com/shivendrasoni/vector-cache/pull/6) adding it as an option, and everything below came out of writing it. It is a library and an open pull request, so read it as design work and not as a result.

## What a judge will do, and what it will not

A decision only model does not write. You hand it a state and a list of typed questions, and it returns typed answers with probabilities, every question evaluated against that same state inside one request. TypeSafe calls the class [System One](https://docs.typesafe.ai/introduction) and put the first one, Jev, into early access on 15 September 2026, priced on their [model page](https://docs.typesafe.ai/models) at $0.042 per million input tokens with output free, which is the vendor's own figure and not something I have measured.

The property that matters is not the price. It is that a judge rules on what is in front of it and cannot supply what is not, so the question has to be answerable from the text you send. "Is this answer correct" is not, and a judge asked it still returns a confident number, which is the dangerous part: you get a shape that looks like a check and is actually a mood. "Would a correct answer to this stored question also answer this new one" is answerable, because both questions are in the request. The exception is a state that carries the ground truth, a policy paragraph, a price row, the record itself, and then correctness questions are fair, because that is the check a careful person would run with the same page open. The rule is not never ask about truth, it is never ask about anything you did not send.

The vendor publishes its weaknesses too. The [known weaknesses page for jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13) names numeric precision, dates and negation, and advises keeping arithmetic in code, which is why the pull request compares numbers in a regular expression before calling anything. What carries anywhere else is the habit: read the weakness page of the model you are about to hand a veto to, because it tells you where to put plain code.

## Writing a verdict question that gets the same answer twice

A judge is only useful if it is boring: the same pair, asked the same way, should come back the same way on Tuesday.

Ask one thing per question, because a question covering three ideas returns one number, and when it lands at 0.7 you cannot tell which of the three is wobbling. Type the output, because probabilities compare across runs while sentences do not, and a sentence invites you to read reassurance into it. Send the state once and ask several questions of it, because the billing unit is the request: another question about a state you have already sent is close to free, another candidate is not. That last one runs against the instinct generating models build in you, where a panel of narrow questions is the expensive option and here it is the cheap one.

The fourth habit is the one I would defend hardest. Make the question directional. Containment is not symmetry: a stored answer to a broad question often answers a narrower one, while the reverse is usually false, so "would a correct answer to the stored question also answer this one" is a better question than "do these two mean the same thing". Where I would not do it: queues where the query is closer to a command than a question, account and billing traffic being the obvious case, because there a difference in either direction matters and the symmetric question is the honest one.
