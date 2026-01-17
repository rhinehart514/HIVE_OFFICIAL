# HIVE Information Architecture

## The Structure of Navigation and Space

*Last updated: January 2026*

---

## What This Document Is

Information Architecture (IA) defines how content is organized and how users navigate HIVE. If INSTANCES defines what each page IS, IA defines how pages CONNECT.

This document covers:
- **Navigation Hierarchy**: How features relate to each other
- **URL Structure**: The address scheme
- **Visual Architecture**: What's persistent vs. contextual
- **Shell Behavior**: How the frame adapts

---

## The IA Model: Space-Centric + Tool-Centric Hybrid

After exploring multiple models (Feed-Centric, Hub-Centric, Context-Switching), HIVE uses a hybrid approach:

```
Primary Mental Model: "Your spaces are home. Tools are your superpowers."
```

### Why This Model

| User Type | Primary Need | This Model Serves |
|-----------|-------------|-------------------|
| **Casual Member** | Find and participate in communities | Spaces as clear destinations |
| **Active Member** | Engage deeply with their communities | Spaces as living places |
| **Student Leader** | Build and manage communities | Spaces + tools together |
| **Builder** | Create tools for communities | Lab as parallel track |

### The Hierarchy

```
HIVE
├── FEED (/feed)
│   └── Activity stream from your spaces
│
├── SPACES (/spaces)
│   ├── Browse (/spaces/browse)
│   ├── Search (/spaces/search)
│   ├── Create (/spaces/create)
│   ├── Claim (/spaces/claim)
│   └── [Space] (/spaces/[id])
│       ├── Chat (default)
│       ├── Events (/spaces/[id]/events)
│       ├── Calendar (/spaces/[id]/calendar)
│       ├── Members (/spaces/[id]/members)
│       ├── Resources (/spaces/[id]/resources)
│       └── Settings (/spaces/[id]/settings)
│
├── LAB (/lab)
│   ├── My Tools (/lab)
│   ├── Create (/lab/new)
│   ├── Templates (/lab/templates)
│   └── [Tool] (/lab/[id])
│       ├── Edit (/lab/[id]/edit)
│       ├── Preview (/lab/[id]/preview)
│       └── Deploy (/lab/[id]/deploy)
│
├── PROFILE (/profile)
│   ├── My Profile (/profile/me)
│   ├── [User] (/profile/[id])
│   └── Edit (/profile/edit)
│
├── SETTINGS (/settings)
│   ├── Account
│   ├── Privacy
│   ├── Notifications
│   └── Appearance
│
└── PORTAL (/)
    ├── Landing (/)
    ├── Login (/auth/login)
    ├── Verify (/auth/verify)
    └── Onboarding (/onboarding)
```

---

## Navigation Hierarchy

### Level 0: Global Navigation

Always present in the Shell. The persistent frame.

| Item | Route | Icon | Position |
|------|-------|------|----------|
| Feed | `/feed` | Activity | Rail top |
| Spaces | `/spaces/browse` | Grid | Rail |
| Lab | `/lab` | Flask | Rail |
| Profile | `/profile/me` | Avatar | Rail bottom |
| Settings | `/settings` | Gear | Profile dropdown |

### Level 1: Section Navigation

Within each major section.

**Spaces Section:**
```
/spaces
├── /browse      (Discovery grid)
├── /search      (Search results)
├── /create      (Creation wizard)
├── /claim       (Claim existing org)
└── /[id]        (Individual space)
```

**Lab Section:**
```
/lab
├── /           (My tools grid)
├── /new        (Create new)
├── /templates  (Browse templates)
└── /[id]       (Individual tool)
```

### Level 2: Context Navigation

Within an individual space or tool.

**Space Context:**
| Tab | Route | Default? |
|-----|-------|----------|
| Chat | `/spaces/[id]` | Yes |
| Events | `/spaces/[id]/events` | No |
| Calendar | `/spaces/[id]/calendar` | No |
| Members | `/spaces/[id]/members` | No |
| Resources | `/spaces/[id]/resources` | No |
| Settings | `/spaces/[id]/settings` | No (leaders only) |

**Tool Context:**
| Tab | Route | Default? |
|-----|-------|----------|
| Edit | `/lab/[id]/edit` | Yes |
| Preview | `/lab/[id]/preview` | No |
| Deploy | `/lab/[id]/deploy` | No |
| Settings | `/lab/[id]/settings` | No |

---

## URL Design Principles

### 1. URLs Are Addresses

URLs should read like addresses, not routes:
- `/spaces/chess-club` — "I'm at the Chess Club"
- `/lab/poll-creator` — "I'm in my Poll Creator tool"
- `/profile/alex` — "I'm visiting Alex's profile"

### 2. Hierarchy in URL

The URL reflects navigation hierarchy:
```
/spaces/[id]/events/[eventId]
   │       │     │      │
   │       │     │      └── Specific event
   │       │     └── Events section
   │       └── This space
   └── Spaces area
```

### 3. Slug Over ID

Where possible, use human-readable slugs:
- `/spaces/chess-club` > `/spaces/abc123`
- `/profile/alex` > `/profile/usr_xyz`
- `/lab/poll-maker` > `/lab/tool_789`

### 4. Consistent Patterns

| Pattern | Example | Notes |
|---------|---------|-------|
| List | `/spaces/browse` | Plural noun + verb |
| Detail | `/spaces/[id]` | Singular noun + ID |
| Action | `/spaces/create` | Singular noun + verb |
| Nested | `/spaces/[id]/events` | Parent + child |

---

## Visual Architecture

### What's Persistent (Shell)

The Shell provides the persistent navigation frame:

```
┌─────────────────────────────────────────────────────────┐
│ [Logo]  [Search (⌘K)]            [Create ▾]  [🔔] [👤]  │ ← Header (always)
├─────┬───────────────────────────────────────────────────┤
│     │                                                   │
│ R   │                                                   │
│ a   │              CONTENT AREA                         │
│ i   │                                                   │
│ l   │         (Template renders here)                   │
│     │                                                   │
│     │                                                   │
├─────┴───────────────────────────────────────────────────┤
│              [Mobile Nav - bottom on mobile]            │ ← Mobile only
└─────────────────────────────────────────────────────────┘
```

### Shell Modes

| Mode | Rail | Header | When |
|------|------|--------|------|
| **Full** | Visible, expanded | Full | Desktop home, browse |
| **Rail** | Visible, collapsed (icons only) | Full | Most pages |
| **Minimal** | Hidden | Minimal | Tool editor, focus tasks |
| **None** | Hidden | Hidden | Landing, auth, onboarding |

### Shell × Instance Matrix

| Instance Category | Shell Mode | Rail Shows |
|-------------------|------------|------------|
| Portal | None | — |
| Home | Full/Rail | All nav + spaces list |
| Discovery | Rail | Nav icons |
| Creation | Minimal | Nothing (or escape) |
| Identity | Rail | Nav icons |

---

## Navigation Flows

### Primary User Journeys

**1. New User → First Space**
```
/                    (Landing - Portal)
    ↓ [Enter HIVE]
/auth/login          (Login - Portal)
    ↓ [Verify]
/auth/verify         (Verify - Portal)
    ↓ [Continue]
/onboarding          (Onboarding - Portal)
    ↓ [Complete]
/feed                (Feed - Home)
    ↓ [Click space]
/spaces/[first-space] (First space - Home)
```

**2. Member → Participate**
```
/feed                (Activity stream - Home)
    ↓ [Click space]
/spaces/[id]         (Space chat - Home)
    ↓ [View event]
/spaces/[id]/events  (Events tab - Home)
    ↓ [RSVP]
Modal overlay        (RSVP confirmation)
```

**3. Builder → Create Tool**
```
/lab                 (My tools - Discovery)
    ↓ [Create new]
/lab/new             (Tool creator - Creation)
    ↓ [Build]
/lab/[id]/edit       (Tool editor - Creation)
    ↓ [Preview]
/lab/[id]/preview    (Preview - Creation)
    ↓ [Deploy]
/lab/[id]/deploy     (Deploy wizard - Creation)
    ↓ [Select space]
/spaces/[id]         (Space with tool - Home)
```

**4. Leader → Manage Space**
```
/spaces/[id]         (Space view - Home)
    ↓ [Settings]
/spaces/[id]/settings (Space settings - Home)
    ↓ [Members tab]
/spaces/[id]/members  (Member management - Home)
```

---

## Command Palette (⌘K)

The command palette provides keyboard-first navigation across the entire IA:

### Command Categories

| Category | Examples |
|----------|----------|
| **Go to** | "Go to Chess Club", "Go to My Profile" |
| **Create** | "Create new tool", "Create space" |
| **Search** | "Search spaces", "Search members" |
| **Actions** | "Join space", "Deploy tool", "Invite member" |

### Context Awareness

The palette adapts based on current location:

| Context | Additional Commands |
|---------|-------------------|
| In a space | "Go to events", "Invite to this space", "Pin message" |
| In tool editor | "Preview tool", "Deploy tool", "Add element" |
| On profile | "Follow user", "Message user" |

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Width | Shell Behavior |
|------------|-------|----------------|
| Mobile | < 768px | Bottom nav, no rail |
| Tablet | 768px - 1024px | Rail collapsed |
| Desktop | > 1024px | Rail expanded (can collapse) |

### Mobile Navigation

```
┌─────────────────────────────────────────────────────────┐
│ [← Back]  [Title]                      [Actions]        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                    CONTENT AREA                         │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│  [Feed]  [Spaces]  [+]  [Lab]  [Profile]               │
└─────────────────────────────────────────────────────────┘
```

### Mobile Patterns

| Pattern | Implementation |
|---------|---------------|
| Space sidebar | Bottom sheet |
| Thread drawer | Full-screen slide |
| Tool properties | Bottom sheet |
| Settings | Full-screen |
| Modals | Full-screen |

---

## Transition Patterns

How users move between sections:

### Same-Level Transitions

Moving between siblings (e.g., space to space):
- **Effect**: Cross-fade content
- **Duration**: 200ms
- **Shell**: Stays, active state updates

### Drill-Down Transitions

Going deeper (e.g., browse to space):
- **Effect**: Expand from card origin
- **Duration**: 300ms
- **Shell**: Rail collapses (if going to detail)

### Drill-Up Transitions

Going back (e.g., space to browse):
- **Effect**: Collapse to card
- **Duration**: 200ms
- **Shell**: Rail expands

### Context Switches

Major section change (e.g., Spaces to Lab):
- **Effect**: Fade through black
- **Duration**: 300ms
- **Shell**: Updates simultaneously

---

## Deep Linking

All states should be addressable:

### Supported Deep Links

| State | URL | Example |
|-------|-----|---------|
| Space chat | `/spaces/[id]` | `/spaces/chess-club` |
| Specific message | `/spaces/[id]?msg=[msgId]` | `/spaces/chess-club?msg=abc` |
| Thread open | `/spaces/[id]?thread=[msgId]` | `/spaces/chess-club?thread=abc` |
| Space tab | `/spaces/[id]/[tab]` | `/spaces/chess-club/events` |
| Tool edit | `/lab/[id]/edit` | `/lab/poll-maker/edit` |
| Profile tab | `/profile/[id]?tab=[tab]` | `/profile/alex?tab=tools` |

### Sharing Behavior

When sharing a link:
1. Authenticated users → Direct to content
2. Unauthenticated users → Gate → Login → Redirect to content

---

## Error States

### 404 - Not Found

| Context | Message | Action |
|---------|---------|--------|
| Space doesn't exist | "This space doesn't exist" | Browse spaces |
| Tool doesn't exist | "This tool doesn't exist" | Go to Lab |
| User doesn't exist | "User not found" | Go home |

### 403 - Forbidden

| Context | Message | Action |
|---------|---------|--------|
| Private space | "This space is private" | Request access |
| Leader-only page | "You need to be a leader" | Go back |
| Not your tool | "This isn't your tool" | Go to Lab |

### Redirect Patterns

| Condition | Redirect To |
|-----------|-------------|
| Logged out + protected route | `/auth/login?redirect=[path]` |
| Onboarding incomplete | `/onboarding` |
| Space deleted | `/spaces/browse` |
| Tool deleted | `/lab` |

---

## Implementation Notes

### Route Groups (Next.js)

```
app/
├── (portal)/           # No shell
│   ├── page.tsx        # Landing
│   ├── auth/
│   └── onboarding/
├── (app)/              # With shell
│   ├── feed/
│   ├── spaces/
│   ├── lab/
│   ├── profile/
│   └── settings/
└── layout.tsx          # Root layout
```

### Shell Provider

```tsx
// Conceptual
<ShellProvider mode={determineMode(pathname)}>
  <Shell>
    <Content>{children}</Content>
  </Shell>
</ShellProvider>
```

### Navigation State

Track navigation state for:
- Scroll position per route
- Sidebar collapsed state
- Recently visited spaces
- Command palette history

---

## Summary

### The Model

**Space-Centric + Tool-Centric Hybrid**
- Spaces are primary destinations (where you live)
- Lab is parallel track (where you build)
- Profile is reflection (who you are)
- Everything connects through the Shell

### Key Principles

1. **URLs are addresses** — Human-readable, hierarchical
2. **Shell is home** — Persistent frame, adapts per context
3. **Keyboard-first** — Command palette reaches everything
4. **Deep-linkable** — Every state has a URL
5. **Mobile-native** — Bottom nav, full-screen patterns

---

## Related Documents

- `INSTANCES.md` — What each page IS
- `TEMPLATES.md` — Page structural patterns
- `PATTERNS.md` — User experience flows

---

*IA defines how HIVE connects. Templates define structure. Instances define content. Together they create navigable space.*
