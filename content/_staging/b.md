
```mermaid The shape of one lookup. The state travels once and the questions are asked of it, so the bill tracks candidates rather than questions, and the rule that turns two probabilities into a decision lives in your code rather than in the model. Storing an answer runs its own separate verdict on the write path, so a cache with a judge has two call sites and not one.
flowchart LR
  S["State, sent once:<br/>the new question plus<br/>up to three stored candidates"]
  S --> Q1["Question one:<br/>would a correct answer to the<br/>stored question answer this one?"]
  S --> Q2["Question two:<br/>do the two differ by a<br/>negation or an exclusion?"]
  Q1 --> P1["Typed answer<br/>and a probability"]
  Q2 --> P2["Typed answer<br/>and a probability"]
  P1 --> C["Combined in your code"]
  P2 --> C
  C --> A["Accept: serve<br/>the stored answer"]
  C --> R["Reject: miss"]
  C --> U["Uncertain: miss,<br/>and written to a log"]
```

## Two questions and a veto, rather than one question with a caveat

The pull request asks each candidate a match question and, separately, a negation question, where a yes to the second cancels the first however confident it was. I described that split in the previous post as a mechanism. The reason to prefer it is worth arguing, and it is not really about negation.

A compound question returns one number for several ideas, so when it lands in the middle you are guessing which half moved, and a number you cannot attribute is a number you cannot calibrate. Two questions give you two series to watch separately, which is the difference between a component you can tune and one you can only replace. The other reason is that not all evidence should be averaged. A veto says one signal, when present, outranks everything else, and no weighting of a single score expresses that. Negation is the clearest instance here because it is the feature most likely to invert an answer while barely moving the distance between two vectors. Anywhere you can name a feature like that, it wants its own question and its own branch in code.

The opposite case: every question is a surface you maintain, and one that almost never changes the outcome is noise you pay attention tax on. I would read the counters after a while and delete any question that has not flipped a decision. The default is not many questions, it is one question per thing that can independently ruin the answer.

## Calibrating a judge you cannot benchmark

Here is the awkward part nobody writes down. You are about to gate your cache on a probability and you have no labelled pairs from your own traffic to pick the threshold with. Public benchmarks do not help, because what you need to know is how this model behaves on your users' phrasing, and nobody has that but you.

What you do have is a system already running and already wrong sometimes. So run the judge in shadow first: call it on hits you are serving anyway, record the verdict, change nothing about what the user gets. At the end of a traffic cycle you are holding a pile of disagreements between what you served and what the judge thought. That is your evaluation set, and reading a few hundred by hand is a morning's work that teaches you more about your own query distribution than a month of dashboards.

Then measure the right thing. Accuracy against a set built from the judge's own opinions is circular. What you can honestly count is the disagreement rate, and what those disagreements look like to a person reading them, in two piles: the judge rejected something you were serving, which is the case for turning it on, and the judge accepted something you would have missed, which is the case for widening the band. The pairs the judge itself calls uncertain belong in the same queue, because they sit where the thresholds are least sure, and throwing them away only means inventing a sampling strategy later to recover the same set.

Choose the two thresholds from the cost of the two mistakes rather than from a score. A miss costs one generation, which you can price exactly. A wrong answer costs whatever a confidently wrong answer costs in your product, nothing much on a recipe suggestion, a refund and an apology on an eligibility question. Those two numbers place the accept threshold better than any F score, and they are numbers a business person can give you.

Where I would break my own rule: if you already know wrong answers are reaching users, do not spend a week in shadow mode gathering evidence for something you have been told. Turn the judge on at a conservative accept threshold, take the hit rate loss, and calibrate while enforcing. Shadow mode is a discipline for systems that are not currently hurting anybody.

```mermaid Calibration when you have no labelled data. The shadow phase is the only period in which a wrong verdict costs nothing, which makes it the right place to try thresholds you would never ship. The review queue it feeds is small on purpose, because only disagreements and uncertain pairs reach it, so the labelling bill is set by how unsure the system is rather than by how much traffic it takes.
flowchart TD
  T["Live traffic, judge off"] --> H["Hits served on<br/>similarity alone"]
  H --> SH["Shadow: judge called,<br/>verdict recorded,<br/>response unchanged"]
  SH --> D{"Judge and threshold<br/>disagree?"}
  D -->|"No"| X["Discard: no information"]
  D -->|"Yes"| RQ["Review queue"]
  SH --> UN["Pairs in the<br/>uncertain band"]
  UN --> RQ
  RQ --> HR["Read by a person:<br/>a real save, or a lost hit?"]
  HR --> TH["Set accept and reject from<br/>the cost of each mistake"]
  TH --> EN["Enforce, judge on"]
  EN --> UN2["Uncertain pairs<br/>keep arriving"]
  UN2 --> RQ
```
