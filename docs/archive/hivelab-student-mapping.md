# HiveLab Student Mapping

How every type of UB student interacts with HiveLab. Not everyone is a builder. This maps the full spectrum from passive consumer to power creator, with concrete scenarios, discovery paths, and the moments that convert one into the other.

---

## 1. The Interaction Spectrum

### Level 0: Pure Consumer (80% of students)

**What they see:** Finished tools deployed inside spaces they already belong to. Polls in sidebars. RSVP buttons on events. Countdown timers. Leaderboards. Feedback forms. They never see the word "HiveLab."

**What they do:**
- Vote on polls (Quick Poll, Decision Maker)
- RSVP to events (Event RSVP, Event Check-In)
- Fill out forms (Study Group Signup, Feedback Form, Office Hours)
- View leaderboards and stats (Leaderboard, Space Stats Dashboard)
- Read announcements and updates (Announcements, Weekly Update)
- Browse results and resources (Quick Links, Upcoming Events)

**What's hidden from them:**
- The HiveLab IDE entirely
- AI generation flow
- Template gallery (unless they're a space leader)
- Element registry / composition system
- Capability lanes and governance
- Any notion that these are "tools" vs. native features

**Key insight:** To 80% of students, HiveLab tools ARE the space. They don't distinguish between "the poll" and "the space's poll feature." The tool is invisible infrastructure. This is correct. If a consumer ever says "I used HiveLab today," the abstraction leaked.

**Language for this level:** "Features" or nothing at all. The poll is just "the poll." The RSVP button is just "going." They don't need a name for what powers it.

---

### Level 1: Customizer (15% of students)

**Who they are:** Space leaders, club officers, RA's, anyone who runs a group. They need their space to DO something specific but don't think of themselves as builders.

**What they see:** The template gallery when they click "Add to space" or "+" in the sidebar. A curated grid of 29 templates organized by use case (events, engagement, resources, feedback, teams, apps). One-click deploy with optional setup fields.

**What they do:**
- Browse template categories: events (5), engagement (5), resources (4), feedback (3), teams (6), apps (8)
- Deploy simple templates with one click (Quick Poll, Event Countdown, Quick Links)
- Fill in setup fields for templates that need them (poll question, event name, deadline)
- Deploy app-tier templates (Attendance Tracker, Competition Tracker, Photo Challenge) for more complex needs
- Remove/reorder tools in their space sidebar
- Toggle visibility (all members vs. leaders only)

**What's hidden from them:**
- The visual IDE / canvas
- Element registry details
- Connection wiring between elements
- Capability lanes (they see "this tool can notify members" warnings, not "Lane 3: Power")
- AI generation prompt

**Key insight:** Customizers don't build. They CHOOSE. The template gallery is their entire HiveLab experience. The quality bar: can a club president who has never written code deploy an attendance tracker in under 30 seconds? If yes, HiveLab works for customizers.

**Language for this level:** "Templates" or "Apps." Not "tools." A club president says "I added the attendance tracker to our space," not "I deployed a HiveLab tool."

---

### Level 2: Creator (4% of students)

**Who they are:** Students who tried templates but needed something different. A Greek VP who wants a points tracker that also sends notifications. An engineering club president who wants a project showcase with voting. Someone who said "I wish this template did X."

**What they see:** The AI generation flow. "Describe what you want, and we'll build it." A natural language prompt that creates a working tool from a description.

**What they do:**
- Use AI generation: "I need a points tracker where members check in at events, earn points per event type, and see a weekly leaderboard"
- Edit AI-generated tools: swap elements, change configs, adjust layout
- Remix existing templates: start from Attendance Tracker, modify to add point categories
- Connect elements: wire a form submission to update a leaderboard, or a countdown expiry to trigger an announcement
- Set capability levels: decide if their tool needs space member access (Lane 2) or notification ability (Lane 3)

**What's hidden from them:**
- Raw element code / internals
- Low-level config schemas (they use the visual config panels)
- Budget enforcement details (they see limits, not the BudgetUsage Firestore structure)
- Trust tier mechanics

**Key insight:** Creators emerge from customizers who hit a wall. The gap between "I need a template for this" and "I'll describe what I want" is the critical conversion point. AI generation is the bridge. The prompt isn't "learn our IDE" -- it's "tell us what you need."

**Language for this level:** "Create" or "Build." They say "I built a tool for our club" or "I created an app for rush events." The word "HiveLab" may appear here as a brand ("I made it in HiveLab").

---

### Level 3: Builder (1% of students)

**Who they are:** CS students who want to understand the system. Design students who want pixel-perfect control. The student who opens the IDE just to see how it works. Might publish tools for other spaces to use.

**What they see:** The full visual IDE. 27 interactive elements across 5 categories (input, filter, display, action, layout). DAG-based element composition. Connection wiring. Config schema editors. The element registry. Surface mode selection (widget vs. app). Capability and governance controls.

**What they do:**
- Build tools from scratch on the canvas
- Use all 27 elements: 8 input elements (search, date picker, user selector, form builder, event picker, space picker, member selector), 1 filter element, 10 display elements (result list, chart, progress, tag cloud, map, notifications, member list, space events, space feed, space stats, connection list), 7 action elements (poll, RSVP, countdown, leaderboard, counter, timer, announcement), 1 layout element (role gate)
- Wire connections between elements (form output -> leaderboard input, filter selection -> result list filter)
- Configure surface modes (widget sidebar vs. full-screen app)
- Publish tools for other spaces to discover and deploy
- Build with awareness of capability lanes (Safe, Scoped, Power)
- Create multi-element app-tier compositions (4+ elements with connections)

**What's hidden from them:**
- Nothing. Builders have access to everything the platform exposes.
- They still can't bypass capability governance (budget limits, trust tiers enforce server-side)

**Key insight:** Builders are rare and self-selecting. Don't design for them first. Design for consumers, make customizers successful, let creators feel powerful, and builders will find their own way. The IDE exists for them but shouldn't be the front door for anyone else.

**Language for this level:** "HiveLab IDE," "elements," "compositions," "canvas." They use system vocabulary because they've internalized the mental model.

---

## 2. Deep Persona Scenarios

### Maya - Freshman, Undeclared, Lives on Campus

**Week 1:**
- Downloads HIVE, joins 4 spaces: her dorm floor (residential), a cultural org, an intramural sports group, a general interest club
- Encounters HiveLab tools without knowing it: votes in a "What should we do for floor bonding?" poll in her residential space, RSVPs to a club meeting
- Sees a countdown timer for move-in week events in her floor space
- Fills out "Meet Your Neighbors" form (system tool: member-intro) on her floor

**Week 3:**
- Has voted in 6 polls across 3 spaces. Checked in to 2 events via Event Check-In
- Sees a leaderboard in her intramural space showing attendance points. She's 8th. This creates a tiny competitive hook
- Uses a Study Group Signup form posted in a class-related space. Meets 2 study partners

**Month 2:**
- Her RA asks the floor chat "Should we do movie night or game night?" Someone replies "just make a poll." RA deploys Quick Poll template in 15 seconds
- Maya watches this happen. First exposure to the idea that these tools are CREATED by people, not built into the platform
- Files this away. Doesn't act on it yet

**Month 3:**
- Maya becomes social chair of the cultural org. Now she's a LEADER, not just a member
- Opens the space settings. Sees "Add to space" with the template gallery
- Deploys Event RSVP for their upcoming cultural night. Event Countdown for finals week study session
- She's now a Customizer. Conversion happened because of a ROLE CHANGE, not a feature discovery

**The pattern:** Consumer -> role change -> Customizer. Maya never went looking for HiveLab. It came to her through leadership.

---

### Marcus - Junior, Club President, Pre-Law

**Week 1:**
- His club (Mock Trial) already has a space with system tools: Events, Quick Poll, Resources
- As president, he's frustrated: "I need attendance tracking that actually works. We need to know who shows up to practice"
- Searches template gallery. Finds Attendance Tracker (app-tier). Deploys it. Setup: "Mock Trial Practice," 10 points per attendance
- 30 seconds from problem to solution

**Week 3:**
- Attendance Tracker is working. Members check in, see themselves on the leaderboard. Engagement at practice goes up 40%
- Marcus wants more: "Can I make it so people who miss 3 practices get a notification?" This requires Power lane (send_notifications)
- He doesn't have the template for this. This is the "Oh, I can make that?" moment
- Opens AI generation: "I need an attendance tracker that also tracks who missed 3+ practices and shows them a warning banner"
- AI generates a composition with: RSVP button + counter + leaderboard + announcement (warning for low attendance)
- Marcus is now a Creator

**Month 2:**
- His attendance tool gets noticed by other club presidents. They ask "how did you make that?"
- Marcus shares his tool. 4 other spaces deploy it. His tool now has provenance: deploymentCount: 5, uniqueUsers: 120
- Marcus doesn't think of himself as a "builder." He's a club president who solved a problem

**The pattern:** Customizer -> hitting a wall (templates don't do exactly what he needs) -> AI generation bridge -> Creator. The trigger was a specific, concrete operational need, not curiosity about the platform.

---

### Priya - Sophomore, Commuter, CS Major

**Week 1:**
- On campus 3 hours/day, between classes. Uses HIVE primarily on mobile during bus commute
- Joins 2 academic spaces (CS study group, Women in Tech) and 1 interest group (hiking club)
- Interacts with tools during dead time: votes in polls waiting for the bus, checks leaderboard between classes
- Never browses the template gallery. Never visits HiveLab. Pure consumer

**Week 3:**
- Her CS professor creates a space for their class section. Deploys a Study Group Matcher
- Priya fills out the form: availability, topics, preferred group size. Gets matched with 3 students who have overlapping free periods
- This is the highest-value HiveLab interaction for a commuter: ASYNC coordination that respects her limited on-campus time

**Month 2:**
- Priya becomes a TA. Her professor asks her to manage the class space
- She deploys Office Hours (so students can book 1:1 time with her), Feedback Form (end-of-section survey), and Quick Links (course resources)
- Three templates, three problems solved, zero coding knowledge needed

**Month 3:**
- Building a portfolio project for internship apps. Wants a "campus resource finder" as her project
- Discovers the HiveLab IDE through the main navigation. Looks at how elements work
- Doesn't build inside HiveLab (she writes her own React app) but uses HiveLab's element patterns as inspiration
- This is the Builder-adjacent path: HiveLab as mental model, not as tool

**The pattern:** Commuter engagement is ASYNC and transactional. Tools that respect limited time (forms, matchers, quick polls) are high-value. Tools that require synchronous presence (live leaderboards, real-time counters) are lower-value for commuters. Design for async-first, sync as bonus.

---

### Jordan - Senior, Greek VP of Programming, Business Major

**Week 1:**
- Their chapter has a Greek space with system tools: Events, Points Tracker, Quick Poll
- Jordan is VP of Programming, responsible for social events, philanthropy, and rush
- Currently tracking everything in a Google Sheet. Wants to centralize

**Week 2:**
- Deploys Multi-Poll Dashboard for board vote on spring event budget. Deadline, 3 simultaneous votes, instructions announcement
- Deploys Competition Tracker for philanthropy fundraiser: $5,000 goal, leaderboard by member contribution, daily progress chart
- Deploys Event Series Hub for weekly chapter meetings: recurring events, photos, feedback polls

**Week 3:**
- Rush season. Jordan needs: RSVP tracking for rush events, check-in at each event, PNM (potential new member) feedback forms after each round
- No single template covers this. Opens AI generation: "I need a rush event tracker: RSVP for each event, check-in at the door, a form after each event for brothers to rate PNMs (anonymous), and a leaderboard of PNM engagement across all events"
- AI generates a 5-element composition. Jordan tweaks it, deploys it
- This tool becomes the chapter's most-used tool during rush. 200+ interactions in 2 weeks

**Month 2:**
- Jordan publishes the rush tracker as a template other Greek spaces can use
- 8 other chapters adopt it. Jordan has accidentally become a HiveLab power user

**The pattern:** Greek life is template PARADISE. The operational complexity (points, philanthropy, rush, elections, social planning) maps perfectly to multi-element app compositions. Jordan didn't learn HiveLab -- HiveLab learned Greek life through templates that map to real Greek operations.

---

### Wei - Freshman, International Student, Engineering

**Week 1:**
- Everything is new. Culture, campus, language nuances. Uses HIVE to find structure
- Joins: Chinese Students Association, Engineering Explorers, campus-wide International Students space
- Encounters tools as orienting structure: Upcoming Events shows him what's happening this week. Quick Links gives him resources for international student services
- Fills out a Study Group Signup form. The form fields are straightforward (name, course, availability) -- no cultural knowledge needed

**Week 3:**
- The Chinese Students Association deploys a What Should I Eat? tool (when campus dining data is available) and an Anonymous Q&A
- Wei uses the Q&A to ask "where can I find Asian grocery stores near campus?" anonymously. Gets helpful responses from upperclassmen
- The anonymity matters: Wei doesn't want to seem lost or ignorant. Tools that allow low-exposure participation are critical for international students

**Month 2:**
- Wei is comfortable. Joins more spaces. Becomes an active participant (not just consumer)
- Doesn't become a customizer or creator this semester. That's fine. HiveLab served him by making spaces useful without requiring him to understand the system behind them

**Month 4 (Spring semester):**
- Wei becomes social chair of the Chinese Students Association
- Deploys Event RSVP, Event Countdown, and Photo Challenge for Lunar New Year celebration
- Uses AI generation to create a bilingual announcement tool that shows content in both English and Chinese
- First international student creator use case: LOCALIZATION as a need that templates don't cover

**The pattern:** International students need LOW-EXPOSURE entry points. Anonymous Q&A, forms, and passive consumption (reading events, viewing leaderboards) are safe. Active participation (posting, creating) comes later when social comfort is established. Tools should never assume cultural context (no "Thanksgiving break" defaults, no American sports references in templates).

---

### DeShawn - Sophomore, Student Athlete (Basketball), Communications Major

**Week 1:**
- His team has a space (auto-created, type: student). System tools: Events, Quick Poll, Resources
- DeShawn's time is extremely constrained: practice, games, travel, classes, mandatory study hall
- Interacts with tools in 30-second bursts between activities: votes in polls, checks event times, RSVPs

**Week 3:**
- Team manager deploys Attendance Tracker for optional team events (community service, appearances)
- DeShawn sees himself on the leaderboard. He's competitive. Checks in to 3 optional events he might have skipped
- The leaderboard element works for athletes because competition is their native language

**Month 2:**
- DeShawn wants to start a media/content creation club (podcasting about college athletics)
- Creates the space himself. Deploys: Events (for recording sessions), Quick Poll (episode topic voting), Feedback Form (listener feedback)
- Three templates, done while waiting for the bus to an away game

**The pattern:** Athletes are TIME-CONSTRAINED consumers who respond to COMPETITIVE elements (leaderboards, counters, progress trackers). They won't become builders, but they'll deeply engage with tools that map to competitive dynamics. When they DO create spaces (often around interests outside their sport), they use templates efficiently because they're used to operational structure from their teams.

---

### Sam - Junior, Introvert, English Major

**Week 1:**
- Sam joined HIVE reluctantly. Their roommate made them. Joined 2 spaces: a creative writing group and a book club
- Doesn't post. Doesn't comment. Lurks. Reads
- Encounters a Quick Poll in the book club: "Next book?" Sam votes. This is participation without exposure. Perfect for introverts

**Week 3:**
- The creative writing group deploys an Anonymous Q&A. Sam submits: "Does anyone else struggle with sharing their work? Any tips for getting over the anxiety?"
- Gets 12 responses. First meaningful connection on the platform. Anonymous tools are the introvert's front door

**Month 2:**
- Sam becomes comfortable enough to fill out a Study Group Signup form for their English seminar
- Gets matched with 2 other students. They meet in person. Sam now has study partners they never would have approached
- The Study Group Matcher is the most introvert-friendly tool in the entire system: async, structured, no cold-approach required

**Month 3:**
- Sam starts posting in the creative writing space. Short pieces. Gets feedback
- Notices the space doesn't have a good way to share and vote on work. Mentions it to the space leader
- Space leader deploys a Photo Challenge template (repurposed as "Writing Challenge": submit work, vote on favorites, weekly leaderboard)
- Sam doesn't create the tool. Sam's NEED created the tool through their leader. This is valid creator influence without creator behavior

**The pattern:** Introverts interact with tools that provide ANONYMITY, ASYNC participation, and STRUCTURED social interaction. They rarely become creators, but they're often the reason creators build things. The feedback loop: introvert mentions a need -> leader deploys a template -> introvert's engagement deepens. HiveLab serves introverts best when introverts never know it exists.

---

### Aaliyah - Transfer Student, Junior, Biology Major

**Week 1:**
- Transferred from community college. Missed freshman orientation, has no existing social graph at UB
- HIVE's onboarding suggests spaces based on her major and interests. She joins: Pre-Med Society, a volunteer org, Black Student Union
- Encounters tools immediately: Upcoming Events in Pre-Med gives her 3 things to attend this week. Quick Links in BSU gives her resources
- Unlike freshmen, she doesn't have the "we're all new together" social advantage. Tools that don't require knowing anyone are critical

**Week 3:**
- Fills out a Study Group Matcher in her Bio class space. Gets matched
- Uses Event Check-In at a Pre-Med meeting. Sees herself on the leaderboard. Small moment of belonging: "I showed up. I'm here. I count."
- The counter and leaderboard elements serve a validation function for transfers that's different from freshmen: proof of membership, not competition

**Month 2:**
- Aaliyah becomes involved in BSU leadership. Takes on event coordination
- Deploys: Event RSVP for their heritage celebration, Feedback Form post-event, Budget Overview for semester planning
- Uses Competition Tracker (app-tier) for their community service drive: goal, leaderboard, progress tracking

**The pattern:** Transfer students need IMMEDIATE UTILITY from tools. No ramp-up period. The tools that matter most are ones that give structure to their first interactions: event lists, sign-up forms, matchers. They skip the lurking phase that freshmen and introverts need because they're already behind and know it. Tool deployment becomes a way to establish themselves as valuable contributors to organizations.

---

## 3. Discovery Paths

How students encounter HiveLab tools. Ordered by frequency and importance.

### Path 1: Inside a Space (Primary - 70% of discovery)

Student joins a space. Space already has deployed tools in the sidebar. Student interacts with them as native features. This is the default path for ALL consumers.

**What makes this work:** System tools auto-deploy by space type. Student spaces get Events + Quick Poll + Resources by default. Greek spaces get Events + Points Tracker + Quick Poll. Residential spaces get Floor Poll + Events + Meet Your Neighbors. From day one, every space has working tools.

**Conversion trigger:** Student becomes a space leader and discovers the template gallery through the "Add to space" action.

### Path 2: In Chat / Inline (Secondary - 15% of discovery)

A space leader or member drops an inline tool into chat: a poll, an RSVP, a countdown, a question. Students interact with it IN the conversation flow. They don't navigate to a tool -- the tool comes to them.

**Available inline tools:** Poll, RSVP, Question, Countdown (4 inline system tools)

**Conversion trigger:** A member sees an inline poll and wonders "how did they do that?" Discovers the "+" button in the composer that offers inline tool insertion.

### Path 3: From Another Student (Social - 8% of discovery)

Marcus's attendance tracker gets shared. "How did you make that?" Social proof. The most powerful conversion mechanism for moving from Customizer to Creator.

**What makes this work:** Tool provenance tracking (deploymentCount, uniqueUsers, rating). When a tool has been deployed by 8 other spaces and used by 200+ students, it carries social proof.

**Conversion trigger:** Seeing a tool and wanting something like it but different. "That attendance tracker is cool but I need one for philanthropy points, not meeting attendance."

### Path 4: From an Event (Experiential - 4% of discovery)

Student attends an event. At the door: "Check in on HIVE." They tap an Event Check-In tool. After the event: "Fill out our feedback form." The tool is woven into the physical event experience.

**Conversion trigger:** Event organizer realizes they need a custom check-in flow and discovers templates/AI generation.

### Path 5: From Search / Browse (Intentional - 2% of discovery)

Student goes to the template gallery or HiveLab section deliberately. This is the rarest path because it requires knowing HiveLab exists. Only builders do this.

**Conversion trigger:** Already a creator or builder. Looking for specific functionality.

### Path 6: From AI Suggestion (Ambient - 1% of discovery)

Student describes a problem in a space or to the platform ("I wish we had a way to..."). AI suggests a template or offers to generate a tool. This path doesn't exist yet in full form but is the future of zero-friction tool creation.

**Conversion trigger:** AI removes the last barrier between "I have a need" and "I have a tool."

---

## 4. The "Oh, I Can Make That?" Moment

This is the single most important conversion event in HiveLab's adoption lifecycle. It's the moment a consumer or customizer realizes that the tools they've been using weren't built-in features -- they were CREATED by other students, and they can create them too.

### What Triggers It

**Trigger 1: Watching a leader deploy a template (most common)**
RA creates a poll in 15 seconds while the floor watches in chat. "Wait, you just MADE that?" The speed is the revelation.

**Trigger 2: A template gap (second most common)**
"The attendance tracker is great but I need it to also track X." The moment the existing tool almost-but-not-quite solves their problem. This is where AI generation catches them: "Just describe what you need."

**Trigger 3: Social proof from another creator**
"Marcus built this attendance tracker that 8 other clubs use now." The social currency of being a creator is real but subtle. It's not gamified -- it's reputation.

**Trigger 4: A role change**
Becoming a space leader, officer, or RA. New responsibilities create new needs. The template gallery becomes relevant because they now have PROBLEMS to solve.

### What CTA Works

**Wrong:** "Build your own tool in HiveLab!" (Too technical, too demanding, too abstract)

**Wrong:** "Try our no-code IDE!" (IDE is a word for builders, not students)

**Right:** "Need something for your space? Pick a template or describe what you want." (Problem-first, not tool-first)

**Right:** "12 other clubs use this. Want to add it to yours?" (Social proof + one action)

**Right:** In the template gallery, after deploying a template: "Want to customize this further? Describe what you'd change." (Graduated complexity from the template they already chose)

### The Conversion Funnel

1. **Use a tool** as a consumer (vote in poll, RSVP to event) -- no awareness of HiveLab
2. **See a tool created** by a leader in real-time -- first awareness that tools are created, not built-in
3. **Become a leader** and discover the template gallery -- first personal interaction with tool deployment
4. **Deploy a template** -- first successful creation (even though it's one-click)
5. **Hit a template gap** -- "I need this template but with X" -- motivation to go deeper
6. **Use AI generation** or remix a template -- first real creation moment
7. **Share the tool** with others -- creator identity solidifies

Most students stop at step 1 or 3. That's by design. Every step should feel like a natural next action, never a demanded one.

---

## 5. AI's Role Per Persona

### For Consumers: Invisible

AI powers the tools they use, but they never see it or interact with it directly.

- **Feed ordering** that surfaces relevant tools and spaces
- **Smart defaults** when tools are deployed by their leaders (AI suggests config based on space type)
- **Search understanding** that connects "study help" to spaces with Study Group Matcher tools

Consumers should never think about AI. If they notice AI, the tool failed.

### For Customizers: Suggestive

AI helps leaders choose and configure the right templates.

- **Template recommendations**: "Based on your space type (Greek), other chapters use: Points Tracker, Event RSVP, Multi-Poll Dashboard"
- **Setup field suggestions**: When deploying a poll template, AI pre-fills the question based on recent space activity or common patterns
- **Post-deployment tips**: "Your attendance tracker would work better with a countdown timer. Add one?" (Template upsell)

AI for customizers is a helpful assistant, not a generative engine. It suggests, doesn't create.

### For Creators: Generative

AI is the primary creation mechanism. Describe -> Deploy.

- **Natural language generation**: "I need a tool that lets members submit project ideas, vote on them, and tracks which ones get approved" -> AI generates a 4-element composition (form + poll + filter + result list)
- **Remix assistance**: "Take the attendance tracker and add a notification when someone misses 3 events" -> AI modifies the existing composition
- **Config optimization**: AI adjusts element configs based on space context (member count, activity level, space type)

AI for creators is a co-pilot. It does the heavy lifting of composition while the creator focuses on WHAT, not HOW.

### For Builders: Co-pilot

AI works alongside builders in the IDE.

- **Element suggestions**: Builder places a form on canvas, AI suggests "Connect this to a result list to show submissions"
- **Connection wiring**: AI proposes connection patterns between elements based on common compositions
- **Capability recommendations**: "Your tool uses member-list and notification elements -- it needs Scoped + Power lane. Here are the budget implications"
- **Debugging**: "This connection won't work because the form output type doesn't match the leaderboard input. Try adding a counter element as an intermediary"

AI for builders is a peer developer. It understands the system and offers technical guidance.

---

## 6. What "Tools" Should Be Called

Language matters. The wrong word creates a barrier. Different audiences need different vocabulary.

### For Consumers: Nothing

They don't need a word for what powers the features. The poll is "the poll." The RSVP button is "the RSVP." The leaderboard is "the leaderboard." No system vocabulary needed.

If forced to name it: "features." "Check out the features in our space."

### For Customizers (Space Leaders): "Templates" or "Apps"

- "Add a template to your space"
- "Browse apps for your space"
- "Your space has 3 active apps"

"Templates" for simple (1-2 element) deployments. "Apps" for complex (4+ element) compositions. This maps to the existing `TemplateComplexity` type: `simple` | `app`.

### For Creators: "Tools" or "Apps"

- "Create a tool for your space"
- "Build an app with AI"
- "Your tools" (dashboard of things they've created)

"Tool" works here because creators have enough context to understand the abstraction. "App" works for sharing ("I made an app that tracks attendance").

### For Builders: "HiveLab" / "Compositions" / "Elements"

Full system vocabulary. They earned it by going deep.

- "HiveLab IDE"
- "Element composition"
- "27 elements across 5 categories"
- "DAG-based wiring"

### The Cardinal Rule

NEVER use builder language for consumers. NEVER say "HiveLab element composition" to a club president. NEVER show "DAG" to a freshman. The system vocabulary is for the system. The user vocabulary is for the user.

| Audience | They say | We say |
|----------|----------|--------|
| Consumer | "I voted in the poll" | (nothing -- it's just a feature) |
| Customizer | "I added a template" | "Add an app to your space" |
| Creator | "I built a tool" | "Create with AI" or "Build an app" |
| Builder | "I composed elements" | "HiveLab IDE" |

---

## Summary: What This Means for Product Decisions

1. **Template quality is the product for 95% of users.** The 29 templates (21 simple, 8 app-tier) are the entire HiveLab experience for everyone except builders. Invest in templates, not the IDE.

2. **Discovery is spatial, not navigational.** Students find tools INSIDE spaces they already belong to. The template gallery is a leader feature, not a student feature. Don't put HiveLab in the main nav for consumers.

3. **AI generation is the bridge from customizer to creator.** The moment a template doesn't quite fit, AI catches the student. "Describe what you need" is a lower barrier than "learn our IDE."

4. **System tools by space type are HiveLab's Trojan horse.** Auto-deployed tools (Events, Quick Poll, Resources, Points Tracker, Floor Poll, Meet Your Neighbors) make every space useful from day one. Students use HiveLab tools before they know HiveLab exists.

5. **Inline tools are the chat-native discovery path.** Polls, RSVPs, countdowns, and questions dropped into chat conversations normalize the idea that tools can appear anywhere, not just in sidebars.

6. **Role changes drive conversion more than feature discovery.** Students don't explore HiveLab. They GET PROMOTED to a role where HiveLab becomes relevant. Design for the moment someone becomes a leader, not the moment someone goes exploring.

7. **The interaction spectrum is healthy at 80/15/4/1.** Don't try to make everyone a builder. The 80% who only consume are the REASON creators build. Without consumers, tools have no audience. Without creators, spaces have no tools. The ecosystem needs all levels.

8. **Introvert and international student pathways are anonymity-first.** Anonymous Q&A, async forms, structured matchers, and passive consumption (viewing leaderboards, reading announcements) are not edge cases -- they're the primary pathways for students who don't have social comfort to participate visibly.
