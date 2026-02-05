# HIVE Discovery System

> How students find their people, spaces, tools, and opportunities

**Last Updated:** February 2026
**Status:** Comprehensive Feature Spec
**Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?

---

## Table of Contents

1. [Current State](#current-state)
2. [Gaps & Refinements](#gaps--refinements)
3. [Feature Ideation](#feature-ideation)
4. [Strategic Considerations](#strategic-considerations)
5. [Feature Specs](#feature-specs)
6. [Integration Points](#integration-points)

---

## Current State

### What Exists Today

#### 1. Explore Page (`/explore`)
**File:** `/apps/web/src/app/explore/page.tsx`

A personalized single-scroll feed with real API connections:

**Sections (when not searching):**
- **For You** — Personalized space recommendations based on interests/major
- **Popular This Week** — Trending spaces by member count
- **People in Your Major** — Users filtered by academic field
- **Upcoming Events** — Events within the next 7 days

**Search Mode:**
- Unified search across spaces, people, events
- Debounced (300ms) query handling
- Results grouped by type: Spaces, Ghost Spaces, People, Events
- URL state sync (`?q=query`)

**API Endpoints Connected:**
- `GET /api/spaces/browse-v2` — Space discovery
- `POST /api/users/search` — People search
- `GET /api/events` — Event discovery
- `GET /api/profile` — User interests/major for personalization

#### 2. Search API (`/api/search`)
**File:** `/apps/web/src/app/api/search/route.ts`

Full platform search with sophisticated relevance scoring:

**Searchable Entities:**
- Spaces (name, description, category)
- Profiles (handle, displayName, bio)
- Posts (title, content, tags)
- Tools (name, description)
- Events (title, description, location)

**Relevance Scoring System:**
```typescript
const SCORING_WEIGHTS = {
  EXACT_MATCH: 100,
  PREFIX_MATCH: 80,
  CONTAINS_MATCH: 60,
  PARTIAL_WORD_MATCH: 40,
  CATEGORY_MATCH: 30,
  RECENCY_MAX_BOOST: 25,      // 14-day half-life decay
  ENGAGEMENT_MAX_BOOST: 30,   // Log-scaled popularity
  VERIFIED_BOOST: 15,
  ACTIVE_RECENTLY_BOOST: 10,  // Active in last 7 days
};
```

**Key Features:**
- Campus isolation (campusId from session JWT)
- Ghost mode filtering (respects privacy settings)
- Rate limiting (IP-based)
- Parallel search across categories
- Suggestions generation based on result types

#### 3. Spaces Browse API (`/api/spaces/browse-v2`)
**File:** `/apps/web/src/app/api/spaces/browse-v2/route.ts`

DDD-powered space discovery with cold start enrichment:

**Sort Options:** trending, recommended, newest, popular
**Filtering:** category, search text
**Pagination:** Cursor-based

**Cold Start Signals (Jan 2026):**
- `upcomingEventCount` — Shows value without chat activity
- `nextEvent` — Creates urgency ("Tournament · Friday")
- `mutualCount` — Social proof ("2 friends are members")
- `toolCount` — Shows utility

#### 4. Recommendations System (`/api/spaces/recommended`)
**File:** `/apps/web/src/app/api/spaces/recommended/route.ts`

Behavioral psychology-based recommendations from SPEC.md:

**Algorithm:**
```
Score = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)
```

**Scoring Components:**
- **Anxiety Relief** — Major match (+0.3), popular spaces (+0.2), category bonuses
- **Social Proof** — Friends in space (+0.4 max), connections (+0.3 max), network ratio
- **Insider Access** — Small spaces (+0.3), private spaces (+0.4), approval required (+0.2)

**Output Sections:**
- `panicRelief` — Spaces addressing student anxieties
- `whereYourFriendsAre` — Social proof recommendations
- `insiderAccess` — Exclusive opportunities
- `recommendations` — Overall sorted list

#### 5. Users Search API (`/api/users/search`)
**File:** `/apps/web/src/app/api/users/search/route.ts`

People discovery with privacy enforcement:

**Search Modes:**
- Full-text search (name, handle, bio, major)
- Browse mode (no query, returns all visible users)
- Space-scoped (filter to users in a specific space)

**Privacy Enforcement:**
- Respects `profileVisibility` (public/connections/private)
- Bio/academic visibility checks
- Ghost mode compatible

**Relevance Scoring:**
- Handle exact match: +100
- Name match: +95/80
- Bio match: +50
- Major match: +40
- Verified boost: +20
- Recent activity boost: +15/5

#### 6. Home Page Discovery (`/home`)
**File:** `/apps/web/src/app/home/page.tsx`

Activity stream with discovery elements:

**For New Users (0 spaces):**
- "Find your first space" CTA
- Recommended spaces with join buttons
- First join redirects into space

**For Returning Users:**
- Suggested for You section (one recommendation per day)
- Dashboard recommendations (`includeRecommendations=true`)

#### 7. Entry Flow Discovery
**File:** `/apps/web/src/components/entry/hooks/useEntry.ts`

4-phase onboarding: Gate → Naming → Field → Crossing

**Interest Selection (Crossing phase):**
- 2-5 interests required
- Used for personalization
- Server auto-joins matching spaces

**Post-Entry:**
- Redirect to first auto-joined space or /home
- Recommendations seeded from interests

---

### What Works Well

1. **Relevance Scoring** — Sophisticated multi-factor ranking with text quality, recency decay, engagement signals

2. **Cold Start Enrichment** — Event counts, next event, mutual friends help spaces with no chat activity

3. **Privacy Enforcement** — Ghost mode, profile visibility, campus isolation properly enforced

4. **Behavioral Psychology** — Anxiety relief, social proof, insider access creates meaningful recommendations

5. **Search Performance** — Parallel searches, rate limiting, bounded queries with limits

6. **Interest-Based Personalization** — Interests from onboarding flow into For You section

---

### What's Broken or Janky

1. **Simple `.includes()` Search** — Text search uses string contains:
   ```typescript
   // In browse-v2
   const searchLower = search.toLowerCase().trim();
   visibleSpaces = visibleSpaces.filter(space => {
     const name = space.name.value.toLowerCase();
     const description = space.description?.value?.toLowerCase() ?? '';
     return name.includes(searchLower) || description.includes(searchLower);
   });
   ```
   No fuzzy matching, typo tolerance, or stemming.

2. **No Full-Text Index** — Comment in search API:
   ```typescript
   // For better full-text search, consider Algolia/Typesense integration.
   ```
   Currently using Firestore prefix queries with `>=` and `<= + '\uf8ff'`

3. **N+1 Query Patterns** — User search calculates mutual spaces per user:
   ```typescript
   // This runs for every user in results
   const currentUserSpacesSnapshot = await db.collection('spaceMembers')...
   const otherUserSpacesSnapshot = await db.collection('spaceMembers')...
   ```

4. **No Faceted Search** — Can filter by category but no combined facets (category + year + major)

5. **Ghost Spaces UX** — Waitlist exists but no conversion path beyond "Notify Me"

6. **Deprecated Routes** — `/spaces` redirects to `/home`, old browse API has deprecation headers

7. **Profile Interest Extraction** — TODO in browse-v2:
   ```typescript
   // TODO: Implement when profile interest accessors are available
   ```

---

### Audit Findings (2026-02-05 — 17-Agent Cross-System Audit)

**API Layer (9 routes):**
- `browse-v2`, `search`, `recommended` (GET/POST), `users/search`, `search/route`, browse (deprecated), `waitlist` (POST/GET)
- Old `/api/spaces/browse` deprecated with sunset date 2026-06-01
- Search uses `.includes()` — no typo tolerance, no fuzzy matching
- Platform search has sophisticated relevance scoring (exact: 100, prefix: 80, contains: 60)

**Performance Issues:**
- **N+1 in user search** — mutual spaces calculation queries per-user (O(n) queries). Should batch with `where('__name__', 'in', spaceIds)`

**Working Well:**
- Recommendation engine fully functional: `Score = (AnxietyRelief × 0.4) + (SocialProof × 0.3) + (InsiderAccess × 0.3)`
- Ghost space waitlist with deduplication working
- Explore page sections: For You, Popular This Week, People in Major, Upcoming Events, Search Results

**Broken/Missing:**
- Ghost space waitlist notification missing — no notification fires when space is claimed
- Search history not persisted — users restart every search session
- Faceted filters absent — no category/type/date filtering in search UI
- "Did you mean" suggestions absent — no typo correction
- Trending is member-count based — not activity velocity
- No serendipity/random discovery feature
- Explore people links use dead `/profile/${id}` route — should be `/u/[handle]`
- Search API returns dead `/user/${handle}` URLs — should be `/u/[handle]`
- Search API allows unauthenticated access via `getDefaultCampusId()` fallback — scraping vector

---

## Gaps & Refinements

### P0 — Critical for Launch

| Gap | Current State | Required State |
|-----|---------------|----------------|
| **Typo Tolerance** | Exact substring match | Fuzzy matching for common typos |
| **Empty Results UX** | "No results" message | Suggestions, related searches, browse fallback |
| **Search Analytics** | None | Track queries, clicks, no-result queries |

### P1 — Important for Adoption

| Gap | Current State | Required State |
|-----|---------------|----------------|
| **Faceted Filtering** | Category only | Category + Year + Major + Status |
| **Saved Searches** | None | Save frequent searches for quick access |
| **Search History** | URL param only | Recent searches dropdown |
| **Interest Graph** | Explicit interests only | Implicit signals from activity |

### P2 — Nice to Have

| Gap | Current State | Required State |
|-----|---------------|----------------|
| **Full-Text Search** | Firestore prefix queries | Algolia/Typesense integration |
| **Semantic Search** | Keyword matching | Embedding-based similarity |
| **Discovery Notifications** | None | "New space matches your interests" |
| **Trending Topics** | None | Surface popular search terms |

---

## Feature Ideation

### A. First Discovery (New User Journey)

**Problem:** New user lands, has no spaces, doesn't know what to search for.

**Current Flow:**
1. Complete entry (interests selected)
2. Auto-join matching spaces
3. Redirect to first space or /home
4. Home shows "Find your first space" + recommendations

**Proposed Enhancements:**

#### A1. Guided Discovery Quiz
```
"What brought you to campus?"
→ "Find my community" → Show social spaces
→ "Academic support" → Show study groups, major spaces
→ "Build something" → Show maker spaces, HiveLab
→ "Meet people" → Show active spaces with events
```

#### A2. Zero-State Explore
When interests are set but no spaces joined:
- Show "Top 3 for You" prominently
- One-tap join buttons
- Skip to browse CTA

#### A3. Onboarding Checklist
```
✓ Verify email
✓ Claim identity
○ Join your first space
○ Introduce yourself
○ Attend an event
```
Progress tracked, rewards unlocked.

---

### B. Search Experience

**Problem:** Search is functional but not delightful.

#### B1. Smart Search Bar
**Features:**
- Recent searches (last 5)
- Suggested searches based on popular queries
- Category pills: `@spaces`, `@people`, `@events`
- Autocomplete as you type

**Implementation:**
```typescript
interface SearchSuggestion {
  type: 'recent' | 'trending' | 'category' | 'autocomplete';
  query: string;
  displayText: string;
  icon?: string;
}
```

#### B2. Faceted Filters
**Filter Bar:**
```
[All Types ▼] [Category ▼] [Year ▼] [Active Now ▼]
```

**Applied Filters:**
```
Spaces · Greek Life · Seniors · ×
```

#### B3. Search Results Ranking
**Personalized Boost:**
- +20 if space shares category with user's spaces
- +15 if person shares mutual connections
- +10 if event is in user's space

#### B4. No Results Experience
```
No results for "hackerthon"

Did you mean: hackathon

Suggestions:
• UB Hacking — 234 members, Building projects together
• Tech Builders — 189 members, Weekly coding sessions

Or: [Browse All Spaces]
```

---

### C. Recommendation Engine

**Problem:** Recommendations exist but could be more dynamic.

#### C1. Recommendation Contexts
Different algorithms for different contexts:

| Context | Primary Signal | Secondary Signal |
|---------|---------------|------------------|
| Home page | Interests + friends | Trending on campus |
| Space page | Similar members | Similar categories |
| Profile page | Mutual spaces | Shared interests |
| Event page | Space members | Related events |

#### C2. Dynamic "Why" Explanations
```typescript
interface RecommendationReason {
  type: 'interest_match' | 'friends' | 'trending' | 'major' | 'activity';
  text: string;
  confidence: number;
}

// Examples:
// "3 of your friends are members"
// "Matches your interest in Design"
// "Popular with CS students"
// "Trending this week • 23 new members"
```

#### C3. Negative Signals
Track what users skip/hide:
- Don't recommend spaces user has seen 3+ times
- Don't recommend categories user never engages with
- "Not interested" option that trains recommendations

---

### D. Serendipity Features

**Problem:** Current discovery is predictable — interest-based filtering creates filter bubbles.

#### D1. "You Might Not Know" Section
Show one random space that:
- User hasn't seen before
- Has > 10 members (some activity)
- Doesn't match user's interests (intentional)

**Copy:** "Step outside your bubble — try something new"

#### D2. Random Walk
When user is bored:
- "Surprise me" button
- Opens random active space
- Tracks surprise → join conversion

#### D3. Cross-Pollination
"People who joined [your space] also joined..."
Based on co-membership patterns.

#### D4. Time-Based Discovery
- **Morning:** Study groups, academic spaces
- **Evening:** Social spaces, events tonight
- **Weekend:** Activities, club events

---

### E. Browse Experience

**Problem:** Browse is sorted lists — needs more editorial curation.

#### E1. Curated Collections
```
🔥 Trending This Week
• [Space] [Space] [Space]

🎓 For Computer Science Majors
• [Space] [Space] [Space]

🏠 Your Dorm's Spaces
• [Space] [Space]

📅 Hosting Events Soon
• [Space] [Space] [Space]
```

#### E2. Category Pages
`/explore/category/greek-life`
- Hero image + category description
- All spaces in category
- Featured space spotlight
- Related categories

#### E3. Campus Calendar Integration
Weekly/monthly view of events across all spaces.
Filter by: attending, interested, friends going.

---

## Strategic Considerations

### Cold Start Analysis

**Question:** Does discovery work with 10 spaces? 5 users?

**Current State:**
- UB has seeded spaces from CampusLabs (200+ organizations)
- Ghost spaces create catalog even without claimed spaces
- Cold start signals (events, mutuals) help empty spaces

**Minimum Viable Catalog:**
| Metric | Minimum | Rationale |
|--------|---------|-----------|
| Spaces | 20 | Enough variety for interests to match |
| Categories | 4 | Major, Greek, Living, Organizations |
| Active spaces | 5 | At least 5 with recent messages |
| Events this week | 3 | Something to RSVP to |

**Bootstrap Strategy:**
1. Seed from CampusLabs (already done)
2. Founders claim spaces first (incentive: "Founding Member" badge)
3. Auto-create major spaces on demand
4. Cross-promote events from university calendar

---

### Moat Analysis

**Question:** Why not just Google "clubs at UB"?

**HIVE's Defensible Value:**

1. **Real-Time State** — "3 people online now" vs static website
2. **Social Graph** — "Your friend Sarah is a member"
3. **Action Density** — Join, RSVP, message in one tap
4. **Identity Context** — Results filtered by your major, year, interests
5. **Activity Signals** — "Last active 2 hours ago" vs dead club page
6. **Event Integration** — RSVP + calendar + reminders
7. **Tool Ecosystem** — Spaces have tools, not just chat

**What's NOT Defensible:**
- List of organizations (CampusLabs has this)
- Event calendar (university has this)
- Contact information (public on websites)

**Moat Investment Areas:**
- Real-time presence and activity
- Social proof and friend connections
- Action/conversion within platform
- Personalization based on behavior

---

### Interest Graph Architecture

**Explicit Signals (User-Provided):**
- Onboarding interests (2-5 selected)
- Profile major
- Profile year

**Implicit Signals (Behavior-Derived):**
- Spaces joined → category weights
- Events attended → topic weights
- Search queries → intent signals
- Time spent in spaces → engagement weights
- People followed → social affinity

**Proposed Interest Graph Schema:**
```typescript
interface InterestGraph {
  userId: string;

  // Explicit
  explicit: {
    interests: string[];
    major: string | null;
    year: number | null;
  };

  // Implicit (computed daily)
  implicit: {
    categoryWeights: Record<SpaceCategory, number>;  // 0-1
    topicWeights: Record<string, number>;            // Free-form topics
    socialAffinity: Record<string, number>;          // User IDs
    activityPatterns: {
      peakHours: number[];      // 0-23
      activedays: number[];     // 0-6
    };
  };

  // Combined (for recommendations)
  combined: {
    topCategories: SpaceCategory[];
    topTopics: string[];
    closestUsers: string[];
  };

  updatedAt: Timestamp;
}
```

---

## Feature Specs

### Feature 1: Fuzzy Search

**Description:** Add typo tolerance to search queries.

**Acceptance Criteria:**
- [ ] "hackerthon" matches "hackathon" (character transposition)
- [ ] "comptuer" matches "computer" (character swap)
- [ ] "ub" matches "UB" (case insensitive — already works)
- [ ] Levenshtein distance ≤ 2 for matches
- [ ] Fuzzy matches ranked below exact matches

**Technical Approach:**
Option A: Client-side fuzzy matching with Fuse.js
Option B: Server-side with edit distance calculation
Option C: Algolia/Typesense integration (recommended for scale)

**API Change:**
```typescript
// Add to search response
interface SearchResult {
  // ... existing fields
  matchType: 'exact' | 'prefix' | 'fuzzy';
  matchedTerm?: string;  // What was actually matched
}
```

---

### Feature 2: Search History

**Description:** Show recent searches in search bar dropdown.

**Acceptance Criteria:**
- [ ] Last 10 searches stored locally (localStorage)
- [ ] Shown when search bar is focused but empty
- [ ] Clear individual search or all history
- [ ] No duplicates (move to top if repeated)
- [ ] "X" to remove individual items

**Data Schema (localStorage):**
```typescript
interface SearchHistoryItem {
  query: string;
  timestamp: number;
  resultCount?: number;  // Optional: track if useful
}
```

**UI Spec:**
```
┌─────────────────────────────────┐
│ 🔍 Search spaces, people...     │
├─────────────────────────────────┤
│ Recent                    Clear │
│ ├─ 🕐 hackathon              ×  │
│ ├─ 🕐 cs 370                 ×  │
│ └─ 🕐 study group            ×  │
└─────────────────────────────────┘
```

---

### Feature 3: Faceted Filters

**Description:** Filter search results by multiple dimensions.

**Acceptance Criteria:**
- [ ] Filter by type: Spaces, People, Events, Tools
- [ ] Filter by category (for spaces): All categories available
- [ ] Filter by year (for people): Freshman → Senior
- [ ] Filter by time (for events): Today, This Week, This Month
- [ ] Multiple filters combinable
- [ ] Filter state persisted in URL
- [ ] Clear all filters button

**URL Schema:**
```
/explore?q=design&type=spaces&category=student_organizations
/explore?q=sarah&type=people&year=senior
```

**UI Spec:**
```
┌──────────────────────────────────────────────┐
│ [All Types ▼] [Category ▼] [Year ▼] [Time ▼] │
├──────────────────────────────────────────────┤
│ Applied: Spaces · Student Orgs · ×           │
└──────────────────────────────────────────────┘
```

---

### Feature 4: Personalized Ranking Boost

**Description:** Boost search results based on user context.

**Acceptance Criteria:**
- [ ] Spaces in same category as user's spaces get +20 relevance
- [ ] People with mutual connections get +15 relevance
- [ ] Events in user's spaces get +25 relevance
- [ ] Boost weights configurable server-side
- [ ] A/B testable (feature flag)

**Implementation:**
```typescript
function calculatePersonalizedBoost(
  result: SearchResult,
  userContext: UserContext
): number {
  let boost = 0;

  if (result.type === 'space') {
    const sharedCategory = userContext.spaceCategories.includes(result.category);
    if (sharedCategory) boost += 20;
  }

  if (result.type === 'person') {
    const mutualCount = userContext.connectionIds.filter(
      id => result.metadata.connectionIds?.includes(id)
    ).length;
    boost += Math.min(mutualCount * 5, 15);
  }

  if (result.type === 'event') {
    const inUserSpace = userContext.spaceIds.includes(result.metadata.spaceId);
    if (inUserSpace) boost += 25;
  }

  return boost;
}
```

---

### Feature 5: Smart Empty State

**Description:** When no results found, provide helpful alternatives.

**Acceptance Criteria:**
- [ ] Show "Did you mean: X" for close matches
- [ ] Suggest 3 related spaces based on query words
- [ ] Show popular searches as fallback
- [ ] "Browse all spaces" CTA always visible
- [ ] Track no-result queries for catalog improvement

**UI Spec:**
```
┌─────────────────────────────────────────────┐
│ No results for "hackerthon"                 │
│                                             │
│ Did you mean: hackathon                     │
│                                             │
│ Related spaces:                             │
│ • UB Hacking — 234 members                  │
│ • Tech Builders — 189 members               │
│ • Code Club — 156 members                   │
│                                             │
│ [Browse All Spaces]                         │
└─────────────────────────────────────────────┘
```

---

### Feature 6: Discovery Analytics

**Description:** Track discovery behavior for optimization.

**Acceptance Criteria:**
- [ ] Track: search query, results count, result clicked
- [ ] Track: time to first click, position of clicked result
- [ ] Track: no-result queries (for catalog gaps)
- [ ] Track: filter usage (which facets used)
- [ ] Dashboard for popular queries, failed queries

**Events Schema:**
```typescript
type DiscoveryEvent =
  | { type: 'search_executed'; query: string; resultCount: number; filters: string[] }
  | { type: 'result_clicked'; query: string; resultId: string; position: number; resultType: string }
  | { type: 'no_results'; query: string; filters: string[] }
  | { type: 'filter_applied'; filterType: string; filterValue: string }
  | { type: 'suggestion_clicked'; suggestion: string; suggestionType: string };
```

---

### Feature 7: "People Like You" Section

**Description:** Show people with similar profiles for connection discovery.

**Acceptance Criteria:**
- [ ] Show on explore page when user has profile data
- [ ] Match by: major, graduation year, interests overlap
- [ ] Show 6 people max
- [ ] Exclude people already connected
- [ ] Show mutual spaces count
- [ ] Connect/follow CTA on each card

**Algorithm:**
```typescript
function findSimilarPeople(user: User, limit: number = 6): Person[] {
  // Score each person on campus
  return candidates
    .map(person => ({
      person,
      score:
        (person.major === user.major ? 30 : 0) +
        (person.graduationYear === user.graduationYear ? 20 : 0) +
        (interestOverlap(person.interests, user.interests) * 10) +
        (mutualSpaces(person, user) * 5)
    }))
    .filter(p => p.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(p => p.person);
}
```

---

### Feature 8: Event Discovery Cards

**Description:** Rich event cards in search/explore with RSVP inline.

**Acceptance Criteria:**
- [ ] Show: title, date/time, location, space name
- [ ] Show: RSVP count ("23 going")
- [ ] Show: friends attending (avatar stack)
- [ ] RSVP button inline (no navigation required)
- [ ] "Live" badge for happening now
- [ ] Calendar add option

**UI Spec:**
```
┌──────────────────────────────────────┐
│ 📅 CS 370 Midterm Review             │
│ Tomorrow · 3:00 PM · Capen 101       │
│ 👥 23 going · 2 friends              │
│ [Going ✓] [Maybe] [Add to Calendar]  │
└──────────────────────────────────────┘
```

---

### Feature 9: Category Deep Pages

**Description:** Dedicated pages for browsing spaces by category.

**Acceptance Criteria:**
- [ ] Route: `/explore/category/[slug]`
- [ ] Hero section with category name + description
- [ ] Featured space spotlight
- [ ] All spaces in category (sorted by trending)
- [ ] Subcategory filters if applicable
- [ ] Related categories at bottom

**Categories:**
- `/explore/category/student-organizations`
- `/explore/category/university-organizations`
- `/explore/category/greek-life`
- `/explore/category/campus-living`
- `/explore/category/hive-exclusive`

---

### Feature 10: Trending Searches

**Description:** Show what others on campus are searching for.

**Acceptance Criteria:**
- [ ] Track top 10 searches in last 24h (campus-scoped)
- [ ] Update hourly
- [ ] Show in search dropdown when empty
- [ ] Privacy-safe (no identifying info)
- [ ] Minimum threshold (query must appear 3+ times)

**Implementation:**
```typescript
// In search API, after processing query:
await db.collection('searchTrends').add({
  query: normalizeQuery(query),
  campusId,
  timestamp: Timestamp.now(),
  // No userId — anonymous
});

// Hourly aggregation job:
const trends = await db.collection('searchTrends')
  .where('campusId', '==', campusId)
  .where('timestamp', '>=', twentyFourHoursAgo)
  .get();

// Count occurrences, filter >= 3, return top 10
```

---

### Feature 11: Serendipity Button

**Description:** "Surprise me" feature for discovery outside filter bubble.

**Acceptance Criteria:**
- [ ] Button in explore header
- [ ] Opens random space user hasn't visited
- [ ] Space must be active (last message < 7 days)
- [ ] Space must have > 10 members
- [ ] Tracks surprise → join conversion
- [ ] Fun animation/transition

**Implementation:**
```typescript
async function getRandomSpace(userId: string, campusId: string): Promise<Space | null> {
  const visitedSpaceIds = await getVisitedSpaceIds(userId);

  const candidates = await db.collection('spaces')
    .where('campusId', '==', campusId)
    .where('isActive', '==', true)
    .where('memberCount', '>=', 10)
    .where('lastActivityAt', '>=', sevenDaysAgo)
    .get();

  const unvisited = candidates.docs.filter(
    doc => !visitedSpaceIds.includes(doc.id)
  );

  if (unvisited.length === 0) return null;

  const randomIndex = Math.floor(Math.random() * unvisited.length);
  return unvisited[randomIndex].data() as Space;
}
```

---

### Feature 12: Ghost Space Conversion

**Description:** Clear path from ghost space interest to claimed space.

**Acceptance Criteria:**
- [ ] "Claim This Space" button on ghost cards
- [ ] Claim flow: verify affiliation → set as owner → invite members
- [ ] Waitlist notification when space is claimed
- [ ] Waitlisted users prompted to join when space goes live
- [ ] Founder badge for claimers

**Current Flow:**
1. User sees ghost space
2. Clicks "Notify Me" → joins waitlist
3. Nothing happens until someone claims

**Proposed Flow:**
1. User sees ghost space
2. Option A: "Notify Me" → waitlist
3. Option B: "Claim This Space" → ownership flow
4. On claim: waitlist users get push notification
5. Waitlist users auto-see "Join [Space]" prompt

---

### Feature 13: Cross-Space Recommendations

**Description:** "People who joined X also joined Y" patterns.

**Acceptance Criteria:**
- [ ] Show on space page sidebar
- [ ] Based on co-membership patterns (min 5 overlap)
- [ ] Max 3 recommendations
- [ ] Exclude spaces user already joined
- [ ] Update daily (batch job)

**Data Schema:**
```typescript
interface SpaceCoMembership {
  spaceId: string;
  coMemberships: {
    spaceId: string;
    overlapCount: number;
    overlapRatio: number;  // overlap / smaller space size
  }[];
  updatedAt: Timestamp;
}
```

---

### Feature 14: Time-Contextual Discovery

**Description:** Show different content based on time of day/week.

**Acceptance Criteria:**
- [ ] Morning (6-11): Study spaces, academic events
- [ ] Afternoon (11-17): All content balanced
- [ ] Evening (17-22): Social spaces, tonight's events
- [ ] Weekend: Activities, club events, social
- [ ] Subtle section labeling ("Happening Tonight")

**Implementation:**
```typescript
function getTimeContext(): 'morning' | 'afternoon' | 'evening' | 'weekend' {
  const now = new Date();
  const hour = now.getHours();
  const day = now.getDay();

  if (day === 0 || day === 6) return 'weekend';
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 17) return 'afternoon';
  return 'evening';
}

function getContextualSections(context: TimeContext) {
  switch (context) {
    case 'morning':
      return ['upcoming-study-sessions', 'academic-spaces', 'for-you'];
    case 'evening':
      return ['happening-tonight', 'social-spaces', 'for-you'];
    // ...
  }
}
```

---

### Feature 15: Discovery Onboarding Tutorial

**Description:** First-time explore page walkthrough.

**Acceptance Criteria:**
- [ ] Show for users who haven't explored before
- [ ] Highlight: search bar, For You section, categories
- [ ] 3 steps max
- [ ] "Skip" and "Next" buttons
- [ ] Mark as complete after dismissal
- [ ] Never show again preference

**Tutorial Steps:**
1. "Search for anything — spaces, people, events"
2. "For You shows spaces matching your interests"
3. "Join a space to get started"

---

## Integration Points

### Identity System
- **Input:** User interests, major, year from profile
- **Output:** Personalized recommendations
- **Hook:** `useSpacesHQ` provides identity claims

### Spaces System
- **Input:** Space data, membership, activity
- **Output:** Search results, recommendations
- **API:** `/api/spaces/browse-v2`, `/api/spaces/recommended`

### Tools System
- **Input:** Tool metadata, deployment count
- **Output:** Tool search results
- **Note:** Tools searchable in `/api/search`

### Awareness System
- **Input:** Real-time presence, online counts
- **Output:** "3 people online now" badges
- **Data:** `onlineCount` in space browse response

### Events System
- **Input:** Event data, RSVPs, dates
- **Output:** Event search, "Up Next" section
- **API:** `/api/events`, `/api/events/personalized`

### Notifications (Future)
- **Input:** Discovery matches
- **Output:** "New space matches your interests" push
- **Trigger:** When high-match space created

---

## Appendix: File References

### Core Discovery Files
| File | Purpose |
|------|---------|
| `/apps/web/src/app/explore/page.tsx` | Explore page UI |
| `/apps/web/src/app/api/search/route.ts` | Platform search API |
| `/apps/web/src/app/api/spaces/browse-v2/route.ts` | Space browsing |
| `/apps/web/src/app/api/spaces/recommended/route.ts` | Recommendations |
| `/apps/web/src/app/api/users/search/route.ts` | People search |
| `/apps/web/src/app/api/events/route.ts` | Event discovery |
| `/apps/web/src/app/home/page.tsx` | Home page discovery |

### Components
| File | Purpose |
|------|---------|
| `/apps/web/src/components/explore/ExploreSearch.tsx` | Search input |
| `/apps/web/src/components/explore/SpaceCard.tsx` | Space result card |
| `/apps/web/src/components/explore/GhostSpaceCard.tsx` | Unclaimed space |
| `/apps/web/src/components/explore/PeopleGrid.tsx` | People results |
| `/apps/web/src/components/explore/EventList.tsx` | Event results |

### Hooks
| File | Purpose |
|------|---------|
| `/apps/web/src/app/spaces/hooks/useSpacesHQ.ts` | Space HQ state |
| `/apps/web/src/components/entry/hooks/useEntry.ts` | Entry flow |

---

## Changelog

- **Feb 2026:** Initial comprehensive spec created
- **Jan 2026:** Cold start signals added to browse-v2
- **Dec 2025:** Behavioral recommendations algorithm implemented
