# HIVE Auth & Onboarding System — Exploration Summary

**Explored**: November 22, 2025  
**Scope**: Medium-depth exploration of auth flow, onboarding pages, UI components, and recent rebuild  
**Recent Commit**: e8e1816 "feat(auth): rebuild onboarding flow with expert layout approach"

---

## Current Onboarding Page Locations & Status

### Active Pages
1. **`apps/web/src/app/auth/login/page.tsx`**
   - Status: ✅ Production-ready (rebuilt Nov 2025)
   - Flow: Email input → Magic link verification
   - UX Pattern: Minimalist, 360px max-width, 25vh top padding
   - Key Features:
     - Email field with fixed `@buffalo.edu` suffix
     - Auto-completion of domain
     - Magic link flow with resend capability (30s cooldown)
     - Step indicator dots (shows 1/3 and 2/3 progression)
     - Dev mode displays clickable magic link for testing
     - Fade transitions with silk easing `[0.22, 1, 0.36, 1]`

2. **`apps/web/src/app/auth/verify/page.tsx`**
   - Status: ✅ Production-ready
   - Flow: Verify magic link token → Auto-redirect
   - Key Features:
     - Extracts `oobCode`, `token`, `email`, `schoolId` from URL params
     - Loads email from localStorage if missing from URL
     - 3 states: loading → success → error
     - Success: "You're in" message with 1s auto-redirect
     - Error handling: Distinguishes expired/used/invalid links
     - Redirects: `/onboarding` if `needsOnboarding: true`, else `/feed`
     - Dev mode: Accepts dev tokens, sets localStorage session data

3. **`apps/web/src/app/onboarding/page.tsx`**
   - Status: ✅ Production-ready (rebuilt Nov 2025)
   - Flow: Handle selection → Name input → Leader intent
   - UX Pattern: Same as login (minimalist, 360px, animations)
   - Key Features:
     - **Step 1: Identity** (claimed title "Claim your handle")
       - Handle input with `@` prefix
       - Real-time availability check (300ms debounce)
       - Validation: `^[a-zA-Z0-9_]{3,20}$`
       - Auto-sanitizes input: lowercase, alphanumeric only
       - Status indicators: checking → available/taken/invalid
       - Suggestions when taken: `${value}_ub`, `${value}{random}`, etc.
       - Name field with space-splitting (first name / last name)
     - **Step 2: Leader** (titled "One more thing")
       - Question: "Are you leading a club or organization at UB?"
       - Yes: → `/spaces/claim` (space leader onboarding)
       - No: → `/feed` (feed discovery)

### Onboarding Components Directory
```
apps/web/src/app/onboarding/
├── page.tsx              # Main onboarding page
└── components/
    └── types.ts          # Type stubs (not actively used)
```

---

## Existing Auth/Onboarding UI Components

### Exported from `@hive/ui`

1. **`AuthOnboardingLayout`** (Template)
   - **Path**: `packages/ui/src/atomic/00-Global/templates/auth-onboarding-layout.tsx`
   - **Props**:
     ```ts
     mode?: "calm" | "warm" | "celebrate"
     headerSlot?: React.ReactNode
     footerSlot?: React.ReactNode
     children: React.ReactNode
     ```
   - **Features**:
     - Full-screen layout with dynamic background gradients
     - Mode-based styling: calm (neutral), warm (gold tint), celebrate (gold+secondary)
     - Overlay patterns with radial gradients
     - Header/footer with backdrop blur
     - Max-width 6xl container
   - **Status**: Exists but NOT used by current login/onboarding pages
   - **Note**: Built for future multi-step wizard UI (not the expert minimalist approach)

2. **`OnboardingFrame`** (Molecule)
   - **Path**: `packages/ui/src/atomic/00-Global/molecules/onboarding-frame.tsx`
   - **Props**:
     ```ts
     step?: number
     totalSteps?: number
     title?: string
     description?: string
     mode?: "calm" | "warm" | "celebrate"
     onBack?: () => void
     onContinue?: () => void
     continueLabel?: string
     continueDisabled?: boolean
     isSubmitting?: boolean
     children: React.ReactNode
     ```
   - **Features**:
     - Progress bar with spring animation
     - Title/description with fade-in
     - Back/Continue button navigation
     - Rounded container (3xl border)
     - Submission state with spinner
   - **Status**: Exists but NOT used by current onboarding page
   - **Note**: Designed for multi-step forms (architect's approach)

### Active Components in Login/Onboarding Pages

Current pages build their own minimal components inline:
- **StepIndicator**: 3 dots showing progression
- **Debounce utility**: For handle availability checks
- **Animation variants**: Fade in/out with silk easing
- **Input state indicators**: Checking/available/taken/invalid statuses

---

## The "Expert Layout Approach" (Explained by Commit e8e1816)

The rebuild introduced **minimalist, YC/SF-inspired design patterns**:

### What "Expert" Means
- **Confidence in simplicity** (OpenAI DNA)
- **Massive whitespace** and intentional padding
- **Typography does the work** (no decorative elements)
- **Every pixel intentional**
- **User-focused**, not form-focused

### Key Characteristics

| Aspect | Implementation |
|--------|-----------------|
| **Width** | Max 360px (mobile-first, focused) |
| **Vertical rhythm** | 25vh top padding (breathing room) |
| **Typography** | Text-xl font-medium (declarative titles) |
| **Animations** | Fade transitions with silk easing |
| **Error handling** | Inline validation, helpful suggestions |
| **Density** | Minimal, single column, one task per screen |
| **Progress signaling** | 3 dots (1/3, 2/3, 3/3) in top-right |
| **Mobile assumption** | Built for 80% mobile usage (CLAUDE.md) |

### Rejected (Old) Approach
The `AuthOnboardingLayout` + `OnboardingFrame` components represent the **"architect's approach"**:
- Multi-column layout (max-width 6xl)
- Rounded card containers
- Complex gradient backgrounds
- Designed for desktop-first

### Adopted (New) Approach
Simple, inline-built pages matching `DESIGN.md` philosophy:
- Focus on content (handle, name, decision)
- Minimal chrome
- Mobile-optimized
- User owns the experience (not form-driven)

---

## Auth-Logic Patterns (`packages/auth-logic/`)

### Key Files

1. **`src/hooks/use-auth.ts`** (Main auth hook)
   - Exports: `useAuth()` hook
   - Returns: `UseAuthReturn` interface
   - Key fields:
     ```ts
     user: AuthUser | null
     isLoading: boolean
     isAuthenticated: boolean
     error: AuthError | null
     onboardingCompleted: boolean  // Derived: !!handle && !!fullName
     ```
   - Features:
     - Firebase `onAuthStateChanged` listener
     - Development mode fallback (`dev_auth_mode` localStorage)
     - User data fetch from Firestore `users` collection
     - Session management via `SessionManager` singleton
     - Auto-redirect logic based on `onboardingCompleted`

2. **`src/session-manager.ts`**
   - Manages session state across auth state changes
   - Syncs with Firebase Auth lifecycle

3. **`src/firebase-error-handler.ts`**
   - Maps Firebase error codes to friendly messages
   - Handles auth-specific errors

4. **`src/error-handler.ts`**
   - Generic error handling for auth operations

5. **`src/firebase-config.ts`**
   - Firebase initialization
   - Exports: `auth` instance

### Exported API
```ts
export { useAuth } from "./hooks/use-auth";
export { auth } from "./firebase-config";
export { FirebaseErrorHandler, handleAuthError } from "./firebase-error-handler";
export { SessionManager } from "./session-manager";
```

---

## Auth API Routes (`apps/web/src/app/api/auth/`)

### Route: POST `/api/auth/send-magic-link`
- **Input**: `{ email: "user@buffalo.edu", schoolId: "ub" }`
- **Output**: `{ success: true, devMode?: true, magicLink?: string }`
- **Features**: Email validation, rate limiting, Firebase sending

### Route: POST `/api/auth/verify-magic-link`
- **Input**: `{ email, schoolId, token }`
- **Process**:
  1. Rate limit check
  2. Security validation with threat detection
  3. School domain validation (prod only)
  4. Firebase action code verification
  5. User record lookup or creation
  6. Session cookie creation
- **Output**: `{ success: true, needsOnboarding: boolean, userId, isAdmin?, devMode? }`
- **Campus Isolation**: Sets `campusId: schoolId || 'ub-buffalo'`
- **Admin Auto-Grant**: Checks `isAdminEmail()` and auto-grants admin claims

### Route: POST `/api/auth/check-handle`
- **Input**: `?handle=janedoe`
- **Process**: Query `handles` collection for availability
- **Output**: `{ available: boolean }`

### Route: POST `/api/auth/complete-onboarding`
- **Input**: `{ handle, firstName, lastName, major?, graduationYear?, ... }`
- **Process**:
  1. Auth validation
  2. Schema validation (Zod)
  3. User document update
  4. Session re-issue with `onboardingCompleted: true`
- **Output**: `{ success: true, user: { id, email, onboardingCompleted } }`

### Route: POST `/api/auth/resend-magic-link`
- Resends magic link with rate limiting

### Route: POST `/api/auth/logout`
- Clears session cookie
- Returns: `{ success: true }`

### Route: GET `/api/auth/session`
- Validates current session
- Returns user session data if valid

---

## Auth/Onboarding Documentation

### Available Docs

1. **`docs/DESIGN.md`** (Production Design System)
   - YC/SF visual identity ("Autonomous Rebellion")
   - Gold-only color philosophy (5% rule)
   - Confidence in simplicity principles
   - Motion/animation standards (silk easing, 200-400ms)
   - Performance budgets (<1s feed load, <100ms interactions)
   - Accessibility standards (WCAG 2.1 AA)

2. **`docs/ONBOARDING_AUTH_TODO.md`** (P0 Production Checklist)
   - Completed items:
     - Session cookie hardening
     - Server-only auth (no localStorage fallback)
     - Campus isolation enforcement
     - Admin auto-grant on login
   - High priority:
     - E2E magic link flow (send→verify→cookie→redirect)
     - Admin CSRF protection
     - Logout cookie clearing
     - Session secret validation (required in prod)
   - Medium priority:
     - Route wrapper consolidation
     - Auth fetch pattern standardization
   - Tests needed:
     - Playwright: Magic link happy path, admin CSRF, logout
     - Vitest: Session validation, admin checks

3. **`docs/firebase-auth-setup.md`**
   - Firebase project setup instructions
   - Magic link configuration

4. **`docs/firebase-auth-email-template.html`**
   - Email template for magic links

---

## User Journey Flow

### New User (Student)
```
1. /auth/login
   ├─ Input: jane@buffalo.edu
   └─ POST /api/auth/send-magic-link
      └─ Email sent with magic link

2. Click email link → /auth/verify?oobCode=...&email=...&schoolId=...
   ├─ Verify magic link token
   ├─ Create user doc in Firestore (empty profile)
   ├─ Set session cookie
   └─ Redirect → /onboarding (needsOnboarding: true)

3. /onboarding
   ├─ Input: handle, name
   ├─ Real-time availability check
   └─ POST /api/auth/complete-onboarding
      └─ Update user doc (profile complete)

4. Leader decision
   ├─ Yes → /spaces/claim (space leader flow)
   └─ No → /feed (student feed)
```

### Returning User
```
1. /auth/login → 2. /auth/verify → 3. /feed (needsOnboarding: false)
```

---

## Key Technical Patterns

### Campus Isolation
- **Enforced everywhere**: `campusId: 'ub-buffalo'` required in Firestore queries
- **Set on verification**: `verify-magic-link` route sets `campusId: schoolId || 'ub-buffalo'`
- **Propagated**: `useAuth()` hook includes `campusId` in user context

### Real-Time Handle Validation
```ts
// 300ms debounce to avoid hammering API
const checkHandle = useCallback(
  debounce(async (value: string) => {
    if (!handleRegex.test(value)) {
      setHandleStatus("invalid");
      return;
    }
    
    const response = await fetch(
      `/api/auth/check-handle?handle=${encodeURIComponent(value)}`
    );
    const data = await response.json();
    
    if (data.available) {
      setHandleStatus("available");
    } else {
      setHandleStatus("taken");
      // Generate suggestions
    }
  }, 300),
  []
);
```

### Session Management
- **Server-side JWT**: `createSession()` generates signed JWT
- **Cookie-based**: `setSessionCookie()` sets `HttpOnly` cookie
- **Production-only**: `SESSION_SECRET` required in production
- **Admin differentiation**: 24h for users, 4h for admins

### Error Handling
- **Production**: Logs audit events, returns generic error messages
- **Development**: Provides detailed error info and dev token bypass
- **Security**: Validates school domain (prod), user email matching, threat detection

---

## Component Status Summary

| Component | Location | Status | Used By | Notes |
|-----------|----------|--------|---------|-------|
| **Login page** | `auth/login/page.tsx` | ✅ Prod | Direct | Expert minimalist approach |
| **Verify page** | `auth/verify/page.tsx` | ✅ Prod | Direct | Magic link callback |
| **Onboarding page** | `onboarding/page.tsx` | ✅ Prod | Direct | Expert minimalist approach |
| **AuthOnboardingLayout** | `@hive/ui` template | ⚠️ Exists | None currently | Alternative architect approach |
| **OnboardingFrame** | `@hive/ui` molecule | ⚠️ Exists | None currently | Alternative architect approach |
| **useAuth hook** | `@hive/auth-logic` | ✅ Prod | App-wide | Session & onboarding tracking |

---

## Decisions & Architecture Notes

### Why Not Use `AuthOnboardingLayout` + `OnboardingFrame`?
- Too heavy for mobile-first UX (80% mobile usage)
- Contradicts DESIGN.md "confidence in simplicity" principle
- The expert approach (rebuild) favored minimal, focused pages over reusable containers
- Better performance: inline code vs. component composition

### Why Inline Components?
- Simpler to reason about (300 lines vs. 3+ component files)
- Optimized for single-use pages (login, verify, onboarding)
- Easier to customize per-step (animations, validation differ per page)
- Matches YC/SF pattern of focused, confident UX

### Verification Token Format
- **Production**: Firebase action codes (checked via `checkActionCode()`)
- **Development**: Custom JWT (base64url-encoded JSON)
- Fallback in dev: Bypasses Firebase verification if action code fails

### Why 3-Step Indicator?
1. Email/login
2. Verification
3. Onboarding (or feed for returning users)
Shows user they're 1/3 through a focused flow

---

## Next Steps for Builders

If extending auth/onboarding:

1. **Keep the minimalist pattern** — Don't revert to `AuthOnboardingLayout`
2. **Maintain 360px width** — Mobile-first is non-negotiable
3. **Use silk easing** — `[0.22, 1, 0.36, 1]` for consistency
4. **Add campus isolation** — Every API route must validate `campusId`
5. **Test magic link flow** — E2E tests needed per ONBOARDING_AUTH_TODO.md
6. **Update design docs** — If adding new steps, document in DESIGN.md

---

**Generated**: Nov 22, 2025  
**Exploration Level**: Medium (800+ lines read, 10 files examined, architecture documented)
