# First Contact Protocol — HIVE User Testing

**Goal:** Watch 3 UB org leaders use HIVE for the first time. Grade every loop node with observed data. Find where people get stuck.

**When:** Before launch. This is the highest-information experiment available.

---

## Recruiting (5 min per person)

**Who:** UB student org leaders (e-board members, not general members)
**Where to find them:** UB Student Association office hours, CampusLabs org directory, personal network, SA Instagram DMs
**Ask:** "I built something for org leaders. Can you try it for 15 minutes while I watch? I want to see where it breaks."
**Don't say:** "It's an app builder" or explain what it does. Let them discover.

**Screen record:** Ask permission. Use QuickTime screen recording or Loom. Record their screen + audio.

---

## Session Script (15-20 min per person)

### Setup (2 min)
- Open HIVE on their laptop (not yours — test real device conditions)
- "I'm going to give you a URL and a scenario. Think out loud — tell me what you're thinking as you go. There are no wrong answers."
- Start recording

### Task 1: Land + Orient (3 min)
- "Go to [hive URL]. Tell me what you think this is."
- **Observe:** Do they understand what HIVE is within 10 seconds? What do they look at first? Do they scroll?
- **Note:** First words they say. Time to first click.

### Task 2: Create (5 min)
- "Your org has a meeting next week. You want to ask members what food to order. Use this to make that happen."
- **Observe:** Do they find Build? Do they type a prompt or click a template? How long until they have a working poll?
- **Note:** Time from task start to working poll. Where they get stuck. What they try that doesn't work.

### Task 3: Place + Share (3 min)
- "Now get that poll in front of your org members."
- **Observe:** Do they find placement? Do they understand Spaces? Do they try to share a link?
- **Note:** Do they expect to share via link, or place in a Space? Is the concept of "placing" intuitive?

### Task 4: Check Results (2 min)
- "Imagine 10 people voted. Where would you go to see results?"
- **Observe:** Do they go to profile? Space? The tool itself?
- **Note:** Where they expect impact data to live.

### Debrief (5 min)
1. "What was that?" (open-ended — what do they think they just used?)
2. "Would you use this instead of what you currently use? What do you currently use?"
3. "Did this feel like it was made for UB, or could it be any school?"
4. "What almost made you give up?"
5. "Would you come back tomorrow? Why / why not?"

---

## What to Record Per Session

Fill this out immediately after each session:

```
Participant: [name/pseudonym, org, role]
Date:
Device: [laptop model, browser]
Duration: [total time]

LOOP NODE GRADES (pass/stuck/fail):
- Install (find + create account):
- Setup (claim space or orient):
- FirstLoop (create → place → share):
- Value (got something they couldn't get elsewhere):

TIME MARKERS:
- Time to first click:
- Time to working poll:
- Time to placed in space:
- Time to "aha" moment (if any):

STUCK POINTS:
1.
2.
3.

QUOTES (verbatim):
- First reaction:
- On campus personality:
- On current workflow:
- On return:

CURRENT TOOLS THEY USE:
-

WOULD THEY SWITCH: yes / no / maybe
WHY:
```

---

## After All 3 Sessions

1. Update `.claude/plans/product-model.md` — replace code-analysis scores with observed grades
2. Update `~/.claude/knowledge/experiment-learnings.md` — add patterns from real usage
3. Grade predictions in `predictions.tsv` — especially H1 (campus copy), H4 (3 shells), H7 (path collapse)
4. Write the bug list — every stuck point, ordered by "how many people hit this"
5. Decide: ship as-is, fix top 3 bugs then ship, or rethink

---

## What This Isn't

- Not a survey. Don't send them a form.
- Not a demo. Don't show them how it works.
- Not a usability test with tasks on cards. It's a conversation while they use it.
- Not optional. The learning agenda has been stalled for 3 days because this hasn't happened.
