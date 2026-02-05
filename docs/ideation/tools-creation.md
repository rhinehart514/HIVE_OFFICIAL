# Tools & Creation (HiveLab)

> Dimension: What students and leaders can build. Polls, forms, signups, trackers, dashboards, voting, budgets, project boards. The element library, templates, automation triggers, AI-assisted creation.
> North Star: Weekly Active Spaces.
> Decision Filter: "Does this help a student find their people, join something real, and come back tomorrow?"

---

## Current State

HiveLab is 70% infrastructure, 100% builder UI. The canvas IDE exists and is polished. The bones are real — 32 composable elements, 41 API routes, 30 templates, a drag-drop canvas with snap-to-grid, undo/redo, and real-time preview. Action execution works end-to-end: votes count, RSVPs track, forms submit, counters increment. The data model is clean — shared state (aggregate) vs. user state (personal) is properly separated. Deployment to spaces works. Rate limiting is enforced. Capability governance (safe/elevated/admin lanes) is in place.

What does NOT work:

- **Automations never fire.** The entire CRUD layer exists. Triggers are stored. The runner service is written. Cloud Functions are scaffolded. But the event bus that connects "someone voted" to "send a reminder" does not exist. Automations are a promise with no delivery.
- **Connections don't propagate.** Tool-to-tool data flow is defined but manual-only. A dues tracker "paid members" list does not flow into a voting eligibility tool. The value prop of composable tools is theoretical.
- **AI generation is keyword matching.** The UI says "AI-powered." The backend does `if (prompt.includes('poll')) return pollTemplate`. There is no LLM composition, no multi-element inference, no iterative refinement.
- **No template versioning.** Templates deployed without version lock. If a template definition changes, tools using it can silently corrupt.
- **Setups system has zero UI.** Multi-tool orchestration API routes exist, but there are no frontend pages.
- **No analytics UI.** The API returns usage data. No page renders it. Tool creators are flying blind.
- **No reviews UI.** The API accepts reviews. No user can see them.
- **Tool notifications are stubbed.** `notifyAffectedUsers()` is a function that does nothing. Space members never learn a poll closed or results are in.
- **Creator attribution missing.** ToolCard.tsx shows zero author info. Builders get no credit.

The system is a car with a beautifully upholstered interior, a working steering wheel, and no engine.

---

## The Opportunity

HiveLab is the only feature that makes HIVE irreplaceable. Chat exists elsewhere. Discovery exists elsewhere. Profiles exist elsewhere. But a tool builder that knows your campus identity, lives inside your community, deploys in 60 seconds, and lets non-technical leaders automate their admin work — that does not exist.

The opportunity breaks into three layers:

**Layer 1: Time Collapse.** Club leaders spend 2-5 hours/week on admin tasks that tools can eliminate. Meeting polls (20 GroupMe messages vs. 5 taps). Event RSVPs (Google Form + spreadsheet + manual count vs. live RSVP tool). Dues tracking (Venmo requests + spreadsheet vs. auto-tracker). Attendance (paper sign-in + data entry vs. check-in tool). Every hour saved is an hour where the leader thinks about HIVE instead of thinking about switching away from HIVE.

**Layer 2: Workflow Lock-In.** Templates, automations, tool state history, and member interaction data accumulate over a semester. A leader who has set up 5 tools with 3 automations and 200 member interactions is not switching to Google Forms in November. The switching cost grows linearly with usage, and it grows silently — they do not notice they are locked in until they try to leave.

**Layer 3: Distribution Engine.** Tools generate artifacts that leave the platform. A poll shared in a GroupMe. An RSVP link texted to a freshman. A leaderboard screenshot posted on Instagram. Every tool interaction is a potential acquisition event, and the tool's output naturally contains "Built on HIVE" attribution.

The sequence matters: ship Time Collapse (tools that save real hours), which creates Workflow Lock-In (state that would be painful to abandon), which generates Distribution (artifacts that bring new users in). Each layer feeds the next.

---

## Feature Ideas

### 1. One-Tap Deploy from Template

**Problem:** Today, deploying a common tool requires entering the IDE, configuring elements, selecting a space, and clicking deploy. For a simple poll, this is absurd. The average club leader will not learn an IDE to create a poll.

**Shape:** Template cards in the Lab dashboard and inside Spaces get an inline configuration panel. Select a template (e.g., "Quick Poll"), fill 2-3 fields (question, options, duration), pick a space from a dropdown, hit "Deploy." Three taps. No IDE. Success toast with "View in space" link. Power users still access the full IDE via "Customize in Lab" link.

On mobile, the configuration appears as a bottom sheet. Templates are sorted by popularity within the leader's space category (Greek life sees event templates first, academic clubs see study group templates first).

**Wedge:** The club president who was just told by their advisor to "run a poll for next week's meeting location" and needs it done in 2 minutes, not 20.

**Impact:** Removes the primary adoption barrier for non-technical leaders. Changes HiveLab from "a thing for builders" to "a thing for everyone who runs a club."

**Effort:** Small. Template card component + inline config form + direct deploy API call. The deploy infrastructure already works. This is a UI-only change.

**Tradeoffs:** Bifurcates the creation experience. Two mental models (quick deploy vs. IDE). Risk of the IDE feeling like a "power user ghetto" that most leaders never discover. Mitigate by showing "Customize this tool" link on every deployed-from-template tool.

---

### 2. AI Tool Generation (Real LLM, Not Keyword Match)

**Problem:** The current "AI" generation is string matching. A leader types "I need a way to track who paid dues and show a leaderboard of participation" and gets... nothing useful. The promise of "describe what you need, get a working tool" is the core HiveLab pitch. Without real AI, that pitch is a lie.

**Shape:** Integrate Claude API (or similar) with a tool-generation system prompt that knows the 32 available elements, their config schemas, and connection types. User describes a need in natural language. The system generates a multi-element composition with connections, positions elements on the canvas using a layout algorithm, and streams elements appearing in real-time. Follow-up refinement works: "make the poll anonymous," "add a countdown," "remove the leaderboard."

Fall back to rules-based matching for common one-element tools (poll, countdown, RSVP) to save API costs. Only invoke the LLM for compositions that require multiple elements or novel configurations.

**Wedge:** The leader who types "I need something for our officer election next week where members vote, we see results live, and it automatically announces the winner" and gets a working election tool in 30 seconds.

**Impact:** This is the "Figma meets Cursor" promise delivered. Makes HiveLab feel like magic. Creates a viral demo moment ("watch me build a tool by just describing it").

**Effort:** Medium-large. LLM integration, system prompt engineering, element composition inference, layout algorithm, streaming UI, iterative refinement loop. The underlying elements and actions already work — this is about intelligent assembly.

**Tradeoffs:** LLM costs per generation (~$0.02-0.10 per prompt). Hallucination risk (generating element configs that don't match schemas). Latency (2-5 seconds for generation). Rate limit needed (20/hour/user to prevent abuse). Quality inconsistency — some prompts will produce great tools, others will miss the mark. Needs graceful degradation when AI produces garbage.

---

### 3. Automation Execution Engine

**Problem:** The entire automation system is a facade. Leaders can create automations through the UI, configure triggers and actions, and save them. Then nothing happens. Ever. "When someone RSVPs, send a reminder email 24 hours before the event" is a use case that would make leaders say "I can't go back to Google Forms." But it does not work.

**Shape:** Three trigger types need wiring:
- **Event triggers:** After `executeAction()` completes, evaluate matching automations. When someone votes, the system checks "does any automation trigger on vote events?" and fires if yes.
- **Schedule triggers:** Cloud Scheduler calls `runScheduledAutomations` on a cron. Automations with schedule triggers (e.g., "every Monday at 9am") execute their action chain.
- **Threshold triggers:** Firestore trigger on `sharedState` change. When a counter crosses a threshold (e.g., "votes > 50"), fire the automation.

Action executors need real implementations: `sendEmail` via Resend/SendGrid, `notifyInApp` via Firestore notification doc creation, `mutateState` via Firestore update, `triggerTool` via internal API call. Push notifications (`sendPush`) can wait — email + in-app covers 90% of use cases at launch.

**Wedge:** The event coordinator who needs "send attendees a reminder email 24 hours before" and currently does it by hand, every single time. Or the treasurer who needs "when dues received count hits 30, post an announcement to the space."

**Impact:** Automations are the single feature that converts HiveLab from "a poll maker" into "a workflow engine." This is the moat feature. Google Forms cannot do this without Zapier, which costs money and requires technical setup.

**Effort:** Medium. The runner service, type system, and CRUD all exist. The work is: wire event evaluation after action execution, implement email sending (Resend is ~20 lines), implement in-app notification creation, verify Cloud Scheduler connectivity, and build a run history UI.

**Tradeoffs:** Runaway automation risk. Infinite trigger loops (A triggers B triggers A). Mitigated by existing limits (max 5 chained triggers, 100 runs/day, 60s cooldown). Email delivery reputation risk at scale — need proper SPF/DKIM setup. Operational burden: someone needs to monitor failed automations and delivery rates.

---

### 4. Tool Embedding in Chat

**Problem:** Tools live in the sidebar. Chat lives in the main panel. Members must navigate to see and interact with tools. This friction means most members never use deployed tools — they see chat, they chat, they leave. The tools sit unused.

**Shape:** `/poll` command in chat creates an inline poll embed. The poll renders directly in the message stream. Members vote without leaving the conversation. Results update in real-time within the embed. When the poll closes, the embed collapses to show final results.

Extend to other tool types: `/rsvp Friday Game Night` creates an inline RSVP. `/countdown Finals Week` creates an inline countdown. `/signup Study Group (max 5)` creates a capacity-limited signup.

The embedded tool is a lightweight renderer of the full tool's shared state. Interactions in the embed update the full tool's state, and vice versa.

**Shape details:** Slash commands detected in the chat composer. Autocomplete dropdown shows available tool types. Tool preview appears before sending. After send, the message contains a tool embed that all members can interact with. On mobile, tool embeds are full-width within the message stream.

**Wedge:** The club president who wants to run a quick poll during a live chat discussion without telling everyone "go to the sidebar and find the poll tool."

**Impact:** Dramatically increases tool usage by putting tools where members already are — in the conversation. Transforms chat from "just messaging" into "messaging with built-in actions." This is what makes HIVE chat fundamentally different from GroupMe/Discord.

**Effort:** Medium. Chat embed component, slash command parser, tool state sync between embed and full tool, mobile rendering. The action execution infrastructure already handles the backend.

**Tradeoffs:** Chat message complexity increases. Rendering embedded tools in a message stream is harder than rendering text. Performance risk if many tool embeds are in a long chat history. Need lazy loading / virtualization for tool embeds. Accessibility challenge — screen readers need to handle interactive embeds within a message list.

---

### 5. Template Marketplace with Creator Attribution

**Problem:** Today, templates are system-defined. Leaders cannot share tools they've built with other leaders. A club president who builds an amazing attendance tracker has no way to share it with other clubs. And there is no incentive to build tools because creators get no credit.

**Shape:** Any tool can be published as a template by its creator. Published templates appear in a campus-wide marketplace. Other leaders can install, customize, and deploy templates to their spaces. Templates show the creator's name, handle, install count, and ratings.

Creator profiles get a "Tools Created" section showing their published templates with usage stats. A "Builder" badge appears on profiles of users who have published templates with 10+ installs.

The marketplace has categories (Events, Operations, Engagement, Governance, Academic), search, and sorting by popularity/recency/rating. Featured templates are curated weekly.

**Wedge:** The competitive builder who wants campus clout. "I built the attendance tool that 40 clubs use." This is the Figma community model applied to campus.

**Impact:** Solves the content creation problem without HIVE needing to build every template. Creates a flywheel: more templates attract more leaders, more leaders create more templates. Gives builders social capital, which drives retention.

**Effort:** Medium. Tool publishing flow, marketplace browse UI, install/fork API, creator attribution on ToolCard, profile section for created tools. The review API already exists.

**Tradeoffs:** Quality control. Bad templates in the marketplace erode trust. Need a verification/review system (or at least a "report" mechanism). Template versioning becomes critical — a popular template that changes will break tools for 40 clubs. Moderation burden: someone needs to review templates for offensive content, broken configs, or abuse.

---

### 6. Setup Templates (Multi-Tool Orchestration)

**Problem:** Real campus workflows involve multiple coordinated tools. An event is not just an RSVP — it is an RSVP + a countdown + an announcement + a feedback form (that appears after the event). Today, a leader deploys each tool individually, with no coordination between them.

**Shape:** Setup Templates deploy 2-5 tools in one action with pre-configured connections and automations. Example: "Event Planning Setup" deploys:
- RSVP Tool (sidebar) — collects attendees
- Countdown Tool (header widget) — shows time until event
- Announcement Tool (pinned post) — event details
- Feedback Tool (post-event) — appears after event ends

The setup includes pre-wired connections: RSVP count displays on the countdown. Event end triggers feedback tool visibility. Feedback completion triggers a thank-you announcement. One unified configuration form asks for event name, date, capacity — and all tools inherit the values.

A setup status dashboard shows all tools in the setup, their health, and connection status. "Teardown" removes all tools in the setup with one click.

**Wedge:** The new club president who just claimed their space and needs "everything for our first event" without knowing what "everything" means.

**Impact:** Transforms HiveLab from "individual tool builder" into "workflow orchestrator." This is the upgrade pressure from individual tools to something genuinely powerful. Also makes first-time setup of a space feel like magic.

**Effort:** Large. Multi-tool deployment transaction, connection pre-wiring, unified config form, setup dashboard, teardown logic. Depends on connection cascade propagation (Feature 3 in current spec) working.

**Tradeoffs:** Complexity explosion. Each setup template is a mini product. Testing combinations of 3-5 tools with connections and automations is exponentially harder than testing individual tools. Failure modes multiply: what happens when one tool in a setup fails to deploy? Partial rollback? Let it be inconsistent? Need clear error states for "3/4 tools deployed, countdown failed."

---

### 7. Scheduled Tool Visibility

**Problem:** A feedback form should appear after an event ends, not before. A sign-up should close after capacity is reached or after the deadline. Today, tools are either visible or not. There is no time-based control.

**Shape:** Deployment settings get two new fields: "Show from" and "Hide after" (both datetime pickers). Tools automatically appear and disappear based on these schedules. Relative scheduling works: "Show 24 hours before event start," "Hide 1 hour after event ends." Leaders can always see hidden tools (with a "scheduled" badge). Members see tools only during their visibility window.

A scheduled tools timeline in the space settings shows when each tool will appear and disappear, like a Gantt chart of tool visibility.

**Wedge:** The event coordinator who deploys 3 tools for every event and manually hides/shows them every time. Or the academic club that wants a "Finals Study Partners" signup to appear only during reading week.

**Impact:** Saves manual work, makes spaces feel alive (tools appear and disappear contextually), and enables time-sensitive workflows. Low-effort, high-satisfaction feature.

**Effort:** Small-medium. Two datetime fields on the deployment model. A Cloud Function or cron that evaluates visibility on schedule. Client-side filter on tool rendering. The timeline view is the only complex UI piece.

**Tradeoffs:** Time zone handling. Does "show at 9am" mean the leader's timezone or the space's timezone? Need to decide and be consistent. Edge case: a leader schedules a tool while in a different timezone during break. Also, stale data risk: if the cron fails, tools stay visible/hidden incorrectly. Need fallback logic.

---

### 8. Tool Analytics Dashboard

**Problem:** Creators have no idea if their tools are being used. "I deployed a poll 3 weeks ago. Did anyone vote? When? How many people?" The API returns this data. No UI renders it.

**Shape:** Tool detail page gets an Analytics tab with:
- Usage chart (daily/weekly interactions over time)
- Unique users count (how many distinct people interacted)
- Action breakdown (47 votes, 23 RSVPs, 12 form submissions)
- Peak usage times (bar chart by hour of day)
- Completion rate (started vs. finished interactions — for forms)
- Comparison to template average ("Your poll got 3x more votes than average")

For the Lab dashboard, a summary row shows total interactions across all tools. Trending up/down indicators. "Your most used tool this week" callout.

**Wedge:** The club leader who deploys a tool and needs to report engagement numbers to their advisor or e-board. Currently they screenshot the tool and count manually.

**Impact:** Makes builders feel their work matters. Data-informed leaders make better tools. Creates a feedback loop: see what works, iterate, deploy better tools. Also generates data HIVE can use for recommendations ("tools like yours get more engagement when...").

**Effort:** Small-medium. The API endpoint exists. This is a charts page. Use a lightweight chart library (Recharts is already in the dependency tree or Nivo). The data aggregation queries may need Firestore composite indexes.

**Tradeoffs:** Data granularity vs. query cost. Real-time analytics are expensive on Firestore. Batch aggregate daily and show "updated daily" is cheaper but less exciting. Privacy concern: should tool creators see which specific users interacted, or only aggregate counts? Aggregate-only is safer.

---

### 9. Academic Calendar-Aware Templates

**Problem:** Generic templates miss the most powerful context HiveLab can leverage — the academic calendar. Every student on campus shares the same rhythm: add/drop, midterms, spring break, finals, commencement. Tools that know this rhythm are dramatically more useful.

**Shape:** Context variables available in tool element configs: `{{calendar.daysUntil('finals')}}`, `{{calendar.currentWeek}}`, `{{calendar.isBreak}}`, `{{semester.name}}`. Academic calendar data sourced from university registrar API (or manually configured per campus on initial setup).

New template category: "Academic." Templates include:
- **Finals Countdown** — auto-populated countdown to final exam period, no config needed
- **Study Group Matcher** — form that asks availability + subject, groups students automatically
- **Office Hours Tracker** — recurring weekly availability display
- **Semester Planner** — major deadlines with countdown strips
- **GPA Goal Tracker** — personal semester goals with progress bar

Auto-deploy suggestion: at the start of each semester, spaces get a notification "Deploy academic tools for Spring 2026?" with one-tap setup.

**Wedge:** The pre-med society that needs a "days until MCAT" countdown. The CS club that needs "study groups for CSE 250 midterm." These are tools that only make sense with campus context, and no competitor has it.

**Impact:** Cements HiveLab as "the campus tool builder," not "a generic tool builder." Academic calendar is structural context that Google Forms, Notion, and Airtable cannot access. This is pure differentiation.

**Effort:** Medium. Calendar data ingestion (manual or API), context variable injection into element rendering, new template definitions. The element system already supports dynamic config values.

**Tradeoffs:** Calendar data maintenance. Someone needs to update the academic calendar each semester (or build a scraper). If the data is wrong (wrong finals date), the tools are wrong, and trust erodes. Multi-campus scaling: each campus has a different calendar. Need per-campus configuration.

---

### 10. Connection Cascades (Live Data Flow Between Tools)

**Problem:** The power of composable tools is that data flows between them. A dues tracker's "paid members" list should automatically populate a voting tool's "eligible voters" list. Today, connections are stored but nothing propagates. The most compelling HiveLab demo ("watch data flow between tools in real time") does not actually work.

**Shape:** Firestore trigger on `sharedState` changes. When a source tool's state updates, the system resolves all outgoing connections, applies transforms (toCount, toArray, toBoolean), and updates target tool element configs. Propagation target: under 500ms.

Connection health visible in the IDE: green dot = synced, yellow = stale (>5min since last sync), red = error. "Last synced 2 minutes ago" label. Connection panel shows a visual wiring diagram of source/target relationships.

Cycle detection on connection creation: build a dependency graph, reject if a cycle would be created, with a clear error message ("This connection would create a loop: Tool A -> Tool B -> Tool A").

**Wedge:** The fraternity treasurer who needs "members who paid dues can vote in elections." Today this requires manually cross-referencing two spreadsheets. With working connections, it is automatic.

**Impact:** This is the feature that makes leaders say "I literally cannot do this with Google Forms." Composable tools with live data flow is the HiveLab moat. Without it, HiveLab is just "Google Forms with a fancy editor."

**Effort:** Medium. Firestore trigger on state changes, connection resolution logic, transform application, cycle detection. The connection types and transform definitions already exist in `tool-connection.types.ts`. The engine code exists in `tool-connection-engine.ts` — it needs wiring, not writing.

**Tradeoffs:** Firestore write costs. Every state change triggers connection evaluation, which may trigger more writes. At scale (1000 tools with 3 connections each), this could be expensive. Need batching and debouncing. Also, debugging cascading failures: if Tool A's state change breaks Tool B's connection, how does the leader diagnose the issue?

---

### 11. Remixable Tools (Fork + Credit)

**Problem:** Good tools should spread. When a leader sees a great attendance tracker in another space, they should be able to fork it into their own space. Today, there is no mechanism to discover or fork tools across spaces.

**Shape:** Every deployed tool visible to space members shows a "Remix" button. Clicking it creates a copy in the user's Lab with all elements and config preserved, state reset (counters at zero, collections empty). The forked tool tracks provenance: "Remixed from @coding-club's Attendance Tracker by @jane." The original creator's profile shows "Remixed 23 times."

Discovery: Explore page gets a "Popular Tools" section showing the most-remixed tools on campus. Tool cards show remix count as a social proof signal.

**Wedge:** The new club leader who sees a great tool in another space and thinks "I want that for my club." Currently their only option is to build it from scratch.

**Impact:** Reduces the effort to adopt HiveLab (fork instead of create). Creates network effects in the tool ecosystem (good tools spread organically). Gives builders social capital (remix counts = status).

**Effort:** Small. Tool duplication is straightforward (copy document, reset state, update owner). Provenance tracking is a new field on the tool model (`forkedFrom`, `lineage`). The Remix button is a single UI element.

**Tradeoffs:** Attribution visibility. If someone remixes a tool, heavily modifies it, then it gets remixed again — the original creator's attribution gets diluted. How deep does lineage tracking go? Also, remixing tools with connections: do the connections come with? Probably not (connections are space-specific). The fork would be a standalone tool without the original connections.

---

### 12. Tool Notifications (Real Delivery)

**Problem:** When a poll closes, the creator doesn't know. When someone RSVPs, the event organizer doesn't know. When a form gets submitted, the space leaders don't know. `notifyAffectedUsers()` is a function that does nothing. Tool state changes happen in a void.

**Shape:** Implement real notification delivery for tool events:
- `tool_result` — Poll closed, results available (notify creator + voters)
- `tool_submission` — Form submitted (notify space leaders)
- `tool_milestone` — Counter crossed threshold (notify creator)
- `tool_deadline` — Countdown expired, signup closed (notify creator + participants)
- `tool_rsvp` — New RSVP received (notify event organizer)

Notifications appear in the HIVE notification center (in-app). Email delivery for high-priority events (poll results, deadlines). Respect user notification preferences (quiet hours, muted spaces). Batch notifications for high-frequency events (don't send 50 individual "someone voted" emails — send one "your poll got 50 new votes" digest).

**Wedge:** The event organizer who deployed an RSVP tool and has to manually check it every few hours to see if anyone signed up. With notifications, they know instantly.

**Impact:** Closes the feedback loop. Without notifications, tools feel like shouting into a void. With notifications, tools feel responsive and alive. This is the difference between "I used a poll once" and "I use polls every week because I always know what's happening."

**Effort:** Small-medium. In-app notifications are Firestore document creation (the notification center already exists). Email delivery requires Resend/SendGrid integration (one-time setup). Batching logic for high-frequency events adds complexity.

**Tradeoffs:** Notification fatigue. If every tool interaction generates a notification, leaders will mute everything. Need smart defaults: creators get notified of milestones and results, not individual votes. Configurable per-tool notification settings add UI complexity. Also, email deliverability: need proper domain verification, SPF/DKIM, and reputation management.

---

### 13. Personal Tools (Tools That Work for User #1 Alone)

**Problem:** Most HiveLab tools require other people to be useful (polls need voters, RSVPs need attendees). This is a cold-start problem. A new user exploring HiveLab creates a poll and... is the only voter. Underwhelming. The system needs tools that deliver value to a single user.

**Shape:** New template category: "Personal." Tools that work alone:
- **Semester Countdown** — track deadlines for all your classes
- **GPA Calculator** — input grades, see GPA projections
- **Study Timer** — Pomodoro timer with session tracking
- **Reading List** — track books/papers to read, progress
- **Habit Tracker** — daily check-in for habits (gym, studying, sleep)
- **Budget Tracker** — simple expense tracking for students

Personal tools deploy to the user's profile (not a space). They appear in the profile bento grid. Other users visiting the profile can see them (with privacy controls). Personal tools create a reason to visit HiveLab even without a space to deploy to.

**Wedge:** The freshman who just signed up for HIVE, joined 2 spaces, and is exploring. "You have no tools yet. Try a personal countdown for your finals." Single-player value on day 1.

**Impact:** Solves the HiveLab cold start problem. Every user can find value in a personal tool, even without a community. Personal tools also serve as a gateway: "you built a study timer for yourself — now deploy one to your space for your study group."

**Effort:** Small. The tool system already supports profile deployment. Personal templates are new template definitions with single-player element configs. The bento grid integration exists.

**Tradeoffs:** Scope creep risk. Personal tools (GPA calculators, habit trackers) are not what makes HIVE differentiated. There are 100 apps that do habit tracking better. The risk is spending engineering time on personal tools that do not drive the north star (Weekly Active Spaces). Mitigate by keeping personal tools dead simple and always including a "deploy to your space" prompt.

---

### 14. Tool Usage Data as Recommendation Fuel

**Problem:** HIVE has a discovery system, but it has no signal for what leaders actually need. Tool usage data is the strongest signal on the platform. If 80% of Greek life spaces deploy an RSVP tool, a new Greek life space should see "RSVP Tool" as the first recommendation, not a generic "browse templates."

**Shape:** Aggregate tool usage by space category. Build a recommendation engine:
- "Spaces like yours use these tools" (collaborative filtering)
- "Your most active tool is a poll — try a leaderboard too" (cross-sell)
- "This tool was just published by a leader in your major" (social)
- "8 clubs deployed this template this week" (trending)

Surface recommendations in three places:
1. Lab dashboard ("Recommended for your space")
2. Space settings ("Add a tool" section with smart defaults)
3. Home feed ("Popular tools on campus this week")

**Wedge:** The new club leader who has no idea what tools to deploy and gets overwhelmed by a template gallery. Smart recommendations reduce choice paralysis.

**Impact:** Data flywheel. More usage generates better recommendations. Better recommendations drive more usage. This is the advantage that compounds over time and cannot be replicated by a competitor who just copied the feature set.

**Effort:** Medium. Usage data aggregation (Firestore queries by category/type), recommendation algorithm (start with simple collaborative filtering, not ML), recommendation UI components, and integration into Lab/Space/Home surfaces.

**Tradeoffs:** Cold start for recommendations (need baseline data before recommendations are useful). Privacy: aggregating tool usage across spaces could reveal competitive info ("the other consulting club is tracking X"). Mitigate by only showing aggregate counts, never tool state contents. Also, recommendation quality: bad recommendations erode trust faster than no recommendations.

---

### 15. Automation Recipes (Pre-Built Automation Templates)

**Problem:** Even when automations work (Feature 3), setting up "when X happens, do Y" from scratch requires understanding triggers, conditions, and actions. Most club leaders don't think in automation abstractions. They think in use cases: "remind members about the event," "close signups when full," "announce poll results."

**Shape:** Pre-built automation recipes attached to templates:
- **Event RSVP template** comes with: "Send reminder email 24 hours before event" (pre-wired)
- **Poll template** comes with: "Post results to space when poll closes" (pre-wired)
- **Signup template** comes with: "Close signups when capacity reached" (pre-wired)
- **Dues Tracker** comes with: "Send reminder to unpaid members every Monday" (pre-wired)

Recipes are opt-in during deploy: "This tool includes 2 automations. [Enable] [Skip]". A recipe library lets leaders browse and add automations to existing tools: "Add an automation to this tool" -> browse recipes -> one-tap add.

**Wedge:** The leader who deployed a poll and didn't know automations existed until they saw "This poll can automatically post results. Enable?" One toggle, instant value.

**Impact:** Makes automations accessible to leaders who would never configure triggers and conditions from scratch. Packages automation power into bite-sized, understandable recipes. This is how you get automation adoption above 5%.

**Effort:** Medium. Recipe data model (template + automation pairings), opt-in UI during deploy flow, recipe library UI, recipe installation logic. Depends on automation execution engine working (Feature 3).

**Tradeoffs:** Recipe maintenance burden. Every template needs curated automations. As templates grow, recipe management grows. Also, recipes that don't work perfectly (e.g., reminder email goes to spam) will damage trust in the entire automation system. Quality must be high.

---

## Quick Wins (Ship in Days)

**1. Creator Attribution on ToolCard.** Add the creator's name and avatar to every tool card. `ToolCard.tsx` currently shows zero author info. One component change. Builds builder ego, which drives retention.

**2. Empty State for Lab Dashboard.** New users landing on `/lab` with 0 tools see a generic empty state. Replace with: "Build your first tool" + featured template cards + AI prompt input. Copy: "Describe what you need. We'll build it." Guides the user, reduces bounce.

**3. Tool Duplication.** "Duplicate" action in the tool menu. Creates a copy with "(Copy)" suffix, state reset, config preserved. The API is trivial (read tool doc, write new doc with new ID). Saves builders from recreating tools from scratch.

**4. Template Sort by Space Category.** When a Greek life leader opens the template gallery, show event and social templates first. When an academic club leader opens it, show study and academic templates first. Simple sort based on `space.category` field. Already have the data.

**5. Tool Count on Space Card.** SpaceCard in the explore grid shows member count and online count. Add "3 tools deployed" as a signal. Shows the space is active and investing in engagement.

---

## Medium Bets (Ship in Weeks)

**1. One-Tap Deploy from Template** (Feature 1). Inline configuration + direct deploy. Removes the IDE barrier. The single biggest adoption accelerant for non-technical leaders.

**2. Automation Execution Engine** (Feature 3). Wire event triggers, implement email sending, verify schedule triggers. The feature that converts HiveLab from "nice" to "indispensable."

**3. Tool Embedding in Chat** (Feature 4). Slash commands for inline polls, RSVPs, countdowns in chat. Makes tools part of the conversation instead of a sidebar destination.

**4. Tool Analytics Dashboard** (Feature 8). Charts page for tool usage data. API exists, UI does not. Gives creators feedback and closes the build-measure-iterate loop.

**5. Tool Notifications** (Feature 12). Real notification delivery for tool events. Closes the feedback loop between tool state changes and the people who care.

**6. Connection Cascades** (Feature 10). Live data flow between tools. The feature that makes "composable tools" real instead of theoretical.

---

## Moonshots (Ship in Months+)

**1. AI Tool Generation** (Feature 2). Real LLM composition of multi-element tools from natural language. The "Cursor for campus tools" vision delivered. Requires prompt engineering, layout algorithms, iterative refinement, and cost management at scale.

**2. Setup Templates** (Feature 6). Multi-tool orchestrated deployments. "Deploy my entire event workflow in one click." Depends on connections and automations both working reliably.

**3. Tool Marketplace with Economics.** Beyond the basic marketplace (Feature 5): introduce HIVE credits earned by popular builders. Builders whose templates are used by 50+ spaces earn credits redeemable for premium features or campus perks. Creates a creator economy within the campus.

**4. Cross-Space Tool Federation.** A university-wide tool deployed by student government that every space inherits. "Campus-wide event calendar tool" automatically appears in all spaces. Requires federation architecture, permission model for campus-level deployments, and university admin buy-in.

**5. External Data Source Integration.** Tools that can pull data from external APIs: Canvas (grades, assignments), UB events calendar, campus dining menus, library availability. Transforms HiveLab from "tools that work with HIVE data" to "tools that work with campus data."

**6. Tool Version Control and Branching.** Git-like versioning for tools. Branch a tool, experiment with changes, merge back. Diff view showing element changes. Rollback to any previous version. Full audit trail of who changed what and when. This is the "Figma version history" equivalent.

---

## Competitive Analysis

### Google Forms
**What they do well:** Universal familiarity. Zero learning curve. Works on any device. Reliable.
**Structural failure:** No real-time results in-community. No automation. No identity context. Results go to a spreadsheet that the form creator must manually analyze and communicate back to members. Zero integration with the community that uses the form. A Google Form doesn't know you're the VP of UB Consulting. It doesn't know the event is next Thursday. It cannot close signups when full.
**HIVE advantage:** Forms that live inside the community, update in real-time, automate follow-up, and know who you are.

### Notion
**What they do well:** Beautiful documents. Flexible databases. Template ecosystem. Good collaboration.
**Structural failure:** Notion is a workspace tool for teams, not a community tool for 200 members. Sharing a Notion page with a club means sharing a link that members must bookmark, navigate to separately, and remember exists. No notifications when data changes. No real-time presence in the community context. Mobile experience is slow. Free plan limits are restrictive for student orgs.
**HIVE advantage:** Tools embedded in the place members already are (their space). No separate login, no separate link, no "check the Notion."

### Airtable
**What they do well:** Powerful databases. Automations. API access. Views (kanban, calendar, gallery).
**Structural failure:** Too complex for a club president who just wants a signup sheet. The learning curve is measured in hours, not minutes. Pricing eliminates student orgs (free plan = 1,000 records). No concept of "members" — everyone is a collaborator or a form submitter, no roles.
**HIVE advantage:** 60-second deploy. Role-aware (leaders edit, members interact). Free for all campus orgs. No database required — just elements on a canvas.

### Typeform
**What they do well:** Beautiful form experience. Conditional logic. Great completion rates.
**Structural failure:** One-way data collection. No live dashboard. No automation without Zapier. No community context. Every form is a standalone URL that exists outside the community. Results require manual export and communication.
**HIVE advantage:** Forms that live in the space, show live submission counts, can trigger automations, and know the submitter's identity and role.

### Canva
**What they do well:** Visual creation. Templates for everything. Brand consistency tools.
**Structural failure:** Canva creates static artifacts (flyers, posts), not interactive tools. A Canva RSVP flyer cannot actually collect RSVPs. Canva is about communication, not workflow. No data collection, no state management, no automation.
**HIVE advantage:** HiveLab creates *functional* things, not visual artifacts. A HiveLab tool actually tracks votes, collects responses, and triggers actions. Canva and HiveLab are complementary, not competitive — leaders use Canva to promote the event, HiveLab to manage it.

### Discord Bots
**What they do well:** Deep customization. Programmable. Massive ecosystem. Real-time.
**Structural failure:** Bots require technical knowledge to set up (or trust in a third-party bot). No visual builder. No campus identity. The "poll bot" in Discord doesn't know you're a sophomore in engineering — it just counts reactions. Bot permissions are complex. Bot quality is inconsistent. No tool composition (each bot is standalone).
**HIVE advantage:** Visual builder for non-technical users. Identity-aware tools. Composable elements that work together. No third-party trust required.

---

## Wedge Opportunities

### Wedge 1: The First Meeting of the Semester
**Moment:** The first week of classes. Every club holds an interest meeting. Leaders need: RSVP tracking, a countdown to the meeting, and a way to collect emails from attendees. They currently use Instagram DMs, Google Forms, and GroupMe messages — separately.
**Play:** "Deploy your Interest Meeting toolkit in 30 seconds." One-tap setup template that deploys RSVP + countdown + attendee form. Share the RSVP link to Instagram story ("Sign up on HIVE"). Every signup is a new HIVE user.
**Why it works:** Urgent (meeting is this week), the leader has authority to adopt (they run the club), and relief is immediate (tool works instantly). The RSVP link shared on Instagram is organic distribution.

### Wedge 2: Election Season
**Moment:** Spring semester. Every club elects new officers. Current process: paper ballots in a meeting room, or a Google Form where anyone with the link can vote multiple times.
**Play:** "Run your election on HIVE." Election tool with verified voting (one vote per verified member), live results for leaders, anonymous ballots for voters. Position it as "the fair way to elect officers."
**Why it works:** High stakes (people care who wins). Current tools are embarrassingly inadequate (paper ballots in 2026). Trust matters (HIVE verifies identity). The output (election results) is a shareable artifact.

### Wedge 3: Dues Season
**Moment:** Beginning of each semester. Treasurers need to track who has paid dues, send reminders to those who haven't, and report totals to the e-board. Current process: Venmo + spreadsheet + individual DMs.
**Play:** "Track dues on HIVE." Dues tracker tool with auto-reminders, payment status dashboard, and automatic updates to member standing. Connect to an election tool: only paid members can vote.
**Why it works:** Painful, recurring, manual, and error-prone. Every club treasurer hates this job. HIVE makes it trivial. The "only paid members can vote" connection is a demo of tool composition that is impossible on any competitor.

### Wedge 4: The Advisor Report
**Moment:** End of semester. Club advisors require a report of activity, attendance, and engagement. Leaders currently compile this manually from GroupMe screenshots, Google Form responses, and memory.
**Play:** "Auto-generate your advisor report from HIVE data." Tool analytics aggregate all tool interactions, RSVP counts, event attendance, and member activity into a downloadable report. One click, no manual compilation.
**Why it works:** Institutional requirement (can't skip it). Currently painful (hours of manual compilation). HIVE has the data already. This makes leaders think "I need to use HIVE tools all semester so my report writes itself."

---

## Open Questions

1. **AI cost model.** At $0.05/generation and 20 generations/hour limit, a campus of 500 active builders could cost $500/day in LLM API calls. Is there a tier system? Free users get rules-based, premium gets LLM? Or is LLM generation subsidized as a growth driver?

2. **Template quality control.** When leaders publish templates, who reviews them? A curation team (doesn't scale)? Community voting (popularity contest)? Automated schema validation (catches broken configs but not bad UX)? Some combination?

3. **Automation reliability expectations.** When a leader sets "send email 24 hours before event," they expect it to send. Not "usually sends." Not "sends within an hour of the scheduled time." What is the SLA? What happens when it fails? Is there a retry mechanism, a failure notification, a manual override?

4. **Cross-space tool visibility.** Can members of Space A see tools deployed in Space B? Currently no — tools are space-scoped. But if a leader publishes a template, other leaders can install it. Where is the boundary between "my tool" and "a tool anyone can use"? The marketplace answers this, but the privacy model for deployed tools needs definition.

5. **Tool data ownership at leadership transitions.** When a club president graduates, who owns the tools they created? The space? The user? Do tools transfer with space ownership, or do they remain on the creator's profile? A graduating president who built 10 tools represents significant institutional knowledge.

6. **Mobile-first or mobile-compatible?** The canvas IDE is inherently desktop-centric (drag-drop, resize, multi-panel layout). On mobile, should we offer a simplified "config-only" editor, or steer users to "use templates, deploy on mobile, edit on desktop"? Building a mobile-native canvas editor is a 6-month project.

7. **What is the minimum viable HiveLab demo?** When pitching to a new club leader, what is the single tool you build in front of them that makes them say "I need this"? A poll feels too simple. A multi-tool event setup feels too complex. The answer might be: "Describe your next event. Watch a tool appear." That requires real AI generation (Feature 2).

8. **Automation as a paid feature?** Automations are the most valuable part of HiveLab. They are also the most expensive to operate (email delivery, scheduled execution, monitoring). Should automations be free for all spaces, or a premium feature for "Pro Spaces"? Free automations drive adoption but cost money. Paid automations limit adoption but create revenue.

9. **When does HiveLab stop and third-party integrations start?** A budget tracker tool is useful. But should HiveLab build a full budgeting system, or integrate with Venmo/Zelle for payment tracking? A calendar tool is useful. But should HiveLab build a full calendar, or integrate with Google Calendar? The boundary between "tools we build" and "tools that connect to external services" defines the scope of HiveLab.

10. **How do tools interact with the space feed?** When someone votes in a poll, does it appear in the space activity feed? ("Alex voted in the Meeting Location Poll.") If yes, the feed becomes a live stream of engagement. If no, tool interactions are invisible to non-participants. The right answer probably depends on the tool type: votes should be aggregated ("12 new votes on the poll"), form submissions should be private, RSVP additions should be visible.
