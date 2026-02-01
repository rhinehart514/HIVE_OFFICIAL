# IA Invariants

Non-negotiable information architecture rules for HIVE. These protect the platform's conceptual integrity and prevent regression.

---

## Invariants

These rules can never be violated.

### 1. `/u/[handle]` is the single canonical identity surface
All public identity lives here. No other route displays a user's public profile. External links, @mentions, and profile references resolve to this route.

### 2. `/me/*` owns private state, never social content
Everything under `/me` is first-person authority over account state. No social signals, no public content, no discovery. This is where you control yourself, not where others see you.

### 3. `/home` owns attention aggregation
The dashboard that answers "what needs my attention right now." Aggregates signals from spaces, calendar, and notifications. Never stores data—only reflects it.

### 4. `/explore` owns discovery, not participation
Browse, search, preview. Never join, create, or commit from here. Discovery is zero-friction; participation routes elsewhere.

### 5. `/s/[handle]` owns space membership
All space activity—chat, tools, members, settings—lives under the space route. A user's relationship to a space is defined here, not on their profile.

### 6. Redirects are permanent (301)
When routes change, old paths redirect permanently. No broken links. No "page not found" for bookmarked URLs.

---

## Ownership Map

Which route owns which objects.

| Route | Owns | Never Contains |
|-------|------|----------------|
| `/u/[handle]` | identity, presence, public tools, social proof | settings, config, private state |
| `/me` | dashboard, quick actions | social signals, public content |
| `/me/calendar` | time commitments, schedule | discovery, browsing |
| `/me/settings` | preferences, auth, account control | public actions, social features |
| `/home` | aggregation, flow, attention routing | storage, config, identity |
| `/explore` | discovery surfaces, search, browse | participation, commitment, creation |
| `/s/[handle]` | membership, activity, chat, tools | identity config, account settings |
| `/lab/*` | builder tools, tool creation/editing | social content, discovery |

---

## Friction Map

Action weights protect the architecture. Heavier actions require more confirmation, slower flows, or explicit commitment.

| Action | Weight | Rationale |
|--------|--------|-----------|
| Browse explore | Light | Zero commitment, pure discovery |
| View profile | Light | Public information, no state change |
| Edit bio | Medium | Public but reversible |
| Join space | Medium | Commitment made, but reversible |
| Leave space | Medium | Reversible, but affects relationships |
| Change handle | Heavy | Identity is permanent, breaks links |
| Create tool | Heavy | Builder responsibility, public artifact |
| Delete space | Heavy | Affects all members, data loss |
| Delete account | Maximum | Irreversible, total data loss |

---

## Violation Examples

Concrete examples of what would violate these invariants.

### Violation: Profile settings on `/u/[handle]`
**Wrong:** Adding an "Edit Profile" form directly on the public profile page.
**Why:** Public surface should not contain private controls. Edit flows belong under `/me/settings`.
**Correct:** Profile page links to `/me/settings` for editing.

### Violation: Join button on `/explore`
**Wrong:** "Join Space" button directly in explore search results.
**Why:** Explore owns discovery, not participation. Joining is commitment.
**Correct:** Explore shows preview → preview links to `/s/[handle]` → join button lives there.

### Violation: Space chat on `/home`
**Wrong:** Embedding live space chat in the home dashboard.
**Why:** Home aggregates attention, doesn't contain activity. Chat belongs to the space.
**Correct:** Home shows "3 unread in Design Club" → links to `/s/design-club`.

### Violation: Social feed on `/me`
**Wrong:** Showing "what your connections posted" under `/me`.
**Why:** `/me` is private state, not social content. Social aggregation belongs on `/home`.
**Correct:** Connection activity appears on `/home`, not `/me`.

### Violation: Creating tools from profile
**Wrong:** "Create New Tool" button on `/u/[handle]`.
**Why:** Identity surface displays tools, doesn't create them. Builder flows belong in `/lab`.
**Correct:** Profile shows tools → "Create" links to `/lab/new`.

### Violation: Soft redirects (302) for moved routes
**Wrong:** Using temporary redirects when routes permanently change.
**Why:** Breaks SEO, confuses caching, signals the old route might return.
**Correct:** Always 301 for permanent route changes.

---

## Enforcement

When adding new features:

1. **Check the ownership map.** Does this feature belong to the route you're adding it to?
2. **Check the friction map.** Does the action weight match the UI friction?
3. **Check the invariants.** Does this violate any of the six rules?

If any check fails, stop and reconsider the feature's location.
