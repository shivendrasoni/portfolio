
## When a judge is the wrong tool

When the predicate is exactly decidable, it belongs in code. Numbers, dates, currency, identifiers, anything a comparison operator can settle. Cheaper, faster, and it cannot be talked round.

When being wrong is cheap, skip the check. Search suggestions, related reading, the second tab of results. A verdict in front of a low stakes guess is a cost with no matching benefit, and affordable is not free. The same holds in reverse: if a miss hurts more than a wrong answer does, the right design is a loose threshold and an easy way for a person to report a bad answer.

The one I would put on a wall is this. A judge rules only on the text you send it, so it cannot see freshness, authority or permission. It will not tell you the stored answer predates the policy change, that the source was a support ticket rather than the handbook, or that this user may not see this record. Ask anyway and you get a number that looks like an assurance, which quietly launders a stale entry into a verified one. Those three belong to expiry, provenance and an authorisation check, all plain engineering, and a judge in front of them is a distraction rather than a substitute. The nearest thing worth asking at write time is whether an answer is the kind of thing that goes stale, which is a question about the text and therefore answerable, and the pull request does ask it before storing. Whether a given entry has since gone stale is a different question, and no verdict model answers it.

## Scores order, verdicts admit

The reason this goes past caching is that most of our fuzzy machinery produces scores, and a score is an ordering rather than a decision. Retrieval ranks passages and passes the top few through, deduplication sorts pairs by similarity, a router picks the highest scoring branch, a cascade escalates below a line. Every one of those has an opinion about which candidate is best and none at all about whether the best candidate is good enough, and the line that converts one into the other is a number somebody picked once and nobody has revisited.

A verdict is the missing half: a gate rather than an ordering, with a reason attached and a third state for do not know. We did not leave gates out because ordering is better. We left them out because a gate meant a generation, and a generation per candidate is not a shortlist, it is the work itself. That is the constraint that moved this month, and it moved for gates specifically.

So the question stopped being whether you can afford to verify, and became what you verify, how you ask, what you do when the answer lands in the middle, and where you would be better off writing four lines of Python. Which model you buy is the least interesting decision on that list, and it is the one everyone is arguing about.

## Sources

- [vector-cache](https://github.com/shivendrasoni/vector-cache), my own library, MIT, and [pull request 6](https://github.com/shivendrasoni/vector-cache/pull/6), open at the time of writing. Source of the judge interface, the separate negation question, the uncertain band that is logged rather than discarded, the cacheability check on the write path and the counters.
- TypeSafe AI, [Introduction](https://docs.typesafe.ai/introduction) and [Models](https://docs.typesafe.ai/models). Source of the System One description, typed questions evaluated against one state inside a single request, and the price of $0.042 per million input tokens with output free. Prices and response times published there are the vendor's own and are not independently verified here.
- TypeSafe AI, [Jev 1.13 known weaknesses](https://docs.typesafe.ai/model-jaggedness/jev-1.13). Numeric precision, dates and negation, and the advice to keep arithmetic in code, which is the design reason for the plain code guards.
