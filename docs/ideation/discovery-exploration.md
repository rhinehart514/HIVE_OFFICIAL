# Discovery & Exploration

**Dimension:** How students find new communities, people, events, and reasons to come back.
**Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?

---

## Current State

### What Exists

The explore page (`/explore`) is a single-scroll curated feed with four sections: For You (interest-matched spaces), Popular This Week (member count sorted), People in Your Major, and Upcoming Events. Search is debounced text input across spaces, people, and events. Results come from `browse-v2` (spaces), `users/search` (people), and `/events` (events). There is a dedicated recommendations engine with a behavioral psychology scoring model: `Score = (AnxietyRelief x 0.4) + (SocialProof x 0.3) + (InsiderAccess x 0.3)`.

400+ ghost spaces are pre-seeded from CampusLabs data. Ghost space cards show the org name, a "Notify Me" waitlist button, and a "Claim This Space" link. Waitlist counts display as FOMO copy ("12 students waiting for this space"). The claim link goes to `/spaces/claim?handle=...`.

Cold start enrichment exists in the browse API: upcoming event count, next event, mutual friend count, and tool count are all returned per space. But the explore page does not surface most of these signals on cards -- the SpaceCard component shows member count and last active, but not mutuals, not events, not tools.

Search uses `.includes()` string matching. No fuzzy matching, no typo tolerance, no search history, no faceted filters. The platform search API has a sophisticated relevance scoring system (exact: 100, prefix: 80, contains: 60, etc.) but it is separate from the explore page's browse-based search.

The entry flow collects 2-5 interests during onboarding and auto-joins matching spaces. Post-entry, the user lands in their first space or on `/home`, which shows a "Find your first space" CTA for users with 0 spaces.

### What Works

1. **Behavioral recommendation engine** -- The anxiety relief + social proof + insider access model is thoughtful and unique. Most campus apps have no recommendation engine at all.
2. **Ghost space catalog** -- 400+ pre-seeded orgs means day-one content density. No cold start for the catalog itself.
3. **Interest-based personalization** -- Interests collected at entry flow into For You section. The loop exists even if it is simple.
4. **Cold start data enrichment** -- The browse API fetches mutuals, events, and tools per space. The data pipeline is there.
5. **Real-time signals** -- Online count, last active time, and presence data are available for liveness indicators.

### What Is Broken or Missing

1. **Search is dumb** -- `.includes()` means "hack" does not find "hackathon," typos return nothing, and there is no fuzzy matching.
2. **Ghost spaces are dead-end-ish** -- "Notify Me" joins a waitlist but there is no notification delivery when a space is claimed. The waitlist is write-only.
3. **Enrichment data is not surfaced** -- Mutuals, next event, and tool count are fetched but not displayed on cards in the explore page.
4. **No social proof on cards** -- "3 of your friends are here" is the single most powerful conversion signal for campus communities, and it is invisible.
5. **"Popular" means big, not active** -- Trending is sorted by member count, not by activity velocity. A dead 500-member space outranks a thriving 30-member one.
6. **No serendipity** -- Discovery is predictable. Interest-based filtering creates filter bubbles. No mechanism for "try something you would not expect."
7. **No search history** -- Every search session starts from zero.
8. **No category browsing** -- Categories exist in the data model but there is no UI to browse by category.
9. **Person links are broken** -- Explore page links to `/profile/${person.id}` but the route is `/u/${handle}`.
10. **No discovery analytics** -- No tracking of what people search for, what returns zero results, or what converts to joins.

---

## The Opportunity

### The Involvement Fair Problem

The involvement fair happens once a year. A freshman walks into a gym full of 300 tables, gets overwhelmed, signs up for 15 email lists, and joins 2 of them. The other 298 organizations might as well not exist. For the other 364 days, discovery is broken: word of mouth, Instagram scrolling, or random encounters.

HIVE can be the involvement fair every day. Not a metaphorical one -- a literal one. Every time a student opens the explore page, they should feel the same energy they feel walking into a room full of possibilities, minus the social anxiety and plus the ability to join from the couch at 11pm.

### The Anxiety Gap

The biggest barrier to joining a campus community is not awareness -- it is anxiety. "Will I fit in?" "Do I know anyone there?" "Is it actually active or a dead org?" "What if I show up and it's awkward?" Current discovery does nothing to address these questions. The information architecture treats discovery as a catalog problem (show them the list) when it is actually an emotional problem (make them feel safe enough to act).

Social proof is the antidote. "3 of your friends are members" is not a nice-to-have -- it is the difference between a student clicking "Join" and clicking away. Every card, every recommendation, every search result should answer the implicit question: "Is this for someone like me?"

### The Ghost Space Mechanic

400+ unclaimed organizations is a unique asset. No other campus platform has a pre-built catalog of every real student org, visible and claimable. But right now ghost spaces are second-class citizens in the UI -- dashed borders, muted text, a waitlist button that goes nowhere.

The opportunity: Ghost spaces should feel like potential, not emptiness. "This org has 47 students waiting for someone to step up and lead it. That could be you." The ghost mechanic is not just a cold start solution -- it is a leadership recruitment engine and a FOMO machine.

### The Seasonal Rhythm

Campus has predictable rhythms that discovery should ride:
- **August/September:** New student flood. Freshman panic. "Where do I belong?" Discovery needs to be effortless and calming.
- **October:** Midterm stress. Study group discovery spikes. Academic spaces become urgent.
- **January:** Spring semester start. Transfer students, new year energy, spring recruitment.
- **February-March:** Greek rush. Greek life discovery is seasonal and time-sensitive.
- **April:** Elections, end-of-year events, "last chance" energy for seniors.
- **Summer:** Dead. But incoming freshmen could be browsing months before arriving.

Discovery should not look the same in September as it does in March.

---

## Feature Ideas

### 1. Social Proof Cards

**Problem:** Space cards show member count and last active, but not the one signal that actually drives joins: "Do I know anyone there?" The mutual friend data is fetched by the browse API but not displayed.

**Shape:** Surface mutual friends on every space card. Show an avatar stack of mutual members (max 3 faces) with copy like "Sarah, Alex, and 4 others you know." For spaces with no mutuals, fall back to "Popular with CS students" or "234 members" -- but always try the social signal first. On ghost space cards, show waitlist faces: "Sarah and 11 others are waiting."

**Wedge:** This converts lurkers to joiners. The student who sees a space card 3 times and does not click will click when they see a friend's face. This is the lowest-friction conversion lever that exists.

**Impact:** High. Social proof is the #1 driver of organic community growth on every platform that has measured it. Discord, Facebook Groups, and LinkedIn all show mutual connections prominently for this reason.

**Effort:** Low. The data already exists in the browse-v2 API response (`mutualCount`). This is primarily a frontend change to the SpaceCard component.

**Tradeoffs:** Students with few connections see a barren experience. Need a graceful fallback chain: mutuals > same major > similar interests > member count. Privacy: some students may not want their membership visible on cards. Respect ghost mode and profile visibility settings.

---

### 2. The Perpetual Involvement Fair

**Problem:** Discovery looks the same every day. A student checking on Monday sees the same For You section as Saturday. There is no sense of "something is happening right now" or "this is new since yesterday."

**Shape:** Replace the static feed with a time-aware, event-driven discovery surface. Three modes, automatically selected:

- **Right Now** (default when events are live): "Happening now" banner with live events, active spaces with high online counts, spaces where friends are currently active.
- **Coming Up** (when events are upcoming): "This week on campus" with event calendar strips, spaces hosting events, "last chance to RSVP" urgency.
- **For You** (quiet times): Standard interest-matched recommendations, ghost spaces, people you might know.

Additionally, a "New This Week" section that surfaces: newly created spaces, spaces that just crossed a membership threshold (10, 50, 100), ghost spaces that were recently claimed, and spaces with activity spikes.

**Wedge:** Transforms explore from a static catalog into a living campus pulse. Students check it daily because it changes daily.

**Impact:** High. Daily active usage of explore is the leading indicator of platform health. If explore feels alive, the platform feels alive.

**Effort:** Medium. Time-context logic is straightforward. "New this week" requires tracking creation dates and membership milestones, which the data model supports. Event integration already exists.

**Tradeoffs:** Requires sufficient activity density. At low usage, "Right Now" might show nothing and feel empty. Need minimum thresholds: only show "Right Now" when 3+ events are live or 5+ spaces have online members. Risk of over-rotating on events at the expense of community discovery.

---

### 3. Ghost Space Resurrection Engine

**Problem:** Ghost spaces are write-only waitlists. No notifications fire when a space is claimed. Students join the waitlist and never hear back. The "Claim This Space" link goes to a page that may or may not exist. The ghost mechanic is the single most unique feature of HIVE and it is half-built.

**Shape:** Full lifecycle for ghost spaces:

**For potential leaders:**
- "Claim This Space" opens a 3-step flow: Verify affiliation (are you actually in this org?) -> Set up basics (description, category, boards) -> Invite your first 5 members.
- "Founding Leader" badge permanently attached to claimer's profile.
- Dashboard showing "47 students are waiting -- claim now and they auto-join."

**For waitlisted students:**
- Real notification when a ghost space is claimed: push, in-app, and email.
- Auto-prompt: "Alpha Phi Omega is now live! You were on the waitlist. Join now?"
- Weekly digest: "3 spaces you're watching had new activity."

**For discovery:**
- Ghost space cards get a redesign: not dashed-and-muted, but glowing-with-potential. "47 students are waiting for a leader. Could be you."
- Ghost spaces with high waitlist counts (10+) get promoted in For You.
- "Most Wanted" section: Ghost spaces with the highest waitlists, ranked.

**Wedge:** This is HIVE's most defensible mechanic. No other platform has a pre-built catalog of real orgs waiting to be activated. Making the ghost-to-live conversion seamless turns a data asset into a growth engine.

**Impact:** Very high. Every ghost space that goes live instantly gains the waitlisted members as a starter community. This solves the cold start problem for individual spaces. It also creates a leadership recruitment pipeline.

**Effort:** Medium-high. Notification delivery infrastructure is partially stubbed (`deliverNotification()` exists but does not deliver). Claim flow needs UI. Waitlist-to-member conversion needs backend work.

**Tradeoffs:** Claim verification is hard. How do you confirm someone is actually in Alpha Phi Omega? Options: honor system with admin override, require existing member vouching, or let anyone claim but allow disputes. Each has failure modes. Also: what happens if two people try to claim the same space?

---

### 4. "People Like You Joined" Recommendations

**Problem:** Current recommendations are interest-based (explicit signals from onboarding). But the most powerful signal is behavioral: what did people with similar profiles actually do?

**Shape:** Collaborative filtering based on join patterns. For a freshman CS major who joined AI Club and E-Sports, find other freshman CS majors and surface what they joined that this student has not. Display as: "Students like you also joined: Robotics Club, Hackathon Team, Game Dev." The "like you" cohort is defined by: same major, same year, overlapping interests, overlapping space memberships.

Add a dedicated section to the explore page: "Popular with [Major] students" that dynamically updates based on the user's academic profile. This is not the same as "People in Your Major" (which shows people) -- this shows spaces that their major cohort gravitates toward.

**Wedge:** Collaborative filtering is the engine behind Spotify Discover Weekly and Netflix recommendations. It works because it captures taste signals that explicit interest tags miss. A CS student who joins Chess Club reveals something that "interests: technology" does not.

**Impact:** High. This is the recommendation quality upgrade that makes explore feel personally curated rather than generically filtered.

**Effort:** Medium. Requires building a co-membership analysis pipeline. At UB scale (32K students, 400+ spaces), this is computationally feasible as a daily batch job. Store results in a `spaceCoMembership` collection in Firestore.

**Tradeoffs:** Cold start for new users with 0-1 spaces joined -- collaborative filtering needs join history to work. Fall back to interest-based until user has 3+ memberships. Privacy: aggregate patterns are fine, but avoid exposing individual join behavior ("Alex specifically joined this").

---

### 5. Seasonal Discovery Campaigns

**Problem:** Discovery is the same in August and March, but student needs are radically different. The freshman entering in August needs "where do I start?" while the sophomore in March needs "what's new and interesting?"

**Shape:** Time-triggered discovery campaigns that automatically adjust the explore page:

**Welcome Week (Aug/Jan):**
- Explore header: "Welcome to UB. 400+ communities are waiting for you."
- Prominent "Getting Started" section with the 5 most-joined spaces by freshmen.
- "Your Major, Your People" section that auto-detects major from profile and shows the major space + related academic spaces.
- Lower barrier: open spaces show "Tap to Join" instead of requiring a full space visit.

**Rush Season (Sept/Feb):**
- "Greek Life on Campus" featured section.
- Timeline UI: "Rush events this week" with dates, locations, and RSVP counts.
- "Rush 101" educational content for students who do not know how Greek recruitment works.

**Midterm Season (Oct/Mar):**
- "Study Groups" section promoted to top of feed.
- "Spaces with Study Sessions" -- filter spaces that have study-related events this week.
- "Find Your Study Buddy" -- people search scoped to same courses (if course data available).

**End of Year (Apr/May):**
- "Don't Miss Before Graduation" -- events with graduation-year social proof.
- "Leave Your Mark" -- ghost spaces that need claiming before summer.
- Senior-to-junior leadership handoff prompts.

**Summer (May-Aug):**
- "Preview Your Campus" -- for incoming freshmen who sign up early.
- "What's Coming in Fall" -- spaces planning fall events.
- Lower-commitment browse mode: save spaces to join later.

**Wedge:** No campus app adjusts to the academic calendar. CampusLabs is static. Discord has no concept of semesters. This makes HIVE feel like it understands campus life.

**Impact:** Medium-high. Seasonal relevance drives engagement during natural adoption windows. Welcome Week and Rush Season are the two highest-opportunity periods for new user acquisition.

**Effort:** Medium. This is primarily content curation and conditional UI logic. The data model does not need to change. Campaign configuration could be a simple JSON config or admin-managed content blocks.

**Tradeoffs:** Maintenance burden. Each seasonal campaign needs content creation, testing, and scheduling. If campaigns feel stale or out-of-date, they hurt more than they help. Need an operational plan for who creates and schedules campaigns. Also: campus calendars vary by school -- what works for UB may not work elsewhere.

---

### 6. The Anxiety-Reducing Preview

**Problem:** Clicking "Join" on a space you know nothing about is a commitment that most students will not make. The current flow requires navigating to the full space page to learn more, which feels like entering a party before deciding if you want to go.

**Shape:** A preview layer between the card and the space page. Two variants:

**Desktop -- Hover Preview:**
After 400ms hover on any space card, a popover appears showing:
- Full description (not truncated)
- 3 most recent messages (anonymized: "A member said: 'Can't wait for the hackathon!'")
- Upcoming events in this space
- Mutual friends who are members (avatar stack)
- "Active X minutes ago" liveness indicator
- Join button + "View Full Space" link

**Mobile -- Long Press Sheet:**
Long press on a card opens a bottom sheet with the same content.

The key insight: previews show enough social proof and activity evidence to answer "Is this space active? Do I know anyone? Is there anything happening?" without the commitment of entering the space.

**Wedge:** This directly addresses the anxiety of "what if I join and it's dead?" Showing recent messages and upcoming events proves the space is alive. Showing mutual friends proves "people like me are here."

**Impact:** Medium-high. Preview-to-join conversion should be significantly higher than card-to-space-page-to-join, because the preview eliminates the navigation step and provides more signal.

**Effort:** Medium. Requires a new API endpoint or expanding browse-v2 to return recent messages and events per space. The popover/sheet UI is standard Radix component work.

**Tradeoffs:** Showing message previews from spaces you have not joined could feel like privacy invasion from the members' perspective. Solution: only show messages marked as "public" or from announcement boards, never from private channels. Also: hover previews do not work on mobile, so the long-press alternative is critical.

---

### 7. Interest Constellation Discovery

**Problem:** Interest tags from onboarding are flat strings ("Technology", "Music", "Sports"). They do not capture the relationships between interests or guide exploration paths. A student interested in "AI" does not automatically discover "Robotics," "Philosophy of Mind," or "Startup Culture" -- all of which are strongly correlated in real campus communities.

**Shape:** Build an interest graph that maps relationships between interests based on co-occurrence in user profiles and space memberships. Visualize it as a constellation on the explore page: your interests are bright nodes, and connected interests are dimmer nodes you can tap to explore.

Functionally:
- "Because you like AI: explore Robotics, Ethics in Tech, Data Science"
- "Students interested in Music also explore: Theater, Film, Creative Writing"
- Interest relationships update dynamically based on real campus data.

The constellation is both a navigation tool and a visualization. Tapping a node filters the explore feed to show spaces, people, and events related to that interest. It replaces the static category pills with a dynamic, personalized topology.

**Wedge:** This is the "Spotify radio" of campus discovery. Instead of searching or browsing categories, students follow interest threads into unexpected territory. It makes discovery feel like exploration rather than shopping.

**Impact:** Medium. Drives deeper engagement with the explore page and surfaces connections that interest tags alone miss. Most valuable for students who have been on the platform 2+ weeks and have exhausted their initial recommendations.

**Effort:** High. Building the interest graph requires co-occurrence analysis across profiles and memberships. The visualization component is complex. Could start with a simplified version: static interest relationships (curated mapping) before graduating to data-driven ones.

**Tradeoffs:** At low user density, the interest graph will be sparse and possibly misleading. Need a minimum data threshold before surfacing graph-based recommendations. The constellation visualization could feel gimmicky if not executed well -- a simpler "Related interests" pill strip might deliver 80% of the value.

---

### 8. "What's Happening" Real-Time Campus Pulse

**Problem:** The explore page is fetched once on load and is static until refresh. There is no sense that the campus is alive right now. A student checking at 8pm on a Thursday has no idea that there is a study session in the library, a gaming tournament in the union, and a Greek mixer happening.

**Shape:** A real-time "pulse" strip at the top of the explore page (and optionally the home page):

```
Right now at UB: 847 students online | 12 events live | "AI Hackathon" trending in search
```

Below the strip, a "Happening Now" section that shows:
- Live events with attendee counts updating in real-time
- Spaces with highest current online member counts
- Recent joins: "Sarah just joined Robotics Club" (privacy-respecting, opt-in)

This uses Firebase real-time listeners that already exist for presence data. The pulse strip updates without page refresh.

**Wedge:** No campus tool shows real-time campus activity. CampusLabs is a static database. Instagram is individual posts. GroupMe is per-group. HIVE becomes the one place where you can feel the campus heartbeat.

**Impact:** High. Real-time liveness is the emotional difference between a tool and a living community. "847 students online" makes the platform feel massive and active. It also creates checking behavior: students open HIVE to see what is happening right now.

**Effort:** Medium. Presence data and event data already exist. The pulse strip is a lightweight component. "Trending in search" requires search logging (which should be built anyway). Recent joins requires an activity feed write on each join.

**Tradeoffs:** At low adoption, "12 students online" feels sad instead of exciting. Need minimum thresholds: do not show the pulse strip unless online count exceeds a threshold (50? 100?). Also: real-time updates add client-side resource consumption. Keep listeners scoped and debounced.

---

### 9. Smart Search with Intent Detection

**Problem:** Search is a text box. Students type "study" and get every space with "study" in the name. They type "things to do tonight" and get nothing. The search has no understanding of intent.

**Shape:** Layer intent detection on top of the existing search:

**Natural language queries:**
- "things to do tonight" -> Filter events happening today after 5pm
- "people in my major" -> Filter people by user's major
- "big clubs" -> Filter spaces with 50+ members
- "new spaces" -> Sort by creation date
- "active right now" -> Sort by online count

**Scoped search prefixes:**
- `@spaces robotics` -> Only search spaces
- `@people sarah` -> Only search people
- `@events friday` -> Only search events
- `@ghost` -> Only search ghost/unclaimed spaces

**Autocomplete with categories:**
As the student types, show grouped suggestions:
```
Spaces: Robotics Club, Robotics Research Lab
People: Sarah Robotics-Enthusiast Chen
Events: Robotics Demo Day (Friday)
Ghost: UB Robotics Team (unclaimed, 23 waiting)
```

**"Did you mean" corrections:**
For queries with 0 results and a close Levenshtein match, show: "No results for 'robtoics'. Did you mean robotics?"

**Wedge:** This transforms search from a string matcher into a campus assistant. The student does not need to know the exact name of what they are looking for.

**Impact:** High. Search is the primary discovery tool for returning users who know what they want. Making it smarter directly reduces failed searches and increases successful joins.

**Effort:** Medium-high. Intent detection requires a parsing layer (can be simple regex/keyword matching for v1, no ML needed). "Did you mean" requires Levenshtein distance calculation or a library like Fuse.js. Autocomplete requires a new API endpoint or expanding the search response.

**Tradeoffs:** Over-engineering search for a campus with 400 spaces is premature optimization. A simpler approach: fuzzy matching with Fuse.js on the client side against a cached space/people list. Scale up to server-side search intelligence only if query volume justifies it.

---

### 10. The "Claimed Today" Feed

**Problem:** When a ghost space is claimed, it is a significant campus event. The organization that was dormant just woke up. But currently, nothing visible happens. The new space just appears in the catalog with no fanfare.

**Shape:** A persistent notification/feed mechanism for ghost space claims:

- **Explore page banner:** "Alpha Phi Omega just went live! 47 waitlisted students can now join." Banner persists for 24 hours after claim, with a join CTA.
- **Home page card:** "New today: 3 spaces were claimed. Check them out." Shows the newly live spaces with their waitlist-to-member conversion count.
- **Waitlist notification:** Push/in-app notification to every student on the waitlist: "The space you were waiting for is live. Join now before it fills up."
- **Social proof amplifier:** "Alpha Phi Omega launched with 47 founding members" -- turn the waitlist count into a launch metric that creates FOMO for the next ghost space.

**Wedge:** Every claim is a micro-launch event. By celebrating it visibly, HIVE creates a sense that the platform is growing and organizations are coming alive. This motivates other students to claim their ghost spaces.

**Impact:** Medium-high. Each claim converts waitlist members into real members, provides content for the feed, and creates a visible growth narrative. Also reduces the "is this platform dead?" perception during early adoption.

**Effort:** Medium. Requires notification delivery (the stubbed `deliverNotification` needs to be implemented). Banner and feed components are straightforward. The claim flow itself already exists.

**Tradeoffs:** If very few ghost spaces are claimed, the "Claimed Today" feed will be empty and feel sad. Could expand to "Recently Claimed" (past 7 days) to ensure there is always content. Also: notification fatigue -- students on 20+ waitlists should not get 20 notifications on a busy day.

---

### 11. Cross-Space Discovery Graph ("People Who Joined X Also Joined Y")

**Problem:** Recommendations are currently individual-centric (based on your interests). But the strongest discovery signal is collective: what do people in your spaces also join?

**Shape:** A batch job that runs daily, analyzing co-membership patterns:

For every space, compute: "What other spaces do our members belong to?" Rank by overlap percentage and filter out obvious correlations (everyone is in the CS Major space).

Surface as:
- **On space pages:** "Members also belong to: Ethics in Tech (42% overlap), Hackathon Club (38%), Chess Club (31%)"
- **On explore page:** "Because you're in AI Club: these 3 spaces have the most member overlap with your communities."
- **In recommendations:** Boost spaces with high co-membership with user's existing spaces.

**Wedge:** This is the Amazon "customers who bought this also bought" mechanic adapted for communities. It captures real behavioral signals that interest tags cannot.

**Impact:** Medium-high. Co-membership is the single best predictor of whether a student will enjoy a space. If 40% of AI Club members are also in Philosophy Club, there is a real signal there that "AI people like philosophy."

**Effort:** Medium. The batch job is a Cloud Function that queries space membership and computes overlap matrices. Store results in Firestore as `spaceCoMembership` documents. The frontend change is minimal -- add a recommendation section to space pages and the explore feed.

**Tradeoffs:** At low density (few users per space), overlap patterns are noisy. Need a minimum threshold: only compute for spaces with 10+ members, only show overlaps with 5+ shared members. Also: updating daily is sufficient but means recommendations lag new joins by up to 24 hours.

---

### 12. Freshman Navigation Mode

**Problem:** A freshman in August has no mental model of campus organizations. They do not know what a "student org" vs "club sport" vs "Greek chapter" means. They do not know that the CS department has 8 sub-clubs. The current flat list of 400+ spaces is overwhelming.

**Shape:** A guided discovery mode for new students (auto-detected by profile year or days-since-signup):

**Step 1: "What kind of student are you?"**
Not interest selection -- identity selection. Visual cards:
- "The Builder" -- tech, entrepreneurship, maker spaces
- "The Performer" -- arts, music, theater, dance
- "The Activist" -- service, politics, advocacy
- "The Competitor" -- sports, gaming, debate
- "The Scholar" -- research, academic societies, study groups
- "The Social Butterfly" -- Greek life, cultural orgs, social clubs

Each identity maps to 3-5 "starter spaces" that are the most active in that cluster.

**Step 2: "Here are your starter spaces"**
Show 6-8 spaces matched to their identity, with one-tap join. Progress bar: "Join 3 to continue."

**Step 3: "Now explore on your own"**
Full explore page, but with their identity as a persistent filter that can be removed.

**Wedge:** This directly addresses freshman overwhelm. Instead of "here are 400 spaces, good luck," it is "here are 6 spaces for people like you." The identity framing ("The Builder") is more emotionally resonant than interest tags ("Technology, Engineering").

**Impact:** High for new user activation. The first 48 hours determine whether a student becomes a regular user. Reducing the cognitive load of initial discovery directly improves onboarding completion and D7 retention.

**Effort:** Medium. The identity-to-space mapping can be hand-curated initially. The stepped UI is a new component but follows established patterns from the entry flow. Detection logic (new student vs returning) already exists in the home page.

**Tradeoffs:** Archetypes are reductive. Many students are both "The Builder" and "The Performer." Allow multi-select or frame it as "start here, explore later." The curated mapping needs maintenance as spaces change -- a space that was active last semester may be dead this semester.

---

### 13. Discovery Notifications ("Your Campus is Changing")

**Problem:** Students who have already completed onboarding and joined spaces have no reason to revisit the explore page. Discovery is a one-time event, not an ongoing one. But campus communities change: new spaces form, events happen, friends join things.

**Shape:** A notification system for discovery events:

**Opt-in categories:**
- "A space matching your interests was just created" -- triggered when a new space's tags overlap with user interests.
- "Your friend [name] joined [space]" -- triggered on friend join, privacy-respecting (only if friend has public profile).
- "A ghost space you're watching was claimed" -- triggered on claim, sent to waitlisted users.
- "[Space] is hosting an event this week" -- triggered for spaces in user's interest graph but not yet joined.
- "Trending on campus: [space] gained 50 members this week" -- triggered by growth velocity.

**Delivery:**
- In-app notification bell (already exists, wired to SSE)
- Weekly email digest (opt-in)
- Push notifications (post-launch feature)

**Wedge:** This turns discovery from pull (student must open explore) to push (HIVE reaches out with relevant discoveries). Most campus platforms have zero push discovery -- they wait for students to come to them.

**Impact:** Medium-high. Push discovery is the mechanism that converts weekly users into daily users. A well-timed "your friend just joined this space" notification is one of the highest-converting touchpoints in social platforms.

**Effort:** High. Requires implementing the stubbed notification delivery system. Email digests require a transactional email provider. Push requires service worker setup. The notification logic itself (triggers, deduplication, rate limiting) is significant backend work.

**Tradeoffs:** Notification fatigue is the primary risk. A student who gets 5 discovery notifications per day will turn them off. Strict rate limits: max 2 discovery notifications per day, max 5 per week. Quality over quantity. Also: the notification infrastructure is partially stubbed -- this is a platform investment, not just a discovery feature.

---

### 14. "Start This Space" -- Creation as Discovery

**Problem:** Not every community that should exist on campus already has a ghost space. A student interested in "underwater robotics" or "Korean film" might search, find nothing, and leave. The current empty state says "No results" and suggests browsing existing spaces.

**Shape:** Turn zero-result searches into space creation prompts:

"No spaces match 'underwater robotics.' Start one?"
- Pre-fills space name from query
- Shows similar spaces as "Related communities"
- Estimated interest: "Based on search trends, 12 other students have searched for something similar"
- One-click creation with sensible defaults
- Auto-suggests a category
- First 5 joiners become "Founding Members" with a badge

Track zero-result queries and surface patterns to platform admins: "14 students searched for 'study abroad' this week but no space exists. Create a ghost space?"

**Wedge:** This turns unmet demand into supply. Every failed search becomes a signal. Every space creation from a failed search starts with built-in demand (the student who searched).

**Impact:** Medium. This is a long-tail feature -- most students will find existing spaces. But for the ones who do not, it transforms a dead-end into a creation moment. Over time, it fills gaps in the catalog organically.

**Effort:** Low-medium. Empty state UI change is trivial. Space creation flow already exists. Tracking zero-result queries requires a new analytics endpoint. The "estimated interest" metric requires search log aggregation.

**Tradeoffs:** Low-quality space creation. If creation is too easy, you get 50 spaces with 1 member each. Solution: spaces need 5 members within 30 days to remain active, otherwise they revert to ghost status with the creator notified. Also: need moderation for space names created from arbitrary search queries.

---

### 15. Explore Page Personalization Depth Indicator

**Problem:** The For You section says "Based on your interests" but the student does not know how much personalization data HIVE has. A student with 2 interests and 1 space gets the same UI as a student with 5 interests, 12 spaces, and 40 connections. The recommendations quality is very different, but the interface does not communicate this.

**Shape:** A subtle "personalization depth" indicator on the explore page:

```
For You (Personalized: ***)
Based on your interests, spaces, and activity
```

Stars (or a progress bar) indicate how much data HIVE has:
- 1 star: Interests only (from onboarding)
- 2 stars: Interests + spaces joined
- 3 stars: Interests + spaces + connections + activity patterns

Below the indicator, actionable nudges:
- "Add more interests to improve recommendations" (links to settings)
- "Connect with classmates to see social proof" (links to people search)
- "Join more spaces for better suggestions"

**Wedge:** This turns the recommendation engine into a visible, improvable system. Students understand that their actions (joining spaces, connecting with people) make the platform smarter for them. It creates a feedback loop where better data leads to better recommendations, which leads to more engagement, which leads to more data.

**Impact:** Low-medium on its own, but it is a retention mechanic. Students who understand that the platform gets smarter over time are more likely to invest in it.

**Effort:** Low. The personalization depth calculation is a simple check of profile completeness, space count, and connection count. The UI is a small addition to the For You section header.

**Tradeoffs:** Students who see 1 star might feel the platform is not useful yet. The indicator must be framed positively ("getting started" not "incomplete"). Also: this is a design pattern that works well in productivity tools (LinkedIn profile strength) but may feel forced in a social context.

---

## Quick Wins (Ship in Days)

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Surface mutuals on cards** | Display mutual friend count + avatar stack on SpaceCard using existing browse-v2 data | 1-2 days | High |
| **Fix person links** | Change `/profile/${id}` to `/u/${handle}` in explore page PersonCompactCard | Hours | Fix |
| **Search history** | Store last 10 searches in localStorage, show on search focus | 1 day | Medium |
| **"Trending" = velocity** | Change Popular This Week sort from member count to weekly join velocity | 1 day | Medium |
| **Next event on cards** | Show "Event Friday" teaser on space cards using existing event enrichment data | 1 day | Medium |
| **Category pills** | Horizontal scroll of category pills below search bar for quick filtering | 1-2 days | Medium |
| **Empty state upgrade** | Replace "No results" with suggested spaces + "Create this space?" prompt | 1 day | Medium |

---

## Medium Bets (Ship in Weeks)

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Ghost space resurrection engine** | Full claim flow + waitlist notifications + "Most Wanted" section | 2-3 weeks | Very high |
| **Smart search** | Fuzzy matching (Fuse.js), autocomplete, "Did you mean" corrections | 2 weeks | High |
| **Social proof cards redesign** | Avatar stacks, mutual friends, activity heat, event teasers on all cards | 1-2 weeks | High |
| **Time-aware explore feed** | "Happening Now" / "Coming Up" / "For You" modes based on time and event density | 2 weeks | High |
| **Anxiety-reducing preview** | Hover popover (desktop) / long-press sheet (mobile) with description, recent activity, events | 2 weeks | Medium-high |
| **Cross-space recommendations** | Daily batch job for co-membership analysis, "Members also joined" section | 2 weeks | Medium-high |
| **Freshman navigation mode** | Identity-based guided discovery for new students during first session | 2 weeks | High for activation |

---

## Moonshots (Ship in Months+)

| Feature | Description | Effort | Impact |
|---------|-------------|--------|--------|
| **Seasonal discovery campaigns** | Time-triggered explore page themes for Welcome Week, Rush, Midterms, etc. with curated content | 1-2 months | High if well-maintained |
| **Interest constellation** | Data-driven interest graph with visual exploration of related interests | 2-3 months | Medium |
| **Discovery notifications** | Full notification pipeline for discovery events: friend joins, ghost claims, interest matches | 2-3 months (includes notification infra) | High |
| **Real-time campus pulse** | Live counter strip with online students, live events, trending searches | 1-2 months | High for platform feel |
| **AI-powered search** | Semantic search with embeddings, natural language queries ("things to do tonight") | 2-3 months | Medium-high |
| **Collaborative filtering engine** | Full "people like you joined" recommendation system with matrix factorization | 2-3 months | High |

---

## Competitive Analysis

### How Students Currently Discover Clubs

**1. The Involvement Fair (once/year)**
- Students walk through a gym with 200+ tables.
- They sign up for email lists by writing their name on paper or scanning a QR code.
- Conversion: ~10% of signups become active members.
- Problem: Overwhelming, one-shot, no follow-up mechanism. If you miss the fair, you miss the year.

**2. Word of Mouth**
- A friend says "you should join X."
- Conversion: Very high (~60%+) because it comes with built-in social proof.
- Problem: Limited reach. Only works within existing social graphs. Does not help isolated students.

**3. Instagram**
- Orgs post flyers, event announcements, recruitment content.
- Students discover via hashtags (#UBStudentOrgs), stories, and the explore page.
- Conversion: Low. Instagram is not designed for community joining. The path from seeing a post to becoming a member has 5+ steps across platforms.
- Problem: Fragmented. Each org runs its own account. No unified discovery surface. No way to search "all CS clubs at UB."

**4. University Website (CampusLabs / GetInvolved)**
- Official directory of registered student organizations.
- Searchable by name and category.
- Conversion: Very low. Static listings with outdated contact info. No activity signals, no social proof, no liveness indicators.
- Problem: A compliance tool, not a discovery tool. No student checks CampusLabs to find their community.

**5. GroupMe / Discord Invite Links**
- Shared in orientation groups, class chats, social media.
- Conversion: Medium. Joining a group chat is low commitment.
- Problem: Siloed. Each group is its own island. No cross-group discovery. Finding the invite link requires already knowing someone in the group.

**6. Flyers / Bulletin Boards**
- Physical flyers in student union, dorms, department buildings.
- Conversion: Very low in 2026. Students walk past them.
- Problem: Not searchable, not personalized, no analytics. An artifact of a pre-digital campus.

### HIVE's Structural Advantages

| Advantage | Why Competitors Cannot Replicate |
|-----------|----------------------------------|
| Pre-seeded catalog of 400+ real orgs | Requires CampusLabs data partnership and campus-specific effort |
| Unified search across all orgs, people, events | Requires all content on one platform -- fragmentation is the incumbent's structural problem |
| Social proof (mutual friends, join counts) | Requires the social graph to exist on the platform -- chicken-and-egg problem for new entrants |
| Real-time activity signals | Requires active usage on the platform -- static directories cannot show liveness |
| Interest-based personalization | Requires user profiles with interest data -- generic tools do not collect this |
| Ghost space mechanic | Unique to HIVE. No other platform shows "the org exists, it just needs a leader" |

### Where Competitors Win (For Now)

| Competitor Advantage | How HIVE Responds |
|---------------------|-------------------|
| Instagram has massive reach | HIVE will never beat Instagram for reach. Focus on conversion: "You saw the post on IG, now join the community on HIVE." |
| Discord has better chat features | HIVE's chat is good enough. The advantage is not chat quality -- it is the discovery layer that Discord completely lacks. |
| Word of mouth has highest trust | Amplify word of mouth digitally: "Sarah joined Robotics Club" notifications are the digital version of a friend recommendation. |
| The involvement fair is a tradition | Do not fight tradition. Complement it: "Scan the QR code at our table to join on HIVE." Then HIVE becomes the post-fair followup. |

---

## Wedge Opportunities

### Wedge 1: The Ghost Space Claim Event

**Who:** Student org leaders who are already frustrated with managing their community across 5 platforms.

**Urgency:** "47 students are waiting for someone to claim your organization. If you do not claim it, someone else might." This creates urgency because the waitlist is visible and the claim is first-come-first-served.

**Authority:** Org leaders have the authority to move their community to a new platform. They do not need university permission.

**First session value:** Leader claims space -> 47 waitlisted students auto-become members -> leader has a community with real members on day one, without doing any recruitment.

**Existing behavior replaced:** Setting up a new GroupMe or Discord server and manually inviting everyone.

### Wedge 2: The Freshman "Where Do I Belong?" Moment

**Who:** Incoming freshmen in August/January who feel lost and anxious about finding their place.

**Urgency:** The first 2 weeks of the semester. After that, social groups calcify and it becomes harder to break in.

**Authority:** Students have full authority over their own social decisions.

**First session value:** Complete onboarding (90 seconds) -> get 3-5 space recommendations based on major and interests -> join 2-3 with one tap -> immediately see active conversations and upcoming events -> feel like they belong.

**Existing behavior replaced:** Attending the involvement fair, signing up for email lists that never send anything useful, and asking roommates "what clubs are you in?"

### Wedge 3: The "Is This Club Even Active?" Search

**Who:** Students who heard about a specific club and want to know if it is real, active, and worth joining.

**Urgency:** They heard about it today (friend mentioned it, saw a flyer, professor suggested it). The intent is immediate.

**Authority:** Full authority -- they just need information to decide.

**First session value:** Search the club name -> see member count, online count, last active time, upcoming events, and mutual friends who are members -> either join immediately or save for later.

**Existing behavior replaced:** Googling "[club name] UB", finding a dead Facebook page from 2019, and giving up.

---

## Open Questions

1. **Ghost space claim verification:** How do we verify that the person claiming a space actually represents the organization? Options range from honor system to requiring approval from a university administrator. Each has different friction/accuracy tradeoffs. This needs a decision before the ghost resurrection engine ships.

2. **Search infrastructure:** At what scale do we move from client-side Fuse.js to a dedicated search service (Algolia, Typesense, Meilisearch)? 400 spaces is fine for client-side. 4,000 spaces across 10 campuses probably is not. The decision affects architecture and cost.

3. **Collaborative filtering cold start:** The "people like you joined" feature requires sufficient join data to produce meaningful recommendations. What is the minimum? 100 users with 3+ spaces each? 500? Need to define the threshold and have a fallback for below-threshold.

4. **Notification infrastructure priority:** Discovery notifications (friend joined, ghost claimed, interest match) require the notification delivery pipeline that is currently stubbed. Is this a discovery team concern or a platform team concern? It blocks multiple features across multiple systems.

5. **Seasonal campaigns -- who owns content?** Seasonal discovery campaigns require someone to create and schedule content for each season. Is this automated (data-driven), manual (content team), or hybrid? At one campus this might be manageable. At 10 campuses, manual curation does not scale.

6. **Privacy of join signals:** "Sarah just joined Robotics Club" is a powerful social proof notification. But does Sarah want her join activity broadcast? Need a clear privacy model: are join events public by default (opt-out) or private by default (opt-in)? This affects the utility of social proof features platform-wide.

7. **Ghost space waitlist size as a metric:** Should ghost spaces with large waitlists be promoted more aggressively? This creates a flywheel (visibility -> more waitlist signups -> more visibility) but also means less-popular ghost spaces never get attention. Is this the right dynamic?

8. **First-time vs returning user explore:** Should the explore page look different for first-time users vs returning users? Currently it is the same. A first-time user needs guidance ("start here"). A returning user needs newness ("what changed since yesterday"). Serving both in one layout is hard.

9. **The "dead space" problem:** What happens when a claimed space becomes inactive? If a space has 0 messages for 60 days, should it revert to ghost status? Should it be de-listed from explore? The lifecycle of a space after claim is undefined.

10. **Density requirements:** Many of these features (social proof, real-time pulse, trending, collaborative filtering) require a minimum user density to function. What is the launch strategy if UB adoption is 500 users instead of 5,000? Which features degrade gracefully and which should be hidden behind density thresholds?
