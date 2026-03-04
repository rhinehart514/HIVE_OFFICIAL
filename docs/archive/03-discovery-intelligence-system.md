# 03: Discovery & Intelligence System

How students find things. How HIVE gets smarter. The AI layer that makes the platform feel like it was built for each student individually.

**Decision filter:** Does this help a student find their people, join something real, and come back tomorrow?

**Core insight:** The #1 problem on every campus is that students don't find their communities until junior or senior year. Discovery is not a feature -- it's the entire product thesis.

---

## Existing Code Assessment

### What exists today

**Search (`/api/search/route.ts`, `/api/search/v2/route.ts`)**
- Platform-wide keyword search across spaces, profiles, posts, tools, events
- Relevance scoring with text match quality (exact > prefix > word-boundary > contains), recency decay (14-day half-life), engagement signals (logarithmic scaling), verified/active boosts
- Campus isolation via `campusId` from session
- Rate limiting, ghost mode filtering, privacy-aware profile search
- Search v2 re-exports v1 -- no differentiation yet
- Client hook `useSearch` with debouncing, caching (5-min TTL), recent searches in localStorage, abort controller for race conditions

**Feed (`/api/feed/route.ts`, `FeedRankingService`)**
- 8-factor ranking algorithm: space engagement (30%), content quality (20%), recency (15%), tool interaction value (15%), temporal relevance (10%), creator influence (5%), diversity (5%), social signals (0% -- deliberately zeroed)
- Privacy filtering: only shows posts from accessible spaces (public + member), ghost mode filtering, content moderation checks
- Diversity enforcement: content type and space variety with configurable strictness
- Feed configuration service (`feed-config.ts`) with time-based modes (late night, weekend, exam period, quiet hours)
- Supports both algorithmic and chronological sort

**Recommendations (`/api/spaces/recommended/route.ts`)**
- Behavioral psychology scoring: Anxiety Relief (40%) + Social Proof (30%) + Insider Access (30%)
- Categorized output: panic relief, where your friends are, insider access
- POST endpoint for onboarding: interest-based scoring with 50% weight on interests
- Uses DDD repository layer (`getServerSpaceRepository`)
- Batch-fetches member data to avoid N+1

**Browse (`/api/spaces/browse-v2/route.ts`)**
- DDD repository layer with trending, recommended, newest, popular sorts
- Cold start signal enrichment: upcoming event counts, next event info, mutual friend counts with avatars
- Cursor-based pagination, search filter, category filter
- Optional auth (works for unauthenticated browsing during onboarding)
- Cache headers (60s edge, 5min stale-while-revalidate)

**Explore Page (`/app/explore/page.tsx`)**
- Curated single-scroll feed: For You, Popular This Week, People in Your Major, Upcoming Events
- Client-side personalization using profile interests/major against space names/descriptions
- Inline search with parallel fetching of spaces, people, events
- Skeleton loading states, RSVP integration, motion animations

**Notifications (`use-notifications.ts`, `use-realtime-notifications.ts`)**
- Real-time via Firestore `onSnapshot` listeners
- SSE streaming via `/api/notifications/stream` with polling fallback
- Types: like, comment, follow, mention, space_invite, post, system
- Mark read/mark all/clear all, browser notification support, notification sounds
- Optimistic updates

**Keyboard Shortcuts (`use-keyboard-shortcuts.ts`)**
- Cmd+K for command palette, / for search
- Feed navigation (j/k), quick actions (l for like, c for comment)
- Page-specific scopes (feed, spaces, HiveLab, modal)
- `react-hotkeys-hook` integration

**AI Generation (`firebase-ai-generator.ts`)**
- HiveLab tool generation with Gemini 2.0 Flash
- Structured output with Zod schema validation
- Quality pipeline: validation, auto-fixes, scoring, tracking
- Prompt enhancement with RAG and learned patterns
- Streaming chunks for canvas animation
- Retry logic with mock generator fallback

### What's missing

1. **Semantic search** -- everything is keyword prefix matching. "Camera stuff" will never find "Photography Club"
2. **Natural language queries** -- "free food tomorrow" returns nothing useful
3. **Ask HIVE** -- no conversational search that answers questions
4. **Command palette** -- Cmd+K handler exists in shortcuts but no CommandBar component found in active use
5. **Per-user feed personalization** -- feed ranking uses space engagement but not inferred interests or behavioral signals
6. **Cold-start recommendations** -- onboarding interest matching is string-includes, not semantic
7. **AI-powered notifications** -- notification timing is not intelligent (no class schedule awareness, no engagement pattern learning)
8. **Nudges** -- no proactive discovery notifications ("students like you joined X")
9. **Daily briefing** -- no "your day on campus" summary
10. **Content summarization** -- no "catch up on what you missed"

---

## 1. Search System

### User Stories

**Freshman who doesn't know what to search for**
> "I want to meet people who like anime but I don't know if there's a club for that. I type 'anime' and find the Anime Club, but also a Gaming Club that hosts anime watch parties, and a Japanese Culture Club. I didn't know to search for those."

**International student with imperfect English**
> "I type 'cooking group' and find the Cooking Club, the Korean Student Association (weekly cooking events), and the Sustainability Club (farm-to-table workshops). The search understands what I mean, not just what I type."

**Club president looking for something specific**
> "I press Cmd+K, type 'room booking student union', and get the answer: 'Room bookings are handled through UB Student Activities. Here's the form link.' I didn't have to leave HIVE."

**Senior who's tried everything**
> "I type 'new clubs this semester' and see the 5 spaces created in the last 30 days, sorted by early momentum. I'm looking for something fresh."

### Architecture

```
User Input
    |
    v
[Query Pipeline]
    |
    +---> [Intent Classification] (is this a search? a question? a command?)
    |         |
    |         +---> SEARCH: "photography clubs" --> keyword + semantic hybrid
    |         +---> QUESTION: "where is free food today?" --> RAG pipeline
    |         +---> COMMAND: "go to my spaces" --> navigation action
    |         +---> TEMPORAL: "new this week" --> time-filtered query
    |
    +---> [Query Expansion]
    |         |
    |         +---> Synonym expansion: "coding" --> also search "programming", "computer science", "hackathon"
    |         +---> Typo tolerance: "photgraphy" --> "photography"
    |         +---> Entity recognition: "CS study groups" --> category=academic, topic=computer_science
    |
    +---> [Retrieval]
    |         |
    |         +---> Keyword search (existing Firestore prefix matching)
    |         +---> Semantic search (Firestore vector search with embeddings)
    |         +---> Hybrid merge with reciprocal rank fusion
    |
    +---> [Ranking]
    |         |
    |         +---> Text relevance (existing scoring)
    |         +---> Semantic similarity score
    |         +---> Personalization boost (user interests, past behavior)
    |         +---> Freshness/temporal relevance
    |         +---> Engagement quality (not vanity metrics -- active vs stale)
    |
    +---> [Results]
              |
              +---> Typed results with categories
              +---> "Did you mean?" suggestions
              +---> "Create it" prompt for zero results with demand signal
```

### What's Searchable

| Entity | Fields Indexed | Embedding Source | Notes |
|--------|---------------|-----------------|-------|
| Spaces | name, description, category, tags | name + description concatenated | Primary discovery unit |
| Events | title, description, location, space name | title + description | Only future/ongoing events |
| People | display name, handle, bio, major | bio + interests (opt-in only) | Privacy: only searchable if profile visibility allows |
| Posts | title, content, tags | title + content (first 500 chars) | Only from accessible spaces |
| Tools | name, description, type | name + description | Only public tools |
| Campus Info | building names, services, resources | structured data | Static campus knowledge base |

### Semantic Search via Firestore Vector Search

**Embedding Model:** Gemini `text-embedding-004` (768 dimensions)

**Embedding Pipeline:**
1. On document create/update, a Cloud Function generates embedding via Gemini
2. Embedding stored as `embedding_vector` field on the Firestore document
3. Search queries also embedded at query time
4. `find_nearest` on collection reference with campus isolation

**Data Model Addition:**
```typescript
// Added to spaces, events, posts, tools, profiles documents
{
  embedding_vector: number[], // 768-dim float array
  embedding_updated_at: Timestamp,
  embedding_source_hash: string, // SHA-256 of source text, for change detection
}
```

**Hybrid Search Strategy:**
```typescript
// Reciprocal Rank Fusion (RRF)
// Combines keyword and semantic results without needing score normalization
function hybridRank(keywordResults: Result[], semanticResults: Result[], k = 60): Result[] {
  const scores = new Map<string, number>();

  keywordResults.forEach((r, i) => {
    const rrf = 1 / (k + i + 1);
    scores.set(r.id, (scores.get(r.id) || 0) + rrf * 0.6); // keyword weight
  });

  semanticResults.forEach((r, i) => {
    const rrf = 1 / (k + i + 1);
    scores.set(r.id, (scores.get(r.id) || 0) + rrf * 0.4); // semantic weight
  });

  return [...scores.entries()]
    .sort(([, a], [, b]) => b - a)
    .map(([id]) => /* lookup result by id */);
}
```

### Command Palette (Cmd+K)

**Requirements:**
- Opens in <100ms (pre-rendered, display:none until triggered)
- Fuzzy matching -- typos don't break it
- Recent items surface first, then frequent items, then search results
- Actions: navigate, search, create space, create event, toggle settings
- Sections: Recent, Spaces, People, Events, Actions
- Keyboard nav: arrow keys, enter to select, tab to switch sections, escape to close

**API Contract:**
```
GET /api/search/instant?q={query}&limit=8
```
Response:
```json
{
  "results": [
    {
      "id": "space_123",
      "type": "space",
      "title": "Photography Club",
      "subtitle": "42 members",
      "icon": "camera",
      "url": "/s/photography-club",
      "action": "navigate"
    },
    {
      "type": "action",
      "title": "Create a new space",
      "icon": "plus",
      "action": "create_space"
    }
  ],
  "query": "photo",
  "latencyMs": 45
}
```

**Performance target:** <100ms for instant results (uses in-memory index of space/event names, falls back to Firestore for deep search).

### "Ask HIVE" -- Conversational Search

**What it is:** A student types a natural language question and gets an answer, not a list of links. Powered by RAG over campus data.

**Examples:**
- "What's happening this weekend?" --> Curated list of 3-5 events with context
- "How do I start a new club at UB?" --> Step-by-step answer from campus knowledge base
- "Are there any hackathons coming up?" --> Direct answer with event details and RSVP action
- "Who knows React on campus?" --> People with React in their skills/bio (opt-in only)

**Architecture:**
```
Question
    |
    v
[Intent Detection] -- Is this answerable from HIVE data?
    |
    +---> YES: [RAG Pipeline]
    |         |
    |         +---> Retrieve relevant documents (spaces, events, posts, campus info)
    |         +---> Generate answer with Gemini 2.0 Flash
    |         +---> Include source citations (which spaces/events informed the answer)
    |         +---> Stream response token-by-token
    |
    +---> NO / LOW CONFIDENCE:
              |
              +---> Fall back to regular search results
              +---> Show "I'm not sure about that. Here's what I found:" + search results
```

**API Contract:**
```
POST /api/search/ask
```
Request:
```json
{
  "question": "What's happening this weekend?",
  "context": {
    "interests": ["photography", "hiking"],
    "spaces": ["photo-club", "outdoor-adventure"]
  }
}
```
Response (streamed):
```json
{
  "answer": "Here's what's coming up this weekend that matches your interests:\n\n1. **Photo Walk at Delaware Park** -- Photography Club, Saturday 2pm. 12 students going.\n2. **Hiking Trip to Letchworth** -- Outdoor Adventure Club, Sunday 8am. 8 spots left.\n3. **Open Mic Night** -- Student Union, Friday 7pm. All campus event.",
  "sources": [
    { "type": "event", "id": "evt_123", "title": "Photo Walk at Delaware Park" },
    { "type": "event", "id": "evt_456", "title": "Hiking Trip to Letchworth" },
    { "type": "event", "id": "evt_789", "title": "Open Mic Night" }
  ],
  "actions": [
    { "type": "rsvp", "eventId": "evt_123", "label": "RSVP to Photo Walk" },
    { "type": "rsvp", "eventId": "evt_456", "label": "RSVP to Hiking Trip" }
  ],
  "confidence": 0.92,
  "latencyMs": 1200
}
```

**Quality bar:**
- Answers must cite sources (which spaces/events)
- If confidence < 0.7, show search results instead of generated answer
- No hallucinations about campus data -- if HIVE doesn't know, it says so
- Latency: streaming begins within 500ms, full answer within 2s
- Tone: sharp upperclassman, not corporate chatbot

**Cost model:**
- Gemini 2.0 Flash: ~$0.001 per query
- At 5,000 students, 10 queries/day average = $50/month
- Rate limit: 20 Ask HIVE queries per user per hour

### Search UI

**Surfaces:**
1. **Command Palette (Cmd+K)** -- Global, instant, keyboard-first
2. **Explore page search bar** -- Full search with category filters and results
3. **In-space search** -- Search within a specific space's posts, events, members
4. **Ask HIVE** -- Conversational interface in Command Palette (tab or toggle)

**Zero results handling (per 2026 standards):**
- Never "No results found" alone
- Show: what they searched, suggestion to broaden, and a fallback action
- If they searched for something that doesn't exist: "No spaces match 'rock climbing.' Want to start one? 4 other students searched for this too."
- Track zero-result queries to identify demand signals for new spaces

### Edge Cases

- **Single character queries:** Require minimum 2 characters (existing behavior)
- **Emoji search:** Strip emojis, search underlying text
- **Very long queries:** Truncate to 200 chars for embedding, use full text for keyword
- **Special characters:** Escape for regex, strip for embedding
- **Concurrent searches:** Abort previous request (existing AbortController pattern)
- **Offline:** Show cached results with "you're offline" indicator
- **Rate limiting:** 30 searches/minute per IP (existing), 20 Ask HIVE/hour per user (new)

### Acceptance Criteria

- [ ] "Photography" and "camera stuff" return overlapping results
- [ ] "Free food tomorrow" returns events with food tags happening tomorrow
- [ ] Cmd+K opens in <100ms, first results in <200ms
- [ ] Ask HIVE streams answer within 500ms first token
- [ ] Zero results shows actionable suggestion, not dead end
- [ ] Search works for 2-character queries without lag
- [ ] All results respect campus isolation and privacy settings
- [ ] Recent searches stored locally only, clearable

---

## 2. Recommendation Engine

### User Stories

**Freshman, minute 1 (cold start)**
> "I just finished onboarding. I said I'm interested in photography, I'm a CS major, and I'm looking for friends. My home screen shows the Photography Club, ACM chapter, and a dorm floor social space. I didn't have to browse anything."

**Student, week 1 (warming)**
> "I joined the Photography Club and attended a CS study session. Now HIVE suggests the Film Club (creative overlap), the Hackathon Committee (CS + building), and a study group for my algorithms class. It's learning from what I actually do, not just what I said."

**Student, month 1 (hot)**
> "HIVE knows I attend evening events, prefer small groups, and am interested in the intersection of tech and art. It surfaces a new Digital Art collective before I even knew it existed. It also suggests a student I have 3 mutual spaces with but haven't connected with yet."

**Commuter student**
> "I'm on campus 3 hours a day. HIVE doesn't suggest things that require being around at 9pm. It knows my schedule pattern and recommends spaces with afternoon meetings and async participation options."

### Recommendation Pipeline

```
[Signal Collection]
    |
    +---> Explicit signals (onboarding interests, profile data, stated goals)
    +---> Behavioral signals (joins, RSVPs, taps, time-on-page, ignores)
    +---> Social signals (friends' spaces, mutual connections, same-major peers)
    +---> Temporal signals (time-of-day usage, day-of-week patterns, semester timing)
    |
    v
[User Vector]
    |
    +---> Interest embedding (from explicit + behavioral, 768-dim)
    +---> Activity pattern (when, how often, what types)
    +---> Social graph position (connected to whom, in which spaces)
    |
    v
[Candidate Generation]
    |
    +---> Content-based: spaces/events similar to user's interest vector
    +---> Collaborative: spaces that similar users joined
    +---> Social: spaces where friends/connections are active
    +---> Temporal: spaces with upcoming events matching user's free time
    +---> Serendipity: 20% wildcard from different interest domains
    |
    v
[Scoring & Ranking]
    |
    +---> Relevance score (semantic similarity to user vector)
    +---> Social proof score (friends/connections in space)
    +---> Momentum score (growing spaces, recent activity)
    +---> Freshness penalty (already-seen items deprioritized)
    +---> Diversity enforcement (no more than 2 from same category in top 5)
    |
    v
[Delivery]
    |
    +---> Home feed "For You" section
    +---> Explore page recommendations
    +---> Notification nudges (weekly digest, not per-item)
    +---> In-space "related spaces" sidebar
```

### Cold-Start Strategy (Minute 1)

**From onboarding signals only:**
1. Email domain --> campus (automatic)
2. Year (freshman/sophomore/junior/senior/grad) --> cohort preferences
3. 3-5 stated interests --> semantic match against space embeddings
4. Goals (friends/career/skills/leadership/fun) --> space category weighting
5. Living situation (commuter/resident) --> filter by accessibility

**Initial recommendation formula:**
```
Score = (InterestSimilarity * 0.50) +
        (CategoryMatch * 0.20) +
        (PopularityWithCohort * 0.20) +
        (Serendipity * 0.10)
```

Where `PopularityWithCohort` = spaces popular among same-year students. This is the existing `calculateInterestScore` + `calculateAnxietyReliefScore` approach but with semantic matching instead of string-includes.

### Warm Strategy (Week 1)

**Add behavioral signals:**
- Spaces tapped but not joined (interest without commitment)
- Spaces joined (strong positive signal)
- Events RSVPed to (topic + time preference signal)
- Time-of-day usage (morning person vs night owl)
- Content types engaged with (events vs posts vs tools)

**Updated formula:**
```
Score = (InterestSimilarity * 0.30) +
        (BehavioralAffinity * 0.30) +
        (SocialProof * 0.20) +
        (TemporalFit * 0.10) +
        (Serendipity * 0.10)
```

### Hot Strategy (Month 1)

**Deep personalization:**
- Full behavioral interest vector (updated on every meaningful action)
- Social graph analysis (which spaces do their closest connections inhabit?)
- Schedule pattern inference (don't recommend Tuesday 4pm events if user is never on HIVE then)
- Content creation patterns (do they post? comment? lurk? lead?)
- Engagement decay (interests that fade get deprioritized)

**Updated formula:**
```
Score = (UserVectorSimilarity * 0.25) +
        (BehavioralAffinity * 0.25) +
        (SocialGraphProximity * 0.20) +
        (MomentumSignal * 0.10) +
        (TemporalFit * 0.10) +
        (Serendipity * 0.10)
```

### Avoiding Filter Bubbles

**Serendipity mechanisms:**
1. **20% wildcard slot** -- Every recommendation set includes items from outside the user's predicted interests
2. **Cross-domain suggestions** -- "Students in CS who also love cooking joined..." bridges interest domains
3. **"Trending on campus"** -- One section is campus-wide, not personalized, to show what the broader community does
4. **New space boost** -- Spaces less than 2 weeks old get a temporary boost regardless of user affinity
5. **Category diversity** -- Never more than 2 recommendations from the same category in a top-5 list

**Anti-pattern enforcement:**
- No engagement bait: recommendations are not optimized for time-on-platform
- No FOMO: "12 students joined today" framing is informational, not pressure
- No dark retention: recommendations serve discovery, not notification addiction
- Transparent: students can see and reset their interest profile

### Data Model

```typescript
// User Interest Vector (stored per user)
interface UserInterestProfile {
  userId: string;
  campusId: string;

  // Explicit signals (from onboarding + profile)
  explicit: {
    interests: string[];         // Raw interest labels
    major: string | null;
    year: string | null;
    goals: string[];             // friends, career, skills, leadership, fun
    livingStatus: 'commuter' | 'resident' | null;
  };

  // Computed interest embedding
  interestEmbedding: number[];   // 768-dim, updated weekly from behavior
  embeddingUpdatedAt: Timestamp;

  // Behavioral signals (rolling 30-day window)
  behavioral: {
    spacesJoined: string[];      // Space IDs joined
    spacesViewed: string[];      // Space IDs viewed but not joined
    eventsAttended: string[];    // Event IDs RSVPed/attended
    categoriesEngaged: Map<string, number>; // Category --> engagement count
    peakActivityHours: number[]; // Hours with most activity
    contentTypesEngaged: Map<string, number>; // Content type --> count
  };

  // Reset/control
  lastResetAt: Timestamp | null;
  personalizationLevel: 'minimal' | 'standard' | 'full'; // Student control
  updatedAt: Timestamp;
}
```

### API Contracts

**Get Recommendations:**
```
GET /api/recommendations?type=spaces&limit=10&include_reasons=true
```
Response:
```json
{
  "recommendations": [
    {
      "id": "space_123",
      "type": "space",
      "name": "Photography Club",
      "reason": "Matches your interest in photography",
      "reasonType": "interest_match",
      "score": 0.87,
      "socialProof": {
        "friendCount": 2,
        "friendNames": ["Alex", "Jordan"]
      },
      "momentum": {
        "recentJoins": 8,
        "nextEvent": "Photo Walk -- Saturday"
      }
    }
  ],
  "meta": {
    "strategy": "warm",
    "serendipityCount": 2,
    "profileCompleteness": 0.7
  }
}
```

**Reset Interest Profile:**
```
POST /api/profile/interests/reset
```
Clears behavioral signals, keeps explicit onboarding data. Student gets fresh start.

### Acceptance Criteria

- [ ] Minute-1 user sees relevant spaces immediately after onboarding (not empty)
- [ ] Week-1 recommendations reflect actual behavior, not just stated interests
- [ ] At least 1 in 5 recommendations is outside the user's primary interest domain
- [ ] No more than 2 recommendations from the same category in a top-5 list
- [ ] Student can view and reset their interest profile at any time
- [ ] Commuter student doesn't get recommendations for 9pm events they can't attend
- [ ] Recommendations include "why" (per 2026 standards: every AI interaction has visible reasoning)

---

## 3. AI Layer (Cross-Product)

### Touchpoint Map

Where AI manifests across HIVE, organized by visibility to the student:

#### Invisible AI (student doesn't know it's there)

| Touchpoint | What It Does | Model | Latency Target | Cost/Request |
|-----------|-------------|-------|---------------|-------------|
| Feed ordering | Personalized ranking of activity items | Rules-based (existing FeedRankingService) + per-user weight adjustments | <100ms | $0 (no LLM) |
| Search ranking | Semantic re-ranking of keyword results | Embedding similarity (vector math) | <50ms (after embed) | $0 (cached embed) |
| Smart defaults | Pre-fill event descriptions, suggest meeting times | Gemini 2.0 Flash structured output | <500ms | ~$0.001 |
| Notification timing | Learn when student engages, deliver at optimal time | Heuristic model from engagement data | N/A | $0 |
| Interest inference | Build interest profile from behavior | Batch embedding computation | N/A (async) | ~$0.001/user/week |

#### Visible AI (student interacts with it)

| Touchpoint | What It Does | Model | Latency Target | Cost/Request |
|-----------|-------------|-------|---------------|-------------|
| Ask HIVE | Answer natural language questions about campus | Gemini 2.0 Flash with RAG | <2s full answer | ~$0.001 |
| Event creation assist | Generate event description from minimal input | Gemini 2.0 Flash structured | <1s | ~$0.001 |
| Space creation assist | Draft compelling space description | Gemini 2.0 Flash | <1s | ~$0.001 |
| HiveLab tool generation | Generate tool compositions from prompts | Gemini 2.0 Flash structured (existing) | <3s | ~$0.002 |
| Daily briefing | "Your day on campus" personalized summary | Gemini 2.0 Flash | <2s | ~$0.001 |
| Catch-up summary | "What you missed" for spaces with activity | Gemini 2.0 Flash | <1.5s | ~$0.001 |
| Onboarding conversation | Conversational interest gathering | Gemini 2.0 Flash | <1s per turn | ~$0.001/turn |

### AI Economics

**Per-campus cost model (5,000 students):**

| Capability | Daily Active Users | Requests/User/Day | Cost/Day | Monthly |
|-----------|-------------------|-------------------|---------|---------|
| Search embeddings (query-time) | 2,000 | 5 | $10.00 | $300 |
| Ask HIVE | 500 | 3 | $1.50 | $45 |
| Event/space creation assist | 50 | 2 | $0.10 | $3 |
| Daily briefing | 1,000 | 1 | $1.00 | $30 |
| Catch-up summaries | 800 | 2 | $1.60 | $48 |
| Interest embedding (weekly batch) | 3,000 | 0.14 | $0.42 | $13 |
| HiveLab generation (existing) | 100 | 1 | $0.20 | $6 |
| **Total** | | | **$14.82** | **~$445** |

This is within budget for a campus platform. Key insight: most AI costs are from embeddings at query time. Caching embeddings for common queries reduces this by 50-70%.

### Model Selection per Task

| Task | Model | Why |
|------|-------|-----|
| Text embeddings | `text-embedding-004` | Firestore native, 768-dim, fast |
| Structured output (events, tools) | Gemini 2.0 Flash | Cheap, fast, Zod schema compliance |
| Conversational (Ask HIVE, onboarding) | Gemini 2.0 Flash | Good enough quality at 100x cheaper than Pro |
| Content moderation | Rules-based first, Gemini Flash for edge cases | Cost: $0 for 95% of content |
| Interest inference | Embedding + lightweight classification | No LLM needed, pure math |

### Fallback Strategy

Every AI feature has a non-AI fallback:
1. **Semantic search fails** --> Fall back to keyword search (existing behavior)
2. **Ask HIVE fails** --> Show regular search results with "Search results for..."
3. **Event creation assist fails** --> Empty form (existing behavior)
4. **Daily briefing fails** --> Show raw list of events/notifications
5. **Recommendation embedding fails** --> Use interest string matching (existing behavior)
6. **Model rate limit hit** --> Queue and retry, show cached/stale results

### Quality Bar (from 2026 Standards)

- AI responses feel like a sharp upperclassman, not a corporate chatbot
- No hallucinations about real campus data -- if AI doesn't know, it says so
- AI suggestions appear within 500ms for inline, 2s max for generative responses
- AI never decides FOR the student -- it suggests, the student decides
- Every AI interaction has a visible "why"
- No "AI-powered" badges. If the AI is good, students won't need to be told

### API Contracts

**AI-Assisted Event Creation:**
```
POST /api/ai/assist/event
```
Request:
```json
{
  "input": "pizza social friday 7pm student union",
  "spaceId": "photography-club",
  "spaceContext": {
    "name": "Photography Club",
    "category": "student_organizations",
    "memberCount": 42
  }
}
```
Response:
```json
{
  "title": "Photography Club Pizza Social",
  "description": "Grab a slice and hang out with fellow photographers! Great way to meet new members and talk about upcoming photo walks.",
  "startTime": "2026-02-13T19:00:00-05:00",
  "endTime": "2026-02-13T21:00:00-05:00",
  "location": "Student Union, Room 210",
  "tags": ["social", "food", "photography"],
  "confidence": 0.95
}
```

**Daily Briefing:**
```
GET /api/ai/briefing
```
Response:
```json
{
  "greeting": "Good morning. Here's your Thursday.",
  "sections": [
    {
      "type": "events_today",
      "title": "2 events today",
      "items": [
        {
          "title": "CS 250 Study Group",
          "time": "3:00 PM",
          "location": "Capen Library",
          "action": { "type": "rsvp", "eventId": "evt_123" }
        }
      ]
    },
    {
      "type": "space_activity",
      "title": "Active in your spaces",
      "summary": "3 new posts in Photography Club, 1 announcement in ACM"
    },
    {
      "type": "suggestion",
      "title": "You might like",
      "item": {
        "type": "event",
        "title": "Tech Career Fair",
        "reason": "CS majors in your year attended last semester"
      }
    }
  ],
  "generatedAt": "2026-02-07T08:00:00-05:00"
}
```

---

## 4. Feed & Content Surfacing

### What Content Surfaces and Why

HIVE's feed is an **activity stream**, not a social feed. The existing architecture already reflects this -- social signals (likes/comments) are weighted at 0%. The feed shows what's happening in spaces you care about, not what's popular.

**Content types ranked by value:**

| Type | Why It Matters | Existing Weight | Proposed Weight |
|------|---------------|----------------|-----------------|
| Space events (upcoming) | Actionable, time-sensitive | Temporal relevance (10%) | Temporal relevance (15%) |
| Builder announcements | Space leaders communicating | Creator influence (5%) | Creator influence (10%) |
| Tool-generated content | Spaces using HIVE features | Tool interaction (15%) | Tool interaction (10%) |
| Event recaps | Social proof of activity | Content quality (20%) | Content quality (15%) |
| New space launches | Discovery opportunity | N/A | New: launch boost (10%) |

### Feed Architecture

```
[Content Sources]
    |
    +---> Space posts (from user's spaces)
    +---> Space events (upcoming, from any accessible space)
    +---> Campus-wide announcements
    +---> Tool-generated content
    +---> Recommendation injections (1 per 8 items)
    |
    v
[Privacy Filter] (existing -- space visibility + ghost mode)
    |
    v
[Ranking] (existing 8-factor FeedRankingService)
    |
    +---> Per-user weight personalization (NEW)
    |       If user clicks events 3x more than posts,
    |       boost temporal_relevance weight for this user
    |
    v
[Diversity Enforcement] (existing -- content type + space variety)
    |
    v
[Injection Points]
    |
    +---> Position 3: "Recommended for you" space card (if user has <5 spaces)
    +---> Position 8: "Happening now" event (if any live events)
    +---> Position 15: "You're all caught up" marker
    |
    v
[Delivery]
    |
    +---> Paginated feed with cursor-based pagination
    +---> "You're caught up" natural stopping point (per anti-patterns: no infinite scroll without stopping)
```

### "For You" vs Chronological

**Decision: Default to algorithmic ("For You"), with chronological available as toggle.**

Why:
- Chronological fails when there's little content (cold campus) -- most recent post could be 3 days old
- Chronological fails when there's too much content -- the student misses time-sensitive events buried under posts
- Algorithmic ensures the most actionable content (events, announcements) surfaces regardless of timing
- Students in 2026 expect personalized feeds -- chronological feels like 2019

**But:** Always offer a chronological toggle. Some students want control. The existing `sortBy: 'algorithm' | 'recent' | 'engagement'` parameter already supports this.

### "You're Caught Up" Marker

After a student has scrolled through all content posted since their last visit (or all content from the last 48 hours, whichever is shorter), show:

> "You're all caught up for now. Check back later or explore something new."
>
> [Explore New Spaces] button

This is a natural stopping point that respects the anti-dark-pattern standard. No infinite scroll without a boundary.

### Per-User Feed Weight Personalization

**Concept:** Instead of one global weight config, each user gets slight adjustments based on their engagement patterns.

**Implementation:**
```typescript
// Stored per user, updated weekly by Cloud Function
interface UserFeedWeights {
  userId: string;
  adjustments: {
    temporalRelevance: number;  // -0.1 to +0.1 adjustment
    spaceEngagement: number;
    contentQuality: number;
    toolInteractionValue: number;
  };
  basedOn: {
    eventClickRate: number;     // How often they click on events vs other content
    toolInteractionRate: number;
    postReadRate: number;
    sampleSize: number;         // How many actions this is based on
  };
  updatedAt: Timestamp;
}
```

The adjustments are small (max +/- 10% weight shift) and based on real engagement. This is invisible personalization that makes the feed feel slightly more "in tune" with each student.

### API Contract (Enhancement to Existing)

No new endpoint -- the existing `/api/feed` gains:
- Per-user weight adjustments (loaded from `userFeedWeights` document, cached)
- "You're caught up" marker in response when content exhausted
- Recommendation injection points

### Acceptance Criteria

- [ ] Feed shows events before they happen, not after
- [ ] "You're caught up" appears after scrolling through recent content
- [ ] Feed never shows content from spaces the user can't access
- [ ] Algorithmic feed is default; chronological is one tap away
- [ ] At least 1 recommendation injection per 15 feed items for users with <5 spaces
- [ ] Feed loads in <300ms (p95) per existing performance standards

---

## 5. Notifications & Nudges

### Philosophy

The right message at the right time. Notifications are the most powerful tool for re-engagement and also the most dangerous for user trust. One bad notification and a student mutes everything.

**Core principle:** Every notification must pass the "would I want to receive this?" test at the moment it would be delivered.

### Notification Types

#### Transactional (always delivered)
| Type | Trigger | Example | Channel |
|------|---------|---------|---------|
| Event reminder | 1 hour before RSVPed event | "CS Study Group starts in 1 hour -- Capen Library" | Push + in-app |
| Space invite | Someone invites user to a space | "Alex invited you to Photography Club" | In-app |
| Direct mention | Someone @mentions the user | "@Jordan mentioned you in ACM: 'Great presentation!'" | Push + in-app |
| Role change | User's role changes in a space | "You're now an admin of Photography Club" | In-app |
| Account action | Password change, email verify | "Email verified. Welcome to HIVE." | In-app |

#### Follow-through (triggered by user's prior action)
| Type | Trigger | Example | Channel |
|------|---------|---------|---------|
| Event follow-up | After attending an event | "How was the Photo Walk? Photography Club has 2 more events this month" | In-app |
| Space onboarding | 24h after joining a space | "Welcome to Photography Club. Here's what members are talking about this week" | In-app |
| Goal progress | Based on onboarding goals | "You said you wanted to make friends -- you've connected with 3 people this week" | In-app |

#### Discovery (proactive, AI-timed)
| Type | Trigger | Example | Channel |
|------|---------|---------|---------|
| Weekly digest | Monday morning, personalized | "Your week on campus: 3 events, 2 new spaces in your interests" | In-app |
| Space suggestion | New space matches user interests | "New: Digital Art Collective. Matches your interest in design" | In-app |
| People suggestion | High mutual-space overlap | "You and Alex are in 3 of the same spaces. Connect?" | In-app |
| Trending on campus | Campus-wide moment | "47 students RSVPed to the Spring Concert. See details" | In-app |

#### Re-engagement (for dormant users only)
| Type | Trigger | Example | Channel |
|------|---------|---------|---------|
| Activity in your space | User hasn't opened in 7+ days | "3 new events in your spaces this week" | Push (if enabled) |
| Semester kickoff | Start of new semester | "Welcome back. 12 new spaces launched this semester" | Push |

### What We Never Send

Per 2026 standards -- no dark patterns:
- "You're missing out!" (FOMO)
- "You haven't posted in a while!" (guilt)
- "3 people viewed your profile" (vanity)
- "X is happening right now" for things the user didn't RSVP to (pressure)
- Streak notifications or daily login rewards
- Notification counts as engagement bait (red badge with inflated numbers)

### AI Timing Intelligence

**Concept:** Learn when each student actually engages with notifications and deliver at optimal times.

**Signals:**
1. Time-of-day open rates (don't send at 2am, don't send during known class times)
2. Day-of-week engagement (some students use HIVE more on weekends)
3. Response latency (if they always open notifications within 5 min at 3pm, that's a good time)
4. Notification mute history (if they muted after a burst, reduce frequency)

**Implementation:**
```typescript
interface NotificationTimingProfile {
  userId: string;
  optimalHours: number[];        // Hours with highest open rate
  avoidHours: number[];          // Hours with lowest engagement (class times, sleep)
  preferredDays: number[];       // 0=Sun through 6=Sat
  maxPerDay: number;             // Learned threshold before fatigue
  avgResponseLatencyMinutes: number;
  updatedAt: Timestamp;
}
```

**Fallback defaults (before enough data):**
- Optimal: 8am, 12pm, 5pm (between classes)
- Avoid: 11pm-7am, known class blocks
- Max: 5 non-transactional notifications per day

### Volume Control

**System limits:**
- Transactional: unlimited (these are responses to user actions)
- Discovery: max 3 per day
- Re-engagement: max 1 per week
- Total non-transactional push notifications: max 5 per day

**Student controls:**
- Per-space notification settings (all, mentions only, none)
- Per-type notification settings (events, posts, system)
- Quiet hours (custom or "don't disturb during class")
- Notification pause ("mute for 2 hours" / "mute until tomorrow")
- Complete notification disable (nuclear option, always available)

### Notification Pipeline

```
[Trigger Event]
    |
    v
[Should Notify?]
    |
    +---> Is this notification type enabled for this user? (per-space, per-type settings)
    +---> Is user in quiet hours? (system or custom)
    +---> Has user hit daily volume cap?
    +---> Is user currently active in-app? (if yes, in-app only, skip push)
    +---> Has user already seen this content? (dedup)
    |
    v
[When to Deliver?]
    |
    +---> Transactional: immediately
    +---> Discovery: batch until next optimal delivery window
    +---> Re-engagement: schedule for user's highest-engagement hour
    |
    v
[Compose Notification]
    |
    +---> Title: clear, specific, actionable
    +---> Body: contextual (include space name, event details, person name)
    +---> Action: deep link to the relevant content
    +---> Group: bundle related notifications ("3 new in Photography Club")
    |
    v
[Deliver]
    |
    +---> In-app: Firestore write to user's notification subcollection (existing)
    +---> Push: Web Push API (if permission granted)
    +---> Bundle: group notifications from same space within 30-minute window
```

### Data Model

```typescript
// Enhanced notification document (extends existing)
interface EnhancedNotification {
  id: string;
  userId: string;
  type: 'transactional' | 'follow_through' | 'discovery' | 're_engagement';
  category: 'event_reminder' | 'space_invite' | 'mention' | 'suggestion' | 'digest' | 'system';

  title: string;
  body: string;
  actionUrl: string;

  // Delivery metadata
  scheduledAt: Timestamp;
  deliveredAt: Timestamp | null;
  readAt: Timestamp | null;

  // AI metadata
  timing: {
    reason: 'optimal_hour' | 'immediate' | 'batched' | 'scheduled';
    confidence: number;
  };

  // Grouping
  groupKey: string | null;        // e.g., "space_photography-club_2026-02-07"
  groupCount: number;             // How many notifications in this group

  // Source
  source: {
    type: 'space' | 'event' | 'user' | 'system' | 'ai';
    id: string;
    name: string;
  };

  createdAt: Timestamp;
}
```

### Acceptance Criteria

- [ ] Event reminders arrive 1 hour before RSVPed events
- [ ] Students can control notifications per-space and per-type
- [ ] No more than 5 non-transactional notifications per day
- [ ] Notifications bundle from same space within 30 minutes
- [ ] No FOMO, guilt, or pressure language in any notification
- [ ] Quiet hours respected (no notifications during set hours)
- [ ] Students can mute all notifications with one tap
- [ ] Notification timing adapts to student's engagement patterns within 2 weeks
- [ ] "Pause notifications" available for 2-hour and until-tomorrow options

---

## Cross-System Dependencies

### Dependencies on Identity & Home System (Spec 02)
- **Onboarding signals** feed cold-start recommendations (interests, year, goals, living status)
- **Profile data** (major, interests) used for search personalization and recommendation scoring
- **Home page** is the primary surface for feed, briefing, and recommendation delivery
- **Profile interest reset** must clear behavioral signals in recommendation engine

### Dependencies on Spaces & Events System (Spec 03)
- **Space metadata** (name, description, category, member count) is the core content for search and recommendations
- **Event data** drives temporal ranking in feed and search
- **Space membership** is the primary behavioral signal for recommendations
- **Space creation** triggers AI-assisted description generation
- **Event creation** triggers AI-assisted event details generation

### Dependencies on Communication & Social System (Spec 05)
- **Connection graph** feeds social proof in recommendations ("2 friends are members")
- **Mentions** trigger transactional notifications
- **Chat activity** could feed interest inference (which spaces are students most active in chat?)
- **Notification preferences** must be unified across system-level and communication-level notifications

### Infrastructure Dependencies
- **Firestore Vector Search** -- required for semantic search. GA in Firestore, needs embedding field setup
- **Cloud Functions** -- for embedding pipeline (generate on write), recommendation batch jobs, notification scheduling
- **Gemini 2.0 Flash** -- for Ask HIVE, content assist, briefings. Available via Firebase AI SDK (already integrated)
- **Vercel AI SDK** -- for streaming responses to client. Already in stack

### Migration Path from Existing Code
1. **Search**: Extend existing `/api/search/route.ts` with semantic branch. Keep keyword search as primary, add vector search as secondary with hybrid merge. No breaking changes
2. **Feed**: Extend existing `FeedRankingService` with per-user weight adjustments. Add injection points for recommendations. No breaking changes
3. **Recommendations**: Replace string-includes matching in `/api/spaces/recommended/route.ts` with embedding similarity. Same API contract, better results
4. **Notifications**: Extend existing notification system with timing intelligence and volume control. New fields on notification documents, backward compatible
5. **Command Palette**: New component, wired to existing `useGlobalShortcuts` Cmd+K handler

---

## Implementation Priority

Based on impact/effort ratio and HIVE's decision filter:

| Priority | Feature | Effort | Impact | Ship Target |
|----------|---------|--------|--------|-------------|
| 1 | Semantic search (vector embeddings on spaces/events) | 1-2 weeks | Transforms discovery | Week 1-2 |
| 2 | Command Palette (Cmd+K with instant results) | 1 week | Power user delight, 2026 table stakes | Week 2-3 |
| 3 | Recommendation engine (cold-start from onboarding) | 2 weeks | "Come back tomorrow" feature | Week 3-5 |
| 4 | AI-assisted event/space creation | 1 week | Raises content quality floor | Week 4-5 |
| 5 | Notification timing + volume control | 2 weeks | Trust and retention | Week 5-7 |
| 6 | Ask HIVE (conversational search with RAG) | 2-3 weeks | Headline feature | Week 6-8 |
| 7 | Daily briefing | 1 week | "Your day on campus" | Week 7-8 |
| 8 | Per-user feed personalization | 2 weeks | Invisible quality improvement | Week 8-10 |
| 9 | Behavioral interest inference pipeline | 2-3 weeks | Powers everything long-term | Ongoing from Week 4 |
