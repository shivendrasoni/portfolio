---
title: Tool calling, and why the model is the easy part
slug: tool-calling-interface-design
date: 2026-09-05
description: Most tool call failures are interface design failures wearing a reasoning failure's clothes. The error string you return is a prompt, the schema is a contract, and the retry you allow is a side effect you have already decided to perform twice.
tags:
  - applied-ai
  - system-design
  - tool-calling
draft: false
---

Here is an error string I have seen a hundred variations of, returned from a tool back into a model's context:

```json
{ "error": "Invalid request" }
```

A model that receives that has three options. Call the same tool again with the same arguments, call it again with different arguments chosen at random, or give up and tell the user something went wrong. It will usually pick the first, because nothing in the string told it what to change. Then the loop runs again, and the postmortem gets written up as the model being unreliable at tool use.

It is not a reasoning failure. It is a message from your system that contains no information, and the model is behaving reasonably given what it was told.

That is the argument of this post. The model is the part of a tool calling system you did not build and cannot debug, and it is rarely the part that is broken. Everything on your side of the boundary is ordinary interface design, and it is where the failures actually live.

## The loop, stated plainly

A tool calling system is a loop with four moving parts: the schema you advertise, the arguments the model produces, the validation you run before you execute anything, and the string you return when you refuse.

```mermaid The tool call loop, with the return path marked. The dotted edge is the one most implementations get wrong: a refusal that carries no repair information sends the model back to the same decision with the same inputs, which is a retry loop by construction.
flowchart TD
  M["Model produces a call"] --> V{"Schema and semantic validation"}
  V -->|"Valid"| E["Execute"]
  V -->|"Invalid"| R["Return an error to the model"]
  E --> OK["Result into context"]
  E -->|"Fails at the far end"| R
  R --> M
  R -.->|"'Invalid request'"| LOOP["Same inputs, same decision.<br/>Loop with no exit"]
  OK --> DONE["Model continues or answers"]
```

Three of those four parts are yours. The one that is not yours is the only one anybody talks about.

## Claim one: the error string is a prompt, so write it like one

Every string you return from a tool is appended to the model's context and conditions the next token it produces. That makes it a prompt, written under pressure, usually by whoever was closest to the exception handler.

A useful error tells the model three things: what was wrong, what the acceptable value looks like, and whether trying again could possibly help. `"error": "start_date must be ISO 8601 date, got 'next tuesday'. Resolve relative dates before calling."` is a repair instruction. `"Invalid request"` is noise that costs you a round trip and a token bill.

The opposite case, because there is one. If the failure is not repairable by the caller, do not describe it helpfully, because a helpful description invites an attempt. A payment that was declined by the issuer, a record the user is not entitled to see, a downstream service that is hard down. For those, the right return is terse, explicitly terminal, and says the retry is not available: `"error": "permission_denied", "retryable": false`. Detail there does not help the model, it gives it material to negotiate with, and I have watched models negotiate with an authorisation boundary for four turns.

## Claim two: validate in two layers, because the schema only checks one of them

JSON Schema, or whatever your provider calls it, checks shape. Types, enums, required fields, formats. That is worth having and it is not the layer where production breaks.

The layer that breaks is semantic: this user does not own that account, this date is in the past, this amount exceeds the limit, these two arguments are individually valid and jointly meaningless. Shape validation passes all of those, and then the tool executes and does something wrong, or the far end throws an exception that arrives back as a stack trace.

So I would run two validations and return different things from each. Shape failures go back to the model with the repair instruction, because the model can fix them. Semantic failures mostly do not go back to the model at all, they go back to the user or to a human, because the model cannot fix a permission it does not have.

The hard version of this claim: a large share of what teams call hallucinated arguments are arguments the schema permitted. If a field can hold a string, the model will eventually put a plausible string in it. Narrow the type until the wrong value is unrepresentable. Enums instead of free text, identifiers the model must have received from a previous tool result instead of ones it can construct, a single `reference` object instead of four loose fields that can disagree with each other.

```mermaid Two schemas for the same operation. The left one is valid JSON Schema and still admits a call that cannot be executed. The right one makes the failure unrepresentable, which removes the retry rather than improving it.
flowchart LR
  subgraph L["Permissive: retries live here"]
    L1["account: string"] --> L2["amount: number"]
    L2 --> L3["currency: string"]
    L3 --> L4["Model invents an account id.<br/>Shape valid, semantically wrong"]
  end
  subgraph R["Narrow: the failure cannot be expressed"]
    R1["account_ref: id from list_accounts"] --> R2["amount_minor: integer >= 1"]
    R2 --> R3["currency: enum INR, USD, EUR"]
    R3 --> R4["Invalid calls are rejected<br/>before they exist"]
  end
```

## Claim three: a retry is a side effect you have chosen to perform twice

The tool loop retries by default, and most tools are not idempotent. That combination is the actual production risk in tool calling, and it is almost never discussed alongside it, because the two topics live in different teams.

If a tool times out, the model does not know whether the work happened. Neither do you. If it then calls again, you have either a duplicate charge, a duplicate message, or a duplicate row, depending on what the tool does.

My judgement on where to put the effort: give every mutating tool an idempotency key generated by your orchestration layer, not by the model. If you let the model generate the key, it will generate a new one on the retry, because from its perspective it is making a new attempt. The key should be derived from the call site and the arguments, so the identical call arrives with the identical key, and the second execution returns the first execution's result.

And there is a class where retry should simply be off. Anything that spends money, sends an irreversible message, or is visible to a third party gets one attempt, and a timeout returns a terminal error with an instruction to check status rather than act. Slower and occasionally wrong in the safe direction beats fast and occasionally duplicated.

## What the standard treatment gets wrong about parallel calls

Parallel tool calls are presented as a latency optimisation, and they are, but they also turn a sequence into a set with no ordering guarantee. Two calls issued in the same turn can arrive at your system in either order and can interleave with each other's side effects.

The treatment that survives production is to decide per tool whether it may run in parallel at all, and default read only tools to yes and mutating tools to no. The benchmark evidence for how hard this space is exists: the Berkeley Function Calling Leaderboard added multi turn and multi step categories in V3 and moved to checking the state of the system after the calls ran, rather than pattern matching the arguments ([BFCL V3](https://gorilla.cs.berkeley.edu/blogs/13_bfcl_v3_multi_turn.html)). That change of method is the finding. The interesting question was never whether the model emitted well formed JSON, it is whether the world ended up in the right state.

Which is also the reason to instrument this at the state level rather than the call level. A dashboard of tool call success rates will tell you 98 percent, and the two percent is where the duplicate charges are.

The model will improve on its own schedule and without your involvement. The schema, the validation, the error strings and the retry policy will only improve if somebody treats them as an interface, which they are.

## Sources

- Berkeley Function Calling Leaderboard, [BFCL V3, multi turn and multi step function calling](https://gorilla.cs.berkeley.edu/blogs/13_bfcl_v3_multi_turn.html), 2024. Source of the multi turn category and of the shift to verifying system state after execution rather than matching arguments.
- Stripe, [Idempotent requests](https://docs.stripe.com/api/idempotent_requests). Source of the design pattern for keys generated by the caller and results replayed on retry.
