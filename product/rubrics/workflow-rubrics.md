# Workflow Evaluation Rubrics

## How to use

Before implementing a feature, identify which workflow(s) it touches from `product/workflows.md`. For each affected workflow, evaluate the change against the rubric below.

## Rubric: Does this change improve the workflow?

### Recall (coverage)
Does the change cover the workflow requirements?

- [ ] Handles the happy path end-to-end
- [ ] Has a clear entry point (how does the user get here?)
- [ ] Has a clear exit point (where does the user go next?)
- [ ] Connects to the previous step in the loop
- [ ] Connects to the next step in the loop
- [ ] Works on mobile (44px touch targets, no hover-only interactions)
- [ ] Works at launch density (50 users, not 5000)

### Precision (avoiding harm)
Does the change avoid breaking trust or creating confusion?

- [ ] Does not introduce a dead end (every screen has a next action)
- [ ] Does not show empty states without guidance
- [ ] Does not require >500 users to feel useful
- [ ] Does not duplicate a step that already exists
- [ ] Does not add friction to an adjacent workflow step
- [ ] Error states have actionable recovery (not just "Something went wrong")
- [ ] Does not expose internal terminology to users ("tools" → "apps")

### Speed
Does the change maintain or improve workflow speed?

- [ ] Does not add a loading state that blocks the critical path
- [ ] Optimistic UI where possible (don't wait for server confirmation)
- [ ] Classification + shell preview: <3s total
- [ ] Page transitions: <500ms perceived
- [ ] API responses: <300ms p95 for critical paths

## Scoring

For each change, rate:
- **Recall**: X of 7 requirements covered
- **Precision**: X of 7 anti-patterns avoided
- **Speed**: Meets all latency targets? Yes/No

A change should score 6+ on Recall, 6+ on Precision, and Yes on Speed to ship.
