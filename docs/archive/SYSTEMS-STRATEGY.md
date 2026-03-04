# HIVE Systems Strategy
**Locked: Feb 22 2026**
**Read alongside: `docs/PRODUCT-STRATEGY.md` and `docs/LAUNCH-IA.md`**

---

## The 6 Systems (in build priority order)

Creation → Feed → Distribution → Community → Identity → Onboarding

---

## 1. Creation (HiveLab)

**The front door. Any student, any reason, 30 seconds, no prerequisites.**

HiveLab is to campus life what OpenAI was to software. Not a features list — a capability layer. The feeling when a student discovers it: "I can build anything my campus needs." That's the unlock.

### Three distinct users, three distinct flows

**The casual student** — "I need a poll for my group chat."
```
Tap [Poll] chip → "What's your question?" → [Create] → get link → share
```
10 seconds. Never sees the IDE. The IDE is an escape hatch, not the default.

**The org leader** — "I need a volunteer signup for our 5K, 3 stations, max 8 each."
```
Type prompt → Groq generates → preview in same page → [Deploy to Space] or [Just share]
```
30 seconds. Preview lives in the Lab page, not the IDE.

**The builder** — explicit opt-in to full canvas IDE via ghost link at bottom.

### The core principle
Most students go from prompt → shareable link without ever touching a canvas. The IDE is depth mode. The quick create is the product.

### Template library — informal campus life first

| Category | What it covers |
|----------|---------------|
| Settle it | Debates, rankings, "who's right" votes, tier lists |
| Plan it | Road trips, nights out, group decisions, "rate these options" |
| Hype it | Countdowns to anything — 21st, spring break, graduation, concerts |
| Fill it | Cookout contributions, carpool slots, "I need 3 people for this" |
| Game it | Brackets, survivor votes, fantasy stuff, "most likely to..." |
| Run it | Org meetings, elections, dues, events (the leader layer) |

The first five are for casual students. The last one is for org leaders. Right now HIVE only has the last one.

---

## 2. Feed (Discovery)

**Events + Creations. Not spaces — that's the Spaces tab's job.**

### Two things only

**Events** — what's happening on campus. Real gravity. External content that exists before any user does anything. Cold start content. 2,772 real events, 371 in the next 7 days.

**Creations** — what students have built and what's trending. "47 people voted in this spring break poll." "Someone made a roommate bracket for South Campus dorms." This is the inspiration layer — seeing what's possible makes you want to make something.

### What the feed is NOT
No SpaceCards in the main feed. Space discovery is the Spaces tab's job. Mixing them is a category error — "Join UB Women's Soccer" in a feed means nothing to a student who just signed up.

### Interaction model
The feed must be participatory, not just a list. Vote on a poll inline. RSVP to an event without navigating away. Every inline interaction is a micro-belonging moment. Reduce friction to participation.

### Zero-state (new user, no interests yet)
Default feed: campus-wide events sorted by time + most-interacted tools on campus. No personalization required — just "here's what's happening at UB and here's what students are making." Good enough to make someone stay.

### The creation feed gap
Currently the feed is events only. No surface shows what students have built. That gap is the difference between "events app" and "creation-led campus app." ToolCard in the feed — "Jake made a spring break bracket, 47 votes, tap to vote" — is what makes HIVE feel different.

### Freshness
Events are time-bound. Creation activity is the daily refresh signal. New tools, new interactions, new RSVPs — that's what brings someone back tomorrow.

---

## 3. Distribution (/t/[toolId])

**The acquisition engine. Every shared link is an impression. This is how HIVE grows for free.**

### The /t/ page is the product demo

When someone taps a HIVE link in GroupMe, they've never heard of HIVE. They experience the product before they experience the brand. If the tool is clean, fast, and works — they're already sold. The /t/ page is more important than the landing page.

### Requirements
- Zero login wall. Interact immediately. No "sign up to vote" friction.
- Fast. One missed tap and they're back to GroupMe.
- Beautiful enough that sharing it doesn't feel embarrassing. The tool represents the creator socially.
- Social proof visible without login: "47 votes" / "14 going" / "3 slots left."

### OG tags are the real first impression
Before someone taps, they see the preview card in iMessage or GroupMe. That card IS the marketing.
- Title: tool name ("Spring Break Vote")
- Description: live state ("47 votes · closes Sunday")
- Image: dynamic per tool — show the question and options, not generic HIVE branding

### "Made with HIVE" conversion
Small, tasteful, bottom of page. Not a banner.
- "Create your own" → straight into onboarding with creation prompt pre-filled
- "See more from [Space]" → if tool was deployed to a space

The person is already in the mental state of "I want one of these." Take them directly to creation, not to a marketing page.

### Creator dopamine
"Your poll has 47 responses" is what makes creators come back and share more. The notification when someone interacts is validation. The number going up is the hook. Creators who see engagement share more. That's the distribution flywheel.

---

## 4. Community (Spaces)

**The upgrade, not the entry. Where creations live and communities form.**

### The core problem
1,174 spaces, 0 members, 0 claimed. With no events showing (API bug) they look like ghost towns. Fix the space events bug and suddenly every space has 3 upcoming events in the sidebar — the org exists, things are happening, the space feels alive before anyone joins.

That one bug fix is the difference between 1,174 ghost towns and 1,174 real organizations.

### The gathering threshold
`DEFAULT_ACTIVATION_THRESHOLD = 10` in `packages/core/src/domain/spaces/aggregates/enhanced-space.ts:100`

**Change to 1.** With 0 members everywhere, no space ever opens chat. The threshold mechanic makes sense as a retention feature later — not at launch. First person who joins can chat.

### What Community needs for launch
- Space events working — the life signal
- Join flow validated end-to-end
- "Claim This Space" prominent for leaders — backend exists, needs UI
- Tools deployed to spaces visible in sidebar — creation → community connection

### The land-grab dynamic
"Your club is already here. If you don't claim it, someone else will." That's the org leader hook. Urgency is real because spaces are pre-seeded with org identity from UBLinked data.

### Chat
Chat exists but 0 messages. Don't design around it for launch. Design around events + tools + members as the content layer. Chat grows organically once people join.

---

## 5. Identity (Profile)

**Participatory identity. Not a dashboard — a live showcase.**

### The insight
Your HIVE profile isn't a social media profile with followers and posts. It's a portfolio of things you built that people can interact with right now.

### The WOW
Someone lands on your profile — maybe because they saw your name on a /t/ link. The first thing they can do is participate in something you made. Your best tool, live, front and center, interactive. They're number 301 before they've decided if they like you.

Not "look at my stats." Not a card with numbers. The thing you made, alive, with the count visible.

### The design
- True black surface
- Name in Clash Display
- Hero tool — interactive, full-width, count visible
- Tool grid below — each one alive, each one showing the number
- Scroll and participate

### What profile is NOT at launch
Not the recruiter-verification angle. College students live in the present. The social proof that matters is "1,247 people participated in something you made" — not a verified record for a future employer. That comes later when there's a semester of data to verify.

### Empty profile
Fresh user, 0 tools. Should feel like potential, not emptiness:
- Prompt: "What will you build first?" with quick chips
- Three suggested spaces based on their interests and major
- "Your profile fills up as you create."

---

## 6. Onboarding

**The bridge. Every system above fails if this doesn't hook them.**

### The problem with the current flow
Ends at space recommendations. They land as a passive observer. No hook. The product thesis — creation-led — is never demonstrated during the most critical moment.

### The target: they leave onboarding with a /t/ link in their clipboard

**The 60-second flow:**

1. Email → OTP — fast, necessary
2. Name — handle auto-generated, 10 seconds
3. **"What's your major?"** → they get placed in their major's space automatically. This is the permanent campus identity anchor. 100 majors = 100 spaces every student is immediately placed in. Cold start solved at the individual level.
4. **Campus identity dimensions** — not generic interest tags:
   - Greek life (yes/no + which chapter if yes)
   - Campus living (which dorm or off-campus)
   - Student orgs (search or browse)
5. **"Your campus is live"** — 2-3 real upcoming events matched to their major and interests. "There's a hackathon this Friday." "CS Society has an event tonight." The "oh this is real" moment.
6. **"Now make something."** — CreatePromptBar with 4 chips: Poll, RSVP, Signup, Countdown. No explanation. What do you want to make?
7. They tap a chip, fill in one field, hit create. 20 seconds. They get a link.
8. **"Share this with your group."** — Native share sheet or copy link. Done.
9. (Post-creation) "Your [Major] community is on HIVE." — Space recommendation NOW makes sense. They have something to bring to it.

### The major space insight

Your major is your most durable campus identity — it lasts 4 years, unlike clubs or dorms that change. Every student selecting CS gets placed in the Computer Science space which already has: department events, hackathon info, study groups, tools CS students have built.

100 majors × average class size = every student has a relevant community from minute one. Not "here are spaces you might like" — "here's your community. It's already alive."

### Why creation comes before space recommendations

Once they've made something, space recommendations mean something. "Your CS Society space is on HIVE. Deploy your tool there." Now they understand why a space matters — it's an audience for their creation. Before they've made anything, it's just a list of containers.

---

## The Connected Journey

```
Student discovers HIVE (shared /t/ link or word of mouth)
  → Email → OTP → name → major (placed in major space) → campus identity
    → "Your campus is live" (real events matched to them)
      → "Make something" → creates poll in 20 seconds → gets link
        → shares to GroupMe → friends interact
          → creator gets notification → comes back → sees feed
            → finds their org space → joins → deploys their tool there
              → org leader claims the space → org runs from HIVE
                → creation record builds → "1,247 people participated"
                  → profile fills up → campus identity is real
```

Every system feeds the next. The loop closes.

---

*Locked Feb 22 2026. All 6 systems defined.*
*See `docs/KNOWN_STATE.md` for launch blockers. See `docs/PRODUCT-STRATEGY.md` for positioning.*
