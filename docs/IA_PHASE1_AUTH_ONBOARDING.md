# Phase 1 IA Spec: Auth & Entry Flow

**Status:** APPROVED FOR IMPLEMENTATION
**Date:** January 2026
**Scope:** Landing → Entry → First Destination

---

## Executive Summary

Replace the current 7-step auth/onboarding flow with a **single unified entry experience**.

| Current | New |
|---------|-----|
| `/auth/login` + `/onboarding` (7 steps) | `/enter` (4 states) |
| 3-5 minutes | 60-90 seconds |
| 4+ decisions (email, userType, handle, interests) | 2 decisions (email, handle) |
| Forms feel | Threshold crossing feel |

**Core Change:** Remove all "premature decisions" (userType, interests, spaceClaim). Let users discover value inside, then self-select into leader/explorer behaviors.

---

## The Gate Pattern

### Philosophy

> "You're outside → You cross the gate → You're home → Everything happens here"

Entry to HIVE should feel like **crossing a threshold**, not filling out forms.

### Emotional Journey

| Second | State | Emotion | What They See |
|--------|-------|---------|---------------|
| 0-10 | email | Curiosity | "My campus is here?" |
| 10-30 | code | Anticipation | "They're letting me in" |
| 30-60 | identity | Ownership | "This is my handle" |
| 60-90 | arrival | Arrival | "I'm in. This is mine." |

---

## URL Architecture

### New Routes

```
/                     → Landing (pitch + inline email entry)
/enter                → The Gate (state machine)
/enter?state=email    → Deep link: email input
/enter?state=code     → Deep link: OTP input
/enter?state=identity → Deep link: name + handle
/enter?expired=true   → Session expired state
```

### Removed Routes

```
/auth/login     → REMOVE (merged into /enter)
/auth/verify    → REMOVE (merged into /enter)
/onboarding     → REMOVE (merged into /enter)
/auth/expired   → REMOVE (handled inline)
```

### Redirects

| Old URL | New Behavior |
|---------|--------------|
| `/auth/login` | 301 → `/enter` |
| `/auth/verify` | 301 → `/enter?state=code` |
| `/onboarding` | 301 → `/enter?state=identity` |
| `/auth/expired` | 301 → `/enter?expired=true` |

---

## State Machine

### States

```typescript
type EntryState =
  | 'email'       // Input: campus email
  | 'sending'     // Loading: sending code
  | 'code'        // Input: 6-digit OTP
  | 'verifying'   // Loading: verifying code
  | 'identity'    // Input: name + handle (new users only)
  | 'submitting'  // Loading: creating account
  | 'arrival'     // Success: 2s celebration
```

### Transitions

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│  email ──────► sending ──────► code                        │
│                                   │                        │
│                                   ▼                        │
│                              verifying                     │
│                                   │                        │
│                    ┌──────────────┴──────────────┐         │
│                    │                             │         │
│                    ▼                             ▼         │
│           [NEW USER]                    [RETURNING USER]   │
│                    │                             │         │
│                    ▼                             │         │
│               identity                           │         │
│                    │                             │         │
│                    ▼                             │         │
│              submitting                          │         │
│                    │                             │         │
│                    └─────────────┬───────────────┘         │
│                                  │                         │
│                                  ▼                         │
│                              arrival                       │
│                                  │                         │
│                                  ▼                         │
│                         /spaces/browse                     │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### New vs Returning User Detection

```typescript
// After verifying code, check:
const isNewUser = !userData.handle || !userData.onboardingCompleted;

if (isNewUser) {
  // → identity state
} else {
  // → arrival state (skip identity)
}
```

---

## Page Layouts

### State: email

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                        ⬡ HIVE                              │
│                                                            │
│           Enter with your campus email                     │
│                                                            │
│        ┌────────────────────────────────────┐              │
│        │                    @buffalo.edu   │              │
│        └────────────────────────────────────┘              │
│                                                            │
│                     [Continue]                             │
│                                                            │
│        ─────────────────────────────────────               │
│                                                            │
│        400+ orgs mapped. Yours waiting.                    │
│                                                            │
└────────────────────────────────────────────────────────────┘

LAYOUT: AuthShell (centered column, max-w-md)
COMPONENTS: HiveLogo, EmailInput, Button, Text
COPY:
  - Heading: "Enter with your campus email"
  - Subtext: "400+ orgs mapped. Yours waiting."
  - Button: "Continue"
  - Error: "Use your @buffalo.edu email"
```

### State: code

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                        ⬡ HIVE                              │
│                                                            │
│                  Check your inbox                          │
│                                                            │
│               you@buffalo.edu                              │
│                                                            │
│        ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                │
│        │   │ │   │ │   │ │   │ │   │ │   │                │
│        └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                │
│                                                            │
│        [Change email]              [Resend in 0:30]        │
│                                                            │
└────────────────────────────────────────────────────────────┘

LAYOUT: AuthShell
COMPONENTS: HiveLogo, OTPInput, Button (ghost), Text
COPY:
  - Heading: "Check your inbox"
  - Subtext: email address (muted)
  - Links: "Change email", "Resend in 0:30"
  - Error: "Wrong code. X attempts left."
```

### State: identity

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                        ⬡ HIVE                              │
│                                                            │
│                     Last step.                             │
│                                                            │
│        Name                                                │
│        ┌─────────────────┐ ┌─────────────────┐             │
│        │ First           │ │ Last            │             │
│        └─────────────────┘ └─────────────────┘             │
│                                                            │
│        Your handle                                         │
│        ┌────────────────────────────────────┐              │
│        │ @john_doe                     ✓    │              │
│        └────────────────────────────────────┘              │
│        Available                                           │
│                                                            │
│                  [Enter HIVE →]                            │  ← GOLD CTA
│                                                            │
└────────────────────────────────────────────────────────────┘

LAYOUT: AuthShell
COMPONENTS: HiveLogo, Input (x2), HandleInput, Button (cta), Text
COPY:
  - Heading: "Last step."
  - Labels: "Name", "Your handle"
  - Status: "Available" (green) / "Taken" (red) / "Checking..." (muted)
  - Button: "Enter HIVE →" (gold, only enabled when handle available)
  - Suggestions: "@john_d", "@johndoe_ub", "@jdoe" (if taken)
```

### State: arrival

```
┌────────────────────────────────────────────────────────────┐
│                                                            │
│                                                            │
│                          ✓                                 │  ← Gold checkmark
│                                                            │
│                   You're in, John.                         │
│                                                            │
│                 @john_doe is yours.                        │
│                                                            │
│               ───────────────────────                      │
│                                                            │
│               Taking you to campus...                      │
│                                                            │
│                                                            │
└────────────────────────────────────────────────────────────┘

LAYOUT: AuthShell (full viewport, centered)
COMPONENTS: Animated checkmark, Heading, Text
DURATION: 2 seconds, then auto-redirect
COPY:
  - Heading: "You're in, {firstName}."
  - Subtext: "@{handle} is yours."
  - Footer: "Taking you to campus..."
DESTINATION: /spaces/browse
```

---

## Removed Steps (Moved to Discovery)

### userType → REMOVED

**Old:** "What brings you here? Leader vs Explorer"
**New:** Removed entirely. Let users self-select after seeing value.

**Leader acquisition now happens via:**
1. Ghost spaces visible in `/spaces/browse`
2. "Claim your org" banner on browse page
3. Search prompt: "Your org isn't here yet. Create it?"
4. Profile prompt: "Lead an org? Claim your space."

### interests → REMOVED

**Old:** "What are you interested in?" tag selection
**New:** Progressive profiling after entry.

**Interest collection now happens via:**
1. Space join prompts: "Interested in AI? Join @ai-club"
2. Recommendation engine: Based on browsing behavior
3. Optional profile section: "Add interests" in settings

### spaceClaim → MOVED

**Old:** During onboarding, select spaces to claim
**New:** `/spaces/claim` flow, accessed from browse page

**Claim flow now:**
1. User sees ghost space in browse → "Claim"
2. `/spaces/claim?handle=ub-consulting`
3. Verification step (optional proof)
4. Ownership transfer
5. Redirect to their space

---

## Data Model Changes

### User Document

```typescript
// BEFORE: Many onboarding fields
{
  userType: 'student',
  isLeader: false,
  interests: ['AI', 'Startups'],
  major: 'Computer Science',
  graduationYear: 2025,
  livingSituation: 'on-campus',
  onboardingCompleted: true,
  // ...
}

// AFTER: Minimal required fields
{
  // Required (from entry)
  email: string,
  fullName: string,
  firstName: string,
  lastName: string,
  handle: string,
  campusId: string,
  entryCompletedAt: string,  // Renamed from onboardingCompleted

  // Optional (progressive profiling later)
  bio?: string,
  avatarUrl?: string,
  interests?: string[],
  major?: string,
  graduationYear?: number,

  // Derived (from behavior)
  isLeader?: boolean,  // True if owns any space
}
```

### Backward Compatibility

```typescript
// Session token still includes:
{
  onboardingCompleted: boolean,  // Keep for middleware compat
  // Map from entryCompletedAt presence
}

// API response includes both:
{
  onboardingCompleted: user.entryCompletedAt != null,
  entryCompleted: user.entryCompletedAt != null,
}
```

---

## API Changes

### New Endpoint: `/api/auth/complete-entry`

Replaces `/api/auth/complete-onboarding`.

```typescript
// Request
POST /api/auth/complete-entry
{
  firstName: string,
  lastName: string,
  handle: string,
}

// Response
{
  success: true,
  user: {
    id: string,
    handle: string,
    fullName: string,
  },
  redirect: '/spaces/browse',
}
```

### Removed from complete-entry

```typescript
// These fields NO LONGER accepted:
{
  userType: 'student',      // REMOVED
  isLeader: boolean,        // REMOVED
  interests: string[],      // REMOVED
  initialSpaceIds: string[], // REMOVED
  builderRequestSpaces: string[], // REMOVED
  major: string,            // REMOVED (progressive)
  graduationYear: number,   // REMOVED (progressive)
  livingSituation: string,  // REMOVED (progressive)
}
```

### Existing endpoints unchanged

- `POST /api/auth/send-code` — Keep as-is
- `POST /api/auth/verify-code` — Keep as-is
- `GET /api/auth/me` — Keep as-is
- `GET /api/auth/check-handle` — Keep as-is

---

## Redirect Logic

### Middleware Updates

```typescript
// Current
if (!session.onboardingCompleted) {
  redirect('/onboarding');
}

// New
if (!session.onboardingCompleted) {
  redirect('/enter?state=identity');
}
```

### Post-Entry Redirect

```typescript
// After arrival state (2s delay)
const destination = searchParams.get('redirect') || '/spaces/browse';
router.push(destination);
```

### Deep Link Support

```typescript
// Support these query params on /enter:
?state=email         // Start at email
?state=code          // Start at code (requires email in session)
?state=identity      // Start at identity (requires verified session)
?redirect=/s/xyz     // After completion, go here
?expired=true        // Show "session expired" message
```

---

## Component Inventory

### Required Primitives

| Primitive | Status | Notes |
|-----------|--------|-------|
| `EmailInput` | EXISTS | Use from design-system |
| `OTPInput` | EXISTS | Use from design-system |
| `Input` | EXISTS | Use from design-system |
| `HandleInput` | EXISTS | Use from design-system |
| `Button` | EXISTS | Use variant="cta" for gold |
| `HiveLogo` | EXISTS | Use from @hive/ui |

### Required Components

| Component | Status | Notes |
|-----------|--------|-------|
| `EntryPage` | NEW | Main `/enter` page, state machine |
| `EmailState` | NEW | Email input UI |
| `CodeState` | NEW | OTP input UI |
| `IdentityState` | NEW | Name + handle UI |
| `ArrivalState` | NEW | Success celebration |
| `HandleStatusBadge` | NEW | Shows available/taken/checking |

### Required Motion

| Animation | Trigger | Spec |
|-----------|---------|------|
| State transition | Between states | Fade 200ms, slide-y 20px |
| Handle check | Status change | Fade 150ms |
| Arrival checkmark | On arrival | Scale + fade, 400ms |
| Auto-redirect | After 2s | Progress indicator |

---

## Landing Page Changes

### Option A: Separate Landing + Entry

```
/ (landing)
  - Full pitch page
  - "Enter HIVE →" button links to /enter

/enter
  - Pure entry flow
  - No pitch content
```

### Option B: Inline Entry on Landing (RECOMMENDED)

```
/ (landing)
  - Pitch content
  - Email input inline
  - Submit → send code → redirect to /enter?state=code

/enter
  - Continues from any state
  - Can be accessed directly
```

**Recommendation:** Option B. Reduces friction by one click.

---

## Migration Plan

### Phase 1: Build New

1. Create `/enter` page with state machine
2. Create all state components
3. Create `/api/auth/complete-entry` endpoint
4. Update middleware redirect logic

### Phase 2: Redirect Old

1. Add 301 redirects for old routes
2. Update all internal links
3. Update email templates (if any link to /auth/*)

### Phase 3: Cleanup

1. Remove old pages (`/auth/login`, `/onboarding`)
2. Remove old components
3. Remove old API endpoint (`/api/auth/complete-onboarding`)
4. Remove unused user fields from types

### Phase 4: Progressive Profiling

1. Add "Complete your profile" prompt in settings
2. Add interest collection in space discovery
3. Add academic info collection (optional)

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Entry completion rate | ~70% | >90% |
| Time to first space view | 3-5 min | <2 min |
| Dropoff at userType step | ~15% | 0% (removed) |
| Dropoff at interests step | ~10% | 0% (removed) |
| Handle conflicts at submit | ~5% | <2% |

---

## Checklist: Before Implementation

- [ ] Confirm middleware supports new redirect logic
- [ ] Confirm session token structure unchanged
- [ ] Confirm handle check endpoint exists
- [ ] Confirm email sending works (Resend)
- [ ] Design review of all state layouts
- [ ] Copy review (voice consistency)

---

## Checklist: Before Launch

- [ ] Old routes redirect properly
- [ ] New user can complete entry in <90s
- [ ] Returning user skips identity step
- [ ] Handle suggestions work when taken
- [ ] Error states show properly
- [ ] Mobile layout tested
- [ ] Analytics events firing

---

## Open Questions

1. **Landing inline entry:** Implement now or later?
2. **Handle suggestions:** Keep current logic or improve?
3. **Draft recovery:** Still needed with shorter flow?
4. **Terms acceptance:** Where in new flow? (implicit on submit?)

---

*This spec is the source of truth for Phase 1 implementation. Any changes require updating this document first.*
