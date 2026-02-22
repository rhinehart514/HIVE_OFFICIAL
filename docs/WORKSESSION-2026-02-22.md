# Work Session — Feb 22 2026
## Product Strategy: Path to Launch

---

## The Reframe (most important thing)

**Old assumption:** HiveLab is a power-up for space leaders. Join an org, then get creation tools.

**New assumption:** HiveLab is the entry for *everyone*. Any student, any reason, 30 seconds, no org required. Community is what they discover after HiveLab already solved something for them.

The product hierarchy:
1. **Creation** — build anything, get a sharable link
2. **Discovery** — campus is alive, real events, real communities
3. **Community** — your org is already here, claim it, run it

This changes the first-session experience completely. New user shouldn't land at "here are spaces to join." They should land at "what do you want to make?"

---

## The Core Loop

```
Student discovers HIVE (shared /t/ link or word of mouth)
  → Signs up
    → Creates something (poll, RSVP, signup — 30 seconds)
      → Shares it anywhere (GroupMe, iMessage, Instagram)
        → People interact with it
          → Some sign up
            → They discover spaces + campus layer
              → Leaders claim spaces
                → Org runs from HIVE
                  → Creation record builds
                    → Leadership verification grows
```

The `/t/[toolId]` standalone link that works for anyone without login is the viral mechanism. It's already built. It needs to be the product's hero, not a footnote.

---

## System Priority (build in this order)

### 1. Creation — HiveLab
**Why first:** The differentiator. No other campus platform lets a student describe what they need and get a working tool in 30 seconds.

**What needs to happen:**
- CreatePromptBar is the first thing a new user sees — not below the fold
- Onboarding ends at "what do you want to make?" not "here are spaces to join"
- Lab Explore tab: how students discover what's possible before they know to ask
- AI generation (Groq) works and is fast

**Current state:** CreatePromptBar exists and is context-aware. AI generation (Groq) is wired. Lab page layout buries it.

**Gap:** Entry point isn't prominent enough. Explore tab doesn't exist yet.

---

### 2. Discovery — Events Feed
**Why second:** Cold start content. 2,772 real events from CampusLabs already in Firestore. The campus is alive before a single user does anything. This is what convinces someone to stay after they create their first tool.

**What needs to happen:**
- Events API fixed: images showing, space links working
- Space events fixed: returns 0 right now
- Feed shows all 3 card types: Event, Space, Tool (not just events)
- RightRail populated: upcoming events + trending spaces (already exists as empty slot)

**Current state:** Feed renders. Events API partially broken (images null, spaceHandle null). 371 events in next 7 days, 76% have images — content is good once API works.

**Gap:** 2 field mapping bugs + 1 date type bug. See KNOWN_STATE.md → Broken.

---

### 3. Distribution — Standalone Tools (`/t/[toolId]`)
**Why third:** The acquisition engine. Someone gets a HIVE poll in their GroupMe, votes on it, sees HIVE branding. That's the funnel. It costs nothing and compounds.

**What needs to happen:**
- `/t/[toolId]` page works beautifully for people who've never heard of HIVE
- Anonymous users can interact fully (vote, RSVP, sign up)
- Clear CTA: "Create your own free tool" + "See more from [Space] on HIVE"
- OG tags work for link previews in iMessage / Discord / GroupMe

**Current state:** `StandaloneToolClient.tsx` (379 lines) exists. Auth-optional. OG tags need audit.

**Gap:** Design pass needed. CTA wording. OG tag verification.

---

### 4. Community — Spaces
**Why fourth:** The retention layer. Once someone's made something and seen the feed, their org's space is what keeps them coming back.

**What needs to happen:**
- Space events sidebar works (fix date bug first)
- Space detail feels alive — events visible, tools deployed, not a ghost town
- Join flow smooth (it works, just needs validation)
- Claiming flow: "your club is already here" + "Claim This Space" prominent

**Current state:** 1,174 spaces pre-seeded, 0 claimed, 0 members. Browse + join works. Space events return 0 (bug).

**Gap:** Space events bug. Claiming flow UI (backend exists). Cold start appearance.

---

### 5. Identity — Profile
**Why fifth:** The lock-in flywheel. After a student has built tools and joined spaces, their profile should feel like a real campus portfolio — tools + usage + spaces + leadership record.

**What needs to happen:**
- Fix the black screen (unknown cause, must diagnose)
- Slim header: 48px avatar + name + handle + bio
- Stat row: Tools built, Total uses, Spaces
- ToolGrid: pinned top 2, rest sorted by usage
- Creation portfolio framing — not just "clubs you joined"

**Current state:** ProfilePageContent.tsx (731 lines) exists. Black screen on load. Portrait card with maroon gradient is wrong design.

**Gap:** Black screen diagnosis. Full profile rebuild per LAUNCH-IA.md System 4 spec.

---

### 6. Onboarding — First Session Bridge
**Why sixth:** It touches everything above and can be tuned after the other systems work.

**What needs to happen:**
- 5-screen flow validated end-to-end with a fresh .edu account
- Screen 5 (space recommendations) → add a 6th screen or redirect: "What do you want to make?"
- Interest matching actually surfaces relevant spaces
- Auth flow: email → OTP → in, smooth and fast

**Current state:** Backend shipped Feb 13. 5 screens built. Not validated end-to-end on Feb 22.

**Gap:** End-to-end test. Creation prompt as final onboarding step.

---

## Launch Blockers (fix before any real user)

1. Events feed images null + spaceHandle null — `/api/events/personalized`
2. Space events returning 0 — `/api/events?spaceId=...`
3. Auth flow not validated end-to-end
4. Profile black screen
5. 7-day space creation gate — `apps/web/src/app/api/spaces/route.ts:167`
6. Events nav tab in sidebar — `navigation.ts` + `AppSidebar.tsx`

See `docs/KNOWN_STATE.md` for exact file locations and fix specs.

---

## The 2026 Positioning

**Not** "campus OS" (enterprise framing, wrong audience).

**Yes** "Build anything for your campus life. Share it anywhere."

Competitive landscape:
- Fizz: anonymous entertainment. Different job entirely.
- Discord: general purpose, heavy. No campus data layer.
- GroupMe: dumb group text. No creation.
- Notion/Linear: productivity, not community.

**HIVE's unoccupied space:** AI creation + community distribution + campus context. Nobody has this. The moat is "your campus is already here and your tools live where your community is."

The verified leadership record is undersold. Every org leader writing their resume in April wants this. It's the lock-in flywheel that makes leaders impossible to churn.

---

## First Session Experience Target

A UB freshman opens HIVE. In 5 minutes:
1. Signs up with .edu email, through onboarding in 60 seconds
2. Lands at "What do you want to make?" with quick chips: Poll, RSVP, Signup, Countdown
3. Creates a poll ("best day for our study session") in 30 seconds
4. Gets a link, drops it in their group chat
5. Sees the events feed — "oh, there's a hackathon this Friday"
6. Finds their CS club's space, joins it
7. Sees their club's upcoming events already there

That's the product. Everything we build should be in service of that sequence.

---

## What To Do In This Work Session

### Option A: API fixes first (fast, unblocks everything)
Use Claude Code to knock out the 6 launch blockers. ~2-3 hrs. Then UI work on working foundation.

### Option B: First-session UX design first (get the vision right, then build)
Walk through the 6-system priority list above. Define what each screen should look like and feel like for a real freshman. Then hand specs to Claude Code.

### Option C: Both in parallel
Nova handles IA + product specs. Claude Code handles API fixes simultaneously.

**Recommendation: Option C.** API fixes are mechanical and well-documented. Product design work runs in parallel.

---

*Written: Feb 22 2026. Based on product strategy session with Jacob.*
*Reference: `docs/KNOWN_STATE.md`, `docs/LAUNCH-IA.md`, `docs/FIRESTORE_SCHEMA.md`*
