# HIVE Product Spec — 2026

> Campus operating system. Spaces run your org. HiveLab gives it superpowers.

---

## The One-Liner

**The only platform where running your club builds your verified leadership record.**

---

## Who It's For

### Primary: Student Org Leaders
Club presidents, eboard members, Greek life chairs, dorm RAs, SGA reps. Anyone responsible for making a group of students do things together. There are ~800 registered orgs at UB alone. Every one has 3-8 leaders. That's 2,400-6,400 people who feel the pain every week.

### Secondary: Students
The other 20,000 undergrads who belong to 1-5 orgs each. They don't run the org — they show up, vote in polls, RSVP to events, check what's happening tonight. They're members, not builders.

### Tertiary: Builders
CS students, design students, entrepreneur types who want to ship something. Small audience, high engagement, loud evangelists.

---

## The Two Products

HIVE is two things that feed each other:

### 1. Spaces — Where you run your org
### 2. HiveLab — Where you get what your org needs

They're not separate apps. They're two sides of the same platform. A leader lives in their space and pulls from HiveLab when they need something. A creation from HiveLab deploys into a space. The loop is closed.

---

# SPACES

## What It Is

A space is a club's home on HIVE. It's where the org operates — chat, events, tools, members, analytics. Think Discord server meets Notion workspace, purpose-built for student orgs.

Every UB org has a space pre-created. Leaders claim theirs. Members join. The org runs from here instead of across 5 disconnected apps.

## The Pain It Kills

| Current Reality | With HIVE Spaces |
|---|---|
| GroupMe for chat (no structure, infinite scroll, new members see 847 unread) | Chat with inline tools — polls, RSVPs, countdowns live in the conversation |
| Google Forms for signups (separate app, manual sharing, checking responses in spreadsheet) | `/signup` in chat → inline → real-time → auto-close at capacity |
| When2Meet for scheduling (another link, another app, manual counting) | `/poll` in chat → instant results → automated reminder for winner |
| Instagram for promotion (reach 4% of followers, no interaction) | Event page with `/t/` link → shareable everywhere → interactive |
| Google Sheets for tracking (treasurer's nightmare) | Auto-generated analytics, member tracking, activity logs |
| Nothing for handoff (new eboard starts from zero every year) | Space persists. Automations run. History exists. Zero handoff friction. |

## Core Features

### Chat
The primary surface. Full-screen, real-time, Firebase-backed.

- Messages with replies, reactions, pins, threads, edit, delete
- Image attachments
- Typing indicators
- Unread tracking with dividers
- Search (Cmd+K)

Chat isn't just communication. It's the **creation surface.** Slash commands turn messages into interactive tools.

### Slash Commands (Tier 1 Creation)
This is where 90% of creation happens. Inside the conversation. Zero friction.

| Command | What It Does | Use Case |
|---|---|---|
| `/poll "Question?" Option1 Option2` | Creates live inline poll | "When should we meet?" "Best theme for formal?" |
| `/rsvp "Event Name" --date= --limit=` | Creates RSVP collector with capacity | "Spring Formal — 120 spots" |
| `/countdown "Title" <date>` | Creates live countdown timer | "Days until Hackathon" |
| `/signup "Title" Slot1 Slot2 Slot3` | Creates slot-based signup | "Fundraiser tasks: Baking, Setup, Cashier" |
| `/announce <message> --pin` | Creates formatted announcement | Weekly meeting reminder |
| `/automate <type> "Name"` | Creates recurring automation | "Every Monday: post meeting poll" |
| `/welcome "Message"` | Sets join welcome message | New member onboarding |
| `/remind <minutes> "Message"` | Sets a timed reminder | "Remind in 30: close the poll" |

Every slash command creates an **inline component** that renders directly in the chat feed. Members interact with it without leaving the conversation. Every component also generates a standalone `/t/` link for sharing outside HIVE.

### Events
Two sources:
1. **RSS/UB data events** — pulled from campus feeds, auto-populated, tagged with UB badge
2. **Leader-created events** — via `/event` command, sidebar, or leader FAB

Events show in the space sidebar (next 3 upcoming), in chat (when announced), and in the campus-wide Discover feed.

Each event has: title, date/time, location, RSVP count, capacity, description. RSVP via inline component or event page.

### Leader Tools
Leaders see elevated controls inside their space — not a separate management surface.

**Leader FAB (floating action button):**
- Create Event
- Add Tool (from HiveLab)
- Open Dashboard

**Leader Dashboard:**
- Member analytics (growth, retention, activity)
- Event performance (attendance rates, RSVP conversion)
- Content engagement (which polls/tools get interaction)
- Automation status (what's running, what fired recently)

**Space Settings:**
- General (name, description, visibility)
- Contact info (social links from UBLinked data)
- Members (roles, promote/demote, suspend, remove)
- Moderation (content flags, reports)
- Join requests (for private spaces)
- Tools (deployed HiveLab creations)
- Automations (recurring actions)
- Danger zone (transfer ownership, delete)

### Automations (Tier 2 Creation)
Recurring actions that run without human intervention.

- **Welcome automation:** New member joins → welcome message posts
- **Reminder automation:** Every Monday at 9am → "Don't forget to book the room"
- **Poll automation:** Every week → "When's the meeting?" poll auto-posts
- **Event follow-up:** After event → "How was it?" poll auto-posts
- **Keyword triggers:** Someone says "meeting" → bot responds with next meeting details

Set once. Runs forever. Carries over between eboard transitions.

### Claiming
Every UB org has a pre-created space (seeded from UB data). Spaces start unclaimed.

**Claiming flow:**
1. Leader finds their org on Discover or searches
2. Sees "Claim This Space" button
3. Verifies leadership (email domain + self-attestation for v1, UBLinked verification for v2)
4. Becomes owner
5. Space activates — leader tools unlock, customization available

**Unclaimed spaces** still show UB data (events from RSS, org description from directory). They're not empty — they're waiting for their leader.

**The land-grab dynamic:** "Your club already has a space. If you don't claim it, someone else will." Urgency drives adoption.

### Verified Leadership Record
Everything a leader does in their space generates verifiable data.

**Auto-tracked metrics:**
- Events organized (count + total attendance)
- Membership growth (start → current + % change)
- Retention rate (semester over semester)
- Content created (polls, signups, events, automations)
- Engagement rate (interaction per member)
- Tenure (how long they've led the space)

**Verification page:** `/verify/[handle]-[space]`
- Public, shareable link
- Shows verified metrics from platform data
- Timestamp range (e.g., "Aug 2025 – May 2026")
- HIVE verified badge
- Exportable for resumes, LinkedIn, applications

**Why this matters:**
- Every campus recruiter asks "tell me about your leadership experience"
- Every student leader currently self-reports with no proof
- HIVE is the only platform that can verify it because it IS the operating system
- Employers trust platform-verified data over resume bullet points

### The Member Experience
For regular students (non-leaders):

- **Join** — tap a space, one button, you're in. No GroupMe link hunting.
- **Chat** — talk, react, reply, participate in polls/RSVPs inline
- **Discover** — campus dashboard showing events tonight, trending spaces, dining hours
- **Profile** — your spaces, your activity, your campus identity

The member experience is simple and clean. They don't need to build anything. They show up, participate, see what's happening.

### Information Architecture

**Desktop:** Thin 72px sidebar (space icons) + content area
**Mobile:** Full screen content + bottom nav (Discover | Spaces | You) + yellow FAB

**Nav:**
- **Discover** — campus dashboard. What's happening, spaces to join, events tonight.
- **Spaces** — your spaces list. iMessage style: name, last message, timestamp, unread dot.
- **You** — profile, your creations, settings, verified leadership records.

**Inside a space:** Full-screen chat. Sidebar accessible via swipe or icon (events, tools, members). Leader tools via FAB and header icons.

---

# HIVELAB

## What It Is

HiveLab is the creation engine behind HIVE. It's two things:

1. **A curated library of campus micro-apps** you activate with one tap
2. **An AI creation tool** for anything that doesn't exist yet

It's NOT a standalone tool builder. It's how spaces get superpowers.

## How It Connects to Spaces

```
Leader needs something → Opens HiveLab (from space sidebar or FAB)
  → Browses library OR describes what they need
    → Activates / AI generates it
      → Deploys to their space
        → Members interact with it in chat or sidebar
          → Activity feeds into verified leadership record
```

Every HiveLab creation:
- Lives at its own `/t/[id]` URL (shareable outside HIVE)
- Can be deployed to any space
- Generates usage analytics
- Is cloneable by other leaders

## The Library (Tier 1: Browse & Activate)

Pre-built, tested, ready to deploy. One tap. Organized by what job they do.

### Run Your Meetings
| App | What It Does |
|---|---|
| **Meeting Poll** | Recurring when-to-meet poll with auto-reminder |
| **Meeting Minutes** | Structured template, auto-posted to space after meeting |
| **Attendance Logger** | QR code check-in, auto-tracks who showed up |
| **Agenda Builder** | Collaborative agenda, members add topics before meeting |

### Run Your Events
| App | What It Does |
|---|---|
| **Event Page** | Full event with RSVP, details, location, capacity |
| **Ticket Distributor** | First-come-first-serve with waitlist |
| **Event Countdown** | Live countdown deployed to space + shareable link |
| **Post-Event Survey** | Auto-sent feedback poll after event ends |
| **Photo Wall** | Members upload event photos, live gallery |

### Run Your Money
| App | What It Does |
|---|---|
| **Dues Tracker** | Who paid, who hasn't, auto-reminders |
| **Budget Dashboard** | Expenses, income, balance — visible to eboard |
| **Fundraiser Tracker** | Goal thermometer + contributor list |
| **Merch Store** | Simple order form for club merch drops |

### Run Your People
| App | What It Does |
|---|---|
| **Election System** | Nominations, voting period, verified results |
| **Role Directory** | Eboard roster with roles, contact info, office hours |
| **Office Hours** | Time slot signup for meeting with eboard members |
| **New Member Checklist** | Onboarding steps with progress tracking |
| **Committee Assigner** | Random or preference-based committee assignment |

### Run Your Content
| App | What It Does |
|---|---|
| **Announcement Board** | Pinned announcements with read receipts |
| **Newsletter Builder** | Simple email-style update, shareable via link |
| **Social Feed** | Curated posts for external-facing content |
| **FAQ / Wiki** | Persistent info page for common questions |

### Run Greek Life
| App | What It Does |
|---|---|
| **Rush Tracker** | Pipeline management for recruitment |
| **Bid Vote** | Anonymous voting on new member bids |
| **Study Hours Logger** | Track mandatory study hours with verification |
| **Philanthropy Tracker** | Service hours + fundraising toward chapter goals |

### Run Academics
| App | What It Does |
|---|---|
| **Study Group Matcher** | Match by course, availability, location |
| **Flashcard Set** | Collaborative flashcards, shareable |
| **Course Review** | Structured course reviews from members |
| **Project Showcase** | Portfolio of member projects with descriptions |

Each category has 4-8 apps. Total library: 30-50 micro-apps at launch. They're not all built day one — the library grows as leaders request and the community contributes.

## AI Creation (Tier 2: Describe & Generate)

For anything not in the library.

**Interface:** Conversational. Not a canvas.

```
Leader: "I need a way to collect volunteer signups for our 
         5K fundraiser. We need people for registration, 
         water stations, and finish line. Max 8 per station."

HiveLab: Here's what I built:
         
         [Preview: Volunteer Signup]
         - 3 stations with slot limits
         - Auto-close when full
         - Confirmation message to signups
         - Reminder 24hr before event
         
         [Deploy to Space]  [Edit]  [Start Over]
```

**The AI path:**
1. Leader describes what they need in plain language
2. AI selects appropriate elements from the 39-element registry
3. Generates a composed creation with configuration
4. Shows live preview
5. Leader approves → deploys to space

**The refinement loop:**
- "Make it anonymous"
- "Add a deadline"
- "Change the slots to 10 each"
- "Add an 'other' option"

Natural language refinement. No canvas. No drag and drop. Just conversation.

## Canvas IDE (Tier 3: Build from Scratch)

For the 2% who want full control.

**What it is:** Visual editor with drag-and-drop elements, property panels, connections between elements, automations, and deploy pipeline.

**Who uses it:** CS students building portfolio projects, power users with specific needs, creators who want pixel-level control.

**How to access it:** Not in the main nav. Accessible from:
- HiveLab → "Build from scratch" link at bottom
- Profile → "Your creations" → "New creation" → "Advanced editor"
- Direct URL `/lab/[toolId]/edit`

**What it has:**
- 39 elements across 6 categories (data, interactive, display, media, logic, layout)
- Element property panels
- Real-time preview
- Element connections (element A's output → element B's input)
- AI command palette (⌘K) for quick modifications
- Deploy pipeline with preview → staging → live

The canvas is the engine under the hood. Most leaders never see it. Builders live in it.

## Creation Lifecycle

```
Created (in HiveLab)
  → Deployed (to a space OR standalone)
    → Active (members interacting, data collecting)
      → Shared (via /t/ link outside HIVE)
        → Cloned (other leaders copy it for their space)
          → Analytics (usage data feeds leader verification)
```

Every creation is:
- **Independent** — lives at `/t/[id]`, works without HIVE account
- **Deployable** — can be pinned in any space's sidebar or chat
- **Cloneable** — any leader can fork it for their org
- **Measurable** — usage, interactions, unique visitors tracked
- **Shareable** — open graph tags, social previews, one-tap access

## HiveLab Information Architecture

**Entry points:**
1. From space sidebar → "Add Tool" → opens HiveLab library filtered for space context
2. From leader FAB → "Add Tool" → same
3. From global nav → "Create" → full HiveLab with library + AI + your creations
4. From profile → "Your Creations" → manage what you've built

**Layout:**

```
┌─────────────────────────────────────────────┐
│                                             │
│  HiveLab                     [Your Stuff]   │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ What does your org need?            │    │  ← AI prompt (primary)
│  └─────────────────────────────────────┘    │
│                                             │
│  POPULAR                                    │  ← Geist Mono label
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────┐   │
│  │Meeting │ │Event   │ │Election│ │Dues│   │  ← horizontal scroll
│  │Poll    │ │Page    │ │System  │ │    │   │
│  └────────┘ └────────┘ └────────┘ └────┘   │
│                                             │
│  BY CATEGORY                                │
│  Meetings · Events · Money · People ·       │
│  Content · Greek Life · Academics           │
│                                             │
│  ──────────────────────────────────         │
│  Build from scratch →                       │  ← ghost link to canvas
│                                             │
└─────────────────────────────────────────────┘
```

**Key rules:**
- AI prompt is the hero. Top of page. "What does your org need?"
- Library below, browsable by category
- "Build from scratch" is a ghost link at the bottom — accessible, not promoted
- When accessed from a space, context is passed ("Add to CS Club") and deploy goes directly to that space

---

# HOW THEY CONNECT

## The Loop

```
SPACES (operations)          HIVELAB (capability)
     │                            │
     │  "I need a dues tracker"   │
     │ ─────────────────────────> │
     │                            │  Browse library or AI create
     │    Deploy to my space      │
     │ <───────────────────────── │
     │                            │
     │  Members use it            │
     │  Data collects             │
     │  Analytics generate        │
     │                            │
     │  Verified leadership       │
     │  record grows              │
     │                            │
     │  Other leaders see it      │
     │ ─────────────────────────> │
     │                            │  Clone it for their space
     │ <───────────────────────── │
```

## The Flywheel

1. **Leader claims space** (pre-populated, zero effort)
2. **Runs org from space** (chat, events, slash commands)
3. **Needs something more** → opens HiveLab → activates or AI-creates
4. **Deploys to space** → members interact
5. **Shares via /t/ link** → reaches people outside HIVE
6. **Non-HIVE user taps link** → sees HIVE → "my club is on here?"
7. **New leader claims their space** → cycle repeats
8. **All activity → verified leadership record** → leaders can't leave

## The Moat

After 6 months on HIVE, a club has:
- Chat history and institutional knowledge
- 3-5 recurring automations running
- Custom tools deployed to their space
- Analytics proving their org's impact
- Leader verification records linked on resumes

**Switching cost isn't data lock-in. It's operational infrastructure.** Rebuilding that in GroupMe + Google Forms + spreadsheets would take 40+ hours. And you'd lose the verification.

---

# VALUE PROP SUMMARY

| Audience | Value Prop |
|---|---|
| **Student leader (acquisition)** | Your club is already here. Claim it. |
| **Student leader (retention)** | Run your org from one place. Kill the 5-app juggle. |
| **Student leader (lock-in)** | Everything you do builds your verified leadership record. |
| **Member (acquisition)** | See what's happening at UB. Join clubs without the awkward. |
| **Member (retention)** | One place for all your club stuff. Messages that do things. |
| **Builder (acquisition)** | Ship your first product today. |
| **Builder (retention)** | Your creations get used by real people on real campuses. |
| **University (partnership)** | Verified involvement data for student affairs reporting. |
| **Employer (future product)** | Platform-verified leadership records for campus recruiting. |

---

# WHAT SHIPS FRIDAY (Feb 14)

The full product isn't built in 5 days. What ships:

1. **Landing page** with "Your club is already here" positioning
2. **Entry flow** — email → code → in
3. **Discover** — UB spaces, events from RSS, search
4. **Spaces** — claim, join, chat with slash commands (/poll, /rsvp, /countdown)
5. **Leader tools** — FAB, basic analytics, settings
6. **HiveLab** — library (5-10 starter apps), AI creation (conversational)
7. **Standalone tools** — `/t/` links that work for anyone
8. **5 real users** running their orgs on HIVE

What ships later:
- Verified leadership records (needs 1+ semester of data)
- Full automation system
- HiveLab marketplace (community-contributed apps)
- Cross-campus expansion
- Employer product

---

# THE TEST

Open any surface. Ask:

1. Does a club president look at this and think "my life just got easier"?
2. Does a student look at this and think "oh, my club is on here"?
3. Does everything the leader does generate verifiable proof?
4. Does every creation have a shareable link that works for anyone?
5. Would someone choose this over GroupMe + Google Forms?

If #5 is no, keep going.
