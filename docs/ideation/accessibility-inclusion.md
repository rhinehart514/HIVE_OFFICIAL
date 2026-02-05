# Accessibility & Inclusion

> Who can use this and how. Screen readers, keyboard nav, language support, low-bandwidth, neurodivergent-friendly design. Also: social inclusion -- who gets left out of campus communities and why?

**Dimension Owner:** Accessibility & Inclusion Strategist
**Last Updated:** February 2026
**Decision Filter:** Does this help a student find their people, join something real, and come back tomorrow -- even if they're the student who's been left out everywhere else?

---

## Current State

### What Exists

**Positive foundations:**
- `prefers-reduced-motion` respected in CSS (`globals.css`, `styles.css`) and JS (`motion-variants.ts` wraps variants to disable animation when system preference is set)
- WCAG 2.1 AA test suite exists (`wcag-compliance.spec.ts`) using axe-core, targeting Level A + AA
- Some ARIA attributes present in UI primitives (shell icons, navigation, OTP input, separators)
- `communityIdentities` field on profiles: `international`, `transfer`, `firstGen`, `commuter`, `graduate`, `veteran` -- stored but barely surfaced
- Ghost mode and granular privacy controls (useful for students with social anxiety)
- Real-name policy with handle system (reduces anonymity-driven harassment)
- Design token system enforces visual consistency (good for cognitive accessibility)

**Significant gaps:**
- No language selection or i18n infrastructure whatsoever. Every string is hardcoded English.
- No high-contrast mode. Dark theme with gold accents -- unclear if contrast ratios pass AA for all text.
- No font size controls or respect for system font size preferences.
- Keyboard navigation partially implemented -- focus rings were recently added, but no systematic keyboard flow audit.
- No skip-to-content links.
- No `aria-live` regions for real-time content (chat messages, typing indicators, presence changes).
- No alt text enforcement for user-uploaded content (avatars, cover photos when added).
- Community identities are stored but never used for discovery, matching, or community-building.
- Interest list is English-centric and culturally narrow (150+ interests, but reflects an American-centric lens).
- No content warnings, sensory load controls, or information density preferences.
- No text-to-speech integration for chat or feed content.
- Entry flow has no "I need help" escape hatch or alternative paths.

### Who Gets Left Out Today

| Population | Size at UB | Barrier | Current Experience |
|------------|-----------|---------|-------------------|
| International students | ~6,400 (20%) | Language, cultural context, social norms | English-only UI, American-centric interest categories, no ESL-friendly features |
| Commuter students | ~15,000+ | Physical absence, time constraints, FOMO | No async-first features, real-time chat favors always-online students |
| Students with disabilities | ~2,000+ registered, many more unregistered | Screen readers, motor impairment, cognitive load | Partial ARIA, no skip links, animation-heavy, no density controls |
| Neurodivergent students | Estimated 15-20% | Sensory overload, unpredictable UI, social anxiety | No sensory preferences, chat is chaotic, no structured interaction modes |
| First-gen students | ~30% at UB | Cultural capital gap, unfamiliar terminology | Greek life jargon, implicit social rules, no onboarding for *culture* |
| Students with social anxiety | Common across all groups | Fear of joining, fear of being seen, paralysis of choice | Joining is public, no lurking mode, no gradual engagement path |
| Students in poverty | Significant | Data costs, older devices, limited connectivity | No offline mode, no low-bandwidth option, JS-heavy SPA |
| Deaf/Hard of Hearing students | ~200+ | Audio content, voice features | No captions infrastructure, no visual-only notification mode |

---

## The Opportunity

**The structural insight:** Every platform built for "students" is actually built for the median student -- a native English speaker, living on campus, neurotypical, with fast wifi, who understands American college culture. That's maybe 40% of UB.

HIVE's decision filter says "find your people, join something real, come back tomorrow." For the 60% who aren't the median student, the biggest barrier isn't features -- it's the assumption baked into every interface that you already know what you're doing, what you're looking for, and how this all works.

**Three concentric rings of opportunity:**

1. **Technical accessibility** (WCAG compliance, screen readers, keyboard nav) -- table stakes, legally defensible, affects ~10% of users directly but 100% indirectly
2. **Cognitive/sensory accessibility** (reduced motion, information density, predictable patterns, sensory controls) -- affects 20-30% of users, creates better design for everyone
3. **Social accessibility** (who feels welcome, who can participate, who finds their people) -- affects 60%+ of users, is the actual product differentiator

The wedge: **No campus platform takes social accessibility seriously.** Discord is chaotic. GroupMe is cliquish. University platforms are bureaucratic. HIVE can be the first platform where the international student, the commuter, the first-gen kid, the student with ADHD all feel like this was built for them -- not adapted for them.

---

## Feature Ideas

### 1. Comfort Level Controls ("Your Pace")

**Problem:** Students with social anxiety can't ease into communities. Joining a space = immediately visible to everyone. Chat moves fast. You're either "in" or you're not. The students who need belonging most are the ones most paralyzed by the ask.

**Shape:**
- Global "comfort level" setting: Observer / Participant / Contributor
- Observer: You can read everything, you appear in member counts, but your name doesn't show in member lists. No one knows you're there unless you speak.
- Participant: You appear in lists, can react and reply, but aren't surfaced in discovery or "suggested connections."
- Contributor: Full visibility, appear in recommendations, can create content.
- Each space can be set independently. Default follows global.
- Upgrading comfort level happens silently. Downgrading has a 24h cooldown (prevents anxiety-driven oscillation).

**Wedge:** "Join without being seen. Speak when you're ready." This is the sentence that makes an anxious student download HIVE instead of continuing to lurk on GroupMe.

**Impact:** High. Social anxiety affects 15-30% of college students. This turns non-users into users.

**Effort:** Medium (2-3 weeks). Touches member lists, discovery, presence, and permissions.

**Tradeoffs:**
- Space owners may want to see all members (tension with Observer mode)
- Could enable passive consumers who never contribute (mitigate with gentle nudges after 30 days)
- Adds complexity to member count semantics ("127 members, 89 active" vs "127 members including observers")

---

### 2. Language Layer

**Problem:** 6,400 international students at UB. Many can read English but struggle with idiomatic UI copy, slang in chat, and culturally specific references ("rush week," "tailgate," "quad"). There's no i18n, and more importantly, no cultural translation.

**Shape:**
- Phase 1: UI language toggle. Start with top 5 languages at UB: English, Mandarin, Hindi, Korean, Arabic. Framework: next-intl or similar.
- Phase 2: In-chat "translate" button on any message. Tap to see machine translation inline (Google Cloud Translation API). Not auto-translate -- user-initiated, so it doesn't feel patronizing.
- Phase 3: Cultural glossary. When jargon appears in space descriptions or events ("rush," "Greek," "intramural," "TA session"), a small tooltip explains it. Crowdsourced definitions, moderated.
- Phase 4: Language-tagged spaces. Spaces can declare languages spoken. Discovery filters include "Spaces where Mandarin is spoken."

**Wedge:** The international student who opened GroupMe, saw English-only chaos, and closed it. HIVE shows them a translate button and spaces tagged with their language.

**Impact:** Very high. 20% of UB's population, and international students are the *most* in need of community -- they left their entire social network behind.

**Effort:** Large (Phase 1: 3-4 weeks for i18n infrastructure. Phases 2-4: incremental over months).

**Tradeoffs:**
- Machine translation quality varies (mitigate: show original + translation, never replace)
- i18n adds maintenance burden to every new feature (mitigate: establish patterns early, use ICU message format)
- Cultural glossary could feel condescending (mitigate: frame as "campus dictionary" that everyone uses, including freshmen)
- RTL support for Arabic is a significant layout challenge

---

### 3. Async-First Mode ("Catch Up")

**Problem:** Commuter students and part-time students miss the real-time social layer. Chat scrolls past them. Events happen when they're on the bus. The always-online students build relationships in real-time; commuters see the aftermath.

**Shape:**
- Daily digest: "Here's what happened in your spaces today." Smart summary of each space -- key messages, decisions, events announced. Not every message -- the *important* ones, identified by reactions, replies, pins.
- "Catch Up" button per space: Scrolls to where you left off, shows an AI-generated 3-sentence summary of what happened since, then lets you read the full thread.
- Async discussion threads: Alongside real-time chat, spaces can have threaded discussions with no expectation of immediate response. Think Reddit-style threads inside a space. Labeled "No rush -- respond when you can."
- Time-zone-aware event suggestions: If a commuter's transit schedule means they arrive at 11am, prioritize afternoon events.

**Wedge:** "Never miss what matters." The commuter student opens HIVE on the bus and sees a 3-sentence summary instead of 200 unread messages.

**Impact:** High. 15,000+ commuters at UB. Also benefits anyone with a busy schedule, job, or kids.

**Effort:** Large (digest: 2-3 weeks. Catch-up summary: 3-4 weeks with LLM integration. Async threads: 2 weeks).

**Tradeoffs:**
- Summaries could misrepresent conversations (mitigate: always link to full context, label as "AI summary")
- Async threads could fragment conversation (mitigate: clear visual separation, not a replacement for chat)
- Digest timing is tricky (mitigate: user-configurable, default 8pm)
- LLM costs for summarization at scale

---

### 4. Sensory Environment Controls

**Problem:** Neurodivergent students (ADHD, autism, sensory processing differences) experience UI differently. Animations that feel "premium" to some feel overwhelming to others. Chat notifications that feel "engaging" to some feel like assault to others. There's no way to tune the sensory experience.

**Shape:**
- **Motion level:** Full (default) / Reduced (prefers-reduced-motion, already partially implemented) / None (zero animation, instant transitions)
- **Information density:** Comfortable (default) / Compact (smaller text, tighter spacing, more content visible) / Spacious (larger text, more whitespace, less visual noise)
- **Color intensity:** Standard (gold + dark) / Muted (desaturated gold, softer contrasts) / High contrast (WCAG AAA, maximum readability)
- **Notification intensity:** All (default) / Important only (mentions, DMs, events I RSVP'd) / Silent (badge counts only, no sounds or banners)
- **Chat mode:** Stream (real-time, current default) / Digest (batched, every 15/30/60 min) / Thread-only (see async threads, hide real-time)
- All settings grouped under "Your Environment" in settings. Not buried under "Accessibility" -- positioned as personalization.

**Wedge:** "Make HIVE feel right for your brain." Not a disability accommodation -- a personalization feature that happens to be essential for neurodivergent students.

**Impact:** Very high. 15-20% of students are neurodivergent. But compact density benefits power users. Muted mode benefits nighttime users. Digest mode benefits busy students. Every "accessibility" feature here improves the experience for a much larger group.

**Effort:** Medium (2-3 weeks for the settings + CSS variable system. Motion levels mostly exist. Density and color require design token variants).

**Tradeoffs:**
- More variants = more testing surface (mitigate: systematic design token approach, not per-component overrides)
- "Muted" mode may conflict with brand identity (mitigate: gold is still present, just softer)
- Risk of analysis paralysis with too many options (mitigate: smart defaults, progressive disclosure)

---

### 5. Guided Social Scaffolding ("First Steps")

**Problem:** First-gen students don't have the cultural capital that legacy students inherit. They don't know what "rush" means, how clubs work, what office hours are for, or that you're "supposed to" join things in the first two weeks. The entry flow asks for interests -- but it doesn't teach you how campus community works.

**Shape:**
- Post-entry "campus guide" -- a 5-screen interactive walkthrough (not a tutorial overlay):
  1. "Here's how spaces work" -- spaces are communities, not group chats. Show the difference.
  2. "Your spaces joined you" -- explain auto-join, show which spaces matched.
  3. "How to join more" -- Explore page walkthrough with low-pressure framing.
  4. "Events are the fastest way in" -- showing upcoming events in your spaces, one-tap RSVP.
  5. "You can just watch" -- explaining that lurking is fine, participation is optional, belonging happens at your pace.
- Campus vocabulary tooltips: "Rush" has a (?) icon. "Org" has a (?) icon. Not just for international students -- for anyone who doesn't know.
- "Ask a guide" feature: Pair new students with volunteer upperclassmen who opted in as "guides." Not mentorship -- just "ask me anything about campus." Low commitment.

**Wedge:** "Nobody told me how any of this works" is the first-gen student's internal monologue for their entire first year. HIVE tells them.

**Impact:** High. 30% first-gen at UB. Also helps transfer students, international students, and anyone who feels lost.

**Effort:** Medium (2-3 weeks for guided flow. Vocabulary tooltips: 1 week. Guide matching: 3-4 weeks).

**Tradeoffs:**
- Guided flow could feel patronizing to students who *do* know (mitigate: make it skippable, don't show to returning users)
- Vocabulary tooltips need curation (mitigate: start with 30 terms, crowdsource additions)
- Guide matching creates a moderation/safety surface (mitigate: guides are verified students, conversations happen on-platform)

---

### 6. Screen Reader Architecture Overhaul

**Problem:** The WCAG test suite exists but covers only 3 pages (landing, about, enter). The authenticated experience -- where students actually *live* -- has no systematic screen reader support. Chat is real-time DOM manipulation without `aria-live`. Navigation between spaces has no landmark structure. Member lists lack semantic meaning.

**Shape:**
- **Landmark structure:** Every page gets proper `<main>`, `<nav>`, `<aside>`, `<header>` landmarks. Screen reader users can jump between regions.
- **Skip links:** "Skip to main content" and "Skip to chat" on every page. Hidden until focused.
- **Chat accessibility:**
  - `aria-live="polite"` region for new messages (announced but doesn't interrupt)
  - `aria-live="assertive"` for @mentions and DMs
  - Message grouping by sender announced: "3 messages from John Smith"
  - Typing indicators: "Sarah is typing" announced once, not continuously
- **Navigation:**
  - Space list announced as navigation with space names
  - Current space indicated with `aria-current="page"`
  - Tab order follows visual layout
- **Interactive elements:**
  - All buttons, links, and interactive elements have accessible names
  - Custom components (emoji picker, member list, interest selector) have proper ARIA roles
  - Focus management on route changes (focus moves to page heading)
- **Image descriptions:** Default alt text for avatars: "[Name]'s profile photo". Prompt for alt text on uploaded images.

**Wedge:** Legal compliance (ADA/Section 508 for university-affiliated platforms) plus genuine usability for blind/low-vision students.

**Impact:** Medium-high. Directly affects ~2-3% of students, but also benefits power keyboard users, voice control users, and anyone in a hands-busy situation.

**Effort:** Large (4-6 weeks for systematic overhaul across all authenticated pages).

**Tradeoffs:**
- Requires discipline in every future PR (mitigate: add axe-core to CI, fail on new violations)
- Some components may need redesign for semantic structure (mitigate: prioritize chat and navigation first)
- aria-live in chat could be noisy (mitigate: configurable verbosity in screen reader settings)

---

### 7. Identity Badges for Underrepresented Communities

**Problem:** `communityIdentities` exists in the data model (international, transfer, firstGen, commuter, graduate, veteran) but is never surfaced. Students from these groups have no way to find each other, and the platform doesn't acknowledge that their experience is different.

**Shape:**
- Optional identity badges on profiles: "International Student," "First Gen," "Commuter," "Transfer," "Veteran." Visible only if the student opts in.
- Discovery filter: "Show me other international students" / "Show me other commuters." Powered by `communityIdentities` field.
- Auto-create community spaces: "HIVE International Students," "HIVE First Gen," "HIVE Commuters." Seeded spaces that exist on day 1.
- Community-specific content in Home feed: "Events for international students this week" surfaced when the identity is set.
- Cross-campus solidarity: If HIVE expands, connect international students at UB with international students at other campuses.

**Wedge:** "Find people who get it." The transfer student who feels like a freshman in a junior's body. The commuter who watches friend groups form in dorms they'll never live in. The first-gen student who can't ask their parents how to pick a major.

**Impact:** Very high. These identities collectively cover 60%+ of UB students (many overlap). This is the belonging play.

**Effort:** Small-medium (badges: 1 week. Discovery filter: 1 week. Auto-created spaces: 2-3 days. Content targeting: 2 weeks).

**Tradeoffs:**
- Labels can feel reductive ("I'm more than a commuter") (mitigate: always optional, multiple identities allowed, never the primary identifier)
- Community spaces could be empty at launch (mitigate: seed with relevant content, events, resources)
- Privacy concern: some identities feel vulnerable to share (mitigate: badges only visible to other students at same campus, never to external)

---

### 8. Low-Bandwidth Mode

**Problem:** Students with limited data plans, old phones, or inconsistent wifi (common in off-campus housing, buses, rural areas) get a degraded or broken experience. The app is a Next.js SPA with heavy JS bundles. The largest page (`/s/[handle]`) is 51.7 kB first load on a 1 MB total shared JS payload.

**Shape:**
- **Lite mode toggle:** Strip animations, defer non-critical images, reduce chat polling frequency, compress assets aggressively.
- **Image optimization:** All user-uploaded images served as WebP with quality tiers. Avatars: 10 kB max. Space covers: 50 kB max. Lazy load everything below the fold.
- **Offline-capable core:** Service worker caches the shell, your space list, and the last 50 messages per space. Read-only works fully offline. Queue messages for send when connection returns.
- **Data usage indicator:** "HIVE used 12 MB this session" in settings. Helps students on metered connections budget.
- **Text-first feed option:** Strip all images from feeds and chat. Show text, links, and reactions only.

**Wedge:** "Works on the bus, works on slow wifi, works when you're broke." This isn't a premium feature -- it's the baseline HIVE experience working for everyone.

**Impact:** Medium-high. Directly needed by students in poverty and commuters, but improves performance for everyone. Also improves Core Web Vitals and SEO.

**Effort:** Medium (lite mode CSS: 1 week. Image pipeline: 2 weeks. Service worker: 3-4 weeks).

**Tradeoffs:**
- Offline queueing creates sync conflicts (mitigate: queue is send-only, never edits)
- Text-first mode loses visual richness (mitigate: clearly labeled as a choice, easy to toggle back)
- Service worker adds complexity to deployment (mitigate: use Workbox, established patterns)

---

### 9. Keyboard-First Navigation System

**Problem:** Focus rings were recently added, but there's no systematic keyboard navigation design. Tab order follows DOM order, not visual logic. Modal traps aren't implemented. Space switching requires mouse. Chat input isn't keyboard-discoverable.

**Shape:**
- **Global keyboard shortcuts:**
  - `Cmd/Ctrl + K` -- Command palette (already exists, needs accessibility audit)
  - `Cmd/Ctrl + /` -- Keyboard shortcut help overlay
  - `Cmd/Ctrl + 1-9` -- Switch between spaces (like Slack channels)
  - `Escape` -- Close current modal/panel, return focus to trigger
  - `Enter` on space card -- Open space
  - `N` -- New message (when in a space)
- **Focus management:**
  - Route changes move focus to page `<h1>`
  - Modal open traps focus inside modal
  - Modal close returns focus to trigger element
  - Dropdown menus navigable with arrow keys
  - Chat messages navigable with arrow keys (up/down between messages)
- **Visual indicators:**
  - Focus ring: 2px gold outline, 2px offset, visible on all interactive elements
  - Current keyboard scope indicator: subtle highlight on the active region (sidebar, main, chat)
  - "Keyboard mode" activates on first Tab press, hides on mouse click (already common pattern)
- **Shortcut discovery:**
  - "?" key opens shortcut overlay from any page
  - Shortcut hints appear on hover after 1s delay (like Figma)

**Wedge:** Power user productivity feature that also happens to be essential for motor-impaired students. Keyboard-first design improves the experience for everyone who hates trackpads.

**Impact:** Medium. Directly critical for motor-impaired students (~1-2%). High value for power users who prefer keyboard (estimated 10-15%).

**Effort:** Medium (2-3 weeks for shortcut system + focus management. Ongoing: audit new features).

**Tradeoffs:**
- Shortcut conflicts with browser shortcuts (mitigate: use standard conventions, Cmd prefix for OS-level)
- Custom key bindings add complexity (mitigate: v1 is fixed shortcuts, customization later)
- Mobile doesn't benefit from keyboard shortcuts (mitigate: this is desktop-specific, mobile has touch)

---

### 10. Content Warnings & Consent-Based Discovery

**Problem:** Spaces and events can contain content that's triggering, overwhelming, or unsafe for some students. A space about political debate, a grief support group, content about substance use -- there's no way to signal what you're walking into. For students with PTSD, eating disorders, or trauma histories, encountering unexpected content isn't just uncomfortable -- it's harmful.

**Shape:**
- **Space content tags:** Space creators can tag their space with content descriptors: "Political discussion," "Mental health," "Mature language," "Loud events," "Flashing visuals," "Food-focused."
- **Personal filters:** Students can set content preferences: "Warn me before entering spaces tagged with [X]." Not blocking -- a consent gate: "This space discusses [political topics]. Enter anyway?"
- **Event sensory tags:** Events can be tagged: "Loud music," "Crowded," "Food served," "Quiet/calm," "Accessible venue."
- **Blur/reveal pattern:** In discovery, tagged spaces show blurred preview with tag visible. Tap to reveal.

**Wedge:** "You choose what you're ready for." Consent-based design as a differentiator.

**Impact:** Medium. Directly prevents harm for vulnerable students. Creates a culture of thoughtfulness that benefits everyone.

**Effort:** Small-medium (tags system: 1-2 weeks. Consent gates: 1 week. Event sensory tags: 1 week).

**Tradeoffs:**
- Tagging relies on creator honesty (mitigate: community reporting, moderation review)
- Too many tags creates fatigue (mitigate: limit to 8-10 well-defined categories)
- Could create a chilling effect on space creation (mitigate: frame as helpfulness, not restriction)

---

### 11. Structured Interaction Modes

**Problem:** Real-time chat is the primary social mode in spaces. This favors extroverted, fast-typing, always-online students. Neurodivergent students, ESL speakers, and thoughtful communicators lose out because the conversational floor is dominated by whoever types fastest.

**Shape:**
- **Discussion mode:** Space leaders can create structured discussion posts with a topic and turn-taking. Each person gets one response, then can reply to responses. Slows down and equalizes conversation.
- **Poll/vote mode:** Instead of debating in chat, create a poll. "Should we meet on Tuesday or Thursday?" with reactions as votes. Reduces the barrier to participation from "form an opinion and type it fast" to "tap a button."
- **Anonymous Q&A mode:** For spaces that discuss sensitive topics or where students feel shy. Post anonymously within the space. Questions attributed to "A member" not a name. Space leaders can enable/disable.
- **Async roundtable:** Post a topic, give members 48 hours to respond. All responses revealed at once (like a survey). Prevents anchoring bias and rewards thoughtfulness over speed.

**Wedge:** "Not everyone talks the same way." This legitimizes async, structured, and anonymous communication as first-class citizens.

**Impact:** High. Benefits neurodivergent students, ESL speakers, introverts, and anyone who thinks before they type. Also produces higher-quality discussions.

**Effort:** Medium-large (each mode: 1-2 weeks. Total: 5-7 weeks if built incrementally).

**Tradeoffs:**
- Adds complexity to the chat experience (mitigate: modes are space-level features, not inline in chat)
- Anonymous Q&A can be abused (mitigate: rate limits, space leader moderation, temporary bans)
- Discussion mode could feel bureaucratic (mitigate: make it optional, position as "deep discussion" not "controlled discussion")

---

### 12. Inclusive Interest Taxonomy

**Problem:** The 150+ interests in the entry flow are English-centric and reflect American campus culture. "Tailgating," "Greek Life," "Homecoming" mean nothing to an international student. "Anime," "K-pop," "Bollywood" are present but cultural representation is uneven. There's no way to express identity-based interests: "Halal food spots," "LGBTQ+ community," "Disability advocacy."

**Shape:**
- **Expanded categories:** Add cultural, identity, faith, and accessibility categories:
  - Cultural: cuisines, music genres, film traditions, languages spoken, cultural festivals
  - Identity: LGBTQ+, disability advocacy, racial/ethnic affinity, neurodivergent community
  - Faith: specific religions + interfaith + secular/atheist
  - Practical: childcare, commuter resources, financial literacy, cooking on a budget
- **Interest localization:** Interests are stored as canonical IDs, displayed in user's language preference.
- **"Tell us what's missing" field:** Free-text interest suggestion at the end of the list. Review queue for admins to add popular suggestions.
- **Interest descriptions:** Each interest has a one-line description for disambiguation. "Greek Life" shows "(Fraternities & sororities)" so international students understand.
- **Weighted interests:** Instead of flat selection, allow primary (1-2) and secondary (2-3) interests. Primary interests weight recommendations more heavily.

**Wedge:** "We didn't forget about you." The student who scrolls through 150 interests and doesn't see themselves represented quietly closes the app. This prevents that.

**Impact:** High. Directly improves onboarding completion for underrepresented students. Better interest data improves recommendations for everyone.

**Effort:** Small-medium (taxonomy expansion: 1 week of curation. UI for descriptions: 2-3 days. Weighted interests: 1 week).

**Tradeoffs:**
- Longer interest list could overwhelm (mitigate: categorized tabs, search within interests, "suggested for you" based on school/year)
- Identity interests could create echo chambers (mitigate: serendipity features balance this)
- Maintaining translations of 200+ interests is ongoing work

---

### 13. Pronouns & Chosen Names (Beyond the Field)

**Problem:** A pronouns field is spec'd in IDENTITY.md (P1) but the design stops at "field on profile." For trans and non-binary students, pronouns aren't a nice-to-have -- they're a safety feature. A system that uses the wrong name/pronoun isn't just annoying, it's actively hostile. Also: many international students go by a chosen English name different from their legal name.

**Shape:**
- **First-class pronouns:** Displayed everywhere a name appears: member lists, chat messages, profile cards, @mentions. Not just on the profile page.
- **Chosen name:** Entry flow asks for "What should we call you?" not "Legal name." The handle + display name system already supports this, but the UI copy should make it explicit.
- **Name pronunciation:** Optional audio recording of your name (5 seconds max). Play button next to name on profile. Crucial for international students with names that English speakers mispronounce.
- **Pronoun enforcement in spaces:** Space leaders can enable "pronouns required" -- members must set pronouns to join. For spaces where gender-affirming language is essential (LGBTQ+ spaces, support groups).

**Wedge:** "We say your name right." This single feature -- audio name pronunciation -- could be the most shared feature on social media. It's novel, deeply personal, and universally appreciated.

**Impact:** Medium-high. Trans/non-binary students (~5-8%) need this for safety. International students (20%) need name pronunciation. Everyone benefits from normalization of pronouns.

**Effort:** Small-medium (pronouns everywhere: 1 week. Name pronunciation: 1-2 weeks. "What should we call you" copy change: 1 day).

**Tradeoffs:**
- Pronoun enforcement could exclude students who aren't ready to share (mitigate: allow "prefer not to say" option)
- Audio recording moderation burden (mitigate: auto-delete if reported, maximum 5 seconds)
- Name pronunciation requires audio storage (mitigate: tiny files, Firebase Storage handles this)

---

### 14. Accessible Events (Sensory-Aware Event Discovery)

**Problem:** Event discovery has no accessibility information. A student with a wheelchair doesn't know if the venue is accessible. A student with sensory processing differences doesn't know if the event is in a loud bar. A student who doesn't drink doesn't know if it's alcohol-focused. An international student doesn't know if the event requires English fluency.

**Shape:**
- **Accessibility attributes on events:**
  - Venue accessibility: wheelchair accessible, elevator available, quiet room nearby
  - Sensory profile: noise level (quiet/moderate/loud), lighting (dim/normal/bright/strobe), crowd density
  - Substance: alcohol-free, food served (with dietary tags: halal, kosher, vegan, allergen-free)
  - Language: primary language, interpreter available
  - Virtual option: in-person only, hybrid, virtual only
- **Filter in event discovery:** "Show me events that are: wheelchair accessible, quiet, alcohol-free."
- **Event accessibility score:** Simple traffic light. Green = fully accessible. Yellow = partially. Red = limited. Based on which attributes are filled in.
- **"Request accommodation" button:** On any event. Sends message to organizer: "A student is requesting [type] accommodation for your event." Anonymous by default.

**Wedge:** "Know before you go." Eliminates the anxiety of showing up to an event and discovering it's inaccessible, overwhelming, or unwelcoming.

**Impact:** High. Benefits all students who've ever skipped an event because they didn't know what it would be like. Especially valuable for disabled students, neurodivergent students, sober students, and international students.

**Effort:** Medium (event attributes: 1-2 weeks. Filters: 1 week. Accommodation request: 1 week).

**Tradeoffs:**
- Event creators might not fill in accessibility info (mitigate: make key fields required, provide defaults, celebrate events with complete info)
- "Accessibility score" could shame organizers (mitigate: frame as "completeness," not quality judgment)
- Accommodation requests create a moderation flow (mitigate: standard template, organizer gets notification, follow-up is between them)

---

### 15. Smart Defaults That Include

**Problem:** Default settings silently exclude. Default notification volume assumes you can hear. Default text size assumes 20/20 vision. Default language assumes English. Default discovery assumes you know what you want. The sum of all defaults creates a product that works perfectly for one type of student and poorly for everyone else.

**Shape:**
- **Onboarding accessibility prompt:** After entry, before landing on Home: "Make HIVE yours." Three quick settings:
  1. Text size: Normal / Large / Extra Large (maps to root font-size scaling)
  2. Motion: Full / Reduced / None
  3. Notification style: Sounds + badges / Badges only / Silent
  Not positioned as "accessibility settings" -- positioned as "set up your experience."
- **Adaptive defaults:** If system-level `prefers-reduced-motion` is set, auto-set HIVE motion to None. If system font size is large, auto-match. If system language isn't English, prompt for language preference.
- **Discovery defaults for new users:** Instead of showing "Popular This Week" (which rewards dominant culture), show "Spaces matching your interests" first. Popular is secondary.
- **Chat default:** New users see "Thread view" (structured) not "Stream view" (real-time). Reduces overwhelm. They can switch after they're comfortable.

**Wedge:** "HIVE already knows what you need." The product that reads your system preferences and adapts before you ask.

**Impact:** Very high. Every user benefits from thoughtful defaults. Underrepresented students benefit most because bad defaults are a form of exclusion.

**Effort:** Small (1-2 weeks total. Most of this is settings UI + respecting existing OS preferences).

**Tradeoffs:**
- Auto-detecting preferences could feel invasive (mitigate: explain why, e.g., "We noticed your system uses large text -- we matched it")
- Thread view default could confuse users who expect chat (mitigate: clear toggle, tooltip explaining both modes)
- Extra onboarding step adds friction (mitigate: 3 taps total, skippable, takes 10 seconds)

---

## Quick Wins (Ship in Days)

| Feature | Effort | Impact | Why Now |
|---------|--------|--------|---------|
| Skip-to-content links on all pages | 1 day | Table stakes for screen readers | Zero risk, pure improvement |
| Entry flow copy change: "What should we call you?" instead of "First name / Last name" | 1 day | International + trans student welcome | Copy change only |
| `aria-live` on chat message container | 1-2 days | Screen readers can follow chat | Small code change, big impact |
| Interest descriptions (one-line tooltips) | 2-3 days | International students understand categories | Content curation + minor UI |
| Respect system font size in CSS | 1 day | Low-vision users get appropriate sizing | Use `rem` consistently |
| Add `lang` attribute to `<html>` tag | 1 hour | Screen readers use correct pronunciation | One line of code |
| Pronouns field on profile | 2-3 days | Already spec'd as P1 in IDENTITY.md | Small schema + UI change |
| axe-core in CI pipeline | 1-2 days | Prevents future regressions | Protect investment in accessibility |

---

## Medium Bets (Ship in Weeks)

| Feature | Effort | Impact | Dependencies |
|---------|--------|--------|--------------|
| Comfort Level Controls ("Observer mode") | 2-3 weeks | High -- unlocks anxious students | Member list + presence changes |
| Sensory Environment Controls | 2-3 weeks | High -- neurodivergent-friendly | Design token variants |
| Keyboard navigation system | 2-3 weeks | Medium -- power users + motor impaired | Focus management audit |
| Identity badges + discovery filters | 2-3 weeks | High -- underrepresented visibility | communityIdentities already stored |
| Inclusive interest taxonomy expansion | 1-2 weeks | High -- onboarding completion | Content curation effort |
| Event accessibility attributes | 2-3 weeks | High -- know-before-you-go | Event schema extension |
| Screen reader architecture (chat focus) | 3-4 weeks | Medium-high -- chat usability for blind | aria-live + landmark structure |
| Content warnings system | 2-3 weeks | Medium -- consent-based discovery | Space tagging system |
| Name pronunciation audio | 1-2 weeks | Medium-high -- international students | Audio upload + playback |

---

## Moonshots (Ship in Months+)

| Feature | Effort | Impact | Why Wait |
|---------|--------|--------|----------|
| Full i18n (5 languages) | 3-4 months | Very high -- 20% of UB | Infrastructure investment, ongoing maintenance |
| AI chat translation (inline) | 2-3 months | High -- breaks language barriers | Needs i18n foundation first, LLM costs |
| Async-first mode with AI summaries | 2-3 months | High -- commuter students | LLM integration, digest system |
| Structured interaction modes (4 types) | 2-3 months | High -- equalizes participation | Each mode is a product surface |
| Cross-campus community identity network | 6+ months | Very high -- scale play | Requires multi-campus expansion |
| Real-time captioning for voice features | 3+ months | Medium -- deaf/HoH students | Depends on voice features existing |
| AI-powered cultural glossary | 2-3 months | Medium-high -- reduces culture shock | Needs LLM + crowdsource pipeline |

---

## Competitive Analysis

### Discord
- **Accessibility:** Partial screen reader support. Keyboard shortcuts exist. No high-contrast mode. `prefers-reduced-motion` partially respected. No i18n of user content (server languages are whatever members use). No content warnings system (server owners can use NSFW tags).
- **Inclusion:** Fundamentally anonymous. Good for people who want to hide identity; bad for people who want to find *their* people. No identity-based discovery. No community identity concept. International students get lost in English-only chaos. Server onboarding is non-existent.
- **Verdict:** Built for gamers who adapted it for everything else. Accessibility is an afterthought. Social inclusion isn't a design goal.

### GroupMe
- **Accessibility:** Minimal. Basic screen reader support via native app conventions. No keyboard shortcuts. No reduced motion. No content controls.
- **Inclusion:** Group-based, invitation-only. Creates cliques. If you don't know someone in the group, you don't get in. International students often aren't in the group chats that form during orientation week. No discovery features at all -- you need the link.
- **Verdict:** The default because it's free and simple. Actively excludes anyone not already socially connected. Zero accessibility investment.

### Slack
- **Accessibility:** Best-in-class among competitors. Full screen reader support, keyboard navigation, high contrast mode, screen reader optimized views. Robust `aria` implementation.
- **Inclusion:** Workspace-based, so discovery is limited. Good for structured communities. No identity-based features. Enterprise-focused, not student-focused. High cognitive complexity.
- **Verdict:** Technically accessible, socially complex. The overhead of workspaces, channels, threads, and huddles is overwhelming for students.

### University Platforms (CampusLabs, Corq, Presence)
- **Accessibility:** Generally WCAG compliant (legally required for university tools). Basic but functional.
- **Inclusion:** Bureaucratic. Student orgs must register. Informal communities can't exist. Discovery is a searchable directory, not personalized recommendations. No social layer. No real-time anything. Event discovery is a list sorted by date.
- **Verdict:** Compliant, not engaging. Students use them because they're required, not because they want to. The "official" platform that nobody opens voluntarily.

### HIVE's Structural Advantage
Every competitor falls into one of two traps:
1. **Technically accessible, socially excluding** (Slack, university platforms) -- you can use it with a screen reader, but you still can't find your people.
2. **Socially functional, technically inaccessible** (Discord, GroupMe) -- great if you're an English-speaking, neurotypical, always-online student with friends who share links.

HIVE can be the first platform that's both technically accessible AND socially inclusive. That combination doesn't exist yet.

---

## Wedge Opportunities

### 1. "The University Can't Ignore This" Wedge
Build WCAG 2.1 AA compliance into every surface. When HIVE approaches university partnerships, accessibility compliance becomes a selling point. Universities have legal obligations. A platform that's already compliant reduces their risk. This turns accessibility from a cost into a go-to-market lever.

### 2. "International Student Welcome Week" Wedge
Launch language features (even partial) the week before fall semester. International students arrive early for orientation. They're desperately looking for community. If HIVE has Mandarin UI, a "Mandarin-speaking spaces" filter, and a translate button in chat -- word spreads through WeChat, KakaoTalk, and WhatsApp groups before American students even arrive. International students become the early adopters, not an afterthought.

### 3. "The Anxiety Generation" Wedge
Gen Z has the highest rates of diagnosed anxiety of any generation. Observer mode, comfort level controls, and consent-based discovery aren't niche features -- they're generation-defining features. Marketing message: "The only campus platform that doesn't force you to perform." This lands with a massive audience.

### 4. "Accessible Events Win Organizers" Wedge
Student org leaders who tag their events with accessibility info get more attendees (because students who were unsure now feel safe attending). This creates a virtuous cycle: organizers adopt HIVE because it increases attendance. Students adopt HIVE because they can find events that work for them. The accessibility feature IS the distribution feature.

### 5. "First-Gen Is the New Normal" Wedge
At UB, first-gen isn't a minority -- it's approaching a majority. The platform that acknowledges "most students don't know how this works" and builds for that reality isn't building for the edge case. It's building for the center.

---

## Open Questions

1. **How do we audit existing WCAG compliance without slowing down feature development?** The test suite covers 3 pages. There are 20+ authenticated routes. Running axe-core in CI catches new violations but doesn't fix the backlog. Do we dedicate a sprint to an accessibility audit, or spread it across feature work?

2. **How do we handle the tension between Observer mode and community vitality?** Space leaders may want to know who's in their space. A space full of observers feels dead even if 100 people are reading. What metrics do we show leaders? "127 members, 89 active, 38 observers" -- or is that too granular?

3. **How far do we go with i18n before launch?** Full i18n is a 3-4 month investment. Do we ship English-only at UB launch (where 80% speak English) and add languages in month 2? Or does even partial language support (UI only, not user content) meaningfully improve international student adoption?

4. **Should sensory environment controls be under "Settings" or "Accessibility"?** Putting them under "Accessibility" signals "this is for disabled people." Putting them under settings normalizes it. But it also makes it harder for students with actual accessibility needs to find them. Where's the right placement?

5. **How do we get event accessibility data without burdening organizers?** If creating an event requires answering 8 accessibility questions, organizers will skip HIVE. If we don't ask, the data doesn't exist. Can we infer some attributes (venue lookup for wheelchair access)? Can we make it progressive (basic info required, details optional)?

6. **Is the "Comfort Level Controls" feature safe from abuse?** Could someone use Observer mode to stalk a space without being seen? What are the moderation implications of invisible members? Do space leaders need to be able to disable Observer mode?

7. **How do we measure social inclusion?** Technical accessibility has clear metrics (WCAG violations, screen reader compatibility). Social inclusion is harder. Possible signals: onboarding completion rate by community identity, space join rate by identity, 7-day retention by identity, percentage of international students with 3+ spaces joined. What's the north star metric?

8. **What's the liability exposure if we claim accessibility and fall short?** ADA lawsuits against university platforms are increasing. If HIVE markets itself as accessible, the standard we're held to is higher. Is it better to quietly build accessibility or publicly commit to it? Legal gray area worth understanding.

9. **How do we handle content warnings without creating a censorship tool?** If space moderators can tag content, they can also suppress content by over-tagging. If students can filter content, they can create ideological bubbles. The system needs to protect vulnerable students without enabling information control.

10. **Should guided social scaffolding ("First Steps") be mandatory or opt-in?** Making it mandatory ensures first-gen students see it but annoys students who don't need it. Making it opt-in means the students who need it most are least likely to opt in. A middle ground: show it to everyone on first visit, let them skip after 1 screen, but keep it accessible in settings.
