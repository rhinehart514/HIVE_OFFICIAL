# Campus Intelligence

**Dimension:** What HIVE knows about your campus. Trending spaces, popular events, active times, campus pulse, what's growing, what's dying, institutional knowledge. The data layer.

**Core tension:** Students want to feel the heartbeat of their campus. Universities want to understand engagement. Both want insight without surveillance.

---

## Current State

HIVE already collects the raw ingredients for campus intelligence, but none of it is synthesized, surfaced, or sold.

**What HIVE knows today:**
- 400+ space records with `memberCount`, `postCount`, `eventCount`, `toolCount`, `trendingScore`
- Every `spaceMembers` record with `joinedAt`, `lastActiveAt`, `postCount`, `role`
- Every message in `spaceMessages` with timestamps, `senderId`, `spaceId`
- Every event with `startDate`, RSVP counts, attendance
- Presence data (online/away/offline) with 60-second heartbeats
- Activity feed: messages, events, posts, tool deployments across all user spaces
- Tool usage via `activityEvents` collection (toolId, action, timestamp)
- Space categories, governance models, source (imported vs. native), claim/live status
- User profiles: major, academic year, interests, follower/following counts

**What HIVE does with it:**
- Shows a chronological activity feed on `/home`
- `trendingScore` field exists on spaces but is used only for sort order in browse
- SpaceDiscoveryService has a `getTrending()` method that sorts by `trendingScore`
- Recommendation algorithm (anxiety relief + social proof + insider access) is built but only surfaces one recommendation per day on the home page
- Tool usage stats: per-user weekly usage, top tools, category breakdown (only visible to tool owners in HiveLab)

**What nobody can see:**
- Which spaces are growing vs. dying
- What time of day campus is most active
- Which events actually get attendance (RSVP != showed up)
- What categories of orgs are trending this semester vs. last
- Cross-space patterns ("students who join X also join Y")
- Space health indicators (a space with 200 members and 0 messages in 30 days is dead)
- Campus-wide engagement trends over time
- How the academic calendar affects activity

---

## The Opportunity

HIVE sits on a dataset that literally does not exist anywhere else: **structured, real-time engagement data for every student organization on a campus.**

- **OrgSync/CampusLabs** knows which orgs are registered. It does not know which orgs are alive.
- **Discord/GroupMe** knows message volume in one channel. It does not know cross-org patterns.
- **University admin dashboards** know enrollment. They do not know engagement.
- **Instagram** knows who follows an org page. It does not know who shows up.

HIVE is the only system that knows: "This student is in 4 orgs, active in 2, attended 7 events this month, and their most-active hours are Tuesday/Thursday 2-5pm." Multiply that by 32,000 students and you have a campus intelligence layer that universities, student governments, and org leaders would pay real money for.

**The three-layer play:**
1. **Student-facing:** "What's buzzing right now" -- drives engagement and return visits
2. **Leader-facing:** "Is my space healthy?" -- drives retention of the user who matters most
3. **Admin-facing (B2B):** "Which orgs need support?" -- drives revenue

---

## Feature Ideas

### 1. Campus Pulse

**Problem:** A student opens HIVE and sees their own spaces. They have no sense of what the entire campus is doing right now. There is no "town square" energy.

**Shape:** A lightweight, always-visible indicator (think: Spotify's "X people listening right now" or GitHub's contribution graph). On the home page or in the sidebar -- a real-time signal showing: total online now, trending spaces in the last hour, busiest time today, events happening now with live RSVP counts. Not a feed. A vibe check.

**Wedge:** New students with empty dashboards have nothing to see. Campus Pulse gives them something interesting on visit #1 before they have joined anything. It answers "is anyone even here?" which is the first question on any new platform.

**Impact:** High. Drives daily return visits and creates FOMO-based engagement. Makes HIVE feel alive even for lurkers.

**Effort:** Low-Medium. Presence data already exists. Activity feed data exists. Need an aggregation endpoint and a compact UI component.

**Tradeoffs:**
- Shows campus is quiet during off-hours (could backfire at 2am or summer)
- Requires enough users to feel populated (chicken-and-egg at launch)
- Must not feel like surveillance -- "247 students online" is exciting; "Josh is in the library" is creepy

---

### 2. Space Health Score

**Problem:** Space leaders have no idea if their community is healthy. A space with 300 members and 2 messages last week is on life support. A space with 30 members and 200 messages is thriving. Nobody surfaces this.

**Shape:** A composite score (0-100) visible to space leaders on their space settings page. Factors: message frequency, unique active members per week, event creation rate, member growth rate, tool deployments, RSVP engagement. Color-coded: green (thriving), amber (stable), red (at risk). Includes trend arrow (improving/declining) and specific recommendations ("Your message volume dropped 40% this month. Consider posting an announcement or scheduling an event.").

**Wedge:** Club leaders are the primary user HIVE needs to retain. They currently have zero visibility into whether their space is working. This gives them a reason to check their space dashboard daily.

**Impact:** High. Directly drives leader retention and space engagement. Creates a feedback loop: leaders see their score, take action, score improves.

**Effort:** Medium. Need to define the scoring formula, build the aggregation pipeline (can be a scheduled Cloud Function), and build the dashboard component.

**Tradeoffs:**
- A low health score might discourage leaders rather than motivate them (framing matters)
- Comparing scores across spaces of different sizes is misleading (a 10-person study group vs. a 500-person org)
- Leaders might game the metric (spam messages to boost score)
- Must not be visible to regular members (leader-only, to avoid "dead space" stigma)

---

### 3. Trending This Week

**Problem:** The explore page sorts by popularity (member count), which favors large established orgs. New or niche spaces with energy have no way to surface.

**Shape:** A dedicated section on the explore page and home page: "Trending This Week." Ranked by a velocity metric: (new members this week + messages this week + events this week) / previous week baseline. Spaces with accelerating engagement bubble up regardless of absolute size. Shows the top 5-10 with a spark line.

**Wedge:** New spaces created on HIVE (not just seeded CampusLabs imports) need a path to visibility. This is how a brand-new study group with 8 members and intense activity gets seen alongside the 500-member student government.

**Impact:** Medium-High. Drives discovery of new spaces, rewards active communities, reduces the "only big orgs get seen" problem.

**Effort:** Low. The `trendingScore` field already exists on spaces. Need to make the calculation real (currently unclear how it is computed), run it on a schedule, and surface it on explore/home.

**Tradeoffs:**
- Can be gamed by spam-joining or spam-messaging
- Small sample sizes early on mean one active person can make a 5-person space "trending"
- Need minimum thresholds to avoid noise (e.g., must have 5+ members and 10+ messages)

---

### 4. "Students Who Joined X Also Joined Y"

**Problem:** A student joins a CS club. They do not know that 60% of CS club members are also in the Robotics Club and the Startup Incubator. This cross-pollination data is invisible.

**Shape:** On each space's page, a "Related Spaces" section powered by actual co-membership data. Not tag-based similarity (which is what most platforms do). Real behavioral overlap. "47 members also in Robotics Club. 31 members also in Startup Incubator." Optionally, surface this in recommendations: "You joined CS Club -- 8 of your clubmates are in Robotics Club."

**Wedge:** This is a classic Amazon "customers also bought" play. It works because the data is behavioral (who actually joined both), not editorial (someone tagged them as related). No other campus tool has this data.

**Impact:** Medium-High. Drives multi-space membership, which is the strongest retention signal. Students in 3+ spaces are far stickier than students in 1.

**Effort:** Medium. Need a batch job to compute co-membership matrices. The query is: for each space, count members who are also in each other space, ranked by overlap percentage. Cache the results.

**Tradeoffs:**
- Small spaces leak identity ("3 members also in LGBTQ Alliance" might out someone in a 20-person space)
- Must set minimum thresholds: only show co-membership for spaces with 20+ members and 5+ overlap
- Stale data is fine (recompute daily or weekly)

---

### 5. Event Intelligence

**Problem:** Event creators have no idea what time/day works best, what event types get attendance, or how their events compare to others. They guess.

**Shape:** Leader-facing dashboard: "Your event analytics." Shows: average RSVP-to-attendance ratio, best day of week for your events (based on RSVPs), busiest campus event times (so you can avoid conflicts), similar events that competed for attention. Also student-facing: "Based on your past RSVPs, you might like these events this week."

**Wedge:** Event planning is the most concrete, time-sensitive job-to-be-done for club leaders. If HIVE tells them "Thursday 5pm has 3 other events; try Tuesday 7pm -- your audience is usually free," that is immediate, tangible value no other tool provides.

**Impact:** Medium. Drives better events, which drives attendance, which drives engagement. But requires enough event data to be useful.

**Effort:** Medium-High. Need RSVP analytics pipeline, time-of-day analysis, conflict detection against campus-wide calendar.

**Tradeoffs:**
- Early on, insufficient data to make strong recommendations
- "Best time" advice could cause herding (everyone schedules for Tuesday 7pm)
- RSVP != attendance. Without check-in data, the signal is noisy.

---

### 6. Campus Activity Heatmap

**Problem:** Students and leaders have no sense of when campus is "on." Is Monday morning dead? Is Thursday night lit? Nobody knows.

**Shape:** A visual heatmap (7 days x 24 hours) showing aggregate campus activity by time slot. Uses presence data, message volume, and event attendance as inputs. Visible on a "Campus" page or as a widget on home. Think GitHub contribution graph meets Strava's activity heatmap.

**Wedge:** Beautiful, shareable, and immediately understood. This is the kind of visualization that gets screenshotted and posted on Instagram -- free distribution. "Look how dead UB is at 8am on Friday" is the kind of thing students share.

**Impact:** Medium. Interesting but not directly actionable for most students. More valuable as a distribution artifact and as input to event scheduling.

**Effort:** Low-Medium. Presence heartbeats and message timestamps already exist. Need an aggregation endpoint and the heatmap UI component.

**Tradeoffs:**
- Might expose embarrassingly low activity if the platform is early-stage
- Privacy: aggregate only, never show individual activity patterns
- Timezone handling must be correct (all students on same campus, but display in local time)

---

### 7. Admin Intelligence Dashboard (B2B)

**Problem:** University administrators (Student Affairs, Student Government, Dean of Students) have no real-time visibility into which student organizations are thriving vs. struggling. They allocate funding based on compliance reports filed once a year.

**Shape:** A read-only dashboard (separate from the student app, possibly at `admin.hive.com`) showing: org health scores, engagement trends over time, event frequency by category, new org growth, at-risk orgs (declining engagement), campus-wide engagement metrics, comparison across semesters. All data aggregated -- never individual student data. Exportable to PDF/CSV.

**Wedge:** Universities currently pay for OrgSync/CampusLabs ($50k-200k/year) and get static registration data. HIVE can offer dynamic engagement data as an upsell. The conversation: "Your CampusLabs data tells you 300 orgs exist. Our data tells you 47 of them are dead."

**Impact:** Very High (revenue). This is the B2B monetization play. Universities have budget for student engagement tools. If HIVE can demonstrate it surfaces actionable insights about org health, this becomes a procurement conversation.

**Effort:** High. Requires a separate admin app, aggregation pipelines, data access controls, possibly SOC2/FERPA compliance review, and a sales process.

**Tradeoffs:**
- Students might resist if they feel the university is watching them
- Must be extremely clear: "We share aggregate engagement metrics, never individual behavior"
- Need to solve the FERPA question: is "Student Government had 200 messages last week" educational record data?
- Building for admins risks losing focus on the student experience
- Could require SOC2 Type 2 for enterprise sales

---

### 8. Personal Activity Digest

**Problem:** Students check HIVE reactively. They have no summary of what they did, what they missed, or what is coming up. The current home page is a live stream, not a recap.

**Shape:** A weekly (or daily) digest -- delivered in-app and optionally via email. "This week on HIVE: You were active in 3 spaces. You attended 2 events. Robotics Club grew by 15 members. 4 events this week match your interests." Think Spotify Wrapped, but weekly and lightweight. Emphasis on social proof ("You and 47 others attended Game Night") and gentle nudges ("You haven't visited CS Club in 2 weeks").

**Wedge:** The digest is the re-engagement hook. Students who drift away get a weekly reminder of what they are missing. It also creates a shareable artifact -- "My HIVE week" that can be screenshotted.

**Impact:** Medium-High. Proven re-engagement pattern (Strava, Spotify, Duolingo all do this). Low cost per incremental DAU.

**Effort:** Medium. Need a digest generation pipeline (Cloud Function on schedule), email template (SendGrid), in-app digest page. The data already exists, just needs assembly.

**Tradeoffs:**
- Notification fatigue if poorly timed or too frequent
- Empty digests are worse than no digest ("You did nothing this week" is depressing)
- Must earn the right to email -- needs clear opt-in and easy unsubscribe

---

### 9. The Campus AI Assistant

**Problem:** "What events are happening this week?" "What clubs should I join as a CS freshman?" "When does SGA meet?" These questions have answers buried in HIVE's data, but finding them requires browsing multiple pages.

**Shape:** A conversational interface (chat-style, accessible from a floating button or `/ask` route) that queries HIVE's structured data. Not a general-purpose LLM -- a RAG pipeline over HIVE's Firestore data. It can answer: factual queries ("When is the next Robotics Club meeting?"), recommendations ("What spaces match my interests?"), campus pulse ("What's trending right now?"), and scheduling ("What events are happening Tuesday?").

**Wedge:** This is the 2026+ vision from VALUE.md: "Students' AI assistants will query HIVE's APIs." But the first version is HIVE's own assistant. It is the most natural way to surface campus intelligence to students who do not want to browse.

**Impact:** Very High (long-term). An AI that actually knows your campus is a category-defining feature. But the MVP must be tightly scoped to avoid hallucination and maintain trust.

**Effort:** High. Need structured query layer over Firestore, prompt engineering, RAG pipeline, LLM API costs, conversational UI. But can start narrow: only answer questions about events and spaces, with hardcoded query patterns.

**Tradeoffs:**
- LLM hallucination risk: if it says "SGA meets Thursday at 5pm" and that is wrong, trust is destroyed
- Cost: LLM API calls at scale could be expensive
- Scope creep: temptation to make it do everything
- Privacy: must never reveal individual user behavior in responses
- v1 should be deterministic queries with natural language input, not generative answers

---

### 10. Semester Wrapped

**Problem:** At the end of each semester, there is no celebration or reflection on what happened across campus. Students do not appreciate the collective activity until it is gone.

**Shape:** A "Semester Wrapped" feature (yes, like Spotify Wrapped). Per-student: your top spaces, events attended, messages sent, new connections, "you were in the top 10% of active students." Per-campus: most active space, biggest event, fastest-growing org, total messages sent, total events hosted, "UB had 45,000 conversations this semester." Shareable cards for social media.

**Wedge:** Pure distribution play. Students share their Wrapped on Instagram. Non-HIVE users see it and ask "what's HIVE?" This is the Spotify Wrapped playbook applied to campus life.

**Impact:** High (distribution). Low direct engagement impact but massive word-of-mouth potential. One viral semester wrapped campaign could drive 5x the signups of any feature.

**Effort:** Medium-High. Need a data aggregation pipeline, a card/story generation system, sharing infrastructure. Only runs twice a year, so amortized effort per month is low.

**Tradeoffs:**
- Must have enough users and data for the stats to feel impressive, not embarrassing
- Timing: must ship at least one full semester after launch to have meaningful data
- Privacy: "your top space" might reveal membership in sensitive orgs (opt-out required)
- Risk of feeling gimmicky if the core product is not yet solid

---

### 11. Space Lifecycle Alerts

**Problem:** When a space is dying (declining messages, declining members, no events in 30 days), nobody notices until it is a ghost town. When a space is exploding (3x member growth, flooding activity), leaders may need help scaling.

**Shape:** Automated alerts to space leaders when lifecycle thresholds are crossed. "Your space has not had a new message in 14 days. Consider posting an update." "Your space grew by 50 members this week! Consider adding a moderator." Also for platform admins: a dashboard showing spaces crossing into "at risk" or "breakout" status.

**Wedge:** Leaders of dying spaces are the hardest to retain. A proactive nudge before they give up is higher-leverage than any feature improvement. Leaders of breakout spaces need operational help -- HIVE offering it builds loyalty.

**Impact:** Medium. Directly prevents churn for at-risk spaces. Small in scale but high in per-user value.

**Effort:** Low-Medium. Health score formula (from Feature 2) feeds into threshold checks. Cloud Function runs daily, creates notifications.

**Tradeoffs:**
- "Your space is dying" is a harsh message. Framing as "suggestions to re-engage" is better.
- Alert fatigue if thresholds are too sensitive
- Leaders of intentionally low-activity spaces (semester-specific clubs) should not get nagged

---

### 12. Interest Graph Visualization

**Problem:** HIVE collects interests during onboarding but does almost nothing with them. Students pick interests and never see them again.

**Shape:** A campus-wide "interest map" visualization. Clusters of interests connected by co-occurrence in profiles. "Technology" connects to "Entrepreneurship" connects to "Design" -- with node sizes proportional to how many students selected each. Click an interest to see spaces and events related to it. This becomes the entry point for interest-based discovery.

**Wedge:** The explore page currently shows spaces sorted by member count. The interest graph provides an entirely different entry point: "I'm interested in sustainability" -> see all spaces, events, and people connected to that interest. More intuitive than browsing categories.

**Impact:** Medium. Beautiful and novel, but unclear if it drives engagement beyond initial exploration.

**Effort:** Medium. Need to aggregate interest data (already in profiles), compute co-occurrence, build a force-graph visualization, and link nodes to filtered explore views.

**Tradeoffs:**
- Visualization complexity: force-directed graphs can be confusing on mobile
- Cold start: with few users, the graph is sparse and uninteresting
- Maintenance: interests evolve; the graph must stay current
- Might be a "cool demo" that nobody uses daily

---

### 13. Predictive Event Recommendations

**Problem:** Students RSVP to events based on what they see in their feed, which is limited to spaces they have already joined. They miss events in spaces they have not discovered yet.

**Shape:** A recommendation engine that predicts event interest based on: past RSVP history, interests, major, time-of-day preferences (derived from attendance patterns), and what similar students are attending. "Students with your interests usually attend events like this" or "12 students you follow are going to this."

**Wedge:** The only platform that can recommend campus events based on behavioral data (not just category tags). Google Calendar does not know what events exist. Instagram does not know what the student attended. HIVE knows both.

**Impact:** Medium. Drives event attendance, which is the most tangible value HIVE provides. But requires enough events and RSVP data to train the model.

**Effort:** Medium-High. Need a recommendation pipeline, collaborative filtering or simple heuristics, and a UI surface (home page widget, push notifications before relevant events).

**Tradeoffs:**
- Filter bubble: only recommending familiar events prevents serendipitous discovery
- Cold start: new users have no history to base recommendations on (fall back to interest-based)
- Over-notification: "you might like this event" 5x/day is spam

---

### 14. Campus Comparison (Multi-Campus)

**Problem:** When HIVE expands to multiple campuses, there is no benchmark. Is UB's engagement good or bad? Compared to what?

**Shape:** Cross-campus analytics (only visible to HIVE internal team and optionally to university admins). Engagement benchmarks: messages per student per week, events per org per month, average space health, DAU/MAU ratio. Anonymized: "Campus A has 40% DAU/MAU; you have 25%."

**Wedge:** This only exists if HIVE is on multiple campuses. But once it does, the benchmarking data becomes incredibly valuable for university procurement: "Your peer institutions on HIVE have 3x the student engagement in student orgs."

**Impact:** High (long-term, B2B). Not relevant until multi-campus, but should be designed into the data model now.

**Effort:** Low (data model) to High (multi-campus infrastructure).

**Tradeoffs:**
- Only valuable at 3+ campuses
- Comparing campuses of different sizes is misleading (normalize per-student)
- Universities may not want to be compared to peers

---

### 15. Leader Benchmarking

**Problem:** A space leader does not know if 50 messages/week is good or bad for a space of their size and type. There is no reference point.

**Shape:** Anonymous benchmarks for leaders: "Your space's message rate is in the top 20% for Student Organizations with 50-100 members." "Spaces your size typically host 2 events per month; you hosted 0." Shows percentile positioning without revealing specific other spaces' data.

**Wedge:** Leaders are competitive. Benchmarks create a natural desire to improve. "You're in the 40th percentile" motivates action in a way raw numbers do not.

**Impact:** Medium. Drives leader engagement with analytics, which drives space health, which drives member retention.

**Effort:** Low-Medium. Requires the aggregation from Space Health Score plus percentile computation across similar spaces.

**Tradeoffs:**
- Must have enough spaces of each type/size to make percentiles meaningful (need 20+ per bucket)
- Can discourage leaders if they are consistently in the bottom tier
- Gaming risk: leaders optimize for metric rather than genuine engagement

---

## Quick Wins (Ship in Days)

**1. Campus Pulse (Lite)**
Surface total online users and "trending spaces in the last hour" on the home page. Data already exists via presence hooks and `trendingScore`. Need one aggregation endpoint and a compact home page component. 2-3 days.

**2. Trending This Week section on Explore**
Make `trendingScore` computation real (7-day velocity of members + messages + events) and run it in a daily Cloud Function. Add a "Trending" section to the explore page above the default browse. 2-3 days.

**3. "Also In" Related Spaces**
Batch job to compute co-membership overlap between spaces. Store top-5 related spaces per space in a `relatedSpaces` field. Surface as "Members also in" on each space's page. 3-4 days.

**4. Personal Activity Summary**
A small card on `/home` showing "This week: X messages sent, Y events RSVPd, Z spaces visited." Uses existing activity data. Purely aggregation + UI. 1-2 days.

---

## Medium Bets (Ship in Weeks)

**5. Space Health Score + Leader Dashboard**
Define the scoring formula. Build a Cloud Function to compute scores daily. Add a "Health" tab to space settings (leader-only). Include recommendations for improvement. 2-3 weeks.

**6. Event Intelligence for Leaders**
RSVP analytics, best day/time analysis, conflict detection against campus calendar. Leader-facing dashboard in space settings. 2-3 weeks.

**7. Weekly Digest**
Cloud Function on a schedule. Aggregates per-user weekly stats. In-app digest page + SendGrid email. Opt-in during onboarding. 2 weeks.

**8. Campus Activity Heatmap**
Aggregation pipeline over presence/message data. Heatmap UI component (d3 or recharts). Display on explore or a new "Campus" page. 2 weeks.

**9. Space Lifecycle Alerts**
Health score thresholds + notification triggers. "Your space needs attention" and "Your space is breaking out" alerts. Cloud Function + notification service integration. 1-2 weeks.

---

## Moonshots (Ship in Months+)

**10. Admin Intelligence Dashboard (B2B)**
Separate admin app. Aggregated campus metrics. Export capabilities. FERPA/compliance review. Sales process. 3-6 months minimum.

**11. Campus AI Assistant**
RAG pipeline over HIVE data. Conversational UI. Scoped to events/spaces/recommendations initially. LLM integration. 2-4 months.

**12. Semester Wrapped**
End-of-semester data pipeline. Per-student and per-campus stats. Shareable social cards. 1-2 months of engineering, but only runs 2x/year.

**13. Predictive Recommendations Engine**
Collaborative filtering for events and spaces. Requires enough behavioral data (3+ months of usage at scale). 2-3 months.

**14. Interest Graph Visualization**
Force-directed graph UI. Interest co-occurrence computation. Linked exploration flows. 1-2 months.

---

## Competitive Analysis

### What campus data exists today?

| System | What It Knows | What It Cannot Know |
|--------|---------------|---------------------|
| **CampusLabs / OrgSync / Presence (by Campus Labs)** | Which orgs are registered. Officer names. Annual reports. Event submissions for approval. Compliance status. | Which orgs are actually active. Real engagement. Message volume. Member sentiment. Growth trends. |
| **University Admin Dashboards (Banner, PeopleSoft)** | Enrollment. Course registration. GPA. Housing. Financial aid. | Student organization engagement. Social connections. Event attendance (beyond official university events). |
| **Google Analytics (on university websites)** | Page views on the student org directory. Click-through on event listings. | Nothing about what happens after someone visits the page. No engagement data. No community data. |
| **Discord / GroupMe** | Message volume in specific channels a student is in. | Cross-org patterns. Campus-wide trends. Structured event data. University-level aggregation. Nothing is organized by campus. |
| **Instagram / Social Media** | Follower counts. Post engagement. Reach. | Real membership. Event attendance. Who is active vs. lurking. No structured data. |
| **Handshake** | Career engagement. Employer connections. | Student organization data. Social engagement. Community health. |

**The gap HIVE fills:** Structured, real-time engagement data for every student organization on a campus, connected to event attendance, tool usage, and cross-org membership patterns. Nobody has this.

### Competitive vulnerability

The biggest competitive risk is not another app -- it is universities building their own dashboards on top of CampusLabs data. But CampusLabs data is compliance data (who registered, who filed reports), not engagement data (who is active, who shows up). HIVE's data is categorically different.

---

## Wedge Opportunities

### Wedge 1: Space Health as the "leader retention hook"

**The sequence:**
1. Leader claims a space on HIVE
2. Within a week, they see their Space Health Score
3. Score is moderate -- HIVE suggests actions ("Post an announcement," "Schedule an event")
4. Leader takes action, score improves, they feel progress
5. Leader checks score weekly -- HIVE becomes the dashboard for their org

**Why this works:** Leaders are the multiplier. One engaged leader activates 50-500 members. The health score gives them a reason to come back to HIVE beyond just chatting.

### Wedge 2: Campus Pulse as the "new user magnet"

**The sequence:**
1. New student opens HIVE for the first time
2. Before joining anything, they see: "1,247 students online. Trending: Robotics Club (47 new members), Game Night (120 RSVPs)."
3. Immediate sense of life, activity, and FOMO
4. They join 2-3 spaces within the first session

**Why this works:** Cold start is HIVE's biggest UX problem. Campus Pulse makes HIVE feel alive even before the student has joined anything.

### Wedge 3: Admin Dashboard as the "university budget unlock"

**The sequence:**
1. HIVE launches at UB with student adoption
2. After one semester, HIVE has engagement data that Student Affairs has never seen
3. Present to Director of Student Affairs: "47 of your 300 registered orgs have zero activity. 12 orgs are growing 3x. Here's the data."
4. Student Affairs budget allocated for HIVE as an engagement analytics tool
5. HIVE now has institutional buy-in + revenue

**Why this works:** University budgets for "student engagement tools" already exist (allocated to CampusLabs, Corq, etc.). HIVE's pitch is not "replace your tools" but "see what your tools cannot show you."

---

## Open Questions

1. **Privacy bright line:** Where exactly is the line between "aggregate campus intelligence" and "student surveillance"? HIVE must define this clearly before shipping any intelligence feature. Proposed rule: never surface data attributable to an individual to anyone other than that individual. All cross-user data is aggregated to 20+ people minimum.

2. **Minimum viable data:** How many users and how much activity is needed before intelligence features feel useful rather than embarrassing? If Campus Pulse shows "12 students online," that is a negative signal. What is the threshold? Probably 500+ DAU before campus-wide metrics feel impressive.

3. **FERPA implications:** When a university admin sees "Student Government had 200 messages last week," is that an educational record? Probably not (aggregate org data is not individual student data), but this needs legal review before the B2B play.

4. **trendingScore computation:** The field exists on spaces but the computation method is unclear in the codebase. What is the current formula? It needs to be (a) defined, (b) documented, and (c) recomputed on a schedule for any intelligence features to work.

5. **Data retention policy:** Campus intelligence requires historical data. How long does HIVE retain message timestamps, presence logs, and activity events? Is there a retention policy? There should be, and it should be communicated to users.

6. **Opt-out mechanisms:** Can a student opt out of being included in aggregate metrics? Can a space leader opt out of health scoring? What are the defaults? Proposed: aggregate metrics are always on (they are anonymous), health scores are on by default for leaders but can be hidden.

7. **Timing of the B2B play:** Is it too early to approach university admins before the platform has a full semester of data? Or is the pre-launch pitch ("we will be able to show you this") valuable enough to secure early buy-in?

8. **Academic calendar data source:** The Campus Rhythm Engine needs semester dates, finals weeks, and breaks. Where does this data come from? Manual admin input? Scraping the university registrar page? Partnership with the university for calendar data?

9. **Cross-campus data isolation:** When HIVE expands to multiple campuses, can campus A see aggregate stats from campus B? Can HIVE publish a public "campus leaderboard"? This has marketing value but privacy implications.

10. **Cannibalization risk:** If HIVE gives universities an admin dashboard with all the engagement data, does the university lose incentive to promote HIVE adoption (since they already have what they wanted)? Or does the dashboard make the university more invested in driving adoption (because the data gets better with more users)?
