# Entry & Onboarding

How students arrive. First 60 seconds. The moment between "what is this" and "I'm in."

---

## Current State

### What Exists

The entry flow is a 4-phase client-side state machine on a single URL (`/enter`):

```
Gate --> Naming --> Field --> Crossing
```

| Phase | Purpose | Data Collected |
|-------|---------|----------------|
| **Gate** | Prove campus membership | Campus email, 6-digit OTP |
| **Naming** | Claim real identity (the wedge) | First name, last name |
| **Field** | Academic context | Graduation year (required), major (optional) |
| **Crossing** | Interest-based discovery | 2-5 interests from 150+ options |

**Narrative arc:** Outsider --> Proven --> Named --> Claimed --> Arrived

**What works:**
- Premium editorial aesthetic (Clash Display, gold accents, void background, noise overlay)
- Smooth framer-motion transitions between phases (<300ms, blur + fade)
- Handle auto-generated from name, checked in real-time with debounce
- OTP with SHA256 hashing, rate limiting, 10-minute TTL, countdown timer
- Browser back button intercepted to navigate within flow
- Auto-join spaces based on major/interests on completion
- Server-provided redirect sends new user to their first space, not `/home`
- Waitlist path for schools not yet on HIVE

**What's missing or broken:**
- No profile photo upload during entry (relies on Gravatar; most students don't have one)
- Major list is ~40 items (should be 200+; many students can't find their field)
- No "undeclared/exploring" option for major
- Handle collision UX functional but jarring (error state, then suggestion list)
- No social proof anywhere in the flow ("you're joining alone" feeling)
- No celebration moment after code verification
- Completion drops user into first space with no orientation
- No terms/privacy acceptance (compliance gap)
- Alumni waitlist works but success state is flat
- schoolId hardcoded to `ub-buffalo`

### Metrics We Don't Have Yet

- Drop-off rate per phase (Gate/Naming/Field/Crossing)
- Time-to-complete (total seconds from email entry to first space)
- Code verification success rate
- Handle collision frequency
- Interest selection distribution
- First-session retention (did they come back within 24 hours?)

---

## The Opportunity

Entry is the highest-leverage surface in HIVE. It's a multiplier on everything downstream.

**The math:** If 1,000 students hit `/enter` and 60% complete the flow, that's 600 users. If entry is so good that 80% complete, that's 200 more users from the same traffic -- and those 200 extra users generate network effects that compound. Every 1% improvement in entry completion rate is worth more than any feature built later.

**The emotional stake:** A student arriving at HIVE is in a vulnerable moment. They heard about it from a friend, saw a flyer, got a text. They're curious but skeptical. They've been burned by GroupMe chaos, Discord noise, dead campus apps. They're asking one question: *Is this real? Are real people here?*

The entry flow has 60 seconds to answer: Yes. Your people are here. You belong.

**The strategic stake:** Entry is the only surface that touches every single user. It's the funnel everything flows through. A mediocre entry flow makes every downstream metric worse -- spaces feel empty, discovery feels lonely, leaders can't recruit. A great entry flow fills the platform with real, identified, interest-tagged humans who are already connected to spaces before they even see the home page.

**The leader stake:** For the primary persona (club leaders), entry is the onboarding they send their members through. If it's clunky, they look bad. If it's premium and fast, they look like they're part of something real. Leaders need to be able to say "join HIVE, it takes 30 seconds" and mean it.

---

## Feature Ideas

### 1. Social Proof Pulse

**Problem:** Students enter the flow feeling alone. No indication that real people are on the other side. The void aesthetic is premium but also isolating -- it can feel like entering an empty room.

**Shape:** At each phase of entry, show ambient social proof:
- Gate: "1,247 students at UB are already on HIVE" (counter, updates daily)
- Naming: "You'll be @johnsmith -- 3 people in your major are already here"
- Field: When you select a major, show "47 Computer Science students on HIVE" with 3-4 tiny avatar bubbles
- Crossing: When you select an interest, show "AI/ML -- 23 students, 2 active spaces"

The numbers are real Firestore aggregates, cached and refreshed hourly. The avatars are real profile photos (or initials for those without). Nothing fake, nothing inflated.

**Wedge:** This requires verified campus data that incumbents don't have. Discord can't show "47 CS students at UB" because they don't know who's a CS student at UB. The social proof is built on the identity layer.

**Impact:** High. Social proof is the strongest driver of completion in any signup flow. Knowing real people are on the other side transforms "should I bother?" into "I need to be there."

**Effort:** Medium. Requires aggregation queries (counts by campus, major, interest), caching layer, and UI integration into each entry screen.

**Tradeoffs:** Numbers look bad at cold start (showing "3 students" is worse than showing nothing). Need a threshold: show counts only when > 20 per category. Below that, show qualitative proof ("Students from your school are here").

---

### 2. The Claim Campaign (Handle Scarcity)

**Problem:** There's no urgency to complete entry. A student can close the tab and come back whenever -- or never.

**Shape:** Before a student even enters the flow, marketing creates urgency:
- Landing page shows: "Claim your @handle before someone else does"
- Social media: "@john is still available at UB. Not for long."
- After a student enters their name in the Naming phase, show the handle with a pulsing "Available" badge that feels like it could disappear
- Post-completion: Shareable card -- "I'm @johnsmith on HIVE" with a branded graphic they'd actually post on their Instagram story

The handle claim becomes the wedge. Students sign up not because they want another app, but because they want their name. The handle is theirs. First come, first served. The scarcity is real -- there's only one @john per campus.

**Wedge:** Handle namespace is a genuine scarce resource. There is exactly one `@johnsmith` at UB. Once claimed, it's gone. This creates FOMO that no feature comparison can.

**Impact:** High on acquisition. The shareable card creates distribution -- every post-completion share is a free ad that makes other students think "I should claim mine."

**Effort:** Low-Medium. The handle system already exists. Needs: a post-completion share card (canvas-rendered or server-generated image), social meta tags, and marketing copy.

**Tradeoffs:** Scarcity messaging can feel manipulative if overdone. Keep it honest -- the scarcity is real, but don't add fake countdowns or "5 people looking at this handle" pressure. Also, students with common names (John Smith) will have a worse experience because their ideal handle is likely taken.

---

### 3. Leader-Sent Invite Links (Deep Links to Entry)

**Problem:** Club leaders currently have to say "go download HIVE and sign up." There's no way for a leader to send a link that both onboards a new user AND lands them in the leader's space. The conversion path has too many steps.

**Shape:** Leaders generate invite links from their space settings:
```
hive.college/join/robotics-club
```

When a student clicks this link:
1. If not signed up: Opens entry flow with the space name visible at top ("You're joining Robotics Club")
2. The entry flow proceeds normally (email, name, year, interests)
3. On completion, the student is auto-joined to that specific space AND their interest-matched spaces
4. Redirect goes to the inviting space, not `/home`

The link is a standard URL -- works in GroupMe, iMessage, Instagram bio, QR codes on flyers. No app download, no special handling. Just a URL.

Leaders see a simple dashboard: "Your invite link was used 47 times this week."

**Wedge:** This turns every club leader into a distribution channel. The leader is doing the selling -- HIVE just needs to not screw up the conversion. Because HIVE has the pre-seeded org graph (400+ spaces), the invite link can show real context: "Robotics Club -- 34 members, last active 2 hours ago."

**Impact:** High. This is the primary acquisition channel. Club leaders have direct access to their members via existing channels (GroupMe, text, email). The link removes every friction point between "leader says join" and "member is in the space."

**Effort:** Medium. Needs: URL route (`/join/[handle]`), entry flow modification to accept a `spaceHandle` param, space context display during entry, invite link generation UI in space settings, basic analytics.

**Tradeoffs:** If the inviting space is a ghost space (not yet claimed), the experience degrades. Need to handle: what happens when someone joins via an invite link to a space that has no active leader? Also, deep links bypass the organic discovery flow -- students skip Explore entirely and only see the one space they were invited to.

---

### 4. 30-Second Entry (Time-to-Value Compression)

**Problem:** The current 4-phase flow takes 90-120 seconds. That's 90 seconds of a student wondering if this is worth it. Every second is a chance to lose them.

**Shape:** Compress the flow to 30 seconds by making strategic choices about what's required vs. deferred:

**Phase 1 (15 seconds): Gate**
- Email + instant OTP (no change, but optimize perceived speed)
- Pre-fill school detection from email domain
- Auto-advance when 6th digit entered (no "Verify" button tap)

**Phase 2 (10 seconds): Identity**
- Merge Naming + Field into one screen
- First name, last name, graduation year -- three fields, one tap to continue
- Handle preview shows live below the name fields
- Major is deferred to settings (progressive profiling)

**Phase 3 (5 seconds): Arrival**
- Replace interest selection with a smarter default
- Auto-select 3 interests based on major (CS students get Technology, AI/ML, Engineering)
- Show the auto-selections with option to customize: "We picked these for you. Tap to change."
- Most students accept the defaults and tap "Enter HIVE"

Total: 3 screens instead of 6+ sub-steps. ~30 seconds. The student is in a space before they've had time to second-guess.

**Wedge:** Speed is a feature. GroupMe takes 5 seconds (just a phone number) but gives you nothing. Discord takes 60 seconds and dumps you into an empty server. HIVE takes 30 seconds and lands you in a real community with real people. The combination of speed + meaningful result is the wedge.

**Impact:** High. Every removed second in a signup flow increases completion rate. The difference between 120 seconds and 30 seconds could be a 20-40% improvement in conversion.

**Effort:** Medium. Requires: merging two screens, rewriting the state machine, building smart interest defaults from major, deferred profiling for major/additional interests.

**Tradeoffs:** Collecting less upfront means weaker personalization on first load. Smart defaults mitigate this, but a student who auto-accepts "Technology, AI/ML, Engineering" and is actually more interested in music won't see music spaces. The progressive profiling prompt in settings needs to be compelling enough to trigger within the first week. Also, merging screens reduces the "ritual" feeling of the current flow -- the premium pacing is part of the brand.

---

### 5. Ghost Space Claim Flow (Leader Onboarding)

**Problem:** 400+ spaces are pre-seeded from CampusLabs but have no active leader. These ghost spaces are the platform's biggest asset and its biggest liability -- an asset because they represent real organizations, a liability because an unclaimed ghost space looks dead.

**Shape:** When a student completes entry and their profile matches a ghost space (they're the president of Robotics Club, or their email matches the club's contact email from CampusLabs data), trigger a "Claim Your Space" interstitial:

1. Post-entry, before redirect: "We found Robotics Club. It looks like you're connected to this organization."
2. Show the ghost space card: name, category, member count from CampusLabs, "Unclaimed" badge
3. Two paths:
   - "Claim This Space" --> Verification flow (role selection: President/VP/Officer/Member, optional proof like org email or SA&B roster match)
   - "Just Join" --> Standard member join, skip claim

If they claim:
- Space transforms from ghost to active
- They become Owner with full admin powers
- Space gets a "Claimed" badge visible to members
- They see a 3-step quickstart: "Add a description," "Post your first message," "Share your invite link"

If they skip, show the claim option again in their profile settings and as a persistent nudge when they visit the space.

**Wedge:** No competitor can do this because no competitor has 400+ pre-seeded org data from CampusLabs. The claim flow turns a data import into a growth mechanism. Every claimed space activates a leader, and every activated leader recruits 10-50 members.

**Impact:** High. Ghost space claiming is the primary mechanism to activate leaders at launch. Each claimed space creates a committed leader who will drive their own acquisition. This is the compound growth loop.

**Effort:** High. Requires: matching logic (email domain, name match, CampusLabs role data), claim verification flow, ghost-to-active space transformation, leader quickstart onboarding, persistent nudge system.

**Tradeoffs:** False positives in matching are dangerous -- if someone claims a space they shouldn't lead, the real leader arrives later to find their org hijacked. Need a dispute mechanism. Also, the CampusLabs data quality varies -- some orgs are defunct, some contact emails are graduated students. Stale data creates awkward moments.

---

### 6. The "You're In" Moment (Verification Celebration)

**Problem:** After a student verifies their OTP code, the flow immediately advances to the Naming phase. There's no pause, no celebration, no moment of arrival. The most important conversion event (proof of campus identity) passes without acknowledgment.

**Shape:** After successful OTP verification, insert a 2-second celebration interstitial:

1. Screen flashes with a subtle gold pulse (not a full takeover -- the void aesthetic stays)
2. The student's verified campus appears: "University at Buffalo" in Clash Display
3. Below: "Verified." with a gold checkmark animation
4. After 1.5 seconds, auto-advances to Naming with a seamless transition
5. Optional: A single haptic pulse on mobile (if Vibration API is available)

No button to tap. No action required. It's a moment, not a step. The student sees their school's name, feels verified, and the flow continues.

**Wedge:** Low. This is experience polish, not structural advantage. But it creates an emotional anchor -- the moment a student feels "I'm in" before they've even started building their identity. That emotional anchor reduces drop-off in subsequent phases.

**Impact:** Medium. Won't dramatically change completion rates but deepens emotional investment. Students who feel "in" are more likely to complete the remaining steps and more likely to return.

**Effort:** Low. 1-2 days. A motion component, a gold pulse animation, a 1.5-second auto-advance timer. No API changes. No state machine changes.

**Tradeoffs:** Adds 2 seconds to total flow time, which directly contradicts the "30-second entry" goal. The celebration must be fast enough to not feel like a loading screen. If the animation feels sluggish on older phones, it becomes friction instead of delight.

---

### 7. Contextual Onboarding Tooltip Tour (First-Session Orientation)

**Problem:** After entry, students land in a space and have no idea what to do. The space has chat, a sidebar, tools, members, settings -- and no guidance. The first 30 seconds after entry are as critical as entry itself.

**Shape:** After completing entry and landing in their first space, show a minimal 3-step tooltip tour:

1. **Tooltip 1 (Chat):** Points to the message input. "This is your space. Say hello." One-tap dismiss.
2. **Tooltip 2 (Sidebar):** Points to the sidebar. "Browse tools, events, and members here." One-tap dismiss.
3. **Tooltip 3 (Explore):** Points to the nav. "Find more spaces that match your interests." One-tap dismiss.

Design rules:
- Maximum 3 tooltips. Never more.
- Each disappears with one tap anywhere on screen.
- No "Next" button chain. Each stands alone.
- Show only once, ever. `localStorage` flag.
- If user interacts with the element before the tooltip appears, skip it.

**Wedge:** Low inherent defensibility, but the tour is tuned to HIVE's specific architecture (spaces, tools, explore). The content matters more than the mechanism.

**Impact:** Medium. Orientation reduces the "now what?" paralysis that kills first-session retention. Without orientation, a student stares at an empty chat, doesn't know where to go, and closes the tab.

**Effort:** Low. Tooltip component (likely already in `@hive/ui` or trivial to build), `localStorage` flag tracking, conditional render in the space page.

**Tradeoffs:** Tooltips can feel patronizing to power users. The "show only once" rule prevents annoyance but means a student who dismisses without reading gets no second chance. Consider a "Help" button in settings that re-triggers the tour.

---

### 8. Invite-a-Friend Momentum (Post-Entry Distribution)

**Problem:** A student finishes entry and is excited -- but there's no prompt to bring their friends. The moment of highest enthusiasm (just joined something new) is wasted.

**Shape:** After completing entry and landing in their first space, show a single non-blocking prompt at the bottom of the screen:

"Know someone who'd want in? Share your invite."

Tapping opens a native share sheet (Web Share API on mobile, copy-link fallback on desktop) with a pre-written message:

"I just joined [Space Name] on HIVE. Claim your @handle: hive.college/join/[space-handle]"

The link is the leader's space invite link, not a personal referral code. This means the student is sharing something real (a space) not something generic (an app). The share is contextual to the space they just joined.

**Wedge:** The invite is space-contextual, not app-contextual. "Join Robotics Club on HIVE" is a dramatically better share than "Download this app." Because HIVE has structured space data, the share link shows a rich preview (space name, member count, description) via Open Graph tags.

**Impact:** Medium-High. Viral loops compound. If 10% of new users invite one friend, and 30% of those friends complete entry, you get a 3% organic growth rate per cohort -- which compounds weekly.

**Effort:** Low. Web Share API integration, Open Graph meta tags on invite URLs, prompt UI in first-space experience.

**Tradeoffs:** Aggressive invite prompts annoy users and feel like growth hacking. The prompt must be dismissible, non-blocking, and shown only once. Never again after first dismiss. Also, if the student's friends don't have .edu emails at the same school, the invite leads to a waitlist -- which feels like a broken promise.

---

### 9. Progressive Profile Builder (Post-Entry Profiling)

**Problem:** Entry collects the minimum: name, year, major (optional), interests. But profiles feel empty afterward -- no photo, no bio, no pronouns, no links. The gap between "signed up" and "complete profile" is a dead zone where many users stall.

**Shape:** Instead of a settings page nag, use contextual prompts throughout the first week:

**Day 1, after first space visit:**
- Inline card in the space: "Add a photo so [Space Name] members recognize you." One-tap opens camera/upload.

**Day 2, after viewing another profile:**
- Subtle prompt: "They have a bio. Want to add yours?" Links to inline bio editor.

**Day 3, after receiving a connection request:**
- "People who add pronouns get 2x more connection accepts." (If data supports it. If not, just: "Add pronouns to your profile.")

**Day 5, after visiting Explore:**
- "Add more interests to improve your recommendations." Links to interest editor with new suggestions based on spaces they've visited.

Each prompt:
- Shows only once
- Is dismissible permanently
- Is contextually triggered (not time-based, behavior-based)
- Directly deep-links to the specific edit field

A persistent but subtle progress ring on their profile avatar shows completion (e.g., a gold ring that fills as they add photo, bio, pronouns, links). 100% complete = full gold ring.

**Wedge:** Behavioral prompts based on actual platform activity require understanding the user's journey. Generic "complete your profile" nags don't work because they're not tied to a real moment. HIVE can trigger prompts at the exact right time because it knows what the student just did.

**Impact:** Medium. Complete profiles improve discovery (more data for matching), trust (people engage more with profiles that have photos), and retention (identity investment creates switching cost).

**Effort:** Medium. Prompt delivery system (triggers, suppression, one-time flags), inline editors for each profile field, progress ring component.

**Tradeoffs:** Prompt fatigue is real. If three things compete for attention in the same session (tooltip tour + profile prompt + invite prompt), the student feels bombarded. Need a priority queue: max 1 prompt per session, prioritized by impact.

---

### 10. Entry Analytics Dashboard (Operator Visibility)

**Problem:** Right now, there is zero visibility into entry flow performance. No drop-off data. No conversion funnels. No cohort analysis. The team is flying blind on the most critical surface.

**Shape:** Admin dashboard page at `/admin/entry-analytics`:

**Funnel View:**
```
Email Entered:  1,000  (100%)
Code Sent:        920  (92%)  -- 8% invalid emails
Code Verified:    780  (85%)  -- 15% didn't verify
Name Completed:   740  (95%)  -- 5% dropped at name
Year Selected:    720  (97%)  -- 3% skipped
Interests Done:   680  (94%)  -- 6% quit before interests
Entry Complete:   680  (74% of started)
```

**Cohort Retention:**
- Day 1 return rate by entry week
- Day 7 return rate by entry week
- "Activated" (joined 2+ spaces, sent a message) rate by cohort

**Bottleneck Detection:**
- Phase with highest drop-off highlighted
- Average time per phase
- Code resend rate (indicates email delivery issues)
- Handle collision rate (indicates namespace pressure)

All data from existing analytics events (`useOnboardingAnalytics` already tracks step transitions). Just needs aggregation and display.

**Wedge:** None. This is pure operator tooling. But it enables every other optimization on this list -- you can't improve what you can't measure.

**Impact:** High (indirect). The dashboard itself doesn't improve entry, but data-driven decisions will.

**Effort:** Medium. Aggregation queries on analytics events, admin page with charts, date range filtering.

**Tradeoffs:** Building the dashboard before having significant traffic means staring at small numbers. More valuable after launch. But having the infrastructure ready means day-1 data capture.

---

### 11. Warm Handoff from Leader (Referral Context)

**Problem:** When a club leader tells a member to join HIVE, the member arrives at a generic entry flow. No context about who sent them or why. The social context of the referral is lost.

**Shape:** Leaders can generate personalized invite messages from space settings:

1. Leader taps "Invite Members" in space settings
2. Options: Copy Link, Share via QR, or Compose Message
3. "Compose Message" generates a pre-written text/email:

   > "Hey! Robotics Club is on HIVE now. Join us: hive.college/join/robotics-club?ref=sarahj"

4. When the invitee clicks the link:
   - Entry flow shows: "Sarah J. invited you to Robotics Club"
   - Sarah's avatar and name appear at the top of the Gate phase
   - After completion, the invitee sees Sarah in the space member list (highlighted as "invited you")

5. Sarah gets a notification: "John just joined Robotics Club from your invite."

The referral creates a social bridge -- the new user arrives knowing someone is already there.

**Wedge:** The warm handoff requires real identity (Sarah is a verified student, not an anonymous referral code). The social proof is genuine because HIVE verifies everyone. This can't exist on platforms where identity is optional.

**Impact:** Medium-High. Referral context dramatically increases completion rate. "Sarah invited you" is 10x more compelling than a generic signup page. The notification to Sarah creates a feedback loop (she feels rewarded, invites more).

**Effort:** Medium. Referrer parameter in invite URLs, entry flow modification to display referrer context, notification on join.

**Tradeoffs:** Referrer identity exposure -- Sarah's avatar and name are shown to someone who hasn't verified yet. Privacy consideration: only show first name and last initial. Also, the notification to Sarah could feel spammy if she's invited 50 people and gets 50 notifications.

---

### 12. Smart Major Autocomplete (Reduce Field Friction)

**Problem:** The current major list has ~40 entries. UB has 300+ programs. A student who can't find their major either skips it (losing personalization data) or picks something wrong (corrupting data). Both outcomes are bad.

**Shape:** Replace the fixed list with a smart autocomplete:

1. Text input with fuzzy search, not a dropdown
2. Source: Full NCES CIP taxonomy (~2,000 programs) filtered to UB's offerings
3. As student types, show top 5 matches with department context:
   - "Computer Sci" --> "Computer Science (School of Engineering)"
   - "Bio" --> "Biology (College of Arts & Sciences)", "Biomedical Engineering", "Biochemistry"
4. Include synonyms and abbreviations: "CS" matches "Computer Science", "Econ" matches "Economics"
5. Bottom option always visible: "Exploring / Undeclared" -- not a skip, a real selection that feeds "broad interests" into the recommendation engine
6. If no match after 3 characters: free-text option "Add [typed text] as your field"

**Wedge:** Small. This is table-stakes UX. But the data quality improvement compounds -- better major data means better space recommendations, better "People in Your Major" discovery, better aggregate analytics for the university.

**Impact:** Medium. Reduces the skip rate on major selection, which improves downstream personalization. More students with accurate majors means better Explore recommendations from day one.

**Effort:** Low. Replace the select list with a combobox, expand the major data to include UB's full program list plus common synonyms.

**Tradeoffs:** Free-text fallback creates data quality issues (inconsistent spellings, made-up majors). Mitigate with canonical mapping: free-text entries get flagged for manual review and mapped to canonical names. Also, very long autocomplete lists on mobile can feel overwhelming -- cap visible results at 5 and require more typing to narrow.

---

### 13. Campus-Aware Landing (Pre-Entry Context)

**Problem:** Students arrive at `/enter` with no context about what HIVE is at their school. The entry flow assumes they already know and are committed. Many aren't -- they need to be sold in the same surface.

**Shape:** Before the email field, show a 5-second campus context card:

1. School crest/logo + "HIVE at University at Buffalo"
2. Three real stats:
   - "312 student organizations"
   - "2,847 students already on HIVE" (or "Launching Spring 2026" pre-launch)
   - "Join in 30 seconds"
3. Below: the email input (same screen, scrolled down -- not a separate step)

The campus card is dynamic per school. The stats are real. The layout is one scroll -- context at top, email input below. No added clicks.

For schools not yet on HIVE: show the waitlist version ("Be the first at [School Name]") with the email input adapted for waitlist signup.

**Wedge:** Campus-specific context requires campus-specific data. No generic signup page can show "312 student organizations at UB" because generic platforms don't know what UB has. HIVE's pre-seeded data becomes the sell.

**Impact:** Medium. Context reduces the "what is this?" barrier. A student who sees their school's name, real org count, and real student count feels like this is for them specifically -- not a generic product.

**Effort:** Low. Static campus data (logo, org count, student count) rendered above the existing email input. No new API calls needed if data is cached.

**Tradeoffs:** Adds visual weight to the first screen, which is currently minimal and elegant. The void aesthetic is part of the brand -- a campus logo and stats may feel cluttered. Need to preserve the editorial feel while adding context.

---

### 14. Re-Entry Flow (Returning User Recovery)

**Problem:** Students who start entry but don't finish have no way to resume. If they close the tab after entering their email but before completing, they start over from scratch next time. Worse: if they verified their code but didn't finish onboarding, their email is "used" but their account is incomplete.

**Shape:** When a student returns to `/enter`:

1. Check for an existing incomplete session (code verified but entry not completed)
2. If found: "Welcome back. Pick up where you left off." Shows their email (masked: j***@buffalo.edu) and the phase they were on
3. One tap to resume from their last phase (no re-verification needed if session is still valid)
4. If session expired: "Your session expired. Let's start fresh." --> Back to email, but pre-fill the email field

For the "code verified but never completed" edge case:
- Store partial entry state in a server-side record (linked to verified email)
- On return visit, detect the partial record and offer to resume
- Partial records expire after 7 days

**Wedge:** Low. This is infrastructure. But it captures users who would otherwise be permanently lost -- they tried once, had to close the tab (professor walked in, phone rang), and never came back because starting over felt like too much work.

**Impact:** Medium. Recovery rate depends on how many users start but don't finish. If 20% of drop-offs are "interrupted, not disinterested," recovery could add 5-10% to total completion.

**Effort:** Medium. Server-side partial entry storage, session detection on `/enter` load, resume flow UI.

**Tradeoffs:** Partial entry records contain PII (email, name). Storage and cleanup policies needed. Also, resuming from an old session can feel stale -- "Welcome back" after 3 days feels different than after 3 minutes. Need expiry.

---

### 15. Entry Variant for Events (Single-Purpose Onboarding)

**Problem:** The highest-urgency moment to join HIVE isn't "I want to explore campus clubs." It's "I want to RSVP to this specific event happening tomorrow." Current entry makes no accommodation for urgency -- it's the same 4-phase flow whether you're casually browsing or trying to RSVP in 10 seconds.

**Shape:** Event-specific entry variant at `/join/event/[eventId]`:

1. Shows the event card at top: name, date, time, space, attendee count
2. Below: streamlined entry (email + OTP + name only -- no major, no interests)
3. On completion: auto-RSVP to the event, auto-join the hosting space, redirect to event detail
4. Deferred profiling for year/major/interests via post-entry prompts

The student's intent is clear: attend this event. HIVE gets out of the way. Entry takes 20 seconds. The student is RSVP'd and in the space before the urgency fades.

Leaders promote this link specifically: "RSVP to our hackathon: hive.college/join/event/spring-hack-2026"

**Wedge:** Event-driven entry creates a time-bounded acquisition spike. When 200 students want to RSVP to a hackathon, they all need to complete entry NOW. The compressed flow captures this urgency. Discord and GroupMe have no equivalent -- they can't gate RSVP behind verified identity AND make it fast.

**Impact:** High. Events are the highest-intent acquisition moment on campus. A student who wants to RSVP is the most motivated user possible. Making entry friction-free for this intent captures the best users.

**Effort:** High. New route, entry flow variant, event-specific completion logic, deferred profiling system.

**Tradeoffs:** Students who enter via events skip interest selection, which weakens their personalization. Deferred profiling must actually happen or these users become low-data ghosts. Also, two entry paths (standard + event) means two things to maintain and two things that can break.

---

## Quick Wins (ship in days)

| Idea | Days | Why Now |
|------|------|---------|
| **The "You're In" Moment (#6)** | 1-2 | Pure motion work. No API changes. Immediate emotional upgrade to the most important conversion event. |
| **Smart Major Autocomplete (#12)** | 2-3 | Replace 40-item list with UB's full program list + fuzzy search. Directly reduces skip rate on major. |
| **Campus-Aware Landing (#13)** | 1-2 | Static campus data above the email input. Answers "what is this?" before the student commits. |
| **Social Proof Pulse (#1, lite version)** | 2-3 | Start with just total student count on Gate phase. One cached number. Expand later. |

---

## Medium Bets (ship in weeks)

| Idea | Weeks | Why This Phase |
|------|-------|---------------|
| **Leader-Sent Invite Links (#3)** | 1-2 | Primary acquisition channel. Leaders need this for launch. |
| **The Claim Campaign (#2)** | 1-2 | Post-completion share card + handle scarcity marketing. Drives organic distribution. |
| **30-Second Entry (#4)** | 2-3 | Merge screens, smart defaults. Requires state machine rewrite but dramatically compresses time-to-value. |
| **Warm Handoff from Leader (#11)** | 1-2 | Referrer context in entry flow. Builds on invite links. |
| **Re-Entry Flow (#14)** | 1-2 | Partial session recovery. Captures interrupted users. |
| **Progressive Profile Builder (#9)** | 2-3 | Behavioral prompts over first week. Needs prompt delivery system. |

---

## Moonshots (ship in months+)

| Idea | Months | Why It Matters |
|------|--------|---------------|
| **Ghost Space Claim Flow (#5)** | 1-2 | Activates 400+ leaders. The compound growth mechanism. Requires matching logic, verification, and quickstart. |
| **Entry Variant for Events (#15)** | 1-2 | Event-driven acquisition at scale. Second entry path with deferred profiling. |
| **Entry Analytics Dashboard (#10)** | 1+ | Full funnel visibility. Enables data-driven optimization of everything above. |
| **Full Social Proof Pulse (#1)** | 1+ | Per-phase, per-major, per-interest live proof. Requires robust aggregation pipeline. |

---

## Competitive Analysis

### Discord
**Onboarding:** Create account (email + password + username) --> Join server via invite link. No email verification required. Username is global, not campus-scoped.

**Strengths:** Extremely fast signup. Invite links are native and frictionless. Server join is one click after account creation.

**Structural weakness:** No campus verification. No real identity requirement. A "UB Computer Science" server has no way to verify members are actually UB CS students. Leaders spend energy gatekeeping instead of building community. Server discovery is terrible -- you need the exact invite link.

### GroupMe
**Onboarding:** Phone number + name --> Join group via link. No verification. No identity beyond a name.

**Strengths:** Fastest onboarding of any competitor. Phone number + name = in. Under 10 seconds.

**Structural weakness:** Zero identity layer. No handles, no profiles, no interests, no major. A GroupMe group is a list of phone numbers with display names. There's no campus graph, no cross-group discovery, no way to find groups you don't already know about. Leaders can't even see who's in their group unless people introduce themselves.

### Slack
**Onboarding:** Email + workspace invitation --> Create account --> Join channels. Workspace-scoped.

**Strengths:** Workspace isolation is similar to campus isolation. Channel structure maps to org structure.

**Structural weakness:** No pre-seeded spaces. Every workspace starts empty. The cold-start problem is brutal -- a campus Slack would need manual creation of every org channel. No interest-based discovery. No cross-workspace identity. Pricing makes it impractical for student orgs.

### CampusGroups / OrgSync / Engage
**Onboarding:** SSO via university portal --> Landing page with org directory.

**Strengths:** Institutional trust. Campus SSO means verified identity from day one. Full org directory from the registrar.

**Structural weakness:** The product is for administrators, not students. The UI is compliance-oriented: forms, rosters, budget tracking. There's no real-time chat, no feed, no social features. Students use it because they have to (register their org), not because they want to. Onboarding is fast (SSO) but leads to a dead end -- there's nothing to do after joining except fill out forms.

### Instagram
**Onboarding:** Create account --> Follow pages.

**Strengths:** Everyone already has it. Org recruitment happens where students already are.

**Structural weakness:** Not a community tool. It's a broadcast medium. Orgs can post but can't host conversations. Discovery is algorithmic, not campus-scoped. There's no way to see "all orgs at UB" -- you have to search individually. No structured data (events aren't events, they're image posts with dates in the caption).

---

## Wedge Opportunities

### What HIVE can do that incumbents structurally cannot:

**1. Verified Campus Context in Entry**
HIVE knows which school you attend, what major you're in, and what interests you have -- all verified against a campus email. This lets every entry screen show "47 CS students at UB are already here." Discord, GroupMe, Instagram have no concept of campus identity. They can't show this data because they don't collect it.

**2. Pre-Seeded Org Graph as Landing Experience**
HIVE has 400+ real organizations imported before a single user signs up. When a new student completes entry, they land in a real space with a real name, real description, and (increasingly) real members. Discord and GroupMe start empty -- every server/group is created manually. HIVE's cold-start advantage is structural: the org graph exists before the network does.

**3. Handle Scarcity as Distribution**
There's exactly one `@johnsmith` per campus. This scarcity is inherent and real. "Claim your handle" is a marketing message that writes itself and costs nothing. No competitor has campus-scoped handle namespaces. Discord usernames are global (and recently changed to be unique). GroupMe has no handles at all.

**4. Leader-as-Distribution-Channel**
Because HIVE pre-seeds spaces, leaders don't need to "create a server" -- they claim their existing org. The claim flow converts a leader from "evaluating a new tool" to "setting up my space" in minutes. Once claimed, the leader becomes a distribution channel: every invite link they share drives acquisition. Discord requires leaders to build from scratch, which is a massive commitment before they've seen any value.

**5. Interest-to-Space Pipeline**
Entry collects interests. Interests map to spaces. A student who says "AI/ML" is auto-joined to AI-related spaces. This instant matching doesn't exist on any competitor -- Discord makes you find and join servers manually, GroupMe requires explicit invites, CampusGroups has category browsing but no intelligent matching.

---

## Open Questions

### 1. Should entry require major?
Currently optional. Making it required improves personalization but adds friction. Making it truly optional (with "Exploring" as a first-class option, not a skip) might be the middle ground.

### 2. What's the right number of interests?
Currently 2-5 required. Fewer interests = faster entry but weaker matching. More interests = better matching but longer flow. Is 2 enough to generate useful recommendations?

### 3. How do we handle the cold start social proof problem?
Showing "3 students at UB" is worse than showing nothing. What's the threshold for displaying counts? Do we use qualitative proof at low numbers ("Students from your school are joining")?

### 4. Should ghost space claiming happen during entry or after?
During entry: more contextual, but adds a step to a flow that should be short. After entry: less friction, but the leader might never return to claim.

### 5. Do we need a separate entry flow for leaders vs. members?
Leaders have different needs (they want to claim and set up, not just join). A unified flow that branches based on intent (or matching data) might be better than two separate flows.

### 6. How aggressive should post-entry profiling be?
One prompt per session? Per day? Per week? The line between "helpful" and "nagging" is thin. Need to define a prompt frequency policy before building the system.

### 7. Should re-entry preserve partial data across devices?
Server-side storage allows cross-device resume but adds PII management burden. Client-only (localStorage) is simpler but doesn't survive device switches. Most students will resume on the same device within minutes.

### 8. What's the terms/privacy acceptance UX?
Compliance requires it. Currently missing entirely from entry. A checkbox before email submission is standard. A standalone screen adds friction. Inline link with implied acceptance by continuing has legal risk.

### 9. Do we gate entry on campus email domain, or allow personal emails with verification?
Currently campus email only. Some students don't check their .edu email regularly. Allowing personal email with a secondary campus verification step could reduce friction but weakens the verification wedge.

### 10. What happens when a student graduates?
Entry creates a verified student identity. When that student graduates, does the identity persist? Transform to alumni? Expire? This affects the long-term value proposition of handles and profiles.
