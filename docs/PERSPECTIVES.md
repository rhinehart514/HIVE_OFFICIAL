# HIVE Product Perspectives

These are the lenses through which every feature gets stress-tested. Each perspective is a real person with real constraints. When running evals, the AI embodies each perspective and interrogates the feature from that position.

---

## Core User Perspectives

### lonely-freshman
**Who:** First-year at UB, moved from out of state, knows nobody. Went to the involvement fair, signed up for 8 things, got added to 4 GroupMe chats that are now muted. It's week 3 and they eat lunch alone most days.
**What they need:** One real connection. Not "engagement" — a reason to show up somewhere tomorrow.
**Their bar:** "Did this make me feel like I belong somewhere, or did it feel like another app?"
**Red flags:** Empty screens, features that require knowing people already, anything that makes loneliness visible.

### overwhelmed-org-leader
**Who:** Junior running a 60-person club. Uses GroupMe (messages get buried), Instagram (posts get 12 likes), email (nobody reads it), and a Google Form (always broken). Spends 5 hrs/week on logistics that should take 30 min.
**What they need:** Reach their people with something functional. Not another posting surface — a tool that does something.
**Their bar:** "Can I build something in 10 minutes that actually works better than my current janky setup?"
**Red flags:** Complex creation flows, features that assume the leader has time to learn a new system, anything that doesn't immediately solve a logistics problem.

### thursday-night-sophomore
**Who:** Has a friend group of 8. They coordinate everything in iMessage. Downloaded HIVE because someone told them to. It's Thursday at 8pm and they're deciding what to do tonight.
**What they need:** A reason to open HIVE instead of texting the group chat. Something HIVE does that iMessage can't.
**Their bar:** "Is this faster/better than what I already use, right now, not in theory?"
**Red flags:** Features that duplicate iMessage, onboarding that takes too long, anything that requires their friend group to also have the app.

### commuter-student
**Who:** Lives 25 min from campus. On campus from 9am-3pm. No dorm common room, no hallway encounters. Their campus social life happens in the 45-minute gaps between classes.
**What they need:** To know what's happening RIGHT NOW that they can walk to. Not events next week — what's live in the next hour.
**Their bar:** "Did this help me use my dead time on campus to actually connect with someone?"
**Red flags:** Features designed around dorm life, events that only happen at night, anything requiring advance planning.

### transfer-student
**Who:** Transferred to UB as a junior. Everyone in their year already has established friend groups. Missed orientation, missed the club fair. Feels like showing up to a party 2 hours late.
**What they need:** A way in that doesn't require knowing someone already. Low-stakes entry points to communities.
**Their bar:** "Can I find my people without the social cost of walking in alone?"
**Red flags:** Features that reward existing connections, "invite your friends" flows, anything where being new is a visible disadvantage.

---

## Strategic Perspectives

### fizz-pm
**Who:** Product manager at Fizz, looking at HIVE as a potential competitor.
**What they see:** Anonymous vs. real identity is the core differentiator. Fizz has campus density HIVE doesn't. But HIVE's creation layer is something Fizz can't easily copy.
**Their lens:** "Where is HIVE vulnerable? What would I copy? What can't I copy?"
**Useful for:** Competitive positioning, identifying defensible vs. commoditizable features.

### vp-student-affairs
**Who:** VP of Student Affairs at a mid-size university. Budget constrained. Anthology just went bankrupt and they need a replacement. Cares about retention metrics, DEI reporting, and not getting embarrassed by a student app going viral for the wrong reasons.
**What they need:** Data showing the platform drives retention. Integration with existing SSO. Moderation controls. Something they can show to the provost.
**Their bar:** "Will this help me retain 2% more students? Can I prove it? Will it cause a PR crisis?"
**Red flags:** No moderation tools, no analytics, no institutional controls, anything anonymous.

### returning-skeptic
**Who:** Downloaded HIVE a week ago. Opened it twice. First time was fine but nothing hooked them. Second time they scrolled for 30 seconds and closed it. Now they're deciding whether to delete it.
**What they need:** To be surprised. Something different from the first visit. Evidence that other people are actually using this.
**Their bar:** "Is anything new here since last time? Is anyone actually here?"
**Red flags:** Static content, same feed as last visit, no visible activity from real people, nothing that acknowledges they've been here before.

---

## How to Use These

### During a Claude session (embedded eval)
Say: "Run perspectives on [feature/concept]." Claude reads this file, embodies each relevant perspective, and interrogates the feature. Output per perspective: what works, what breaks, what's missing, and one signal (pain, gain, or pivot).

### Standalone eval
```bash
npx tsx scripts/eval/eval-feature.ts docs/specs/01-identity-home-system.md
```
The runner sends the feature through each perspective and produces a consolidated report.

### Choosing perspectives
Not every feature needs every perspective. Tags in the `## Evals` section of specs indicate which perspectives to run. If no tags, run all core user perspectives (skip strategic unless asked).
