# Understand Codebase

Use this when entering unfamiliar code or tracing how something works.

---

## Process

1. **Start from the user.** What action triggers this? Where does the request enter?
2. **Follow the data.** Input → validation → domain → storage → response → UI.
3. **Name the boundaries.** Where does data change shape? Where are the contracts?
4. **Find the conventions.** What patterns repeat? What's the local idiom?
5. **Identify the invariants.** What must always be true? What breaks if violated?

---

## Questions to Answer

- Where does this route/component/function live?
- What calls it? What does it call?
- What data does it need? Where does that come from?
- What can go wrong? How is that handled?
- What's the happy path? What's the sad path?

---

## Output

```
**Entry point:** [file:line]
**Data flow:** [A] → [B] → [C] → [D]
**Key files:**
- [file] — [what it does]
- [file] — [what it does]
**Conventions observed:**
- [pattern] — used for [purpose]
**Invariants:**
- [thing that must be true]
**Gaps found:**
- [missing handling, unclear ownership, etc.]
```

---

## Levels

**Surface:** What does this do? (5 min)
- Entry point, main files, happy path

**Working:** How do I change this safely? (15 min)
- Data flow, error handling, tests, conventions

**Deep:** How does this fit the system? (30+ min)
- Domain boundaries, invariants, why it's structured this way

State which level before starting.

---

## Done When

- You can explain it without looking at the code
- You know where you'd make a change
- You know what tests would break
