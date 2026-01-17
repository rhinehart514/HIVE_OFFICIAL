# HIVE Platform Audit - Critical Issues

**Date:** January 15, 2026
**Auditor:** YC-style ruthless product review
**Scope:** Complete authenticated frontend experience

---

## SEVERITY LEGEND
- **P0 CRITICAL** - Blocks core user flows, must fix immediately
- **P1 HIGH** - Significant UX degradation, fix this week
- **P2 MEDIUM** - Noticeable issues, fix this sprint
- **P3 LOW** - Polish items, backlog

---

## P0 CRITICAL - Navigation Architecture Broken

### NAV-001: Desktop sidebar missing essential nav items
**Location:** `packages/ui/src/shells/UniversalShell.tsx:446-459`
**Issue:** Desktop sidebar only has Browse + Settings. Missing:
- HiveLab/Tools (mobile has it, desktop doesn't!)
- Profile (only accessible via avatar)
- Notifications page
- Events/Calendar

**Impact:** Users cannot navigate to HiveLab from desktop. Must type URL directly.

**Fix:** Add to SidebarFooter:
```typescript
<SidebarNavItem icon={<ToolsIcon />} label="HiveLab" path="/tools" />
<SidebarNavItem icon={<ProfileIcon />} label="Profile" path="/profile" />
```

### NAV-002: "Your Tools" section never shows for new users
**Location:** `packages/ui/src/shells/UniversalShell.tsx:424`
**Issue:** `{isBuilder && tools.length > 0}` - condition requires BOTH being a builder AND having tools
**Impact:** New users see no tools section, can't discover HiveLab

**Fix:** Always show HiveLab nav item in footer, regardless of builder status.

### NAV-003: Mobile vs Desktop nav inconsistency
**Issue:**
- Mobile: Spaces, Lab, Profile
- Desktop: Browse, Settings only
**Impact:** Completely different navigation mental model between devices

---

## P0 CRITICAL - Fake/Mock Data Still Present

### DATA-001: Profile page shows fake activity data
**Location:** `apps/web/src/app/profile/[id]/ProfilePageContent.tsx`
**Issue:** New user sees:
- "31.2h Active this week"
- Weekly activity chart with bars
- "02:35" session timer
- "5.2h" on Saturday

**Impact:** Destroys user trust. Shows data that's impossible for new signup.

### DATA-002: Settings > Notifications shows fake spaces
**Location:** Settings Notifications tab
**Issue:** Shows "CS Study Group", "Dorm Life @ Ellicott", "UB Gaming Club" when user has NO spaces

**Impact:** Confusing - users think they have spaces they don't have

### DATA-003: HiveLab template usage counts are fake
**Location:** `/tools` page
**Issue:** "1,240 uses", "890 uses", "2,100 uses" - impossible for new platform

**Impact:** Looks like marketing BS, damages credibility

---

## P1 HIGH - Authentication/Session Issues

### AUTH-001: Avatar shows wrong initials
**Issue:** Avatar bounces between "J", "L", "LF", "?" across pages
- Profile card: "LF" (correct)
- TopBar: "J" sometimes, "L" sometimes, "?" when loading
**Impact:** Confusing identity representation

### AUTH-002: Ghost Mode API failing
**Location:** Settings > Privacy tab
**Error:** `Failed to fetch ghost mode: Error: Failed to fetch ghost mode status` (401)
**Impact:** Key privacy feature completely broken

### AUTH-003: Feature flags returning 401
**Location:** `/api/feature-flags`
**Impact:** Feature flag system inaccessible to authenticated users

---

## P1 HIGH - Broken UI Components

### UI-001: Sort dropdown options invisible
**Location:** `/campus` page sort dropdown
**Issue:** Only "Newest" shows text. Other 3 options ("Most Active", "Most Members", "For You") are blank/invisible

### UI-002: Settings sidebar button does nothing
**Location:** Sidebar "Settings" button on some pages
**Issue:** Button highlights but doesn't navigate to /settings

### UI-003: Page title duplication
**Location:** Campus page
**Issue:** Title shows "Campus | HIVE | HIVE" - duplicate "HIVE"

---

## P1 HIGH - Missing Core Features

### FEAT-001: No profile photo upload
**Location:** Settings > Profile tab
**Issue:** Profile completion shows "Photo" as incomplete, but no upload UI exists

### FEAT-002: No interests management
**Location:** Settings > Profile tab
**Issue:** Profile completion shows "Interests" as incomplete, but no way to add them

### FEAT-003: Ghost Mode UI completely missing
**Location:** Settings > Privacy tab
**Issue:** Privacy tab has visibility toggles but NO Ghost Mode feature despite it being documented

### FEAT-004: Calendar integration broken
**Location:** Settings > Account tab
**Issue:** Shows "Calendar integration is not available at this time" - empty card

---

## P2 MEDIUM - Design System Violations

### DS-001: Gold/accent overuse
**Locations:**
- Settings toggles all use gold (6+ on screen)
- "Dark" theme badge in gold
- "TOOL RUNS" stat in gold when value is 0

**Rule:** 1-2% gold budget. Current usage far exceeds this.

### DS-002: Blue button in Settings
**Location:** Settings > Account > Email Frequency
**Issue:** "Daily" pill button is blue. Design system specifies white for selections.

### DS-003: "N 1 Issue" dev badge persistent
**Location:** Bottom-left corner on every page
**Issue:** Next.js dev tools error badge constantly visible - distracting

---

## P2 MEDIUM - Empty State Issues

### EMPTY-001: Campus browse empty state is weak
**Current:** "No spaces found" / "Try a different category or search"
**Better:** Should have CTA to "Create a Space" or "Claim Your Org"

### EMPTY-002: Profile page "Welcome back" for new users
**Issue:** Says "Welcome back" but user just signed up
**Fix:** "Welcome, [Name]" for first visit

### EMPTY-003: Sidebar "Your Spaces" empty with no guidance
**Issue:** Just shows "YOUR SPACES" header with nothing under it
**Fix:** Show "Join your first space" CTA

---

## P2 MEDIUM - Backend/Infrastructure

### INFRA-001: Missing Firestore indexes
**Errors:**
- `placed_tools` index missing (causes 500 on profile API)
- `events` composite index missing (causes enrichment failures)

### INFRA-002: Missing @sentry/nextjs module
**Impact:** Error monitoring not working

### INFRA-003: Server memory threshold causing restarts
**Log:** `Server is approaching the used memory threshold, restarting...`
**Impact:** Slow page loads, session interruptions

---

## P3 LOW - Polish Items

### POLISH-001: Command palette shortcuts undocumented
**Issue:** "G C", "G P", "G ," shortcuts exist but nowhere explained

### POLISH-002: Breadcrumbs show raw IDs
**Issue:** Space detail shows space ID instead of space name in breadcrumb

### POLISH-003: Loading states inconsistent
**Issue:** Some pages show spinner, others show skeleton, others show nothing

---

## RECOMMENDED FIX ORDER

### Immediate (Today)
1. NAV-001: Add HiveLab + Profile to desktop sidebar
2. DATA-001: Remove fake activity data from profile
3. UI-001: Fix sort dropdown options

### This Week
4. DATA-002, DATA-003: Remove all remaining mock data
5. AUTH-001: Fix avatar initial consistency
6. FEAT-001, FEAT-002: Add photo upload + interests to settings
7. INFRA-001: Create missing Firestore indexes

### This Sprint
8. AUTH-002: Fix Ghost Mode API
9. FEAT-003: Implement Ghost Mode UI
10. DS-001, DS-002: Fix design system violations
11. All empty state improvements

---

## SUMMARY

**Total Issues:** 28
- P0 Critical: 3
- P1 High: 9
- P2 Medium: 10
- P3 Low: 6

**Root Cause Analysis:**
1. Navigation architecture was designed for a different app state (users with spaces/tools)
2. Mock data was used during development and never cleaned up
3. Mobile nav evolved separately from desktop nav
4. Settings consolidated from multiple locations but features not wired up

**Recommendation:** Fix navigation first. Users literally cannot find features that exist.
