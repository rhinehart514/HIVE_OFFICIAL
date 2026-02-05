# Profile & Identity

**Dimension:** What a student's presence looks like. How they express themselves. What belonging looks like on a card. Reputation, badges, contribution history, cross-space identity.

**Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow?

**North Star:** Weekly Active Spaces

---

## Current State

HIVE's identity system is built around a **belonging-first** philosophy that inverts the standard social profile hierarchy. Instead of "who are you, what do you post" it answers "who are you, where do you belong."

**What exists today:**

- **3-Zone Profile Layout:** Zone 1 (Identity: avatar, name, handle, bio, badges), Zone 2 (Belonging: spaces, events, shared spaces with viewer), Zone 3 (Activity: active days, tools built). This is the correct hierarchy and a genuine differentiator.
- **Handle System:** 3-20 characters, auto-generated from name, first change free, 6-month cooldown after. Handle history tracked. Reserved handle list prevents impersonation. Transactional reservation prevents race conditions.
- **Privacy Controls:** Profile visibility (public/campus/private), show activity, show spaces, show connections, show online status, allow DMs, ghost mode. Ghost mode is the nuclear option that makes you near-invisible.
- **Entry Flow:** 4-phase state machine (Gate, Naming, Field, Crossing) with narrative arc from Outsider to Arrived. Premium gold/void aesthetic. Campus email verification required. Real names required. 150+ interests organized by category. Auto-join spaces based on major/interests.
- **Profile Data:** Name, handle, avatar (Gravatar only), bio, userType, major, graduationYear, interests, communityIdentities (international, transfer, firstGen, commuter, graduate, veteran).
- **Trust Signals:** Verified student badge exists. Activity score tracked but not prominently surfaced. No formal reputation system beyond that.

**Known Gaps:**
- No profile photo upload (40% of users have no avatar)
- No cover photo, pronouns, social links
- No badge system beyond "Verified Student"
- No profile analytics ("who viewed")
- Settings changes in Account section are never saved (no PUT/PATCH wired)
- 6 competing Profile type definitions across codebase
- 3 avatar field name conventions

---

## The Opportunity

Identity design is strategically critical for HIVE because **every other campus platform gets identity wrong in the same way**: they copy consumer social (bio + follower count + grid) or enterprise directory (name + title + department). Neither model answers the question that actually matters on a campus: "Where does this person belong, and do we overlap?"

The belonging-first profile is not a nice-to-have design choice. It is the mechanism by which:

1. **New students break isolation.** A profile that shows "3 shared spaces" with a stranger instantly creates warmth. A follower count does not.
2. **Club leaders recruit.** When a leader sees a student's profile showing their interests and major, they can send a targeted invitation. When they see a follower count, they learn nothing.
3. **Identity compounds.** A profile that shows spaces joined, events attended, and tools built over four years becomes a living campus resume. A bio is a static string that decays.
4. **Retention loops form.** A student who has invested in their HIVE identity (badges, streak, reputation across 8 spaces) faces real switching cost. A student with a bio and a profile photo has zero switching cost.

The opportunity is to make the HIVE profile **the most valuable thing a student owns in college** -- not because it's pretty, but because it actually encodes their campus life in a way nothing else can. LinkedIn captures career. Instagram captures appearance. HIVE captures belonging.

---

## Feature Ideas

### 1. Belonging Passport

**Problem:** Profiles are viewed in isolation. When a student visits another student's profile, there is no instant signal of shared context. The "shared spaces" banner exists but it is passive and understated.

**Shape:** When you view someone's profile, the top of their Belonging zone transforms into a shared context card: "You and Sarah share 3 spaces: CS Club, AI/ML Research, Hackathon Team." Tapping reveals the specific spaces with your mutual role in each. If you share zero spaces, the card shifts to "Sarah is active in spaces similar to your interests" with a nudge to explore. The shared context card becomes the primary social affordance -- more prominent than a connect button, because shared belonging is a stronger signal than a connection request.

**Wedge:** No other platform knows which communities two students share. Instagram knows mutual followers. LinkedIn knows mutual connections. Only HIVE knows mutual belonging. This data only exists because HIVE is the community layer.

**Impact:** High
**Effort:** Low (data already exists in space memberships; this is a UI elevation)
**Tradeoffs:** Could make profiles feel voyeuristic if someone is in many spaces. Privacy controls must let users hide specific memberships.

---

### 2. Contextual Identity (Per-Space Persona)

**Problem:** Students behave differently in different communities. The president of the Pre-Med Society and the DJ at the electronic music club might be the same person, but a flat profile can't express that range. Students feel pressure to present one coherent identity.

**Shape:** Each space membership carries an optional "space persona" -- a one-line descriptor and optional role tag that appears when viewing that student within that space's member list. Sarah might be "Research Lead" in the AI club and "Event DJ" in the music collective. These descriptors appear in context: when you see Sarah in the AI club member list, you see her AI role. When you see her profile page, you see the full constellation of her personas. The profile becomes a map of identities, not a single flattened bio.

**Wedge:** This is structurally impossible on platforms with a single global identity (Discord, Instagram, LinkedIn). It requires the community-context graph that HIVE uniquely possesses. It also deepens per-space investment -- the more personas a student crafts, the harder it is to leave.

**Impact:** High
**Effort:** Medium (new data model: per-membership persona with role tag + one-liner)
**Tradeoffs:** Adds complexity to profile editing. Some students may not bother. Must feel optional, not forced. Risk of inconsistency if personas contradict.

---

### 3. Contribution Heat Map

**Problem:** Activity is tracked but not visualized in a way that creates pride or FOMO. The current activity zone shows "active days" as a number, which is meaningless without context. Students have no reason to maintain streaks or increase participation because there is no visible artifact of their effort.

**Shape:** A GitHub-style contribution heat map on every profile showing activity intensity per day over the last semester. Each cell represents a day. Intensity is mapped to actions: messages sent, events attended, tools used, spaces visited. The heat map is visible on your own profile (pride driver) and others' profiles (social proof). Below the map: "Active 47 of the last 90 days" and "Most active in: CS Club, Student Senate." The map uses the gold intensity scale -- dormant days are void, active days glow progressively warmer gold.

**Wedge:** Activity data is proprietary. No one can replicate your campus engagement history. Every day you use HIVE, the map fills in, creating visible evidence of your college involvement. This is a switching cost that grows linearly with time.

**Impact:** High
**Effort:** Medium (data exists in Firestore, need aggregation pipeline + visualization component)
**Tradeoffs:** Could create anxiety for less-active students. Must not feel like a leaderboard. Should feel like a personal journal, not a scorecard. Consider privacy toggle to hide from others.

---

### 4. Reputation Rings

**Problem:** Trust on HIVE is binary: you're either a verified student or you're not. There is no gradient between "just signed up" and "has been a reliable community member for two years." Club leaders cannot distinguish between a real contributor and someone who joined but never participated.

**Shape:** Concentric rings around a student's avatar that fill based on accumulated campus participation. Ring 1 (innermost): Identity completeness -- photo, bio, pronouns, links. Ring 2: Activity consistency -- active days over last 30. Ring 3: Community depth -- number of spaces actively participated in. Ring 4 (outermost): Leadership -- roles held, events organized, tools built. The rings are subtle gold gradients, not gamified badges. They are visible in member lists, search results, and profiles. They answer the question "how invested is this person?" at a glance.

**Wedge:** Reputation rings encode behavioral data that accumulates over months. A competitor can copy the UI but cannot copy the behavioral history. The rings become more valuable over time -- a junior with three full rings has visible proof of their campus engagement that no resume or LinkedIn profile can match.

**Impact:** High
**Effort:** High (aggregation service, ring rendering component, privacy controls, anti-gaming logic)
**Tradeoffs:** Gamification risk -- students optimizing for rings rather than genuine participation. Must ensure rings reward breadth and consistency, not volume. Accessibility concern: rings must have non-visual equivalents for screen readers.

---

### 5. Profile as Campus Resume

**Problem:** Students invest years building campus involvement but have no exportable record of it. When they apply for jobs, grad school, or leadership positions, they reconstruct their involvement from memory. HIVE knows exactly what they did, when, and where -- but this data is trapped inside the platform.

**Shape:** A "Campus Resume" export that generates a formatted PDF or shareable web page from a student's HIVE profile. Sections: Spaces Led (with role and duration), Events Organized (with attendance counts), Tools Built (with usage stats), Activity Summary (active semesters, contribution map). The resume links back to the student's public HIVE profile for verification. Format: clean, professional, designed to paste into job applications. Students can curate which items appear.

**Wedge:** HIVE is the system of record for campus involvement. The campus resume is only possible because structured data about membership, leadership, event organization, and tool creation lives in Firestore. It cannot be reconstructed from Instagram posts or Discord messages. This creates an explicit reason to maintain your HIVE profile even after graduation.

**Impact:** Medium (high value per user, but niche use case)
**Effort:** Medium (PDF generation, curation UI, public profile enhancements)
**Tradeoffs:** The resume is only valuable if HIVE data is accurate and comprehensive. Garbage-in-garbage-out risk. Must ensure space membership and role data is reliable. Could create pressure for leaders to inflate titles.

---

### 6. Handle Claim Campaign

**Problem:** Cold start. At launch, there is no urgency to create an account. Students have no reason to sign up today versus next week. The handle namespace is empty, so there is no scarcity.

**Shape:** Pre-launch marketing: "Claim @yourfirstname before someone else does." Show a live counter of handles claimed. Share-to-social: "I'm @sarah on HIVE" with a branded card that includes the student's campus, year, and a QR code to their profile. Early adopters get a permanent "Founding Member" badge visible on their profile. After launch, handles become first-come-first-served, and the scarcity messaging shifts to "Your handle is waiting -- but not forever."

**Wedge:** The handle namespace is a one-time asset. The first student to claim @john owns it at UB forever. This creates genuine urgency that cannot be manufactured retroactively. Combined with the "Founding Member" badge, early adopters gain permanent status. This is the exact mechanic that drove early Twitter and Instagram adoption.

**Impact:** High (acquisition + urgency)
**Effort:** Low (marketing asset creation, badge system, share card generator)
**Tradeoffs:** Could feel gimmicky if the platform behind the handle is empty. Must ensure that after claiming, there is immediate value (auto-join spaces, see activity). If too many students claim handles and never return, the namespace becomes polluted.

---

### 7. Identity Constellation

**Problem:** A flat list of "interests" in a profile is forgettable. Students pick interests during onboarding and never think about them again. Interests do not create visual identity or meaningful connections.

**Shape:** Replace the text list of interests with a visual constellation -- a force-directed graph where each interest is a node, and nodes cluster based on semantic proximity. "Machine Learning" and "Data Science" orbit close; "Rock Climbing" and "Photography" cluster elsewhere. The constellation is unique per student, like a fingerprint. When viewing another student's profile, your constellation overlays with theirs and shared interests glow gold, instantly revealing overlap. On your own profile, the constellation animates subtly -- interests with more activity in related spaces glow brighter.

**Wedge:** Visual identity is memorable. A constellation is worth 1000 words of bio text. The overlay mechanic (your interests + their interests = visible overlap) is a belonging primitive that no follower-based platform possesses. It makes "finding your people" literal and visual.

**Impact:** Medium (memorable, differentiating, but not core retention)
**Effort:** High (force-directed graph rendering, semantic clustering, overlay logic, mobile optimization)
**Tradeoffs:** Performance risk on mobile. Accessibility risk for screen readers. Could feel like a toy if not connected to real data. Must be backed by actual space activity, not just onboarding interest selection.

---

### 8. Quiet Reputation (Anti-Clout Metrics)

**Problem:** Every social platform eventually optimizes for vanity metrics. Follower counts, like counts, and view counts create a popularity contest that alienates students who are deeply involved but not publicly performative. HIVE's decision filter is belonging, not clout.

**Shape:** HIVE never shows follower counts, like counts, or view counts on profiles. Instead, it surfaces "quiet reputation" signals: "Active in 8 spaces" (breadth), "Member since Sep 2026" (tenure), "Attended 12 events this semester" (involvement), "Built 3 tools used by 47 people" (contribution). These metrics reward consistent participation, not viral moments. The emphasis is on *doing things* rather than *being seen*. The profile never shows how many people viewed it or how many followers someone has.

**Wedge:** This is an anti-pattern choice that most platforms cannot make because their business model depends on engagement metrics driving ad revenue. HIVE does not run ads. HIVE can afford to optimize for belonging over attention. This structural difference is defensible because reversing it would alienate the community.

**Impact:** High (cultural foundation, retention through genuine belonging)
**Effort:** Low (this is primarily a design and policy decision, not a technical one)
**Tradeoffs:** Some students will want follower counts. Some club leaders will want to know their "reach." Must provide alternative metrics for leaders (member engagement, event attendance) without exposing vanity metrics on profiles. Risk of feeling "less than" compared to platforms with visible social proof.

---

### 9. Profile Photo Stories (24-Hour Context)

**Problem:** Static profile photos are impersonal. Students want to show what they're doing right now -- at an event, in a study group, at a meeting -- without the permanence of a traditional photo update. This creates ephemeral context that makes the platform feel alive.

**Shape:** A student can add a 24-hour "context ring" around their avatar -- a short photo or 10-word text that appears as a glowing border. Tapping the avatar in any member list or chat reveals the context. Examples: A photo from the club meeting they're currently at. "Studying for midterms, send coffee." "Looking for teammates for hackathon." The ring uses the gold glow treatment -- a pulsing border when a context is active, dormant when not. Contexts auto-expire after 24 hours. No archive, no history.

**Wedge:** This is Instagram Stories but scoped to campus communities. The key difference: contexts appear in member lists and chat, not on a feed. This means your context is seen by the people you actually belong with, not a follower graph. The distribution mechanism is belonging, not following.

**Impact:** Medium (engagement driver, liveness signal)
**Effort:** Medium (photo upload to Storage, expiry logic, ring rendering, member list integration)
**Tradeoffs:** Storage costs for photos that expire. Moderation burden for photo content. Could feel like feature bloat if HIVE's core (spaces, chat, tools) is not yet solid. Must not become "Stories" -- must stay minimal (one active context, not a carousel).

---

### 10. Mutual Belonging Score

**Problem:** When a student discovers another student -- in search, in a space member list, in "People You May Know" -- there is no fast signal of how relevant this person is to them. Connection suggestions are generic.

**Shape:** Every student-to-student relationship has a hidden "belonging overlap" score calculated from: shared spaces (weighted by activity), shared interests, shared major, shared graduation year, shared events attended. This score never appears as a number. Instead, it powers the UI: member lists sort by belonging overlap by default. "People You May Know" ranks by overlap. Profile visit prompts shift from generic "Connect" to "You share 4 interests and 2 spaces with Sarah." The score is invisible infrastructure that makes every social surface feel personally relevant.

**Wedge:** The belonging overlap score uses data that only exists inside HIVE: space membership + activity + interest graph + academic metadata. No external platform has this combination. The score improves with more data, creating a classic data flywheel -- the more students use HIVE, the better the overlap scoring becomes.

**Impact:** High (powers relevance across every social surface)
**Effort:** High (scoring algorithm, aggregation pipeline, integration into search/member lists/suggestions)
**Tradeoffs:** Cold start -- score is meaningless with few users. Must degrade gracefully when data is sparse. Privacy risk if the score reveals sensitive membership (e.g., support group spaces). Must exclude certain space types from scoring.

---

### 11. Profile QR Card

**Problem:** In-person networking at campus events is still "what's your Instagram?" or exchanging phone numbers. There is no fast way to connect a real-world interaction to a HIVE profile.

**Shape:** Every student has a downloadable "HIVE Card" -- a beautifully designed card showing their avatar, name, handle, year, and a QR code that links to their profile. The card uses the gold/void aesthetic. Students can save it to their phone's photo library or Apple Wallet. At events, "scan my HIVE" replaces "what's your Instagram." Scanning the QR opens the profile with the shared belonging context card front and center.

**Wedge:** The QR card turns HIVE into a physical-world protocol. Every scan drives a profile view, which drives a "Connect" action, which drives space discovery ("Sarah is in these 3 spaces you might like"). The physical-to-digital bridge is uniquely powerful on a campus where in-person interaction is constant.

**Impact:** Medium (high utility at events, low daily use)
**Effort:** Low (QR generation is trivial, card design is a static template, Wallet pass is a standard format)
**Tradeoffs:** Adoption depends on cultural momentum. "Scan my HIVE" only works if enough students have it. Must be part of a broader launch event strategy. Risk of feeling corporate if the card design is not cool enough.

---

### 12. Identity Evolution Timeline

**Problem:** Profiles are snapshots. They show who you are now but not how you got here. A senior's profile looks the same structurally as a freshman's. There is no visible record of growth, change, or evolution.

**Shape:** A timeline view on the profile (opt-in) showing key identity moments: "Joined HIVE" (Sep 2026), "Joined CS Club" (Sep 2026), "Became VP of Finance, Student Senate" (Jan 2027), "Organized first event (47 attendees)" (Mar 2027), "Built first HiveLab tool" (Apr 2027), "Reached 100 active days" (Nov 2027). The timeline auto-populates from HIVE data. Students can add custom milestones ("Won hackathon," "Started research lab"). The visual is a vertical line with gold dots for HIVE-verified events and white dots for self-reported ones.

**Wedge:** The timeline creates a narrative of campus life that no other platform captures. LinkedIn tracks career milestones. HIVE tracks belonging milestones. The longer a student uses HIVE, the richer their timeline becomes. This is a powerful retention mechanism -- deleting HIVE means losing your campus story.

**Impact:** Medium (high emotional value, moderate engagement impact)
**Effort:** Medium (event tracking aggregation, custom milestone input, timeline UI component)
**Tradeoffs:** Requires robust event tracking across all systems (spaces, events, tools). Auto-population must be accurate -- wrong dates or missing events erode trust. Self-reported milestones create verification challenges.

---

### 13. Ghost Mode Refinement

**Problem:** Ghost mode is all-or-nothing. A student who wants privacy in one space (e.g., a mental health support group) must go invisible everywhere. This is too blunt an instrument for the nuanced privacy needs of college students.

**Shape:** Replace the single ghost mode toggle with granular visibility controls. Per-space visibility: hide membership in specific spaces from your public profile. Per-zone visibility: hide belonging zone but show activity, or vice versa. Selective ghost: appear online to some spaces but offline to others. Incognito browse: view profiles without appearing in their "who viewed" (when profile analytics exist). Each control has a clear description of what it affects. The privacy settings page shows a live preview of what your profile looks like to different audiences: "As seen by: a stranger / a campus member / a shared-space member."

**Wedge:** Granular privacy is a trust builder. Students who feel safe controlling their visibility are more likely to participate in sensitive spaces (identity groups, support communities, political organizations). This increases the breadth of spaces on HIVE, which increases the platform's value.

**Impact:** Medium (trust and safety, indirect retention)
**Effort:** Medium (privacy model refactor, preview rendering, per-space visibility flags)
**Tradeoffs:** Complexity for users who just want "on/off." Must keep the simple ghost mode toggle as a shortcut while exposing granular controls for power users. Engineering complexity in ensuring every query respects per-space visibility flags.

---

### 14. Verified Role Badges

**Problem:** Anyone can call themselves "President" of a club. There is no way to distinguish a legitimate club officer from someone who added a title to their profile. For club leaders, this undermines the credibility that HIVE identity is supposed to provide.

**Shape:** When a space owner or admin assigns a role (President, VP, Treasurer, etc.) to a member, that role becomes a verified badge on the student's profile. The badge shows the space name, role, and the date it was assigned. Verified roles appear with a distinct visual treatment (e.g., gold border vs. self-reported roles with no border). The badge links back to the space. Only space owners/admins can assign verified roles. Students can choose to display or hide each badge.

**Wedge:** Verified role data is only possible because HIVE controls the org admin layer. Discord has roles but no identity verification. LinkedIn has self-reported titles. HIVE has admin-assigned, campus-verified role data. This makes HIVE the system of record for campus leadership -- valuable for resumes, applications, and institutional recognition.

**Impact:** High (credibility for leaders, value for campus resume feature)
**Effort:** Low-Medium (role assignment UI exists in space settings, need badge rendering + profile integration)
**Tradeoffs:** Administrative burden on space owners to assign roles. Must be easy -- ideally one-click from the member list. Risk of role inflation ("everyone is a VP"). Consider limiting verified role badges to a curated list (President, VP, Treasurer, Secretary, etc.).

---

### 15. Alumni Identity Bridge

**Problem:** Students graduate. Their HIVE identity, campus involvement history, and community connections die when they lose their .edu email. There is no path from active student to engaged alumnus. This is a loss for both the student (their history disappears) and the platform (network effects shrink).

**Shape:** Before graduation, students can "bridge" their HIVE identity to a personal email. Their profile transitions to an "Alumni" state: the activity heat map freezes at their graduation date (creating a visible record of their college involvement), their spaces transition to "alumni member" status, and they gain access to alumni-only features: a public profile URL (hive.college/u/handle) for their resume, a verified "Class of 20XX" badge, and read-only access to their former spaces. They lose active posting rights but retain their identity and history.

**Wedge:** Alumni identity creates multi-year lock-in. A student who knows their HIVE history will persist after graduation invests more during college. Alumni profiles also create social proof for new students ("Look at what Sarah did during her 4 years"). The alumni network becomes a long-term asset.

**Impact:** Medium-High (long-term moat, alumni engagement)
**Effort:** High (email migration flow, alumni state machine, access control refactor, long-term data retention policy)
**Tradeoffs:** Storage and maintenance cost for alumni data. Must define clear data retention policies. Alumni access must not dilute the "current students only" trust model. Consider making alumni features a future phase -- the bridge mechanism can be built now even if alumni features launch later.

---

## Quick Wins (Ship in Days)

| Feature | Days | Why Now |
|---------|------|---------|
| **Quiet Reputation Signals** | 1-2 | Policy + copy change on profile. Surface "Active in X spaces," "Member since," "Attended Y events" instead of follower counts. Data already exists. |
| **Handle Claim Campaign Assets** | 1-2 | Share card generator + "Founding Member" badge definition. Marketing asset for launch. |
| **Profile QR Card** | 1-2 | QR code generation from handle URL. Downloadable PNG with gold/void branding. Use `qrcode` npm package. |
| **Belonging Passport (Shared Context Card)** | 2-3 | Elevate the existing shared spaces banner into a prominent context card at the top of Zone 2. Data exists, this is a UI rearrangement. |
| **Verified Role Badge Display** | 2-3 | Space admin role assignments already exist. Render them as badges on profiles with space name + role + gold border. |

## Medium Bets (Ship in Weeks)

| Feature | Weeks | Why Now |
|---------|-------|---------|
| **Contribution Heat Map** | 1-2 | Aggregation pipeline over existing activity data + visual component. High pride/FOMO impact. |
| **Contextual Identity (Per-Space Persona)** | 2-3 | New data model (persona per membership) + UI in member lists and profile. Deepens per-space investment. |
| **Ghost Mode Refinement** | 2-3 | Privacy model refactor with per-space visibility. Live preview of profile as seen by different audiences. |
| **Profile Photo Stories (24-Hour Context)** | 2-3 | Photo upload + expiry logic + ring rendering. Liveness signal for the platform. |
| **Campus Resume Export** | 2-3 | PDF generation from profile data. Curation UI. Public profile URL enhancements. |

## Moonshots (Ship in Months+)

| Feature | Months | Why Eventually |
|---------|--------|----------------|
| **Reputation Rings** | 2-3 | Full aggregation service, anti-gaming logic, ring rendering, privacy controls. High long-term retention impact. |
| **Mutual Belonging Score** | 2-3 | Scoring algorithm + integration across all social surfaces. Powers relevance platform-wide. |
| **Identity Constellation** | 2-3 | Force-directed graph with semantic clustering and overlay logic. Memorable visual identity. |
| **Identity Evolution Timeline** | 1-2 | Event tracking aggregation + custom milestones + timeline UI. Emotional long-term value. |
| **Alumni Identity Bridge** | 3+ | Email migration, alumni state machine, access control refactor. Multi-year moat. |

---

## Competitive Analysis

### Discord
**Identity model:** Username + per-server nickname + per-server roles. No real name requirement. No campus verification. Avatar and banner are global.
**What's broken:** Identity is fragmented by server but not in a meaningful way -- it's an accident of architecture, not a design choice. There's no "me across all my communities" view. Reputation does not travel between servers. No concept of "belonging" -- you're either in a server or you're not.
**Structural inability:** Discord cannot add campus verification without alienating their core gaming audience. They cannot surface "shared servers" prominently without building a social graph they've explicitly avoided. Their per-server identity is technically similar to HIVE's per-space persona, but it lacks the belonging-first hierarchy.

### LinkedIn
**Identity model:** Single professional identity. Headline + company + connections + endorsements. Real names. Professional graph.
**What's broken:** Profiles are performative. Skills endorsements are meaningless (strangers endorse each other). Activity feed is corporate cringe. No concept of communities or belonging -- just companies and connections. Student profiles are empty shells because there's nothing to fill them with.
**Structural inability:** LinkedIn cannot pivot to belonging because their business model is recruiting (selling access to candidate data). A "spaces" model would fragment the monolithic profile that recruiters pay to search. They will never show "shared communities" because their communities (LinkedIn Groups) are dead.

### Instagram
**Identity model:** Visual identity. Grid + Stories + bio + follower count. Username namespace.
**What's broken:** Identity is aesthetic, not substantive. Follower count is the dominant metric, creating popularity anxiety. No concept of community membership -- following is asymmetric and passive. Students use Instagram for campus life but it's a broadcast channel, not a belonging platform.
**Structural inability:** Instagram cannot add community infrastructure without becoming Facebook Groups (which failed). Their ad-revenue model requires maximum attention, which is antithetical to belonging. They will never de-emphasize follower counts because engagement metrics drive advertiser spend.

### Slack
**Identity model:** Workspace-scoped profiles. Display name + title + status + timezone. No cross-workspace identity.
**What's broken:** Profiles are functional, not expressive. There is no reputation, no history, no sense of identity beyond "this person is in these channels." Status messages are the only expressive affordance. No concept of belonging -- just membership.
**Structural inability:** Slack cannot add belonging because they are optimized for work productivity, not community. Adding profile richness would slow down the "find the person, send the message" workflow. Their per-workspace isolation is a feature for enterprise privacy but a bug for campus community.

### What's Universally Broken

Every platform treats identity as either:
- **A card** (static bio + photo + stats) -- LinkedIn, Instagram
- **A role** (functional context within a workspace) -- Slack, Discord

None treat identity as **a map of belonging** -- where you are, who you're with, what you've contributed, how you've grown. This is the gap HIVE fills.

---

## Wedge Opportunities

### What a Belonging-First Identity Can Do That Others Cannot

1. **Answer "Should I talk to this person?"** Follower-based profiles tell you if someone is popular. Belonging-first profiles tell you if someone is *relevant to you*. Shared spaces, shared interests, shared events -- these are actionable signals that "47K followers" can never be.

2. **Make quiet contributors visible.** The student who attends every meeting, helps organize every event, but never posts publicly is invisible on Instagram and LinkedIn. On HIVE, their contribution heat map glows. Their reputation rings fill. Their attendance record speaks.

3. **Create non-extractive social proof.** "Member since Sep 2026" and "Active in 8 spaces" are non-comparative. They don't require someone else to have fewer. Everyone can be active in 8 spaces. This creates pride without hierarchy.

4. **Enable contextual trust.** When a student sees a message in a space, the sender's verified role badge and reputation ring immediately answer: "Is this person credible here?" This is contextual trust -- the AI club president has authority in AI discussions, not everywhere. This is impossible on platforms with a single global identity.

5. **Power physical-world moments.** The QR card, the campus resume, the "scan my HIVE" mechanic -- these turn digital identity into physical-world utility. No other campus platform has an identity portable enough to use at a career fair, a club meeting, and a random encounter in the library.

6. **Grow more valuable with time.** A profile that accumulates semesters of activity, leadership roles, event attendance, and tool creation becomes a comprehensive record of college life. The switching cost increases every month. By junior year, leaving HIVE means abandoning two years of documented belonging.

---

## Open Questions

1. **How do we prevent reputation systems from becoming popularity contests?** The contribution heat map and reputation rings must reward consistency and breadth, not volume. A student who posts 100 messages in one space should not outrank a student who actively participates in 10 spaces. What's the right weighting?

2. **Should handle changes be easier?** The 6-month cooldown after the first free change is harsh. Students experiment with identity, especially freshmen. A 30-day cooldown might better serve the "find yourself" phase while still preventing abuse. But shorter cooldowns reduce the perceived permanence that drives handle-claiming urgency.

3. **What happens to identity when HIVE expands to multiple campuses?** Is @sarah unique globally or per-campus? If globally, early adopters at UB have an advantage. If per-campus, the handle loses portability. The answer has long-term namespace implications.

4. **How much identity should be visible to non-HIVE users?** A public profile URL (hive.college/u/handle) is valuable for resumes and social sharing, but it creates a surface area for non-students to browse campus identities. How much should be visible without authentication?

5. **Should HIVE ever show "who viewed your profile"?** This is the most-requested feature on every social platform and also the most anxiety-inducing. It would drive profile completeness (people curate more when they know others are looking) but could make the platform feel surveilled. The belonging-first philosophy suggests no -- but the engagement data suggests yes.

6. **How does identity interact with AI?** If HIVE builds AI assistants that help students discover communities, those assistants need to understand identity. Should a student be able to ask "Who in my major is also interested in AI?" and get an answer? This is powerful but requires careful privacy design. Opt-in only? Aggregated only?

7. **What's the right density of badges?** Too few and they're meaningless ("everyone has Verified Student"). Too many and they become noise. The sweet spot is probably 8-12 earnable badges that represent genuinely distinct achievements, displayed max 3 at a time on the profile with "+N more" expansion.

8. **Can identity drive distribution?** The handle claim campaign and QR card are distribution mechanisms. Are there others? What if completing your profile generated a shareable "HIVE ID card" formatted for Instagram Stories? What if verified role badges could be exported as LinkedIn positions? Every identity artifact that leaves the platform is a distribution vector.
