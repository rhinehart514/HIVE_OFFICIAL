# HIVE Launch Implementation Spec
**Feb 22 2026 — read after SYSTEMS-STRATEGY.md**
**This is the dev spec. Each item = a concrete code change.**

---

## PART 1: BLOCKERS (fix first, everything depends on these)

### B1. Events feed images — 30 min
**File:** `apps/web/src/app/api/events/personalized/route.ts`
```ts
// Change:
coverImageUrl: event.coverImageUrl as string | undefined,
// To:
coverImageUrl: (event.imageUrl || event.coverImageUrl) as string | undefined,
```

### B2. Events feed spaceHandle — 2 hrs
**File:** `apps/web/src/app/api/events/personalized/route.ts`
Before the `.map()` that builds the response, batch-resolve space handles:
```ts
const spaceIds = [...new Set(rawEvents.map(e => e.spaceId).filter(Boolean))];
const spaceHandleMap = new Map<string, string>();
await Promise.allSettled(
  spaceIds.map(async (id) => {
    const doc = await dbAdmin.collection('spaces').doc(id).get();
    const handle = doc.data()?.handle;
    if (handle) spaceHandleMap.set(id, handle);
  })
);
// Then in the map:
spaceHandle: spaceHandleMap.get(event.spaceId) ?? undefined,
```

### B3. Space events returning 0 — 1 hr
**File:** `apps/web/src/app/api/events/route.ts` → `fetchDocsForTimeField()`
```ts
// Change:
if (fromDate) {
  query = query.where(dateField, ">=", fromDate);
} else if (queryParams.upcoming) {
  query = query.where(dateField, ">=", now);
}
// To:
const toISO = (d: Date) => dateField === 'startDate' ? d.toISOString() : d;
if (fromDate) {
  query = query.where(dateField, ">=", toISO(fromDate));
} else if (queryParams.upcoming) {
  query = query.where(dateField, ">=", toISO(now));
}
// Apply same pattern to toDate filter.
```

### B4. 7-day space creation gate — 5 min
**File:** `apps/web/src/app/api/spaces/route.ts:167`
Remove the account age check (lines ~160-168). Keep email verification + daily limit of 3.

### B5. Gathering threshold — 5 min
**File:** `packages/core/src/domain/spaces/aggregates/enhanced-space.ts:100`
```ts
// Change:
export const DEFAULT_ACTIVATION_THRESHOLD = 10;
// To:
export const DEFAULT_ACTIVATION_THRESHOLD = 1;
```

### B6. Events nav tab — 15 min
**Files:**
- `apps/web/src/lib/navigation.ts` — remove Events entry
- `apps/web/src/components/shell/AppSidebar.tsx` — remove Events from nav render

### B7. Profile black screen — diagnosis required
**File:** `apps/web/src/app/u/[handle]/ProfilePageContent.tsx` (731 lines)
Open the browser console on `/u/[handle]`. The black screen is almost certainly a silent data fetch error leaving the component in a loading state. Check:
1. What does the network tab show for the profile API call?
2. Is there an unhandled promise rejection in console?
3. Does `useSWR` or React Query have an `onError` silently swallowing the failure?
Fix the error boundary or the fetch — don't rebuild the profile until the black screen is diagnosed.

---

## PART 2: SYSTEM 1 — CREATION (HiveLab)

### C1. Quick create: skip IDE for template chips — 3 hrs
**Files:**
- `apps/web/src/app/lab/page.tsx` — chip handlers
- New: `apps/web/src/components/hivelab/QuickCreate.tsx`

When user taps a quick chip (Poll, RSVP, Signup, Countdown):
1. Show an inline form: question + options (pre-filled), no navigation
2. On submit: `POST /api/tools` with pre-built element config from template
3. Navigate directly to `/t/[toolId]` — skip the IDE entirely
4. Show "Your [poll] is ready. Share this link." with copy + native share

No canvas. No generation. Template → link in under 20 seconds.

### C2. AI prompt → preview in Lab page (not IDE) — 3 hrs
**File:** `apps/web/src/app/lab/page.tsx`
When user types a custom prompt:
1. `POST /api/tools` to create the tool
2. Stream `/api/tools/generate` response inline in the Lab page
3. Show a live preview below the prompt as elements arrive
4. CTA: "Looks good → Share link" or "Edit in studio"
The preview lives in the Lab page. "Edit in studio" is the opt-in to the full IDE.

### C3. CreatePromptBar as hero — 1 hr
**File:** `apps/web/src/app/lab/page.tsx`
Move CreatePromptBar above the fold. It should be the first thing visible. "What do you want to make?" as the page headline. Quick chips directly below. Library and past tools below that. "Build from scratch →" as a ghost link at the bottom.

### C4. Template library: informal categories — 4 hrs
**Files:** `packages/ui/src/components/hivelab/elements/registry.tsx` + template definitions
Add 5 new template categories: Settle it, Plan it, Hype it, Fill it, Game it.
Each needs 3-5 quick templates. These use existing elements (poll, rsvp, signup, countdown) — just new configurations and copy. No new element types needed.

---

## PART 3: SYSTEM 2 — FEED

### F1. ToolCard in feed — 3 hrs
**File:** `apps/web/src/app/(shell)/discover/page.tsx` + feed components
Add `FeedTool` type to the feed. Query top-interacted tools on campus:
`GET /api/tools/browse?campusId=ub&status=active&sort=interactions&limit=10`
Render ToolCard inline in the feed between event cards. Show: tool name, creator, interaction count, type icon, and a "Participate →" CTA.

### F2. Remove SpaceCards from main feed — 30 min
**File:** `apps/web/src/app/(shell)/discover/page.tsx`
Filter out `FeedSpace` type from the main feed render. Space discovery lives in the Spaces tab — not the feed.

### F3. Inline interaction on feed cards — 3 hrs
**Files:** `apps/web/src/components/feed/` card components
Add inline RSVP button on EventCards. Add inline "Vote" on ToolCards for polls. Interaction should complete without navigating away. Use the existing `/api/tools/execute` and RSVP endpoints. Optimistic UI — update count immediately.

### F4. Zero-state: campus default — 1 hr
**File:** `apps/web/src/app/(shell)/discover/page.tsx`
When personalization returns 0 results (new user, no interests): fall back to campus-wide events sorted by time + most-interacted tools. Never show an empty feed.

---

## PART 4: SYSTEM 3 — DISTRIBUTION (/t/ page)

### D1. Dynamic OG tags per tool — 2 hrs
**File:** `apps/web/src/app/t/[toolId]/page.tsx` (metadata export)
```ts
export async function generateMetadata({ params }) {
  const tool = await fetchTool(params.toolId);
  return {
    title: tool.name,
    description: `${tool.interactionCount} interactions · Made with HIVE`,
    openGraph: {
      title: tool.name,
      description: getToolDescription(tool), // question + options for polls
      images: [{ url: `/api/og/tool/${params.toolId}` }],
    }
  };
}
```
Create `/api/og/tool/[toolId]` route that generates a dynamic OG image using `@vercel/og`. Show the tool type, question, and live count in the image.

### D2. "Made with HIVE" CTA — 1 hr
**File:** `apps/web/src/app/t/[toolId]/StandaloneToolClient.tsx`
Add at the bottom of the tool page:
```
Made with HIVE · [Create your own] [See more from {spaceName}]
```
"Create your own" → `/enter?from=tool&toolType={type}` — onboarding with context.
"See more from [Space]" → `/s/[spaceHandle]` — only if tool is deployed to a space.

### D3. Mobile share sheet — 30 min
**File:** `apps/web/src/app/t/[toolId]/StandaloneToolClient.tsx`
```ts
const handleShare = async () => {
  if (navigator.share) {
    await navigator.share({ title: tool.name, url: window.location.href });
  } else {
    navigator.clipboard.writeText(window.location.href);
    // show "copied" toast
  }
};
```
Show the share button prominently after creation and on the /t/ page.

### D4. Social proof without login — 30 min
**File:** `apps/web/src/app/t/[toolId]/StandaloneToolClient.tsx`
Interaction count visible immediately, no auth required. "47 votes" / "14 going" / "3 of 10 slots filled." These are already in the tool state — just make sure they render before auth check.

---

## PART 5: SYSTEM 4 — COMMUNITY (Spaces)

### S1. Threshold fix — B5 above (done)

### S2. Space events fix — B3 above (done)

### S3. "Claim This Space" UI — 2 hrs
**Files:**
- `apps/web/src/components/spaces/SpaceClaimModal.tsx` (599 lines, already exists)
- `apps/web/src/app/s/[handle]/components/space-threshold.tsx`
Add a "Claim This Space" button to unclaimed space threshold view. Wire it to `SpaceClaimModal.tsx`. Backend at `/api/spaces/[spaceId]/claim` already exists.

### S4. Space empty state — 1 hr
**File:** `apps/web/src/app/s/[handle]/` — empty state component
When space has 0 messages and 0 tools:
- Show upcoming events from sidebar (the life signal)
- Show "Deploy a tool to get started" CTA → `/lab?spaceId={spaceId}`
- Show "Invite members" with invite link
Don't show a blank chat. Show what the space already has.

---

## PART 6: SYSTEM 5 — IDENTITY (Profile)

### I1. Fix black screen — B7 above (diagnosis required first)

### I2. Hero tool on profile — 2 hrs
**File:** `apps/web/src/app/u/[handle]/ProfilePageContent.tsx`
After fix: top of profile shows the user's most-interacted tool, full-width, interactive. Uses `StandaloneToolClient` in embedded mode. Below it: tool grid sorted by interaction count.

### I3. Remove portrait card — 1 hr
**File:** `apps/web/src/app/u/[handle]/ProfilePageContent.tsx`
Kill the maroon portrait card. Replace with:
- 48px avatar
- Name in Clash Display
- Handle in Geist Mono white/50
- Interaction count: "X people participated in your tools"
- Spaces row (small avatars)

### I4. Tool grid — 1 hr
**File:** `apps/web/src/app/u/[handle]/` — tool grid component
Grid of tool cards, sorted by interaction count. Each card: tool name, type icon, count, "Try it →" link to `/t/[toolId]`. Tappable from profile.

### I5. Empty profile state — 30 min
When user has 0 tools:
- "What will you build first?" with quick chips
- "Your profile fills up as you create"
- 3 suggested spaces based on their interests

---

## PART 7: SYSTEM 6 — ONBOARDING

### O1. Major selection → major space — 3 hrs
**Files:**
- `apps/web/src/app/enter/` — onboarding flow
- New API: `POST /api/spaces/join-major` — finds or creates major space, auto-joins user

Add "What's your major?" as step 3 of onboarding. On selection:
1. Look up the major's space by name match in spaces collection
2. Auto-join the user to that space (`/api/spaces/join-v2`)
3. Show "You're in the Computer Science space" confirmation

If no major space exists yet: create one with default settings, join user as founding member.

### O2. Campus identity dimensions — 2 hrs
**Files:** `apps/web/src/app/enter/` — interests/personalization step
Replace generic interest tags with 5 structured dimensions:
1. Major (step 3 — see O1)
2. Greek life (yes/no → chapter select if yes)
3. Campus living (dorm search or off-campus)
4. Student orgs (search + browse by category)
5. University involvement (SGA, athletics, etc.)

Each selection maps to space category joins and event personalization signals.

### O3. "Your campus is live" screen — 1 hr
**Files:** `apps/web/src/app/enter/` — new screen between interests and creation

New onboarding screen after interests:
- Headline: "Your campus is live."
- Show 2-3 real upcoming events matched to their major + interests
- One line: "371 events happening at UB this week."
- CTA: "Now let's make something →"

Fetches from `/api/events?campusId=ub-buffalo&upcoming=true&limit=3` — filtered by their interest signals.

### O4. Creation prompt as final onboarding step — 2 hrs
**Files:** `apps/web/src/app/enter/` — final screen
Replace "Here are spaces to join" with "What do you want to make?"
- CreatePromptBar with 4 chips: Poll, RSVP, Signup, Countdown
- "Skip for now →" in small text below
- On create: quick create flow (C1), get link, show share sheet
- Then: "Your [CS] community is on HIVE" → space recommendation in context

### O5. Space recommendations move post-creation — 30 min
**Files:** `apps/web/src/app/enter/` — step ordering
Space recommendations slide to after the creation step. "Now that you've built something — here's where it can live." Reorder steps, no new logic needed.

---

## COMPLEXITY SUMMARY

| Priority | Item | Effort |
|----------|------|--------|
| P0 | B1-B6: Blockers (events API, gate, threshold, nav) | ~5 hrs total |
| P0 | B7: Profile black screen diagnosis | Unknown |
| P1 | O1: Major space auto-join | 3 hrs |
| P1 | O3-O4: Campus live screen + creation in onboarding | 3 hrs |
| P1 | C1: Quick create (skip IDE) | 3 hrs |
| P2 | C3: CreatePromptBar as hero | 1 hr |
| P2 | D1: Dynamic OG tags | 2 hrs |
| P2 | D2-D4: /t/ page CTAs + share + social proof | 2 hrs |
| P2 | S3: Claim This Space UI | 2 hrs |
| P2 | I1-I4: Profile (after black screen fixed) | 4 hrs |
| P3 | F1-F4: Feed ToolCard + inline interaction + zero-state | 7 hrs |
| P3 | C2-C4: AI preview + template library | 7 hrs |
| P3 | O2: Campus identity dimensions | 2 hrs |
| P3 | O5: Space recs post-creation | 30 min |

**Total for 10-person launch (P0 + P1): ~14 hrs of focused Claude Code work.**
**Total for full public launch (all): ~42 hrs.**

---

*This spec maps directly to `docs/SYSTEMS-STRATEGY.md`. Each item here is the implementation of a decision made there.*
*Agent: read `docs/KNOWN_STATE.md` before touching any Firestore query. Read `docs/DESIGN_RULES.md` before touching any UI.*
