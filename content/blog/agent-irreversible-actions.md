---
title: Design an agent that is allowed to take an irreversible action
slug: agent-irreversible-actions
date: 2026-10-02
description: Two tool calls can look identical in a trace and differ completely in what happens if the agent was wrong. Reversibility is the property nothing in a tool schema records, approval decays into a rubber stamp under volume, and the ceiling that holds is the one written in code rather than in a prompt.
tags:
  - applied-ai
  - agents
  - system-design
draft: false
---

In a trace, `update_customer_record` and `send_customer_email` are the same event. A tool name, a JSON argument object, a round trip, a green tick. If the agent was wrong about the first one you fix the row and nobody ever knows. If it was wrong about the second one the message is in somebody's inbox, and everything available to you from that point is a new action rather than an undo.

Nothing in the tool schema records that difference. The model sees two functions with descriptions. The orchestrator sees two calls that returned 200. The distinction that decides whether a bad run costs an afternoon of cleanup or a phone call from a customer lives only in the head of whoever wrote the tool, and that is the gap.

The usual answer is "human in the loop", offered as though it settles the question. It does not, because an approval is not a control, it is a deferral of a control to somebody who is busy. Put the same dialog in front of a person fifty times in a day and by the end of the week they are not reading it, they are clearing it. I would treat approvals as the scarce resource in the design. The question is not whether a human approves, it is how few decisions you can put in front of one so that each one still gets genuinely read.

One line on a neighbouring problem and then I will leave it alone: my post on [guardrails and the false positives users notice](/blog/guardrails-false-positives-user-register) is about classifying language, where the two mistakes cost different amounts. Authority over actions is that same asymmetry with a different mechanism under it, and the mechanism is what follows.

## There are three kinds of action, and most designs see two

Reversible against irreversible is the wrong split. The useful one has three classes.

**Undo.** You restore the previous state yourself, with no second party involved and no evidence left behind. A row, a flag, a draft, a cache entry. It is cheap, it stays inside your own system, and it leaves nothing behind for anyone else to see.

**Compensate.** You cannot restore the previous state, but you can take a second action that leaves the world approximately where it started. A refund against a charge. A cancellation against a booking. A reversal entry against a ledger line.

**Final.** There is no second action that helps. An email that has been delivered. A message posted into a customer's WhatsApp thread. A webhook you fired at somebody else's system. A deletion where the backup window has closed. A payout to an external account.

The assumption that does not survive contact with production is that the second class is almost as safe as the first. It is not, because compensating actions do not compose. A refund is not the inverse of a charge, it is a second charge in the other direction, and it has its own latency, its own failure mode and its own visibility to the customer. Two compensations in a row can leave you in a state neither the original nor the target. And every compensation can itself fail, at which point you are holding a broken action with no further move, which is the same place the third class starts from.

So the honest way to read the middle class is as a final action with a discount, not as an undo with a delay. Design it that way and the gate you put in front of it stops looking excessive.

```mermaid The same call path with the reversibility class deciding the gate, and with what each layer can actually enforce written onto it. The model layer can only be asked, so every real limit sits below it. Note what happens before the compensable call rather than after: the handle that would reverse it is recorded first, because an undo you have to reconstruct after a failure is not an undo.
flowchart TB
  M["Model proposes a call:<br/>tool name plus arguments"]
  M -->|"a limit written in a prompt<br/>is a request, not a limit"| S
  subgraph GATE["Tool layer, enforced in code"]
    direction TB
    S["Scope check: is this tool<br/>granted to this run,<br/>this tenant, this user?"]
    S --> C{"Reversibility class<br/>declared on the tool"}
    C -->|"Undo"| U["Per run ceiling,<br/>execute, log after"]
    C -->|"Compensate"| P["Write the reversal handle<br/>first, then execute"]
    C -->|"Final"| F{"Blast radius budget<br/>for this run still open?"}
    F -->|"Yes"| E["Execute, spend<br/>the budget"]
    F -->|"No"| A["Queue one approval<br/>with the plan attached"]
  end
  U --> OUT["Provider, database<br/>or third party"]
  P --> OUT
  E --> OUT
  A --> H["Operator decides"]
  H -->|"Refused"| RET["Typed refusal returned<br/>into the model context"]
  H -->|"Approved"| OUT
```

## The ceiling belongs in the tool layer, not in the prompt

You can write "never refund more than one order per conversation" into a system prompt and it will hold most of the time, which is the problem, because a limit expressed in a prompt is a request made to a probabilistic process that is also reading the user's text, and a user's text is an input somebody else controls. A limit expressed in the tool wrapper is a limit, because the only way past it is a code change and a code review.

Concretely, the things I would refuse to leave in the prompt: which tools exist for this run at all, the per run and per tenant spend ceiling, the count ceiling on anything in the final class, and the identity the tool call executes as. Proposing the call is the model's job, and deciding whether it is allowed to happen is not. The [interface you hand the model](/blog/tool-calling-interface-design) is a separate design job from the authority behind it, and confusing the two is how a well described tool ends up with more power than the description implies.

The cost is real and worth naming. Enforcement in code makes your policy a deployable artifact, so every new tool needs a policy decision before it ships, and in a hurry that is friction you feel each time. I would still take it, because the alternative is a policy that holds only while nothing surprising appears in the context window.

## Gate on blast radius, not on action type

The obvious design is a list: these tools need approval, those do not. Easy to explain, easy to audit, and stale the moment somebody adds a tool, because the new one is not on the list and is therefore unguarded by default until it does something.

I would gate on blast radius instead. Blast radius is the property you actually care about, and it is computable at call time from three things: the class of the action, how many distinct entities it touches, and what it is worth in money or in customer contact. A run gets a budget of blast radius. Cheap reversible calls barely draw it down. One final action that touches a thousand customers exhausts it in a single call and the run stops and asks. That survives a new tool, because a tool that was never classified draws down the budget at the maximum rate rather than at zero.

The opposite call, and I would make it without hesitation in the right setting: in anything regulated or contractually constrained, gate on action type anyway, even knowing it goes stale. An auditor does not ask what your budget model was. They ask which actions required a named human approval and who gave it, and "our blast radius heuristic scored it below threshold" is not an answer that survives that room. In that setting the list is the deliverable, and the budget becomes a second control on top of it rather than a replacement for it.

## Approvals are a budget too, and it is smaller than you think

Alert fatigue is not a new discovery in software and it is not a character flaw, it is a measured property of people who are handed more warnings than attention. Medicine has the best numbers on it. In a 2014 observational study of 461 intensive care patients published in PLOS ONE, the physiologic monitors generated 2,558,760 alarms over a 31 day period, an audible alarm burden of 187 per bed per day, and of the arrhythmia alarms the researchers annotated by hand, 88.8 percent were false positives ([Drew et al, PLOS ONE, 2014](https://journals.plos.org/plosone/article?id=10.1371/journal.pone.0110274)). AHRQ's primer on [alert fatigue](https://psnet.ahrq.gov/primer/alert-fatigue), which cites that study, adds the part that transfers directly to our problem: clinicians override the large majority of computerised warnings, including the ones flagged as critical. These are people whose alerts are about patients, and the volume still wins.

An operator approving agent actions sits in the same place with lower stakes and therefore less resistance. So I would put a hard number on approvals per operator per day, set it low, and treat a breach as a design failure rather than a staffing problem. When the queue overflows, narrow what the agent may do unattended or widen the budget so the routine case stops asking. Hiring a second approver scales the rubber stamp.

The opposite case is real: for a small number of genuinely rare and genuinely expensive actions, a dedicated human gate with no volume behind it works exactly as intended, and adding a budget model on top only buys you a way to auto approve something that should always have been looked at. The rule is about volume, not about importance.

```mermaid One gate through one operator's day, drawn as it goes rather than measured. Nothing in the code changes between the first decision and the last. What changes is the time spent per item and the approval rate, and the audit log records the last approval and the first one identically, which is why an approval count is not evidence that anything was reviewed.
sequenceDiagram
  participant AG as Agent run
  participant Q as Approval queue
  participant OP as Operator
  AG->>Q: First final action, plan attached
  Q->>OP: One item
  OP-->>Q: Approved, plan read end to end
  Note over OP: Novel, so it gets attention
  AG->>Q: Same shape again, different customer
  Q->>OP: One item
  OP-->>Q: Approved, first line skimmed
  Note over OP: Recognised as a pattern
  AG->>Q: Batch of the same shape
  Q->>OP: Many items at once
  OP-->>Q: Approved as a batch
  Note over OP: The queue is now a chore
  AG->>Q: A different shape hides in the batch
  Q->>OP: Many items at once
  OP-->>Q: Approved as a batch
  Note over OP: Indistinguishable in the log<br/>from the first approval
```

## Plan first, execute second, and keep the plan

The pattern that does most of the work here is boring: the agent produces a complete plan of the calls it intends to make, the plan is checked against the budget as a whole, and only then does execution start. Not because the model plans well, but because a plan is inspectable and a stream of calls is not. A budget applied per call cannot see that eleven individually cheap calls add up to something nobody would have approved as one. A dry run mode earns its keep for the same reason: give every tool in the final class a second implementation that does everything except the irreversible part and returns what it would have done, and the plan stops being a guess about the shape of the world.

Then keep it. What I would write down before the call rather than after: the run identity, the plan at the moment of the decision, the version of the policy that evaluated it, the blast radius it drew, the class of every action in it, and the identity that approved it if a human did. After the call you record only the result. Before rather than after matters because the interesting failures are the ones where the call never returned and you do not know whether it happened.

Which leads to the retry, the place where agents collide with ordinary distributed systems harder than people expect. A timeout on a final action is not a failure, it is an unknown. Retrying it is a second irreversible action taken on the assumption that the first one did not land. Every final tool needs an idempotency key generated by the planner, not by the retry loop, for exactly the [reasons that make exactly once a story rather than a guarantee](/blog/idempotency-exactly-once-story). Without one, the safest looking component you own, the automatic retry, is the thing that sends the message twice.

## The questions I would ask before a tool gets granted

This is the design compressed into the eight questions that decide it. If a tool cannot be given a clear answer to each, it is not ready to be granted to an agent running without supervision.

1. Can we restore the previous state alone?
2. If not, what exact action compensates it?
3. Who sees this the instant it happens?
4. What is one wrong call worth?
5. What is one thousand wrong calls worth?
6. Which ceiling is enforced in code, not prompt?
7. What is written down before the call?
8. Who is paged when the gate refuses?

Four and five are deliberately separate. Most tools are obviously safe on the first and alarming on the second, and a design that only ever considers the single call is the design that discovers a loop at three in the morning.

## What this comes down to

An agent is not dangerous because it is clever, it is dangerous because somebody gave it credentials and a loop, and the outcome is settled in the unglamorous layer between the model and the world: what it may call, how much one run may spend, what gets written down first, and which small set of decisions is worth a person's attention. Most writing on agent safety is about model behaviour, and most of the risk sits in plumbing somebody designed in an afternoon while adding a tool. Classifying the action is the part worth the argument, because everything else hangs off which of the three classes a call belongs to, and that is a judgement a human makes once per tool and then lives with for years.
