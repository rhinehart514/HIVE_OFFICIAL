# Moderation & Safety

> **Dimension:** Keeping it real and safe. Content moderation, reporting, anonymous concerns, leader accountability, anti-spam, harassment prevention. The trust layer that makes belonging feel safe.
>
> **Last Updated:** February 5, 2026

---

## Current State

HIVE has a surprisingly deep moderation foundation for a pre-launch platform. Here is what exists:

**Backend Infrastructure (Built, Partially Wired)**

- `ContentModerationService` (`apps/web/src/lib/content-moderation-service.ts`) -- full reporting pipeline: submit report, AI analysis via ML Content Analyzer, automated rule engine, queue assignment, moderator actions (warn, hide, remove, suspend, ban), appeal processing
- `ContentModerationService` DDD version (`packages/core/src/domain/shared/services/content-moderation.service.ts`) -- canonical visibility checks, viewer-context-aware filtering (admins see everything, mods see hidden, users see visible)
- Content moderation utilities (`apps/web/src/lib/content-moderation.ts`) -- status checking, hidden content filtering, Firestore update builders
- Moderation types (`apps/web/src/lib/moderation/types.ts`) -- `ContentReport`, `ModerationQueue`, `ModerationRule`, `AIAnalysisResult`, ML feedback loop types
- ML Content Analyzer integration with toxicity scoring, spam detection, PII detection
- ML feedback loop -- records moderator decisions vs ML predictions, calculates accuracy stats, identifies high-confidence errors for threshold tuning
- Automated moderation rules stored in `moderationRules` collection with conditions, actions, and trigger statistics

**Frontend (Built, Admin-Heavy)**

- `ModerationPanel` (`apps/web/src/app/s/[handle]/components/moderation-panel.tsx`) -- space-level moderation drawer for owners/admins/mods. Shows flagged/hidden content queue, supports approve/hide/unhide/remove/restore with bulk actions.
- `ContentModerationDashboard` (`apps/admin/src/components/content-moderation-dashboard.tsx`) -- admin dashboard with stats (pending/resolved/high-priority/appeals), pie/bar charts by report type, queue with priority + type filters, quick actions (remove, warn, suspend, dismiss), appeal review panel
- Admin hooks: `use-moderation-queue.ts`, `use-moderation-reports.ts`, `use-moderation-appeals.ts`

**Chat-Level Security (Built)**

- Rate limiting: 20 messages/minute per user, 4000 char max, 7-day edit window
- `SecurityScanner` for XSS prevention on all message content
- @mention processing with notification triggers
- Messages have `isHidden`, `isFlagged` fields

**Identity-Level Trust (Built)**

- Real identity via .edu email verification -- no anonymous users
- Role hierarchy: owner > admin > moderator > member
- Trust score on user profile (used to weight report severity)
- Handle history tracking for accountability
- Ghost mode for privacy (partially implemented)

**What is Missing / Broken**

1. **No user-facing report flow** -- there is no "Report" button visible to regular members in chat, profiles, or spaces. The `ContentModerationService.submitReport()` API exists but nothing calls it from the frontend.
2. **No block/mute user** -- members cannot block other users. `isMuted` exists on `SpaceMember` but only for space-level mute by admins. No interpersonal blocking.
3. **No community guidelines page** -- warnings reference "community guidelines" but no actual guidelines document exists for users to read.
4. **No moderator notification delivery** -- `notifyModerators()` is a stub that logs but does not actually send notifications to moderators.
5. **No graduated response tracking** -- warnings, suspensions, and bans are recorded in separate collections with no unified "strike count" per user.
6. **No anonymous/confidential reporting** -- all reports include `reporterId`, visible to moderators. No option to report anonymously.
7. **No leader accountability tools** -- no way for the university or platform to hold space leaders accountable for what happens in their spaces.
8. **Appeal flow is admin-only** -- users have no UI to submit appeals. Only the admin dashboard has appeal review.
9. **Proactive detection is reactive** -- AI analysis runs only after someone files a report. No pre-screening of messages.
10. **No space-level moderation settings** -- all moderation rules are platform-level. Individual spaces cannot set their own content policies.

---

## The Opportunity

HIVE has a structural advantage that no competitor in this space possesses: **real identity**.

Every user on HIVE is a verified student with a campus email, a real name, a handle tied to their academic record, and handle history tracking. This changes the moderation equation fundamentally. On Discord or Reddit, moderation is a game of whack-a-mole -- ban an anonymous troll and they create a new account in 30 seconds. On HIVE, getting banned means losing your verified campus identity. Your reputation. Your spaces. The social capital you have accumulated.

This means:

1. **Deterrence is real.** The cost of bad behavior is high because identity cannot be cheaply replaced.
2. **Context is rich.** Moderators can see who someone is -- their year, their major, which spaces they lead, how long they have been on the platform.
3. **Trust can compound.** A student who has been on HIVE for 2 years without incident is demonstrably different from someone who joined yesterday.
4. **Accountability flows both directions.** Leaders who run spaces with repeated issues are identifiable and reachable.

The opportunity is to build a safety system that leans into this structural advantage rather than treating moderation as a defensive afterthought. A system where safety is not the opposite of belonging -- it is the foundation of it.

The university cares about this more than any other feature. Hazing incidents, Title IX violations, discrimination complaints -- these are existential risks for a student platform. If HIVE can be the platform that a Dean of Students actually trusts, that is an institutional moat no competitor can replicate with better UX.

---

## Feature Ideas

### 1. Report Flow for Members

**Problem:** The entire reporting backend exists but no regular user can access it. There is no "Report" button on messages, profiles, events, or spaces. If a student experiences harassment right now, they have zero recourse within the platform.

**Shape:** A report dialog accessible from every piece of content on the platform. Tap the three-dot menu on a message, profile, event, or space and see "Report." The dialog walks through: category selection (harassment, spam, hate speech, etc.), optional description, optional screenshot attachment. Submits to the existing `ContentModerationService.submitReport()`. Confirmation screen shows "We received your report" with estimated review time. No dead end.

**Wedge:** This is not a feature pitch -- it is a launch blocker. You cannot ship a student platform without a way for students to report problems. The wedge is that HIVE's report flow can be better than competitors because every reporter is a verified student, making reports inherently more credible.

**Impact:** Critical. Without this, the first harassment incident becomes a PR disaster. "Students have no way to report harassment on HIVE" is a headline that kills the platform.

**Effort:** Small-Medium (2-3 days). Backend exists. Need: report dialog component, 3-dot menu integration on messages/profiles/spaces/events, confirmation UI.

**Tradeoffs:** Report fatigue if too easy to file. Counter: trust scoring already weights reporter history. Low-trust reporters (many dismissed reports) get deprioritized automatically.

---

### 2. User-to-User Block

**Problem:** A student cannot prevent another student from messaging them, appearing in their feed, or viewing their profile. The only recourse is leaving the space. This is the number one safety expectation on any social platform.

**Shape:** "Block this person" option on any profile or in any message context. Blocked users cannot: see your profile, message you directly, see your messages in shared spaces (their view filters you out), @mention you. You do not see their content either. Blocking is silent -- the blocked user is not notified. Stored on the blocker's user document. Unblocking available in settings. Space admins can see block relationships within their space if needed for mediation.

**Wedge:** "I can control who I interact with" is table-stakes for any platform aimed at young adults. The wedge is that because HIVE has real identity, blocks carry more weight -- you are not blocking a throwaway account, you are blocking a real person, which means the behavior that led to the block has real social consequence.

**Impact:** High. Every user who encounters someone unpleasant and cannot block them will leave the platform.

**Effort:** Medium (3-5 days). Need: block/unblock API, Firestore `userBlocks` collection, query filters in chat/feed/search to exclude blocked users, settings UI for managing blocks.

**Tradeoffs:** Blocks could be weaponized (blocking all members of a rival org). Counter: blocks only affect the blocker's view, not the blocked user's access to spaces. Admins can audit block patterns if mediation is needed.

---

### 3. Graduated Response System (Strike Tracking)

**Problem:** Warnings, suspensions, and bans are stored in three separate collections with no unified view. A user could accumulate 5 warnings without anyone noticing the pattern. Moderators make decisions without knowing the user's full history.

**Shape:** A unified `userModerationHistory` document per user that tracks every moderation action as a timestamped event. Automatically calculates a "strike count" with configurable decay (strikes expire after 6 months of clean behavior). Thresholds: 1 strike = warning, 3 strikes = 24-hour mute, 5 strikes = 7-day suspension, 7 strikes = review for ban. Visible to moderators as a sidebar when reviewing reports. The user sees their own strike count in settings with clear explanation of what each threshold means.

**Wedge:** Universities need documented, consistent enforcement. "We apply the same rules to everyone" is legally important. A graduated system also feels fair to students -- they know exactly where they stand.

**Impact:** High. Transforms moderation from ad-hoc decisions to a defensible, consistent system. Reduces moderator burden by automating escalation.

**Effort:** Medium (4-6 days). Need: unified history document, strike calculation service, threshold automation, moderator sidebar component, user-facing strike display.

**Tradeoffs:** Fixed thresholds might not fit every situation (a hate speech incident is different from three spam violations). Counter: moderators can override thresholds. Critical-severity reports skip the graduated ladder entirely.

---

### 4. Anonymous Concern Reporting (Confidential Tips)

**Problem:** Some safety situations -- hazing, sexual harassment, discrimination -- are too sensitive for named reports. A student who witnesses hazing in a Greek life space will not file a report with their name attached if the perpetrator is their pledge master. But the platform needs to know.

**Shape:** A separate "Submit a Concern" flow distinct from standard content reporting. The concern is stored with a hashed reporter ID that only the platform trust & safety team can de-anonymize (not space moderators). Concerns are not tied to specific content -- they describe situations ("I witnessed X in Y space"). Concerns route to a dedicated queue visible only to platform administrators, not space moderators. Reporter receives a case number and can check status anonymously. Optional: "I want to be contacted about this" toggle that reveals identity only to the T&S team.

**Wedge:** This is the feature that makes HIVE trustworthy to university administration. "Students can report hazing concerns anonymously through HIVE, and we route them to the appropriate office" is a sentence that makes a Dean of Students want to partner. It also positions HIVE as more responsible than Discord/GroupMe where these problems go completely unobserved.

**Impact:** High (institutional trust), Medium (daily usage). Most students will never use this, but the ones who need it will remember it forever.

**Effort:** Medium-High (5-7 days). Need: separate concern submission flow, hashed identity storage, dedicated admin queue, case tracking system, anonymous status checking.

**Tradeoffs:** False/malicious anonymous reports. Counter: hashed identity means platform can detect serial false reporters and revoke anonymous reporting privileges. Rate limit: 1 concern per 24 hours per user. Abuse of the system itself becomes a moderation event.

---

### 5. Space Moderation Settings (Community-Level Policies)

**Problem:** All moderation is platform-level. A study group and a Greek life chapter have wildly different moderation needs. The study group needs spam filtering. The Greek life chapter needs content screening, new member vetting, and leader accountability. One-size-fits-all does not work.

**Shape:** A "Safety Settings" tab in space settings (visible to owners/admins). Controls: content screening level (off / flag for review / auto-hide), word filter (custom blocked words/phrases), new member restrictions (first 48 hours: messages require approval), link sharing policy (off / members only / approved links), image sharing (on / off / moderator approval), anonymous posting toggle. Each setting has a "Recommended for your space type" default based on whether the space is academic, social, Greek life, etc.

**Wedge:** Space leaders want control over their community's tone. Discord has this (slow mode, member verification levels, automod). HIVE should have it with better defaults because we know the space type.

**Impact:** Medium-High. Leaders who can customize their moderation tools feel empowered. Spaces that can enforce their own norms develop stronger cultures.

**Effort:** Medium (4-5 days). Need: space-level moderation settings in Firestore, settings UI panel, middleware that checks space-level settings before platform-level, pre-screening hook in chat message flow.

**Tradeoffs:** Complex configuration. Counter: good defaults mean most leaders never touch these settings. Progressive disclosure -- show basic controls first, advanced behind "Show more."

---

### 6. Leader Accountability Dashboard

**Problem:** Space leaders represent their organizations on HIVE. If a fraternity space has 15 harassment reports, that is not just a moderation problem -- it is an organizational accountability problem. Currently, no one can see this pattern.

**Shape:** A platform-level view (admin only) that aggregates moderation data by space: total reports, report types, resolution rate, average response time, repeat offenders. Highlights "hot spots" -- spaces with disproportionate reports relative to their size. Includes leader activity: how quickly do leaders address flagged content in their space? Do they use moderation tools at all? Optional: "Space health score" that factors in moderation metrics alongside activity metrics. For leaders: a simplified view showing "Your space's safety metrics" -- reports this month, average resolution time, comparison to similar spaces.

**Wedge:** This is leverage for the university partnership. "We can show you which student organizations have the most safety incidents" is data that Student Affairs offices desperately want. It makes HIVE the platform of record for organizational accountability.

**Impact:** High (institutional), Medium (daily usage). Most leaders will check this monthly. Administrators will check it before Greek life reviews, org re-chartering, etc.

**Effort:** Medium-High (5-7 days). Need: aggregation queries by space, leader activity tracking, admin dashboard view, leader-facing simplified view, space health score computation.

**Tradeoffs:** Surveillance concern -- leaders might feel monitored. Counter: metrics are about the space, not the leader personally. Framing matters: "Help you keep your community healthy" vs "We're tracking your moderation failures."

---

### 7. Pre-Screening Message Filter

**Problem:** The ML Content Analyzer only runs after someone files a report. This means harmful content sits in the chat until someone reports it. For hate speech or threats, every minute of visibility causes harm.

**Shape:** Inline message screening that runs the ML Content Analyzer on every message before it appears in the chat feed. Three tiers: (1) Auto-allow: confidence > 95% safe, message appears instantly. (2) Soft flag: confidence 70-95%, message appears with delayed review -- if ML later escalates, moderator is notified. (3) Auto-hold: confidence < 70% safe, message is held for moderator review before appearing. Space-level toggle (off by default, recommended for high-risk spaces). Platform-level toggle for critical categories (threats, self-harm) that cannot be disabled.

**Wedge:** Pre-screening makes HIVE safer than any competitor. Discord has AutoMod for keyword matching, but HIVE has contextual ML analysis with real identity context. "Messages are screened before they appear" is a safety guarantee universities can point to.

**Impact:** High (safety), Medium (perception). Most messages will auto-allow with no visible delay. The value shows in the 0.1% of messages that get caught.

**Effort:** High (7-10 days). Need: async message processing pipeline, ML inference on every message (latency concern), hold/release mechanism, moderator notification for held messages, fallback for ML service outages.

**Tradeoffs:** Latency -- ML analysis adds 100-300ms to every message. Counter: run analysis async; show message immediately with a "pending" micro-state, retract if flagged. False positives will frustrate users. Counter: very high threshold for auto-hold (only threats and slurs), soft-flag for everything else. Privacy concern -- "all my messages are being read by AI." Counter: transparent policy, no human reads unless flagged, analysis results not stored for clean messages.

---

### 8. Self-Harm Detection & Crisis Routing

**Problem:** Campus platforms have a unique responsibility. If a student posts content indicating self-harm, HIVE has a duty to connect them with resources. This is not optional -- it is the ethical floor for a platform that knows the real identity of vulnerable young adults.

**Shape:** A specialized detection layer within the ML pipeline tuned specifically for self-harm and crisis language. When detected: (1) The student sees an interstitial with crisis resources -- 988 Suicide & Crisis Lifeline, campus counseling center number, Crisis Text Line. (2) The message is held from the feed (not shown to other students). (3) A confidential alert is routed to designated campus contacts (configurable per campus -- usually the counseling center or Dean of Students office). (4) The student's account is flagged for wellness check-in, not punitive action. No strikes, no warnings. This is care, not moderation.

**Wedge:** This is the feature that makes HIVE a responsible platform, not just a product. Universities will require this. It is also legally relevant -- if HIVE has the capability to detect distress and does not act, that creates liability.

**Impact:** Critical (ethical and legal). Low frequency, high consequence. One saved life justifies the entire feature.

**Effort:** High (7-10 days). Need: specialized ML model tuning for self-harm language, crisis resource interstitial component, campus contact configuration, confidential routing (separate from moderation queue), wellness flag on user profile, campus partnership setup for each deployment.

**Tradeoffs:** False positives are worse here than anywhere else -- showing a crisis interstitial to someone discussing self-harm in an academic context (psychology class) is jarring. Counter: high confidence threshold, academic context detection ("in my psych class we discussed..."), gentle interstitial design ("If you or someone you know needs support..." not "We detected a crisis"). Privacy: routing to campus contacts means HIVE is disclosing student behavior. Counter: clear terms of service that users agree to, consistent with FERPA exceptions for health/safety emergencies.

---

### 9. Community Guidelines & Code of Conduct

**Problem:** The warning system references "community guidelines" that do not exist. Students cannot follow rules they cannot read. Moderators cannot enforce consistently without a shared reference.

**Shape:** A living document at `/guidelines` that defines: what HIVE is for (belonging, building, organizing), what is not allowed (harassment, hate speech, spam, impersonation, etc. -- mapped to `ReportCategory`), what happens when rules are broken (graduated response, mapped to strike system), how to report, how to appeal, your rights as a member. Shown during entry flow (not a 40-page ToS -- a 2-minute read with clear examples). Linked from every moderation action (warning, suspension, ban includes link to the specific guideline violated). Versioned -- changes are announced and take effect after 7-day notice period. Space leaders can add supplementary guidelines for their space.

**Wedge:** "Clear, human-readable community standards" differentiates from platforms that bury rules in legal documents. Students should feel the guidelines are fair and understandable. University administrators should feel they are thorough and enforceable.

**Impact:** Medium-High. Prevents ambiguity, reduces appeals ("I didn't know that wasn't allowed"), provides legal cover for enforcement actions.

**Effort:** Small-Medium (2-3 days for engineering, plus content writing). Need: `/guidelines` page, versioning system, entry flow integration, link injection in moderation notifications, space-level supplementary guidelines field.

**Tradeoffs:** Too long and no one reads it. Counter: keep it under 800 words. Use examples, not legalese. Progressive detail -- summary + expandable sections.

---

### 10. Moderator Tools for Space Leaders

**Problem:** The existing `ModerationPanel` is a good start but limited. Space leaders need more tools to manage their communities day-to-day: temporary mute (already in the data model but no UI), member warnings, activity logs, ability to restrict new members, and a way to delegate moderation without giving full admin access.

**Shape:** An expanded moderation toolkit within space settings: (1) **Temp mute** -- mute a member for 1h/24h/7d with reason. Uses existing `isMuted` + `muteUntil` fields. (2) **Member warnings** -- send an in-space warning visible only to the member. Tracked in their member record. (3) **Activity log** -- who joined, who left, who was muted, what was flagged. An audit trail for the space. (4) **New member restrictions** -- first 48 hours: messages require approval, cannot create events, cannot invite others. (5) **Moderator role** -- assign moderator role (already in data model) with clear permissions. Moderators can mute and warn but not ban or change space settings.

**Wedge:** Leaders who have been managing groups on GroupMe or Discord are used to some level of moderation tools. HIVE's advantage: real identity context means leaders can make better decisions (they know the person's year, major, how long they have been in the space).

**Impact:** Medium-High. Empowered leaders create safer spaces. The alternative is that leaders give up and stop moderating, which degrades the community.

**Effort:** Medium (4-6 days). Temp mute and moderator role are partially built. Need: mute UI, warning system, activity log queries, new member restriction middleware, moderator permission boundaries.

**Tradeoffs:** Leaders could abuse moderation tools (silencing dissent). Counter: all moderation actions are logged in the audit trail. Platform admins can review space-level moderation patterns. Members can report abusive moderation to the platform.

---

### 11. Anti-Spam & Rate Intelligence

**Problem:** The current rate limit (20 messages/minute) is a blunt instrument. Sophisticated spam adapts -- posting just under the limit, using varied content, targeting multiple spaces. There is no cross-space spam detection.

**Shape:** An intelligent rate limiting layer that considers: (1) **Behavioral signals** -- message similarity score (are they posting the same thing across spaces?), burst detection (10 messages in 30 seconds followed by silence), link density (messages that are mostly URLs). (2) **Trust-based limits** -- new users (< 7 days) get stricter limits. Users with high trust scores get relaxed limits. Users with prior spam flags get pre-screening. (3) **Cross-space detection** -- if a user posts identical content in 3+ spaces within 5 minutes, auto-flag. (4) **Invite spam** -- detect mass invite link distribution. (5) **Auto-actions** -- first offense: soft-flag for review. Repeated: auto-mute for 1 hour. Pattern confirmed: escalate to moderator.

**Wedge:** Real identity makes anti-spam much more effective because spammers cannot create new accounts. One ban is permanent. This means HIVE can be more aggressive with spam prevention without worrying about false-positive account loss (the user can appeal and get their real identity back).

**Impact:** Medium. Spam is not a crisis at launch (32K students, not the open internet), but it will become one as the platform grows. Building the infrastructure now prevents technical debt.

**Effort:** Medium (4-5 days). Need: behavioral analysis middleware, cross-space message deduplication, trust-based rate limit tiers, auto-action triggers, spam pattern dashboard for admins.

**Tradeoffs:** Overly aggressive spam detection catches legitimate power users (student org leaders who post announcements to multiple spaces). Counter: trust-based tiers give established users more latitude. Cross-space posting by admins/owners is exempt.

---

### 12. Moderator Report on Space Leaders

**Problem:** What happens when the problem is the leader? A space owner who is the one harassing members, or a fraternity president using the space to coordinate hazing. Current moderation assumes leaders are the solution. Sometimes they are the problem.

**Shape:** A "Report this space's leadership" flow that bypasses the space's own moderation team and routes directly to platform administration. Available from the space info panel, distinct from standard content reports. Categories: abuse of moderator power, leader misconduct, organizational policy violation, hazing/initiation concerns. Reports in this category are automatically elevated to critical severity. Platform admins can: investigate (access full space audit trail), warn the leader, transfer ownership, put the space in supervised mode (all moderation actions require platform review), or shut down the space.

**Wedge:** This is the mechanism that makes HIVE trustworthy for Greek life, which is simultaneously the highest-risk and highest-value segment. "Students can anonymously report leadership concerns, and we investigate" is a sentence that Greek life advisors need to hear.

**Impact:** High (institutional trust). Low frequency, high consequence.

**Effort:** Medium (3-5 days). Need: leadership report flow (separate from content reports), platform-level investigation queue, supervised mode flag on spaces, ownership transfer flow, space shutdown mechanism.

**Tradeoffs:** Could be weaponized by rival organizations. Counter: these reports are reviewed by platform administrators, not automated. Pattern detection: multiple reports from the same small group about a rival org gets flagged as potential coordination.

---

### 13. Transparency Report & Moderation Stats

**Problem:** Trust requires transparency. Students need to know that moderation is fair and consistent. Universities need to know the system works. "Trust us" is not enough.

**Shape:** A public-facing quarterly transparency report showing: total reports received, breakdown by category, percentage resolved, average resolution time, actions taken (warnings, suspensions, bans), appeal outcomes. No individually identifiable data. Accessible at `/transparency`. Internal version for university partners adds: reports by space type, comparison to peer institutions (when multi-campus), moderator activity metrics. Space-level mini-reports for leaders: "Your space received X reports this quarter, Y% below average for spaces your size."

**Wedge:** No competitor does this at the campus level. Discord publishes global transparency reports. HIVE publishing campus-specific data (anonymized) demonstrates institutional partnership, not just product adoption.

**Impact:** Medium. Builds long-term trust. Most users will never read it, but its existence signals accountability.

**Effort:** Small-Medium (2-4 days). Need: aggregation queries, static page with charts, admin dashboard for university partners, quarterly generation script.

**Tradeoffs:** Transparency about moderation failures could be embarrassing. Counter: not publishing is worse. Showing improvement over time is the narrative ("Resolution time decreased 40% this quarter").

---

### 14. Emergency Alert System

**Problem:** Some situations require immediate platform-wide or space-wide communication: active threat on campus, severe weather, critical safety incident. HIVE has 32K potential users. If it becomes the platform students use daily, it needs to be a channel for urgent safety communication.

**Shape:** An admin-only "Emergency Alert" capability that pushes a banner notification to all active users (campus-wide) or all members of a specific space. Alert types: Campus emergency (red), Safety advisory (orange), Important notice (yellow). Alerts pin to the top of every page until dismissed or expired. Push notification to mobile (when available). Configurable: who can send (campus admin, designated safety officials). Requires confirmation ("This will notify X,XXX users. Proceed?"). Logged with full audit trail.

**Wedge:** This transforms HIVE from "student social platform" to "campus safety infrastructure." If HIVE is where students get emergency alerts faster than the university's own systems, that is an institutional dependency that creates an existential moat.

**Impact:** High (institutional), Low (daily usage). The value is in being ready, not in frequent use.

**Effort:** Medium (4-5 days). Need: alert creation API (admin only), banner component with priority styling, push notification integration, alert management dashboard, audit logging.

**Tradeoffs:** Alert fatigue if overused. Counter: strict access control (only designated campus safety officials), usage analytics to detect overuse, "test alert" capability for drills.

---

### 15. Behavioral Trust Score (Reputation System)

**Problem:** The `trustScore` field exists on user profiles but is not meaningfully computed or used. Currently, it slightly adjusts report severity weighting. A robust trust score could power dozens of platform behaviors: rate limits, moderation queue priority, feature access, search ranking.

**Shape:** A composite trust score (0-1.0) computed from: account age, activity consistency (regular usage vs. bursts), moderation history (strikes decrease score, clean record increases it), report accuracy (did their reports lead to action?), leadership quality (spaces they lead have low report rates), community standing (are they flagged frequently by others?). Score updates daily via background job. Used for: rate limit tiers, report credibility weighting, feature gating (low-trust users cannot create spaces), search ranking boost, moderator dashboard context. Transparent to the user as a general "standing" indicator (Good Standing / Under Review / Restricted) without exposing the raw score.

**Wedge:** This is the mechanism that makes real identity compound into real trust. Over time, a student's trust score becomes a valuable asset -- something they do not want to lose. This creates the behavioral incentive that replaces the need for heavy-handed moderation. The moat: this trust score only exists because of HIVE's verified identity + behavioral data over time. Competitors cannot replicate it without the same foundation.

**Impact:** High (long-term). The trust score is infrastructure that amplifies every other moderation feature. It makes spam detection smarter, report triage faster, and user behavior better.

**Effort:** High (7-10 days). Need: score computation service, behavioral signal collection, daily recomputation job, trust tier definitions, integration points across rate limiting/reporting/search/feature access, user-facing standing indicator.

**Tradeoffs:** Opaque scores feel unfair ("Why is my score low?"). Counter: user-facing indicator is simplified (Good/Review/Restricted) with clear actions to improve. Gaming: users could game the score by posting frequently. Counter: quality signals (reactions received, report-free activity) weighted more than quantity.

---

## Quick Wins (Ship in Days)

| Feature | Days | Why First |
|---------|------|-----------|
| **Report Flow for Members** | 2-3 | Launch blocker. Backend exists, just needs frontend. |
| **Community Guidelines Page** | 1-2 | Referenced by existing warnings but does not exist. Content writing is most of the work. |
| **Temp Mute UI** | 1-2 | Data model already supports it (`isMuted`, `muteUntil`). Just needs the button and dialog. |
| **Moderator Role Permissions** | 1-2 | Role exists in data model. Need to wire permission checks and show/hide mod tools based on role. |
| **Block User (Basic)** | 2-3 | Table-stakes safety feature. Simple Firestore collection + query filters. |

---

## Medium Bets (Ship in Weeks)

| Feature | Weeks | Why Now |
|---------|-------|---------|
| **Graduated Response System** | 1-2 | Unifies scattered enforcement data. Makes moderation consistent and defensible. |
| **Space Moderation Settings** | 1-2 | Leaders need control. One-size-fits-all will not work for 500+ spaces. |
| **Anonymous Concern Reporting** | 1-2 | University partnership leverage. Hazing/harassment reporting is the institutional sell. |
| **Moderator Tools (Full Suite)** | 2-3 | Activity log, warnings, new member restrictions. Empowers the 10% of users who keep the other 90% safe. |
| **Anti-Spam Intelligence** | 1-2 | Build before spam arrives. Retroactive spam infrastructure is painful. |
| **Leader Accountability Dashboard** | 2 | Institutional trust. Shows university partners that HIVE takes organizational accountability seriously. |
| **Report on Leadership** | 1 | Critical safety valve. The mechanism that handles the "what if the leader IS the problem" scenario. |

---

## Moonshots (Ship in Months+)

| Feature | Months | Why Later |
|---------|--------|-----------|
| **Pre-Screening Message Filter** | 1-2 | Requires production ML pipeline with low-latency inference. Build after chat volume justifies the infrastructure cost. |
| **Self-Harm Detection & Crisis Routing** | 1-2 | Requires specialized ML tuning, campus partnership setup, legal review of FERPA implications. High stakes demand high confidence. |
| **Behavioral Trust Score** | 2-3 | Needs 3+ months of behavioral data to compute meaningful scores. Build the signals collection now, compute later. |
| **Emergency Alert System** | 1-2 | Requires push notification infrastructure and campus admin integration. Build after HIVE is the daily-use platform. |
| **Transparency Report** | 1 | Needs sufficient moderation data to report on. Publish after first full quarter of operation. |

---

## Competitive Analysis

### Discord

**Moderation approach:** Server-level AutoMod (keyword filters, mention spam, regex rules), role-based permissions, slow mode, member verification levels (email, phone, server membership duration). Community-level bans. No platform-level trust score.

**Strengths:** Highly configurable per-server. Large ecosystem of moderation bots (MEE6, Dyno, Carl-bot). AutoMod is sophisticated for keyword-based filtering.

**Weaknesses:** No real identity -- banned users create new accounts in seconds. Server moderators are volunteers with no accountability. No cross-server moderation coordination. No institutional reporting. Discord's Trust & Safety team handles platform-level reports but response times are days/weeks.

**What HIVE can learn:** Discord's per-server moderation settings are the right model. AutoMod's configurable rules (not just keywords, but patterns like "messages with too many mentions" or "messages with links from new members") are smart. Bot ecosystem solves scale -- HIVE should consider moderation automations that serve the same role.

**Where HIVE wins:** Real identity makes enforcement permanent. Campus isolation means moderation context is richer. Institutional partnership means HIVE can route reports to people with real authority (Dean of Students, not a volunteer Discord mod).

### Reddit

**Moderation approach:** Subreddit-level moderation by volunteer mods. AutoModerator for rule-based filtering. Karma system as implicit trust score. Admin-level Trust & Safety for platform violations.

**Strengths:** AutoModerator is extremely flexible (regex, account age requirements, karma thresholds). Community-specific rules work well. Karma provides lightweight reputation.

**Weaknesses:** Moderator burnout is endemic. No compensation, no accountability. Power-tripping moderators are a meme for a reason. Karma is easily gamed. Anonymous accounts mean ban evasion is trivial. No institutional connection.

**What HIVE can learn:** AutoModerator's rule syntax is a good reference for space-level automation rules. Reddit's approach of letting communities set their own norms (within platform rules) is correct. Account age and karma thresholds for actions (posting, commenting) map to HIVE's trust score concept.

**Where HIVE wins:** No anonymity means accountability is real. Leader accountability dashboard gives visibility that Reddit lacks. Graduated response is better than Reddit's binary (ban or not).

### Facebook Groups

**Moderation approach:** Group-level moderation by admins. Admin Assist (automated rules for membership questions, post approval, keyword filtering). Reporting to Facebook Trust & Safety. AI-based content screening.

**Strengths:** AI content screening at scale is best-in-class. Admin Assist automates common moderation tasks. Membership questions create friction that filters low-quality joiners.

**Weaknesses:** Scale means slow response times. Real identity exists but enforcement is inconsistent. Groups are semi-anonymous (you have a Facebook profile but group behavior is loosely connected to real-world identity). University-specific context is nonexistent.

**What HIVE can learn:** Admin Assist's pattern of "set rules, let automation enforce" is the right UX for space leaders. Membership questions before joining could work for approval-based spaces. Facebook's content screening infrastructure is the gold standard for scale.

**Where HIVE wins:** Campus context means every user is verifiable. Facebook Groups have no concept of "this user is a sophomore CS major who leads two other clubs" -- HIVE does. Institutional partnership is impossible on Facebook.

### University Title IX Offices

**Moderation approach:** Formal complaint process. Trained investigators. Legal framework (Title IX, Clery Act, FERPA). Documented, appealable processes. Mandatory reporters.

**Strengths:** Legal authority. Trained professionals. Documented procedures. Consequences that matter (expulsion, organizational sanctions).

**Weaknesses:** Slow (investigations take weeks/months). Intimidating (formal legal process). Underreported (students do not want to "ruin someone's life" with a formal complaint). No digital-native reporting. No real-time intervention capability.

**What HIVE can learn:** The graduated, documented, appealable process is the right framework. Title IX offices want to know about problems earlier, before they escalate to formal complaints. HIVE can be the early warning system.

**Where HIVE wins:** HIVE can route anonymous concerns to Title IX offices faster than any existing process. HIVE's behavioral data (message content, report patterns) provides evidence that Title IX offices currently lack. Real-time intervention (hiding content, muting users) prevents harm while investigations proceed.

---

## Wedge Opportunities

### 1. "The Platform Your Dean of Students Trusts"

The biggest wedge is institutional trust. Every university administration worries about: hazing (especially Greek life), sexual harassment, discrimination, mental health crises. HIVE can be the platform that addresses these concerns structurally rather than asking administrators to trust students to self-moderate.

**Concrete pitch to university:** "HIVE gives your students a platform with real identity verification, anonymous concern reporting that routes to your office, AI-powered content screening, and quarterly transparency reports on community health. Here is what is happening on your campus that you cannot currently see."

### 2. "Greek Life That Can Prove It Is Doing the Right Thing"

Greek organizations are under existential pressure from universities to demonstrate anti-hazing compliance. A chapter that uses HIVE with moderation tools enabled can produce documentation: "Zero hazing reports this semester. Content screening active. All members verified students." This is a compliance artifact that no other platform provides.

**Concrete pitch to Greek life advisors:** "Chapters that use HIVE have auditable moderation records. You can see which chapters are using safety tools and which are not."

### 3. "The Report Button That Actually Does Something"

On Discord and GroupMe, reporting goes into a void. Students learn that reporting is pointless. HIVE can differentiate by closing the loop: reports get acknowledged, resolved, and the reporter is notified of the outcome (without revealing what action was taken against the reported user). Building a reputation for responsive moderation creates trust that compounds.

**Concrete pitch to students:** "When you report something on HIVE, a real person reviews it within 24 hours. You will hear back."

### 4. "Safety Is Not Surveillance"

The tension between safety and surveillance is real. Students will resist a platform that feels like it is watching them. The wedge: position safety tools as things that protect the user, not monitor them. Block is user empowerment. Anonymous reporting is whistleblower protection. Crisis detection is care. Content screening is spam prevention, not speech policing.

**Concrete framing:** "You control your experience. Block who you want. Report what concerns you. We keep the platform clean so you can focus on belonging."

---

## Open Questions

1. **Who moderates the moderators?** Space leaders assign moderator roles. What prevents a leader from making their friend a moderator who then mutes everyone who disagrees with them? Does HIVE need a "report moderator abuse" mechanism separate from "report leadership"?

2. **What is HIVE's relationship to law enforcement?** If content indicates an imminent threat (shooting threat, bomb threat), does HIVE have a legal obligation to report? What is the escalation path? Does the platform need a "law enforcement data request" process before launch?

3. **How does moderation work during the cold start?** With 50-100 users, there are no volunteer moderators. Who reviews reports in the first weeks? Is it the HIVE team? At what user count does community moderation become viable?

4. **How does the Greek life problem scale?** Greek chapters are high-value (active, engaged, tight-knit) but high-risk (hazing, exclusion, alcohol). Is HIVE's moderation system robust enough to handle the most contentious space type on campus? Does Greek life need special moderation defaults?

5. **What happens when HIVE is evidence in a Title IX case?** If a student files a Title IX complaint and HIVE messages are relevant, how does HIVE respond to a data preservation request? Does the platform need litigation hold capability?

6. **Should space leaders be mandatory reporters?** If a space leader sees content indicating harm and does nothing, is HIVE complicit? Should leaders have obligations beyond "moderate your space"?

7. **What about private messages?** DMs are flagged as a feature-flagged future feature. Private 1:1 messages are the highest-risk channel for harassment. Does HIVE screen DMs? If not, how does it handle reports about private conversations? If yes, how does it balance privacy?

8. **Cultural context in moderation.** At a campus with 32K students, cultural norms vary widely. What is "harassment" in one community is "banter" in another. How does the ML system handle cultural context? Who decides where the line is?

9. **What happens to a banned user's content?** If a student is banned, do their historical messages disappear from all spaces? Do spaces they created transfer ownership or shut down? What about tools they built in HiveLab?

10. **Moderation across academic vs. social contexts.** A heated debate in a Political Science space might look like "harassment" to an ML model. A chemistry club discussing explosive compounds might trigger threat detection. How does the system account for academic context?

11. **The dual loyalty problem.** HIVE serves students but partners with universities. When a student reports something that reflects badly on the university (systemic discrimination in a university-affiliated space), whose side is HIVE on? How is this resolved structurally, not ad hoc?

12. **Moderation labor and burnout.** Even with AI assistance, someone has to review flagged content. At 32K users sending thousands of messages daily, the moderation queue could be overwhelming. What is the moderator support system? Is there a plan for compensating community moderators?
