# HIVE VOICE

The words HIVE uses. Every screen, every message, every moment.

*Last updated: January 2026*

---

## THE VOICE

> **We stopped waiting for institutions. Students build what's missing. Your org, your rules, no permission. The builders inherit what comes next.**

This is the energy behind every word HIVE writes. Not a tagline to paste everywhere — a filter for everything.

---

## VOICE RULES

### Do

| Rule | Example |
|------|---------|
| **Short declaratives** | "You're in." not "Welcome to HIVE!" |
| **Ownership language** | "Yours" "You control" "Your rules" |
| **Builder verbs** | "Build" "Create" "Deploy" "Ship" "Claim" |
| **Peer tone** | "Something broke. Fixing it." not "We apologize for the inconvenience." |
| **Assume they get it** | Don't over-explain. They're smart. |
| **Action-first** | "Enter HIVE" not "Click here to get started" |
| **Specific over generic** | "Done" not "Successfully submitted" |

### Don't

| Rule | Why |
|------|-----|
| **No exclamation marks** | Sounds try-hard. Exception: rare celebration moments. |
| **No emojis in core UI** | Professional. Let the product speak. |
| **No corporate warmth** | "We're so glad you're here" is fake. |
| **No apology mode** | "Coming soon" implies failure. "Building" implies progress. |
| **No passive voice** | "Your request is being processed" → "Processing" |
| **No marketing superlatives** | "Amazing" "Incredible" "Revolutionary" — let them decide. |
| **No "hello fellow kids"** | No forced slang. No cringe. |

---

## COPY PATTERNS

### CTAs & Buttons

| Context | Pattern | Examples |
|---------|---------|----------|
| **Primary action** | Action verb | "Enter HIVE" "Claim" "Build" "Create" |
| **Secondary action** | Softer verb | "Browse" "Explore" "Skip" |
| **Destructive** | Direct + consequence | "Delete this? Can't undo." |
| **Navigation** | Where it goes | "Your spaces" "Settings" |
| **Loading state** | Present participle | "Claiming..." "Building..." "Entering..." |

**Never:** "Click here" "Submit" "Continue to next step" "Learn more"

### Empty States

Empty = canvas, not absence.

| Instead of | Say |
|------------|-----|
| "No messages yet" | "Start the conversation" |
| "No events" | "Events start here" |
| "No members" | "Invite your people" |
| "Nothing to show" | "Your canvas" |
| "Be the first!" | "Build this" |
| "No spaces found" | "Nothing matches. Try another search." |

**Pattern:** `[Thing] starts here` or `Your [thing]` or action prompt.

### Error Messages

Errors should sound like a peer, not an institution.

| Instead of | Say |
|------------|-----|
| "Something went wrong" | "Something broke." |
| "We encountered an unexpected error" | "That didn't work." |
| "Please try again later" | "Try again" |
| "Service temporarily unavailable" | "Back in a sec" |
| "We apologize for the inconvenience" | (nothing — just fix it) |
| "Error 500" | "Something broke on our end." |
| "Invalid input" | "That doesn't look right" |

**Pattern:** State what happened. Offer recovery. No apology theater.

```
Something broke.
[Try again]  [Go back]
```

### Success Feedback

Less is more. Don't celebrate the obvious.

| Instead of | Say |
|------------|-----|
| "Successfully created!" | "Created" or nothing |
| "Your changes have been saved" | "Saved" |
| "Welcome to HIVE!" | "You're in." |
| "Congratulations!" | (nothing) |
| "You did it!" | (nothing) |
| "Space successfully claimed" | "It's yours." |

**Pattern:** Confirm, don't celebrate. Exception: milestone moments (handle claim, first space).

### Loading States

| Context | Pattern |
|---------|---------|
| **General** | "Loading" (no ellipsis animation needed) |
| **Specific action** | Present participle: "Claiming..." "Building..." |
| **Long wait** | "Still working..." (only if > 5 seconds) |

**Never:** "Please wait" "Hang tight" "Just a moment"

### Confirmations

Direct. Consequence-aware.

| Instead of | Say |
|------------|-----|
| "Are you sure you want to delete?" | "Delete this? Can't undo." |
| "This action cannot be undone" | "Can't undo." |
| "Please confirm your choice" | (just show the action) |
| "Yes / No" | "Delete / Keep" (action-specific) |

**Pattern:** `[Action]? [Consequence].` with action-named buttons.

### Form Labels & Helpers

| Instead of | Say |
|------------|-----|
| "Enter your email address" | "Email" |
| "Please enter your full name" | "Name" |
| "This field is required" | (red border is enough) |
| "Password must contain..." | "8+ characters" (inline hint) |
| "Click to upload" | "Upload" or drag target |

**Pattern:** Label only. Helper text only when non-obvious. Inline validation.

---

## CONTEXT-SPECIFIC VOICE

### Landing Page

**Energy:** Manifesto. Rebellion. Inevitability.

| Element | Voice |
|---------|-------|
| **Headline** | "We stopped waiting." |
| **Subhead** | "Students build what institutions can't." |
| **CTA** | "Enter HIVE" |
| **Trust line** | "Your org. Your rules. No permission." |
| **Social proof** | Numbers only, no hype: "400+ orgs mapped" |

**Avoid:** Marketing superlatives. Exclamation marks. "Join the community!"

### Auth Flow

**Energy:** Ownership transfer. Belonging confirmed.

| Moment | Voice |
|--------|-------|
| **Entry** | "Enter" not "Sign in" |
| **Domain hint** | "@buffalo.edu" |
| **OTP sent** | "Code sent to [email]" |
| **Success** | "You're in." |
| **Returning** | "Welcome back" (no exclamation) |

### Onboarding

**Energy:** Anticipation. Potential. Early advantage.

| Moment | Voice |
|--------|-------|
| **User type** | "What brings you here?" |
| **Handle unlock** | "It's yours." (gold moment) |
| **Completion (leader)** | "Your rules now." |
| **Completion (explorer)** | "The builders are here." |

**Avoid:** "Welcome to the family!" "You're going to love this!"

### Spaces

**Energy:** Territory. Control. Ownership.

| Element | Voice |
|---------|-------|
| **Browse header** | "400+ orgs mapped. Find yours." |
| **Claim header** | "Claim your territory" |
| **Claim success** | "It's yours." |
| **Create header** | "Start a space" |
| **Empty space** | "Your canvas" |
| **Space settings** | "Your rules" |

**Avoid:** "Grow your community!" "Invite friends to get started!"

### HiveLab

**Energy:** Builder identity. Ship culture.

| Element | Voice |
|---------|-------|
| **Create** | "Build a tool" |
| **Deploy** | "Deploy" not "Publish" |
| **Success** | "Deployed" or "Live" |
| **Template picker** | "Start from template" |
| **Empty builder** | "Drag to build" |

### Errors

**Energy:** Peer helping peer. No drama.

| Context | Voice |
|---------|-------|
| **General error** | "Something broke. Try again." |
| **Network error** | "Can't connect. Check your connection." |
| **Auth error** | "Session expired. Sign in again." |
| **Not found** | "That doesn't exist." |
| **Permission** | "You don't have access to this." |

**Recovery pattern:**
```
[What happened]
[What they can do]
```

### Feed (Coming Soon State)

**Energy:** Builder progress, not apology.

| Instead of | Say |
|------------|-----|
| "Coming Soon" | "Building" |
| "Your Feed is on the way" | "Feed ships next." |
| "We're building..." | "Here's what's live." |

---

## THE TESTS

Before shipping any copy, ask:

### The Peer Test
> Does this sound like a student leader talking to peers, or an institution talking to users?

### The Ownership Test
> Is there ownership language? ("Yours" "You control" "Your rules")

### The Action Test
> Is the CTA an action verb? (Build, Create, Claim, Enter)

### The Manifesto Test
> Would "we stopped waiting" fit before this sentence?

### The Exclamation Test
> Would removing the exclamation mark make it better? (Usually yes.)

### The Apology Test
> Are we apologizing for something we should be building toward?

### The 2am Test
> Would this feel right at 3am in a quiet space with three real people?

---

## WORD CHOICES

### What We Call Things

| We Say | Not | Why |
|--------|-----|-----|
| Space | Group, Server, Channel | A place you inhabit |
| Member | User, Follower | Part of something |
| Builder | Creator, Maker | You build, you ship |
| Tool | App, Widget | Something useful |
| Deploy | Publish, Launch | Ship to production |
| Active | Online, Available | Alive, present |
| Here | Online, Present | In this place |
| Territory | Platform, Network | Land you claim |
| Canvas | Empty state | Potential, not absence |

### Verbs of Agency

**Use:** Build, Create, Claim, Deploy, Ship, Enter, Start, Own

**Avoid:** Join, Subscribe, Follow, Like, Share, Click, Submit

### Filler to Cut

| Cut | Why |
|-----|-----|
| "Just" | Minimizes |
| "Simply" | Condescending |
| "Please" | Begging |
| "Actually" | Implies surprise |
| "Very" "Really" | Weak intensifiers |

---

## VOICE CHANGELOG

| Date | Change |
|------|--------|
| Jan 2026 | Initial voice documentation |
| Jan 2026 | Locked "We stopped waiting" as core statement |
| Jan 2026 | Defined context-specific patterns |

---

## REFERENCE

- `LANGUAGE.md` — Full token vocabulary
- `PHILOSOPHY.md` — The feeling behind the voice
- `WORLDVIEW.md` — Why HIVE exists
- `PRINCIPLES.md` — Design rules that inform voice
