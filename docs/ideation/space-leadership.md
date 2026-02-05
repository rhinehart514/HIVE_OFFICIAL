# Space Management & Leadership

> **Dimension:** What leaders get. The admin experience that makes running a club on HIVE better than anywhere else.
> **Primary Persona:** Club Leaders (multipliers -- 1 leader activates 50-500 members)
> **Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?
> **North Star:** Weekly Active Spaces

---

## Current State

### What Leaders Have Today

The current leader experience lives primarily in `space-settings.tsx` (1,950 lines -- the single largest component in the codebase). Leaders get:

**Working:**
- Space settings panel with name, description, visibility, membership type controls
- Role hierarchy: owner > admin > moderator > member (enforced server-side)
- Member management: view list, change roles, remove members
- Moderation: flag, hide, remove messages with audit trail
- Join request approval for private spaces
- Basic event CRUD with RSVP tracking
- Board management (create, reorder, delete)
- Automation CRUD (welcome messages, keyword triggers, scheduled posts) -- **stored but never execute**
- Social links (Instagram, Twitter, etc.)

**Broken or Missing:**
- **Zero analytics.** Leaders have no visibility into space health, growth trends, engagement metrics, or member activity. The API endpoint exists (`/api/tools/[toolId]/analytics`) but there's no UI.
- **Automation triggers never fire.** Leaders configure welcome sequences, keyword triggers, scheduled digests -- none execute. Cloud Functions scaffolded but not wired.
- **No announcement system.** Board type "announcements" exists in the schema but posting is identical to regular chat. No admin-only posting, no push notification on announcement, no read receipt.
- **No attendance tracking.** Events have RSVPs but no check-in, no post-event reports, no attendance history.
- **No member insights.** Leaders can see who's online now. They cannot see who's active this week, who's gone quiet, who just joined and never engaged, or what times their space is most active.
- **No recruitment tools.** No shareable invite links with tracking, no embeddable widgets, no QR codes for tabling events.
- **No transition tools.** When a leader graduates, ownership transfer is a manual Firestore edit. No succession planning, no role transition workflow, no institutional memory handoff.
- **Settings are a wall.** 1,950 lines in one component. No progressive disclosure, no quick-action shortcuts, no inline editing.

### What the Data Model Supports But the UI Doesn't

The Firestore schema and API layer have foundations that the frontend never exposes:

| Capability | Data Layer | Frontend |
|-----------|-----------|---------|
| Automation rules | Full CRUD, trigger types, conditions | Settings form only, never executes |
| Space analytics | `recentMessageCount`, `lastActivityAt`, `newMembers7d` | Not rendered anywhere |
| Member activity | `lastReadAt`, `joinedAt` per member | Not surfaced to leaders |
| Tool deployment | Full deploy/undeploy with capability governance | Basic sidebar list |
| Boards with types | `announcements`, `resources`, `custom` | All treated as identical chat channels |
| Join request messages | `message` field on join requests | Not displayed to approvers |

---

## The Opportunity

### Why Leaders Are the Multiplier

At UB, there are ~300 registered student organizations. Each has 1-5 leaders who control what platform their org uses. A single club president adopting HIVE brings 50-500 members overnight. These leaders are:

1. **Time-starved.** Running a club is a volunteer side gig on top of a full course load. They use whatever takes least effort.
2. **Tool-fatigued.** The average club leader manages GroupMe (chat), Google Forms (signups), Google Sheets (dues), Instagram (recruitment), email (university compliance). Five tools for one org.
3. **Accountability-bound.** University student affairs offices require attendance reports, financial records, and activity documentation for org recognition renewal.
4. **Legacy-anxious.** Leaders graduate every 1-2 years. They worry about the org surviving after them.
5. **Status-motivated.** Being a club leader is a resume line, a grad school talking point, a professional identity. They want proof of impact.

### The Wedge

The first painful moment with urgency and authority: **Student org recognition renewal.**

Every spring, universities require registered orgs to submit evidence of activity: meeting attendance, event count, member engagement, financial reports. Leaders currently compile this from five different tools into a Word document. This is a 3-5 hour task with a hard deadline that every club leader faces.

HIVE can generate this report automatically. One click. That's the wedge.

### The Lock-In Curve

The longer a leader uses HIVE, the more painful switching becomes:

| Month 1 | Months 2-3 | Months 4-6 | Year 1+ |
|---------|-----------|-----------|---------|
| Chat + events | Automations configured | Attendance history accumulated | Multi-year institutional data |
| Easy to leave | Annoying to reconfigure | Painful to reconstruct | Impossible to replicate |

Analytics history is the moat. A leader who has 6 months of engagement data, attendance records, and growth trends cannot get that from Discord. It only exists because the community lived on HIVE.

---

## Feature Ideas

### 1. Leader Dashboard ("Space Pulse")

**Problem:** Leaders have zero visibility into whether their space is healthy or dying. They check chat and guess. When a space slowly goes quiet, they don't notice until it's too late.

**Shape:** A dedicated dashboard tab in the space view (alongside Chat, Events, Members). Shows health score (0-100), sparkline charts for messages/day, active members/week, new joins, event attendance. Actionable recommendations below: "Post a conversation starter," "Your 3 newest members haven't said hello yet -- welcome them," "Your Wednesday meetings get 2x more RSVPs than Thursdays."

**Wedge:** This is the thing GroupMe/Discord literally cannot do. Chat platforms track messages but never surface patterns to leaders. The first time a leader sees "Your engagement dropped 40% after midterms -- here's what thriving spaces do," they're hooked.

**Impact:** High. Analytics create stickiness (historical data can't be exported to competitors) and drive better leader behavior (data-informed community management).

**Effort:** Medium. Most data already exists in Firestore (`recentMessageCount`, `newMembers7d`, `lastActivityAt`, per-member `lastReadAt`). Need: daily Cloud Function to compute metrics, 90-day history storage, frontend dashboard with sparklines (Recharts), recommendation engine (rules-based is fine for v1).

**Tradeoffs:**
- Computing daily metrics adds Cloud Function cost (~$5/mo at 300 spaces)
- 90 days of history per space = ~2.7MB/space in Firestore (manageable)
- Recommendation engine could feel generic if not calibrated to space type/size
- Leaders might fixate on vanity metrics (member count) over meaningful ones (messages per active member)

---

### 2. One-Tap Announcements

**Problem:** Leaders need to broadcast to all members -- meeting moved, event cancelled, important update. Currently they type in #general and hope people see it. No notification push, no read receipts, no "announcements" distinction from regular chat noise.

**Shape:** Announcement compose mode: leader taps the megaphone icon in the header, writes their message, optional "pin to top" and "notify all members" toggles. Announcement appears with distinct visual treatment (gold left border, megaphone icon, author highlighted). Push notification to all members who have notifications enabled. Read receipt counter visible to leaders ("42/68 members seen"). Announcements persist in a dedicated board or filter view.

**Wedge:** GroupMe has no announcement type -- every message is equal. Discord has @everyone but it's just a mention in a regular channel. Slack has channel-level notifications but no read receipts. HIVE's announcements with read receipt tracking is a genuine differentiation for leaders who need to know their message landed.

**Impact:** High. This is the #1 communication need for club leaders. When a meeting room changes 30 minutes before the meeting, the leader needs confidence that members saw the update.

**Effort:** Low-Medium. Board type "announcements" already exists in schema. Need: announcement compose mode (small UI), push notification trigger (needs `deliverNotification()` to be implemented), read receipt tracking (Firestore counter on announcement doc), distinct rendering in message feed.

**Tradeoffs:**
- Push notification infrastructure (`deliverNotification()`) is currently stubbed -- this feature depends on that P0 gap being resolved
- Over-announcing creates notification fatigue; need cooldown (max 3/day) or members will mute the space
- Read receipts could create pressure/surveillance feeling; make them leader-only, aggregate (not individual)
- Requires the announcements board to enforce admin-only posting

---

### 3. Smart Member Insights

**Problem:** Leaders don't know who their active core is, who's at risk of churning, or who their rising contributors are. They notice someone stopped coming to meetings but can't tell if that person also went silent online.

**Shape:** Member list enhanced with segments: "Active Core" (messaged in last 7 days), "Engaged" (visited in last 14 days), "Drifting" (no activity in 14-30 days), "At Risk" (no activity 30+ days), "New" (joined in last 7 days, hasn't engaged). Each segment is expandable with member cards showing last activity, message count, events attended, and a "nudge" button that pre-fills a DM. Top contributors section shows who's driving conversations.

**Wedge:** No competing platform segments members by engagement risk. Discord shows online status. Slack shows last active timestamp. Neither tells a leader "these 5 people are about to leave your community."

**Impact:** High. Member retention is the biggest challenge for student orgs. Early intervention (reaching out to drifting members) has outsized retention effects. This is also deeply sticky -- the engagement data only exists on HIVE.

**Effort:** Medium. Per-member `lastReadAt` and `joinedAt` already stored. Need: activity scoring computation (Cloud Function, weekly), segment classification logic, enhanced member list UI, "nudge" DM action.

**Tradeoffs:**
- Privacy concern: members might not want leaders to see their exact activity. Mitigate with aggregated segments, not per-message tracking.
- Segment thresholds (7/14/30 days) need tuning per space size. A 20-person study group has different norms than a 500-person org.
- "At Risk" framing could feel paternalistic. Alternative framing: "Haven't heard from recently" or "Might have missed recent activity."
- Computing per-member engagement scores adds Firestore reads on the member subcollection.

---

### 4. Attendance + Check-in System

**Problem:** Student org recognition requires attendance proof. Leaders currently use paper sign-in sheets, Google Forms, or manual head counts. This data never connects to their digital community -- the people in the room and the people in the chat are tracked in two separate universes.

**Shape:** For any event, leader can enable "Check-in." Members check in via: (a) QR code displayed at the event (opens HIVE, one-tap check-in), (b) NFC tap if venue supports it, (c) manual check-in from the member list. Check-in data flows to the event record, the member's profile, and the space analytics. Leaders get post-event summaries: "34 attended (68% of RSVPs), 5 walk-ins, average check-in time 6:02 PM." Export to CSV for university compliance.

**Wedge:** This is the most painful operational task for club leaders. The transition from paper sign-in to automatic digital check-in connected to member profiles is a "finally" moment. No competitor does this in the context of campus communities.

**Impact:** Very high. Solves the #1 compliance need (attendance records), connects physical and digital community activity, and creates lock-in through historical attendance data that can't be recreated.

**Effort:** Medium-High. Need: QR code generation per event, check-in API endpoint, check-in UI (mobile-optimized), attendance history storage (subcollection on events), post-event summary computation, CSV export. The QR code approach is simpler than geo-fencing or Bluetooth.

**Tradeoffs:**
- QR code requires leaders to display a screen at events (projector or phone). Fallback needed for low-tech meetings.
- Walk-in check-in without HIVE account creates edge case -- do you allow guest check-ins? Probably yes, with email capture.
- Attendance data is sensitive (FERPA considerations). Only leaders see aggregate; individual attendance visible only to the member themselves and space admins.
- Battery/connectivity concerns at event venues. QR flow must work with spotty signal (generate check-in token offline, sync later).

---

### 5. Org Recognition Report Generator

**Problem:** Every spring, universities require registered orgs to submit evidence of activity for recognition renewal. Leaders spend 3-5 hours compiling attendance, events, member counts, and activity summaries from multiple tools into a document. This has a hard deadline, affects org funding, and is universally dreaded.

**Shape:** One-click report generation. Leader selects date range (typically academic year), HIVE compiles: event count + attendance per event, member growth chart, active member percentage, message volume trend, top discussion topics (keyword analysis), tools created/used. Output: branded PDF with HIVE + university styling, or CSV for custom formatting. Optional: comparison to "organizations your size" benchmark.

**Wedge:** This is the strongest possible wedge for HIVE adoption. It solves a problem with: (a) a hard deadline (urgency), (b) sole authority in the leader (no committee approval needed to adopt), (c) immediate time savings (3-5 hours to 30 seconds), (d) quality improvement (data-driven report vs. anecdotal estimates). The leader who generates their first report will never go back to manual compilation.

**Impact:** Very high. This is a "why didn't this exist before" feature. It also creates a direct relationship with university administration (they see HIVE-branded reports, creating institutional awareness).

**Effort:** Medium. All underlying data already exists in Firestore. Need: report template (React-PDF or server-side PDF generation), data aggregation endpoint, date range selector UI, download flow. The hard part is designing a report that actually meets university compliance requirements (varies by school -- start with UB's specific format).

**Tradeoffs:**
- Report format needs to match what UB's Student Association actually requires. Must validate with real student affairs staff before building.
- PDF generation adds a dependency (React-PDF, Puppeteer, or external service). Cloud Function with Puppeteer is simplest.
- Historical data availability depends on when the org joined HIVE. First-semester orgs will have partial data. Handle gracefully: "Data available from [join date]."
- Comparative benchmarks could feel competitive rather than supportive. Frame as "context" not "ranking."

---

### 6. Automated Welcome Sequences

**Problem:** New members join a space and get... nothing. No greeting, no orientation, no suggested first actions. They see a chat feed they have no context for and often leave without engaging. Leaders know they should welcome new members but don't have time to individually greet every person.

**Shape:** Leader configures a sequence in space settings: Day 0 -- automatic welcome DM with space description + suggested first action ("Introduce yourself in #general"). Day 3 -- if member hasn't posted, nudge DM ("We noticed you haven't said hello yet -- [space name] is most active on Wednesdays"). Day 7 -- if member has posted, "engaged member" message with deeper info (upcoming events, tools, how to contribute). All messages are customizable templates. Leader sees sequence analytics: "72% of members who received the Day 3 nudge posted within 48 hours."

**Wedge:** Discord has no built-in welcome sequences (requires bots). GroupMe has nothing. Slack has Slackbot greetings but no multi-day sequences. For student orgs that lose 40-60% of new members in the first week, this is transformative.

**Impact:** High. Member activation (first message within 7 days) is the strongest predictor of long-term retention. Automating the welcome sequence is high-leverage for leaders with limited time.

**Effort:** Medium-High. Automation execution engine is currently P0 gap (triggers never fire). This feature depends on that being resolved. Once the engine works: welcome sequence template UI, DM delivery, engagement-conditional branching, sequence analytics. Store sequence state in member document (`welcomeSequenceStep`, `welcomeSequenceCompletedAt`).

**Tradeoffs:**
- Depends on automation execution engine (P0 blocker). Cannot ship independently.
- DMs from automations could feel spammy. Clear "This is an automated message from [Space]" disclosure + one-click opt-out required.
- Engagement-conditional logic (has member posted?) adds per-member query on each sequence step. At 500 members, this is 500 reads per step execution.
- Template customization UI adds complexity. v1 could ship with 3 preset sequences (casual, professional, academic) and free-text editing.

---

### 7. Shareable Invite Links with Analytics

**Problem:** Leaders recruit at tabling events, in classes, via social media -- but have no way to track which channels drive real joins. They share the space URL and have no idea if the 15 new members this week came from the Instagram post or the classroom visit.

**Shape:** Leader generates campaign invite links: `hive.ub.edu/join/coding-club?via=tabling-spring26`. Each link tracks clicks, unique visitors, conversions (joined), and source attribution. Dashboard shows: "Instagram bio link: 89 clicks, 23 joins. Spring tabling QR: 45 scans, 31 joins." Links can be one-time or persistent, with optional expiration. QR code auto-generated for each link (printable for flyers/posters).

**Wedge:** No competing platform offers attribution for campus recruitment. GroupMe invite links are anonymous. Discord invite links track uses but not source. Knowing that tabling converts at 3x the rate of Instagram changes how leaders allocate their limited recruitment time.

**Impact:** Medium-High. Recruitment is a seasonal but critical activity. Attribution data is valuable for org leadership planning and compelling for university reporting ("We used data-driven recruitment strategies").

**Effort:** Medium. Need: invite link generation with campaign parameter, click/conversion tracking (Firestore counter), campaign dashboard UI, QR code generation (client-side library, ~2KB). The tracking is a lightweight analytics system on top of existing join flow.

**Tradeoffs:**
- UTM-style tracking parameters in URLs can look messy. Use slug-based identifiers instead.
- Campaign data is low-volume (orgs recruit a few times per semester). Over-engineering the analytics would be waste. Simple counters are sufficient.
- QR code needs to be large enough to scan reliably (minimum 2cm). Generate at 300 DPI for print.
- Privacy: don't track individual user source, only aggregate per-campaign counts.

---

### 8. Leadership Transition ("Succession Mode")

**Problem:** Student org leaders graduate. When they leave, institutional knowledge leaves with them. Automation configurations, event templates, member context, communication norms -- all lost. The new leader starts from scratch on a platform they may not even know how to use.

**Shape:** "Succession Mode" activated by current owner. Creates a transition period (30-60 days) where: (a) new leader is elevated to co-owner with all permissions, (b) guided tour of all space configurations (automations, settings, tools, boards), (c) "Leader Playbook" auto-generated from space data (best posting times, most engaged members, typical event formats, automation recipes), (d) ownership officially transfers at end of transition period, (e) outgoing leader can optionally retain "Founding Member" or "Alumni Leader" badge. All configured automations, templates, and analytics history persist.

**Wedge:** This is the existential problem for student orgs. The average club loses 30-50% of institutional knowledge at each leadership transition. HIVE can be the institutional memory that survives graduation. No competitor offers structured leadership transition.

**Impact:** Very high for retention. If HIVE becomes "where the org's history lives," it survives individual leaders leaving. This is the strongest long-term lock-in mechanism: the platform holds the institutional memory.

**Effort:** High. Need: co-owner permission system (minor -- role system already supports this), transition period state machine, Leader Playbook generation (analytics summary + configuration export), guided tour for incoming leader, ownership transfer ceremony/confirmation, alumni badge system. The playbook generation is the hardest part.

**Tradeoffs:**
- Transition periods create dual-authority situations. Clear permissions during transition: both can configure, only original owner can cancel transition.
- Leader Playbook quality depends on space having enough data. New spaces (< 1 semester) won't generate useful playbooks.
- Alumni access post-graduation is a question: can graduated leaders still view the space? Read-only alumni role could work.
- This is a once-per-year feature per space. High effort for low frequency. But the impact on retention is outsized because it prevents the most common failure mode.

---

### 9. Dues & Payments Tracking

**Problem:** Most student orgs collect dues ($10-50/semester). Leaders track this in spreadsheets, Venmo request lists, or pure memory. They can't cross-reference who's paid with who's active, and they can't gate features/events to paid members.

**Shape:** Dues management tool in space settings. Leader sets amount and due date. Member status: Paid / Unpaid / Exempt / Overdue. Integration with Venmo/Zelle (deep link to payment, not processing) -- member taps "Pay dues," gets sent to leader's Venmo with pre-filled amount and memo. Leader confirms payment manually (or auto-confirms via Venmo webhook if available). Paid status unlocks optional perks: access to exclusive boards, voting eligibility in polls, priority RSVP for limited-capacity events.

**Wedge:** Dues tracking in spreadsheets is universally painful. The cross-reference with membership status (who's paid AND active) is data that only exists if both live on the same platform. HiveLab already has a Dues Tracker template -- this elevates it to a first-class space feature.

**Impact:** Medium-High. Not all orgs collect dues, but those that do (fraternities/sororities, professional orgs, honor societies) are the most organized and the most valuable anchor tenants. Dues-gating creates real incentive for members to maintain paid status.

**Effort:** Medium. HiveLab Dues Tracker template exists with counter + collection state. Need: first-class integration into space settings (not just a tool), payment deep links (Venmo/Zelle URL scheme), manual confirmation UI, paid/unpaid member filter, optional board access gating.

**Tradeoffs:**
- HIVE should NOT process payments directly. Regulatory complexity (PCI, money transmitter licenses) is not worth it. Deep links to existing payment platforms are sufficient.
- Manual payment confirmation creates work for leaders. Auto-confirm via Venmo API would be better but adds dependency on third-party API access.
- Dues-gating features (exclusive boards, voting) could feel exclusionary. Must be optional per-space, and the gated features must be clearly secondary to the core experience.
- Payment disputes become HIVE's problem if we're the record system. Clear disclaimer: "HIVE tracks payment status, not payments themselves."

---

### 10. Scheduled & Recurring Events

**Problem:** Club meetings happen weekly. Leaders create the same event every week -- same title, same time, same location. It's tedious and error-prone (forget one week, members don't know if there's a meeting).

**Shape:** Recurring event creation: leader sets recurrence (weekly on Tuesdays, biweekly, monthly first Wednesday). Individual occurrences can be edited ("This week's meeting is in a different room") or cancelled ("No meeting during finals week") without affecting the series. RSVP resets per occurrence but members get a "RSVP for this week?" prompt. Recurring events show as a series in the events view with a repeating icon. Leaders can edit the template to change all future occurrences.

**Wedge:** Google Calendar has recurring events but no RSVP, no community context, no attendance tracking. Discord has no event recurrence. GroupMe has no events at all. Recurring events with per-occurrence RSVP and attendance tracking is the full stack that campus orgs need.

**Impact:** Medium. Saves 5-10 minutes per event creation, but the real value is consistency: members always know when the next meeting is without the leader having to announce it every week.

**Effort:** Medium. Event schema already has RSVP support. Need: recurrence rule (RRULE) storage on event, instance generation (Cloud Function creates next 4-8 weeks), per-instance edit/cancel UI, series vs. instance edit choice, RSVP prompt for upcoming instance.

**Tradeoffs:**
- RRULE parsing is well-solved (rrule.js library). Don't reinvent.
- Instance generation horizon: too far ahead (30 instances) wastes storage; too few (2 weeks) requires frequent generation. 30 days ahead is the sweet spot.
- Editing "this and all future" vs "just this one" is the classic calendar UX challenge. Follow Google Calendar's 3-option pattern: "This event," "This and following events," "All events."
- Cancelled instances must still render (with "Cancelled" label) to avoid member confusion.

---

### 11. Moderation Queue with AI Assist

**Problem:** Active spaces generate hundreds of messages per day. Leaders can't read everything. Inappropriate content, spam, or off-topic messages go unnoticed until someone reports them. Current moderation is fully reactive (flag > review > action).

**Shape:** Proactive moderation queue: AI scans messages for potential issues (toxicity, spam patterns, PII exposure, off-topic content). Flagged messages appear in a "Needs Review" queue accessible to admins. Each item shows: the message, the flag reason, a suggested action (remove / warn / ignore), and one-tap action buttons. Leaders can set sensitivity levels per category. Moderation actions are logged for transparency ("Admin removed a message for: spam"). Optional: auto-hide messages above toxicity threshold with "message hidden pending review" placeholder visible to other members.

**Wedge:** Discord has AutoMod but it's regex-based and requires technical setup. Slack has no built-in moderation. GroupMe has none. AI-assisted moderation that requires zero configuration and adapts to the space's norms is a genuine differentiator.

**Impact:** Medium. Most campus spaces are low-toxicity, but the consequences of unmoderated content in a campus context (Title IX, harassment policies) are severe. This is more risk-mitigation than daily value.

**Effort:** High. Need: message scanning pipeline (Cloud Function triggered on message create), toxicity model (Perspective API or Claude API), flagging system with configurable thresholds, moderation queue UI, action logging, auto-hide option. XSS scanning already exists via SecurityScanner -- this extends that pattern.

**Tradeoffs:**
- AI moderation has false positives. Overzealous flagging in a campus context (flagging academic discussion of sensitive topics) creates distrust. Must default to conservative thresholds with easy "this is fine" dismissal.
- Cost: Perspective API is free for moderate volume. Claude API for nuanced moderation is ~$0.01/message at current pricing -- too expensive for all messages. Use cheap first-pass filter (regex + Perspective) with Claude for ambiguous cases only.
- Transparency: members should know moderation is AI-assisted. "Messages in this space are monitored for community safety" disclosure required.
- Cultural calibration: what's acceptable varies by org type (professional vs. social). Per-space sensitivity settings are critical.

---

### 12. Space Activity Digest

**Problem:** Members who don't check HIVE daily miss important updates, events, and conversations. Leaders can't manually summarize what happened. Inactive members have no reason to return because they don't know what they're missing.

**Shape:** Weekly digest email (opt-in per space). Sent Monday mornings. Contains: top 3 most-reacted messages of the week, upcoming events with RSVP counts, new members who joined, leader announcements, and a "Your space at a glance" stats section. Deep links to each item. Leaders can add a "note from leadership" to the next digest. Digest also surfaces as an in-app card on Home for members who haven't visited in 7+ days.

**Wedge:** Email digests are a retention mechanism that works because they meet users where they already are (inbox). Discord and GroupMe have no email digests. Slack has channel summaries but not weekly digests with editorial framing. The "note from leadership" turns the digest into a curated newsletter without requiring the leader to set up a newsletter tool.

**Impact:** Medium-High. Email re-engagement is proven at scale (Substack, LinkedIn, Twitter all use it). For spaces with 50%+ weekly inactive members, this is the primary re-engagement channel.

**Effort:** Medium-High. Need: email digest template (React Email or MJML), weekly digest Cloud Function, content selection algorithm (most-reacted, most-replied), "note from leadership" compose UI, email delivery via SendGrid (already a dependency, though not configured), per-space opt-in/opt-out, in-app digest card.

**Tradeoffs:**
- SendGrid is listed as a dependency but not configured. Email delivery infrastructure is a prerequisite.
- Digest quality depends on space activity. Empty digest ("Nothing happened this week") is worse than no digest. Skip for inactive spaces.
- Email deliverability is a real concern. HIVE needs proper SPF/DKIM/DMARC setup. University email systems are aggressive spam filters.
- "Note from leadership" could be abused for spam. Limit to 280 characters, once per digest, admin-only.

---

### 13. Roles & Permissions Builder

**Problem:** The current role system is a fixed hierarchy (owner > admin > moderator > member). Real orgs have nuanced roles: Treasurer (can manage dues but not moderate), Events Chair (can create events but not manage members), Social Media Manager (can post announcements but not change settings). Leaders can't map their real org structure to HIVE's roles.

**Shape:** Custom roles with granular permissions. Leader creates roles with names matching their org structure. Each role gets a permission matrix: manage members, create events, post announcements, manage boards, configure automations, view analytics, moderate messages, manage dues. Default roles (admin, moderator) preserved as presets. Roles displayed as colored badges in member list and chat.

**Wedge:** Discord has custom roles with granular permissions -- it's one of Discord's strongest features. But Discord's permission system is complex (channel-level overrides, role hierarchy, dozens of toggles). HIVE can offer 80% of the power with 20% of the complexity by limiting to space-level permissions (no per-board overrides in v1) and using plain language ("Can create events" not "MANAGE_EVENTS").

**Impact:** Medium. Important for larger orgs (50+ members) with real org charts. Smaller spaces (5-20 members) don't need this. But larger orgs are higher-value anchors.

**Effort:** Medium-High. Role system already supports 4 fixed roles with permissions. Need: custom role CRUD, permission matrix UI, permission checking middleware update (currently checks role name, needs to check permissions), colored role badges, role assignment UI.

**Tradeoffs:**
- Permission complexity is a UX trap. Discord's 40+ permission toggles confuse most server owners. HIVE should cap at 10-12 permissions, grouped by function (Community, Events, Moderation, Settings).
- Custom roles interact with existing role hierarchy. How does a "Treasurer" role compare to "moderator"? Probably: custom roles have explicit permissions, preset roles have implied permissions. No hierarchy between custom roles.
- Migration: existing spaces with admin/moderator assignments need to keep working. Custom roles are additive, not a replacement.

---

### 14. Leader Leaderboard ("HIVE Score")

**Problem:** Leaders have no external validation for their community management work. They can't prove to university administrators, employers, or grad school admissions that they built and sustained a thriving community.

**Shape:** "HIVE Score" for spaces: a composite metric of member growth, engagement rate, event frequency, member retention, and tool adoption. Displayed on the space's public profile. Leaders can share their score on LinkedIn/resume (embeddable badge). Campus-wide leaderboard (opt-in) shows top spaces by HIVE Score. Monthly "Most Improved" and "Most Active" recognition. Leaders who sustain high scores earn "Certified Community Leader" credential.

**Wedge:** No platform provides a portable, verifiable community management credential. LinkedIn endorsements are meaningless. HIVE Score is backed by real data: "I grew a community from 20 to 200 members with 65% weekly engagement over 8 months." That's a concrete resume line.

**Impact:** Medium. Directly addresses the status motivation of leaders. The campus leaderboard creates healthy competition between orgs. The credential creates long-term brand association (alumni carry HIVE credential into career).

**Effort:** Medium. Need: score computation (weighted formula across existing metrics), public space profile enhancement, embeddable badge generator, campus leaderboard page, monthly recognition system, credential issuance. Most complex part is the scoring formula -- it must resist gaming.

**Tradeoffs:**
- Gaming risk: leaders could artificially inflate metrics (bulk invites, message spam). Score must weight quality over quantity: messages per active member > total messages, retention rate > join count.
- Leaderboard creates winners and losers. Some orgs will feel demoralized by low scores. Mitigation: scores are per-category (Best Newcomer Experience, Most Active Events, Highest Retention), so every org can find their strength.
- "Certified Community Leader" credential has no institutional backing. It's a HIVE-issued badge. Meaningful only if employers/universities recognize it. Start with university partnerships.
- Opt-in leaderboard is critical. Some orgs (support groups, religious orgs) don't want public performance metrics.

---

### 15. Multi-Space Admin View

**Problem:** Leaders who manage multiple spaces (e.g., president of CS Club and VP of Hackathon Committee) currently switch between spaces to manage each one. No unified view of all their spaces' health, pending actions, or upcoming events.

**Shape:** "My Spaces" dashboard for leaders showing all spaces they admin/own in one view. Each space card shows: health score trend, pending join requests count, upcoming events count, unread messages in admin-relevant boards, and any system alerts ("Automation failed," "Member reported content"). Quick actions: approve pending requests, view analytics, post announcement -- without navigating to each space individually. Notification settings: "Alert me when any of my spaces drops below [health threshold]."

**Wedge:** Leaders of multiple orgs are the highest-value users on campus. They're also the busiest. A unified admin view that saves 5-10 minutes of context-switching per session creates disproportionate loyalty.

**Impact:** Medium. Affects a smaller segment (leaders of 2+ spaces) but this segment has outsized influence. These are the campus connectors who recommend tools to other leaders.

**Effort:** Medium. Need: leader spaces aggregation endpoint, multi-space dashboard page (`/admin` or `/my-spaces`), cross-space notification aggregation, quick-action APIs (approve request, post announcement from multi-space view).

**Tradeoffs:**
- Cross-space views complicate the existing per-space permission model. Each action must still check per-space permissions.
- Information density challenge: 5 spaces with 4 metrics each is 20 data points on one screen. Need progressive disclosure (collapsed by default, expand on demand).
- URL routing: `/admin` feels like a different product. `/my-spaces` or integrating into existing Home page is more natural.
- This is a power-user feature that most users will never see. Don't let it complicate the primary navigation.

---

## Quick Wins (Ship in Days)

These require minimal new infrastructure and deliver immediate leader value.

1. **Space health badge on explore cards.** Already have `recentMessageCount`, `lastActivityAt`, `newMembers7d`. Compute health status (Thriving / Warm / Quiet / Hibernating) and show badge. 2-3 hours of work. Makes leaders of active spaces proud; helps prospective members evaluate.

2. **Member join notifications for leaders.** System message in chat when someone joins: "[Name] just joined [Space]!" Currently no notification fires. Wire the existing notification service to trigger on member creation. Half a day.

3. **Pending join request count in header.** Join requests exist but leaders must navigate to settings to see them. Add a badge count on the space header. 2 hours.

4. **Export member list to CSV.** Leaders need member rosters for university compliance. Current member list has no export. Add download button, iterate members subcollection, format CSV (name, email, join date, role, last active). Half a day.

5. **"Pin message" action for leaders.** Messages can be flagged but not pinned. Add `isPinned` boolean to message schema, pin/unpin action for admin+ roles, pinned messages section at top of chat or in a dedicated "Pinned" filter. 1 day.

6. **Quick settings from header.** Space header shows space name and online count. Add a dropdown with "Settings," "Analytics," "Members," "Invite" links for leaders. Reduces clicks to common admin actions from 3 to 1.

---

## Medium Bets (Ship in Weeks)

7. **Leader Dashboard (Feature #1).** 2-3 weeks. Analytics compute + history storage + dashboard UI + recommendation engine. Highest-ROI medium bet because analytics create lock-in.

8. **One-Tap Announcements (Feature #2).** 1-2 weeks (depends on notification delivery). Distinct announcement rendering + compose mode + read receipt tracking.

9. **Shareable Invite Links (Feature #7).** 1-2 weeks. Campaign link generation + tracking + QR codes + mini-dashboard. Self-contained feature, no dependencies on other gaps.

10. **Scheduled & Recurring Events (Feature #10).** 2-3 weeks. RRULE storage + instance generation + per-instance editing + series management UI.

11. **Smart Member Insights (Feature #3).** 2-3 weeks. Activity scoring + segment classification + enhanced member list UI + nudge actions.

---

## Moonshots (Ship in Months+)

12. **Org Recognition Report Generator (Feature #5).** Requires mature analytics, attendance system, and PDF generation pipeline. 2-3 months. But potentially the single most compelling adoption driver.

13. **Leadership Transition (Feature #8).** Requires co-owner permissions, playbook generation, guided tour, and alumni role system. 2-3 months. Solves the existential problem of student org continuity.

14. **AI Moderation Queue (Feature #11).** Requires message scanning pipeline, toxicity model integration, queue UI, and per-space calibration. 2-3 months. Risk mitigation feature.

15. **Custom Roles & Permissions (Feature #13).** Requires permission matrix, middleware updates, role CRUD, and migration of existing roles. 6-8 weeks. Unlocks larger org adoption.

16. **Attendance + Check-in System (Feature #4).** Requires QR code generation, check-in API, mobile-optimized flow, and post-event analytics. 6-8 weeks. Strongest physical-digital bridge.

---

## Competitive Analysis

### Discord

**What Discord gives leaders:**
- Custom roles with granular permissions (40+ toggles, per-channel overrides)
- AutoMod with regex rules and AI-powered filters
- Audit log (who did what, when)
- Server insights (member join/leave, message volume, active users)
- Boost perks (custom emoji, higher upload limits)
- Onboarding flow (membership screening, rules acceptance, role selection)
- Slash commands and bot ecosystem (MEE6, Carl-bot for moderation)

**What Discord fails at:**
- No events system (recently added, still basic)
- No attendance tracking or physical-event integration
- No university compliance features
- Analytics are shallow (counts, not insights)
- No structured leadership transition
- Bot ecosystem requires technical setup (most club leaders can't configure MEE6)
- No campus-aware identity (anyone can join any server)

**HIVE's structural advantage over Discord:**
Discord is designed for gaming communities. Campus identity (verified email, major, year, class standing) is impossible for Discord to add without fundamentally changing their anonymous-by-default model. Discord's investors would reject mandatory identity verification because it would shrink their addressable market.

### Slack

**What Slack gives leaders:**
- Channel management (topic, purpose, archival)
- Workflow Builder (no-code automations)
- Analytics (message/member stats, Pro+ only)
- App integrations (3,000+ apps)
- Search with filters
- Scheduled messages
- Canvas (collaborative docs within channels)

**What Slack fails at:**
- No free tier for large groups (500 member limit removed, but 90-day message history on free)
- No events or RSVP
- No member engagement segmentation
- No attendance tracking
- No campus awareness
- Pricing model ($7.25/user/month) is prohibitive for student orgs
- Enterprise-oriented UX (too complex for casual campus use)

**HIVE's structural advantage over Slack:**
Slack's business model requires per-seat pricing for advanced features. They cannot offer analytics, automations, or full message history for free because that would cannibalize their paid tiers. HIVE, targeting campuses specifically, can offer these features because the monetization model is different (institutional licensing, not per-seat).

### CampusGroups / OrgSync / Presence

**What they give leaders:**
- University-integrated org management (official recognition, roster management)
- Event creation with university calendar integration
- Form builder for applications, surveys
- Budget tracking and financial reporting
- Document management (constitutions, bylaws)
- Attendance tracking (basic -- sign-in sheets)
- Compliance reporting (org recognition renewals)
- Communication tools (email blasts, announcements)

**What they fail at:**
- Zero social/community features (no chat, no presence, no belonging)
- UX from 2010 (form-heavy, no real-time, no mobile-first)
- No member engagement analytics (counts only)
- No automation capability
- Students hate using them (forced by administration, not chosen)
- No tool-building capability
- Update cycles measured in years, not weeks

**HIVE's structural advantage over CampusGroups:**
CampusGroups is sold to administrators, not students. Their product decisions optimize for admin compliance, not student engagement. They structurally cannot build a product students want to use because their buyer is the university, and the university's priorities (compliance, reporting, risk management) conflict with student priorities (community, belonging, low friction). HIVE, by contrast, is built for students first -- and can add the compliance features leaders need without sacrificing the experience members want.

### GroupMe

**What GroupMe gives leaders:**
- Free group messaging (no member limits)
- Polls (basic)
- Calendar (basic event sharing)
- Likes on messages

**What GroupMe fails at:**
- No roles or permissions (everyone is equal)
- No moderation tools
- No analytics whatsoever
- No events with RSVP
- No boards/channels (one chat stream per group)
- No automation
- No presence indicators
- No file organization
- GroupMe is owned by Microsoft but effectively abandoned (last major update: 2021)

**HIVE's structural advantage over GroupMe:**
GroupMe is a product in maintenance mode. Microsoft acquired it and stopped investing. It persists on campuses purely through inertia -- every incoming class inherits GroupMe groups from the previous class. HIVE doesn't need to be 10x better than GroupMe; it needs to be meaningfully better at the moment a leader decides to try something new. The wedge is any single feature GroupMe doesn't have: events with RSVP, multiple boards, or analytics. Once a leader moves one function to HIVE, the consolidation pull (why use two platforms?) brings the rest.

---

## Wedge Opportunities

### Wedge 1: "Your Org Report, One Click" (Recognition Renewal)

**Entry point:** March-April, when org recognition renewal deadlines hit. Target: student affairs office partnership. HIVE generates the report, university admin sees HIVE branding, creates institutional awareness.

**Sequence:** University partnership -> pre-loaded org data -> leader claims space -> semester of usage -> one-click report -> leader tells other leaders -> organic spread.

### Wedge 2: "Welcome to [Org Name]" (New Member Season)

**Entry point:** August-September, when 5,000+ freshmen join organizations at club fairs. Target: club fair tabling. Leaders generate QR codes on HIVE, scan-to-join at the table, welcome sequence activates immediately.

**Sequence:** Club fair QR code -> instant join -> welcome DM within seconds -> "this is better than GroupMe" moment -> member tells friends -> organic spread.

### Wedge 3: "Who Actually Came?" (Post-Event Truth)

**Entry point:** After any event where attendance matters (general body meetings, workshops, speaker events). Target: leaders who need attendance for university reporting.

**Sequence:** Leader creates event on HIVE -> QR check-in at event -> instant attendance report -> realization that HIVE replaces paper sign-in -> leader moves all events to HIVE -> members join for events -> stay for community.

### Wedge 4: "Your Exec Board, One Place" (Leadership Coordination)

**Entry point:** Beginning of semester when new exec boards form. Target: incoming leadership teams who are deciding what tools to use.

**Sequence:** New president claims space -> adds exec board as admins -> configures boards (#leadership-private, #general, #events) -> assigns roles matching org structure -> org starts semester on HIVE -> members follow leaders.

---

## Open Questions

1. **Should HIVE have a dedicated "Admin" mode, or should leader tools be inline?** Discord uses a separate server settings page. Slack uses channel settings inline. Linear integrates admin into the same view with progressive disclosure. Inline reduces context-switching but can clutter the member experience.

2. **How much analytics data should be visible to non-leaders?** If members can see "this space had 200 messages this week," it's social proof. If they can see per-member activity, it's surveillance. Where's the line?

3. **Should automations be free or gated?** Automations drive significant value for leaders and create strong lock-in. Making them free maximizes adoption. Gating them (3 automations free, unlimited paid) creates a natural upgrade path. This decision shapes the long-term business model.

4. **How do we handle multi-campus org chapters?** UB's chapter of a national org (Society of Women Engineers, NSBE) might want to share templates, event formats, or even cross-campus chat. But campus isolation is an invariant. Is there a "federated" model that preserves isolation while enabling shared resources?

5. **Should leaders be able to see who read their announcements individually, or only aggregate counts?** Individual read receipts are powerful for leaders but feel invasive for members. Aggregate ("42 of 68 seen") might be sufficient. This is a values decision, not a technical one.

6. **What happens to a space's data when the university contract ends?** If HIVE loses the UB contract, can leaders export their analytics history, member data, and event records? Data portability is both a user right and a competitive necessity (leaders won't commit to a platform they can't leave).

7. **How do we prevent HIVE Score gaming?** Any composite metric will be gamed. Leaders could spam messages, create fake events, or invite inactive accounts. The scoring formula needs to be resistant to artificial inflation while rewarding genuine community health. Possible approach: weight retention and per-member engagement higher than raw counts.

8. **Should HIVE integrate with university LMS (Blackboard, Canvas)?** If a course has a HIVE space, could assignments, grades, or announcements flow between systems? This opens a massive adjacent market (academic communities, not just extracurricular) but risks scope creep and institutional sales complexity.
