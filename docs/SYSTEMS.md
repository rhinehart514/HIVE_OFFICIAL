# HIVE Systems

Campus Operating System — "A student with HIVE has a campus that knows them."

Five core systems. Each has a feature spec and UX spec.

---

## System Map

| System | What It Does | Spec | UX |
|--------|-------------|------|-----|
| **Identity** | Entry, auth, profile, reputation, settings | [IDENTITY.md](systems/IDENTITY.md) | [IDENTITY_UX.md](systems/IDENTITY_UX.md) |
| **Spaces** | Communities, chat, events, boards, DMs | [SPACES.md](systems/SPACES.md) | [SPACES_UX.md](systems/SPACES_UX.md) |
| **Tools** | HiveLab, automations, templates | [TOOLS.md](systems/TOOLS.md) | [TOOLS_UX.md](systems/TOOLS_UX.md) |
| **Awareness** | Home, feed, notifications, calendar | [AWARENESS.md](systems/AWARENESS.md) | [AWARENESS_UX.md](systems/AWARENESS_UX.md) |
| **Discovery** | Explore, search, recommendations | [DISCOVERY.md](systems/DISCOVERY.md) | [DISCOVERY_UX.md](systems/DISCOVERY_UX.md) |

---

## System Standards

Every system must meet:

- **Campus isolation:** Every query filters by `campusId` from session
- **Validation:** Zod schemas on all API inputs
- **Design tokens:** All visual values from `packages/tokens`
- **Real handlers:** Every button does real work
- **No dead ends:** Every state shows next action
- **Motion:** All transitions use `@hive/tokens/motion`

---

## Quality Checklists

Concrete checks per system. Run these before shipping.

### Identity

**Entry** — "I'm in. That was easy." (Email to inside app < 90 seconds)

- [ ] Every transition has motion (no hard cuts)
- [ ] Email input: instant validation feedback
- [ ] Code entry: auto-advance on complete, clear error on wrong code
- [ ] Handle selection: real-time availability check
- [ ] Final moment: celebration that feels earned (GoldFlash)
- [ ] Error states: human copy, clear recovery path
- [ ] Back navigation: works without losing progress

**Profiles** — "I know who this person is." (Identity + activity + context in 3 seconds)

- [ ] Hero loads fast, no avatar pop-in
- [ ] Hierarchy: name > handle > credentials > bio
- [ ] Activity section: Shows real work, not empty cards
- [ ] Spaces pills: Clickable, lead somewhere useful
- [ ] Message/Connect buttons: Obviously clickable
- [ ] Own profile: Edit prompts feel helpful not naggy

**Settings** — "I can control my experience." (Find any setting < 10 seconds)

- [ ] Organized into logical sections
- [ ] Changes save with clear feedback
- [ ] Destructive actions have confirmation

---

### Spaces

**Spaces** — "I found my people. They're active." (Join to real activity < 10 seconds)

- [ ] Threshold (non-member): Compelling preview, obvious join CTA
- [ ] Join action: Instant feedback, no page reload
- [ ] Chat: Messages appear instantly (optimistic UI)
- [ ] Chat: Typing indicators, online presence feel alive
- [ ] Sidebar: Boards clearly navigable, active board obvious
- [ ] Empty board: "Start the conversation" not "No messages"
- [ ] Member list: Shows who's online, photos load fast
- [ ] Events in feed: Clear date/time, easy RSVP
- [ ] Mobile: Sidebar accessible, chat input not blocked by keyboard
- [ ] Loading: Skeleton matches layout, no content shift

Cold start reality: Empty space = dead space. Pre-seed with real campus orgs. Recruit 5-10 space leaders to be active day 1.

**DMs** (deferred, flagged OFF) — "I can actually reach out." (Send message in 2 taps from any profile)

- [ ] Panel slides smoothly
- [ ] Conversation list: Unread indicators clear
- [ ] Message input: Focus on open, send on Enter
- [ ] Messages: Appear instantly (optimistic)
- [ ] Empty state: First message prompt

---

### Tools

**HiveLab** — "I built something useful in 60 seconds." (Describe to deploy to results)

- [ ] Templates: Obvious what each does
- [ ] Canvas: Drag-drop doesn't jank
- [ ] Deploy: Clear which space, confirmation of success
- [ ] AI failures: Have fallback/retry

---

### Awareness

**Home** — "I see what's happening and where to go." (Instant orientation in 5 seconds)

- [ ] Loads fast — skeleton, not spinner
- [ ] Hierarchy clear: Most important is most prominent
- [ ] Space cards: Activity indicator (online count, recent messages)
- [ ] Events: Date/time obvious, RSVP status clear
- [ ] Empty state: New user sees clear onboarding path

**Notifications** — "I know when things happen." (Notified within 1 minute of activity)

- [ ] Clear what's unread vs read
- [ ] Items are actionable (click goes somewhere)
- [ ] Mark as read: Instant feedback
- [ ] Empty state: "You're all caught up"
- [ ] Email: Arrives promptly, looks professional

**Calendar** — "I see all my events." (Upcoming events, RSVP status clear)

- [ ] Events grouped by day
- [ ] RSVP status obvious
- [ ] Click event goes to space

---

### Discovery

**Explore** — "I can find exactly who/what I'm looking for." (Find relevant space < 30 seconds)

- [ ] Search: Results appear as you type (<200ms feel)
- [ ] Search: Clear what's being searched (spaces? people? all?)
- [ ] Tabs: Obvious which is selected, smooth transitions
- [ ] Cards: Enough info to decide (name, description, member count, activity)
- [ ] Cards: Hover states, click targets obvious
- [ ] Empty search: Helpful suggestions, not "No results"
- [ ] Loading: Skeleton cards match final layout

---

### Cross-Cutting: Shell

**Navigation** — User always knows where they are.

- [ ] Current page indicator is obvious (gold accent)
- [ ] Navigation items clearly labeled
- [ ] Mobile nav accessible
- [ ] Page transitions smooth
- [ ] Sign out works and redirects

---

## Deferred

Not in scope for launch. Code exists, flags OFF.

- **Rituals** — Campus-wide challenges. Needs critical mass (1000+ users).
- **Connections/Friends** — Friend graph adds overhead. DMs sufficient.
- **Google Calendar Sync** — OAuth nice-to-have. Not blocking.
