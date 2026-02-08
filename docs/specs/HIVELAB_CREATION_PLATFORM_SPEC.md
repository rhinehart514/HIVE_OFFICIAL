# HiveLab: The Creation Platform Spec

The definitive document. What HiveLab is, who it's for, and why it matters.

---

## 1. Platform Vision

HiveLab is a campus-gated creation platform where verified students build operational tools for their organizations -- polls, sign-ups, dashboards, attendance trackers, event systems -- without writing code. Creation is exclusive to students with verified campus emails. Usage is open to anyone invited. Tools live on creator profiles as a portfolio of real impact, verified by campus identity and usage data. HiveLab is Canva's simplicity with Notion's depth, scoped to campus life and protected by the only moat that matters: real identity at a real school.

---

## 2. Who It's For

Five tiers. One rule: expand READ access, never WRITE access.

### Tier 1: Full Creators (Campus-Gated Students)

Verified `.edu` email required. This is the only tier that creates, edits, publishes, and deploys tools. This gate NEVER opens. Campus identity is the product's structural advantage -- every tool is attributable to a real person at a real school. The moment creation opens to the public, HiveLab becomes a worse Notion.

What they do: Build tools using 27 element types, 29 templates, AI generation, and the visual IDE. Deploy to spaces they lead or belong to. Earn capability tiers through usage. Build portfolios of impact.

### Tier 2: Portfolio Holders (Alumni)

Graduated students. Their tools persist in read-only state -- viewable, shareable, forkable, but not editable or creatable. The GitHub model: contributions outlive tenure. Alumni can view their portfolio, share links, and mentor active students. They cannot create new tools or modify existing ones.

80% of alumni will be passive (browse portfolio, share links). 20% will mentor. Almost none will create post-graduation. Campus identity stays relevant for 2-5 years post-grad, then becomes nostalgia. Tools display in "graduated" state with the original campus affiliation.

### Tier 3: Browsers (Investors, Recruiters, Faculty, Prospective Students)

Anyone can browse the tool gallery, view creator profiles, see usage metrics. Cannot create. This is the Figma Community model -- browse and use is open, creation is gated. Recruiters see verified impact data ("847 students used this tool"). Investors see platform-wide metrics. Prospective students see what campus life looks like from the inside.

### Tier 4: Consumers (Invited Users)

Faculty, staff, or external collaborators invited to USE specific tools within specific spaces. Invited by space members. Cannot browse campus-wide features or access other spaces. The Discord role model -- scoped permission, not platform access.

Faculty using student-built tools = validation. Faculty creating tools = scope creep into LMS territory. Faculty are consumers and sponsors, not creators. University admins should commission student teams to build tools, not build them directly.

### Tier 5: Dashboard Viewers (University Admins, Investors)

Aggregate metrics only. No tool-level access. No individual student data. Dashboards show: tools created, active users, engagement rates, campus adoption curves. The Roblox investor relations model -- enough data to make decisions, not enough to violate privacy.

### Why This Model Works

Facebook opened campus gates and killed what made it special. Facebook Campus (2020-2022) tried to re-add exclusivity and failed in under two years. Fizz proved campus-only apps can raise $41.5M across 240 campuses. Figma Community proved that open browsing + gated creation drives enormous creator motivation. GitHub proved that read-only audiences (recruiters viewing profiles) create massive value for creators without diluting the platform. Discord proved role-based permissions let five different audiences coexist without merging into one undifferentiated mass.

---

## 3. The Tool Model

### Kill the Three-Tier Taxonomy

The personal/space/public taxonomy fails because it conflates three independent concerns: where does the tool run, who can see it, and what data can it access. Personal tools compete with polished native apps (a GPA calculator loses to every existing GPA app). Safe-lane personal tools can't access campus context -- the only thing that would make them worth building. And a "public gallery" at launch with 10-50 tools is an emptiness crisis, not a feature.

### One Concept: Tools

Every tool has four properties:

**Context binding:** Standalone or space-bound. Most tools are space-bound (90%+ of usage). Standalone tools live on the creator's profile.

**Visibility:** Private, space, campus, or link-shared. Toggleable like Google Docs sharing. Space-bound tools inherit space visibility by default. Creators can promote campus-visible tools to the gallery when it exists.

**Creator attribution:** Always visible. Every tool links to the creator's profile. Attribution persists even after graduation. Fork counts and usage stats are public on the creator's profile.

**Lifecycle state:** Draft, live, archived, graduated. Tools have optional expiration dates for event-linked use cases. Semester-end prompts ask creators to archive or renew. "Graduated" state is automatic when a creator's campus affiliation expires.

### Tool Lifecycle

```
Creation -> Sharing -> Discovery -> Usage -> Evolution -> Graduation
   |           |           |          |          |           |
  IDE/AI    Space/Link   Gallery   Analytics  Versions    Alumni
  Template   Campus      Search    Forks      Transfers   Portfolio
  Inline     Profile     Recs      Metrics    Ownership   Read-only
```

### Ownership Transfer

The biggest unsolved problem in campus organizations: what happens when the president graduates. Tools support ownership transfer to another verified campus member. "Institutional" tools can be owned by a space rather than a person, surviving any individual's graduation.

### Usage Prediction at Launch

| Category | Share of interactions |
|----------|---------------------|
| Space tools (system + template) | 90% |
| Space tools (AI-created) | 5% |
| Personal/standalone | 3% |
| Campus-wide/gallery | 2% |

Build for the 90% first.

---

## 4. Capability Tiers

Earned, not paid. Usage unlocks capability, not a credit card. This is the progression system that turns tool creation into a skill tree.

### Level 1: Creator (Everyone, Day 1)

Unlocked immediately on signup. No barriers to first creation.

- All 27 elements, AI generation, 29 templates, basic theming
- **Limits:** 5 tools, 10 elements per tool, 0 automations, 0 connections
- **Builds:** poll, RSVP, countdown, simple form, announcement board
- **Capability lane:** Safe only (read/write own state, shared state)

### Level 2: Builder (Earned)

**Unlock criteria:** 3 tools deployed, 10+ unique users across tools.

- Tool connections (link tools that share data), basic automations (event triggers), usage analytics dashboard, version history
- **Limits:** 10 tools, 15 elements per tool, 3 automations, 5 connections
- **Builds:** connected attendance + RSVP system, form with notification triggers, filtered member directory
- **Capability lane:** Scoped (read space context, member list)

### Level 3: Architect (Earned)

**Unlock criteria:** 5 tools deployed, 50+ users, tools in 2+ spaces.

- Scheduled automations (cron), conditional logic (formula expressions, Notion-style), multi-tool dashboards, custom theming, embeddable tools (iframe), collaboration (multi-creator editing)
- **Limits:** 20 tools, 20 elements per tool, 10 automations, 20 connections
- **Builds:** org management dashboard, automated onboarding flow, semester-reset system
- **Capability lane:** Power (create posts, send notifications, trigger automations, with budgets)

### Level 4: Innovator (Earned)

**Unlock criteria:** 100+ users, tools in 3+ spaces, community contribution (published template or 5+ forks of their tools).

- Beta features, template publishing to campus gallery, featured in showcase, creator badge on profile, pre-built API connectors (Google Sheets, Slack), advanced data visualization
- **Limits:** Unlimited tools, all maximums removed
- **Builds:** campus-wide systems, template libraries, cross-org tools
- **Capability lane:** Full Power with elevated budgets

### The Deliberate Ceiling

HiveLab is NOT a full app builder. The ceiling is campus operational tools -- not apps with custom backend logic, external API integrations beyond pre-built connectors, or payment processing. When someone hits that ceiling, they've graduated from HiveLab. Export tool spec as JSON schema and build it as a real app. The Framer philosophy: we make the thing that makes the thing, until the thing needs to be its own thing.

Position: "Anyone can build in 5 minutes. Power users can build systems in 30."

Formula expressions at most. No code. Ever.

---

## 5. Power Features

Prioritized by build complexity and user impact. What ships when.

### Priority 1: Analytics Dashboard

**Complexity:** Medium (2-3 weeks). **Impact:** High.

Data already exists in `ToolTimelineEvent` and `ToolSharedState`. Need: visualization UI, time-range filtering, comparison views. Shows: unique users, interactions, peak usage times, element-level engagement. Unlocks at Builder tier. This is the feature that makes creators care about quality -- when you can see 200 people used your tool, you iterate.

### Priority 2: Visual Automation Builder

**Complexity:** Medium-High (3-4 weeks). **Impact:** High.

Types fully defined in `tool-automation.types.ts`. Need: visual builder UI with sentence-based descriptions ("When someone RSVPs, notify the group leader"). Trigger types: element interaction, schedule, threshold. Action types: notification, post creation, state update. Unlocks at Builder tier (basic) and Architect tier (scheduled/conditional).

### Priority 3: Tool Connection UI

**Complexity:** Medium (2-3 weeks). **Impact:** Medium-High.

Types defined in `tool-connection.types.ts`. Need: connection discovery panel, data flow visualization, port compatibility display. Connections are auto-inferred where possible, manually wired by Builders and above. Hidden from Level 1 creators entirely.

### Priority 4: Progression System

**Complexity:** Low-Medium (1-2 weeks). **Impact:** High (retention).

Badges, tracking, unlock notifications, progress toward next level. Visible on profile. "3 more unique users to unlock automations." Gamification that drives real capability growth, not vanity metrics.

### Priority 5: Embeddable Tools

**Complexity:** Medium (2-3 weeks). **Impact:** Medium.

Iframe embed with auth token. Allows tools to be embedded outside HIVE -- in course websites, org homepages, event pages. Drives external traffic back to the platform. Unlocks at Architect tier.

### Priority 6: Portfolio / Showcase Page

**Complexity:** Low-Medium (1-2 weeks). **Impact:** High (long-term).

Creator profile page showing all tools with usage stats, fork counts, featured/pinned tool. The "non-code GitHub" profile. This is a sleeper feature -- see Section 6.

### Priority 7: Template Publishing

**Complexity:** Low (1 week). **Impact:** Medium.

Allow Innovator-tier creators to publish tools as templates others can deploy. Review process by campus admin or community voting. Published templates appear in template gallery.

### Priority 8: Pre-Built API Connectors

**Complexity:** High (4-6 weeks per connector). **Impact:** Medium.

Google Sheets first (export tool data to spreadsheet). Then Slack (notifications to Slack channels). Then Google Calendar (event sync). Unlocks at Innovator tier. Each connector is a significant build, so ship one at a time based on demand.

---

## 6. Creator Profiles & Portfolio

### The Non-Code GitHub

No equivalent exists for "I built operational tools that real people used." LinkedIn has resumes. GitHub has code. Behance has designs. Nothing captures: "I built an attendance system used by 847 students across 12 organizations at the University at Buffalo."

A HiveLab creator profile shows:

- **Tools built** with usage stats (unique users, total interactions, active deployments)
- **Fork count** as social proof ("14 other creators built on this")
- **Featured/pinned tool** chosen by the creator
- **Campus affiliation** (verified, not self-reported)
- **Capability tier** and badge (Creator / Builder / Architect / Innovator)
- **Impact summary** ("Tools used by 2,340 students this semester")
- **Active deployments** (which spaces are running their tools)

### Why This Matters

**For retention:** Creator motivation shifts from utility ("I need a poll") to reputation ("My tools are used by 800 people"). Reputation-driven creators come back daily. Utility-driven creators come back when they need something.

**For career outcomes:** A verified portfolio of operational tools with real usage data is more compelling than a resume bullet point. Recruiters can see exactly what a student built, how many people used it, and that it was verified by campus identity -- not self-reported.

**For alumni persistence:** The portfolio is the reason alumni stay. Not to create, but to show. "Look what I built in college" is a lifelong link to the platform.

**For the business:** Profiles are the face of the read-only audience tier. Recruiters browsing profiles is a monetizable audience. Portfolio links shared on LinkedIn drive organic discovery.

---

## 7. Campus Gallery & Discovery

### When to Build It

NOT at launch. A gallery with 10-50 tools feels empty and signals a dead platform. The gallery ships when a campus crosses 50+ campus-visible tools. Before that threshold, discovery happens through spaces (system tools, leader-deployed tools) and word-of-mouth ("How did you make that?").

### How Discovery Works Pre-Gallery

| Discovery path | Frequency | Description |
|---------------|-----------|-------------|
| Space sidebar | 70% | Students use deployed tools as native features |
| Inline in chat | 15% | Leaders drop tools into conversation |
| Social proof | 8% | "How did you make that?" conversion moment |
| Event-linked | 4% | Check-in tools, feedback forms at events |
| Intentional browse | 2% | Direct navigation to templates |
| AI suggestion | 1% | "Your club has an event but no RSVP. Add one?" |

### Gallery Design (Post-50 Tools)

- **Featured/curated section:** Admin-picked, not algorithmic. Algorithms need scale; curation works at campus size.
- **Category browsing:** Events, Engagement, Organization, Tracking, Communication.
- **"Popular in [category]":** Simple usage-based ranking within categories.
- **Creator attribution:** Every gallery entry links to the creator's profile.
- **One-click fork:** Deploy someone else's tool to your space with your customizations.

### No Algorithm at Launch

Algorithmic recommendations require data density that doesn't exist at launch. Start with curation (admin picks featured tools), graduate to "popular" sorting, then consider algorithmic recommendations when there are 500+ tools and meaningful interaction data.

---

## 8. Investor & Alumni Experience

### Dashboard for University Admins / Investors

What they see (aggregate only, no individual student data):

- **Creation velocity:** Tools created per week, trending up or down
- **Active tools:** Total, by category, by space type
- **Student engagement:** DAU/MAU ratio, tools per student, creation-to-consumption ratio
- **Campus adoption curve:** % of registered students, % of spaces with custom tools
- **Template adoption:** Which templates spread, cross-campus template usage
- **Retention cohorts:** D7, D30, D90 by user type (creator vs consumer)

### The Demo Flow for Investors

1. Show aggregate dashboard: "1,200 tools built by 340 student creators serving 8,400 students"
2. Show a creator profile: "This sophomore built an attendance system used by 12 organizations"
3. Show tool creation: Live demo of conversational AI creation -- describe, preview, deploy in 30 seconds
4. Show cross-campus: "This template started at UB and is now used at 14 universities"
5. The closer: "Every campus has 500+ student orgs. Each one needs tools. Right now they use 15 different apps badly. We give them one platform to build exactly what they need."

### Alumni Persistence Model

Alumni tools enter "graduated" state automatically. The tool record persists, linked to the alumni's profile with original campus affiliation. Tools remain forkable by active students. Alumni can:

- View their portfolio and share links
- See lifetime usage stats for their tools
- Mentor active creators (view, comment, suggest)
- Cannot create, edit, or delete

The alumni experience is intentionally minimal. Don't build features for alumni that detract from the student creation experience. The portfolio link is the feature.

---

## 9. Business Model

### Revenue Streams

**1. Campus Licensing ($25-75K/year per university)**

Admin dashboard, SSO integration, branded instance, analytics, moderation tools, priority support. This is the anchor revenue. Target: 10 campuses in year 1, 100 by year 3.

**2. Freemium Power Features ($5-8/month, student pricing)**

Unlimited tools, AI creation credits beyond free tier, advanced analytics, custom theming, priority generation queue. 4-5% conversion target. Student pricing is non-negotiable -- $5/month, not $15.

**3. Template Marketplace (15-20% take rate)**

Creators sell templates. Student-to-student commerce. Small transactions ($1-5 per template) at volume. Requires Innovator tier to publish. Platform takes 15-20%.

**4. Brand Sponsorships ($50-250K/year)**

Career and finance tools "brought to you by [Brand]." Internship boards, financial literacy tools, career readiness assessments. Brands get verified student engagement data (aggregate, not individual). Ethical constraint: no surveillance, no data selling, no attention-hijacking ads.

**5. Creator Monetization (Long-Term)**

Tools can charge for premium access. The Roblox DevEx model -- creators earn when their tools generate value. This is year 3+ territory. Requires significant scale.

### Revenue Milestones

**$1M ARR (12-18 months):**
- 10 campus licenses at $50K average = $500K
- 100K users at 4% conversion, $5/month = $240K/year
- Template marketplace = $60K/year
- 2 brand sponsors at $100K = $200K

**$10M ARR (3-4 years):**
- 100 campus licenses at $50K average = $5M
- 500K users at 5% conversion, $6/month = $1.8M/year
- Template marketplace at scale = $500K/year
- 10 brand sponsors at $150K = $1.5M
- Creator monetization = $1.2M

### Alumni LTV Changes Everything

Without alumni: student LTV = $240 (4 years at $5/month). With 20% alumni retention (portfolio browsing, mentoring, sharing): blended LTV = $432 (1.8x). With 40% alumni retention: blended LTV = $624 (2.6x). No other campus platform cracks post-graduation retention. The portfolio is the mechanism.

### TAM

US college students: 20M. Campus licensing SAM: ~$1.2B. With alumni persistence and international expansion: significantly larger. Comparable raises: Fizz ($41.5M, 240 campuses), Handshake ($200M+, $3.5B valuation), Canva ($40B from "simple tool builder"), Notion ($10B from "note app").

---

## 10. Network Effects & Flywheel

### Three Layers That Stack

**Layer 1: Within Campus**

More tools built -> more useful spaces -> more students join spaces -> more students see tools -> more students become creators -> more tools built.

The critical mass threshold: 200+ active tools per campus. Below this, tools feel optional. Above this, tools feel native to campus life. System tools (auto-deployed by space type) bootstrap this loop -- every new space starts with working tools before any student creates anything.

**Layer 2: Cross Campus**

Templates spread across campuses. A great attendance tracker at UB becomes a template used at 50 universities. Template creators get attribution and usage stats across all campuses. The "App Store for campus life" -- not an app store with 2M apps, but a curated collection of tools that actually work for student organizations.

Cross-campus template adoption target: 30% of templates used at 2+ campuses within 18 months.

**Layer 3: Temporal (Alumni Persistence)**

Alumni stay engaged through portfolios. Alumni share portfolio links on LinkedIn and in job applications. Recruiters discover the platform through portfolio links. Universities see alumni engagement data and renew campus licenses. Alumni LTV extends beyond graduation.

This is the layer no competitor has. Fizz dies at graduation. GroupMe dies at graduation. HIVE persists because the portfolio persists.

### The Flywheel

```
Student creates tool
  -> Tool gets used by peers
    -> Usage data appears on creator profile
      -> Creator shares profile (LinkedIn, resume, job apps)
        -> Recruiters/employers discover platform
          -> University sees alumni engagement + recruiter interest
            -> University renews/expands campus license
              -> More students get access
                -> More tools created
```

Each revolution accelerates. Campus licensing funds growth. Creator portfolios drive organic discovery. Alumni persistence compounds retention.

---

## 11. What NOT to Build

### Anti-Features

**Code editing.** The moment you add a code editor, you've become a worse Replit. Formula expressions (Notion-style) are the ceiling. If someone needs custom logic, they've graduated from HiveLab.

**LMS features.** Faculty creating tools = scope creep into Canvas/Blackboard territory. Faculty USE student tools. Faculty do not create them. No gradebooks, no assignment submission, no course management.

**Social feed.** HiveLab is not a social network. No likes, no comments on tools (reviews yes, social engagement no), no follower counts. The portfolio shows impact metrics, not popularity metrics.

**Public tool gallery at launch.** An empty gallery signals a dead platform. Wait for 50+ campus-visible tools. Discovery happens through spaces and word-of-mouth until then.

**Algorithmic recommendations at launch.** Algorithms need data density. Start with curation, graduate to "popular" sorting, then consider algorithms at 500+ tools.

**External API integrations at launch.** Pre-built connectors (Google Sheets, Slack) are Level 4 features. Building them before the core creation loop works is building the roof before the walls.

**Payment processing in tools.** Tools should not handle money. The moment a tool can charge users, you inherit payment compliance, fraud liability, and regulatory complexity. Creator monetization (year 3+) goes through the platform, not through individual tools.

**Anonymous creation.** Every tool has a creator. Every creator has a verified campus identity. Anonymous tools destroy accountability and make moderation impossible. Anonymous USAGE within tools (anonymous polls, anonymous feedback) is fine.

### Scope Traps That Look Good But Destroy Value

- "Let alumni create tools for their companies" -- kills campus exclusivity
- "Let faculty build course tools" -- makes you a bad LMS
- "Add real-time collaboration on tools" -- solves a problem <1% of creators have
- "Build a mobile tool creation experience" -- creation is a desktop activity; consumption is mobile
- "Add tool versioning with rollback" -- enterprise feature for a student platform
- "Build a tool dependency system" -- engineering complexity with zero student value

---

## 12. Launch Sequence

### Phase 1: Core Creation (Months 1-3)

Ship the creation loop. Everything required for a student to go from "I need a poll" to "poll is live in my space" in under 60 seconds.

**What ships:**
- All 27 elements, 29 templates, AI generation pipeline (already built)
- Conversational creation flow (describe -> preview -> deploy)
- Focused Editor (the missing Layer 2 between templates and full IDE)
- "Go Live" replacing "Deploy" everywhere
- System tools auto-deploying by space type (already built)
- Inline creation from space context (poll, RSVP, countdown)
- Basic usage stats (views, interactions)

**Success metrics:**
- Time to first tool: <10 minutes from signup
- Tool creation completion rate: >80%
- Tools per campus: 50+ in first month with 200+ students

### Phase 2: Growth Features (Months 4-6)

Ship the features that turn one-time creators into repeat creators and drive cross-space adoption.

**What ships:**
- Analytics dashboard (usage data visualization for creators)
- Progression system (Level 1-4 with unlock notifications)
- Creator profiles with portfolio view
- Visual automation builder (basic event triggers)
- Template publishing (Innovator-tier creators share templates)
- Tool forking (one-click deploy of someone else's tool)
- Semester-end prompts (archive/renew/transfer)

**Success metrics:**
- DAU/MAU: >40%
- Creator-to-consumer ratio: 1:10 to 1:20
- D30 retention: >50%
- 3+ tools per active creator

### Phase 3: Ecosystem (Months 7-12)

Ship the features that create network effects and defensible value.

**What ships:**
- Campus Gallery (when 50+ campus-visible tools exist)
- Cross-campus template sharing
- Alumni portfolio persistence (graduated state)
- Embeddable tools (iframe with auth)
- Pre-built API connectors (Google Sheets first)
- University admin dashboard (aggregate metrics)
- Tool ownership transfer for graduating students
- Freemium billing (Stripe integration)

**Success metrics:**
- Tools created: 50K+ across all campuses
- Cross-campus template adoption: 30%+ used at 2+ campuses
- Alumni portfolio views: measurable recruiter traffic
- First campus license revenue

### Metrics That Matter for Series A

| Metric | Target |
|--------|--------|
| Tools created | 50K+ |
| DAU/MAU | >40% |
| Tools per campus | 200+ active |
| Cross-campus template adoption | 30%+ on 2+ campuses |
| Creator-to-consumer ratio | 1:10 to 1:20 |
| D30 retention | >50% |
| Time to first tool | <10 minutes |
| Campus licenses | 10+ |
| Revenue | Path to $1M ARR |

---

## Appendix: Existing Implementation

HiveLab is not a concept. The core is built. 27 elements registered. 29 templates functional. AI generation pipeline shipping. 41 API routes. 80+ IDE component files. Capability governance with Safe/Scoped/Power lanes and budget enforcement. System tools auto-deploying by space type. Streaming canvas view for AI generation.

What's missing is the framing, the progression system, the portfolio layer, the cross-campus template mechanism, and the conversational creation flow that makes the 95% of students who aren't power builders able to create tools without seeing an IDE.

The code is ready. The product needs to meet the students where they are.
