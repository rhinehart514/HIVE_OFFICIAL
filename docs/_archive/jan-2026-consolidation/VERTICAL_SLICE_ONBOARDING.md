# Vertical Slice: Landing → Auth → Onboarding

## December 2025 Soft Launch

---

## Overview

This slice covers the complete journey from first landing to authenticated user in a space.

**Current Time to Value:** ~3-4 minutes
**Target Time to Value:** <60 seconds

---

## The Flow

```
┌─────────────────────────────────────────────────────────────┐
│                        LANDING                              │
│                    (/) - landing-page.tsx                   │
│                                                             │
│  Hero: "Build your own."                                    │
│  Stats: 400+ orgs, 32K students, UB first                   │
│  CTA: "Get early access" → /auth/login?new=true             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                         AUTH                                │
│               (/auth/login) - login/page.tsx                │
│                                                             │
│  States: input → sending → code → verifying → success       │
│                                                             │
│  1. Email input (with @buffalo.edu suffix)                  │
│  2. Send 6-digit OTP via SendGrid                           │
│  3. OTP entry (auto-focus, auto-submit)                     │
│  4. Verify → "You're in."                                   │
│  5. Redirect → /onboarding (new) or /feed (returning)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      ONBOARDING                             │
│            (/onboarding) - onboarding/page.tsx              │
│                                                             │
│  Step 1: userType  → "What brings you here?"                │
│                       - "I lead something" (gold)           │
│                       - "I'm finding my people" (neutral)   │
│                       - Faculty / Alumni buttons            │
│                                                             │
│  Step 2: profile   → Name, handle, major, graduation        │
│                       - Handle availability check           │
│                       - Photo upload (optional)             │
│                                                             │
│  Step 3: interests → Tag selection from categories          │
│                       - Implicitly accepts terms            │
│                                                             │
│  Step 4: spaces    → Browse/select spaces to join           │
│                       - Leaders: claim a space              │
│                       - Explorers: join 1-3 spaces          │
│                                                             │
│  Step 5: completion → "It's yours." / "Welcome to HIVE."    │
│                       - What's next suggestions             │
│                       - CTA to space                        │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     FIRST SPACE                             │
│          (/spaces/[spaceId]) - [spaceId]/page.tsx           │
│                                                             │
│  Leaders: Land in their claimed space                       │
│  Explorers: Land in first joined space                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## File Structure

### Landing Page
```
apps/web/src/
├── app/page.tsx                              # Entry point
└── components/landing/
    ├── landing-page.tsx                      # Main component (157 lines)
    └── sections/
        ├── navbar.tsx                        # Navigation
        ├── hero.tsx                          # "Build your own." (280 lines)
        ├── product-showcase.tsx              # Feature preview
        ├── about.tsx                         # Mission
        └── cta-footer.tsx                    # Final CTA + footer
```

### Auth
```
apps/web/src/
├── app/auth/login/page.tsx                   # Login page (781 lines)
├── components/auth/auth-shell.tsx            # Shared layout (170 lines)
└── app/api/auth/
    ├── send-code/route.ts                    # Generate + email OTP (579 lines)
    ├── verify-code/route.ts                  # Verify OTP → session
    ├── complete-onboarding/route.ts          # Save profile (340 lines)
    ├── check-handle/route.ts                 # Handle availability
    ├── session/route.ts                      # Get current session
    ├── refresh/route.ts                      # Token refresh
    ├── logout/route.ts                       # End session
    ├── sessions/route.ts                     # List sessions
    ├── sessions/[sessionId]/route.ts         # Revoke session
    ├── csrf/route.ts                         # CSRF token
    ├── me/route.ts                           # Current user
    ├── send-magic-link/route.ts              # Alternative auth
    ├── verify-magic-link/route.ts            # Verify magic link
    ├── resend-magic-link/route.ts            # Resend
    ├── health/route.ts                       # Health check
    ├── check-admin-grant/route.ts            # Admin check
    └── dev-session/route.ts                  # Dev bypass
```

### Onboarding
```
apps/web/src/
├── app/onboarding/page.tsx                   # Main page (286 lines)
└── components/onboarding/
    ├── layout.tsx                            # OnboardingLayout
    ├── hooks/
    │   └── use-onboarding.ts                 # State management (700+ lines)
    ├── steps/
    │   ├── index.ts                          # Step exports
    │   ├── user-type-step.tsx                # Fork: leader/explorer (172 lines)
    │   ├── profile-step.tsx                  # Name, handle, photo
    │   ├── interests-step.tsx                # Tag selection
    │   ├── spaces-step.tsx                   # Browse + join
    │   └── completion-step.tsx               # Success (254 lines)
    ├── shared/
    │   ├── motion.ts                         # Animation variants
    │   ├── types.ts                          # TypeScript types
    │   └── constants.ts                      # Handle regex, etc.
    └── ui/
        ├── draft-recovery-banner.tsx         # Restore draft
        └── error-recovery-modal.tsx          # Error handling
```

---

## Technical Implementation

### Auth System

**OTP Flow:**
1. User enters email → `POST /api/auth/send-code`
2. Generate 6-digit code with `crypto.randomInt(100000, 999999)`
3. Hash code with SHA256 → store in Firestore `verification_codes`
4. Send via SendGrid with branded HTML template
5. Code valid for 10 minutes, max 3 verification attempts
6. On success → create JWT session → set HttpOnly cookie

**Security:**
- Rate limiting: 10 codes/email/hour, 5 onboarding/IP/hour
- Origin validation (CSRF protection)
- Input validation with Zod + security schemas
- Audit logging for all auth events
- Handle reservation in transaction (prevents races)

**Session:**
- JWT with 7-day expiry (configurable)
- Contains: userId, email, campusId, isAdmin, onboardingCompleted
- HttpOnly, Secure, SameSite=Lax cookies
- Refresh endpoint for token renewal
- Multi-session support with session listing

### Onboarding State

**useOnboarding Hook:**
- Draft persistence to localStorage (7-day expiry)
- Online/offline detection
- Retry with exponential backoff
- Step migration for legacy flows
- Handle availability checking with debounce
- Analytics tracking per step

**Data Collected:**
```typescript
interface OnboardingData {
  userType: 'student' | 'alumni' | 'faculty' | null;
  handle: string;
  name: string;
  major: string;
  graduationYear: number | null;
  livingSituation: 'on-campus' | 'off-campus' | 'commuter' | 'not-sure' | null;
  interests: string[];
  profilePhoto: string | null;
  isLeader: boolean;
  courseCode: string;
  alumniEmail: string;
  termsAccepted: boolean;
  // Space claims
  builderRequestSpaces?: string[];
  claimedSpaceId?: string;
  claimedSpaceName?: string;
  initialSpaceIds?: string[];
  initialSpaceNames?: string[];
}
```

---

## What's Working Well

### Landing Page ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Hero section | ✅ Excellent | "Build your own." with 3D word animation |
| Manifesto copy | ✅ Strong | "// the old paths are dying" |
| Stats bar | ✅ Working | 400+ orgs, 32K students |
| Scroll progress | ✅ Premium | Gold line at top |
| Gold thread | ✅ Premium | Vertical parallax element |
| Lenis smooth scroll | ✅ Working | Physics-based scrolling |
| Reduced motion | ✅ Accessible | Respects prefers-reduced-motion |
| Mobile responsive | ✅ Working | Clamp-based typography |

### Auth ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Email input | ✅ Premium | Auto-suffix @buffalo.edu |
| OTP entry | ✅ Premium | 6-box auto-focus, auto-submit |
| Resend cooldown | ✅ Working | Progressive: 30s → 60s → 120s → 300s |
| Error messages | ✅ Human | Parsed for user-friendly text |
| Success state | ✅ Premium | "You're in." with gold glow |
| Auth shell | ✅ Premium | Ambient orb, dark theme |
| Dev bypass | ✅ Working | Quick login buttons in dev |
| Rate limiting | ✅ Secure | Per-IP and per-email |
| Audit logging | ✅ Complete | All events tracked |

### Onboarding ✅

| Component | Status | Notes |
|-----------|--------|-------|
| Two-path fork | ✅ Premium | Leader (gold) vs Explorer (neutral) |
| Conversational tone | ✅ Strong | "What brings you here?" |
| Handle checking | ✅ Working | Real-time availability |
| Draft recovery | ✅ Working | 7-day localStorage persistence |
| Offline handling | ✅ Working | Shows warning, saves locally |
| Error recovery modal | ✅ Working | Retry or save locally options |
| Step animations | ✅ Premium | Stagger + spring physics |
| Completion celebration | ✅ Premium | Gold checkmark glow |
| Space badges | ✅ Working | Shows joined communities |
| What's next | ✅ Helpful | Different for leaders vs explorers |

---

## What Needs Work

### Critical (Blocks 95% Polish)

#### 1. Time to Value — Too Many Steps

**Current:** 5 steps before seeing product
**Target:** 2 steps max

**Problem:**
```
Landing → Auth → userType → profile → interests → spaces → completion → space
         ────────────────────── 5 steps ──────────────────────
```

**Solution Options:**

**Option A: Defer Most Profile Data**
```
Landing → Auth → userType + handle → space selection → LAND IN SPACE
                                     (ask name later via profile prompt)
```

**Option B: Progressive Profiling**
```
Landing → Auth → pick 1 space → LAND IN SPACE
                               (profile collected over first 3 sessions)
```

**Option C: Preview Before Commit**
```
Landing → browse spaces (no auth) → click "Join" → auth → LAND IN SPACE
```

#### 2. No Product Preview

**Problem:** User sees zero product before committing email.

**Solution:** Allow browsing 2-3 spaces (read-only) before auth prompt.

#### 3. Leader Path Unclear After Completion

**Problem:** Leader lands in space but doesn't know what to do next.

**Solution:** First-run tooltip pointing to HiveLab or "Create first tool" button.

### Important (Should Fix)

#### 4. Handle Step Friction

**Current:** Separate profile step with handle check
**Better:** Inline handle input during fork step, or auto-generate from name

#### 5. Interests Step Low Value

**Problem:** Tags collected but not immediately used for recommendations.

**Options:**
- Defer to profile settings
- Use immediately to sort space recommendations in next step

#### 6. No Face Piles in Space Selection

**Problem:** Static list, no social proof
**Solution:** Show "Sarah, Mike, and 47 others" on each space card

### Nice to Have

#### 7. Sound Design

- Message send sound
- OTP digit sound
- Completion celebration sound

#### 8. Haptics (Mobile)

- Button press feedback
- Celebration vibration

---

## API Endpoint Reference

### Auth Endpoints (17 routes)

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/api/auth/send-code` | POST | Generate + email OTP | No |
| `/api/auth/verify-code` | POST | Verify OTP → session | No |
| `/api/auth/send-magic-link` | POST | Email magic link | No |
| `/api/auth/verify-magic-link` | POST | Verify magic link | No |
| `/api/auth/resend-magic-link` | POST | Resend magic link | No |
| `/api/auth/complete-onboarding` | POST | Save profile | Yes |
| `/api/auth/check-handle` | POST | Handle availability | Yes |
| `/api/auth/session` | GET | Get current session | No |
| `/api/auth/refresh` | POST | Refresh token | Yes |
| `/api/auth/logout` | POST | End session | Yes |
| `/api/auth/me` | GET | Current user | Yes |
| `/api/auth/csrf` | GET | Get CSRF token | No |
| `/api/auth/sessions` | GET | List sessions | Yes |
| `/api/auth/sessions/[id]` | DELETE | Revoke session | Yes |
| `/api/auth/health` | GET | Health check | No |
| `/api/auth/check-admin-grant` | GET | Admin check | Yes |
| `/api/auth/dev-session` | POST | Dev bypass | No (dev only) |

---

## Security Measures

### Rate Limiting

| Context | Limit | Window |
|---------|-------|--------|
| Magic link requests | 5/IP | 15 min |
| OTP codes per email | 10 | 1 hour |
| OTP verification attempts | 3 | per code |
| Onboarding completion | 5/IP | 1 hour |

### Input Validation

All inputs validated with Zod schemas:
- `SecureSchemas.email` — RFC 5322 + campus domain
- `SecureSchemas.handle` — a-z0-9_., 3-20 chars
- `SecureSchemas.name` — 1-100 chars, no scripts
- `SecureSchemas.url` — Valid URL format

### Session Security

- JWT signed with secret
- HttpOnly cookies (no JS access)
- Secure flag in production
- SameSite=Lax (CSRF protection)
- 7-day expiry with refresh

### Audit Trail

All auth events logged:
- `success` — Successful operations
- `failure` — Failed attempts
- `forbidden` — Access denied
- `suspicious` — Potential attacks

---

## Analytics Events

### Onboarding Funnel

| Event | Trigger |
|-------|---------|
| `onboarding_started` | User hits /onboarding |
| `onboarding_step_completed` | Each step finished |
| `onboarding_step_skipped` | Step skipped (if allowed) |
| `onboarding_abandoned` | Left before completion |
| `onboarding_completed` | Full completion |
| `onboarding_error` | Error encountered |
| `onboarding_retry` | Retry after error |

### Auth Events

| Event | Trigger |
|-------|---------|
| `auth_code_requested` | OTP sent |
| `auth_code_verified` | OTP success |
| `auth_code_failed` | OTP wrong |
| `auth_session_created` | Login success |
| `auth_session_refreshed` | Token refresh |
| `auth_logout` | User logout |

---

## Database Collections

### verification_codes
```typescript
{
  email: string;           // Lowercase
  codeHash: string;        // SHA256
  schoolId: string;
  campusId: string;
  status: 'pending' | 'used' | 'expired' | 'burned';
  attempts: number;        // Max 3
  createdAt: Timestamp;
  expiresAt: Timestamp;    // +10 minutes
  burnedReason?: string;   // 'superseded' | 'max_attempts'
}
```

### users
```typescript
{
  // Identity
  fullName: string;
  firstName: string;
  lastName: string;
  handle: string;          // Unique, lowercase
  email: string;

  // Academic
  major: string;
  graduationYear: number;
  academicLevel: 'undergraduate' | 'graduate' | 'doctoral';
  userType: 'student' | 'alumni' | 'faculty';

  // Profile
  bio?: string;
  interests: string[];
  avatarUrl?: string;
  livingSituation?: string;

  // Status
  isLeader: boolean;
  onboardingCompleted: boolean;
  isActive: boolean;

  // Campus isolation
  campusId: string;
  schoolId: string;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  onboardingCompletedAt?: string;
}
```

### handles
```typescript
{
  handle: string;          // Document ID
  userId: string;
  email: string;
  reservedAt: Timestamp;
}
```

### builderRequests
```typescript
{
  // Document ID: {userId}-{spaceId}
  userId: string;
  spaceId: string;
  campusId: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  userHandle: string;
  userName: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
```

---

## Known Issues

### Active Bugs

1. **None critical** — Auth flow is stable

### Technical Debt

1. **Legacy step migration** — Still handling old step names
2. **Double onboarding flags** — Both `onboardingCompleted` and `onboardingComplete` in user doc
3. **Avatar upload** — Uses profile photo URL, could use dedicated upload
4. **Dev bypass** — Should be more clearly gated

### Edge Cases

1. **Alumni/Faculty** — Early access flow (60 days) not fully tested
2. **Session expiry during onboarding** — Should gracefully re-auth
3. **Handle race condition** — Transaction handles this, but retry UX could be better

---

## Recommended Improvements

### P0 — Critical for Launch

1. **Reduce steps to 2-3**
   - Merge userType + handle into single step
   - Defer interests to profile settings
   - Show spaces immediately after handle

2. **Add product preview**
   - Allow browsing 2-3 featured spaces before auth
   - Show activity: "5 people chatting now"

### P1 — Important

3. **Inline space activity**
   - Face piles on space cards
   - Event callouts
   - "Active now" badges

4. **Leader first-run guidance**
   - Tooltip on first space entry
   - "Create your first tool" CTA

### P2 — Polish

5. **Sound design**
   - Single signature sound for auth success

6. **Animation refinements**
   - Consistent spring configs
   - Page transitions between steps

---

## Success Metrics

### Conversion Funnel

| Step | Target | Current | Gap |
|------|--------|---------|-----|
| Landing → Auth start | 40% | ~35% | 5% |
| Auth start → Auth complete | 90% | ~85% | 5% |
| Auth → Onboarding complete | 80% | ~70% | 10% |
| Onboarding → First message | 60% | Unknown | — |

### Time Metrics

| Flow | Target | Current | Gap |
|------|--------|---------|-----|
| Landing → Auth complete | 60s | 90s | 30s |
| Auth → First space | 60s | 150s | 90s |
| Total: Landing → First message | 120s | 300s | 180s |

---

## Next Steps

1. [ ] Audit current conversion funnel with real data
2. [ ] Design 2-step onboarding variant
3. [ ] Implement product preview (browse before auth)
4. [ ] Add activity indicators to space cards
5. [ ] Create leader first-run experience
6. [ ] Polish animations and transitions
7. [ ] Add sound design (optional)

---

*Last updated: December 2025*
*Vertical Slice: Landing → Auth → Onboarding*
