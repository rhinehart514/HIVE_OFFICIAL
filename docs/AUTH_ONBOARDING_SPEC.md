# Auth & Onboarding Specification

**Last Updated:** December 8, 2024
**Status:** Planning
**Target:** Spring 2025 Launch

---

## Strategic Focus

**Primary Users:** Student Leaders, Faculty, Admin
**Philosophy:** "Don't need a network" - Value is immediate through spaces and HiveLab

---

## Persona Access Matrix

| Persona | Access Level | Onboarding Steps | Can See | Can Do |
|---------|--------------|------------------|---------|--------|
| **Student Leader** | Full | 3 steps | Everything in their spaces | Build tools, manage space, invite |
| **Student Explorer** | Standard | 3 steps | Public spaces, joined spaces | Browse, join, use tools |
| **Faculty** | Elevated | 2 steps | Create course/dept spaces | Configure templates |
| **Alumni** | Restricted | 2 steps | Public space info only | Browse only (read-only) |
| **Uni Admin** | Preview | 1 step | All public info | Browse only (no governance yet) |

---

## Student Leader Flow (Primary)

### Psychological Journey

| Stage | What They See | What They Feel | Goal |
|-------|---------------|----------------|------|
| Landing | "Your campus clubs, one place" | Curiosity | Get email |
| Magic Link | "Check your inbox" | Anticipation | Build investment |
| Fork | "What brings you here?" | Recognition | Identify as leader |
| Identity | Name + Handle | Investment | Create ownership |
| Profile | Major + Year | Progress | Quick, essential |
| Claim | "Find your club" | Discovery + Ownership | THE AHA MOMENT |
| Complete | "You're in!" | Commitment | Give next action |

### Step Breakdown

**Step 1: Identity**
- Name (required)
- Handle (required, validated real-time)
- Skip photo, bio, interests

**Step 2: Quick Profile**
- Major (dropdown)
- Graduation Year (pill selector)
- No academic level, no living situation

**Step 3: Claim Your Space**
- Search for existing space
- See "Unclaimed - be the first" badge
- Or create new space
- Submit builder request

### Post-Onboarding
- Land in THEIR space (not feed)
- Pending approval banner (non-blocking)
- Prompt: "Build your first tool"

---

## Student Explorer Flow

### Steps (3)

**Step 1: Identity**
- Name + Handle (same as leader)

**Step 2: Quick Profile**
- Major + Year (same as leader)

**Step 3: Join Spaces**
- Browse available spaces
- Join 1+ spaces (optional)
- Can skip

### Post-Onboarding
- Land in /spaces/browse
- "Your clubs are waiting"

---

## Faculty Flow

### Steps (2)

**Step 1: Faculty Profile**
- Name
- Department (dropdown)
- Role: Professor / Instructor / Staff

**Step 2: What Do You Need?**
- Course Space (create for CSE 442)
- Department Space (create/claim for CS Dept)
- Just Exploring (skip)

### Course Space Creation
- Course code
- Course name
- Checklist: Office hours, TAs, Discussion, Resources

### Post-Onboarding
- Share link: hive.so/cse442
- "Add to syllabus"
- Done (they don't need to "use" it)

---

## Alumni Flow (Restricted)

### Security Restrictions

Alumni CANNOT access:
- Member lists (privacy)
- Student profiles (privacy)
- Chat/messages (private)
- HiveLab tools
- Join spaces
- Contact info

Alumni CAN see:
- Space names/descriptions
- Categories
- Event titles/dates (not attendees)
- Member count (just the number)

### Steps (2)

**Step 1: Alumni Profile**
- Name
- Graduation year (past years: 2020-2024)
- Major studied

**Step 2: Early Access Notice**
- "As an alumni you can browse..."
- Clear limitations stated
- 60-day early access expiration

### Post-Onboarding
- Browse-only space directory
- No joining, no messaging

---

## Uni Admin Flow (Minimal)

### Access Level: Preview Only

For now, admins get:
- Same view as students
- Can browse all spaces
- NO moderation tools
- NO analytics
- NO approvals

### Step (1)

**Step 1: Admin Notice**
- "Preview Access"
- "Full admin tools coming soon"
- Set expectations

### Post-Onboarding
- Browse spaces like a student
- See "Admin Preview" badge

---

## Early Access Program

**Applies to:** Alumni, Faculty

**Duration:** 60 days from signup

**Stored in user doc:**
```typescript
{
  earlyAccess: true,
  earlyAccessGrantedAt: "2024-12-08T...",
  earlyAccessExpiresAt: "2025-02-06T..."
}
```

**Purpose:** Build excitement before deciding permanent access

---

## Technical Implementation

### Session Management
- JWT with `jose` library
- 30-day session for regular users
- 4-hour session for admin
- httpOnly, secure, sameSite=lax cookies
- CSRF token for admin actions

### Rate Limiting
- Global: 300 req/min
- Sensitive endpoints (auth): 30 req/min
- Per-client (IP or session prefix)

### Handle System
- Real-time availability check
- Atomic reservation with Firestore transaction
- Suggestions when taken
- Regex: `/^[a-zA-Z0-9._-]{3,20}$/`

### Security Validations
- SecureSchemas applied to all auth routes
- Input sanitization
- Campus isolation (campusId on all queries)

---

## Edge Cases & Error States

### Incomplete Onboarding
- Draft saved to localStorage
- 7-day expiration on drafts
- "Continue where you left off" on return

### Handle Conflicts
- Real-time check with debounce (300ms)
- Suggestions: `handle_ub`, `handle42`, `h_andle`
- Transaction prevents race conditions

### Builder Request Flow
1. Leader submits claim for space
2. Request goes to `builderRequests` collection
3. Admin approves/denies (in admin panel)
4. On approval: user gets leader role
5. Pending status shown but non-blocking

### Email Verification Failed
- Magic link expired: "Link expired, request new"
- Wrong email: No action (can't verify)
- Already used: "You're already verified"

---

## Onboarding Analytics (To Implement)

Track per step:
- Drop-off rate
- Time spent
- Back button usage
- Error occurrences

Key metrics:
- Funnel completion rate by user type
- Time to first space claim
- Handle retry rate

---

## Remaining Considerations

### To Decide
- [ ] Email domain allowlist (just buffalo.edu or more?)
- [ ] FERPA compliance for student data
- [ ] Age verification (13+ requirement?)
- [ ] Account deactivation when leaving university

### To Implement
- [ ] Collapse onboarding from 6 to 3 steps
- [ ] Leader fork earlier in flow
- [ ] Claim space as climax of onboarding
- [ ] Alumni access restrictions
- [ ] Faculty course space templates
- [ ] Post-onboarding landing (space, not feed)
- [ ] Builder request approval flow polish

---

## UI/UX Principles

1. **Respect time** - 3 steps max, essential fields only
2. **Create ownership** - "Your space", "Your handle"
3. **Show progress** - Visible step counter
4. **Enable escape** - Back button, skip options
5. **Immediate value** - Land in space, not empty feed
6. **Clear permissions** - Tell each persona what they can/can't do
