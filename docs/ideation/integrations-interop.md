# Integrations & Interop

> How HIVE connects to the outside world. The strategic question underneath every integration: does this make HIVE more indispensable, or more replaceable?

---

## Current State

HIVE today is a **closed system**. Almost zero integration surface exists.

**What exists:**
- `socialLinks` field on Space data model (Instagram, Twitter, LinkedIn, YouTube, Facebook, website) -- stored but only rendered as outbound links in space header
- `.edu` email verification for campus identity -- the only inbound university system bridge
- Ghost Spaces pre-seeded from CampusLabs data -- one-time import, no ongoing sync
- No calendar sync, no LMS bridge, no payment integration, no embed API
- No import/export for any user data, tool data, or space data
- Link previews: none (plain text URLs in chat)
- Sharing: URLs are shareable by design (`/s/[handle]`) but no Open Graph metadata, no rich previews on iMessage/Instagram/GroupMe

**What students actually use at UB (the integration landscape):**

| Tool | Usage | Job | Switching Cost |
|------|-------|-----|----------------|
| GroupMe | 95% of orgs | Group chat, quick coordination | Very high -- entire social graph lives here |
| Instagram | 90% of orgs | Public face, event promotion, recruitment | Low for HIVE (different job) |
| Google Calendar | 70% of students | Personal scheduling | Medium -- muscle memory |
| Canvas (LMS) | 100% of students | Coursework, deadlines, grades | Zero (university-mandated) |
| When2Meet | 60% of orgs | Availability polling | Low -- throwaway tool |
| Google Forms | 80% of orgs | Surveys, signups, applications | Low -- data portability |
| Venmo | 70% of orgs | Dues, event payments | Medium -- payment network effects |
| Google Drive | 75% of orgs | Document collaboration | Medium -- accumulated content |
| Slack/Discord | 15% of orgs | Chat for tech/gaming clubs | Medium -- channel history |
| Linktree | 40% of orgs | Link aggregation | Zero |

**The brutal truth:** Students have 10+ tools they already use. HIVE isn't replacing any of them on day one. The question is whether HIVE becomes the connective tissue between them, or the replacement for a subset of them.

---

## The Opportunity

### The Integration Paradox

Every integration makes HIVE more useful but potentially less necessary. If HIVE syncs perfectly with Google Calendar, why open HIVE to check your schedule? If GroupMe messages flow into HIVE, why move the conversation?

**The resolution:** HIVE should integrate where it creates *new value* that the source tool cannot provide. Pulling Calendar data in is useful because HIVE adds campus context (who else from your spaces is going). Mirroring GroupMe is useless because it doesn't add anything.

### Three Strategic Modes

**1. Replace (own the workflow)**
- When2Meet -> HIVE availability polls (strictly better with identity)
- Google Forms -> HiveLab form tools (strictly better with space context)
- Linktree -> Space profile page (strictly better with live activity)

**2. Connect (bridge the data)**
- Google Calendar -> HIVE events (two-way sync, campus overlay)
- Canvas deadlines -> HIVE awareness (academic context)
- Instagram -> Space header embed (public face linked to operational core)

**3. Enhance (add what they can't)**
- GroupMe link -> HIVE space (see who's talking about what, across orgs)
- Venmo request -> HIVE dues tracker (payment status as membership signal)
- Canvas groups -> HIVE study spaces (auto-create from enrollment)

### The Core Insight

Students don't want fewer tools. They want to stop context-switching. HIVE wins not by replacing everything, but by being the **one place you check first** because it aggregates context from everywhere else.

The metaphor: HIVE is not the replacement. HIVE is the dashboard.

---

## Feature Ideas

### 1. Calendar Sync (Google Calendar Two-Way)

**Problem:** Space events exist only inside HIVE. Students live in Google Calendar. If the event isn't on their calendar, they don't show up. Leaders create events in both places -- double the work.

**Shape:**
- When a space event is created, offer "Add to Google Calendar" (one-click, no auth required -- generates `.ics` link)
- With Google OAuth: two-way sync. HIVE events appear on Google Calendar. Google Calendar events can be pulled into a space.
- Space calendar view overlays academic calendar (finals, breaks, registration deadlines) pulled from university public feeds.
- "Busy/free" overlay when creating events: "12 of 47 members are free at this time" (requires calendar read permission).

**Wedge:** The leader who creates an event and immediately sees "only 3 members are free then" changes the time before anyone RSVPs. That's value on first use.

**Impact:** High. Calendar is table stakes for any productivity-adjacent tool. Without it, HIVE events are invisible.

**Effort:** Medium. Google Calendar API is well-documented. `.ics` export is trivial. Two-way sync is the complex part (conflict resolution, recurring events).

**Tradeoffs:**
- Google OAuth adds friction to onboarding. Offer `.ics` as the zero-auth path first.
- Two-way sync creates state management complexity. Who wins when an event is edited in both places?
- Privacy: reading member calendars to show availability requires explicit consent per-user.
- If calendar sync is too good, students never need to open HIVE to check events.

---

### 2. Canvas/LMS Academic Bridge

**Problem:** Every UB student is on Canvas 5x/day. Assignment deadlines, group projects, class schedules -- none of this context exists in HIVE. A "Pre-Med Society" space has no idea when Organic Chemistry has its midterm, even though half its members are affected.

**Shape:**
- Read-only Canvas integration via LTI or Canvas API. Pull: course list, assignment deadlines, enrolled students.
- "Academic Pulse" widget in spaces: show upcoming deadlines for courses most members share. "8 members have Orgo midterm Thursday."
- Auto-suggest study spaces: "14 people in CS 214 are on HIVE. Create a study space?" Auto-populated from Canvas enrollment.
- Finals countdown: system-wide countdown sourced from registrar calendar, not manually entered.
- Canvas assignment groups -> HIVE tool templates. "Your group project team" -> auto-created HIVE space with relevant tools.

**Wedge:** The study group that forms because HIVE noticed 14 people share the same class and midterm is next week. That never happens on Canvas alone.

**Impact:** Very high. This is the university moat. Discord/Slack cannot do this because they don't have enrollment data.

**Effort:** High. Canvas LTI integration requires university IT partnership. LTI 1.3 is complex. Canvas API has rate limits and requires institutional approval.

**Tradeoffs:**
- Requires university IT buy-in. Political, not technical.
- FERPA compliance: student enrollment data is protected. Cannot show "Alex is in your Orgo class" without consent.
- If Canvas integration is the killer feature, HIVE becomes dependent on university cooperation -- fragile at multi-campus scale.
- Canvas API may not expose everything needed (group membership, real-time grades are restricted).

---

### 3. GroupMe Migration Bridge

**Problem:** GroupMe owns the campus group chat graph. Every org has a GroupMe. Moving 200 people to a new chat app is nearly impossible. The last 5% who won't switch keep everyone on GroupMe.

**Shape:**
- Not a migration. A bridge. "Connect your GroupMe" links a GroupMe group to a HIVE space.
- Phase 1: Read-only mirror. GroupMe messages appear in a "GroupMe" board inside the HIVE space. Context only -- you can see what's happening without opening GroupMe.
- Phase 2: Post from HIVE to GroupMe. Leaders can broadcast announcements to both simultaneously.
- Phase 3: Gradual migration. "This conversation is happening in HIVE" link posted to GroupMe when someone starts a thread in HIVE. Pull people over organically.
- Never force migration. Let HIVE become the better place, and let GroupMe become the notification layer.

**Wedge:** The leader who can post once and reach both GroupMe and HIVE stops worrying about which platform people are on.

**Impact:** High. GroupMe is the #1 competitor by usage. Not beating it -- bridging it -- is the pragmatic play.

**Effort:** High. GroupMe API is limited (no official bot API for groups, only direct messages). May require unofficial workarounds or a "paste your GroupMe link" approach rather than true API integration.

**Tradeoffs:**
- GroupMe's API is restrictive. True two-way sync may not be feasible.
- Bridging reduces pressure to move. If everything works through GroupMe, why switch?
- Mirror creates phantom activity -- messages from GroupMe inflate HIVE engagement metrics but aren't real HIVE usage.
- Legal risk: unofficial API usage violates GroupMe ToS.
- Alternative: don't bridge GroupMe at all. Instead, make HIVE so good for the leader workflow that leaders naturally shift coordination to HIVE, and GroupMe becomes the "announcement blast" channel.

---

### 4. Rich Link Previews & Social Embeds

**Problem:** Links pasted in HIVE chat are plain text. No previews, no context. Pasting an Instagram post, a YouTube video, a Google Doc, or a Spotify link looks the same as any other URL. Chat feels primitive compared to iMessage or Slack.

**Shape:**
- Server-side Open Graph / oEmbed fetching. When a URL is posted in chat, HIVE fetches metadata and renders a preview card.
- Instagram posts: show image + caption inline.
- YouTube: show thumbnail + title, play inline.
- Google Docs: show title + last edited, one-click open.
- Spotify: show track/playlist embed.
- HIVE-to-HIVE: `/s/ubconsulting` links render as rich space cards with member count and online status.
- Event links render as RSVP-able cards inline.

**Wedge:** The first time someone pastes a YouTube link and it plays inline, the chat stops feeling like a toy.

**Impact:** Medium-high. Quality-of-life improvement that affects every chat interaction. Makes HIVE feel polished.

**Effort:** Low-medium. Open Graph fetching is well-solved. oEmbed for major platforms is standardized. Custom embeds for HIVE-to-HIVE links require internal resolver.

**Tradeoffs:**
- Link preview fetching adds latency to message rendering. Must be async with placeholder shimmer.
- Some sites block server-side fetching (Instagram requires authentication for some content).
- Security: fetching arbitrary URLs from server opens SSRF risk. Allowlist domains or use a proxy service.
- Storage: caching preview metadata adds to Firestore document size per message.

---

### 5. Event Sharing & Open Graph

**Problem:** When a student texts a HIVE event link to a friend, iMessage/Instagram/GroupMe shows a bare URL. No image, no title, no RSVP count. Compare to Eventbrite links which show rich cards with event details.

**Shape:**
- Dynamic Open Graph tags on every shareable page: `/s/[handle]`, `/s/[handle]?view=events&id=123`, `/u/[handle]`.
- Event OG card: event title, date/time, space name, RSVP count ("47 going"), space avatar.
- Space OG card: space name, member count, online count, description snippet.
- Profile OG card: display name, avatar, spaces joined, role.
- Generate OG images dynamically (Vercel OG or `@vercel/og`). HIVE-branded cards that look good when shared on any platform.
- "Share to Instagram Story" button on events: generates a story-sized image with event details and QR code linking to HIVE.

**Wedge:** Every shared link becomes a recruitment tool. "47 going" creates FOMO without any effort from the sharer.

**Impact:** High. Distribution baked into the product. Every text message, Instagram story, and GroupMe paste becomes an ad for HIVE.

**Effort:** Low. Next.js `generateMetadata` supports dynamic OG tags natively. `@vercel/og` generates images at edge. Straightforward implementation.

**Tradeoffs:**
- Dynamic OG image generation adds to Vercel edge function usage/cost.
- OG tags must be server-rendered (no client-side routing for crawlers). Already handled by Next.js App Router.
- Instagram Story sharing requires generating a downloadable image, not a link. Different flow.
- Risk of OG tag caching: platforms cache aggressively. Stale RSVP counts in previews.

---

### 6. Venmo/Payment Integration for Dues & Tickets

**Problem:** Every org collects dues. The current flow: Venmo request -> spreadsheet -> manually check who paid -> manually grant access. Space leaders spend hours on this. Meanwhile, students who paid can't prove it, and students who didn't pay slip through.

**Shape:**
- "Dues" tool element in HiveLab. Configure: amount, deadline, payment methods.
- Payment methods, starting simple: "Paste your Venmo payment link" embedded in the tool. HIVE tracks self-reported payments (mark as paid + receipt screenshot upload).
- Phase 2: Venmo API integration. Auto-detect payments by matching Venmo username to HIVE user. Mark as paid automatically.
- Phase 3: Stripe integration for direct payment. HIVE processes the payment. Org gets a payout. No manual reconciliation.
- Payment status as membership signal: "Paid members" badge. Paid members auto-qualify for voting, events, etc.
- Dues tracker connected to other tools: paid members get voting rights in election tools, RSVP priority for capacity-limited events.

**Wedge:** The treasurer who stops maintaining a spreadsheet and starts seeing payment status update in real-time saves 3 hours/week.

**Impact:** Very high. Dues collection is the #1 operational pain point for org leaders. Solving it creates deep lock-in (financial data is sticky).

**Effort:** Medium (self-reported) to Very High (Stripe integration).

**Tradeoffs:**
- Venmo API is limited and requires business account approval. Not available for peer-to-peer detection.
- Stripe adds regulatory burden: KYC for orgs, PCI compliance for HIVE, payout logistics.
- Self-reported payment is gameable (students can claim they paid when they didn't). Needs leader verification.
- Money handling creates liability. What if a payment is lost? What if an org is fraudulent?
- Starting with "link to Venmo" + manual confirmation is the pragmatic MVP. No money touches HIVE's servers.

---

### 7. Import/Export & Data Portability

**Problem:** No way to get data out of HIVE. Members can't export their profile. Leaders can't export member lists, event attendees, or chat history. Tool configs are locked inside the platform. This creates distrust ("what if HIVE shuts down?") and blocks institutional requirements (orgs that need to submit membership reports to the university).

**Shape:**
- Leader exports: member list (CSV), event attendees (CSV), chat history (JSON), tool data (JSON), analytics report (PDF).
- User exports: profile data (JSON), spaces joined (list), tool interactions (JSON). GDPR-style "download my data."
- Tool export/import: export tool configuration as JSON, import to recreate. Enables sharing tool designs outside HIVE.
- University reporting: generate end-of-semester reports for Student Activities office. Member count, event count, engagement metrics. Formatted to match university requirements.
- Bulk import: upload member list (CSV with emails) to invite to space. Upload event list to batch-create events.

**Wedge:** The org president who needs to submit a membership report to Student Activities and can generate it in one click instead of manually counting.

**Impact:** Medium. Not a daily-use feature, but critical for trust and institutional adoption.

**Effort:** Low-medium. CSV/JSON export is straightforward. PDF report generation needs a template.

**Tradeoffs:**
- Easy export reduces lock-in. But refusing export creates distrust and blocks institutional adoption.
- Member data export has privacy implications. Can a leader export members' emails? Needs consent model.
- Chat export could leak private conversations. Needs to be leader-only with clear scope.
- University report format varies by school. Need templating system for multi-campus.

---

### 8. When2Meet Killer (Availability Polling)

**Problem:** When2Meet is used 2-3 times per week by active orgs. Create poll -> share link -> collect responses -> find best time -> manually create event. Four separate tools, five context switches.

**Shape:**
- "Find a Time" tool element in HiveLab. Drag a date range, members fill availability.
- Key difference from When2Meet: HIVE knows who the members are. No anonymous grids. See "Alex (VP) is free Tuesday 2-4pm."
- Auto-suggest best times ranked by: most members free, leader availability weighted higher, avoids conflicts with other space events.
- One-click "Create Event" from the best time slot. Pre-filled with space, attendees, time.
- If Google Calendar is connected: auto-populate availability from calendar. Members don't have to manually fill in -- it's already there.
- Recurring availability: "When are we generally free every week?" Stored and reusable.

**Wedge:** The org that discovers "find a time" works better inside HIVE because it already knows who the members are and what else is happening on campus.

**Impact:** High. Replaces a weekly workflow entirely. Clear "time collapse" -- five tools reduced to one.

**Effort:** Medium. Availability grid UI is the main work. Calendar integration is optional enhancement.

**Tradeoffs:**
- When2Meet is beloved for its simplicity. HIVE version must be equally simple or it loses.
- When2Meet works for non-HIVE users (guests). HIVE version is members-only unless guest access is added.
- Calendar auto-fill requires Google OAuth. Adds friction. Must work without it.
- If the HIVE version is worse than When2Meet, it damages trust in all HIVE tools.

---

### 9. Embeddable HIVE Widgets

**Problem:** Orgs have external websites, Instagram bios, and university portal pages. HIVE content is invisible outside HIVE. An event created in HIVE can't appear on the org's website.

**Shape:**
- Embed API: generate `<iframe>` snippets for any HIVE content.
- Embeddable surfaces: upcoming events widget, member count badge, "Join this space" button, live chat preview (read-only), tool widgets (polls, RSVPs).
- Branded embed cards: HIVE-styled but customizable (light/dark, accent color matches org brand).
- "Powered by HIVE" watermark on free tier. Removable for verified orgs.
- Auto-updating: embeds show live data. Event RSVP count updates in real-time on external site.
- QR codes: generate QR code for any HIVE page. Print-ready for posters, tabling events, flyers.

**Wedge:** The org that puts a "Join on HIVE" widget on their university portal page and sees signups without any manual effort.

**Impact:** Medium-high. Distribution play. Every embed is an on-ramp to HIVE.

**Effort:** Medium. Requires a separate embed rendering pipeline (no auth, read-only, minimal JS bundle). QR codes are trivial.

**Tradeoffs:**
- Embeds without auth means anyone can view content. Privacy implications for private spaces.
- Embed bundle size must be tiny. Cannot ship the full HIVE React app in an iframe.
- Embeds on third-party sites are outside HIVE's control. Broken embeds look bad.
- If embeds are too good (full event RSVP from external site), users never need to visit HIVE itself.

---

### 10. Instagram as Public Face Integration

**Problem:** Instagram is how orgs recruit. Beautiful posts, stories, reels. But Instagram has zero operational capability. The gap between "cool Instagram post about our event" and "actually RSVP and show up" is massive. Links in bio go to Linktree. Linktree links go to Google Forms. Forms don't connect to anything.

**Shape:**
- "Instagram Feed" element in space header or sidebar. Pull recent posts via Instagram Basic Display API. Show the org's public face inside their HIVE space.
- Replace Linktree: HIVE space page IS the link-in-bio destination. `/s/ubconsulting` shows: upcoming events, join button, recent activity, tools. Everything Linktree does, but alive.
- "Share to Instagram" story generator: create branded story image from any HIVE event or tool. Includes QR code to HIVE page.
- Instagram post -> HIVE event pipeline: when an org posts about an event on Instagram, auto-create a matching HIVE event (manual trigger, not automatic -- leader confirms).
- Follower count as social proof: show Instagram follower count on space card as credibility signal.

**Wedge:** The org president who changes their Instagram bio link from Linktree to their HIVE space and gets better conversion because the page is alive.

**Impact:** Medium. Instagram is a recruitment channel, not an operational one. Integration adds credibility and distribution, not core workflow value.

**Effort:** Medium. Instagram Basic Display API is straightforward for public posts. Story generation is image rendering.

**Tradeoffs:**
- Instagram API is restrictive and changes frequently. Meta has deprecated APIs before.
- Pulling Instagram content into HIVE might reduce visits to Instagram, which orgs care about (follower growth).
- Instagram integration could feel gimmicky if it's just an embedded feed. Must add value beyond display.
- Not all orgs have Instagram. Some have Twitter/TikTok. Supporting one creates "where's TikTok?" pressure.

---

### 11. University SSO & Directory Bridge

**Problem:** HIVE uses .edu email + OTP for auth. University IT has SSO (Shibboleth/SAML/CAS) that students already use for everything. Every extra login step is friction. University directory has verified name, major, year, enrollment status -- HIVE asks students to self-report this.

**Shape:**
- SAML/CAS SSO integration. "Sign in with UB" button. One-click auth for students already logged into university systems.
- Pull verified identity from university directory: legal name, major, expected graduation year, enrollment status (active/graduated/withdrawn).
- Enrollment verification: auto-detect when a student graduates or withdraws. Transition them to alumni status automatically.
- Department/major as first-class data: enable "spaces for my major" discovery without self-reported interest matching.
- Faculty/staff distinction: university directory distinguishes students, faculty, staff. Enable different roles in HIVE.

**Wedge:** The university admin who sees "verified enrollment data" and stops worrying about fake accounts or non-students accessing campus resources.

**Impact:** High for institutional adoption. Medium for student experience (students don't love SSO, they tolerate it).

**Effort:** High. SAML integration is complex. Requires per-university configuration. Shibboleth is painful. Each campus is a custom integration.

**Tradeoffs:**
- SSO requires university IT partnership. Political dependency.
- University directory data is PII. Storage and handling must be FERPA-compliant.
- SSO means HIVE depends on university infrastructure. If UB's SSO is down, HIVE is down.
- Self-reported data (current system) gives students agency. University data may be stale (wrong major, outdated year).
- SSO is expected at scale but overkill for a single-campus launch. .edu email + OTP is sufficient for UB.

---

### 12. Google Forms / Typeform Response Aggregation

**Problem:** Orgs collect data through Google Forms (applications, feedback, interest forms). Responses live in a spreadsheet that one person manages. Space leaders can't see response data inside HIVE where they manage everything else.

**Shape:**
- "Connect a Google Form" in space settings. OAuth to Google, select a form, link to space.
- Response summary widget: show response count, latest responses, basic analytics (without exposing individual responses).
- Form response -> HIVE action triggers: "When someone submits the application form, add them to the applicant board."
- Eventually: HiveLab form builder replaces Google Forms entirely. Import existing Google Form structure into a HiveLab tool.
- Response data stays in Google. HIVE shows aggregated views and triggers actions. No data duplication.

**Wedge:** The rush chair who connects their recruitment interest form and sees "47 submissions this week" in their HIVE dashboard instead of checking a spreadsheet.

**Impact:** Medium. Useful for leaders but not a daily interaction for most members.

**Effort:** Medium. Google Sheets/Forms API is well-documented. OAuth adds complexity.

**Tradeoffs:**
- Google OAuth for Forms is a separate scope from Calendar. Multiple consent prompts.
- Showing individual form responses in HIVE may violate respondent expectations (they submitted to Google, not HIVE).
- If HiveLab forms become good enough, this integration becomes unnecessary. Build the bridge or build the replacement?
- Aggregation without individual data limits usefulness. Leaders often need to see specific responses.

---

### 13. HIVE API (Platform Play)

**Problem:** HIVE has no public API. Third-party developers, university IT departments, and power users can't build on top of HIVE. Every integration must be built by the HIVE team.

**Shape:**
- REST API with OAuth2 authentication. Scoped access tokens.
- Read endpoints: spaces, members, events, tools, user profiles (respecting privacy settings).
- Write endpoints: create events, post messages, update tool state, manage members.
- Webhooks: subscribe to events (new member, new message, event created, tool deployed).
- API keys for server-to-server (university IT systems). OAuth for user-facing apps.
- Rate limits: 1000 req/hour for free, 10000 for verified partners.
- Developer portal: API docs, SDKs (JavaScript, Python), example integrations.

**Wedge:** The CS student who builds a Discord bot that cross-posts HIVE events to their gaming server. That student becomes a HIVE evangelist.

**Impact:** Long-term very high. APIs create ecosystems. Short-term low -- most users don't care about APIs.

**Effort:** Very high. API design, authentication, rate limiting, documentation, SDKs, developer portal, versioning.

**Tradeoffs:**
- APIs are expensive to maintain and hard to deprecate.
- Public API exposes data to scraping. Privacy and security implications.
- API without developers is wasted effort. Need community before platform.
- Premature platformization distracts from core product.
- Start with webhooks (outbound) before full API (inbound). Lower risk, still enables integrations.

---

### 14. Shared Academic Calendar Overlay

**Problem:** Every student juggles: class schedule, org events, campus events, assignment deadlines, personal commitments. These live in 4+ different systems. No single view shows "what's happening in my life this week?"

**Shape:**
- Combined calendar view at `/calendar` (already in product map, not built).
- Layers: HIVE space events (auto), academic calendar (university feed), class schedule (Canvas import or manual), personal (Google Calendar sync).
- "Conflict detection" across layers: "You have an exam at 2pm and a club meeting at 2pm" warning.
- Campus-wide events: university events office feed (commencement, career fairs, football games) as a public layer.
- "This week on campus" digest: weekly email or in-app summary combining all calendar layers.
- Filter by: my spaces only, all campus, academic only, social only.

**Wedge:** The student who checks one calendar and sees everything -- class, clubs, campus, personal -- stops missing events.

**Impact:** High. Calendar is the closest thing to a daily-use feature HIVE can own.

**Effort:** High. Multi-source calendar aggregation with conflict detection is complex. Depends on Calendar Sync (#1) and Canvas Bridge (#2).

**Tradeoffs:**
- Depends on other integrations being built first. Not standalone.
- Google Calendar already aggregates multiple calendars. HIVE's version must add campus context that Google can't.
- Calendar UI is hard to get right on mobile. Full-featured calendar apps took years to refine.
- If the calendar is too good, it becomes the product. Is HIVE a calendar app or a community platform?

---

### 15. Attendance & Check-In System

**Problem:** Orgs track attendance for: university reporting, participation points, event capacity. Current flow: paper sign-in sheets, Google Forms with timestamps, manual head counts. Data is scattered and unreliable.

**Shape:**
- "Check-In" tool element in HiveLab. Deploy to any event. Members check in via: QR code scan, tap button in HIVE, NFC tap (future).
- QR code displayed on leader's phone or projected at event. Scan with phone camera -> opens HIVE -> one-tap check-in.
- Attendance history per member: "Alex has attended 8 of 12 meetings this semester."
- Attendance requirements: "Must attend 80% of meetings to vote in elections." Auto-enforced by connecting attendance tool to election tool.
- Export attendance reports: CSV for university Student Activities office.
- Location verification (optional): check-in only works within geofence of event location. Prevents remote check-ins.

**Wedge:** The org required by the university to submit attendance records who can generate the report in one click instead of transcribing paper sign-in sheets.

**Impact:** High for leader workflow. Medium for member experience.

**Effort:** Medium. QR code generation is trivial. Check-in tool element fits HiveLab architecture. Geofencing adds complexity.

**Tradeoffs:**
- Location tracking is privacy-sensitive. Must be opt-in per event, not default.
- QR codes can be shared (someone not present sends a photo of the QR to a friend). Time-rotating QR codes mitigate this.
- Attendance tracking feels surveillance-y if poorly framed. Position as "proof of participation" not "monitoring."
- Requires leaders to actively manage the check-in during events. Extra cognitive load.

---

## Quick Wins (ship in days)

| Feature | Effort | Impact | Dependencies |
|---------|--------|--------|--------------|
| **Open Graph tags on all pages** | 1-2 days | High distribution value | None. Next.js `generateMetadata` already in stack. |
| **`.ics` calendar export** | 1 day | Table stakes | Add "Add to Calendar" button on event cards. No OAuth needed. |
| **Rich link previews in chat** | 2-3 days | Polish multiplier | Open Graph fetch service. Allowlist approach for security. |
| **QR code generation for spaces/events** | 1 day | Distribution for offline | QR library + dynamic URL encoding. |
| **CSV export for member lists** | 1 day | Leader trust builder | Existing member data, add download route. |
| **HIVE-to-HIVE rich cards** | 2 days | Internal UX upgrade | When `/s/[handle]` is pasted in chat, render a space preview card. |

---

## Medium Bets (ship in weeks)

| Feature | Effort | Impact | Dependencies |
|---------|--------|--------|--------------|
| **When2Meet replacement** | 2-3 weeks | Replaces weekly workflow | New HiveLab element. Availability grid UI. |
| **Event sharing story generator** | 1-2 weeks | Distribution via Instagram | Image generation (Vercel OG or canvas). |
| **Embeddable widgets** | 2-3 weeks | External distribution | Separate embed renderer. Auth-free read-only API. |
| **Google Calendar two-way sync** | 3-4 weeks | Table stakes for power users | Google OAuth. Conflict resolution logic. |
| **Attendance check-in tool** | 2-3 weeks | Leader workflow win | QR generation. New HiveLab element. Location optional. |
| **Dues tracker (manual confirmation)** | 2 weeks | #1 leader pain point | New HiveLab element. Payment status as membership signal. |
| **University reporting exports** | 1-2 weeks | Institutional adoption | PDF generation. Template per university. |

---

## Moonshots (ship in months+)

| Feature | Effort | Impact | Dependencies |
|---------|--------|--------|--------------|
| **Canvas/LMS bridge** | 3-6 months | University moat | IT partnership. LTI 1.3 implementation. FERPA compliance. |
| **University SSO** | 2-3 months | Institutional trust | SAML/CAS per campus. University IT cooperation. |
| **HIVE Public API** | 4-6 months | Platform ecosystem | API design, auth, docs, SDKs, developer portal. |
| **Stripe payment integration** | 3-4 months | Revenue opportunity | KYC, PCI compliance, payout infrastructure. |
| **GroupMe bridge** | 2-3 months | Migration strategy | GroupMe API limitations. May not be technically feasible. |
| **Shared academic calendar** | 2-3 months | Daily-use feature | Depends on Calendar Sync + Canvas Bridge. |
| **Full Google Workspace integration** | 3-4 months | Document collaboration bridge | Drive API, Docs embed, Sheets connection. |

---

## Competitive Analysis

### Slack

**Integration philosophy:** Become the hub. 2,600+ integrations. Everything posts to Slack.

**What works:**
- `/slash` commands make integrations feel native, not bolted-on.
- Workflow Builder lets non-devs create integrations.
- Incoming webhooks mean any tool can push data to Slack with zero Slack-side code.

**What doesn't translate to HIVE:**
- Slack's integrations serve enterprise workflows (Jira, Salesforce, PagerDuty). Campus tools are different (Canvas, GroupMe, Venmo).
- Slack's API is the product for many teams. HIVE's users don't think in APIs.
- Integration volume is a vanity metric. 10 deeply useful campus integrations beat 2,600 enterprise ones.

**Lesson for HIVE:** Start with incoming webhooks (easy for anyone to push data in) and 5-10 curated campus integrations. Not a marketplace.

---

### Discord

**Integration philosophy:** Bots as citizens. Developer ecosystem first.

**What works:**
- Bots feel like members of the community (avatars, names, presence).
- Bot permissions system is granular and user-controlled.
- Developer community builds integrations Discord never would.

**What doesn't translate to HIVE:**
- Discord's bot ecosystem serves gaming (Dyno, MEE6, music bots). Campus bots are a different category.
- Discord bots require coding. HIVE's leaders are non-technical.
- Bot spam is Discord's #1 quality problem. HIVE can't afford that at campus scale.

**Lesson for HIVE:** If HIVE builds a bot/integration system, it must be no-code first. HiveLab IS the bot builder. Tools ARE bots. The integration surface should be HiveLab elements that connect to external services, not a separate bot framework.

---

### Notion

**Integration philosophy:** Be the system of record. Import everything, export nothing.

**What works:**
- "Import from" is brilliant onboarding. Trello -> Notion, Evernote -> Notion. Reduces switching cost.
- Notion's API is clean and well-documented.
- Embeds work both ways: embed external content in Notion, embed Notion in external sites.

**What doesn't translate to HIVE:**
- Notion is for individuals and small teams. Community scale is different.
- Notion's "import from" targets productivity tools. HIVE's import targets social tools (GroupMe, Instagram).
- Notion is a document editor that became a database. HIVE is a community platform that has tools.

**Lesson for HIVE:** The "import from" pattern is powerful for reducing switching friction. "Import your Google Form responses," "Import your When2Meet availability," "Import your member spreadsheet." Meet users where they are.

---

### Campuswire / Piazza (Academic Platforms)

**Integration philosophy:** University-first. LMS integration is the distribution channel.

**What works:**
- Canvas/Blackboard LTI integration means students discover the tool inside their LMS.
- University IT endorsement provides trust.
- Academic context (courses, enrollment) is built-in.

**What doesn't translate to HIVE:**
- These are classroom tools, not community tools. Different job.
- University dependence means each campus requires a sale. Doesn't scale virally.
- Students use these because they must, not because they want to.

**Lesson for HIVE:** LTI integration is the backdoor into every student's daily workflow. But don't become a university-dependent tool. Use LMS as an awareness channel ("Your classmates are on HIVE"), not as the product itself.

---

## Wedge Opportunities

### Wedge 1: "Add to Calendar" on Every Event
**Cost:** 1 day. **Signal:** If students use it, calendar integration has demand. If not, don't build two-way sync.

### Wedge 2: When2Meet Replacement
**Cost:** 2-3 weeks. **Signal:** If orgs switch their weekly scheduling to HIVE, HIVE has proven it can replace a point tool. Opens door for Google Forms replacement, Linktree replacement, etc.

### Wedge 3: OG Tags + Story Generator
**Cost:** 1 week combined. **Signal:** If shared HIVE links drive signups, the distribution-via-integration thesis is validated. Track: link shares -> new signups conversion.

### Wedge 4: Member Export + University Report
**Cost:** 3-4 days. **Signal:** If leaders immediately request this, institutional compliance is a real blocker. If no one asks, defer university bridge features.

### Wedge 5: Dues Tracker (Manual Venmo Link)
**Cost:** 2 weeks. **Signal:** If orgs adopt it despite manual confirmation, payment workflow is a real pain point. Validates Stripe integration investment later.

### The Master Wedge Sequence:
```
Week 1:  OG tags + .ics export + link previews (polish, distribution)
Week 3:  When2Meet killer + dues tracker MVP (replace point tools)
Week 6:  Google Calendar sync + embeddable widgets (connect to ecosystem)
Week 10: Attendance system + university reports (institutional adoption)
Month 4: Canvas LTI bridge (university moat)
Month 6: API + webhooks (platform play)
```

Each wedge validates the next bet. Don't build Calendar Sync until `.ics` export proves demand. Don't build Canvas Bridge until university reporting proves institutional interest. Don't build the API until internal integrations prove the data model supports it.

---

## Open Questions

### Strategic

1. **Replace vs. Connect vs. Enhance -- which is the default stance?**
   Replacing tools (When2Meet, Google Forms) gives HIVE more surface area but means competing with free, established products. Connecting tools (Calendar sync, Instagram embed) keeps HIVE lightweight but dependent. Enhancing tools (Venmo + dues tracking, Canvas + study groups) creates new value but requires users to use both. Which mode should be the default for the first 10 integrations?

2. **Should HIVE charge for integrations?**
   Calendar sync could be a premium feature. Export could be free-tier. API access could be paid. If integrations are the monetization layer, how does that affect adoption? If integrations are free, what IS the monetization layer?

3. **How much does HIVE depend on Google?**
   Calendar, Forms, Drive, OAuth -- Google is the default integration partner. What happens if Google raises API prices, restricts access, or builds a competing product? Should HIVE diversify integration partners proactively?

### Technical

4. **Where does integration data live?**
   If HIVE pulls Google Calendar events, are they stored in Firestore (fast, but stale) or fetched live (slow, but fresh)? Hybrid cache with TTL? This decision affects every integration architecture.

5. **OAuth consent fatigue: how many Google scopes can we request before users bail?**
   Calendar read + Calendar write + Forms read + Drive read = 4 separate consent screens. Can we bundle? Should we progressive-disclose (request Calendar only when they first use calendar features)?

6. **How do we handle integration failures gracefully?**
   Google API goes down. Canvas returns 500s. Venmo link is broken. Every integration adds a failure mode. What's the error UX? "Calendar sync temporarily unavailable" or silent degradation?

### Product

7. **Does GroupMe migration matter, or is it a distraction?**
   If GroupMe's API doesn't support real bridging, should HIVE invest in the workaround or accept that GroupMe and HIVE coexist? Some orgs will use both forever. Is that acceptable?

8. **Is the academic calendar a HIVE feature or a university feature?**
   If HIVE builds the best campus-wide academic calendar, does the university adopt HIVE for that purpose alone? Is that a good outcome (distribution) or a dangerous one (becomes a utility, not a community)?

9. **At what point does integration effort exceed the benefit of just building it natively?**
   The Google Forms integration takes 3 weeks and bridges imperfectly. Building a native form builder in HiveLab takes 3 weeks and works perfectly. When is "build it" better than "bridge it"?

10. **What's the minimum integration surface for launch?**
    UB launch is imminent. Which 3 integrations are table stakes vs. which 10 are nice-to-have? Proposed minimum: OG tags (distribution), `.ics` export (calendar table stakes), CSV member export (leader trust). Everything else is post-launch.

---

*Generated 2026-02-05. This document explores the integration & interop dimension. Cross-reference with other ideation lenses before making roadmap commitments.*
