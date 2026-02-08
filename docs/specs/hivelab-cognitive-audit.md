# HiveLab Cognitive Fluency Audit

> Every piece of jargon, every hidden assumption, every moment a student thinks "this isn't for me" -- diagnosed and prescribed.

---

## Executive Summary

HiveLab is the most powerful feature in HIVE. It is also the most confusing. A freshman who could benefit from a quick poll in their club sidebar will never touch it because the entire system is architected and labeled for a "builder" persona that represents less than 10% of students.

The core problem is not the capability -- it is the framing. HiveLab presents itself as a tool-building IDE when it should present itself as "get things done for your group." The mental model is wrong, the language is wrong, and the entry points are wrong.

This audit identifies every friction point and prescribes fixes grounded in cognitive fluency research: the principle that people prefer, trust, and engage with things that are easy to process mentally.

---

## 1. Naming & Language Audit

Every term a student encounters, evaluated for instant comprehension.

### Critical Jargon (Must Rename)

| Current Term | Problem | Student-Native Alternative | Why |
|---|---|---|---|
| **HiveLab** | Sounds like a science department. "Lab" implies experimentation, coding, technical skill. | **Tools** or **Make** | Students already say "I need a tool for this." One word, zero explanation needed. |
| **Elements** | Developer vocabulary. Students don't think in "elements." | **Pieces** or **Blocks** | Notion proved "blocks" works. Canva uses "elements" but their audience expects design language. Students don't. |
| **Tool** (as the created artifact) | Acceptable but overloaded. A "tool" sounds utilitarian, not exciting. | **Keep "Tool"** but context-switch to the outcome: "Your Poll" not "Your Tool" | The tool should be named by what it does, not what it is. |
| **Composition** | Pure engineering jargon. Never shown to students. | **Layout** or just remove from UI entirely | Only appears in types/code but if it ever surfaces, it kills comprehension. |
| **Deploy** | Military/DevOps term. A club president deploying a poll sounds absurd. | **Share** or **Add to [space name]** | "Share this to Photography Club" is instantly clear. "Deploy to Photography Club" is not. |
| **Canvas** | IDE concept. Students picture an art canvas or the LMS (Canvas by Instructure). | **Editor** or **Workspace** | "Canvas" creates direct confusion with the Canvas LMS that every UB student uses daily. |
| **Automations** | Power-user concept. Implies programming logic. | **Auto-actions** or **When-then rules** or just embed as smart defaults | "When someone RSVPs, notify the group leader" is a sentence, not an "automation." |
| **Connections** (tool-to-tool) | Abstract infrastructure concept. | **Linked data** or hide entirely behind smart defaults | Students don't need to know data flows between tools. It should just work. |
| **Setups** | Vague. A "Setup" of what? | **Bundles** or **Kits** | "Event Kit" (RSVP + Countdown + Check-in) is self-explanatory. "Event Setup" is not. |
| **Surface** (sidebar/inline placement) | Technical positioning term. | **Where it shows up** or **Placement** | In deploy flow: "Show in sidebar" vs "Show in the main page." |
| **Triggers / Thresholds / Conditions** | Automation sub-jargon. | Sentence-based UI: "When [event], do [action]" | Never show these terms. Show natural language instead. |
| **Element Palette** | Design tool jargon. | **Add a piece** or **+ button** with categories | A palette is something a painter uses. Students add things. |
| **Quick Start** | Acceptably clear but overused across tech | **Start with...** or **Popular templates** | Slightly warmer, less "tech onboarding." |
| **Instance ID / Deployment ID** | Never show to students. Ever. | N/A | These are internal identifiers. If they leak to UI, it is a bug. |
| **Config / Configuration** | Developer language. | **Settings** or **Customize** | Every student understands "settings." |
| **Data Transforms (toArray, toCount, etc.)** | Pure developer jargon. Should never appear in UI. | Auto-apply intelligently or show as: "Show as a number" / "Show as a list" | If a student ever sees "toArray," the product has failed. |

### Acceptable Terms (Keep)

| Term | Why It Works |
|---|---|
| **Poll** | Universal. Everyone knows what a poll is. |
| **RSVP** | Standard campus vocabulary. |
| **Countdown** | Self-explanatory. |
| **Leaderboard** | Gamification is familiar to this generation. |
| **Template** | Widely understood. But show examples, not just the word. |
| **Preview** | Clear action. |
| **Save** | Universal. |
| **Settings** | Universal. |

### Language Tone

Current: "Welcome to your Lab" -- positions this as a destination for builders.
Better: "What does your group need?" -- positions this as a tool for getting things done.

Current: "Build tools your space will actually use" -- admits the problem (tools that don't get used) while framing the student as a builder.
Better: "Polls, sign-ups, countdowns -- ready in seconds" -- shows the outcomes, not the process.

Current: "Or name a new tool..." (placeholder text in prompt)
Better: "What do you need? Try 'poll for meeting times' or 'event countdown'" -- shows by example, reduces blank-canvas paralysis.

---

## 2. Mental Model Audit

### The Wrong Mental Model: "I am a builder in an IDE"

The current mental model is a visual IDE with a canvas, element palette, connection wires, and deploy pipeline. This is the mental model of:
- Figma (designers)
- Retool (developers)
- Unreal Engine (game devs)

None of these audiences are "all UB students."

### The Right Mental Model: "I asked for it and it appeared"

The mental model that clicks for a freshman in 3 seconds:

**ChatGPT + Instagram Stories**

- ChatGPT: "I type what I want in plain English and I get something useful back."
- Instagram Stories: "I pick a sticker (poll, question, countdown) and stick it on my thing."

The student should never feel like they're "building." They should feel like they're "adding something" or "asking for something."

### Mental Model Mapping

| System Concept | Builder Mental Model (current) | Student Mental Model (target) |
|---|---|---|
| Creating a tool | "I'm building an application" | "I'm adding a poll to my club page" |
| Adding elements | "I'm dragging components onto a canvas" | "I'm picking what goes in it" |
| Configuring | "I'm setting properties on a component" | "I'm customizing my poll question" |
| Deploying | "I'm deploying my app to production" | "I'm sharing this with my club" |
| Automations | "I'm programming trigger-action workflows" | "I'm setting up notifications" |
| Connections | "I'm wiring data pipelines between services" | (invisible -- it just works) |
| The IDE | "I'm in a development environment" | "I'm editing my thing" |

### The 3-Second Test

Show a screenshot of HiveLab to a freshman. In 3 seconds, they should understand:
1. What this is for (making useful things for your groups)
2. What they can make (polls, sign-ups, countdowns -- show them)
3. How to start (type or pick a template)

Current state: The page says "Welcome to your Lab" with an AI prompt and template chips. It passes test #3 weakly but fails #1 and #2. A student doesn't know why they're here or what the results look like.

---

## 3. Progressive Disclosure Audit

HiveLab has 27 elements, 29 templates, automations, connections, analytics, setups, and 3 AI backends. Showing all of this at once would be catastrophic. The question is: what is the layering?

### Current Layering (Broken)

The current system has no real progressive disclosure. The Lab dashboard shows:
- AI prompt (complex: "what do you want to build?")
- Template chips (8 shown, more behind "View All")
- Your Tools grid (if returning user)

Then the IDE shows everything at once: element palette, canvas, properties panel, layers panel, AI command palette, deploy button, automations button, analytics button.

### Prescribed Layering

**Layer 1: Everyone (zero learning required)**

What students see:
- Templates organized by NEED, not by category ("For your next event", "For your weekly meeting", "For collecting feedback")
- One-sentence descriptions with a visual preview of the finished result
- "Use this" button that creates it with smart defaults pre-filled
- Share to space in one step

What's hidden: Elements, canvas, connections, automations, analytics, AI prompt

Who: 90% of students. They pick a template, customize 1-2 fields, share it. Done.

**Layer 2: Curious (one click deeper)**

What students see:
- "Customize" button on any tool opens a simplified editor
- Editor shows the tool as it will appear to users, with inline editing (click on poll question to change it, click + to add an option)
- "Add a piece" button shows the 8 most common elements with plain descriptions
- AI prompt: "Describe what you want to change"

What's hidden: Canvas positioning, connection wires, automation configuration, raw element properties, layer management

Who: 8% of students. Club leaders who want to tweak templates or add an element.

**Layer 3: Power User (opt-in)**

What students see:
- Full IDE with canvas, element palette, properties panel
- Automation builder
- Tool-to-tool connections
- Analytics dashboard
- Setup (bundle) creation
- Raw element configuration

What's hidden: Nothing. Everything is available.

Who: 2% of students. CS/design students, power users, space admins running complex operations.

### Current Gap

The current system jumps from Layer 1 (templates) directly to Layer 3 (full IDE). Layer 2 does not exist. This means 90% of students who pick a template and want to make one small change are dumped into a full visual IDE with a canvas, element palette, and connection wires.

This is the single biggest cognitive cliff in HiveLab.

---

## 4. Entry Point Audit

### Current Entry Points

| Entry Point | Location | Friction |
|---|---|---|
| `/lab` in nav | Top-level navigation item | Student must know "Lab" means "tool builder." Most won't. |
| `/hivelab` | Redirects to `/lab` | Dead legacy route. |
| Space sidebar "Build Tool" button | Inside space settings | Only visible to space leaders. Correct audience but assumes they know what "Build Tool" means. |
| Command palette | Global search | Requires knowing the term to search for. |

### Missing Entry Points (Critical)

| Missing Entry Point | Where It Should Be | Why |
|---|---|---|
| **Inside space sidebar: "Add a Poll / RSVP / Countdown"** | Space sidebar, prominent | Students don't want to "build a tool." They want to add a poll. The entry point should be the specific thing, not the generic capability. |
| **Event creation flow: "Add countdown / RSVP"** | Event creation form | When creating an event, the natural time to add a countdown or RSVP widget. Don't make them go to a separate "Lab." |
| **Empty sidebar state** | Space sidebar when no tools deployed | "Your sidebar is empty. Add a poll, countdown, or sign-up sheet." with one-click templates. |
| **Feed inline: "Your club doesn't have [X] yet"** | Contextual prompts in feed/space | AI-detected opportunity: "Photography Club has an event next week but no RSVP. Add one?" |
| **After event creation** | Post-event-creation success screen | "Want to add a countdown to this event?" with one-click setup. |

### The Core Insight

HiveLab should NOT be a destination. It should be an embedded capability that surfaces at the moment of need.

A student should never need to think "I should go to the Lab." Instead:
- They're in their club space and think "we need a poll" --> the poll creation appears right there
- They're creating an event and think "we need an RSVP" --> the RSVP option is in the event creation flow
- They're looking at an empty sidebar and see "Add a countdown" --> one click

The `/lab` page should exist for power users and returning builders, but it should NEVER be the primary entry point for 90% of students.

---

## 5. Creation Flow Cognitive Load Analysis

### Flow A: Template Selection (Current)

Steps: 6 | Decisions: 4

1. Navigate to /lab (1 decision: where is this?)
2. Scan templates or type AI prompt (1 decision: which template? or what to type?)
3. Click template --> tool is created, redirect to IDE (0 decisions, but context switch is jarring)
4. IDE loads with full canvas view (cognitive overload: what are all these panels?)
5. Optional: customize in IDE (N decisions per element property)
6. Click Deploy --> select space --> confirm (2 decisions)

**Friction points:**
- Step 3-4: The jump from "pick a template" to "full IDE" is a cliff. The student picked a poll template. Why are they now in a visual IDE with a canvas and element palette?
- Step 6: "Deploy" language. The student just wants to add this to their club.

### Flow B: AI Prompt (Current)

Steps: 7 | Decisions: 5

1. Navigate to /lab (1 decision)
2. Type prompt: "make a poll about meeting times" (1 decision: how to phrase it?)
3. Wait for tool creation (suspense: will it understand me?)
4. Redirect to IDE with AI-generated composition (cognitive overload)
5. Review and edit in full IDE (N decisions)
6. Click Deploy (1 decision)
7. Select space, confirm (1 decision)

**Friction points:**
- Step 2: "Name your tool to get started" placeholder doesn't communicate that AI will build it. Students may think they're just naming an empty canvas.
- Step 4: AI generates a composition but drops you in a full IDE. The student wanted a poll, not a development environment.

### Flow C: Prescribed Minimum-Friction Flow

Steps: 3 | Decisions: 2

1. Student is in their space sidebar. Clicks "Add a Poll." (1 decision: which type of thing?)
2. Inline form: "What's your question?" + "Add options." (1 decision: the actual content)
3. Click "Add to [Space Name]." Done. (0 new decisions: the space is already known from context)

Total cognitive load: 2 decisions, zero context switches, zero jargon exposure.

This flow does not currently exist. Building it is the highest-impact change possible.

---

## 6. All-Students Lens

How each student type perceives HiveLab today, and what they need.

### The Club President (Space Leader)

**Current perception:** "I know there's a tool builder somewhere. I've used it to make a poll. The IDE is overkill but I figured it out."
**What they need:** Quick template deployment from inside their space. Inline editing. Never leave the space context.
**Cognitive barrier:** Low (they're motivated). But the IDE is still more than they need 90% of the time.

### The Freshman Who Joined a Club

**Current perception:** They have never seen HiveLab. They interact with deployed tools (polls, RSVPs) but have no idea they could create one.
**What they need:** To never need to know HiveLab exists. Templates should be suggested contextually. If they do find /lab, it should say "Make a poll for your group" not "Welcome to your Lab."
**Cognitive barrier:** High. The word "Lab" and "Build" exclude them immediately.

### The Commuter Student

**Current perception:** They have limited time on campus. They check HIVE for event info and club updates.
**What they need:** Tools that save them time (RSVP so they don't show up to cancelled events, countdowns for deadlines). Entry point should be utility-focused, not creator-focused.
**Cognitive barrier:** Medium. They'd use tools but would never "build" one.

### The International Student

**Current perception:** "Lab" doesn't translate well. "Deploy" doesn't translate well. "Automations" doesn't translate well.
**What they need:** Plain language everywhere. Visual examples over text descriptions. The word "tool" is acceptable internationally.
**Cognitive barrier:** High due to jargon. But the actual functionality (polls, sign-ups) is universally understood.

### The Introvert

**Current perception:** They lurk. They might want to create a poll for their study group but the idea of "building" and "deploying" feels like a public, high-stakes action.
**What they need:** Low-commitment entry. "Try it privately first" option. Clear indication that creating a tool doesn't broadcast anything until they choose to share it.
**Cognitive barrier:** Emotional, not cognitive. The IDE feels like standing on a stage.

### The CS Student

**Current perception:** "This is cool. I wish it had more customization."
**What they need:** The full IDE. API access. Custom element development. This is your Layer 3 power user.
**Cognitive barrier:** None. They want MORE complexity, not less.

### The Art / Communications Student

**Current perception:** "This looks like a developer tool."
**What they need:** Design-forward creation. Theming, visual customization, branded outputs. The current IDE is functional but not beautiful.
**Cognitive barrier:** Aesthetic mismatch. The dark IDE aesthetic feels "tech bro," not creative.

---

## 7. Competitive Reference -- What to Steal

### From Canva: Recognition Over Configuration

**What they do:** When you open Canva, you don't see a blank canvas. You see "What do you want to design?" with visual tiles: Instagram Post, Presentation, Flyer, Resume. Each tile shows a preview of the finished product.

**What to steal:** HiveLab should open with "What does your group need?" with visual tiles showing the finished deployed result: a poll in a sidebar, an RSVP widget, a countdown timer. Not template names -- visual outcomes.

**Specific pattern:** Canva shows the OUTPUT first (the finished design), then lets you customize. HiveLab shows the TOOL first (the IDE), then makes you imagine the output. Flip it.

### From Notion: Blocks, Not Components

**What they do:** Notion's "blocks" are simple. Type `/` to see options. Each block has a clear icon and 3-word description. Complexity is hidden inside each block's settings.

**What to steal:** The element palette should feel like Notion's `/` menu, not like a component library. Show a flat list of things with simple icons: "Poll," "Sign-Up Form," "Countdown," "Text." No categories, no tiers, no "input elements" vs "action elements."

**Specific pattern:** Notion's inline editing. Click on any block to edit it directly. Don't open a properties panel. The content IS the interface.

### From Typeform: One Question at a Time

**What they do:** Typeform pioneered the "one thing at a time" form pattern. Instead of showing all fields, they show one question per screen with smooth transitions.

**What to steal:** Tool creation should be stepped, not monolithic. Step 1: What kind of thing? Step 2: Customize it. Step 3: Where should it go? Each step is one decision. Not a canvas with 15 panels.

**Specific pattern:** Typeform's "conversational" setup. Instead of a form, it feels like a conversation. "What's your poll question?" --> "What are the options?" --> "Who should see the results?" --> "Add to Photography Club?" Done.

### From ChatGPT: The Input Box IS the Interface

**What they do:** ChatGPT's entire UI is an input box. You type what you want. The complexity is behind the scenes.

**What to steal:** The AI prompt should be the primary creation path, but it should feel like asking a question, not issuing a command. "I need a way for members to vote on our next event theme" should produce a working poll with a "Share to [space]" button. No IDE. No canvas. Just the result.

**Specific pattern:** ChatGPT streams the result. HiveLab should stream the tool being built -- element by element appearing as the AI generates them. Not a blank canvas that suddenly fills.

---

## 8. Top 5 Friction Points and Fixes

### #1. The Layer 2 Gap (Severity: Critical)

**Problem:** Students go from "pick a template" to "full IDE" with no middle ground. 90% of students need to change one thing (the poll question) and are dumped into a visual IDE with canvas, element palette, properties panel, and connection wires.

**Fix:** Build an inline editor that shows the tool as it will appear to users, with click-to-edit on each piece. No canvas. No panels. No IDE chrome. Just the tool itself, editable. The full IDE is available via "Advanced editing" toggle.

### #2. "Lab" Framing Excludes Non-Builders (Severity: Critical)

**Problem:** The word "Lab" and the header "Welcome to your Lab" position this as a destination for builders. 90% of students are not builders. They are club members who need a poll.

**Fix:** Rename to "Tools" in navigation. Reframe the landing from "Welcome to your Lab" to "What does your group need?" with visual outcome tiles. Embed tool creation inside spaces (sidebar "Add a poll" button) so students never need to find /lab.

### #3. "Deploy" Language Is Alienating (Severity: High)

**Problem:** "Deploy" is military/DevOps vocabulary. Students share things, they don't deploy them. The deploy flow requires understanding targets, surfaces, and permissions.

**Fix:** Rename to "Share" or "Add to." The flow should be: "Add this to [space name]" --> done. Surface and permissions should have smart defaults (sidebar placement, all members can use).

### #4. No Visual Previews of Outcomes (Severity: High)

**Problem:** Templates are shown as text labels with icons: "Quick Poll," "Event RSVP," "Study Group Signup." Students can't see what they'll get. This requires imagination, which is recall (cognitively expensive), not recognition (cognitively cheap).

**Fix:** Every template should show a visual preview of the deployed result. Not a screenshot of the IDE -- a screenshot of the poll widget as it appears in a space sidebar. Students should recognize the output, not try to recall what a "Quick Poll" might look like.

### #5. AI Prompt Has No Guardrails or Examples (Severity: Medium)

**Problem:** The AI prompt placeholder says "Name your tool to get started..." which implies the student needs to name something before it exists. It gives no examples, no constraints, no indication of what's possible. This is a blank-canvas problem -- infinite possibility creates paralysis.

**Fix:** Replace with rich placeholder: "Try: 'poll for meeting times' or 'RSVP for game night' or 'countdown to Spring Formal'". Add suggestion chips below the prompt for common needs. Show what the AI will produce: "I'll build it, you customize it."

---

## 9. Information Architecture Recommendations

### Current IA

```
/lab                          -- Dashboard (your tools + templates + AI prompt)
/lab/templates                -- All templates
/lab/create                   -- Create flow
/lab/new                      -- New tool
/lab/setups                   -- Setup bundles
/lab/setups/[setupId]         -- Setup detail
/lab/setups/[setupId]/builder -- Setup builder
/lab/[toolId]                 -- Tool Studio (IDE)
/lab/[toolId]/edit            -- Edit mode
/lab/[toolId]/preview         -- Preview mode
/lab/[toolId]/deploy          -- Deploy page
/lab/[toolId]/run             -- Run page
/lab/[toolId]/runs            -- Run history
/lab/[toolId]/analytics       -- Analytics
/lab/[toolId]/settings        -- Settings
```

**Problem:** 15 routes for a feature that 90% of students should experience as "add a poll to my club." The IA is designed for a standalone product, not an integrated capability.

### Recommended IA

```
/tools                        -- Your tools (returning users) + "What do you need?" (new users)
/tools/gallery                -- Browse all templates with visual previews
/tools/[toolId]               -- View/use your tool + inline editing (Layer 2)
/tools/[toolId]/studio        -- Full IDE (Layer 3, opt-in)
/tools/[toolId]/analytics     -- Analytics (power users)

# Embedded entry points (no new routes needed):
Space sidebar: "Add a poll" --> inline creation
Event creation: "Add countdown" --> inline creation
Space settings: "Manage tools" --> list of deployed tools
```

**Key changes:**
- 15 routes collapsed to 5
- "studio" (IDE) is an opt-in destination, not the default
- Deploy is not a page -- it is an action ("Add to [space]") triggered from any tool view
- Setups, runs, run history are hidden until power users need them

---

## 10. Element Categorization Audit

### Current Categories (Developer-Oriented)

```
Input Elements (4): Search Input, Date Picker, User Selector, Form Builder
Filter Elements (1): Filter Selector
Display Elements (3): Result List, Chart Display, Progress Indicator
Action Elements (6): Poll, RSVP Button, Countdown Timer, Leaderboard, Counter, Timer
Layout Elements (1): Role Gate
Connected Elements (3): Event Picker, Space Picker, Connection List
Space Elements (7): Member List, Member Selector, Space Events, Space Feed, Space Stats, Announcement, Availability Heatmap
Additional Universal (3): Tag Cloud, Map View, Notification Center
```

**Problem:** These categories (input, filter, display, action, layout) are developer taxonomy. A student looking for "something to collect RSVPs" would not think to look under "Action Elements."

### Recommended Categories (Need-Oriented)

```
Collect Responses: Poll, RSVP, Form, Sign-Up Sheet
Show Info: Countdown, Progress Bar, Stats, Announcements
Display Data: Charts, Lists, Leaderboard
Find Things: Search, Filters, Date Picker, Event Picker
Team Tools: Member List, Member Selector, Availability
Advanced: Role Gate, Connections, Map, Notifications
```

Each category answers a student question:
- "I want to collect something" --> Collect Responses
- "I want to show something" --> Show Info
- "I want to display data" --> Display Data
- "I want to help people find things" --> Find Things
- "I want to manage my team" --> Team Tools
- "I need something specific" --> Advanced

---

## 11. Cognitive Load Scorecard

Scoring each current UX area on cognitive fluency (1 = instant comprehension, 5 = requires tutorial).

| Area | Current Score | Target Score | Primary Issue |
|---|---|---|---|
| Finding HiveLab | 4 | 1 | "Lab" in nav means nothing to most students |
| Understanding what it does | 3 | 1 | "Build tools" is generic. Show outcomes. |
| Picking a template | 2 | 1 | Templates are text-only. Need visual previews. |
| AI prompt creation | 3 | 2 | No examples, placeholder misleads ("name" vs "describe") |
| IDE first impression | 5 | 3 | Full IDE with no onboarding = overwhelming |
| Adding an element | 4 | 2 | Element palette uses developer categories |
| Configuring an element | 3 | 2 | Property panels are clear but verbose |
| Deploying a tool | 4 | 1 | "Deploy" language + target selection + surface + permissions |
| Understanding automations | 5 | 3 | Triggers, conditions, actions, rate limits -- pure dev concepts |
| Understanding connections | 5 | N/A | Should be invisible to 98% of students |
| Returning to a tool | 2 | 1 | Dashboard works well for returning users |
| Understanding setups | 4 | 2 | "Orchestrated tool bundles" -- what? |

**Overall fluency score: 3.6 / 5 (needs significant work)**
**Target fluency score: 1.7 / 5**

---

## 12. Quick Wins (Ship This Week)

Changes that improve fluency without architectural overhaul:

1. **Rename "Deploy" button to "Share"** across all surfaces. One find-and-replace.
2. **Change `/lab` nav item to "Tools"**. One line.
3. **Change "Welcome to your Lab" to "What does your group need?"** Copy change.
4. **Change AI placeholder from "Name your tool to get started..." to "Try: 'poll for meeting times' or 'event countdown'"**. Copy change.
5. **Add "Add Poll" / "Add RSVP" / "Add Countdown" buttons to space sidebar**. These create from template and skip the IDE entirely, going straight to deployed state.
6. **Rename "Elements" to "Blocks" in IDE**. One find-and-replace.
7. **Change template chips from text to show a 1-line preview** of what the template produces: "Quick Poll" --> "Quick Poll: Ask your members anything"

---

## Research Sources

- [Recognition vs Recall in User Interfaces - NN/g](https://www.nngroup.com/videos/recognition-vs-recall/)
- [Processing Fluency and Culturally Sensitive Interfaces](https://scholarship.claremont.edu/scripps_theses/2465/)
- [Recognition Over Recall - Research Collective](https://research-collective.com/recognition-over-recall/)
- [Progressive Disclosure - IxDF](https://www.interaction-design.org/literature/topics/progressive-disclosure)
- [Progressive Disclosure - NN/g](https://www.nngroup.com/articles/progressive-disclosure/)
- [Canva's Mastery of Unconscious UX Influences](https://www.theunconsciousconsumer.com/user-experience/2023/6/10/canvas-mastery-of-unconscious-ux-influences)
- [Cognitive Load UX 2025: Simpler Interfaces](https://redliodesigns.com/blog/cognitive-load-ux-2025-simpler-interfaces)
- [4 Principles to Reduce Cognitive Load in Forms - NN/g](https://www.nngroup.com/articles/4-principles-reduce-cognitive-load/)
- [State of UX 2026 - NN/g](https://www.nngroup.com/articles/state-of-ux-2026/)
- [Progressive Disclosure in SaaS UX Design](https://lollypop.design/blog/2025/may/progressive-disclosure/)
