# Search

> How intent meets content on a campus platform

---

## Current State

HIVE search today is functional but brittle. There are two overlapping search surfaces and no fuzzy matching anywhere.

**Surface 1: Explore Page Search** (`/explore?q=...`)
- User types in `ExploreSearch` component (plain `<Input>` with debounce)
- Fires 3 parallel fetches: `browse-v2?search=`, `POST /api/users/search`, `GET /api/events?search=`
- Results grouped into Spaces, Ghost Spaces, People, Events sections
- No autocomplete, no suggestions, no recent searches
- 300ms debounce, URL state sync

**Surface 2: Platform Search API** (`/api/search?q=...`)
- Searches 5 collections in parallel: spaces, profiles, posts, tools, events
- Sophisticated relevance scoring (exact: 100, prefix: 80, contains: 60, partial: 40)
- Recency boost with 14-day half-life exponential decay
- Engagement boost with log-scaled popularity
- Ghost mode filtering via `ViewerContext`
- Campus isolation via session JWT
- Rate limited per IP
- **Not connected to any UI.** The explore page doesn't use this API. It calls `browse-v2`, `users/search`, and `events` separately.

**Surface 3: Command Palette** (`Cmd+K`)
- Client-side `.includes()` filtering of a static `items` array
- Designed for navigation commands + space jumping
- Not connected to any search API
- No dynamic results from the platform

**Core Technical Gaps:**
- `browse-v2` uses `.includes()` on loaded documents -- no index, no Firestore query
- `/api/search` uses Firestore prefix queries (`>=` / `<= \uf8ff`) -- only matches from beginning of field
- Neither supports fuzzy matching, typo tolerance, or stemming
- "comptuer science" returns zero results for "Computer Science"
- No search analytics -- zero visibility into what students search for
- No "did you mean" suggestions
- No search history (localStorage or server)
- No faceted filtering in UI (category-only filter exists in API)
- Security issue: `/api/search` falls back to `getDefaultCampusId()` for unauthenticated requests -- allows unauthenticated browsing
- Dead URL patterns in search results: `/user/${handle}` and `/profile/${id}` instead of `/u/[handle]`
- N+1 query in user search: mutual spaces calculated per-user with separate Firestore queries

**What actually works well:**
- Relevance scoring in `/api/search` is thoughtful (text quality + recency decay + engagement + verified boost)
- Cold start enrichment (event counts, next event, mutual friends) helps empty spaces surface
- Recommendation engine is strong (anxiety relief + social proof + insider access)
- Parallel search execution keeps latency reasonable
- Campus isolation is iron-clad on the auth path

---

## The Opportunity

Campus search is fundamentally different from web search. You are not searching the internet -- you are searching a known, bounded universe. University at Buffalo: 32,000 students, 300+ organizations, maybe 500 events per semester. The entire searchable corpus fits in memory.

This changes everything about what search can be.

**The bounded universe advantage:**
- You can load the entire space catalog client-side and search it with zero latency
- You can do real fuzzy matching without a search service -- the dataset is small enough for Fuse.js
- You can build a complete autocomplete index that fits in a single API response
- You can pre-compute "similar to" relationships for every entity
- You know every entity type and can route queries intelligently

**What students actually search for on a campus platform:**
- Navigation: "engineering club" (they know roughly what they want, need the exact space)
- Discovery: "things to do tonight" (intent-based, not keyword-based)
- People: "sarah cs major" (finding a specific person with partial info)
- Action: "create a poll" (they want to DO something, not find something)
- Meta: "how do I change my profile" (platform help, not content search)

**The real product insight:** Search queries are the purest signal of unmet need. Every search with zero results is a student telling you exactly what's missing from your platform. "study group for MTH 241" with no results means no one has created that space yet. That's not a search failure -- it's a creation prompt.

---

## Feature Ideas

### 1. Unified Search with Fuse.js Client-Side Index

**Problem:** Two disconnected search surfaces (explore page calls 3 APIs separately, `/api/search` exists but nothing uses it). Latency is 300ms debounce + network round-trip + Firestore queries. Typos return nothing.

**Shape:** On app load (or on first search focus), fetch a lightweight search index from a single API endpoint. The index contains every space name/description/category, every public profile name/handle/major, every upcoming event title/date, and every tool name. Total payload: ~50-100KB for a campus of 300 orgs and 5000 profiles. Cache it in memory. Search locally with Fuse.js for instant fuzzy results. Only hit the server for deep results (full profiles, message search, etc.) after the user commits to a query.

**Wedge:** First search interaction. A student who types "comuter" and gets "Computer Science Club" instantly vs. one who gets nothing and leaves. This is a 100ms vs. 1500ms difference in the moment that determines whether search feels alive or dead.

**Impact:** High. Every single search interaction improves. Typo tolerance alone probably doubles successful search rate.

**Effort:** Medium. ~3 days. Build `/api/search/index` endpoint that returns a compact JSON blob. Add Fuse.js client-side. Swap ExploreSearch to use local index for instant results with server fallback for deep queries.

**Tradeoffs:**
- Index staleness: new spaces won't appear until index refreshes. Mitigate with 5-minute TTL + background refresh.
- Memory: 100KB index in memory. Acceptable for a campus app.
- Cold start: first load has no index. Show "loading..." spinner on first focus, or prefetch on app mount.

---

### 2. Command Palette as Universal Search (Cmd+K Everywhere)

**Problem:** The command palette exists as a component but is disconnected from real data. The explore page search bar is the only live search surface. Students have to navigate to `/explore` to search. There is no way to search from the home page, from inside a space, from a profile page.

**Shape:** Wire the existing `CommandPalette` component to the Fuse.js client-side index (Feature 1). Make it globally available from any page via `Cmd+K`. Results show spaces, people, events, and actions in categorized groups. Selecting a result navigates directly. Add action commands: "Create space", "Go to settings", "View notifications". This becomes the primary power-user navigation method.

**Wedge:** Power users and space leaders. The person who manages 3 spaces and needs to jump between them 20 times a day. They learn `Cmd+K > "eng" > Enter` and never touch the sidebar again. This is the Linear/Raycast pattern that turns casual users into committed ones.

**Impact:** High for retention of active users. Medium for new user activation (most won't discover Cmd+K immediately).

**Effort:** Low-Medium. ~2 days. The CommandPalette component already exists with keyboard nav, grouping, and styling. Just need to: (1) wire it to the search index, (2) add it to the app layout, (3) add static action commands, (4) route selections to navigation.

**Tradeoffs:**
- Mobile: Cmd+K doesn't exist on mobile. Need a search icon in the top bar that opens the same UI as a bottom sheet.
- Discoverability: Power feature that most users won't find. Need subtle "Cmd+K to search" hint in the UI.
- Scope creep: Easy to overload with too many action commands. Start with navigation only, add actions later.

---

### 3. Search History + Recent Searches

**Problem:** Every search session starts from zero. No memory of what a student searched for yesterday. If they search "hackathon" every Monday checking for updates, they re-type it every time.

**Shape:** Store last 10 searches in localStorage (no server roundtrip, no privacy concern). Show them in a dropdown when the search bar is focused but empty. Each entry shows the query text and optionally the result count from when it was executed. Individual delete ("X" button) and "Clear all" link. Tapping a recent search immediately re-executes it. Deduplicate: if they search "hackathon" again, move it to the top instead of adding a duplicate.

**Wedge:** Returning users. The student who comes back to HIVE on Tuesday and sees their Monday searches waiting for them. Small moment of "this thing knows me."

**Impact:** Low-Medium. Quality-of-life improvement. Reduces friction for repeat searches but doesn't unlock new capability.

**Effort:** Low. ~1 day. localStorage read/write, dropdown UI below search bar, click handler to re-execute.

**Tradeoffs:**
- localStorage is per-device. If a student searches on their laptop and then opens HIVE on their phone, history doesn't sync. Server-side storage would fix this but adds complexity and privacy surface area.
- Stale results: a saved search for "hackathon" might have different results today than when it was saved. The stored result count could be misleading. Solution: don't store result count, just the query string.

---

### 4. Search-as-Creation: "No results? Create it."

**Problem:** When a student searches for "MTH 241 study group" and gets zero results, HIVE shows a dead end: "No results found. Try a different search term." This is the worst possible response. The student just told you exactly what they need, and you told them it doesn't exist. They leave.

**Shape:** When search returns zero results for a query that looks like a space name (heuristic: 2+ words, no special characters, not a known person name), show a creation prompt alongside the empty state. "No spaces match 'MTH 241 Study Group' -- be the first to create it." One-tap leads to space creation with the name pre-filled. Track the conversion: how often does a failed search lead to a new space? This is a flywheel: failed searches create new spaces, which means fewer future failed searches.

**Wedge:** The frustrated searcher. They came looking for something specific. Instead of losing them, you convert their frustration into creation. This is the moment HIVE stops being a directory and starts being a platform.

**Impact:** High. This is a network effects accelerator. Every space created from a failed search is a space that wouldn't have existed otherwise. It directly grows the catalog and reduces future zero-result rates.

**Effort:** Low. ~1 day. Modify the empty state in `SearchResultsSection` to include a "Create this space" CTA with the query pre-filled. Link to space creation flow with `?name=` param.

**Tradeoffs:**
- Spam risk: what stops someone from creating "asdfasdf" spaces? Mitigation: space creation already requires auth + campus verification. Add minimum member threshold before space appears in search.
- Quality: auto-created spaces from search queries will have minimal descriptions. Mitigate with a guided creation flow: "You're creating 'MTH 241 Study Group' -- add a description so others can find it."
- False positives: not every failed search should trigger creation. Searching for "Sarah Johnson" (a person) shouldn't offer to create a space. Use entity type hints from the query structure.

---

### 5. Faceted Search with URL-Persisted Filters

**Problem:** Search returns a flat list mixing spaces, people, events, and tools. A student searching for "design" gets Design Club (space), Sarah the design major (person), Design Workshop (event), and Figma Poll Template (tool) in one undifferentiated stream. They can't narrow down to just spaces or just events.

**Shape:** Horizontal filter bar below the search input: `[All] [Spaces] [People] [Events] [Tools]` as pill toggles. Selecting a type filter immediately re-filters results (client-side if using Fuse.js index). Secondary filters appear per type: for Spaces, show category chips (Greek Life, Student Orgs, etc.); for People, show year selector (Freshman through Senior); for Events, show time range (Today, This Week, This Month). All filter state persists in URL params: `/explore?q=design&type=spaces&category=student_organizations`. Back button preserves filter state.

**Wedge:** The student who knows what type of thing they're looking for. "I want to find spaces about design" is a different intent than "I want to find people who do design." Facets let them express that intent.

**Impact:** Medium. Improves search precision for users who know what they want. Less impactful for exploratory/browse behavior.

**Effort:** Medium. ~3 days. Filter bar component, URL state sync, client-side filtering logic, secondary filter dropdowns per type.

**Tradeoffs:**
- UI complexity: filter bars add visual weight to the search experience. On mobile, horizontal scrolling pills feel cramped. Consider: filters hidden until search has results, or filters in a collapsible panel.
- Filter combinations: category + year + time creates a sparse matrix. Many combinations will return zero results. Need graceful handling: "No CS seniors have events this week" with a suggestion to broaden filters.
- URL length: many filters create long URLs. Acceptable for sharability but ugly in the address bar.

---

### 6. Trending Searches: Social Proof for Discovery

**Problem:** When a student opens the search bar with no intent, they see a blank input and a blinking cursor. No inspiration, no context, no sense of what's happening on campus right now. The search bar is a question that requires the student to already know the answer.

**Shape:** When the search bar is focused but empty, show "Trending on campus" with the top 5-8 search queries from the last 24 hours. Anonymized: store only the normalized query string and a count, never user IDs. Minimum threshold of 3 unique searchers before a query appears as trending. Update hourly via a lightweight aggregation (Firestore query on a `searchQueries` collection, count by normalized term, filter >= 3, top 10). Display as tappable chips below the search bar. Tapping one fills the search bar and executes the search.

**Wedge:** The bored student scrolling at 9pm. They open HIVE with no specific intent. They see "hackathon" is trending. They tap it. They discover UB Hacking is hosting signups. They sign up. Without the trending signal, they would have closed the app.

**Impact:** Medium. Creates a sense of campus pulse and social proof. Helps with cold-start discovery ("what should I search for?"). Also generates extremely valuable product analytics for free -- you know exactly what students are looking for.

**Effort:** Medium. ~2-3 days. Server-side: log search queries to a collection (anonymous), build aggregation query, expose via `/api/search/trending`. Client-side: fetch on search focus, display as chips.

**Tradeoffs:**
- Gaming: could a student repeatedly search "join my club" to make it trend? Mitigation: deduplicate by user session (one search per term per user per hour counts).
- Privacy: even anonymized, trending searches reveal campus behavior patterns. "STD testing" trending could be embarrassing. Mitigation: content moderation filter on trending display (blocklist of sensitive terms).
- Stale campus: if only 50 students use HIVE, trending searches will be sparse and repetitive. Need minimum platform activity threshold before showing trending. Below threshold, show "Popular categories" instead (static, editorial).

---

### 7. Natural Language Search with Intent Parsing

**Problem:** Students don't search in keywords. They search in intent. "clubs that meet on Tuesdays" is a natural query that no keyword search can handle. "something fun to do tonight" is an intent, not a keyword. "clubs for someone who likes coding but not competitive programming" is a preference expression.

**Shape:** Add an intent parser layer before the search index. Parse known patterns:
- Time queries: "tonight", "this weekend", "Tuesdays" -> filter by event schedule / meeting times
- Attribute queries: "large clubs", "small groups", "new spaces" -> filter by member count / creation date
- Negation: "not greek life" -> exclude category
- Similarity: "like UB Hacking" -> find spaces with overlapping members or categories
- Action queries: "create a poll", "change my name" -> route to action, not search results

Implementation: not LLM-based. A deterministic pattern matcher with regex + keyword extraction. "clubs that meet on Tuesdays" -> extract "Tuesdays" as schedule filter, "clubs" as type=spaces. "something fun tonight" -> extract "tonight" as time filter, "fun" as category hint (social/events). Falls back to standard keyword search when no pattern matches.

**Wedge:** The student who types a full sentence into the search bar. Today they get zero results. With intent parsing, they get relevant results on the first try.

**Impact:** Medium-High. Dramatically improves the experience for natural-language searchers. But requires meeting-time data that may not exist in the current schema (spaces don't store recurring schedules).

**Effort:** High. ~1-2 weeks. Intent parser with pattern library, time expression extraction, attribute mapping, action routing. Requires enriching space data with meeting schedules (new field, new admin UI, new data entry burden on space owners).

**Tradeoffs:**
- Data dependency: "clubs that meet on Tuesdays" only works if spaces have meeting schedules stored. Most don't today. This feature is gated on a data enrichment effort.
- Parsing accuracy: deterministic parsers are brittle. "large clubs" -- what's "large"? >50 members? >100? Need sensible defaults that can be tuned.
- User expectations: if you parse some natural language queries, users expect all of them to work. "clubs where I can make friends" is an intent but not parseable. Graceful degradation to keyword search is critical.
- Scope: this is really two features -- intent parsing AND data enrichment. Ship them separately. Start with time-based parsing (tonight, this week) since event data already has timestamps.

---

### 8. Search Analytics Dashboard (Internal Tool)

**Problem:** Zero visibility into what students search for, what they find, what they don't find, and what they do after searching. You cannot improve what you cannot measure. You don't know if search is working, and you don't know what content gaps exist.

**Shape:** Log every search interaction as a structured event to Firestore:
- `search_executed`: query, result count, filters applied, timestamp, user_id (hashed for privacy)
- `result_clicked`: query, clicked result ID, result position, result type
- `zero_results`: query, filters -- the most valuable signal
- `search_abandoned`: query typed but no result clicked, time spent

Build an internal dashboard (admin panel or simple page) showing:
- Top 20 queries this week (with click-through rates)
- Top 20 zero-result queries (content gaps)
- Search-to-join conversion rate (searched -> clicked space -> joined)
- Average results per query
- Most clicked result positions (are top results good?)

**Wedge:** Product team. This is not a user-facing feature. It's a decision-making tool. "Students searched for 'study groups' 47 times this week with zero results" is a clear signal to create or seed study group spaces.

**Impact:** High for product decisions, zero for direct user experience. This is infrastructure that makes every future search improvement measurable.

**Effort:** Medium. ~3-4 days. Event logging on search interactions, Firestore collection for analytics, simple dashboard page in admin app.

**Tradeoffs:**
- Privacy: search queries can be sensitive. Hash or omit user IDs in the analytics collection. Never display individual search sessions, only aggregates.
- Storage: if 5000 students search 5 times/day, that's 25,000 events/day. At ~500 bytes each, ~12MB/day, ~365MB/year. Acceptable for Firestore. Consider TTL (delete events older than 90 days).
- Build vs. buy: could use Amplitude, Mixpanel, or PostHog for this instead of custom. But custom gives you control over the data model and avoids another third-party dependency. The dashboard is simple enough to build in-house.

---

### 9. "Did You Mean?" Typo Correction

**Problem:** "hackerthon" returns zero results for "hackathon". "comptuer science" returns zero results for "computer science". Every typo is a dead end. On mobile, typos are constant.

**Shape:** When a query returns zero or very few results, compute edit distance (Levenshtein) between the query and all known entity names in the search index. If a close match exists (distance <= 2), show "Did you mean: hackathon?" as a clickable suggestion above the empty state. Use the Fuse.js index (Feature 1) as the dictionary -- it already contains every entity name.

If using Fuse.js for primary search (Feature 1), this is largely free -- Fuse already does fuzzy matching. The "did you mean" is just the top Fuse result when the exact match returns nothing.

**Wedge:** Mobile users. Fat-finger typos on a phone keyboard are inevitable. Correcting them silently or suggesting corrections keeps the search flow alive.

**Impact:** Medium. Prevents dead ends from typos. The impact scales with mobile usage (which is likely >70% for a campus app).

**Effort:** Low if Feature 1 (Fuse.js index) is built first. ~0.5 days to add "did you mean" UI when Fuse returns results but exact match doesn't. Medium (~2 days) if building standalone without Fuse.

**Tradeoffs:**
- False corrections: "AI club" might suggest "Art club" if edit distance is close. Only suggest when confidence is high (distance <= 1 for short queries, <= 2 for longer ones).
- Multiple suggestions: "cs" could match "CS", "CSS", "CSE". Show the best match only, not a list. Simplicity over completeness.

---

### 10. Contextual Search: Where You Search From Matters

**Problem:** Search is the same everywhere. Searching from inside a space should prioritize that space's members, events, and tools. Searching from the home page should prioritize spaces and events. Searching from a profile should prioritize mutual connections. Context is ignored.

**Shape:** Pass a `context` parameter to the search layer based on where the user triggers search:
- From `/home`: boost spaces and events, derank tools and posts
- From `/s/[handle]` (inside a space): boost that space's members, events, tools. Show "In this space" section first, then "Across campus"
- From `/u/[handle]` (viewing a profile): boost mutual spaces and shared connections
- From `/lab` (HiveLab): boost tools, templates, creators
- From Command Palette: weight everything equally (universal search)

The boost is a simple multiplier on relevance scores for results matching the context. No new APIs needed -- just pass context to the existing scoring functions.

**Wedge:** Space leaders and active members. When you're inside the Engineering Club space and search for "meeting", you want the Engineering Club's meeting schedule, not every space's meetings. Context makes search feel intelligent.

**Impact:** Medium. Reduces noise in search results. Most impactful for users who are deep in a specific space.

**Effort:** Low-Medium. ~2 days. Add context parameter to search, modify scoring weights based on context, pass context from page components.

**Tradeoffs:**
- Surprise: contextual results might confuse users who expect universal search. "I searched for 'Sarah' but only see members of this space." Mitigation: always show "See all results across campus" link below contextual results.
- Complexity: context-dependent search is harder to debug and test. Search results become non-deterministic based on where you are.

---

### 11. Saved Searches with Notification Alerts

**Problem:** A student wants to know when a Photography Club appears on HIVE. Today, they have to manually search for it periodically. There's no way to say "tell me when this exists."

**Shape:** On the zero-results screen and next to search results, add a "Save this search" button (bookmark icon). Saved searches appear in a "Saved Searches" section of the user's profile or settings. For each saved search, run it daily in a background job. If new results appear that weren't there before, send a notification: "New result for your saved search 'photography': Photography Club just launched!" This creates a persistent intent signal -- the student told you what they want, and you notify them when it arrives.

**Wedge:** The student looking for something that doesn't exist yet. Ghost space waitlists partially serve this need, but saved searches are more general -- they work for people, events, tools, anything.

**Impact:** Medium. High value for the students who use it, but likely a small percentage of users. Most valuable for early-stage platforms where the catalog is still growing.

**Effort:** High. ~1 week. Server-side: saved search storage, background job to re-execute searches, diff results against previous run, trigger notification. Client-side: save button, saved searches list, notification display.

**Tradeoffs:**
- Notification fatigue: if a saved search matches 50 new results every day, the notification is noise. Mitigate with smart batching: "3 new results for 'design'" instead of 3 separate notifications.
- Background job cost: running saved searches for all users daily. If 1000 users save 3 searches each, that's 3000 search executions daily. Acceptable at campus scale.
- Value curve: this is most valuable when the platform is small and growing (new content appears frequently). Less valuable when the catalog is stable (no new results to find).

---

### 12. Search Index as Product Signal Pipeline

**Problem:** You don't know what students want that doesn't exist. Zero-result queries are the highest-signal data source you have, and you're throwing them away.

**Shape:** Beyond analytics (Feature 8), build an automated pipeline that processes zero-result queries into actionable signals:
1. Aggregate zero-result queries weekly
2. Cluster similar queries ("study group math", "math study session", "calc study group" -> "math study groups")
3. Cross-reference with existing spaces to identify near-misses (query "photography" when "Photo Club" exists = naming gap vs. query "rock climbing" when nothing exists = content gap)
4. Generate a weekly "Campus Demand Report" for the HIVE team: "Top unmet needs: Math study groups (34 searches), Photography (21 searches), Intramural basketball (18 searches)"
5. Optional: auto-create ghost spaces for high-demand zero-result clusters

**Wedge:** Platform operations team. This turns search failures into a campus needs radar. It answers the question "what should we seed next?" with data instead of guesswork.

**Impact:** High for platform growth strategy. This is the flywheel: search data -> content gaps identified -> gaps filled -> better search results -> more engagement -> more search data.

**Effort:** High. ~1-2 weeks for the full pipeline. Low (~2 days) for the basic version: just surface zero-result queries in the admin dashboard and let humans interpret them.

**Tradeoffs:**
- Automation vs. curation: auto-creating ghost spaces from search queries could create noise. Start with human review: surface the demand, let the team decide what to create.
- Clustering accuracy: "calc study group" and "calculus help" are the same intent but different strings. Simple heuristics (shared words, Levenshtein) work for small datasets. Don't over-engineer.

---

### 13. Semantic Search with Embeddings

**Problem:** Keyword search fails for conceptual queries. "places to meet people" should return social spaces, but there's no keyword overlap. "career help" should return the Career Development Center, resume workshops, and interview prep events. Keyword matching can't bridge the gap between intent and content.

**Shape:** Generate text embeddings (OpenAI `text-embedding-3-small` or open-source alternative) for every space description, profile bio, and event description. Store embeddings in a vector column alongside the entity. At search time, embed the query and compute cosine similarity against stored embeddings. Blend semantic similarity with keyword relevance: `finalScore = (keywordScore * 0.6) + (semanticScore * 0.4)`. This lets "places to meet people" find the Social Events Club even though those exact words don't appear in its description.

**Wedge:** The student who doesn't know the right keywords. Freshmen who don't know club names yet, international students who describe concepts differently, anyone with a vague intent. Semantic search turns "I want to do something creative" into a list of art, music, design, and maker spaces.

**Impact:** High -- but only measurable with search analytics (Feature 8) in place to compare before/after.

**Effort:** Very High. ~2-3 weeks. Embedding generation pipeline (batch job for existing content, on-write hook for new content), vector storage (Pinecone, Qdrant, or pgvector), query-time embedding + similarity computation, score blending logic, cost management (embedding API calls are cheap but not free at scale).

**Tradeoffs:**
- Cost: OpenAI `text-embedding-3-small` costs ~$0.02/1M tokens. For 300 spaces + 5000 profiles + 500 events, initial embedding is <$1. Query-time embedding is ~$0.00002 per search. Negligible at campus scale.
- Infrastructure: need a vector database. Adds operational complexity. Alternative: at campus scale (thousands, not millions of entities), you could store embeddings in Firestore and compute cosine similarity in application code. Slow but feasible.
- Latency: embedding the query adds ~100ms. Acceptable if results are better.
- Cold start: need all content embedded before this works. Batch job on launch, incremental updates after.
- Overkill? At 300 orgs, is keyword + fuzzy sufficient? Probably. Semantic search becomes necessary at 3000+ orgs or when conceptual queries are common. Monitor search analytics first.

---

### 14. Inline Search Results with Preview Panes

**Problem:** Search results are links. You click a space card, navigate to the space page, decide it's not what you want, hit back, and continue searching. This click-navigate-back loop is slow and disorienting. Every navigation is a context switch.

**Shape:** When hovering (desktop) or long-pressing (mobile) a search result, show a preview pane alongside the result list. For spaces: name, description, member count, last active, next event, "Join" button. For people: name, handle, major, year, mutual spaces, "Connect" button. For events: title, date, location, RSVP count, "Going" button. The preview pane lets users evaluate results without leaving the search context. Actions (Join, Connect, Going) work inline -- no navigation required.

**Wedge:** The comparison shopper. A student evaluating 5 clubs to join doesn't want to visit 5 separate pages. Preview panes let them scan and decide in one view.

**Impact:** Medium. Reduces friction in the search-to-action flow. Most impactful on desktop where there's screen real estate for a side panel.

**Effort:** Medium. ~3-4 days. Preview component per entity type, hover/press interaction, inline action handlers (join, RSVP, connect), responsive layout (side panel on desktop, bottom sheet on mobile).

**Tradeoffs:**
- Mobile: preview panes don't fit on mobile screens. Bottom sheet is the mobile equivalent but feels different. Consider: on mobile, just make the result cards richer (more info visible without tapping) instead of a separate preview pane.
- Data fetching: preview panes need more data than the search result card shows. Lazy-load on hover to avoid fetching data for results the user never looks at.
- Complexity: maintaining preview components for 5 entity types is a lot of surface area.

---

### 15. Search Shortcuts and Operator Syntax

**Problem:** Power users want precision. "I want spaces in Greek Life with more than 50 members" is a query that faceted filters can handle, but it requires multiple clicks. Some users would prefer to type `@spaces category:greek-life members:>50`.

**Shape:** Support lightweight operator syntax in the search bar:
- `@spaces`, `@people`, `@events`, `@tools` -- type filter
- `category:greek-life` -- category filter
- `year:senior` -- class year filter
- `in:engineering-club` -- search within a specific space
- `from:sarah` -- messages/posts from a specific person
- `before:2026-02-01`, `after:2026-01-15` -- date filters
- `has:events` -- spaces with upcoming events

Parse operators out of the query string before sending to search. Show a hint dropdown when the user types `@` or a known operator prefix. Operators are additive to the keyword search -- `@spaces design category:greek-life` means "spaces matching 'design' in the Greek Life category."

**Wedge:** Space leaders, power users, and the technically inclined. This is the Slack/GitHub search model. It won't be used by most students, but the ones who discover it will become dependent on it.

**Impact:** Low-Medium. Small user base but high per-user impact. Also serves as an implicit filter education tool -- users who see operator hints learn that filters exist.

**Effort:** Medium. ~3-4 days. Query parser for operator extraction, hint dropdown for operator suggestions, integration with search/filter layer.

**Tradeoffs:**
- Discoverability: most users will never type `@spaces`. The feature needs to be invisible to casual users and discoverable by power users (via hints, documentation, or command palette help).
- Maintenance: every new operator is a new parsing rule, a new hint, and a new filter path. Start with 3-4 operators, expand based on usage.
- Error handling: `category:asdfasdf` should degrade gracefully to a keyword search, not error out.

---

## Quick Wins (ship in days)

**1. Wire the existing `/api/search` to the Explore page** (1 day)
The platform search API exists with sophisticated relevance scoring but nothing uses it. The explore page calls 3 separate APIs. Replace the 3 parallel fetches with a single call to `/api/search?q=...&category=all`. Immediate improvement: unified relevance ranking across all entity types. Immediate fix: the explore page currently doesn't search posts or tools.

**2. Fix dead URL patterns** (0.5 day)
Search results link to `/user/${handle}` and `/profile/${id}` instead of `/u/[handle]`. Fix the URL generation in `searchProfiles()`. Also fix explore page `PersonCompactCard` which links to `/profile/${person.id}`.

**3. Search history in localStorage** (1 day)
Feature 3 above. No server changes. Pure client-side. Store last 10 queries, show on focus, clear button.

**4. "Create this space" on zero results** (1 day)
Feature 4 above. Modify the empty state to include a creation CTA. Pre-fill the space name from the search query.

**5. Require authentication for `/api/search`** (0.5 day)
Currently falls back to `getDefaultCampusId()` for unauthenticated requests. Change to return 401. Prevents scraping.

---

## Medium Bets (ship in weeks)

**1. Fuse.js client-side search index** (Feature 1, ~1 week including index API + client integration + testing)
The foundation for everything else. Makes search instant, adds fuzzy matching, enables "did you mean", and feeds the command palette.

**2. Command Palette wired to live search** (Feature 2, ~1 week including mobile adaptation)
Turns Cmd+K from a static menu into a universal search surface. Ship alongside or immediately after the search index.

**3. Faceted search with URL state** (Feature 5, ~1 week)
Type filters, category filters, time filters. Persisted in URL for shareability and back-button support.

**4. Search analytics foundation** (Feature 8, ~1 week)
Event logging, zero-result tracking, basic admin dashboard. Required before you can measure the impact of any other search improvement.

**5. Trending searches** (Feature 6, ~3-4 days)
Lightweight. Depends on search analytics (need to log queries first). Adds campus pulse to the search experience.

---

## Moonshots (ship in months+)

**1. Semantic search with embeddings** (Feature 13, 2-3 weeks + ongoing maintenance)
Transforms search from keyword matching to intent understanding. Only worth the investment after you've exhausted keyword/fuzzy improvements and have analytics proving that conceptual queries are common.

**2. Natural language search with intent parsing** (Feature 7, 2+ weeks + data enrichment)
"Clubs that meet on Tuesdays" is the dream query. But it requires meeting schedule data that doesn't exist. The intent parser is a week; the data enrichment is ongoing.

**3. Search-powered campus demand radar** (Feature 12, 2-3 weeks for full pipeline)
Automated pipeline from zero-result queries to campus needs identification. Powerful but requires search analytics maturity and operational process to act on the signals.

**4. Saved searches with notifications** (Feature 11, 1-2 weeks)
Persistent intent tracking with push notifications. High value for growing platforms but requires background job infrastructure.

**5. Cross-entity knowledge graph** (not in feature list -- too speculative)
Build a graph of relationships: spaces have members, members attend events, events are about topics, topics relate to majors. Search becomes graph traversal: "events for people in my major" is a two-hop query. This is the long-term vision for campus intelligence, but it's a platform architecture shift, not a feature.

---

## Competitive Analysis

### Slack Search
**Strengths:** Searches messages, files, people, channels in one bar. Operator syntax (`from:`, `in:`, `before:`). Filters panel with date range, person, channel selectors. Recent searches and saved searches.
**Weaknesses:** Terrible at discovering new channels. No relevance ranking -- just recency. No "trending" or social proof. Search is about finding things you've seen, not discovering things you haven't.
**HIVE lesson:** Slack's operator syntax is proven and learnable. Steal the syntax, but add discovery (trending, recommendations, social proof) that Slack can't do because it doesn't have a social graph.

### Discord Search
**Strengths:** Per-server search with filters (from, mentions, has, before/after). Good at finding specific messages.
**Weaknesses:** Cannot search across servers. No full-text search on server names or descriptions. Server discovery is entirely through external directories (Disboard, top.gg). No recommendation engine.
**HIVE lesson:** Discord's failure to unify search across servers is a structural weakness of their architecture. HIVE's campus-wide search is a genuine differentiator -- you can find people, spaces, events, and messages in one query.

### Google (searching "clubs at UB")
**Strengths:** Best-in-class relevance ranking. Handles typos, synonyms, natural language. Instant results.
**Weaknesses:** Static information. No real-time state (who's online, what's happening now). No social graph (your friends aren't a ranking signal). No actions (can't join from search results). No campus context (doesn't know your major or year).
**HIVE lesson:** You will never beat Google at keyword search. Don't try. Beat them at contextual, real-time, actionable results. "Design club -- 3 friends are members, event tomorrow, 12 people online now" is something Google cannot show.

### Algolia
**Strengths:** Industry-leading typo tolerance, speed (<50ms), faceted search, analytics. Drop-in integration.
**Weaknesses:** Cost at scale ($1/1000 search requests on the paid plan). Requires index sync infrastructure. External dependency.
**HIVE lesson:** Algolia solves the search quality problem but adds cost and complexity. At campus scale (300 orgs, 5000 profiles), client-side Fuse.js gives you 80% of Algolia's quality at 0% of the cost. Consider Algolia only if you expand to multiple campuses with millions of entities.

### Apple Spotlight / Raycast
**Strengths:** Instant results as you type. Universal (searches everything on your computer). Action-oriented (open file, launch app, calculate). Keyboard-first.
**Weaknesses:** Not social. No shared context. No discovery.
**HIVE lesson:** The command palette (Feature 2) should feel like Spotlight -- type to go anywhere, instant results, keyboard navigation. The search bar on the explore page is for discovery; the command palette is for navigation. Different tools for different intents.

### Typesense (open-source alternative to Algolia)
**Strengths:** Self-hosted, fast, typo tolerance, faceted search, geo search. Free.
**Weaknesses:** Requires infrastructure (another server to run). Adds operational complexity.
**HIVE lesson:** If Fuse.js client-side search hits its limits (too much data, too slow, not accurate enough), Typesense is the next step before Algolia. It's free and gives you full-text search with typo tolerance. But at campus scale, you probably don't need it.

---

## Wedge Opportunities

### Wedge 1: The "Week One" Freshman
**Moment:** First week of college. 18-year-old. Doesn't know anyone. Doesn't know what clubs exist. Opens HIVE and types "friends" into the search bar.
**Current experience:** Zero results. Dead end.
**Target experience:** "Looking for your people? Here are spaces where students like you hang out: [3 personalized recommendations]. Or try: 'clubs for freshmen', 'social events tonight', 'study groups'."
**Features needed:** Intent parsing (Feature 7, lightweight version), smart empty state (Feature 4), trending searches (Feature 6).

### Wedge 2: The Space Leader Who Manages 5 Clubs
**Moment:** Tuesday afternoon. Engineering Club president, also in ACM, also in Robotics. Needs to post an announcement in one, check event RSVPs in another, respond to a join request in the third.
**Current experience:** Navigate to each space individually via sidebar or URL.
**Target experience:** Cmd+K, type "eng", Enter. Done. Cmd+K, "acm", Enter. 2 seconds per navigation instead of 10.
**Features needed:** Command Palette wired to search (Feature 2), contextual search (Feature 10).

### Wedge 3: The Student Who Wants Something That Doesn't Exist
**Moment:** Searches "photography club" and finds nothing.
**Current experience:** "No results found." Closes app.
**Target experience:** "'Photography Club' doesn't exist yet -- be the first to create it. [Create Space]" OR "14 other students also searched for 'photography.' Want to be notified when someone creates it? [Notify Me]"
**Features needed:** Search-as-creation (Feature 4), saved searches with alerts (Feature 11), search analytics (Feature 8).

### Wedge 4: The Admin Who Needs to Know What Students Want
**Moment:** HIVE team meeting. "What should we seed next? Where should we invest?"
**Current experience:** Guesswork.
**Target experience:** "Top unmet searches this week: Math study groups (47 searches, 0 results), Photography (31 searches, 0 results), Intramural basketball (24 searches, 0 results). Recommendation: create ghost spaces for these categories."
**Features needed:** Search analytics (Feature 8), signal pipeline (Feature 12).

---

## Open Questions

**1. Should search replace navigation?**
If the command palette (Cmd+K) becomes fast enough and covers all destinations, does the sidebar become redundant? Linear and Raycast users barely touch the sidebar. Could HIVE go sidebar-optional for power users? What does that do to discoverability for new users who don't know Cmd+K exists?

**2. Where does search live on mobile?**
Desktop has Cmd+K and the explore page. Mobile has neither keyboard shortcut nor screen real estate for an always-visible search bar. Options: (A) search icon in the top bar that opens a full-screen search overlay, (B) search bar embedded in the home page feed, (C) swipe-down gesture to reveal search (like iOS Spotlight). Which pattern matches the mental model of "I want to find something"?

**3. Is the Explore page search bar redundant with Cmd+K?**
If the command palette does universal search, what is the Explore page for? Option A: Explore becomes pure browse (curated collections, recommendations, no search bar). Option B: Explore keeps search but scoped to discovery (more results, facets, filters) while Cmd+K is for quick navigation. Option C: Merge them -- Cmd+K on the home/explore page is the same UI, just full-screen instead of a modal.

**4. Client-side vs. server-side search: where is the crossover?**
Fuse.js works brilliantly for 300 spaces and 5000 profiles. What about 3000 spaces and 50,000 profiles (10 campuses)? At what data volume does client-side search become untenable and you need Typesense/Algolia? Should the architecture be built for multi-campus from the start, or optimize for single-campus now?

**5. Should search index include message content?**
Today, search covers entities (spaces, people, events, tools) but not messages. "That link someone shared in Engineering Club last week" is a real search intent that HIVE can't handle. Adding message search is a major scope expansion: privacy implications (searching other people's messages?), index size explosion, moderation concerns. Is this a year-one feature or a year-two feature?

**6. How do you measure search quality?**
MRR (Mean Reciprocal Rank) and nDCG (Normalized Discounted Cumulative Gain) are standard search metrics, but they require relevance judgments. At campus scale, you could use click-through rate as a proxy: if the first result is clicked 60% of the time, ranking is working. If position 3+ is clicked more often than position 1, ranking is broken. What's the minimum analytics infrastructure needed to answer "is search good?"

**7. What's the search experience for zero-state Explore?**
When a brand new user (zero spaces, zero connections) opens the Explore page, what do they see? Currently: For You, Popular This Week, People in Major, Events. But the search bar is empty and inert. Should it show trending searches? Should it show "Start here: search for your major, your dorm, or something you love"? The zero-state search experience is the onboarding experience for discovery.

**8. Should HIVE own search infrastructure or use a managed service?**
Building search in-house (Fuse.js -> Typesense) gives control and avoids vendor lock-in. Using Algolia gives instant quality but costs money and creates dependency. At single-campus scale, in-house wins on cost. At 10+ campuses, Algolia or Typesense Cloud wins on operational simplicity. When is the right time to switch?

**9. Can search double as the entry point for AI features?**
"Create a poll for our next meeting time" typed into the search bar could be routed to the tool creation flow with AI pre-fill. "Summarize what happened in Engineering Club this week" could generate a digest. The search bar as a command line for AI-powered actions is a natural extension -- but it blurs the line between search and chat. Is that confusion or is that power?

**10. What data does HIVE have that nobody else has?**
Social graph (who's friends with whom), activity patterns (when are students active), interest signals (what did they select during onboarding), space membership (which clubs overlap), event attendance (who goes to what). All of this is proprietary and can make search dramatically better than any external tool. The question is: which of these signals matter most for ranking, and how do you test that?
