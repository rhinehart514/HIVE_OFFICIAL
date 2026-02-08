# Auth, Identity & Sessions: Making It Flawless

**Date:** 2026-02-07
**Status:** Ideation
**Scope:** Everything between a student typing their email and trusting HIVE with their campus life.

---

## Current System Summary

Before options, here is what actually exists in the codebase today:

**Auth flow** (`/enter` for signup, `/login` for returning users):
- Email submitted with schoolId to `POST /api/auth/send-code` (Resend/SendGrid)
- 6-digit OTP, SHA256 hashed, stored in Firestore `verification_codes` collection
- Verified via `POST /api/auth/verify-code` -- 5 attempts max, 1-min lockout, 10-min code TTL
- On success: `createTokenPair()` issues access (15 min, HS256 JWT in `hive_session` cookie) + refresh (7 days, `hive_refresh` cookie with `path=/api/auth`, `sameSite=strict`)
- Profile completion via `POST /api/auth/complete-entry` -- handle reservation, auto-join spaces, re-issues token pair with `onboardingCompleted: true`

**Session architecture** (`apps/web/src/lib/session.ts`):
- Edge middleware (`apps/web/src/middleware.ts`) does lightweight JWT verification for route protection
- API middleware (`apps/web/src/lib/middleware/auth.ts`) does full verification with session revocation check
- Client-side: `useAuth()` hook (`packages/auth-logic/src/hooks/use-auth.ts`) fetches from `/api/auth/me`, schedules proactive refresh 2 min before expiry, handles cross-tab sync via localStorage events
- Revocation: in-memory `Map<string, number>` + Firestore `revokedSessions`/`revokedUserSessions` collections, 10-min cleanup interval

**Campus isolation** (`apps/web/src/lib/campus-context.ts`):
- Domain-to-campus mapping loaded from Firestore `schools` collection, cached 5 min
- Hardcoded fallback: `buffalo.edu` / `ub.edu` -> `ub-buffalo`
- `deriveCampusFromEmail()` in auth middleware maps email domain to campusId
- 713 occurrences of `ub-buffalo` across 167 files

**Bot protection:**
- App Check configured (`packages/firebase/src/app-check.ts`) but gated behind `NEXT_PUBLIC_ENABLE_APP_CHECK` flag, NOT enforced on any auth endpoint
- Edge middleware rate limiting: 300/min global, 30/min for `/api/auth/`
- Route-level rate limiting: `signinCode` preset (5/5min), `magicLink` preset on verify
- Origin validation on pre-auth endpoints

---

## 1. Returning User Experience

The `/login` page exists (`apps/web/src/app/login/page.tsx`) with `useLoginMachine` (`apps/web/src/components/login/hooks/useLoginMachine.ts`). It works: email -> code -> welcome back. But there are real gaps.

### Option A: OTP-Only (Current Path, Polished)

Keep the existing OTP flow for both signup and login. Focus on making it seamless rather than adding new auth methods.

**What to build:**
- Email field auto-suggests `@buffalo.edu` suffix when user starts typing (campus-aware)
- "Last signed in as jane@buffalo.edu" cookie hint on `/login` (non-sensitive data only -- store first name + masked email in a non-httpOnly `hive_hint` cookie, 30-day TTL)
- Auto-submit when 6th digit entered (already partially there in `CodeState`)
- "Remember this device" checkbox: extend refresh token from 7 days to 90 days, store device fingerprint hash alongside sessionId in `userSessions` collection

**What breaks:** Students who check email infrequently (checking campus email for an OTP is friction). No offline login. Every session start requires email access.

**Implementation touchpoints:**
- `apps/web/src/lib/session.ts` -- add `EXTENDED_REFRESH_TOKEN_MAX_AGE = 90 * 24 * 60 * 60`
- `apps/web/src/app/api/auth/verify-code/route.ts` -- accept `rememberDevice: boolean` in body, pass to `createTokenPair()`
- New non-httpOnly cookie setter for the hint cookie in `setTokenPairCookies()`

### Option B: OTP + Magic Link Hybrid

Add email magic links as an alternative to OTP. Same send-code endpoint generates both, user picks their preference.

**What to build:**
- `POST /api/auth/send-code` accepts `{ method: 'otp' | 'link' }` -- default OTP for mobile, link for desktop
- Magic link: signed JWT with 10-min expiry, single-use, includes `email`, `campusId`, `nonce`. URL pattern: `/api/auth/verify-link?token=xxx`
- Client auto-detects: if user is on mobile, show OTP. If desktop, show "Check your email for a link" with OTP fallback
- Link opens in same browser -> session cookie set -> redirect to `/spaces`

**What breaks:** Magic links open in the default browser, which may not be the one the user started in (especially iOS where Gmail opens links in Safari). Cross-device link forwarding is a support nightmare. Two code paths to maintain.

**Implementation touchpoints:**
- New route `apps/web/src/app/api/auth/verify-link/route.ts`
- Schema change in `send-code/route.ts` to accept `method` field
- New email template for magic link HTML
- `apps/web/src/lib/session.ts` -- new `createMagicLinkToken()` function

### Option C: Passkeys (WebAuthn) as Primary, OTP as Fallback

After first OTP login, prompt users to register a passkey (Face ID, Touch ID, Windows Hello). Future logins use passkey -- zero friction, phishing-resistant.

**What to build:**
- `POST /api/auth/passkey/register` -- generate challenge, store credential ID + public key in `userCredentials` collection
- `POST /api/auth/passkey/authenticate` -- verify assertion, issue token pair
- Registration prompt after first successful login (modal with "Make signing in faster" CTA)
- Fallback to OTP always available
- Device management in `/settings?section=account` -- list registered passkeys, revoke

**What breaks:** Passkey support is browser-dependent (Safari and Chrome good, Firefox still catching up in 2026). Students using shared/lab computers can not use passkeys there. Requires `@simplewebauthn/server` dependency. More complex credential storage. But the UX upside is massive -- tap and you are in.

**Implementation touchpoints:**
- New package or util: `apps/web/src/lib/passkey.ts` with `@simplewebauthn/server`
- New routes: `apps/web/src/app/api/auth/passkey/register/route.ts`, `apps/web/src/app/api/auth/passkey/authenticate/route.ts`
- New Firestore collection: `userCredentials` (userId, credentialId, publicKey, createdAt, lastUsedAt, deviceName)
- Post-login prompt component in `apps/web/src/components/entry/` or a global modal

**Recommendation:** Start with Option A (polish the OTP flow, add "remember this device"), ship it, then build Option C as a progressive enhancement. Passkeys are the future of auth and HIVE should get there, but only after the OTP baseline is solid.

---

## 2. Token Security Hardening

### Current Gaps

1. **No refresh token rotation with revocation of old tokens.** The `/api/auth/refresh` endpoint issues a new token pair but does NOT invalidate the old refresh token. If a refresh token is stolen, attacker can use it indefinitely until 7-day expiry.

2. **No token binding.** Refresh token is not bound to any device/client identifier. Stolen cookie = full account access.

3. **In-memory revocation is per-instance.** `revokedSessions` Map in `session-revocation.ts` only syncs to Firestore asynchronously. On Vercel, each serverless invocation gets a cold start with empty maps. The `syncedFromFirestore` flag + async Firestore check covers this, but adds latency on every cold start.

4. **HS256 symmetric signing.** `session.ts` uses `HS256` with a single `SESSION_SECRET`. If the secret leaks, attacker can forge any session. RS256 with asymmetric keys would limit blast radius.

### Option A: Refresh Token Rotation with Family Tracking

**How it works:**
- Each token pair shares a `familyId` (set on initial login)
- On refresh: issue new pair, store old refresh token hash in `usedRefreshTokens` set for the family
- If a used (rotated-out) refresh token is presented again: revoke the entire family (attacker replaying stolen token)
- Store in Firestore: `refreshTokenFamilies/{familyId}` with `{ userId, currentTokenHash, usedTokenHashes[], createdAt, lastRotatedAt }`

**What breaks:** Adds a Firestore read + write on every refresh. Network failures during rotation can orphan the old token (client got new pair but Firestore write failed). Need idempotency: if client retries refresh with the same token and rotation succeeded, return the same new pair.

**Implementation touchpoints:**
- `apps/web/src/lib/session.ts` -- add `familyId` to `RefreshTokenData`, new `rotateRefreshToken()` function
- `apps/web/src/app/api/auth/refresh/route.ts` -- add family tracking logic, reuse detection
- New Firestore collection: `refreshTokenFamilies`

### Option B: Token Binding via Device Fingerprint

**How it works:**
- On login, generate a `deviceId` (hash of User-Agent + screen resolution + timezone + platform, sent from client)
- Store `deviceId` hash in refresh token claims
- On refresh, recalculate `deviceId` from request headers and compare
- Mismatch = reject refresh, force re-authentication

**What breaks:** Browser updates change User-Agent. VPN/network changes shift fingerprint. Students switching between laptop and phone get logged out unexpectedly. Fingerprinting is inherently fragile -- false rejections are worse than no binding at all.

**Compromise:** Use a weaker binding: store `User-Agent` family (Chrome/Safari/Firefox, not full UA string) in the refresh token. This catches "token stolen and used from completely different client" without breaking on minor browser updates.

**Implementation touchpoints:**
- `apps/web/src/app/api/auth/verify-code/route.ts` -- capture UA family on login
- `apps/web/src/lib/session.ts` -- add `uaFamily` to `RefreshTokenData`
- `apps/web/src/app/api/auth/refresh/route.ts` -- compare UA family on refresh

### Option C: Move to RS256 Asymmetric Signing

**How it works:**
- Generate RSA key pair. Private key signs tokens (server only). Public key verifies (can be shared with edge middleware, other services)
- Edge middleware verifies with public key only -- no secret exposure at the edge
- Key rotation: support multiple public keys (JWKS), rotate private key periodically

**What breaks:** RS256 tokens are larger (~3x). Edge middleware verification is slower (RSA vs HMAC). Key management adds operational complexity (key rotation, secure storage). For a single-app monolith like HIVE, the security gain over HS256 is marginal -- the secret is only in one place (Vercel env vars).

**When it matters:** When HIVE has multiple services that need to verify tokens independently. Not yet.

**Recommendation:** Implement Option A (refresh token rotation with family tracking) immediately -- it is the highest-impact security improvement. Add weak token binding (Option B compromise) as a secondary check. Defer RS256 until multi-service architecture emerges.

---

## 3. Multi-Campus Identity

Currently: 713 references to `ub-buffalo` across 167 files. Campus context is derived from email domain via `campus-context.ts` with a Firestore-backed `schools` collection.

### Option A: Single Account, Primary Campus + Guest Access

**Model:**
- User has one account with a `primaryCampusId` (derived from their `.edu` email at registration)
- All data (spaces, posts, profile) is scoped to `primaryCampusId`
- When HIVE launches at a second campus, users from Campus A can NOT see Campus B content (current behavior, works correctly)
- Transfer students: change `primaryCampusId` via admin action + email re-verification with new `.edu` address
- No cross-campus interaction by default

**What breaks:** Transfer students need admin intervention to switch campuses. Students with dual enrollment (e.g., community college + university) can not participate in both. No concept of "visiting" another campus.

**Implementation touchpoints:**
- Minimal code changes -- this is essentially the current model
- Add `POST /api/auth/campus-transfer` admin endpoint
- Add `previousCampusIds` array to user doc for history tracking

### Option B: Single Account, Multiple Campus Memberships

**Model:**
- User has one account with one `primaryCampusId` + array of `campusMemberships`
- Primary campus: full access (create spaces, post, all features)
- Secondary campus: join-only access (can join existing spaces, read, comment, but not create)
- Campus switching: user picks active campus from UI dropdown, session token re-issued with new `campusId`
- Verification: each campus membership requires email verification from that campus's domain

**What breaks:** `campusId` is baked into every query filter in HIVE. Switching campuses means re-issuing the JWT (touching `session.ts` `createTokenPair()`), refreshing all client-side caches (`use-auth.ts` needs to invalidate TanStack Query cache), and handling the UX of "which campus am I looking at right now." Every API route that calls `getCampusId(req)` works correctly without changes -- but the UI needs a campus switcher, and feeds/search need to respect the active campus.

**Implementation touchpoints:**
- User doc: add `campusMemberships: [{ campusId, role: 'primary' | 'member', verifiedAt, email }]`
- `apps/web/src/lib/session.ts` -- `SessionData` gets `activeCampusId` (separate from `primaryCampusId`)
- New route: `POST /api/auth/switch-campus` -- re-issues token pair with new `campusId`
- New route: `POST /api/auth/add-campus` -- email verification for second campus
- UI: campus switcher in `AppShell` header (small, not prominent -- most students are at one school)

### Option C: Federated Identity with Campus as Tenant

**Model:**
- Each campus is a full tenant with its own namespace
- User accounts are campus-scoped (like Slack workspaces)
- A student at two campuses has two separate accounts
- Optional: link accounts under a single "HIVE ID" for profile portability
- Data is fully isolated at the infrastructure level (Firestore subcollections per campus, or separate projects)

**What breaks:** Two accounts = two profiles, two handles, two sets of spaces. No shared identity. Infrastructure complexity scales linearly with campus count. Onboarding at a second campus is the full flow again. This is Slack's model, not Discord's model -- and HIVE's vibe is closer to Discord (one identity, many communities).

**Recommendation:** Start with Option A (single campus, clean boundaries). When the second campus launches, implement Option B -- but only the primary/secondary distinction, not full campus switching. The "join-only" secondary campus model keeps things simple while allowing organic cross-pollination. Defer Option C forever -- HIVE is one platform, not a white-label solution.

### Hardcoded Reference Cleanup

Before any multi-campus work, the 713 `ub-buffalo` references must be resolved. Most are in:
- Scripts and seed files (acceptable -- these are UB-specific tooling)
- Test fixtures (need parameterizing)
- Runtime code in `campus-context.ts`, `middleware/auth.ts` as fallbacks (need to become dynamic)
- `.next.bak/` cached build output (delete this directory)

Priority: grep for `ub-buffalo` in `apps/web/src/` and `packages/` excluding tests and scripts. Those are the runtime references that will break multi-campus.

---

## 4. Progressive Trust

Currently: 7-day account age gate for space creation (`apps/web/src/app/api/spaces/route.ts`), builder role requests for advanced HiveLab tools. No formalized trust system.

### Option A: Implicit Trust Tiers (Derived from Activity)

**Tiers:**

| Tier | Name | Criteria | Unlocks |
|------|------|----------|---------|
| 0 | Newcomer | Just verified email | Join spaces, read content, react |
| 1 | Member | 48h account age + profile complete + joined 1 space | Post in spaces, comment, DM (when enabled) |
| 2 | Established | 7d account age + 5 posts/comments + member of 2+ spaces | Create spaces, claim leadership |
| 3 | Builder | 14d + established + admin-approved builder request | HiveLab access, advanced tools |

**How it works:**
- Trust tier is computed on-the-fly from user document fields (`createdAt`, `postCount`, `spaceCount`, `builderOptIn`)
- No separate "trust" collection -- derive from existing data
- `getTrustTier(userId)` utility function checks criteria, returns tier number
- API routes check tier: `if (trustTier < 2) return respond.error('Need established status', 'INSUFFICIENT_TRUST')`
- UI shows progress toward next tier in profile/settings

**What breaks:** Computing trust tier requires reading user doc + querying post count + space membership count on every request that gates on trust. Caching the tier in the JWT avoids this but means changes are not reflected until next token refresh (15 min delay). Students who want to create a space on day 1 are blocked -- need clear messaging about why and when.

**Implementation touchpoints:**
- New util: `apps/web/src/lib/trust-tier.ts` with `getTrustTier(userId)` and `TRUST_TIERS` config
- Add `trustTier` to `SessionData` in `session.ts` (cached in JWT, refreshed on token refresh)
- `apps/web/src/app/api/spaces/route.ts` -- replace hardcoded 7-day check with `trustTier >= 2`
- Profile UI: progress indicator component

### Option B: Explicit Reputation System

**How it works:**
- Users earn "trust points" for specific actions (verified email: 10, complete profile: 20, first post: 5, etc.)
- Trust points stored as `trustScore` on user doc
- Thresholds unlock features (100 points = create space, 500 = builder access)
- Admin can manually adjust trust score
- Negative actions reduce score (reported content: -10, content removed by mod: -50)

**What breaks:** Gamification risk -- students optimize for points rather than genuine participation. Point values are arbitrary and need constant tuning. Score manipulation via spam posts. More complex than tier-based approach with minimal UX benefit. Students do not care about points -- they care about access.

### Option C: Campus-Verified Trust Boost

**How it works:**
- Base trust from account age + activity (like Option A)
- Campus-specific trust boost: if a student is a verified org leader on CampusLabs/OrgSync, auto-promote to Established tier
- Faculty/staff email domains (`@admin.buffalo.edu`) get automatic Established status
- Student government members identified via campus API integration get Builder access
- Existing org leaders who claim their space on HIVE skip the 7-day gate

**What breaks:** Requires integration with campus systems (CampusLabs API, which HIVE already scrapes in `scripts/sync-campuslabs-orgs.mjs`). Trust boost is campus-specific -- does not generalize. Privacy concerns with pulling campus role data.

**Recommendation:** Option A with one addition from Option C: let org leaders who claim their CampusLabs space skip the creation gate. Keep trust tiers implicit and simple. Never show a "trust score" number -- show action-oriented messaging: "Create your own space after being active for a week."

---

## 5. Session Management UX

### Current State

The backend is mostly built:
- `GET /api/auth/sessions` -- lists active sessions with masked IDs, marks current
- `DELETE /api/auth/sessions/[sessionId]` -- revokes specific session
- `DELETE /api/auth/sessions` -- revokes all sessions
- `getUserActiveSessions()` in `session-revocation.ts` queries `userSessions` collection

But there is no frontend for any of this. Session data is not written to `userSessions` on login. The `getUserActiveSessions()` function queries a collection that is never populated.

### Option A: Minimal Session Management (Ship Fast)

**What to build:**
- Write session metadata to `userSessions` collection on login (`verify-code/route.ts` and `refresh/route.ts`)
  - Fields: `sessionId`, `userId`, `createdAt`, `lastActiveAt`, `userAgent`, `ip` (hashed for privacy), `deviceType` (mobile/desktop/tablet)
- Settings page section (`/settings?section=account`) with:
  - "Active Sessions" list showing device type icon + browser + approximate location (city from IP) + "Current" badge
  - "Sign out" button per session
  - "Sign out everywhere" button at bottom
- Update `lastActiveAt` on token refresh (not on every request -- too expensive)

**What breaks:** IP-based location is inaccurate (VPNs, campus NAT). Storing IP hashes may still be a privacy concern. Device detection from User-Agent is imperfect. But students expect to see this -- every major platform (Google, Instagram, Spotify) has it.

**Implementation touchpoints:**
- `apps/web/src/app/api/auth/verify-code/route.ts` -- add `dbAdmin.collection('userSessions').doc(sessionId).set(...)` after token creation
- `apps/web/src/app/api/auth/refresh/route.ts` -- update `lastActiveAt` on the session doc
- New component: `apps/web/src/components/settings/ActiveSessions.tsx`
- Hook: `apps/web/src/hooks/use-active-sessions.ts` calling `GET /api/auth/sessions`

### Option B: Session Management + Suspicious Login Alerts

Everything in Option A, plus:

- **New device detection:** On login, compare incoming `deviceType + browser + approximate location` against previous sessions. If no match, flag as "new device."
- **Email notification:** "New sign-in to your HIVE account from Chrome on macOS in Buffalo, NY. If this wasn't you, secure your account." with "Secure my account" link that revokes all other sessions.
- **In-app notification:** Banner on first load after new device login: "Signed in from a new device. Not you?"
- **Audit log:** `authAuditLog` collection with all login events (already partially built in `production-auth.ts`)

**What breaks:** Email notification on every new device login is noisy for students who use multiple devices. "New device" detection has false positives (browser update = "new device"). The "secure your account" flow needs to work even if the attacker changed the session -- revoke by user ID, not session ID (already supported via `revokeAllUserSessionsAsync`).

### Option C: Full Security Dashboard

Everything in Option B, plus:

- Login history timeline (last 30 days)
- "Trusted devices" management -- mark devices as trusted to suppress new-device alerts
- Two-factor authentication option (TOTP via authenticator app) for high-value accounts (org leaders, admins)
- Security score / checklist: "Your account security: 3/5" with actionable items

**What breaks:** Over-engineering for a campus social platform. Students will not use 2FA. Security dashboard is a feature for enterprise SaaS, not for a platform where the barrier to entry is a `.edu` email. The only users who need this level of control are admins, and they have a separate admin dashboard already (`apps/admin`).

**Recommendation:** Option A now, Option B's email notification on genuinely suspicious logins (new city, not just new device) in the next sprint. Skip Option C entirely.

---

## 6. Bot Protection

### Current Gaps

1. **App Check exists but is not enforced.** `packages/firebase/src/app-check.ts` has the full setup with ReCaptcha V3, but `NEXT_PUBLIC_ENABLE_APP_CHECK` is presumably `false` in production. No auth endpoint checks for App Check tokens.

2. **Rate limiting is IP-based at the edge.** The edge middleware (`middleware.ts`) rate limits at 30/min for `/api/auth/`. But campus NAT means hundreds of students share the same IP. Legitimate users get rate limited. Per-email rate limiting exists in `send-code/route.ts` (10 codes/hour/email) but not at the middleware level.

3. **No CAPTCHA on signup.** The send-code endpoint validates email domain and rate limits, but has no bot detection.

4. **User-Agent blocking is minimal.** `production-auth.ts` `shouldBlockRequest()` blocks sqlmap/nikto/nmap but is never called from auth endpoints.

### Option A: App Check Enforcement (Low Friction)

**What to build:**
- Set `NEXT_PUBLIC_ENABLE_APP_CHECK=true` and `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in Vercel env
- Add App Check token verification to `send-code` and `verify-code` routes:
  ```
  const appCheckToken = request.headers.get('X-Firebase-AppCheck');
  if (isProduction && !appCheckToken) {
    return respond.error('App verification required', 'APP_CHECK_FAILED', { status: 403 });
  }
  // Verify token server-side via Firebase Admin
  ```
- Client: call `addAppCheckHeader()` before auth API calls (already exported from `app-check.ts`)
- Gradual rollout: enforce in "monitor" mode first (log failures, do not block), then enforce after 1 week of data

**What breaks:** ReCaptcha V3 scores can be unreliable. Low-score users (e.g., using a VPN, non-standard browser) get blocked with no recourse. Mobile web has lower ReCaptcha scores by default. Need a fallback path for legitimate users who fail App Check.

**Implementation touchpoints:**
- `apps/web/src/app/api/auth/send-code/route.ts` -- add App Check header check
- `apps/web/src/app/api/auth/verify-code/route.ts` -- add App Check header check
- Server-side verification: `apps/web/src/lib/app-check-server.ts` (referenced in `app-check.ts` comments but may not exist yet)
- Client entry flow: inject App Check header into fetch calls in `useLoginMachine.ts` and `useEntry.ts`

### Option B: Smart Rate Limiting (Campus-Aware)

**What to build:**
- Replace IP-based rate limiting on auth endpoints with email-domain-based limiting
- Allow higher per-IP limits for known campus IP ranges (configure per school in Firestore: `schools/{id}/ipRanges`)
- Per-email rate limiting already exists (10/hour) -- tighten to 5/hour in production
- Add progressive delays: 1st code instant, 2nd code after 30s, 3rd after 60s, 4th after 120s
- Block known VPN/datacenter IP ranges on auth endpoints only (students using VPNs for browsing is fine, but creating accounts from AWS IPs is suspicious)

**What breaks:** Campus IP ranges change. VPN detection has false positives (students on legitimate university VPNs). Progressive delays frustrate students who mistyped their email and need to re-request quickly.

**Implementation touchpoints:**
- `apps/web/src/lib/secure-rate-limiter.ts` -- add campus-aware IP whitelist check
- `apps/web/src/app/api/auth/send-code/route.ts` -- implement progressive delay logic
- Firestore: add `ipRanges` field to `schools` collection

### Option C: Proof of Humanity via Campus Integration

**What to build:**
- After email verification, require one additional signal:
  - Option 1: Verify student ID number (check against campus directory API if available)
  - Option 2: Require invitation from an existing HIVE member (social proof)
  - Option 3: Time-gated launch -- only allow signups during specific campus events where HIVE ambassadors verify in person
- Bot accounts that slip through: community reporting mechanism + admin review queue

**What breaks:** Campus directory APIs are gated, slow, and unreliable. Invitation-only limits organic growth. Event-gated signup does not scale. The `.edu` email requirement is already a strong bot filter -- very few bots have `.edu` email access.

**Recommendation:** Option A (App Check enforcement) immediately -- it is already built, just needs to be turned on. Option B (campus-aware rate limiting) alongside it. Skip Option C -- the `.edu` email gate is a sufficient humanity check. The real threat is not bots creating accounts, it is bots hammering the OTP endpoint to enumerate valid emails or brute-force codes (already mitigated by 5-attempt lockout + SHA256 hashing).

---

## 7. Recovery & Edge Cases

### 7a. Lost Access to Campus Email (Graduated)

**Current state:** `apps/web/src/app/api/auth/alumni-waitlist/route.ts` exists -- captures alumni who want to rejoin old spaces. But there is no actual alumni access path.

**Option A: Alumni Read-Only Mode**

- Alumni accounts transition when email verification fails (domain check returns `alumni` status from school's `emailDomains.alumni` array)
- Read-only access: can view spaces they were members of, cannot post/create/join new
- Profile badge: "Alumni" indicator
- Re-verification: if alumni gets a new `.edu` email (grad school), can re-verify and regain full access

**What breaks:** Alumni email domains vary wildly (`@alumni.buffalo.edu` vs `@buffalo.edu` for current students). Some schools do not have separate alumni domains. How do you verify someone is an alum if their email is deactivated?

**Option B: Alumni Verification via Alternate Email + Admin Approval**

- Alumni adds personal email to account before graduating (prompted at graduation year)
- After `.edu` email stops working, alumni can log in via personal email but account is frozen pending admin verification
- Admin checks: is this person in the alumni database? Were they a real user before graduation?
- Approved alumni get read-only access (Option A model)

**What breaks:** Requires students to add personal email proactively. Most will not. Admin verification does not scale beyond a handful of requests.

**Recommendation:** Warn students approaching graduation year to download their data. Offer alumni read-only access if the school provides an alumni email domain. Otherwise, accounts go dormant -- data preserved but inaccessible. This is a problem that matters at scale (year 2+), not at launch.

### 7b. Account Merge (Transferred Schools)

**Scenario:** Student at UB transfers to RIT. HIVE launches at RIT. Student wants to carry their HIVE identity.

**Option A: Admin-Mediated Transfer**

- Student contacts support. Admin verifies:
  1. Student can verify new school email
  2. Student can verify old school email (or prove identity via account details)
- Admin triggers transfer: `primaryCampusId` updated, old campus data archived, handle preserved
- Campus-specific data (space memberships, posts) stays at old campus -- not migrated

**Option B: Self-Service Transfer Flow**

- `/settings?section=account` has "Transfer to new school"
- Step 1: Verify new `.edu` email (same OTP flow)
- Step 2: Choose what to keep (handle, profile info) vs. what stays behind (space memberships)
- Step 3: New token pair issued with new `campusId`
- Old account data marked `transferredTo: newUserId` in Firestore

**What breaks:** Handle collision -- student's handle might be taken at the new campus. Space memberships are campus-scoped and can not transfer. Social graph (followers, DMs) is lost. This is essentially creating a new account with profile data seeded from the old one.

**Recommendation:** Option A for now. Self-service transfer is a post-scale feature. At launch, the number of transfer students between two HIVE campuses is zero.

### 7c. Handle Disputes

**Current state:** Handles are reserved atomically in `complete-entry/route.ts` via Firestore transactions. First-come-first-served. No dispute mechanism.

**What to build:**

- Admin endpoint: `POST /api/admin/handles/transfer` -- transfers handle from one user to another
- Policy: if an official campus organization (verified via CampusLabs data) wants a handle that a student took, the org gets priority after a 14-day notice period to the current holder
- Student-to-student: no intervention. "First verified, first served." If your name is John Smith and `johnsmith` is taken, you get `johnsmith26`.
- Handle changes: allow one free handle change per year via `/settings?section=profile`. Old handle is released after 30-day hold period (prevents squatting via rapid cycling).

**Implementation touchpoints:**
- New admin route: `apps/web/src/app/api/admin/handles/transfer/route.ts`
- Handle change: `PUT /api/auth/update-handle` -- check availability, reserve new, schedule old release
- Firestore: `releasedHandles` collection with TTL for 30-day hold
- User doc: `handleChangedAt` timestamp, `handleChangeCount` for rate limiting

### 7d. Session Corruption / Cookie Clearing

**Scenario:** Student clears browser cookies, or uses incognito mode, or switches browsers. All session state is lost.

**Current behavior:** Redirect to `/` landing page, student must re-enter email and OTP. This is correct behavior but feels jarring.

**Improvement:**
- The `hive_hint` cookie (from Section 1, Option A) survives if it is a separate, non-httpOnly cookie with longer TTL
- When session cookie is missing but hint cookie exists: show `/login` pre-filled with their name and masked email
- "Welcome back, Jane. Verify your email to continue." -- one-tap resend, not the full entry flow

---

## Implementation Priority

If I had to ship improvements in order:

1. **Refresh token rotation** (Section 2, Option A) -- biggest security gap, ~2 days of work
2. **App Check enforcement** (Section 6, Option A) -- already built, just needs activation, ~1 day
3. **Session metadata persistence** (Section 5, Option A) -- `userSessions` collection writes, ~1 day
4. **"Remember this device"** (Section 1, Option A) -- 90-day refresh token option, ~0.5 day
5. **Trust tiers** (Section 4, Option A) -- replaces hardcoded 7-day gate, ~2 days
6. **Session management UI** (Section 5, Option A) -- settings page component, ~2 days
7. **Hardcoded `ub-buffalo` cleanup** (Section 3) -- prerequisite for second campus, ~3 days
8. **Multi-campus memberships** (Section 3, Option B) -- only when second campus is confirmed

---

## File Reference

All files analyzed for this document:

| File | Role |
|------|------|
| `apps/web/src/lib/session.ts` | JWT creation, verification, token pair management, cookie handling |
| `apps/web/src/lib/session-revocation.ts` | In-memory + Firestore revocation, cleanup timers |
| `apps/web/src/middleware.ts` | Edge middleware: rate limiting, route protection, JWT verification |
| `apps/web/src/lib/middleware/auth.ts` | API auth middleware: session verification, campus derivation, admin auth |
| `apps/web/src/lib/middleware/index.ts` | Middleware composition: withAuthAndErrors, CSRF, rate limiting |
| `apps/web/src/app/api/auth/send-code/route.ts` | OTP generation, email delivery (Resend/SendGrid) |
| `apps/web/src/app/api/auth/verify-code/route.ts` | OTP verification, session creation, lockout logic |
| `apps/web/src/app/api/auth/refresh/route.ts` | Token refresh, user validation |
| `apps/web/src/app/api/auth/complete-entry/route.ts` | Onboarding completion, handle reservation, auto-join |
| `apps/web/src/app/api/auth/me/route.ts` | Session endpoint, user data fetch, expiration info |
| `apps/web/src/app/api/auth/logout/route.ts` | Session revocation, cookie clearing |
| `apps/web/src/app/api/auth/sessions/route.ts` | Session listing and bulk revocation |
| `apps/web/src/app/api/auth/sessions/[sessionId]/route.ts` | Single session revocation |
| `apps/web/src/app/api/auth/alumni-waitlist/route.ts` | Alumni waitlist capture |
| `apps/web/src/app/login/page.tsx` | Returning user login UI |
| `apps/web/src/app/enter/page.tsx` | New user entry flow UI |
| `apps/web/src/components/login/hooks/useLoginMachine.ts` | Login state machine |
| `apps/web/src/hooks/use-session.ts` | Legacy session hook wrapper |
| `apps/web/src/lib/campus-context.ts` | Domain-to-campus mapping, school data caching |
| `apps/web/src/lib/security-middleware.ts` | Origin validation, security headers, input sanitization |
| `apps/web/src/lib/secure-rate-limiter.ts` | Redis-backed rate limiting with in-memory fallback |
| `apps/web/src/lib/dev-auth-bypass.ts` | Development auth bypass (triple-gated) |
| `apps/web/src/lib/production-auth.ts` | Auth event auditing, bot detection |
| `apps/web/src/lib/middleware/capability-guard.ts` | HiveLab capability enforcement |
| `packages/auth-logic/src/hooks/use-auth.ts` | Client auth hook: session fetch, token refresh, cross-tab sync |
| `packages/firebase/src/app-check.ts` | App Check setup (ReCaptcha V3), token management |
