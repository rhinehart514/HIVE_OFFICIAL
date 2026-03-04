# HIVE 2026 Standards

The bar every feature must clear. If a feature ships and doesn't meet these standards, it's not done.

HIVE is for ALL UB students. Freshmen who don't know anyone. Commuters who have 45 minutes between classes. International students navigating a new culture. Club presidents drowning in logistics. Introverts who'd rather die than walk up to a table at the involvement fair. Athletes who already have a team but want more. Engineers, business students, art students, pre-med students. Every standard below must work for all of them.

---

## 1. AI-Native Standards

AI is not a feature. It's how the product thinks. Students in 2026 have been using ChatGPT for 3+ years. They expect software to understand context, not just respond to clicks.

### Where AI must be invisible (ambient intelligence)
- **Smart defaults**: When a student creates a space, AI pre-fills description, tags, suggested meeting times based on similar spaces on campus
- **Feed ordering**: What surfaces on the home screen is personalized — not chronological, not algorithmic engagement bait. Relevance to THIS student, THIS week
- **Search understanding**: "photography club" and "camera stuff" return the same results. Natural language, not keyword matching
- **Notification intelligence**: Don't notify about everything. Learn what this student actually engages with. A commuter doesn't need "building closes at 11pm" notifications

### Where AI must be interactive (student-facing)
- **Onboarding conversations**: "Tell me what you're into" beats a grid of checkboxes every time. Conversational interest-gathering that feels like talking to a friend, not filling out a form
- **Discovery assistant**: "What's happening this weekend that I'd actually like?" — a query, not a scrollable list
- **Space creation helper**: Walk organizers through creating a compelling space description, setting up events, writing posts that people actually read

### Quality bar
- AI responses must feel like a sharp upperclassman, not a corporate chatbot
- No hallucinations about real campus data — if AI doesn't know, it says so
- Latency: AI suggestions must appear within 500ms for inline, 2s max for generative responses
- AI must never feel like it's making decisions FOR the student — it suggests, the student decides
- Every AI interaction must have a visible "why" — students should understand why something was suggested

### Anti-patterns
- Never use AI to generate fake activity or fake social proof
- Never use AI to write posts on behalf of students without explicit action
- Never surface AI confidence scores or technical jargon to students
- No "AI-powered" badges or labels. If the AI is good, students won't need to be told it's AI

---

## 2. Performance Standards

Students are on campus WiFi that drops, on data plans that throttle, on 3-year-old phones. Performance is not optimization — it's access.

### Hard numbers
| Metric | Target | Unacceptable |
|--------|--------|-------------|
| LCP (Largest Contentful Paint) | < 1.5s | > 2.5s |
| INP (Interaction to Next Paint) | < 100ms | > 200ms |
| CLS (Cumulative Layout Shift) | < 0.05 | > 0.1 |
| Time to Interactive | < 2s on 4G | > 4s |
| API response (p95) | < 300ms | > 1s |
| Cold start (serverless) | < 500ms | > 1.5s |

### Streaming and progressive loading
- Any list > 10 items: paginate or virtualize. Never load 200 items at once
- AI-generated content must stream token-by-token. No spinner then wall of text
- Images: lazy load below the fold, AVIF/WebP with proper srcset, blur placeholder on load
- Route transitions: instant shell render, data streams in. Never a white screen between pages

### Skeleton states are mandatory for
- Feed items
- Space cards
- Profile sections
- Search results
- Any content that depends on a network request

### Offline-aware
- Navigating while offline must show cached content with a clear "you're offline" indicator — not a broken page
- Form inputs must persist locally — if a student writes a paragraph and loses connection, it's still there when they come back
- Read paths should work offline where possible (cached spaces, cached profile)

---

## 3. Personalization Standards

A student who opens HIVE should feel like it was built for them specifically. Not in a creepy way — in a "this app gets it" way.

### Minute 1 (first open)
- Campus is auto-detected from email domain — no dropdown of 5,000 schools
- The onboarding asks 3-5 natural questions about interests, living situation (commuter/resident), year, what they're looking for (friends, career, skills, leadership, fun)
- The home screen is immediately populated with relevant spaces, upcoming events, and active students — never empty
- Signal: email domain, stated interests, stated year, stated goals

### Week 1
- Home feed reorders based on what the student actually taps, joins, and ignores
- "Suggested for you" gets sharper — not just category matches but behavioral similarity to students like them
- Notifications calibrate — if a student ignores event reminders but opens new-member alerts, shift the mix
- Signal: tap patterns, join/leave actions, time-of-day usage, notification engagement

### Month 1
- The app anticipates: surfaces relevant events before the student searches, suggests spaces based on evolving interests
- "Your campus" section reflects their actual campus life — their spaces, their people, their rhythm
- Students who haven't found their fit get proactive nudges — not guilt-trip notifications, but genuine "hey, students like you loved this" suggestions
- Signal: sustained engagement patterns, social graph proximity, content creation patterns, schedule patterns

### What's creepy vs helpful
| Helpful | Creepy |
|---------|--------|
| "Students in your major also joined..." | "We noticed you were near the engineering building at 3pm" |
| "This event matches your interests" | "Based on your browsing history..." |
| "Popular with freshmen this week" | "You haven't opened the app in 3 days" |
| Reordering the feed silently | Telling the student you reordered the feed |

### Hard rule
- Personalization signals come from in-app behavior only. Never location, never device sensors, never cross-app data
- Students can always see what data informs their experience and reset it
- Default to less personalization — earn the right to personalize more through value delivered

---

## 4. Interaction Standards

Table stakes in 2026. If these aren't present, the product feels like 2021.

### Command palette (Cmd/Ctrl + K)
- Global search across spaces, events, people, settings
- Fuzzy matching — typos don't break it
- Recent actions and frequently accessed items surface first
- Actions available: navigate, create, search, toggle settings
- Must open in < 100ms

### Keyboard navigation
- Every interactive element reachable via Tab
- Visible focus rings on keyboard navigation, hidden on mouse
- Arrow keys navigate lists, cards, feeds
- Enter activates, Escape closes/backs out
- Shortcuts for power users: N for new, S for search, G then H for home

### Mobile gestures
- Swipe right to go back (where contextually appropriate)
- Pull to refresh on all feeds and lists
- Long press for context menus (share, save, report)
- Swipe actions on list items (archive, pin, dismiss) where applicable
- Bottom sheet for actions — not dropdowns designed for desktop

### Progressive disclosure
- Show the 3 most important things first. Everything else lives one tap/click away
- Settings are layered: common on top, advanced behind "more options"
- Space creation: simple mode (name, description, go) with "customize" for power users
- Never show 15 form fields at once. Step through them or collapse sections

### Responsive behavior
- Desktop: multi-column, keyboard-first, hover states, tooltips
- Tablet: adaptive columns, touch targets enlarged, hybrid navigation
- Mobile: single column, gesture-first, bottom navigation, thumb-zone optimized
- Breakpoints must never break layout — test at every width, not just 3 breakpoints

---

## 5. Visual and Motion Standards

What a 2026 product looks like. Not trendy — timeless enough to not feel dated in 18 months.

### Visual identity
- Clean, high-contrast, content-forward. The UI is the stage, not the star
- Typography: clear hierarchy with weight and size, not color. Body text must be legible at a glance
- Color: purposeful, not decorative. Color communicates state (active, success, error, warning) — not branding on every surface
- Density: respect screen real estate. No giant cards with 20% content and 80% padding. Information-dense but not cluttered
- Dark mode: not optional, not an afterthought. Must be designed, not auto-inverted. Both modes get equal design attention

### Motion principles
- Motion communicates, it doesn't decorate
- All transitions < 300ms. Most should be 150-200ms
- Entrance animations: subtle fade + slight translate (4-8px). Never slide in from off-screen for in-page elements
- Exit animations: faster than entrances (100-150ms). Fade out, no elaborate departures
- Loading states: skeleton shimmer, not spinners. Spinners only for actions with unknown duration (AI generation, file upload)
- Micro-interactions: button press feedback (scale 0.97-0.99), toggle animations, checkbox fills
- Scroll-linked animations: use sparingly and only on landing/marketing pages. Never in the app shell
- Reduced motion: respect `prefers-reduced-motion` always. Functional transitions still happen, decorative ones don't

### What feels dated
- Drop shadows on everything (2019)
- Rounded corners > 12px on cards (2020 big-radius era)
- Gradient backgrounds (2021)
- Glassmorphism everywhere (2022)
- Oversized illustrations with no clear purpose (2020)
- Hamburger menus on desktop (2018)
- Skeleton screens that don't match actual content layout (lazy)

### What feels current
- Subtle depth through border + slight background differentiation, not shadows
- 6-8px border radius — consistent, not playful
- Purposeful whitespace that creates breathing room without wasting viewport
- Color used as accent, not atmosphere
- Typography doing the heavy lifting for hierarchy
- Responsive density — tighter on mobile, roomier on desktop when space allows

---

## 6. Empty State Standards

No screen should ever feel dead. An empty state is the product's first impression for that feature — treat it that way.

### Required elements for every empty state
1. **Clear explanation** of what will be here (not "Nothing here yet" — say what this space is FOR)
2. **Primary action** to populate it (a real button, not just text)
3. **Context or social proof** when available ("12 students joined their first space today" or "Most popular spaces this week")

### By state type

**First-time user (never used this feature)**
- Explain the value: what happens when they use this?
- Show a single clear CTA — not 3 options
- If relevant, show what other students have done (without revealing private data)
- Example: "Your spaces will show up here. Most students join 2-3 in their first week."

**Zero results (search/filter returned nothing)**
- Never "No results found" alone
- Show: what they searched, suggestion to broaden, and a fallback action
- If they searched for something that doesn't exist: prompt them to create it
- Example: "No spaces match 'rock climbing.' Want to start one? 4 other students searched for this too."

**Completed/cleared state (inbox zero, all tasks done)**
- Celebrate. This is a win
- Light, positive messaging: "You're all caught up" with a subtle visual
- Suggest a next action that isn't pushy: "Explore what's new on campus" (not "You have nothing to do — go find something")

**Error state (something broke)**
- Honest, clear language: "We couldn't load your feed. This is on us, not you."
- Retry button
- Fallback content if available (cached version)
- Never a generic error page with no context

### Hard rules
- Every empty state must be designed and reviewed — no default browser states, no unstyled divs
- Empty states must use the same design tokens and motion as the rest of the product
- Empty states are never a wall of text. Short copy + clear action + optional illustration/icon

---

## 7. Inclusivity Standards

HIVE serves ALL students. Not just the outgoing ones. Not just the ones who already have a friend group. Not just the ones who grew up in the US. Every feature must pass this filter.

### Student diversity checklist (every feature must answer)
- Does this work for a **commuter** who is on campus 3 hours a day?
- Does this work for an **introvert** who will never walk up to a stranger?
- Does this work for an **international student** who might not understand American slang or cultural references?
- Does this work for a **first-generation student** who doesn't know the unwritten rules?
- Does this work for a **student with a disability** navigating with assistive technology?
- Does this work for a **transfer student** who missed freshman orientation?
- Does this work for a **grad student** who has different needs than undergrads?
- Does this work for a **student who works full-time** and has limited free time?

### Language standards
- No jargon, no acronyms without explanation on first use
- Labels must be self-explanatory — a student should never need a tutorial to understand what a button does
- Tone: warm, direct, peer-to-peer. Not corporate, not childish, not tryhard
- Avoid culturally specific idioms that international students might not understand
- Never assume pronouns — use "they" as default in UI copy, let students set their own

### Introvert-friendliness
- Every social feature must have a low-commitment entry point: browse before joining, lurk before posting, observe before committing
- "Join" should never feel permanent or scary — make leaving as easy as joining
- Digital-first participation: don't assume every student wants in-person events. Online discussions, async collaboration, and virtual events are equally valid
- Never shame students for not participating: no "You haven't posted in a while!" guilt notifications

### Accessibility (WCAG 2.2 AA baseline)
- Minimum touch target: 44x44px (48x48 preferred on mobile)
- Color contrast: 4.5:1 for normal text, 3:1 for large text — in BOTH light and dark modes
- All images have meaningful alt text (not "image" or "photo")
- All interactive elements have accessible names
- Focus management: modals trap focus, closing returns to trigger, route changes announce to screen readers
- Reduced motion support via `prefers-reduced-motion`
- Forms: visible labels (not just placeholders), clear error messages linked to fields, logical tab order
- No information conveyed by color alone — always pair with icon, text, or pattern

### Cultural sensitivity
- Event and space categories must be inclusive: religious/spiritual spaces welcome without being centered
- Calendar awareness: not everyone observes the same holidays. Don't assume availability
- Food-related features: accommodate dietary diversity by default (halal, kosher, vegan, allergies)
- Name handling: support names of any length, any character set, no forced first/last split if culturally inappropriate

---

## 8. Privacy Standards

Gen Z treats privacy as identity. They will leave a platform that feels surveillance-y. HIVE must be the app they trust.

### Defaults
- Profiles: visible to campus only by default. Not public. Not searchable outside HIVE
- Activity: what spaces a student joins is visible to space members only, not the entire campus
- Online status: off by default. Students opt in to showing when they're active
- Read receipts: off by default everywhere
- Search history: stored locally only, never on server, clearable
- Data collection: minimal by design. Don't collect what you don't need TODAY

### Controls students must have
- **Visibility controls**: per-section profile visibility (bio visible, major hidden, etc.)
- **Space membership visibility**: choose whether others can see what spaces you're in
- **Block and mute**: instant, one-tap, no confirmation dialogs. Blocked users cannot see any trace of the blocker
- **Data export**: students can download all their data at any time
- **Account deletion**: full deletion within 30 days, immediate removal from all visible surfaces
- **Notification granularity**: per-space, per-type notification controls. Not just on/off

### Transparency
- Settings page clearly shows: what data HIVE collects, why, and where it's stored
- AI personalization: students can see and reset their interest profile at any time
- No dark patterns in privacy: the most private option is always the easiest to select
- Changes to privacy settings take effect immediately — no "processing" delays

### Hard rules
- Never share student data with third parties. Period
- Never use student data for advertising. Period
- Never track students across other apps or websites. Period
- Never use location data without explicit, per-use consent. Even then, default to campus-level, not building-level
- Campus administrators can see aggregate analytics (X students active this week) but NEVER individual behavior data
- Compliance: FERPA always, WCAG 2.2 AA always, GDPR-ready architecture even if not currently required

---

## 9. Anti-Patterns

What HIVE must never do. If any of these show up in a PR, it's a block.

### Engagement dark patterns
- **Never** use notification counts as engagement bait (red badge with "12" when it's 12 low-priority items)
- **Never** send "you're missing out" or FOMO-driven notifications
- **Never** use infinite scroll without a natural stopping point or "you're caught up" marker
- **Never** auto-play video or audio
- **Never** use streaks, daily login rewards, or gamification that punishes absence
- **Never** show "X people are viewing this right now" pressure indicators
- **Never** make unsubscribe/leave/delete harder than subscribe/join/create

### UI anti-patterns
- **Never** a full-page modal for something that could be inline
- **Never** a toast notification for something that needs action (use inline alerts instead)
- **Never** more than 2 clicks to reach any core feature from home
- **Never** pagination where infinite scroll makes more sense (feeds) or vice versa (search results)
- **Never** a settings page that requires a separate save button for each section — auto-save or batch save
- **Never** confirmation dialogs for reversible actions (joining a space, following a person)

### Content anti-patterns
- **Never** fake activity ("A student just joined!" when it happened 3 days ago)
- **Never** anonymous posting. Every piece of content has a real, verified student behind it
- **Never** vanity metrics as the primary display (follower counts, like counts front and center)
- **Never** comments sections that are just "Nice!" and emoji reactions with no substance
- **Never** algorithmic timelines that prioritize controversy or conflict

### Technical anti-patterns
- **Never** client-side filtering when the dataset could be large (always server-side)
- **Never** optimistic UI without a rollback strategy
- **Never** cache without invalidation strategy
- **Never** console.log in production
- **Never** error messages that expose stack traces or internal paths to users
- **Never** store PII in localStorage

### What feels like 2023 (kill on sight)
- "Sign up to see more" walls
- "Download our app" banners on mobile web
- Cookie consent banners that are harder to decline than accept
- Onboarding carousels with 5 swipeable slides nobody reads
- Feature announcement modals on login
- "What's new" badges that never go away
- Loading spinners with motivational quotes
- Confetti animations on every action

---

## 10. Reference Products

What to learn from products students use daily. Steal the patterns, not the products.

### Linear
- **Learn**: Speed is a feature. Every interaction feels instant. Command palette as the primary navigation for power users. Keyboard-first but mouse-friendly. Status updates that feel natural, not bureaucratic
- **For HIVE**: Space management should feel this fast. Creating events, updating spaces, managing members — every action should feel like it took 0ms

### Notion
- **Learn**: Flexible blocks that let users build their own structure. Progressive complexity — simple by default, powerful when needed. Templates that give you a starting point without locking you in
- **For HIVE**: Space pages should have this flexibility. Let organizers build their space's presence their way — not a fixed template

### Arc (and Dia)
- **Learn**: Rethought what a browser could be by questioning every default. Spaces for context-switching. AI that summarizes and helps without being asked. The browser gets out of the way
- **For HIVE**: The app shell should disappear. Students should feel like they're IN their campus community, not using a tool that shows it to them

### ChatGPT
- **Learn**: Conversational UI that made AI accessible to everyone. The input box IS the interface. Streaming responses feel alive. History that's searchable and re-enterable
- **For HIVE**: Onboarding, search, and discovery should feel conversational where appropriate. Not everything needs a form

### Perplexity
- **Learn**: Shows sources and reasoning. Answers feel trustworthy because you can verify them. Fast, focused, no clutter. The "answer engine" model — get what you need, no browsing required
- **For HIVE**: Discovery should surface answers, not links. "What's happening this weekend?" should get a curated, personalized answer, not a list of 40 events to scroll through

### Discord
- **Learn**: Servers as communities, channels as conversations, roles as identity. Voice channels that are always "on" create ambient presence. The culture of Discord IS the product
- **For HIVE**: Spaces should feel as alive as Discord servers. But without the chaos, the moderation nightmare, and the barrier to entry

### Instagram (pre-2024)
- **Learn**: Stories created low-commitment, ephemeral sharing. The grid as personal curation. DMs as the real social network. Visual-first communication
- **For HIVE**: Events and space activity should have ephemeral, visual, low-effort sharing options. Not everything needs to be a post

### Spotify (Discover Weekly)
- **Learn**: Personalization that feels like magic, not surveillance. "Made for you" playlists that are genuinely good. The algorithm earns trust through quality, not by explaining itself
- **For HIVE**: The discovery feed should have this quality. Students should open HIVE and think "how did it know?" — not "why is it showing me this?"

### BeReal
- **Learn**: Authenticity as a feature. Time-limited, simultaneous sharing created genuine moments. Anti-performative by design
- **For HIVE**: Campus life is real life. Features should encourage authentic sharing, not curated performance

### Figma
- **Learn**: Real-time collaboration that just works. Multiplayer presence (cursors, avatars). Comments in context. The product feels alive because other people are visibly in it
- **For HIVE**: Spaces with active members should feel alive. Show who's here, what's happening, what just changed. Not a static page that updates on refresh

---

## The Non-Negotiables

Every feature spec must clear every one of these bars. No exceptions.

1. **Under 2 seconds to useful content on first load, under 500ms on return visits.** If it's slower, it's broken.

2. **AI is ambient, not bolted on.** If you could remove the AI and the feature works the same, the AI isn't integrated — it's decoration.

3. **Works for the loneliest freshman and the busiest club president.** If a feature only serves one end of the student spectrum, it's incomplete.

4. **No dead ends, ever.** Every screen has a clear next action. Every empty state guides. Every error recovers.

5. **Privacy by default, not by setting.** The most private option is always the default. Students opt into visibility, never opt out.

6. **Keyboard, touch, and assistive tech are equal citizens.** Not "we'll add accessibility later." WCAG 2.2 AA from day one.

7. **Motion communicates, never decorates.** Every animation has a purpose. If you can't articulate what it communicates, remove it.

8. **Personalization earns trust through quality.** Students should think "this app gets me" — never "this app is watching me."

9. **No engagement dark patterns.** No streaks, no FOMO notifications, no guilt for absence, no vanity metrics. Students come back because the product is valuable, not because it manipulates.

10. **Ship the real thing.** No placeholder buttons, no mock data, no "coming soon" labels, no console.log handlers. If it's on screen, it works.
