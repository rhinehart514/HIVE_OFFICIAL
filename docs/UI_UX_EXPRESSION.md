# UI/UX Expression

> **Status:** LOCKED
> **Finalized:** January 2026
> **Sprint:** 11
> **Depends on:** All layers, slices, and IA

---

## The Upstream Problem

Everything we've defined is invisible to users.

Users don't see your strategy. They don't see your architecture. They don't see your schema.

**Users experience a feeling.**

Within seconds of opening the app, they know:
- Is this for me?
- Is this serious?
- Do I trust it?
- Do I want to stay?

**UI/UX Expression is where strategy becomes sensation.**

---

## The Feeling We're Creating

Not adjectives. Experiences.

### The Feeling of Walking Into a Room Where Something's Happening

Not a quiet library. Not a loud party. A gathering where:
- People are doing things
- Energy is visible but not chaotic
- You can find your corner
- Something interesting might happen

### The Feeling of a Tool That Doesn't Waste Your Time

Not cluttered. Not empty. Purposeful:
- Everything visible has a reason
- Actions are obvious
- Feedback is immediate
- You're never lost

### The Feeling of Being Part of Something Bigger

Not isolated. Not overwhelming. Connected:
- You see others
- You see activity
- You see momentum
- You see your place in it

---

## Emotional Arc Per Journey

Each journey has an emotional shape. We design to that shape.

### Journey 1: New User Discovery

**Arc:** Curious → Oriented → Surprised → Invested → Belonging

| Beat | State | Emotional Need | Design Response |
|------|-------|----------------|-----------------|
| 1 | Landing | "Tell me what this is" | Clean, confident, inviting |
| 2 | Signup | "Don't waste my time" | Fast, progress visible |
| 3 | Recommendations | "Is this for me?" | Relevant, pre-seeded, active |
| 4 | First join | "Am I part of this now?" | Warm welcome, micro-commitment felt |
| 5 | First return | "Is this my place?" | Recognized, activity visible |

### Journey 2: Leader Event Creation

**Arc:** Intent → Empowered → Proud → Validated → Momentum

| Beat | State | Emotional Need | Design Response |
|------|-------|----------------|-----------------|
| 1 | Open HiveLab | "Let me do this" | Surface ready, inviting |
| 2 | AI generation | "Did that just work?" | Instant, magical, visual building |
| 3 | Publish | "Can I share this?" | Beautiful output, professional |
| 4 | First RSVP | "Does it matter?" | Clear notification, real response |
| 5 | RSVPs build | "Is this working?" | Numbers climbing, momentum visible |

### Journey 3: Member Event Discovery

**Arc:** Bored → Curious → Interested → Committed → Anticipating

| Beat | State | Emotional Need | Design Response |
|------|-------|----------------|-----------------|
| 1 | Open Feed | "Show me something" | Immediate content, not empty |
| 2 | See event | "Is this for me?" | Visual interest, clear info |
| 3 | See social proof | "Will I be alone?" | Friends visible, activity shown |
| 4 | RSVP | "I'm doing this" | One tap, confirmation felt |
| 5 | Countdown | "When is it?" | Time approaching, anticipation |

---

## Visual Hierarchy Per Key Page

### Home (Feed)

**Primary (60%):** Content — events, activity, discovery
**Secondary (25%):** Navigation — spaces rail, temporal context
**Tertiary (15%):** Actions — profile, search, create

**Layout:**
- Temporal anchor at top ("Today" / "This Week")
- Scannable cards, not reading-heavy
- Spaces rail always visible (desktop)
- Actions in corners, minimal footprint

### Space Chat

**Primary (60%):** Chat stream — messages, life, real-time
**Secondary (25%):** Composer — ready to type, obvious
**Tertiary (15%):** Context — header, members, pinned

**Layout:**
- Space identity at top
- Messages flow naturally
- Typing indicators visible
- Input always accessible
- Context expandable, not competing

### Event Detail

**Primary (40%):** Visual + essentials — image, title, time, location
**Secondary (30%):** Social proof — who's going, friends
**Action (20%):** RSVP button — obvious, one tap
**Tertiary (10%):** Details — description, host, logistics

**Layout:**
- Visual hook at top
- Essentials immediately visible
- Faces show social proof
- RSVP button prominent
- Details available on scroll

### HiveLab (Create)

**Primary (50%):** Canvas — live preview, what you're making
**Secondary (30%):** Input — describe what you need
**Tertiary (20%):** Elements + actions — tools, save, share

**Layout:**
- Large input inviting intent
- Preview shows result live
- Elements accessible but secondary
- Actions clear and ready

---

## The "Wow" Moments

Specific moments designed for delight and memory.

### Wow #1: The 60-Second Creation

**Moment:** One sentence → complete creation

**Expression:**
- Generation animation (building, not spinning)
- Elements appear with stagger
- Preview feels instantly alive
- Share card generates simultaneously

**Feeling:** "That just happened. From one sentence."

### Wow #2: The Social Map

**Moment:** Event attendees visualized with connections

**Expression:**
- Friend faces highlighted first
- "You met at [event]" on hover
- "In 3 spaces together" visible
- Social density apparent

**Feeling:** "I can see my network. I know who I'll know."

### Wow #3: The Countdown Approach

**Moment:** Event countdown intensifies

**Expression:**
- State changes: Week → Days → Tomorrow → Hours → Now
- Visual intensity increases subtly
- "Live" indicator pulses
- Urgency without alarm

**Feeling:** "It's getting closer. It's almost time."

### Wow #4: The First Response

**Moment:** Creation gets first response

**Expression:**
- Notification with context
- "Someone used what you made"
- Response immediately visible
- Counter begins climbing

**Feeling:** "What I made worked. Someone used it."

### Wow #5: The "What's Today"

**Moment:** Open feed, see day laid out

**Expression:**
- Today's events at top
- Friends' activity woven in
- Your spaces summarized
- Forward-looking, not backward

**Feeling:** "I know exactly what's happening."

---

## Motion Strategy

Motion is communication, not decoration.

### Motion Vocabulary

| Motion | Meaning |
|--------|---------|
| Slide in from right | Going deeper |
| Slide out to right | Going back |
| Crossfade | Lateral movement |
| Scale up | Appearing |
| Scale down + fade | Disappearing |
| Bounce | Success, confirmation |
| Shake | Error, blocked |
| Pulse | Attention, live |
| Stagger | Group, sequence |

### Duration Scale

| Type | Duration | Use |
|------|----------|-----|
| Micro | 100-150ms | Button states, toggles |
| Standard | 200-300ms | Page transitions, modals |
| Expressive | 400-600ms | Hero moments, generation |
| Deliberate | 600-1000ms | Rare, big moments only |

### Easing

- **Ease-out:** Things appearing (fast start, soft land)
- **Ease-in:** Things leaving (accelerates away)
- **Ease-in-out:** Things moving (natural)
- **Spring:** Bouncy, playful (limited use)

### Principles

1. **Purposeful** — Every motion has a reason
2. **Fast** — Respect user time
3. **Interruptible** — User can cancel
4. **Consistent** — Same motion = same meaning
5. **Accessible** — Reduced motion respected

---

## Interaction Feedback

Every interaction needs acknowledgment.

### Button States

| State | Expression |
|-------|------------|
| Default | Base appearance |
| Hover | Subtle lift, highlight |
| Active/Press | Slight compress |
| Loading | Spinner or progress |
| Success | Brief confirmation |
| Disabled | Muted, not interactive |

### Input States

| State | Expression |
|-------|------------|
| Empty | Placeholder visible |
| Focused | Border highlight, label lift |
| Filled | Content visible |
| Error | Red highlight, message |
| Success | Green check |
| Disabled | Muted |

### Loading States

| Context | Pattern |
|---------|---------|
| Page load | Skeleton screens |
| Data fetch | Skeleton in-place |
| Action | Button spinner |
| Real-time | Optimistic update |
| Long process | Progress indicator |

**Principle:** Something visible should always be happening. Never let users wonder "is it working?"

---

## Empty States

Empty is an opportunity, not a failure.

### Empty Feed

**Not:** "No posts yet."
**This:** "Nothing yet. Your spaces are quiet. Browse what's happening or start something."

**Visual:** Illustrated, not just text. Action prominent.

### Empty Space

**Not:** "No members."
**This:** "It's just you for now. Invite people to bring this space to life."

**Visual:** Invite CTA prominent. Example of active space shown.

### Empty Events

**Not:** "No events."
**This:** "Nothing scheduled yet. Create the first event or browse what's happening campus-wide."

**Visual:** Create CTA + Browse CTA. Calendar illustration.

### Empty Search

**Not:** "No results."
**This:** "Nothing matched. Try different terms or explore popular spaces."

**Visual:** Popular suggestions shown. Create option if applicable.

### Empty Responses

**Not:** "No responses yet."
**This:** "Waiting for the first one. Share this to get responses."

**Visual:** Share CTA prominent. Preview of share card.

---

## Voice and Tone

The product speaks. How?

### Principles

- **Confident, not arrogant** — We know what we're doing
- **Warm, not saccharine** — Genuine, not fake
- **Clear, not clinical** — Human, not robot
- **Playful, not silly** — Light moments, not constant jokes
- **Brief, not terse** — Respect time, not cold

### Patterns

| Context | Tone |
|---------|------|
| Onboarding | Welcoming, guiding |
| Error | Clear, helpful, not blaming |
| Empty state | Encouraging, actionable |
| Success | Celebratory, brief |
| Notification | Informative, urgent if needed |

### Examples

**Error:**
- Not: "Authentication failed."
- This: "Couldn't sign you in. Check your code and try again."

**Empty:**
- Not: "No results found."
- This: "Nothing yet. Create something or try different terms."

**Success:**
- Not: "Success!"
- This: "You're in. Welcome to [Space]."

**Notification:**
- Not: "New message in Pre-Med Society."
- This: "Sarah in Pre-Med Society: 'Who's studying tonight?'"

---

## Design System Alignment

### Where The System Serves

- **Spacing:** 4px grid gives rhythm
- **Color tokens:** Consistent meaning
- **Typography scale:** Clear hierarchy
- **Components:** Consistent patterns
- **Motion tokens:** Consistent feel

### Where The System Needs Growth

- **Emotional states:** Celebration, error, empty need expressions
- **Density modes:** Feed vs detail view
- **Motion vocabulary:** Animation presets
- **Interactive depth:** Hover/press/loading nuance
- **Dark mode:** Expression considerations

---

## Implementation Priority

### Phase 1: Foundation

1. Loading/skeleton consistency
2. Button states complete
3. Input states complete
4. Error states designed
5. Basic motion tokens

### Phase 2: Character

1. Empty states with illustration
2. Success moments with celebration
3. Wow moment #1 (60-second creation)
4. Voice/tone in copy review
5. Hierarchy enforcement per page

### Phase 3: Polish

1. All wow moments implemented
2. Motion vocabulary complete
3. Micro-interactions refined
4. Dark mode expression
5. Reduced motion variants

---

## The Bar

**Would this make someone screenshot it and share?**

Not "does it work" — does it feel like the future? Does it make you trust the product more? Would you show a friend?

The expression layer is what separates "it works" from "I love it."

---

## Design Reference Points

### What We Learn From

- **Linear:** Density without clutter, keyboard-first, speed
- **Notion:** Clarity, flexible canvas, confident emptiness
- **Stripe:** Polish, attention to detail, trust through craft
- **Arc:** Progressive disclosure, personality without gimmick
- **Discord:** Life and activity, real-time presence

### What We Avoid

- **Cluttered dashboards** — Too much, unclear hierarchy
- **Soulless enterprise** — Works but feels dead
- **Gimmicky animations** — Motion for motion's sake
- **Over-designed emptiness** — Pretty but unhelpful
- **Inconsistent personality** — Different voice in different places

---

## Constitutional Questions

Before shipping any surface, ask:

1. **What's the emotional beat?** What should users feel here?
2. **Is hierarchy clear?** What do they look at first?
3. **Is feedback present?** Does every interaction acknowledge?
4. **Is empty handled?** What if there's nothing?
5. **Is motion purposeful?** Does animation communicate?
6. **Does it match the voice?** Is copy consistent?
7. **Would I screenshot this?** Is it share-worthy?

---

## The Position

**HIVE should feel inevitable.**

Like this is obviously how campus platforms should work. Like you've been waiting for this without knowing it.

Not impressive because we tried hard. Impressive because it's right.

The expression layer is where craft meets strategy. Where pixels serve purpose. Where design becomes felt.

---

*This document defines how HIVE feels. The expression layer is where users fall in love — or don't.*
