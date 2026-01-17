# HIVE COMPONENTS

## Level 6: Primitive Compositions

*Last updated: January 2026*

---

## WHAT THIS DOCUMENT IS

Components are compositions of primitives that serve specific purposes. They are the reusable building blocks that combine to form patterns and pages. Each component has a defined role, consistent behavior, and documents its primitive dependencies.

```
WORLDVIEW (what we believe)        ← WORLDVIEW.md
    ↓
PHILOSOPHY (how it feels)          ← PHILOSOPHY.md
    ↓
PRINCIPLES (rules that guide)      ← PRINCIPLES.md
    ↓
LANGUAGE (visual vocabulary)       ← LANGUAGE.md
    ↓
SYSTEMS (behavioral rules)         ← SYSTEMS.md
    ↓
PRIMITIVES (atomic elements)       ← PRIMITIVES.md
    ↓
COMPONENTS (compositions)          ← THIS DOCUMENT
    ↓
PATTERNS → TEMPLATES → INSTANCES
```

> **CRITICAL: LOCKED HOVER RULE (Jan 2026)**
>
> Some examples in this document show `translateY`, `lift`, or `scale` on hover. **These are OUTDATED.**
>
> **The locked rule is:**
> - Cards: `hover:brightness-110` (no lift, no scale)
> - Buttons: `hover:opacity-90`, `active:opacity-80` (no scale)
> - All interactive elements: opacity/brightness only, NEVER transforms
>
> The actual primitives in `packages/ui/src/design-system/primitives/` implement the correct behavior.

---

## COMPONENT PRINCIPLES

### 1. Single Responsibility

Each component does one thing well. If a component has "and" in its description, split it.

### 2. Primitive Composition

Components are built from primitives. They don't introduce new design decisions — they compose existing ones.

### 3. Atmosphere Aware

Components inherit atmosphere from AtmosphereProvider and adjust their primitive usage accordingly.

### 4. Gold Discipline

Components maintain the gold budget inherited from primitives. A component with multiple gold-using primitives must ensure total gold stays within budget.

### 5. Accessibility First

Every component meets WCAG 2.1 AA. Keyboard navigation, screen reader support, focus management.

---

## COMPONENT CATALOG

### Navigation Components

Components that help users move through the application.

---

#### MinimalSidebar

The primary navigation structure. Persistent across all authenticated views.

**Primitives Used:**
- Avatar (rounded square)
- Icon (Heroicons)
- PresenceDot (for online status)
- Badge (for notification counts)
- Tooltip

**Structure:**
```
┌─────────────────┐
│  [Logo/Home]    │
├─────────────────┤
│  [Avatar]       │  ← Current user, presence dot
│  [Username]     │
├─────────────────┤
│  [Nav Item]     │  ← Icon + optional badge
│  [Nav Item]     │
│  [Nav Item]     │
│  [Nav Item]     │
├─────────────────┤
│  [Spaces ▾]     │  ← Dropdown of user's spaces
│    [Space 1]    │
│    [Space 2]    │
│    [+ Create]   │
├─────────────────┤
│  [Settings]     │
│  [Help]         │
└─────────────────┘
```

**API:**
```tsx
interface MinimalSidebarProps {
  user: {
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'away' | 'offline';
  };
  spaces: Array<{
    id: string;
    name: string;
    avatar?: string;
    unreadCount?: number;
  }>;
  currentSpaceId?: string;
  notifications?: number;
}

<MinimalSidebar
  user={currentUser}
  spaces={userSpaces}
  currentSpaceId={activeSpace}
  notifications={3}
/>
```

**Behavior:**
- Collapsed by default on mobile (hamburger toggle)
- Expanded on desktop (240px width)
- Active nav item has subtle background
- Spaces dropdown shows user's joined spaces
- Notification badge uses gold for unread
- Presence dot shows user's own status

**Gold Usage:**
- PresenceDot (when online)
- Badge with unread count (gold variant)

---

#### TopBar

Secondary navigation and contextual actions. Changes based on current page.

**Primitives Used:**
- Heading
- Breadcrumb (optional)
- Button
- Icon
- SearchInput (optional)

**Structure:**
```
┌────────────────────────────────────────────────────┐
│  [Breadcrumb / Page Title]     [Actions] [Search] │
└────────────────────────────────────────────────────┘
```

**API:**
```tsx
interface TopBarProps {
  title?: string;
  breadcrumbs?: Array<{ label: string; href: string }>;
  actions?: React.ReactNode;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
}

<TopBar
  breadcrumbs={[
    { label: 'Spaces', href: '/spaces' },
    { label: 'CS Club', href: '/spaces/cs-club' },
  ]}
  actions={<Button variant="cta">New Post</Button>}
  showSearch
/>
```

**Behavior:**
- Sticky at top of content area
- Blur backdrop on scroll (landing atmosphere)
- Breadcrumbs collapse on mobile to show current only
- Search expands on focus

**Gold Usage:**
- CTA buttons in actions slot only

---

#### Breadcrumb

Path navigation showing current location in hierarchy.

**Primitives Used:**
- Link
- Text
- Icon (chevron separator)

**API:**
```tsx
interface BreadcrumbProps {
  items: Array<{
    label: string;
    href?: string; // Last item has no href
  }>;
  maxItems?: number; // Collapse middle items if exceeded
}

<Breadcrumb
  items={[
    { label: 'Home', href: '/' },
    { label: 'Spaces', href: '/spaces' },
    { label: 'CS Club', href: '/spaces/cs-club' },
    { label: 'Settings' },
  ]}
  maxItems={3}
/>
// Renders: Home / ... / CS Club / Settings
```

**Gold Usage:**
None.

---

#### CommandPalette

Global search and command interface. Triggered by Cmd+K.

**Primitives Used:**
- Modal (fullscreen variant, no backdrop)
- Input
- Icon
- Text
- Separator
- Badge

**Structure:**
```
┌─────────────────────────────────────────┐
│  🔍 [Search or type a command...]       │
├─────────────────────────────────────────┤
│  RECENT                                 │
│  [Icon] CS Club                [Space]  │
│  [Icon] Profile Settings        [Page]  │
├─────────────────────────────────────────┤
│  COMMANDS                               │
│  [Icon] Create new space       [⌘ N]    │
│  [Icon] Create new tool        [⌘ T]    │
│  [Icon] Toggle theme           [⌘ D]    │
└─────────────────────────────────────────┘
```

**API:**
```tsx
interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  recentItems?: Array<CommandItem>;
  commands?: Array<CommandItem>;
  onSelect: (item: CommandItem) => void;
}

interface CommandItem {
  id: string;
  icon: string;
  label: string;
  type: 'page' | 'space' | 'tool' | 'command' | 'user';
  shortcut?: string;
  action?: () => void;
}
```

**Behavior:**
- Opens with Cmd+K (Mac) / Ctrl+K (Windows)
- Fuzzy search across all items
- Arrow keys navigate, Enter selects
- Escape closes
- Results grouped by type
- Recent items shown by default

**Gold Usage:**
None. Functional interface.

---

### Card Components

Entity representation cards used throughout the application.

---

#### SpaceCard

Displays a space in browse/discovery contexts.

**Primitives Used:**
- Card (atmosphere-aware)
- Avatar (rounded square, for space avatar)
- Heading
- Text
- Badge
- AvatarGroup
- PresenceDot
- ActivityEdge

**Structure:**
```
┌─────────────────────────────────────┐
│  [Space Avatar]                     │
│                                     │
│  Space Name                [Badge]  │
│  Short description text...          │
│                                     │
│  [👤👤👤+12]  [●] 23 online         │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    category?: string;
    memberCount: number;
    onlineCount: number;
    members: Array<{ id: string; avatar?: string }>;
  };
  warmth?: 'none' | 'low' | 'high'; // Activity level
  onClick?: () => void;
}

<SpaceCard
  space={spaceData}
  warmth="low"
  onClick={() => navigate(`/spaces/${space.id}`)}
/>
```

**Behavior:**
- Hover: subtle lift, card warmth increases
- Click: navigates to space
- Online count updates live
- Warmth reflects recent activity

**Gold Usage:**
- ActivityEdge (based on warmth prop)
- PresenceDot in online indicator
- Badge if featured/promoted

---

#### ToolCard

Displays a HiveLab tool in galleries/discovery.

**Primitives Used:**
- Card
- Avatar (for creator)
- Heading
- Text
- Badge
- Icon
- LiveCounter

**Structure:**
```
┌─────────────────────────────────────┐
│  [Tool Preview/Screenshot]          │
│                                     │
├─────────────────────────────────────┤
│  Tool Name                          │
│  Brief description...               │
│                                     │
│  [👤 Creator]    [▶] 847 runs       │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    description?: string;
    preview?: string; // Screenshot URL
    creator: { id: string; name: string; avatar?: string };
    runCount: number;
    category?: string;
  };
  onClick?: () => void;
}
```

**Gold Usage:**
- LiveCounter for run count
- Badge if featured

---

#### ProfileCard

Compact user profile representation.

**Primitives Used:**
- Card
- Avatar (rounded square)
- Heading
- Text
- PresenceDot
- Badge
- Button

**Structure:**
```
┌─────────────────────────────────────┐
│  [Avatar ●]  Name                   │
│              @handle                │
│              [Badge] [Badge]        │
│                                     │
│  Brief bio text...                  │
│                                     │
│  [Connect]  [Message]               │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface ProfileCardProps {
  user: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'away' | 'offline';
    badges?: string[];
  };
  variant?: 'default' | 'compact' | 'expanded';
  showActions?: boolean;
  onConnect?: () => void;
  onMessage?: () => void;
}
```

**Gold Usage:**
- PresenceDot when online
- Achievement badges (gold variant)

---

#### EventCard

Displays an event in calendars, feeds, and event panels. Core display unit for Event Flow Pattern.

**Pattern Reference:** Pattern 7: Event Flow (Stages 1, 6)

**Primitives Used:**
- Card (atmosphere-aware)
- Heading
- Text
- Icon
- Badge
- AvatarGroup
- Button
- LiveEventBadge (when live)

**Structure:**
```
┌─────────────────────────────────────┐
│  [📅] Jan 15 • 7:00 PM    [LIVE] ← │ (gold badge if happening now)
│                                     │
│  Event Title                        │
│  📍 Location or 💻 Virtual          │
│                                     │
│  [👤👤👤👤+12] 16 going            │
│                                     │
│  [     RSVP      ▾]                │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface EventCardProps {
  event: {
    id: string;
    title: string;
    type: 'meeting' | 'social' | 'virtual';
    startDate: Date;
    endDate?: Date;
    location?: string;
    virtualLink?: string;
    currentAttendees: number;
    maxAttendees?: number;
    attendees: Array<{ id: string; avatar?: string; name?: string }>;
    userRSVP?: 'going' | 'maybe' | 'not_going' | null;
    organizerId?: string;
    organizerName?: string;
  };
  variant?: 'default' | 'compact' | 'expanded';
  showRSVP?: boolean;
  onRSVP?: (status: 'going' | 'maybe' | 'not_going') => void;
  onClick?: () => void;
}
```

**Design Decision: Card Variant**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Default** | Full card with all info | Google Calendar events | ✅ **CHOSEN** - Balanced info density |
| Compact | Title + time only | Todoist | Use in rail widgets |
| Expanded | With description preview | Eventbrite | Use in event lists |

**States:**

| State | Visual Treatment | Badge |
|-------|------------------|-------|
| **Upcoming** | Normal | Time badge |
| **Today** | Subtle emphasis | "Today" (gold dot) |
| **Happening Now** | Gold pulse animation | "LIVE" gold badge |
| **Starting Soon** | Countdown visible | "In 30 min" |
| **Past** | 50% opacity | Date badge |
| **Cancelled** | Strikethrough title | "Cancelled" |
| **Full** | Normal | "Full" |

**Gold Usage:**
- LiveEventBadge when event is happening NOW (gold pulse)
- "Today" dot indicator (gold)
- Host avatar ring in expanded view (subtle gold)

**NOT Gold:**
- RSVP button (white/primary)
- Past events
- Time badges

**Animation:**
- Entry: Fade in + slide up (300ms ease-out)
- Live pulse: Gold glow (2000ms infinite sine)
- Hover: Card lift (200ms ease-out)

---

#### PostCard

Feed post representation.

**Primitives Used:**
- Card
- Avatar
- Heading
- Text
- MediaViewer (if has media)
- Icon
- Button
- Badge

**Structure:**
```
┌─────────────────────────────────────┐
│  [Avatar] Name • 2h ago     [•••]   │
│                                     │
│  Post content text here...          │
│                                     │
│  [Media attachment if any]          │
│                                     │
│  [♡ 12]  [💬 3]  [↗ Share]         │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface PostCardProps {
  post: {
    id: string;
    author: { id: string; name: string; avatar?: string };
    content: string;
    media?: Array<{ type: 'image' | 'video'; url: string }>;
    createdAt: Date;
    likeCount: number;
    commentCount: number;
    isLiked?: boolean;
  };
  onLike?: () => void;
  onComment?: () => void;
  onShare?: () => void;
}
```

**Gold Usage:**
- Like icon when isLiked (subtle gold tint)

---

### Form Components

Enhanced input components for specific use cases.

---

#### SearchInput

Specialized input for search functionality.

**Primitives Used:**
- Input
- Icon
- Button (clear)
- Skeleton (for loading results)

**API:**
```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onClear?: () => void;
  onSubmit?: () => void;
}

<SearchInput
  value={query}
  onChange={setQuery}
  placeholder="Search spaces..."
  loading={isSearching}
/>
```

**Behavior:**
- Debounced onChange (300ms default)
- Clear button appears when value exists
- Loading state shows subtle spinner
- Enter key triggers onSubmit

**Gold Usage:**
None.

---

#### FormField

Input wrapper with label, validation, and error display.

**Primitives Used:**
- Label
- Input / Textarea / Select
- Text (for error message)
- Icon (for validation state)

**Structure:**
```
Label *
┌─────────────────────────────────────┐
│  Input value                        │
└─────────────────────────────────────┘
Helper text or error message
```

**API:**
```tsx
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: React.ReactNode; // Input primitive
}

<FormField label="Email" required error={errors.email}>
  <Input type="email" {...register('email')} />
</FormField>
```

**Gold Usage:**
None. Error state uses red.

---

#### ImageUploader

Image upload with preview and cropping.

**Primitives Used:**
- Button
- Card
- Icon
- Progress
- ImageCropper (subcomponent)

**API:**
```tsx
interface ImageUploaderProps {
  value?: string; // Current image URL
  onChange: (file: File | null) => void;
  aspectRatio?: number; // For cropping
  maxSize?: number; // MB
  accept?: string[];
}

<ImageUploader
  value={profile.avatar}
  onChange={handleAvatarChange}
  aspectRatio={1}
  maxSize={5}
/>
```

**Behavior:**
- Drag and drop supported
- Click to open file picker
- Preview before upload
- Optional crop before confirm
- Progress bar during upload

**Gold Usage:**
None.

---

#### DatePicker

Date selection with calendar popup.

**Primitives Used:**
- Input
- Modal (popover variant)
- Button
- Icon
- Text

**API:**
```tsx
interface DatePickerProps {
  value?: Date;
  onChange: (date: Date | null) => void;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
}

<DatePicker
  value={event.date}
  onChange={setEventDate}
  minDate={new Date()}
  placeholder="Select date"
/>
```

**Gold Usage:**
- Selected date highlight (gold background)

---

### Event Flow Components

Complete component specifications for Pattern 7: Event Flow. These components handle the full event lifecycle from awareness through echo.

**Pattern Reference:** Pattern 7: Event Flow

**Lifecycle Stages:**
1. Awareness (UpcomingEventsWidget, EventCalendar)
2. Interest (EventDetailsModal, AttendeeList)
3. Commitment (RSVPButton)
4. Anticipation (EventReminder)
5. Convergence (LiveEventBadge, EventAnnouncement)
6. Echo (EventCard in past state)
7. Creation (QuickEventInput, EventCreateModal)

---

#### RSVPButton

Multi-state RSVP interaction component. Optimizes for commitment with single-click primary action.

**Pattern Reference:** Pattern 7: Event Flow (Stage 3: Commitment)

**Primitives Used:**
- Button (primary, secondary, ghost variants)
- Icon (check, question, x)
- Spinner (for loading)
- DropdownMenu (for expanded options)

**Structure:**
```
Initial State:
┌──────────────────────────────┐
│  [      RSVP       ▾]        │  ← Ghost button, expands on click
└──────────────────────────────┘

Expanded State:
┌──────────────────────────────┐
│  [ ✓ Going ]                 │  ← Primary (larger, emphasized)
│  [   Maybe  ]                │  ← Secondary (outline)
│  [ Can't make it ]           │  ← Tertiary (ghost, subtle)
└──────────────────────────────┘

Committed State (Going):
┌──────────────────────────────┐
│  [✓ Going        ▾]          │  ← Solid, changeable via dropdown
└──────────────────────────────┘
```

**API:**
```tsx
interface RSVPButtonProps {
  status: 'going' | 'maybe' | 'not_going' | null;
  onRSVP: (status: 'going' | 'maybe' | 'not_going') => Promise<void>;
  disabled?: boolean;
  eventFull?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean; // Show "RSVP" label when null
}
```

**Design Decision: Interaction Model**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Single-click primary** | One click for "Going", expand for others | Apple (primary action prominent) | ✅ **CHOSEN** - Optimizes for commitment |
| Equal buttons | All options same size | Google Calendar | ❌ Decision paralysis |
| Dropdown only | Select from menu | Eventbrite | ❌ Extra click required |

**States:**

| State | Visual | Interaction |
|-------|--------|-------------|
| **null (not responded)** | Ghost button "RSVP ▾" | Click expands options |
| **going** | Solid primary "Going ✓" | Click shows dropdown to change |
| **maybe** | Outline secondary "Maybe" | Click shows dropdown to change |
| **not_going** | Ghost muted "Can't" | Click shows dropdown to change |
| **loading** | Current state + spinner | Disabled |
| **disabled** | Current state, 50% opacity | No interaction |
| **eventFull** | "Full" badge | Shows waitlist option |

**Gold Usage:**
- None. RSVP uses standard white/primary styling, not gold.

**Animation:**
- Expand: Height animation (200ms spring)
- Submit: Button pulse (150ms ease-in-out)
- State change: Fade transition (150ms)

---

#### EventDetailsModal

Full event information overlay. Primary component for the Interest stage.

**Pattern Reference:** Pattern 7: Event Flow (Stage 2: Interest)

**Primitives Used:**
- Modal (Dialog)
- Heading
- Text
- Avatar
- AvatarGroup
- Badge
- Button
- Icon
- Divider
- RSVPButton

**Structure:**
```
┌─────────────────────────────────────────────┐
│  ┌───┐                                      │
│  │📅│  Event Title                    [×]   │
│  └───┘  Jan 15, 2026 • 7:00 PM              │
│         📍 Student Union Room 304           │
├─────────────────────────────────────────────┤
│                                             │
│  Description text goes here. This can be    │
│  multiple lines of context about what       │
│  the event is and why people should come.   │
│                                             │
│  ─────────────────────────────────────────  │
│                                             │
│  👤 Hosted by @sarah_chen     [gold ring]   │
│                                             │
│  [👤👤👤👤+12] 16 going • 4 maybe           │
│  [View all attendees →]                     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [  Add to Calendar  ] [     RSVP ▾    ]   │
│                                             │
│  [💬 View Board] (if linkedBoardId exists)  │
│                                             │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface EventDetailsModalProps {
  event: SpaceEventDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRSVP: (eventId: string, status: RSVPStatus) => Promise<void>;
  onViewBoard?: (boardId: string) => void;
  onAddToCalendar?: (event: SpaceEventDetails) => void;
  currentUserId?: string;
  spaceId: string;
}

interface SpaceEventDetails {
  id: string;
  title: string;
  description?: string;
  type: 'meeting' | 'social' | 'virtual';
  startDate: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  currentAttendees: number;
  maxAttendees?: number;
  organizer?: {
    id: string;
    fullName: string;
    photoURL?: string;
  };
  userRSVP: RSVPStatus | null;
  linkedBoardId?: string;
}
```

**Design Decision: Information Hierarchy**

| Level | Content | Visibility |
|-------|---------|------------|
| **Primary** | Title, Date/Time, Location | Always visible (header) |
| **Secondary** | Description, Host, Attendee count | Body section |
| **Tertiary** | Full attendee list | Expandable "View all" |

**Design Decision: Action Placement**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Sticky footer** | Actions fixed at bottom | Apple modals | ✅ **CHOSEN** - Always accessible |
| Inline with content | Actions in body | Eventbrite | ❌ Gets lost in scroll |
| Header | Actions in header | Some apps | ❌ Cramped space |

**Gold Usage:**
- Host avatar ring (subtle gold) when viewing as organizer
- "LIVE" badge if event is happening now (gold pulse)

**Animation:**
- Open: Fade + scale (300ms ease-out)
- Close: Fade + scale down (200ms ease-in)

---

#### EventCreateModal

Full event creation form for leaders. Rich creation mode.

**Pattern Reference:** Pattern 7: Event Flow (Stage 7: Creation)

**Primitives Used:**
- Modal (Dialog)
- Form
- Input
- Textarea
- Select
- DatePicker
- TimePicker
- Switch
- Button
- Icon

**Structure:**
```
┌─────────────────────────────────────────────┐
│  Create Event                         [×]   │
├─────────────────────────────────────────────┤
│                                             │
│  Event Title *                              │
│  ┌─────────────────────────────────────┐   │
│  │ Weekly Chess Club Meeting           │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Type                                       │
│  [📅 Meeting ▾] [🎉 Social] [💻 Virtual]   │
│                                             │
│  Date & Time *                              │
│  ┌──────────────┐ ┌──────────────┐         │
│  │ Jan 15, 2026 │ │ 7:00 PM      │         │
│  └──────────────┘ └──────────────┘         │
│                                             │
│  End Time (optional)                        │
│  ┌──────────────┐                          │
│  │ 9:00 PM      │                          │
│  └──────────────┘                          │
│                                             │
│  Location / Virtual Link                    │
│  ┌─────────────────────────────────────┐   │
│  │ Student Union Room 304              │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Description                                │
│  ┌─────────────────────────────────────┐   │
│  │ Come play chess! All skill levels   │   │
│  │ welcome. Bring your own board or    │   │
│  │ use one of ours.                    │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  ─── Optional Settings ───                  │
│                                             │
│  Capacity Limit                             │
│  ┌─────────┐                               │
│  │ 20      │ attendees                     │
│  └─────────┘                               │
│                                             │
│  [ ] Link to Board  [Select Board ▾]       │
│  [✓] Announce to Space                     │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│  [Cancel]              [Create Event]       │
│                                             │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface EventCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (event: EventCreateInput) => Promise<void>;
  boards?: Array<{ id: string; name: string }>;
  defaultValues?: Partial<EventCreateInput>;
}

interface EventCreateInput {
  title: string;
  description?: string;
  type: 'meeting' | 'social' | 'virtual';
  startDate: string;
  endDate?: string;
  location?: string;
  virtualLink?: string;
  maxAttendees?: number;
  requiredRSVP?: boolean;
  announceToSpace?: boolean;
  linkedBoardId?: string;
}
```

**Design Decision: Form Layout**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Single column** | All fields stacked | Apple, Linear | ✅ **CHOSEN** - Clear, scannable |
| Two column | Side by side fields | Enterprise forms | ❌ Cramped in modal |
| Multi-step | Wizard style | Eventbrite | ❌ Over-engineered for simple events |

**Design Decision: Optional Fields**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Collapsed section** | Optional fields in expandable area | Linear | ✅ **CHOSEN** - Clean default, power when needed |
| Always visible | All fields shown | Google Calendar | ❌ Overwhelming |
| Progressive disclosure | Show based on selections | Some apps | ❌ Unpredictable |

**Gold Usage:**
- None. Event creation is neutral.

**Animation:**
- Modal open: Fade + scale (300ms ease-out)
- Modal close: Fade + scale down (200ms ease-in)
- Field focus: Subtle border transition (150ms)

---

#### QuickEventInput

Inline natural language event creation. Quick creation mode.

**Pattern Reference:** Pattern 7: Event Flow (Stage 7: Creation)

**Primitives Used:**
- Input
- Icon
- Text (parsed preview)
- Button

**Structure:**
```
Default:
┌─────────────────────────────────────────────┐
│  [+] Quick event...                         │
└─────────────────────────────────────────────┘

Active:
┌─────────────────────────────────────────────┐
│  [+] Study session tomorrow 3pm             │
│      ↳ Parsed: Tomorrow, 3:00 PM, "Study.." │
│      [Create] [More options →]              │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface QuickEventInputProps {
  onSubmit: (parsed: QuickEventParsed) => Promise<void>;
  onExpandToFull: (parsed: QuickEventParsed) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

interface QuickEventParsed {
  title: string;
  startDate?: Date;
  location?: string;
  confidence: number; // 0-1 parse confidence
}
```

**Design Decision: Parse Display**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Inline preview** | Show parsed result below input | Notion, Linear | ✅ **CHOSEN** - Immediate feedback |
| Popup preview | Show in dropdown | Some apps | ❌ Extra visual noise |
| No preview | Just submit | Todoist | ❌ User uncertainty |

**Gold Usage:**
- None. Quick create is neutral.

**Animation:**
- Focus: Input highlight (150ms)
- Parse preview: Fade in (200ms)

---

#### UpcomingEventsWidget

Rail widget showing next events for a space. Primary awareness component.

**Pattern Reference:** Pattern 7: Event Flow (Stage 1: Awareness)

**Primitives Used:**
- Card
- Heading
- Text
- EventCard (compact variant)
- Badge
- Button
- LiveEventBadge

**Structure:**
```
┌─────────────────────────────────────┐
│  Upcoming Events              [+]   │
├─────────────────────────────────────┤
│                                     │
│  [📅] Study Session        [LIVE]   │
│       Now • Room 304               │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [📅] Weekly Meeting                │
│       Tomorrow, 7:00 PM            │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  [📅] Chess Tournament              │
│       Jan 20, 3:00 PM              │
│                                     │
├─────────────────────────────────────┤
│  [View all events →]                │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface UpcomingEventsWidgetProps {
  events: SpaceEvent[];
  onEventClick: (event: SpaceEvent) => void;
  onCreateEvent?: () => void; // Only for leaders
  onViewAll: () => void;
  maxVisible?: number; // Default: 3
  loading?: boolean;
}
```

**Design Decision: Position in Rail**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Above chat** | Events first, prominent | Apple widgets | ✅ **CHOSEN** - Events deserve visibility |
| Below chat | After chat messages | Discord | ❌ Events get buried |
| Collapsible | User controls | Linear | ❌ Hidden = forgotten |

**Gold Usage:**
- LiveEventBadge on happening-now events (gold pulse)
- "Today" indicator on today's events (gold dot)

**Animation:**
- Widget load: Staggered fade in (300ms per item, 50ms delay)
- Event hover: Subtle highlight (150ms)

---

#### LiveEventBadge

Gold pulse indicator for events happening NOW. Core convergence indicator.

**Pattern Reference:** Pattern 7: Event Flow (Stage 5: Convergence)

**Primitives Used:**
- Badge
- Icon (animated)

**Structure:**
```
┌────────────────┐
│  ● LIVE        │  ← Gold text, pulsing dot
└────────────────┘
```

**API:**
```tsx
interface LiveEventBadgeProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean; // Show "LIVE" text or just dot
  className?: string;
}
```

**Design Decision: Badge Style**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Gold pulse** | Gold color, subtle glow animation | Apple live activities | ✅ **CHOSEN** - Gold = life per HIVE philosophy |
| Red pulse | Urgent red indicator | YouTube Live | ❌ Feels like notification/error |
| Green dot | Active indicator | Zoom | ❌ Presence, not event |
| No badge | Animation only | Discord stages | ❌ Too subtle |

**Gold Usage:**
- **This component IS gold.** Gold text (#FFD700), gold glow animation.

**Animation:**
- Pulse: Gold glow (2000ms infinite sine wave)
- Dot: Scale 1 → 1.2 → 1 (matched to pulse)

---

#### EventAnnouncement

Chat system message announcing live events.

**Pattern Reference:** Pattern 7: Event Flow (Stage 5: Convergence)

**Primitives Used:**
- SystemMessage (base)
- LiveEventBadge
- Button
- Text

**Structure:**
```
┌─────────────────────────────────────────────┐
│  ● Weekly Chess Club is happening now       │
│    📍 Student Union Room 304                │
│    [Join] [View Details]                    │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface EventAnnouncementProps {
  event: {
    id: string;
    title: string;
    location?: string;
    virtualLink?: string;
  };
  onJoin?: () => void;
  onViewDetails: () => void;
}
```

**Design Decision: Display Style**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **System message** | Inline in chat flow | Discord | ✅ **CHOSEN** - Non-intrusive awareness |
| Pinned banner | Fixed at top of chat | Zoom | ❌ Intrusive |
| Modal | Popup announcement | Some apps | ❌ Disruptive |

**Gold Usage:**
- LiveEventBadge (gold pulse)
- Event title highlight (subtle gold tint)

---

#### EventFilters

Filter controls for event lists and panels.

**Pattern Reference:** Pattern 7: Event Flow (All stages)

**Primitives Used:**
- SegmentedControl
- Select
- Input (search)
- Badge

**Structure:**
```
┌─────────────────────────────────────────────┐
│  [All] [Upcoming] [Past]                    │
│                                             │
│  Type: [All ▾]  Search: [🔍 ...       ]    │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface EventFiltersProps {
  timeFilter: 'all' | 'upcoming' | 'past';
  typeFilter: 'all' | 'meeting' | 'social' | 'virtual';
  searchQuery: string;
  onTimeFilterChange: (filter: 'all' | 'upcoming' | 'past') => void;
  onTypeFilterChange: (filter: 'all' | 'meeting' | 'social' | 'virtual') => void;
  onSearchChange: (query: string) => void;
  counts?: {
    all: number;
    upcoming: number;
    past: number;
  };
}
```

**Gold Usage:**
- None. Filters are functional, neutral.

---

#### EventCalendar

Month/week grid view with event dot indicators.

**Pattern Reference:** Pattern 7: Event Flow (Stage 1: Awareness)

**Primitives Used:**
- Calendar (base)
- EventCard (compact, on hover/click)
- Badge
- Button

**Structure:**
```
┌─────────────────────────────────────────────┐
│  [<] January 2026 [>]           [Month|Week]│
├─────────────────────────────────────────────┤
│  Su   Mo   Tu   We   Th   Fr   Sa          │
│                  1    2    3    4           │
│                       •                     │ ← Dot = event
│   5    6    7    8    9   10   11          │
│             •              ●               │ ← Gold dot = today
│  12   13   14   15   16   17   18          │
│        •    ●●                              │ ← Multiple events
│  ...                                        │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface EventCalendarProps {
  events: SpaceEvent[];
  view: 'month' | 'week';
  onViewChange: (view: 'month' | 'week') => void;
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onEventClick: (event: SpaceEvent) => void;
  onCreateEvent?: (date: Date) => void; // Click on date to create
}
```

**Design Decision: Indicator Style**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Dot indicator** | Small dot under date | Apple Calendar | ✅ **CHOSEN** - Minimal, elegant |
| Number badge | "3 events" | Google Calendar | ❌ Too busy |
| Preview text | Event titles visible | Outlook | ❌ Visual clutter |

**Gold Usage:**
- Today's events: Gold dot indicator
- Currently happening: Gold pulse dot

**Animation:**
- Dot appear: Scale from 0 (200ms spring)
- Date selection: Highlight transition (150ms)

---

#### AttendeeList

Expandable list of event RSVPs with avatar display.

**Pattern Reference:** Pattern 7: Event Flow (Stage 2: Interest)

**Primitives Used:**
- AvatarGroup (collapsed)
- Avatar (expanded list)
- Text
- Button
- Modal (for full list)

**Structure:**
```
Collapsed:
┌─────────────────────────────────────┐
│  [👤👤👤👤+12] 16 going • 4 maybe   │
│  [View all attendees →]             │
└─────────────────────────────────────┘

Expanded Modal:
┌─────────────────────────────────────┐
│  Attendees                    [×]   │
├─────────────────────────────────────┤
│  Going (16)                         │
│  ─────────────────────────────────  │
│  [👤] Sarah Chen                    │
│  [👤] Mike Rodriguez                │
│  ...                                │
│                                     │
│  Maybe (4)                          │
│  ─────────────────────────────────  │
│  [👤] Jamie Lee                     │
│  ...                                │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface AttendeeListProps {
  attendees: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'going' | 'maybe';
  }>;
  goingCount: number;
  maybeCount: number;
  maxAvatars?: number; // Default: 4
  onViewAll: () => void;
}
```

**Design Decision: Display Style**

| Option | Description | Industry Comparison | Recommendation |
|--------|-------------|---------------------|----------------|
| **Avatar stack + count** | Show faces then number | Discord | ✅ **CHOSEN** - Human, not just numbers |
| Count only | "16 going" | Google Calendar | ❌ Impersonal |
| Full list | All names visible | Eventbrite | ❌ Overwhelming in card view |

**Gold Usage:**
- Host avatar ring (subtle gold) in full list

---

### Chat Components — Space Participation Pattern

Real-time messaging components for Spaces. These form the core of the **Space Participation** pattern — where 80% of engaged user time is spent.

**Pattern Context:** Stream Reading → Composition → Threading → Reaction → Presence

---

## SPACE PARTICIPATION COMPONENT SPECIFICATIONS

Full design specifications with confirmed decisions from pattern analysis.

---

#### MessageBubble

The atomic unit of chat. Every message rendered through this component.

**Primitives Used:**
- Avatar (rounded square, 32px)
- Text (15px primary)
- Mono (for code blocks)
- ReactionBadge (for reactions)

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Container Shape** | Full row (no bubble) | Respects horizontal space, dense reading |
| **Avatar Placement** | Hidden in groups, 32px when shown | Reduces noise for sequential messages |
| **Hover Actions** | Context menu only (Apple style) | Cleaner interface, right-click/long-press |
| **Timestamp Display** | Hover reveal + group separators | Reduces noise, maintains context |
| **Own Message Style** | No differentiation | Equal treatment in group spaces |

**Structure:**
```
[Avatar] Name          ← Only on first message of group
        Message content here...
        [🎉 3] [👍 1]  ← Reactions below
```

**Full CSS Specification:**

```css
/* MessageBubble Base */
.message-bubble {
  display: flex;
  gap: 12px;
  padding: 4px 16px;
  margin: 0;
  border-radius: 0;
  background: transparent;
  transition: background-color 150ms ease-out;
  position: relative;
}

/* Hover state - subtle warmth */
.message-bubble:hover {
  background-color: rgba(255, 255, 255, 0.02);
}

/* Long-press feedback for mobile context menu */
.message-bubble:active {
  background-color: rgba(255, 255, 255, 0.04);
}

/* First in group - extra top padding for avatar */
.message-bubble--group-start {
  padding-top: 12px;
  margin-top: 16px;
}

/* Continuation - hide avatar space */
.message-bubble--continuation {
  padding-left: 60px; /* Avatar width (32px) + gap (12px) + original padding (16px) */
}

/* Highlighted state (pinned, mentioned) - GOLD MOMENT */
.message-bubble--highlighted {
  background: rgba(255, 215, 0, 0.04);
  border-left: 2px solid rgba(255, 215, 0, 0.3);
  padding-left: 14px;
}

/* Avatar container */
.message-bubble__avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px; /* Rounded square */
}

/* Content area */
.message-bubble__content {
  flex: 1;
  min-width: 0;
}

/* Author name - only shown on group start */
.message-bubble__author {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 2px;
}

/* Timestamp - hover reveal */
.message-bubble__time {
  font-size: 11px;
  color: var(--color-text-subtle);
  margin-left: 8px;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.message-bubble:hover .message-bubble__time {
  opacity: 1;
}

/* Message text */
.message-bubble__text {
  font-size: 15px;
  line-height: 1.4;
  color: var(--color-text-primary);
  word-wrap: break-word;
}

/* Code blocks */
.message-bubble__code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 6px;
  padding: 12px;
  margin: 8px 0;
  overflow-x: auto;
}

/* Inline code */
.message-bubble__inline-code {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 13px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  padding: 2px 6px;
}

/* Reactions container */
.message-bubble__reactions {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
```

**API:**
```tsx
interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    author: { id: string; name: string; avatar?: string };
    timestamp: Date;
    reactions?: Array<{ emoji: string; count: number; users: string[]; hasOwn: boolean }>;
    isPinned?: boolean;
    isMentioned?: boolean;
    replyCount?: number;
  };
  variant: 'group-start' | 'continuation';
  onContextMenu?: (e: React.MouseEvent) => void;
  onReactionAdd?: (emoji: string) => void;
  onReplyClick?: () => void;
}
```

**Gold Usage:**
- Highlighted border (pinned/mentioned messages)
- Own reaction badge border

---

#### MessageGroup

Groups sequential messages from same author within time window.

**Primitives Used:**
- MessageBubble (multiple)
- Avatar (shown once)
- Text (date/time separators)

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Grouping Rule** | Same author within 5 minutes | Discord standard, comfortable density |
| **Break Conditions** | Media, reactions, threads | Smart separation for context |
| **Date Separators** | New days get header | Clear temporal breaks |
| **Time Gap Indicators** | Pill for gaps > 30min | Subtle inline context |

**Full CSS Specification:**

```css
/* Date separator */
.message-group__date-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px 16px 8px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-subtle);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.message-group__date-header::before,
.message-group__date-header::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border-subtle);
}

/* Time gap indicator */
.message-group__time-gap {
  display: flex;
  justify-content: center;
  padding: 8px 0;
}

.message-group__time-gap-pill {
  font-size: 11px;
  color: var(--color-text-subtle);
  background: var(--color-bg-elevated);
  padding: 4px 12px;
  border-radius: 10px;
  border: 1px solid var(--color-border-subtle);
}

/* New messages indicator - GOLD MOMENT */
.message-group__new-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-accent-gold);
}

.message-group__new-indicator::before,
.message-group__new-indicator::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-accent-gold);
  opacity: 0.3;
}
```

**API:**
```tsx
interface MessageGroupProps {
  messages: Message[];
  author: User;
  showDateHeader?: boolean;
  dateLabel?: string;
  isNewSection?: boolean;
}
```

**Gold Usage:**
- New messages indicator line and text

---

#### ChatComposer

Message input area — critical UX touchpoint.

**Primitives Used:**
- Textarea (auto-resize)
- Button (send, attach)
- Icon (Heroicons)
- Tooltip

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Container Shape** | Rounded (12px radius) | Apple-inspired premium feel |
| **Attachment Controls** | Plus button left | Single entry point, menu reveals options |
| **Send Trigger** | Enter sends, Shift+Enter newline | Standard pattern |
| **Send Button State** | Always visible, gold when ready | Clear affordance, gold = ready moment |
| **Textarea Growth** | Smart collapse after send, auto-grow | Natural typing, clean reset |
| **Character Limit** | Warning only near limit | No visual noise until needed |
| **Toolbar** | Optional inline above (future) | Progressive enhancement |

**Structure:**
```
[Reply context if replying]
┌─────────────────────────────────────────────────────┐
│  [+]  Message #general...                      [➤]  │
└─────────────────────────────────────────────────────┘
```

**Full CSS Specification:**

```css
/* Composer container */
.chat-composer {
  padding: 12px 16px 16px;
  background: var(--color-bg-page);
  border-top: 1px solid var(--color-border-subtle);
}

/* Replying to indicator */
.chat-composer__reply-context {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 215, 0, 0.05);
  border-left: 2px solid var(--color-accent-gold);
  border-radius: 4px;
  margin-bottom: 8px;
}

.chat-composer__reply-text {
  flex: 1;
  font-size: 13px;
  color: var(--color-text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-composer__reply-close {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-subtle);
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
}

.chat-composer__reply-close:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* Input container - rounded, Apple-inspired */
.chat-composer__container {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 8px 12px;
  transition: all 150ms ease-out;
}

.chat-composer__container:focus-within {
  border-color: rgba(255, 255, 255, 0.2);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
}

/* Attachments button - left side */
.chat-composer__attach {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

.chat-composer__attach:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

/* Textarea - auto-grow with smart collapse */
.chat-composer__input {
  flex: 1;
  min-height: 24px;
  max-height: 200px;
  padding: 4px 0;
  font-size: 15px;
  line-height: 1.4;
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  outline: none;
  resize: none;
  overflow-y: auto;
}

.chat-composer__input::placeholder {
  color: var(--color-text-subtle);
}

/* Send button - GOLD MOMENT when ready */
.chat-composer__send {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

/* Empty state - dim, not clickable */
.chat-composer__send--empty {
  background: transparent;
  color: var(--color-text-subtle);
  cursor: not-allowed;
}

/* Has content - GOLD activation */
.chat-composer__send--ready {
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  cursor: pointer;
}

.chat-composer__send--ready:hover {
  filter: brightness(1.1);
  transform: scale(1.05);
}

/* Sending state */
.chat-composer__send--sending {
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  opacity: 0.7;
  cursor: wait;
}

/* Character limit warning - only appears near limit */
.chat-composer__limit {
  position: absolute;
  bottom: -20px;
  right: 16px;
  font-size: 11px;
  color: var(--color-text-subtle);
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.chat-composer__limit--warning {
  opacity: 1;
  color: var(--color-warning);
}

/* Attachment previews */
.chat-composer__attachments {
  display: flex;
  gap: 8px;
  padding: 8px 0;
  flex-wrap: wrap;
}

.chat-composer__attachment-preview {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border-subtle);
}

.chat-composer__attachment-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-composer__attachment-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  color: white;
  border: none;
  cursor: pointer;
}

/* Optional inline toolbar (future enhancement) */
.chat-composer__toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin-bottom: 4px;
  opacity: 0;
  height: 0;
  overflow: hidden;
  transition: all 150ms ease-out;
}

.chat-composer__container:focus-within ~ .chat-composer__toolbar,
.chat-composer--has-content .chat-composer__toolbar {
  opacity: 1;
  height: 32px;
}

.chat-composer__toolbar-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--color-text-subtle);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.chat-composer__toolbar-btn:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--color-text-secondary);
}
```

**API:**
```tsx
interface ChatComposerProps {
  onSend: (content: string, attachments?: File[]) => void;
  onTyping?: () => void;
  placeholder?: string;
  maxLength?: number;
  disabled?: boolean;
  replyTo?: { id: string; author: string; preview: string };
  onCancelReply?: () => void;
  showToolbar?: boolean;
}
```

**Behavior:**
- Enter sends (Shift+Enter for newline)
- Auto-resize as user types (max 200px, then scroll)
- Collapses to single line after send
- Typing indicator triggered on input (3s throttle)
- @ mentions trigger autocomplete
- / commands trigger command palette
- File drag-drop supported
- Reply preview shown when replying

**Gold Usage:**
- Send button when message ready (primary gold moment)
- Reply context border

---

#### TypingIndicator

Shows who's typing in real-time.

**Primitives Used:**
- Text
- Avatar (optional, for multiple)

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Animation Style** | Wave (Apple-like) | Smooth, intentional feel |
| **Placement** | Above composer | Clear, doesn't affect scroll |
| **Multiple Users** | Names (1-2), count (3+), gold when heated | Scalable, activity indicator |

**Full CSS Specification:**

```css
/* Typing indicator container */
.typing-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  font-size: 13px;
  color: var(--color-text-secondary);
  min-height: 28px;
}

/* Dots container */
.typing-indicator__dots {
  display: flex;
  align-items: center;
  gap: 3px;
}

/* Individual dot - wave animation */
.typing-indicator__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-secondary);
  animation: typing-wave 1.2s ease-in-out infinite;
}

.typing-indicator__dot:nth-child(2) {
  animation-delay: 0.15s;
}

.typing-indicator__dot:nth-child(3) {
  animation-delay: 0.3s;
}

/* Wave animation - Apple style */
@keyframes typing-wave {
  0%, 60%, 100% {
    transform: scale(1);
    opacity: 0.4;
  }
  30% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* HEATED state - 3+ users typing, GOLD MOMENT */
.typing-indicator--heated .typing-indicator__dot {
  background: var(--color-accent-gold);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

.typing-indicator--heated {
  color: var(--color-accent-gold);
}

/* Text with fade */
.typing-indicator__text {
  animation: typing-fade 2s ease-in-out infinite;
}

@keyframes typing-fade {
  0%, 100% { opacity: 0.7; }
  50% { opacity: 1; }
}

/* Avatar stack for multiple users */
.typing-indicator__avatars {
  display: flex;
}

.typing-indicator__avatar {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  border: 2px solid var(--color-bg-page);
  margin-left: -6px;
}

.typing-indicator__avatar:first-child {
  margin-left: 0;
}
```

**API:**
```tsx
interface TypingIndicatorProps {
  users: Array<{ id: string; name: string; avatar?: string }>;
}
```

**Display Logic:**
- 0 users: Hidden
- 1 user: "Alex is typing..."
- 2 users: "Alex and Sam are typing..."
- 3+ users: "3 people are typing..." + gold dots (heated)

**Gold Usage:**
- Dots and text turn gold when 3+ users typing

---

#### ThreadDrawer

Slide-out panel for threaded conversations.

**Primitives Used:**
- Card (sheet variant)
- MessageBubble
- ChatComposer
- Button
- Heading

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Display Mode** | Side drawer (420px) | See context without mode switch |
| **Entry Animation** | Fade + slide from right | Smooth, not jarring |
| **Header** | Original message preview + stats | Full context |
| **Backdrop** | Dim on mobile, push aside on desktop | Context-appropriate |
| **Thread Position in Stream** | Reply count badge link | Minimal noise, clear affordance |

**Full CSS Specification:**

```css
/* Thread drawer backdrop (mobile) */
.thread-drawer__backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  opacity: 0;
  transition: opacity 250ms ease-out;
  z-index: 100;
}

.thread-drawer__backdrop--visible {
  opacity: 1;
}

/* Thread drawer container */
.thread-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 420px;
  max-width: 100vw;
  background: var(--color-bg-page);
  border-left: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
  z-index: 101;
  transform: translateX(100%);
  opacity: 0;
  transition: all 250ms ease-out;
}

.thread-drawer--open {
  transform: translateX(0);
  opacity: 1;
}

/* Header */
.thread-drawer__header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: var(--color-bg-elevated);
}

.thread-drawer__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

.thread-drawer__close:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

/* Context info */
.thread-drawer__context {
  flex: 1;
  min-width: 0;
}

.thread-drawer__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.thread-drawer__stats {
  font-size: 12px;
  color: var(--color-text-subtle);
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Original message preview */
.thread-drawer__original {
  padding: 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  background: rgba(255, 215, 0, 0.03);
}

.thread-drawer__original-author {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.thread-drawer__original-text {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

/* Replies list */
.thread-drawer__replies {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

/* Thread composer */
.thread-drawer__composer {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-subtle);
  background: var(--color-bg-page);
}

/* Mobile: full width */
@media (max-width: 640px) {
  .thread-drawer {
    width: 100vw;
  }
}

/* Desktop: can push main chat aside */
@media (min-width: 1024px) {
  .thread-drawer--push-mode {
    position: relative;
    transform: none;
    opacity: 1;
  }
}
```

**API:**
```tsx
interface ThreadDrawerProps {
  open: boolean;
  onClose: () => void;
  parentMessage: {
    id: string;
    author: { name: string; avatar?: string };
    content: string;
    timestamp: Date;
  };
  replies: Message[];
  replyCount: number;
  participantCount: number;
  onSendReply: (content: string) => void;
}
```

**Gold Usage:**
- Inherited from MessageBubble and ChatComposer

---

#### ReactionPicker

Emoji selection for message reactions.

**Primitives Used:**
- Button (emoji buttons)
- Input (search)
- Text (category headers)

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Quick Access** | 6 universal emojis (👍 ❤️ 😂 😮 😢 🎉) | Fast common reactions |
| **Full Picker** | Search + continuous scroll with headers | Power user access |
| **Placement** | Contextual (above when space, below near top) | Edge-aware |
| **GIF Support** | Tab in full picker | Integrated expression |

**Full CSS Specification:**

```css
/* Quick picker - appears in context menu */
.reaction-picker-quick {
  display: flex;
  gap: 4px;
  padding: 6px 8px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Quick emoji button */
.reaction-picker-quick__emoji {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.reaction-picker-quick__emoji:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.15);
}

/* More button to open full picker */
.reaction-picker-quick__more {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-subtle);
  transition: all 150ms ease-out;
}

.reaction-picker-quick__more:hover {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-secondary);
}

/* Full picker popover */
.reaction-picker-full {
  width: 320px;
  max-height: 360px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Tabs (Emoji / GIF) */
.reaction-picker-full__tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.reaction-picker-full__tab {
  flex: 1;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  color: var(--color-text-secondary);
  transition: all 150ms ease-out;
}

.reaction-picker-full__tab--active {
  background: rgba(255, 255, 255, 0.08);
  color: var(--color-text-primary);
}

/* Search bar */
.reaction-picker-full__search {
  padding: 8px 12px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.reaction-picker-full__search-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  background: var(--color-bg-page);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  color: var(--color-text-primary);
  outline: none;
}

.reaction-picker-full__search-input:focus {
  border-color: rgba(255, 255, 255, 0.2);
}

.reaction-picker-full__search-input::placeholder {
  color: var(--color-text-subtle);
}

/* Emoji grid */
.reaction-picker-full__grid {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

/* Category header - sticky */
.reaction-picker-full__category {
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-subtle);
  padding: 8px 0 4px;
  position: sticky;
  top: 0;
  background: var(--color-bg-elevated);
}

/* Emoji buttons grid */
.reaction-picker-full__emojis {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 2px;
}

.reaction-picker-full__emoji {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  border-radius: 6px;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 100ms ease-out;
}

.reaction-picker-full__emoji:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: scale(1.1);
}
```

**API:**
```tsx
interface ReactionPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
  variant: 'quick' | 'full';
  position?: { top: number; left: number };
}
```

**Gold Usage:**
None — expression interface, not achievement

---

#### ReactionBadge

Displays reaction counts on messages.

**Primitives Used:**
- Button
- Text
- Tooltip

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Badge Style** | Pill with emoji + count | Discord pattern, clear |
| **Grouping** | Show all (no limit) | Chat is for expression |
| **Own Reaction** | Gold border highlight | HIVE signature |
| **Hover** | Show user names | Social context |
| **Click** | Add same reaction | Quick engagement |

**Full CSS Specification:**

```css
/* Reaction container */
.reaction-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

/* Individual badge */
.reaction-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px 2px 6px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.reaction-badge:hover {
  background: rgba(255, 255, 255, 0.08);
  border-color: rgba(255, 255, 255, 0.1);
}

/* Own reaction - GOLD MOMENT */
.reaction-badge--own {
  background: rgba(255, 215, 0, 0.08);
  border-color: rgba(255, 215, 0, 0.25);
}

.reaction-badge--own:hover {
  background: rgba(255, 215, 0, 0.12);
  border-color: rgba(255, 215, 0, 0.35);
}

/* Emoji */
.reaction-badge__emoji {
  font-size: 14px;
  line-height: 1;
}

/* Count */
.reaction-badge__count {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.reaction-badge--own .reaction-badge__count {
  color: var(--color-accent-gold);
}

/* Tooltip with users */
.reaction-badge__tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  padding: 8px 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  font-size: 12px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 150ms ease-out;
  z-index: 10;
}

.reaction-badge:hover .reaction-badge__tooltip {
  opacity: 1;
}
```

**API:**
```tsx
interface ReactionBadgeProps {
  emoji: string;
  count: number;
  users: string[];
  hasOwn: boolean;
  onClick: () => void;
}
```

**Gold Usage:**
- Own reaction badge border and count

---

#### MentionAutocomplete

User/channel/command mention suggestions.

**Primitives Used:**
- Avatar
- Text
- PresenceDot
- Icon

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Triggers** | @ (users), # (channels), / (commands) | Full functionality |
| **Result Display** | Avatar + name (clean) | Recognizable without clutter |
| **Navigation** | Arrow keys + Enter, first pre-selected | Fast selection |
| **Online Indicator** | Gold presence dot | HIVE signature |

**Full CSS Specification:**

```css
/* Autocomplete container */
.mention-autocomplete {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 280px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 50;
}

/* Category header */
.mention-autocomplete__header {
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-subtle);
  background: var(--color-bg-page);
  border-bottom: 1px solid var(--color-border-subtle);
}

/* Results list */
.mention-autocomplete__list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}

/* Individual result */
.mention-autocomplete__item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 100ms ease-out;
}

.mention-autocomplete__item:hover,
.mention-autocomplete__item--selected {
  background: rgba(255, 255, 255, 0.06);
}

/* Avatar */
.mention-autocomplete__avatar {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  flex-shrink: 0;
  position: relative;
}

/* User info */
.mention-autocomplete__info {
  flex: 1;
  min-width: 0;
}

.mention-autocomplete__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.mention-autocomplete__handle {
  font-size: 12px;
  color: var(--color-text-subtle);
}

/* Online indicator - GOLD MOMENT */
.mention-autocomplete__status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.mention-autocomplete__status--online {
  background: var(--color-accent-gold);
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.4);
}

.mention-autocomplete__status--offline {
  background: var(--color-text-subtle);
  opacity: 0.3;
}

/* Command variant */
.mention-autocomplete__item--command .mention-autocomplete__icon {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 7px;
  color: var(--color-text-secondary);
}

.mention-autocomplete__description {
  font-size: 12px;
  color: var(--color-text-subtle);
  margin-top: 2px;
}

/* Keyboard hint */
.mention-autocomplete__hint {
  padding: 8px 12px;
  font-size: 11px;
  color: var(--color-text-subtle);
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  gap: 12px;
}

.mention-autocomplete__hint-key {
  display: inline-flex;
  align-items: center;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
}
```

**API:**
```tsx
interface MentionAutocompleteProps {
  type: 'user' | 'channel' | 'command';
  query: string;
  results: Array<{
    id: string;
    name: string;
    handle?: string;
    avatar?: string;
    status?: 'online' | 'offline';
    description?: string;
  }>;
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}
```

**Gold Usage:**
- Online users have gold presence dot

---

#### ChatCommandPalette

Slash command interface within chat.

**Primitives Used:**
- Input
- Icon
- Text

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Display** | Inline dropdown above composer | Contextual, no mode switch |
| **Discovery** | Show recent first, then all, filter as typing | Fast access + full discovery |
| **Preview** | Description + usage | Helpful without overload |
| **Tool Integration** | Commands + space-specific tools | Integrated ecosystem |

**Full CSS Specification:**

```css
/* Command palette container */
.chat-command-palette {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  max-height: 360px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 50;
}

/* Command list */
.chat-command-palette__list {
  max-height: 320px;
  overflow-y: auto;
  padding: 4px;
}

/* Section header */
.chat-command-palette__section {
  padding: 8px 12px 4px;
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-subtle);
}

/* Command item */
.chat-command-palette__item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 100ms ease-out;
}

.chat-command-palette__item:hover,
.chat-command-palette__item--selected {
  background: rgba(255, 255, 255, 0.06);
}

/* Command icon */
.chat-command-palette__icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}

/* Tool command - GOLD MOMENT */
.chat-command-palette__item--tool .chat-command-palette__icon {
  background: rgba(255, 215, 0, 0.08);
  color: var(--color-accent-gold);
}

/* Command info */
.chat-command-palette__info {
  flex: 1;
  min-width: 0;
}

.chat-command-palette__name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.chat-command-palette__name span {
  color: var(--color-text-subtle);
  font-weight: 400;
}

.chat-command-palette__description {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-top: 2px;
  line-height: 1.3;
}

.chat-command-palette__usage {
  font-size: 11px;
  color: var(--color-text-subtle);
  margin-top: 4px;
  font-family: 'SF Mono', monospace;
  background: rgba(255, 255, 255, 0.04);
  padding: 2px 6px;
  border-radius: 4px;
  display: inline-block;
}

/* Empty state */
.chat-command-palette__empty {
  padding: 24px;
  text-align: center;
  color: var(--color-text-subtle);
  font-size: 14px;
}

/* Footer with hints */
.chat-command-palette__footer {
  padding: 8px 12px;
  border-top: 1px solid var(--color-border-subtle);
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 11px;
  color: var(--color-text-subtle);
}

.chat-command-palette__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-family: monospace;
  font-size: 10px;
}
```

**API:**
```tsx
interface ChatCommandPaletteProps {
  query: string;
  commands: Array<{
    id: string;
    name: string;
    description: string;
    usage?: string;
    icon: string;
    type: 'command' | 'tool';
  }>;
  selectedIndex: number;
  onSelect: (command: Command) => void;
  onNavigate: (direction: 'up' | 'down') => void;
}
```

**Gold Usage:**
- Tool command icons have gold background

---

#### PresenceIndicator

Shows user online/typing status.

**Primitives Used:**
- (Standalone primitive composition)

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Online Color** | Gold (HIVE signature) | Brand differentiation |
| **Size** | 8px dot, bottom-right of avatar | Visible without dominant |
| **Typing State** | Pulse animation | Subtle activity indicator |

**Full CSS Specification:**

```css
/* Presence dot */
.presence-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-page);
  transition: all 200ms ease-out;
}

/* Online - GOLD (HIVE signature) */
.presence-dot--online {
  background: var(--color-accent-gold);
  box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
}

/* Idle/Away */
.presence-dot--idle {
  background: var(--color-warning);
  box-shadow: none;
}

/* Offline/Invisible */
.presence-dot--offline {
  background: var(--color-text-subtle);
  opacity: 0.4;
}

/* Typing animation - pulse */
.presence-dot--typing {
  animation: presence-pulse 1.5s ease-in-out infinite;
}

@keyframes presence-pulse {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.5);
  }
  50% {
    transform: scale(1.15);
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
  }
}

/* Size variants */
.presence-dot--sm {
  width: 8px;
  height: 8px;
  bottom: -1px;
  right: -1px;
  border-width: 1.5px;
}

.presence-dot--lg {
  width: 12px;
  height: 12px;
  bottom: -2px;
  right: -2px;
  border-width: 2px;
}

/* For rounded-square avatars - adjust position */
.avatar--rounded-square .presence-dot {
  bottom: -3px;
  right: -3px;
}
```

**API:**
```tsx
interface PresenceIndicatorProps {
  status: 'online' | 'idle' | 'offline';
  isTyping?: boolean;
  size?: 'sm' | 'md' | 'lg';
}
```

**Gold Usage:**
- Online status is always gold (HIVE signature)

---

#### PinnedMessagesBadge

Access point for pinned messages.

**Primitives Used:**
- Button
- Icon
- Badge

**Confirmed Design Decisions:**

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Visual** | Gold pin icon + count badge | HIVE signature + clear |
| **Interaction** | Click → dropdown list | Quick access without mode change |
| **Placement** | Chat header | Consistent location |

**Full CSS Specification:**

```css
/* Pin button in header */
.pinned-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 8px;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.pinned-badge:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: var(--color-border-subtle);
}

/* Gold pin icon - ALWAYS GOLD */
.pinned-badge__icon {
  color: var(--color-accent-gold);
  width: 16px;
  height: 16px;
}

/* Count */
.pinned-badge__count {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

/* Active state (dropdown open) */
.pinned-badge--active {
  background: rgba(255, 215, 0, 0.08);
  border-color: rgba(255, 215, 0, 0.2);
}

/* Dropdown */
.pinned-badge__dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  max-height: 400px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  overflow: hidden;
  z-index: 50;
}

.pinned-badge__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
}

.pinned-badge__title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.pinned-badge__list {
  max-height: 320px;
  overflow-y: auto;
}

.pinned-badge__item {
  padding: 12px 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  cursor: pointer;
  transition: background-color 100ms ease-out;
}

.pinned-badge__item:hover {
  background: rgba(255, 255, 255, 0.04);
}

.pinned-badge__item:last-child {
  border-bottom: none;
}

.pinned-badge__item-author {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-secondary);
  margin-bottom: 4px;
}

.pinned-badge__item-text {
  font-size: 13px;
  color: var(--color-text-primary);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.pinned-badge__item-time {
  font-size: 11px;
  color: var(--color-text-subtle);
  margin-top: 4px;
}

/* Empty state */
.pinned-badge__empty {
  padding: 32px 16px;
  text-align: center;
  color: var(--color-text-subtle);
}
```

**API:**
```tsx
interface PinnedMessagesBadgeProps {
  count: number;
  messages: Array<{
    id: string;
    author: string;
    content: string;
    timestamp: Date;
  }>;
  onMessageClick: (messageId: string) => void;
}
```

**Gold Usage:**
- Pin icon is always gold

---

## SPACE PARTICIPATION GOLD SUMMARY

| Component | Gold Moment | Condition |
|-----------|-------------|-----------|
| MessageBubble | Left border | Pinned or mentioned |
| MessageGroup | Indicator line | New messages section |
| ChatComposer | Send button | Content ready to send |
| TypingIndicator | Dots + text | 3+ users typing (heated) |
| ReactionBadge | Border + count | Own reaction |
| MentionAutocomplete | Presence dot | User is online |
| ChatCommandPalette | Icon background | Tool commands |
| PresenceIndicator | Dot color | User is online |
| PinnedMessagesBadge | Pin icon | Always |

**Total Gold Budget:** ~1-2% of screen during active chat, aligns with PRINCIPLES gold discipline.

---

---

## GATE & ONBOARDING COMPONENT SPECIFICATIONS

These components implement the Gate & Onboarding pattern - the first impression, verification flow, and onboarding experience that transforms visitors into activated HIVE members.

**Upstream Alignment:**
- PHILOSOPHY: The Gate, The Monster, 2am Energy
- PRINCIPLES: Suggest Over Demand, No Dark Patterns, Velvet Rope

**Critical Boundary:**
> "Students share authentically because outsiders can't see. The gate creates safety."

---

### Component 1: LandingHero

The first thing visitors see. Communicates value and creates desire.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | **Stacked Cinematic** | Story-driven, full-width hero, narrative flow |
| Copy Density | **Headline + Subhead** | Context without overwhelm |
| CTA Treatment | **Single Gold** | Maximum clarity, one path |
| Product Preview | **Animated Preview** | Life without interaction complexity |

#### Full CSS Specification

```css
/* === LANDING HERO === */

.landing-hero {
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--color-bg-page);
  padding: 80px 24px;
}

/* Ambient background */
.landing-hero::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(
    ellipse 80% 50% at 50% -20%,
    rgba(255, 215, 0, 0.03) 0%,
    transparent 70%
  );
  pointer-events: none;
}

/* Content container */
.landing-hero__content {
  max-width: 800px;
  text-align: center;
  z-index: 1;
}

/* Headline */
.landing-hero__headline {
  font-family: var(--font-display);
  font-size: clamp(40px, 6vw, 72px);
  font-weight: 600;
  line-height: 1.1;
  letter-spacing: -0.02em;
  color: var(--color-text-primary);
  margin: 0 0 24px 0;
}

/* Subhead */
.landing-hero__subhead {
  font-family: var(--font-body);
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 400;
  line-height: 1.5;
  color: var(--color-text-secondary);
  margin: 0 0 48px 0;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

/* CTA Button - Single Gold */
.landing-hero__cta {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 16px 40px;
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.landing-hero__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.landing-hero__cta:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Product Preview - Animated */
.landing-hero__preview {
  margin-top: 80px;
  width: 100%;
  max-width: 1000px;
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.06),
    0 24px 80px rgba(0, 0, 0, 0.5);
}

.landing-hero__preview-image {
  width: 100%;
  height: auto;
  display: block;
}

/* Animated cursor overlay */
.landing-hero__preview-cursor {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--color-text-primary);
  border-radius: 50%;
  opacity: 0.8;
  animation: cursor-move 8s ease-in-out infinite;
  pointer-events: none;
}

@keyframes cursor-move {
  0%, 100% { transform: translate(200px, 150px); }
  25% { transform: translate(400px, 200px); }
  50% { transform: translate(350px, 300px); }
  75% { transform: translate(250px, 250px); }
}

/* Mobile */
@media (max-width: 768px) {
  .landing-hero {
    padding: 60px 16px;
    min-height: auto;
  }

  .landing-hero__cta {
    width: 100%;
    max-width: 320px;
  }

  .landing-hero__preview {
    margin-top: 48px;
  }
}
```

#### API

```tsx
interface LandingHeroProps {
  headline: string;
  subhead: string;
  ctaLabel: string;
  onCtaClick: () => void;
  previewSrc: string;
  previewAlt: string;
  showAnimatedCursor?: boolean;
}

// Usage
<LandingHero
  headline="Where UB actually happens"
  subhead="Student-owned spaces and tools for the campus that matters."
  ctaLabel="Get Started"
  onCtaClick={openGate}
  previewSrc="/images/product-preview.png"
  previewAlt="HIVE spaces and HiveLab interface"
  showAnimatedCursor
/>
```

#### Gold Usage
- CTA button: Gold background
- Subtle ambient glow in background (very subtle, ~0.03 opacity)

---

### Component 2: ActivityConstellation

Abstract visualization of platform activity - "the monster" without exposing people.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Visual Style | **Constellation Stars** | Point lights in void, 2am energy |
| Node Differentiation | **Size + Subtle Glow** | Clear hierarchy with gold accent |
| Hover Behavior | **Focus + Tooltip** | Elegant information reveal |
| Animation Speed | **Medium Float (15-20s)** | Noticeable life without distraction |

#### Node Types

| Type | Visual | Size | Animation |
|------|--------|------|-----------|
| Creation | Gold glow | Large (8-12px) | Burst on appear |
| Connection | White | Medium (5-8px) | Line draws to connected |
| Space | Soft pulse | Medium (6-10px) | 3s pulse cycle |
| Activity | Ripple | Small (4-6px) | Ripple outward |
| Growth | Expand | Small → Medium | Scale up 300ms |

#### Full CSS Specification

```css
/* === ACTIVITY CONSTELLATION === */

.constellation {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.constellation__canvas {
  width: 100%;
  height: 100%;
  position: relative;
}

/* Individual node */
.constellation__node {
  position: absolute;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  opacity: 0.6;
  transition: all 150ms ease-out;
  pointer-events: auto;
  cursor: pointer;
}

/* Size variants */
.constellation__node--small {
  width: 4px;
  height: 4px;
}

.constellation__node--medium {
  width: 6px;
  height: 6px;
}

.constellation__node--large {
  width: 10px;
  height: 10px;
}

/* Creation node - gold glow */
.constellation__node--creation {
  background: var(--color-accent-gold);
  box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
  opacity: 1;
}

/* Space node - pulse */
.constellation__node--space {
  animation: node-pulse 3s ease-in-out infinite;
}

@keyframes node-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 0.9; transform: scale(1.2); }
}

/* Ambient drift animation */
.constellation__node {
  animation: node-drift 20s ease-in-out infinite;
}

@keyframes node-drift {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(5px, -8px); }
  50% { transform: translate(-3px, 5px); }
  75% { transform: translate(8px, 3px); }
}

/* Connection lines */
.constellation__line {
  position: absolute;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  height: 1px;
  transform-origin: left center;
  opacity: 0.3;
}

/* Hover state - focus effect */
.constellation__node:hover {
  opacity: 1;
  transform: scale(1.5);
  z-index: 10;
}

.constellation--focused .constellation__node:not(:hover) {
  opacity: 0.2;
}

/* Tooltip */
.constellation__tooltip {
  position: absolute;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  padding: 8px 12px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transform: translateY(8px);
  transition: all 150ms ease-out;
}

.constellation__node:hover + .constellation__tooltip {
  opacity: 1;
  transform: translateY(0);
}

/* Burst animation for new creation */
@keyframes creation-burst {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.5); opacity: 1; }
  100% { transform: scale(1); opacity: 1; }
}

.constellation__node--new {
  animation: creation-burst 300ms ease-out;
}
```

#### API

```tsx
interface ConstellationNode {
  id: string;
  type: 'creation' | 'connection' | 'space' | 'activity' | 'growth';
  x: number; // 0-100 percentage
  y: number; // 0-100 percentage
  size: 'small' | 'medium' | 'large';
  tooltipText?: string;
}

interface ActivityConstellationProps {
  nodes: ConstellationNode[];
  connections?: Array<{ from: string; to: string }>;
  onNodeClick?: (nodeId: string) => void;
  minNodes?: number; // Cold start minimum
}

// Usage
<ActivityConstellation
  nodes={[
    { id: '1', type: 'creation', x: 30, y: 40, size: 'large', tooltipText: '12 tools deployed today' },
    { id: '2', type: 'space', x: 60, y: 55, size: 'medium', tooltipText: '8 active spaces' },
    // ...
  ]}
  connections={[{ from: '1', to: '2' }]}
  minNodes={10}
/>
```

#### Cold Start Handling
- Minimum 10 nodes always displayed
- If real data < 10, supplement with "founding class" activity
- Never show empty constellation

#### Gold Usage
- Creation nodes: Gold glow (signals building activity)
- ~2-4 gold nodes visible at any time (maintained through rotation)

---

### Component 3: FoundingClassBanner

Social proof for cold start without lying about scale.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Frame Style | **Qualitative Cards** | Contextual framing, honest |
| Animation | **Count Up** | Engagement on load |

#### Full CSS Specification

```css
/* === FOUNDING CLASS BANNER === */

.founding-class {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  margin-top: 48px;
}

.founding-class__card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
}

.founding-class__icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
}

.founding-class__content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.founding-class__number {
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1;
}

.founding-class__label {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* Count up animation */
.founding-class__number--animating {
  animation: count-up 1s ease-out;
}

@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile - stack */
@media (max-width: 768px) {
  .founding-class {
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .founding-class__card {
    width: 100%;
    max-width: 280px;
  }
}
```

#### API

```tsx
interface FoundingClassStat {
  icon: 'tools' | 'spaces' | 'users';
  value: number;
  label: string;
}

interface FoundingClassBannerProps {
  stats: FoundingClassStat[];
  animateOnView?: boolean;
}

// Usage
<FoundingClassBanner
  stats={[
    { icon: 'tools', value: 47, label: 'tools deployed this week' },
    { icon: 'spaces', value: 12, label: 'spaces actively building' },
    { icon: 'users', value: 156, label: 'founding builders' },
  ]}
  animateOnView
/>
```

#### Gold Usage
- None - neutral stats display

---

### Component 4: GateModal

The verification flow container - the threshold moment.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modal Style | **Full Takeover** | Maximum focus, dramatic threshold |
| Step Indication | **No Indication** | Only 2 steps, flow is fast |
| Transition Style | **Fade** | Smooth crossfade between states |

#### Full CSS Specification

```css
/* === GATE MODAL === */

.gate-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-page);
}

/* Entry animation */
.gate-modal--entering {
  animation: gate-enter 300ms ease-out;
}

@keyframes gate-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Content container */
.gate-modal__content {
  width: 100%;
  max-width: 420px;
  padding: 48px;
  text-align: center;
}

/* Logo/Brand */
.gate-modal__logo {
  width: 48px;
  height: 48px;
  margin: 0 auto 32px;
}

/* Title */
.gate-modal__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

/* Subtitle */
.gate-modal__subtitle {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-secondary);
  margin: 0 0 40px 0;
}

/* Step container */
.gate-modal__step {
  animation: step-fade 300ms ease-out;
}

@keyframes step-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Step exiting */
.gate-modal__step--exiting {
  animation: step-fade-out 200ms ease-out;
}

@keyframes step-fade-out {
  from { opacity: 1; }
  to { opacity: 0; }
}

/* Close button */
.gate-modal__close {
  position: absolute;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.gate-modal__close:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

/* Mobile */
@media (max-width: 768px) {
  .gate-modal__content {
    padding: 32px 24px;
  }
}
```

#### API

```tsx
type GateStep = 'email' | 'otp' | 'verified' | 'error';

interface GateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (user: VerifiedUser) => void;
  initialStep?: GateStep;
}

// Usage
<GateModal
  isOpen={showGate}
  onClose={() => setShowGate(false)}
  onVerified={handleVerified}
/>
```

#### Gold Usage
- Verified state: Gold checkmark animation
- Submit button: Gold when form is valid

---

### Component 5: EmailInput

.edu email capture with validation.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input Style | **Floating Label** | Clean, contextual, Material-inspired |
| Validation Timing | **Debounced Live** | Check after typing pause |
| Error Display | **Below Input** | Clear, friendly, not punishing |

#### Full CSS Specification

```css
/* === EMAIL INPUT === */

.email-input {
  position: relative;
  width: 100%;
}

.email-input__field {
  width: 100%;
  padding: 20px 16px 8px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text-primary);
  transition: all 150ms ease-out;
}

.email-input__field::placeholder {
  color: transparent;
}

.email-input__field:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

/* Floating label */
.email-input__label {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text-tertiary);
  pointer-events: none;
  transition: all 150ms ease-out;
}

.email-input__field:focus + .email-input__label,
.email-input__field:not(:placeholder-shown) + .email-input__label {
  top: 12px;
  transform: translateY(0);
  font-size: 12px;
  color: var(--color-text-secondary);
}

/* Valid state */
.email-input--valid .email-input__field {
  border-color: var(--color-success);
}

.email-input--valid .email-input__label {
  color: var(--color-success);
}

/* Error state */
.email-input--error .email-input__field {
  border-color: var(--color-error);
}

.email-input--error .email-input__label {
  color: var(--color-error);
}

/* Error message */
.email-input__error {
  margin-top: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-error);
  text-align: left;
}

/* Validation indicator */
.email-input__indicator {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.email-input--valid .email-input__indicator--valid,
.email-input--error .email-input__indicator--error {
  opacity: 1;
}
```

#### API

```tsx
interface EmailInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

// Usage
<EmailInput
  value={email}
  onChange={setEmail}
  onValidChange={setEmailValid}
  error={emailError}
  autoFocus
/>
```

#### Validation Rules
- Must be valid email format
- Must end with .edu
- Debounce: 500ms after typing stops

#### Gold Usage
- None - neutral form input

---

### Component 6: OTPInput

6-digit verification code entry.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input Style | **6 Separate Boxes** | Clear, mobile-friendly, auto-advance |
| Auto-behavior | **Auto-advance + Paste Detection** | Smooth flow, accessibility |
| Error State | **Shake + Clear** | Noticeable, ready for retry |

#### Full CSS Specification

```css
/* === OTP INPUT === */

.otp-input {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.otp-input__digit {
  width: 48px;
  height: 56px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  font-family: var(--font-mono);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  text-align: center;
  transition: all 150ms ease-out;
  caret-color: var(--color-accent-gold);
}

.otp-input__digit:focus {
  outline: none;
  border-color: var(--color-border-focus);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
}

/* Filled state */
.otp-input__digit--filled {
  border-color: var(--color-text-tertiary);
}

/* Current focus */
.otp-input__digit--active {
  border-color: var(--color-text-primary);
}

/* Error state - shake */
.otp-input--error {
  animation: otp-shake 200ms ease-out;
}

@keyframes otp-shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-8px); }
  75% { transform: translateX(8px); }
}

.otp-input--error .otp-input__digit {
  border-color: var(--color-error);
}

/* Success state */
.otp-input--success .otp-input__digit {
  border-color: var(--color-accent-gold);
}

/* Error message */
.otp-input__error {
  margin-top: 16px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-error);
  text-align: center;
}

/* Resend link */
.otp-input__resend {
  margin-top: 24px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.otp-input__resend-link {
  color: var(--color-text-primary);
  text-decoration: underline;
  cursor: pointer;
  transition: color 150ms ease-out;
}

.otp-input__resend-link:hover {
  color: var(--color-accent-gold);
}

.otp-input__resend-link--disabled {
  color: var(--color-text-tertiary);
  cursor: not-allowed;
}

/* Mobile */
@media (max-width: 400px) {
  .otp-input__digit {
    width: 40px;
    height: 48px;
    font-size: 20px;
  }
}
```

#### API

```tsx
interface OTPInputProps {
  length?: number; // Default 6
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

// Usage
<OTPInput
  value={otp}
  onChange={setOtp}
  onComplete={handleVerify}
  error={otpError}
  autoFocus
/>
```

#### Behavior
- Auto-advance to next box on entry
- Backspace moves to previous box
- Paste detection fills all boxes
- No auto-submit (user verifies visually first)

#### Gold Usage
- Success state: Gold borders
- Caret color: Gold

---

### Component 7: UserTypeSelector

Participant vs Leader path selection.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | **Question Flow** | Natural language, guides user |
| Visual Treatment | **Subtle Icons** | Small icons, text focus |

#### Full CSS Specification

```css
/* === USER TYPE SELECTOR === */

.user-type-selector {
  width: 100%;
  max-width: 400px;
  margin: 0 auto;
}

.user-type-selector__question {
  font-family: var(--font-body);
  font-size: 18px;
  color: var(--color-text-primary);
  text-align: center;
  margin-bottom: 32px;
}

.user-type-selector__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.user-type-selector__option {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.user-type-selector__option:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-default);
}

.user-type-selector__option:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Selected state */
.user-type-selector__option--selected {
  border-color: var(--color-text-primary);
  background: var(--color-bg-hover);
}

/* Icon */
.user-type-selector__icon {
  width: 24px;
  height: 24px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.user-type-selector__option--selected .user-type-selector__icon {
  color: var(--color-text-primary);
}

/* Content */
.user-type-selector__content {
  flex: 1;
}

.user-type-selector__label {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.user-type-selector__description {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* Radio indicator */
.user-type-selector__radio {
  width: 20px;
  height: 20px;
  border: 2px solid var(--color-border-default);
  border-radius: 50%;
  flex-shrink: 0;
  position: relative;
  transition: all 150ms ease-out;
}

.user-type-selector__option--selected .user-type-selector__radio {
  border-color: var(--color-text-primary);
}

.user-type-selector__option--selected .user-type-selector__radio::after {
  content: '';
  position: absolute;
  inset: 4px;
  background: var(--color-text-primary);
  border-radius: 50%;
}
```

#### API

```tsx
type UserType = 'participant' | 'leader';

interface UserTypeSelectorProps {
  value?: UserType;
  onChange: (type: UserType) => void;
}

// Usage
<UserTypeSelector
  value={userType}
  onChange={setUserType}
/>
```

#### Copy
- Question: "Are you leading an organization or club?"
- Participant: "No, I'm looking to join" / "Find and join spaces that match your interests"
- Leader: "Yes, I'm a leader" / "Claim your organization's space and invite members"

#### Gold Usage
- None - neutral selection

---

### Component 8: InterestTagCloud

Visual interest selection for space recommendations.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout Style | **Category Groups** | Organized, clear mental model |
| Selection Style | **Outline → Fill** | Clear state change (gray fill, not gold) |
| Minimum/Maximum | **Minimum Only (3)** | Ensures recommendations without restriction |

#### Full CSS Specification

```css
/* === INTEREST TAG CLOUD === */

.interest-cloud {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
}

.interest-cloud__header {
  text-align: center;
  margin-bottom: 32px;
}

.interest-cloud__title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.interest-cloud__subtitle {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-secondary);
}

/* Category groups */
.interest-cloud__category {
  margin-bottom: 24px;
}

.interest-cloud__category-label {
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 12px;
}

.interest-cloud__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

/* Individual tag */
.interest-cloud__tag {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.interest-cloud__tag:hover {
  border-color: var(--color-border-default);
  color: var(--color-text-primary);
}

.interest-cloud__tag:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Selected state - gray fill, NOT gold */
.interest-cloud__tag--selected {
  background: var(--color-bg-elevated);
  border-color: var(--color-text-tertiary);
  color: var(--color-text-primary);
}

/* Counter */
.interest-cloud__counter {
  text-align: center;
  margin-top: 24px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.interest-cloud__counter--met {
  color: var(--color-text-secondary);
}

/* Mobile */
@media (max-width: 768px) {
  .interest-cloud__tags {
    justify-content: center;
  }
}
```

#### API

```tsx
interface InterestCategory {
  label: string;
  tags: string[];
}

interface InterestTagCloudProps {
  categories: InterestCategory[];
  selected: string[];
  onChange: (selected: string[]) => void;
  minimum?: number; // Default 3
}

// Usage
<InterestTagCloud
  categories={[
    { label: 'Academic', tags: ['CS', 'Engineering', 'Biology', 'Business', 'Arts'] },
    { label: 'Social', tags: ['Greek Life', 'Sports', 'Gaming', 'Music'] },
    { label: 'Career', tags: ['Startups', 'Research', 'Internships'] },
    { label: 'Lifestyle', tags: ['Fitness', 'Food', 'Photography'] },
  ]}
  selected={interests}
  onChange={setInterests}
  minimum={3}
/>
```

#### Gold Usage
- None - selections are gray, not gold (gold reserved for activity)

---

### Component 9: SpaceRecommendationCard

Space preview with join CTA.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Card Style | **Rich** | Full context, cold start safe |
| Activity Indicator | **Member Count Only** | Cold start reliable |
| Join Button | **"Join"** | Simple, clear |

#### Full CSS Specification

```css
/* === SPACE RECOMMENDATION CARD === */

.space-rec-card {
  display: flex;
  flex-direction: column;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  overflow: hidden;
  transition: all 200ms ease-out;
}

.space-rec-card:hover {
  border-color: var(--color-border-default);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
}

/* Banner image */
.space-rec-card__banner {
  width: 100%;
  height: 100px;
  object-fit: cover;
  background: linear-gradient(
    135deg,
    var(--color-bg-elevated) 0%,
    var(--color-bg-card) 100%
  );
}

/* Content */
.space-rec-card__content {
  padding: 16px;
}

/* Header row */
.space-rec-card__header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

/* Space icon */
.space-rec-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.space-rec-card__icon-emoji {
  font-size: 20px;
}

/* Title area */
.space-rec-card__title-area {
  flex: 1;
  min-width: 0;
}

.space-rec-card__name {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.space-rec-card__members {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

/* Description */
.space-rec-card__description {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Join button */
.space-rec-card__join {
  width: 100%;
  padding: 12px;
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.space-rec-card__join:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-default);
}

.space-rec-card__join:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Joining state */
.space-rec-card__join--joining {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Joined state */
.space-rec-card__join--joined {
  background: var(--color-success-bg);
  border-color: var(--color-success);
  color: var(--color-success);
}
```

#### API

```tsx
interface SpaceRecommendation {
  id: string;
  name: string;
  emoji?: string;
  bannerUrl?: string;
  description: string;
  memberCount: number;
}

interface SpaceRecommendationCardProps {
  space: SpaceRecommendation;
  onJoin: (spaceId: string) => void;
  joining?: boolean;
  joined?: boolean;
}

// Usage
<SpaceRecommendationCard
  space={{
    id: 'cs-club',
    name: 'Computer Science Club',
    emoji: '💻',
    description: 'Weekly coding sessions, hackathons, and tech talks for CS enthusiasts.',
    memberCount: 127,
  }}
  onJoin={handleJoin}
/>
```

#### Gold Usage
- None - join button is gray, not gold (reserving gold for activity/presence)

---

### Component 10: OnboardingComplete

Celebration and redirect to activated state.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Celebration Level | **Gold Pulse** | On-brand, premium celebration |
| CTA Copy | **"Enter Your Space"** | Clear destination |
| Timing | **Animation First (1s)** | Full celebration, then user clicks |

#### Full CSS Specification

```css
/* === ONBOARDING COMPLETE === */

.onboarding-complete {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 400px;
}

/* Gold pulse animation */
.onboarding-complete__pulse {
  position: relative;
  width: 80px;
  height: 80px;
  margin-bottom: 32px;
}

.onboarding-complete__pulse-ring {
  position: absolute;
  inset: 0;
  border: 2px solid var(--color-accent-gold);
  border-radius: 50%;
  animation: pulse-expand 700ms ease-out forwards;
}

@keyframes pulse-expand {
  0% {
    transform: scale(0);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.onboarding-complete__pulse-ring:nth-child(2) {
  animation-delay: 100ms;
}

.onboarding-complete__pulse-ring:nth-child(3) {
  animation-delay: 200ms;
}

/* Checkmark */
.onboarding-complete__check {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-accent-gold);
  opacity: 0;
  animation: check-appear 300ms ease-out 400ms forwards;
}

@keyframes check-appear {
  from {
    opacity: 0;
    transform: scale(0.5);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.onboarding-complete__check-icon {
  width: 40px;
  height: 40px;
}

/* Text content */
.onboarding-complete__content {
  opacity: 0;
  animation: content-appear 300ms ease-out 600ms forwards;
}

@keyframes content-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onboarding-complete__title {
  font-family: var(--font-display);
  font-size: 28px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 8px;
}

.onboarding-complete__subtitle {
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text-secondary);
  margin-bottom: 32px;
}

/* CTA */
.onboarding-complete__cta {
  padding: 16px 40px;
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  opacity: 0;
  animation: cta-appear 300ms ease-out 800ms forwards;
  transition: all 200ms ease-out;
}

@keyframes cta-appear {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.onboarding-complete__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.onboarding-complete__cta:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}
```

#### API

```tsx
interface OnboardingCompleteProps {
  spaceName: string;
  onEnter: () => void;
}

// Usage
<OnboardingComplete
  spaceName="Computer Science Club"
  onEnter={() => navigate(`/spaces/${spaceId}`)}
/>
```

#### Animation Timeline
```
0ms     - Component mounts
0-700ms - Gold pulse rings expand
400ms   - Checkmark appears (scale)
600ms   - Title + subtitle fade in
800ms   - CTA button appears
User    - Clicks "Enter Your Space"
```

#### Gold Usage
- Pulse rings: Gold border
- Checkmark: Gold color
- CTA button: Gold background

---

## GATE & ONBOARDING GOLD SUMMARY

| Component | Gold Moment | Condition |
|-----------|-------------|-----------|
| LandingHero | CTA button | Always |
| LandingHero | Ambient glow | Background (0.03 opacity) |
| ActivityConstellation | Creation nodes | When building activity |
| GateModal | Verified checkmark | On successful verification |
| GateModal | Submit button | When form is valid |
| OTPInput | Success borders | On correct code |
| OTPInput | Caret color | Always |
| OnboardingComplete | Pulse rings | Celebration animation |
| OnboardingComplete | Checkmark | Celebration |
| OnboardingComplete | CTA button | Always |

**Total Gold Budget:** ~2-3% during landing, ~1% during gate/onboarding flow, 5% burst at completion celebration.

---

---

## DISCOVERY & JOINING COMPONENT SPECIFICATIONS

These components implement the Discovery & Joining pattern - how users find and join spaces after onboarding.

**Upstream Alignment:**
- PHILOSOPHY: Discovery Without Overwhelm, 2am Energy
- PRINCIPLES: Organized Chaos, Reveal Over Dump, Warmth Through Activity

**Cold Start Safe:** All components designed to work gracefully with minimal data.

---

### Component 1: FilterChipBar

Radio-style filter chips for browse navigation.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Chip Shape | **Pill** | Soft, iOS-like, 2am energy |
| Selected State | **Dot Indicator** | Minimal, Apple-like elegance |
| Spacing & Scroll | **Horizontal Scroll** | Mobile-friendly, all visible on desktop |

#### Full CSS Specification

```css
/* === FILTER CHIP BAR === */

.filter-chip-bar {
  display: flex;
  gap: 8px;
  padding: 0 16px;
  overflow-x: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
  scroll-snap-type: x mandatory;
}

.filter-chip-bar::-webkit-scrollbar {
  display: none;
}

/* Fade hint on mobile */
.filter-chip-bar::after {
  content: '';
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  width: 40px;
  background: linear-gradient(to right, transparent, var(--color-bg-page));
  pointer-events: none;
}

@media (min-width: 768px) {
  .filter-chip-bar::after {
    display: none;
  }
}

/* Individual chip */
.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 9999px; /* Full pill */
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-secondary);
  white-space: nowrap;
  cursor: pointer;
  transition: all 150ms ease-out;
  scroll-snap-align: start;
}

.filter-chip:hover {
  border-color: var(--color-border-default);
  color: var(--color-text-primary);
}

.filter-chip:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Selected state with dot */
.filter-chip--selected {
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
}

.filter-chip__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-primary);
  opacity: 0;
  transform: scale(0);
  transition: all 150ms ease-out;
}

.filter-chip--selected .filter-chip__dot {
  opacity: 1;
  transform: scale(1);
}

/* Smart chip (affiliation) - slightly different style */
.filter-chip--smart {
  background: var(--color-bg-card);
  border-style: dashed;
}
```

#### API

```tsx
interface FilterChip {
  id: string;
  label: string;
  isSmart?: boolean; // For affiliation chips
}

interface FilterChipBarProps {
  chips: FilterChip[];
  selected: string;
  onSelect: (id: string) => void;
}

// Usage
<FilterChipBar
  chips={[
    { id: 'for-you', label: 'For You' },
    { id: 'all', label: 'All' },
    { id: 'student-org', label: 'Student Org' },
    { id: 'greek', label: 'Greek' },
    { id: 'residential', label: 'Residential' },
    { id: 'uni', label: 'Uni' },
    { id: 'ellicott', label: 'Ellicott', isSmart: true },
  ]}
  selected="for-you"
  onSelect={setFilter}
/>
```

#### Gold Usage
- None - neutral navigation

---

### Component 2: SpaceCard

Individual space display in the browse grid.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Card Layout | **Vertical Stack** | Works in 3-column grid |
| Icon Treatment | **Squircle** | iOS-style, premium, distinct from avatars |
| Description Truncation | **2 Lines** | Balance of context and compactness |
| Member Count Display | **Icon + Text** | Scannable without being prominent |
| Join Button Position | **No Button** | Click to preview, join there |
| "New" Badge Position | **After Name** | Natural reading flow |

#### Full CSS Specification

```css
/* === SPACE CARD === */

.space-card {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.space-card:hover {
  border-color: var(--color-border-default);
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.space-card:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Icon - Squircle */
.space-card__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px; /* Squircle approximation */
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
  /* iOS-style continuous corners */
  mask-image: url("data:image/svg+xml,..."); /* Squircle mask if needed */
}

.space-card__icon-emoji {
  font-size: 24px;
}

.space-card__icon-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: inherit;
}

/* Header with name and badge */
.space-card__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.space-card__name {
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* "New" badge - inline after name */
.space-card__badge {
  padding: 2px 6px;
  background: var(--color-bg-elevated);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.02em;
  flex-shrink: 0;
}

/* Member count */
.space-card__members {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.space-card__members-icon {
  width: 14px;
  height: 14px;
  opacity: 0.7;
}

/* Description - 2 lines */
.space-card__description {
  font-family: var(--font-body);
  font-size: 14px;
  line-height: 1.5;
  color: var(--color-text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Grid container */
.space-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

@media (max-width: 1024px) {
  .space-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .space-grid {
    grid-template-columns: 1fr;
  }
}
```

#### API

```tsx
interface SpaceCardProps {
  space: {
    id: string;
    name: string;
    emoji?: string;
    iconUrl?: string;
    memberCount: number;
    description: string;
    isNew?: boolean; // < 10 members
  };
  onClick: (spaceId: string) => void;
}

// Usage
<SpaceCard
  space={{
    id: 'cs-club',
    name: 'Computer Science Club',
    emoji: '💻',
    memberCount: 127,
    description: 'Weekly coding sessions, hackathons, and tech talks for CS enthusiasts.',
    isNew: false,
  }}
  onClick={openPreview}
/>
```

#### Gold Usage
- None - cards are neutral, gold reserved for preview/join actions

---

### Component 3: SpaceCardSkeleton

Loading state for space cards.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Skeleton Style | **Pulse** | Gentle, ambient, HIVE-aligned |

#### Full CSS Specification

```css
/* === SPACE CARD SKELETON === */

.space-card-skeleton {
  display: flex;
  flex-direction: column;
  padding: 16px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
}

.space-card-skeleton__element {
  background: var(--color-bg-elevated);
  border-radius: 4px;
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}

.space-card-skeleton__icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  margin-bottom: 12px;
}

.space-card-skeleton__name {
  height: 20px;
  width: 70%;
  margin-bottom: 8px;
}

.space-card-skeleton__members {
  height: 14px;
  width: 40%;
  margin-bottom: 12px;
}

.space-card-skeleton__description {
  height: 14px;
  width: 100%;
  margin-bottom: 6px;
}

.space-card-skeleton__description:last-child {
  width: 80%;
}
```

#### API

```tsx
// Usage - typically render 6-9 skeletons
<div className="space-grid">
  {Array.from({ length: 9 }).map((_, i) => (
    <SpaceCardSkeleton key={i} />
  ))}
</div>
```

#### Gold Usage
- None

---

### Component 4: SearchInput

Integrated search in browse header.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Input Style | **Filled** | Subtle background, inviting |
| Clear Button | **On Content** | Appears when text entered |
| Search Icon Position | **Left Inside** | Universal pattern |

#### Full CSS Specification

```css
/* === SEARCH INPUT === */

.search-input {
  position: relative;
  width: 100%;
  max-width: 400px;
}

.search-input__field {
  width: 100%;
  padding: 10px 40px 10px 40px;
  background: var(--color-bg-card);
  border: 1px solid transparent;
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-primary);
  transition: all 150ms ease-out;
}

.search-input__field::placeholder {
  color: var(--color-text-tertiary);
}

.search-input__field:hover {
  border-color: var(--color-border-subtle);
}

.search-input__field:focus {
  outline: none;
  border-color: var(--color-border-default);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.05);
}

/* Search icon - left */
.search-input__icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
  pointer-events: none;
}

/* Clear button - right, appears on content */
.search-input__clear {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  opacity: 0;
  transition: all 150ms ease-out;
}

.search-input__field:not(:placeholder-shown) + .search-input__icon + .search-input__clear {
  opacity: 1;
}

.search-input__clear:hover {
  background: var(--color-bg-hover);
  color: var(--color-text-secondary);
}

.search-input__clear-icon {
  width: 14px;
  height: 14px;
}
```

#### API

```tsx
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
}

// Usage
<SearchInput
  value={searchQuery}
  onChange={setSearchQuery}
  onClear={() => setSearchQuery('')}
  placeholder="Search spaces..."
/>
```

#### Gold Usage
- None - neutral input

---

### Component 5: SpacePreviewModal

Detail view before joining a space.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Modal Size | **Medium (500px)** | Comfortable reading width |
| Banner Treatment | **Full Width** | Edge-to-edge, immersive |
| Close Button Style | **X in Corner** | Standard, accessible |

#### Full CSS Specification

```css
/* === SPACE PREVIEW MODAL === */

.space-preview-modal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

/* Backdrop */
.space-preview-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  animation: backdrop-fade 150ms ease-out;
}

@keyframes backdrop-fade {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Modal container */
.space-preview-modal__container {
  position: relative;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 20px;
  overflow: hidden;
  animation: modal-enter 200ms ease-out;
}

@keyframes modal-enter {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Banner - full width */
.space-preview-modal__banner {
  width: 100%;
  height: 140px;
  object-fit: cover;
  background: linear-gradient(
    135deg,
    var(--color-bg-elevated) 0%,
    var(--color-bg-card) 100%
  );
}

/* Close button */
.space-preview-modal__close {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  border: none;
  border-radius: 8px;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 150ms ease-out;
  z-index: 1;
}

.space-preview-modal__close:hover {
  background: rgba(0, 0, 0, 0.7);
}

/* Content */
.space-preview-modal__content {
  padding: 24px;
}

/* Icon overlapping banner */
.space-preview-modal__icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: var(--color-bg-elevated);
  border: 3px solid var(--color-bg-card);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: -40px;
  margin-bottom: 16px;
}

.space-preview-modal__icon-emoji {
  font-size: 32px;
}

/* Name */
.space-preview-modal__name {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 16px;
}

/* Description */
.space-preview-modal__description {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

/* Tags */
.space-preview-modal__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 24px;
}

.space-preview-modal__tag {
  padding: 4px 10px;
  background: var(--color-bg-elevated);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
}

/* Divider */
.space-preview-modal__divider {
  height: 1px;
  background: var(--color-border-subtle);
  margin: 24px 0;
}

/* Footer with social proof + join */
.space-preview-modal__footer {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Mobile: full-screen bottom sheet */
@media (max-width: 640px) {
  .space-preview-modal {
    align-items: flex-end;
    padding: 0;
  }

  .space-preview-modal__container {
    max-width: 100%;
    max-height: 85vh;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
  }
}
```

#### API

```tsx
interface SpacePreviewModalProps {
  space: {
    id: string;
    name: string;
    emoji?: string;
    bannerUrl?: string;
    description: string;
    tags: string[];
    memberCount: number;
    mutualMembers?: Array<{ id: string; avatarUrl: string; name: string }>;
  };
  isOpen: boolean;
  onClose: () => void;
  onJoin: (spaceId: string) => void;
  isMember?: boolean;
  isJoining?: boolean;
}

// Usage
<SpacePreviewModal
  space={selectedSpace}
  isOpen={showPreview}
  onClose={() => setShowPreview(false)}
  onJoin={handleJoin}
/>
```

#### Gold Usage
- Join button when transitioning to "Joined" (brief moment)

---

### Component 6: AdaptiveSocialProof

Shows mutual members or falls back to member count.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Avatar Stack Style | **Overlapping** | Compact, social feel |
| Avatar Size | **Medium (32px)** | Recognizable without dominating |

#### Full CSS Specification

```css
/* === ADAPTIVE SOCIAL PROOF === */

.social-proof {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Avatar stack */
.social-proof__avatars {
  display: flex;
}

.social-proof__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
  background: var(--color-bg-elevated);
  overflow: hidden;
  margin-left: -10px;
}

.social-proof__avatar:first-child {
  margin-left: 0;
}

.social-proof__avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Overflow indicator */
.social-proof__overflow {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
  background: var(--color-bg-elevated);
  margin-left: -10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text-secondary);
}

/* Text */
.social-proof__text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* Fallback - count only */
.social-proof--count-only {
  gap: 0;
}

.social-proof--count-only .social-proof__text {
  color: var(--color-text-tertiary);
}
```

#### API

```tsx
interface AdaptiveSocialProofProps {
  mutualMembers?: Array<{ id: string; avatarUrl: string; name: string }>;
  totalMemberCount: number;
  maxAvatars?: number; // Default 5
}

// Usage
<AdaptiveSocialProof
  mutualMembers={space.mutualMembers}
  totalMemberCount={space.memberCount}
/>

// Renders either:
// [👤👤👤] "5 people you know are members"
// or
// "127 members"
```

#### Gold Usage
- None

---

### Component 7: JoinButton

Multi-state button for joining spaces.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Button Style | **Outline → Filled** | Join is outline, Joined is filled |
| Loading State | **Spinner Replace** | Clean, compact |
| Success State | **Checkmark + Text** | "Joined ✓" unmistakable |

#### Full CSS Specification

```css
/* === JOIN BUTTON === */

.join-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 24px;
  min-width: 120px;
  background: transparent;
  border: 1px solid var(--color-border-default);
  border-radius: 10px;
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.join-button:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-text-tertiary);
}

.join-button:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Loading state */
.join-button--loading {
  pointer-events: none;
}

.join-button__spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--color-text-tertiary);
  border-top-color: var(--color-text-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Joined state */
.join-button--joined {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-subtle);
  color: var(--color-text-secondary);
  pointer-events: none;
}

.join-button__checkmark {
  width: 16px;
  height: 16px;
  color: var(--color-success);
}

/* Enter state (after joined) */
.join-button--enter {
  background: var(--color-bg-elevated);
  border-color: var(--color-text-primary);
  color: var(--color-text-primary);
  pointer-events: auto;
}

.join-button--enter:hover {
  background: var(--color-bg-hover);
}

/* Full width variant */
.join-button--full {
  width: 100%;
}

/* Request variant */
.join-button--request {
  /* Same as default but different label */
}

.join-button--requested {
  background: var(--color-bg-elevated);
  border-color: var(--color-border-subtle);
  color: var(--color-text-tertiary);
  pointer-events: none;
}
```

#### API

```tsx
type JoinButtonState = 'idle' | 'loading' | 'joined' | 'enter' | 'request' | 'requested';

interface JoinButtonProps {
  state: JoinButtonState;
  onClick: () => void;
  fullWidth?: boolean;
}

// Usage
<JoinButton
  state={joinState}
  onClick={handleJoin}
  fullWidth
/>

// State labels:
// idle: "Join"
// loading: [spinner]
// joined: "Joined ✓"
// enter: "Enter"
// request: "Request to Join"
// requested: "Requested ✓"
```

#### Gold Usage
- None - join is not a gold moment (preview provides context first)

---

### Component 8: WelcomeBanner

Dismissible first-time banner in space.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Banner Position | **Top Fixed** | Always visible until dismissed |
| Dismiss Behavior | **"Got it" Button** | Friendlier than X |

#### Full CSS Specification

```css
/* === WELCOME BANNER === */

.welcome-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-bg-elevated);
  border-bottom: 1px solid var(--color-border-subtle);
}

/* Emoji/icon */
.welcome-banner__icon {
  font-size: 20px;
  flex-shrink: 0;
}

/* Content */
.welcome-banner__content {
  flex: 1;
  min-width: 0;
}

.welcome-banner__title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.welcome-banner__message {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Dismiss button */
.welcome-banner__dismiss {
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

.welcome-banner__dismiss:hover {
  background: var(--color-bg-hover);
  border-color: var(--color-border-default);
}

/* Exit animation */
.welcome-banner--exiting {
  animation: banner-exit 200ms ease-out forwards;
}

@keyframes banner-exit {
  to {
    opacity: 0;
    height: 0;
    padding: 0;
    margin: 0;
  }
}
```

#### API

```tsx
interface WelcomeBannerProps {
  spaceName: string;
  message?: string; // Leader message or fallback to description
  onDismiss: () => void;
}

// Usage
<WelcomeBanner
  spaceName="Computer Science Club"
  message="Welcome! We meet every Thursday at 7pm in Davis Hall."
  onDismiss={handleDismiss}
/>
```

#### Gold Usage
- None

---

### Component 9: EmptySpaceWelcome

Full-screen welcome for empty spaces (cold start).

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | **Full Bleed** | No empty void visible |
| CTA Style | **Gold Button** | Achievement moment - being first |

#### Full CSS Specification

```css
/* === EMPTY SPACE WELCOME === */

.empty-space-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 48px 24px;
  min-height: 400px;
  background: var(--color-bg-page);
}

/* Large icon */
.empty-space-welcome__icon {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background: var(--color-bg-elevated);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;
}

.empty-space-welcome__icon-emoji {
  font-size: 40px;
}

/* Title */
.empty-space-welcome__title {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
}

/* Description */
.empty-space-welcome__description {
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  color: var(--color-text-secondary);
  max-width: 400px;
  margin-bottom: 32px;
}

/* Divider */
.empty-space-welcome__divider {
  width: 60px;
  height: 1px;
  background: var(--color-border-subtle);
  margin-bottom: 32px;
}

/* Founding text */
.empty-space-welcome__founding {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin-bottom: 24px;
}

/* Gold CTA */
.empty-space-welcome__cta {
  padding: 14px 32px;
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.empty-space-welcome__cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(255, 215, 0, 0.3);
}

.empty-space-welcome__cta:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

/* Skip link */
.empty-space-welcome__skip {
  margin-top: 16px;
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  transition: color 150ms ease-out;
}

.empty-space-welcome__skip:hover {
  color: var(--color-text-secondary);
}
```

#### API

```tsx
interface EmptySpaceWelcomeProps {
  space: {
    name: string;
    emoji?: string;
    description: string;
  };
  onSayHello: () => void;
  onSkip: () => void;
}

// Usage
<EmptySpaceWelcome
  space={{
    name: 'Computer Science Club',
    emoji: '💻',
    description: 'Weekly coding sessions, hackathons, and tech talks.',
  }}
  onSayHello={openComposerWithPrompt}
  onSkip={showEmptyChat}
/>
```

#### Gold Usage
- "Say Hello" CTA: Gold background
- Appropriate gold moment - being first IS an achievement

---

### Component 10: NoResultsState

Empty search results feedback.

#### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Illustration | **Icon Only** | Clean, not cute |
| Suggestions Display | **Chips** | Clickable, helpful recovery |

#### Full CSS Specification

```css
/* === NO RESULTS STATE === */

.no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 48px 24px;
}

/* Icon */
.no-results__icon {
  width: 48px;
  height: 48px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
  opacity: 0.5;
}

/* Message */
.no-results__message {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-secondary);
  margin-bottom: 24px;
}

.no-results__query {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Suggestions */
.no-results__suggestions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.no-results__suggestions-label {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
}

.no-results__chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
}

.no-results__chip {
  padding: 6px 14px;
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 9999px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.no-results__chip:hover {
  border-color: var(--color-border-default);
  color: var(--color-text-primary);
}

/* Clear link */
.no-results__clear {
  margin-top: 16px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
}

.no-results__clear:hover {
  color: var(--color-text-secondary);
}
```

#### API

```tsx
interface NoResultsStateProps {
  query: string;
  suggestions?: string[];
  onSuggestionClick: (suggestion: string) => void;
  onClear: () => void;
}

// Usage
<NoResultsState
  query="quantum computing"
  suggestions={['Physics', 'CS Club', 'Research']}
  onSuggestionClick={setSearchQuery}
  onClear={() => setSearchQuery('')}
/>
```

#### Gold Usage
- None

---

## DISCOVERY & JOINING GOLD SUMMARY

| Component | Gold Moment | Condition |
|-----------|-------------|-----------|
| FilterChipBar | None | - |
| SpaceCard | None | - |
| SpaceCardSkeleton | None | - |
| SearchInput | None | - |
| SpacePreviewModal | None | - |
| AdaptiveSocialProof | None | - |
| JoinButton | None | - |
| WelcomeBanner | None | - |
| EmptySpaceWelcome | "Say Hello" CTA | Always (achievement moment) |
| NoResultsState | None | - |

**Total Gold Budget:** ~1% during browse, only in EmptySpaceWelcome CTA. Discovery is about finding, not achieving. Gold reserved for the moment of being first.

---

# COMMAND & SEARCH COMPONENT SPECIFICATIONS

Keyboard-driven navigation and global search infrastructure.

---

## COMPONENT 1: CommandPalette

Root container with backdrop and modal.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Container | Centered modal | Most familiar, works all viewports |
| Size | 560×480px | Balanced: fits content, not overwhelming |
| Backdrop | Dark overlay + light blur | Focus without heavy rendering |
| Corner radius | 16px | Matches card system |
| Shadow | Deep (24px 48px) | Creates clear layer separation |

### Full CSS Specification

```css
/* ========================================
   COMMAND PALETTE ROOT
   Centered modal with backdrop
   ======================================== */

/* Backdrop overlay */
.command-palette-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;

  /* Animation */
  opacity: 0;
  transition: opacity 150ms ease-out;
}

.command-palette-backdrop--visible {
  opacity: 1;
}

/* Modal container */
.command-palette {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0.96);

  /* Sizing */
  width: 560px;
  max-width: calc(100vw - 32px);
  max-height: 480px;

  /* Visual */
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  overflow: hidden;

  /* Stack */
  z-index: 101;

  /* Animation */
  opacity: 0;
  transition: transform 200ms ease-out, opacity 200ms ease-out;
}

.command-palette--visible {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}

/* Internal layout */
.command-palette__inner {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 480px;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .command-palette {
    width: calc(100vw - 24px);
    max-height: 70vh;
    top: 20%;
    transform: translate(-50%, 0) scale(0.96);
  }

  .command-palette--visible {
    transform: translate(-50%, 0) scale(1);
  }
}
```

### API

```tsx
interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

// Usage
<CommandPalette isOpen={isOpen} onClose={handleClose}>
  <CommandPaletteInput ... />
  <CommandPaletteResults ... />
</CommandPalette>
```

### Gold Usage
- None (infrastructure component)

---

## COMPONENT 2: CommandPaletteInput

Search input with icon and clear button.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Icon both sides | ⌘ left (shortcut hint), X right (clear) |
| Height | 56px | Primary input prominence |
| Font size | 16px | Readable, prevents zoom on mobile |
| Placeholder | "Search spaces, people, tools..." | Teaches searchable scope |
| Border | Bottom only | Separates from results |

### Full CSS Specification

```css
/* ========================================
   COMMAND PALETTE INPUT
   Primary search field
   ======================================== */

.command-input {
  position: relative;
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid var(--color-border-subtle);
  flex-shrink: 0;
}

/* Shortcut icon (left) */
.command-input__shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-right: 12px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

.command-input__shortcut svg {
  width: 16px;
  height: 16px;
}

/* Text input */
.command-input__field {
  flex: 1;
  height: 100%;
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-body);
  font-size: 16px;
  color: var(--color-text-primary);
  caret-color: var(--color-text-primary);
}

.command-input__field::placeholder {
  color: var(--color-text-tertiary);
}

/* Clear button (right) */
.command-input__clear {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  margin-left: 12px;
  background: var(--color-bg-surface-2);
  border: none;
  border-radius: 6px;
  color: var(--color-text-secondary);
  cursor: pointer;
  opacity: 0;
  transition: opacity 150ms ease-out;
  flex-shrink: 0;
}

.command-input__clear--visible {
  opacity: 1;
}

.command-input__clear:hover {
  color: var(--color-text-primary);
}

.command-input__clear svg {
  width: 14px;
  height: 14px;
}

/* Loading indicator */
.command-input__loading {
  width: 16px;
  height: 16px;
  margin-left: 12px;
  border: 2px solid var(--color-border-subtle);
  border-top-color: var(--color-text-secondary);
  border-radius: 50%;
  animation: command-input-spin 600ms linear infinite;
}

@keyframes command-input-spin {
  to { transform: rotate(360deg); }
}
```

### API

```tsx
interface CommandPaletteInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  isLoading?: boolean;
  autoFocus?: boolean;
}

// Usage
<CommandPaletteInput
  value={query}
  onChange={setQuery}
  onClear={() => setQuery('')}
  placeholder="Search spaces, people, tools..."
  isLoading={isSearching}
  autoFocus
/>
```

### Gold Usage
- None

---

## COMPONENT 3: CommandPaletteResults

Scrollable results container with categories.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Scroll | Custom styled scrollbar | Consistent with dark theme |
| Organization | Grouped by type | Clear category headers |
| Results per category | 3 (with "Show more") | Scannable, expandable |
| Scrollbar width | 4px | Thin, unobtrusive |

### Full CSS Specification

```css
/* ========================================
   COMMAND PALETTE RESULTS
   Scrollable results container
   ======================================== */

.command-results {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: #333 transparent;
}

.command-results::-webkit-scrollbar {
  width: 4px;
}

.command-results::-webkit-scrollbar-track {
  background: transparent;
}

.command-results::-webkit-scrollbar-thumb {
  background: #333;
  border-radius: 2px;
}

.command-results::-webkit-scrollbar-thumb:hover {
  background: #444;
}

/* Results list */
.command-results__list {
  padding: 8px 0;
}

/* Category group */
.command-results__group {
  margin-bottom: 8px;
}

.command-results__group:last-child {
  margin-bottom: 0;
}

/* Stagger animation for results */
.command-results__item {
  opacity: 0;
  transform: translateY(4px);
  animation: command-result-enter 150ms ease-out forwards;
}

.command-results__item:nth-child(1) { animation-delay: 0ms; }
.command-results__item:nth-child(2) { animation-delay: 30ms; }
.command-results__item:nth-child(3) { animation-delay: 60ms; }
.command-results__item:nth-child(4) { animation-delay: 90ms; }
.command-results__item:nth-child(5) { animation-delay: 120ms; }
.command-results__item:nth-child(6) { animation-delay: 150ms; }

@keyframes command-result-enter {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### API

```tsx
interface CommandPaletteResultsProps {
  children: React.ReactNode;
  onKeyboardNavigation: (direction: 'up' | 'down') => void;
}

// Usage
<CommandPaletteResults>
  <CommandCategoryHeader label="Spaces" moreCount={12} />
  <CommandResultItem ... />
  <CommandResultItem ... />
  <CommandResultItem ... />

  <CommandCategoryHeader label="People" moreCount={5} />
  <CommandResultItem ... />
</CommandPaletteResults>
```

### Gold Usage
- None

---

## COMPONENT 4: CommandResultItem

Individual result row with icon, text, and meta.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Icon left, meta right | Clear hierarchy |
| Height | 44px | Scannable |
| Selected state | Background + left border | Clear keyboard navigation |
| Number shortcuts | Circle badges 1-9 | Quick select for power users |

### Full CSS Specification

```css
/* ========================================
   COMMAND RESULT ITEM
   Individual result row
   ======================================== */

.command-result {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  cursor: pointer;
  transition: background-color 100ms ease-out;

  /* Left border for selection indicator */
  border-left: 2px solid transparent;
}

.command-result:hover {
  background: var(--color-bg-surface-1);
}

.command-result--selected {
  background: var(--color-bg-surface-2);
  border-left-color: white;
}

/* Icon */
.command-result__icon {
  width: 24px;
  height: 24px;
  margin-right: 12px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Space icon (squircle) */
.command-result__icon--space {
  border-radius: 6px;
  overflow: hidden;
}

.command-result__icon--space img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Person icon (circle) */
.command-result__icon--person {
  border-radius: 50%;
  overflow: hidden;
}

.command-result__icon--person img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Action icon */
.command-result__icon--action {
  color: var(--color-text-tertiary);
}

.command-result__icon--action svg {
  width: 18px;
  height: 18px;
}

/* Content */
.command-result__content {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.command-result__name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.command-result__badge {
  padding: 2px 6px;
  background: var(--color-bg-surface-2);
  border-radius: 4px;
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
  flex-shrink: 0;
}

/* Meta (right side) */
.command-result__meta {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
  white-space: nowrap;
  margin-left: 12px;
  flex-shrink: 0;
}

/* Keyboard shortcut number */
.command-result__shortcut {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  margin-left: 8px;
  background: var(--color-bg-surface-2);
  border-radius: 50%;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
```

### API

```tsx
type ResultType = 'space' | 'person' | 'tool' | 'message' | 'action';

interface CommandResultItemProps {
  type: ResultType;
  icon: string | React.ReactNode;
  name: string;
  badge?: string;
  meta?: string;
  shortcutNumber?: number; // 1-9
  isSelected?: boolean;
  onClick: () => void;
}

// Usage
<CommandResultItem
  type="space"
  icon="/spaces/cs-club/icon.png"
  name="CS Club"
  badge="Student Org"
  meta="1.2k members"
  shortcutNumber={1}
  isSelected={selectedIndex === 0}
  onClick={() => navigateTo('/spaces/cs-club')}
/>
```

### Gold Usage
- None

---

## COMPONENT 5: CommandCategoryHeader

Section divider with label and optional "Show more".

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Lowercase + divider | Minimal, functional |
| Font | 11px uppercase | Small but readable |
| "Show more" | Text link with count | Informative, actionable |
| Divider | #333 line above | Subtle separation |

### Full CSS Specification

```css
/* ========================================
   COMMAND CATEGORY HEADER
   Section divider with label
   ======================================== */

.command-category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 16px;
  margin-top: 8px;

  /* Divider line */
  border-top: 1px solid #333;
}

.command-category:first-child {
  margin-top: 0;
  border-top: none;
}

/* Label */
.command-category__label {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}

/* Show more link */
.command-category__more {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: color 150ms ease-out;
}

.command-category__more:hover {
  color: var(--color-text-primary);
}
```

### API

```tsx
interface CommandCategoryHeaderProps {
  label: string;
  moreCount?: number;
  onShowMore?: () => void;
}

// Usage
<CommandCategoryHeader
  label="Spaces"
  moreCount={12}
  onShowMore={() => expandCategory('spaces')}
/>
```

### Gold Usage
- None

---

## COMPONENT 6: CommandResultSkeleton

Loading placeholder for results.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Animation | Pulse | Simpler than shimmer, less distracting |
| Structure | Full row | Matches actual result layout |
| Duration | 1.5s | Slow enough to not be distracting |

### Full CSS Specification

```css
/* ========================================
   COMMAND RESULT SKELETON
   Loading placeholder
   ======================================== */

.command-skeleton {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 16px;
  border-left: 2px solid transparent;
}

/* Skeleton pulse animation */
@keyframes command-skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.command-skeleton__bone {
  background: var(--color-bg-surface-2);
  border-radius: 4px;
  animation: command-skeleton-pulse 1.5s ease-in-out infinite;
}

/* Icon placeholder */
.command-skeleton__icon {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  margin-right: 12px;
  flex-shrink: 0;
}

/* Name placeholder (random width) */
.command-skeleton__name {
  height: 14px;
  flex-shrink: 0;
}

.command-skeleton__name--short { width: 100px; }
.command-skeleton__name--medium { width: 140px; }
.command-skeleton__name--long { width: 180px; }

/* Meta placeholder */
.command-skeleton__meta {
  height: 12px;
  width: 50px;
  margin-left: auto;
  flex-shrink: 0;
}

/* Stagger animation delays */
.command-skeleton:nth-child(1) .command-skeleton__bone { animation-delay: 0ms; }
.command-skeleton:nth-child(2) .command-skeleton__bone { animation-delay: 150ms; }
.command-skeleton:nth-child(3) .command-skeleton__bone { animation-delay: 300ms; }
```

### API

```tsx
interface CommandResultSkeletonProps {
  count?: number; // How many skeletons to show
}

// Usage
<CommandResultSkeleton count={3} />
```

### Gold Usage
- None

---

## COMPONENT 7: CommandEmptyState

Initial state with recent items or suggestions.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Content | Recent + fallback | Immediately useful, never empty |
| Recent max | 6 items | Scannable |
| Cold start | 3 suggested actions | Actionable for new users |

### Full CSS Specification

```css
/* ========================================
   COMMAND EMPTY STATE
   Recent items or suggestions
   ======================================== */

.command-empty {
  padding: 16px 0;
}

/* Section header */
.command-empty__header {
  padding: 0 16px 8px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}

/* Recent items list */
.command-empty__list {
  display: flex;
  flex-direction: column;
}

/* Suggestion for new users */
.command-empty__suggestions {
  padding: 24px 16px;
  text-align: center;
}

.command-empty__suggestions-title {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 16px;
}

.command-empty__suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Suggestion item */
.command-empty__suggestion {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 16px;
  background: var(--color-bg-surface-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.command-empty__suggestion:hover {
  background: var(--color-bg-surface-2);
  border-color: var(--color-border-default);
}

.command-empty__suggestion-icon {
  width: 18px;
  height: 18px;
  color: var(--color-text-tertiary);
}

.command-empty__suggestion-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
}

/* Keyboard hint at bottom */
.command-empty__hint {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border-subtle);
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
  text-align: center;
}

.command-empty__hint kbd {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px 6px;
  background: var(--color-bg-surface-2);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  margin: 0 2px;
}
```

### API

```tsx
interface RecentItem {
  type: 'space' | 'person' | 'tool';
  id: string;
  name: string;
  icon: string;
}

interface CommandEmptyStateProps {
  recentItems?: RecentItem[];
  onSelectRecent: (item: RecentItem) => void;
  onSuggestionClick: (action: string) => void;
}

// Usage
<CommandEmptyState
  recentItems={recentItems}
  onSelectRecent={handleRecentSelect}
  onSuggestionClick={handleSuggestion}
/>
```

### Gold Usage
- None

---

## COMPONENT 8: CommandNoResults

Empty search results state.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Message + suggestions | Never dead end |
| Visual | Text only | No icon needed (palette is search context) |
| Actions | Browse links | Escape hatches |

### Full CSS Specification

```css
/* ========================================
   COMMAND NO RESULTS
   Empty search state
   ======================================== */

.command-no-results {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  text-align: center;
}

/* Message */
.command-no-results__message {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.command-no-results__query {
  color: var(--color-text-primary);
  font-weight: 500;
}

/* Suggestions */
.command-no-results__suggestions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 16px;
}

.command-no-results__link {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-secondary);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  transition: color 150ms ease-out;
}

.command-no-results__link:hover {
  color: var(--color-text-primary);
}
```

### API

```tsx
interface CommandNoResultsProps {
  query: string;
  suggestions?: Array<{ label: string; action: () => void }>;
}

// Usage
<CommandNoResults
  query="quantum physics"
  suggestions={[
    { label: 'Browse all spaces', action: () => navigate('/spaces/browse') },
    { label: 'Search all people', action: () => setFilter('people') }
  ]}
/>
```

### Gold Usage
- None

---

## COMPONENT 9: CommandTriggerButton

Header icon button that opens palette.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Icon | Search magnifier | Universal |
| Tooltip | "Search (⌘K)" | Bridges novice and expert |
| Size | 32px square | Balanced touch target |
| Placement | Header right | Standard location |

### Full CSS Specification

```css
/* ========================================
   COMMAND TRIGGER BUTTON
   Header icon to open palette
   ======================================== */

.command-trigger {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--color-text-secondary);
  cursor: pointer;
  transition: all 150ms ease-out;
}

.command-trigger:hover {
  background: var(--color-bg-surface-2);
  color: var(--color-text-primary);
}

.command-trigger:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

.command-trigger svg {
  width: 20px;
  height: 20px;
}

/* Tooltip */
.command-trigger__tooltip {
  position: absolute;
  bottom: -32px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 10px;
  background: var(--color-bg-surface-3);
  border-radius: 6px;
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-primary);
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 150ms ease-out;

  /* Arrow */
  &::before {
    content: '';
    position: absolute;
    top: -4px;
    left: 50%;
    transform: translateX(-50%);
    border-left: 4px solid transparent;
    border-right: 4px solid transparent;
    border-bottom: 4px solid var(--color-bg-surface-3);
  }
}

.command-trigger:hover .command-trigger__tooltip {
  opacity: 1;
}

/* Keyboard shortcut in tooltip */
.command-trigger__kbd {
  display: inline-flex;
  align-items: center;
  padding: 1px 4px;
  margin-left: 6px;
  background: var(--color-bg-surface-2);
  border-radius: 3px;
  font-family: var(--font-mono);
  font-size: 11px;
}
```

### API

```tsx
interface CommandTriggerButtonProps {
  onClick: () => void;
  shortcut?: string; // Default: '⌘K' or 'Ctrl+K'
}

// Usage
<CommandTriggerButton
  onClick={() => setCommandPaletteOpen(true)}
/>
```

### Gold Usage
- None

---

## COMPONENT 10: KeyboardShortcutBadge

Display keyboard shortcuts like ⌘K.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Pill badge | Clear, readable |
| Format | Platform-aware | ⌘ on Mac, Ctrl on Windows |
| Font | 11px monospace | Consistent with keyboard theme |
| Background | bg-surface-2 | Subtle, visible |

### Full CSS Specification

```css
/* ========================================
   KEYBOARD SHORTCUT BADGE
   Display shortcuts like ⌘K
   ======================================== */

.kbd-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 6px;
  background: var(--color-bg-surface-2);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

/* Individual key caps style (optional) */
.kbd-badge--keys {
  gap: 4px;
  padding: 0;
  background: transparent;
}

.kbd-badge__key {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 4px;
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--color-text-secondary);
}

/* Sizes */
.kbd-badge--sm {
  font-size: 10px;
  padding: 1px 4px;
}

.kbd-badge--lg {
  font-size: 12px;
  padding: 3px 8px;
}
```

### API

```tsx
interface KeyboardShortcutBadgeProps {
  shortcut: string; // e.g., '⌘K', 'Ctrl+K', 'Escape'
  variant?: 'pill' | 'keys';
  size?: 'sm' | 'md' | 'lg';
}

// Utility hook for platform detection
function usePlatformShortcut(macShortcut: string, windowsShortcut: string) {
  const isMac = typeof navigator !== 'undefined' &&
    navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  return isMac ? macShortcut : windowsShortcut;
}

// Usage
const shortcut = usePlatformShortcut('⌘K', 'Ctrl+K');
<KeyboardShortcutBadge shortcut={shortcut} />
```

### Gold Usage
- None

---

## COMMAND & SEARCH GOLD SUMMARY

| Component | Gold Moment | Condition |
|-----------|-------------|-----------|
| CommandPalette | None | - |
| CommandPaletteInput | None | - |
| CommandPaletteResults | None | - |
| CommandResultItem | None | - |
| CommandCategoryHeader | None | - |
| CommandResultSkeleton | None | - |
| CommandEmptyState | None | - |
| CommandNoResults | None | - |
| CommandTriggerButton | None | - |
| KeyboardShortcutBadge | None | - |

**Total Gold Budget:** 0%. The command palette is infrastructure — pure utility for power users. Gold is reserved for achievements, presence, and celebrations. Professional tools don't need gamification.

---

# PROFILE & IDENTITY COMPONENT SPECIFICATIONS

Self-expression without performance pressure. Authenticity over metrics.

---

## COMPONENT 1: ProfileHeader

Centered avatar with name, handle, and presence.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Layout | Centered stack | Focus on person |
| Avatar size | 96px | Prominent, mobile-friendly |
| Presence | Gold dot, opt-in | Privacy-first, premium |
| Info display | Name → @handle • year | Quick identity scan |

### Full CSS Specification

```css
/* ========================================
   PROFILE HEADER
   Centered identity display
   ======================================== */

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
  text-align: center;
}

/* Avatar container with presence */
.profile-header__avatar-container {
  position: relative;
  margin-bottom: 16px;
}

.profile-header__avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--color-bg-surface-2);
}

/* Presence dot */
.profile-header__presence {
  position: absolute;
  bottom: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid var(--color-bg-page);
}

.profile-header__presence--online {
  background: var(--color-accent-gold);
  animation: presence-pulse 2s ease-in-out infinite;
}

.profile-header__presence--away {
  background: var(--color-text-tertiary);
}

.profile-header__presence--offline {
  display: none;
}

@keyframes presence-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* Name */
.profile-header__name {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

/* Handle and meta */
.profile-header__meta {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-bottom: 12px;
}

.profile-header__handle {
  color: var(--color-text-tertiary);
}

/* Badges */
.profile-header__badges {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.profile-header__badge {
  padding: 4px 10px;
  border-radius: 9999px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 500;
}

.profile-header__badge--gold {
  background: rgba(255, 215, 0, 0.15);
  color: var(--color-accent-gold);
}

.profile-header__badge--neutral {
  background: var(--color-bg-surface-2);
  color: var(--color-text-secondary);
}

/* Bio */
.profile-header__bio {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--color-text-secondary);
  max-width: 400px;
  line-height: 1.5;
  margin-bottom: 20px;
}

/* Actions */
.profile-header__actions {
  display: flex;
  gap: 12px;
}
```

### API

```tsx
interface ProfileHeaderProps {
  user: {
    id: string;
    name: string;
    handle: string;
    avatar?: string;
    bio?: string;
    year?: string;
    major?: string;
    status: 'online' | 'away' | 'offline';
    showPresence?: boolean; // opt-in
    badges?: Array<{ label: string; variant: 'gold' | 'neutral' }>;
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
  onConnect?: () => void;
  onMessage?: () => void;
}
```

### Gold Usage
- Presence dot when online AND user has opted in
- Achievement badges (gold variant)

---

## COMPONENT 2: ProfileBentoGrid

Asymmetric card container for profile content.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Columns | 3 desktop, 2 tablet, 1 mobile | Responsive |
| Gap | 16px | Balanced breathing room |
| Card sizes | S (1×1), M (2×1), L (2×2) | Hierarchy |

### Full CSS Specification

```css
/* ========================================
   PROFILE BENTO GRID
   Asymmetric card layout
   ======================================== */

.bento-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px 32px;
}

/* Card size variants */
.bento-card--small {
  grid-column: span 1;
  grid-row: span 1;
}

.bento-card--medium {
  grid-column: span 2;
  grid-row: span 1;
}

.bento-card--large {
  grid-column: span 2;
  grid-row: span 2;
}

/* Responsive */
@media (max-width: 1024px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .bento-card--large {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .bento-grid {
    grid-template-columns: 1fr;
    padding: 0 16px 24px;
  }

  .bento-card--small,
  .bento-card--medium,
  .bento-card--large {
    grid-column: span 1;
    grid-row: span 1;
  }
}

/* Base card styling */
.bento-card {
  background: var(--color-bg-card);
  border: 1px solid var(--color-border-subtle);
  border-radius: 12px;
  padding: 16px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.bento-card--large {
  min-height: 260px;
}

/* Card header */
.bento-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.bento-card__title {
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--color-text-tertiary);
}

.bento-card__link {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: none;
}

.bento-card__link:hover {
  color: var(--color-text-primary);
  text-decoration: underline;
}

/* Card content */
.bento-card__content {
  flex: 1;
}
```

### API

```tsx
interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoCardProps {
  size: 'small' | 'medium' | 'large';
  title?: string;
  viewAllHref?: string;
  children: React.ReactNode;
}

// Usage
<BentoGrid>
  <BentoCard size="large" title="Spaces" viewAllHref="/profile/spaces">
    <SpacesContent />
  </BentoCard>
  <BentoCard size="small" title="Connections">
    <ConnectionsContent />
  </BentoCard>
</BentoGrid>
```

### Gold Usage
- None (container only)

---

## COMPONENT 3: SpacesCard

Medium bento card showing user's spaces.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | 3-4 space icons with names | Quick preview |
| Overflow | "+X more" link | Don't overwhelm |
| Empty | "Join spaces" CTA | Actionable |

### Full CSS Specification

```css
/* ========================================
   SPACES CARD
   Profile bento card for spaces
   ======================================== */

.spaces-card__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.spaces-card__item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 4px;
  margin: -4px;
  border-radius: 8px;
  transition: background-color 150ms ease-out;
}

.spaces-card__item:hover {
  background: var(--color-bg-surface-1);
}

.spaces-card__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  object-fit: cover;
  background: var(--color-bg-surface-2);
}

.spaces-card__name {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-primary);
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spaces-card__role {
  font-family: var(--font-body);
  font-size: 11px;
  color: var(--color-text-tertiary);
  padding: 2px 6px;
  background: var(--color-bg-surface-2);
  border-radius: 4px;
}

.spaces-card__role--leader {
  background: rgba(255, 215, 0, 0.15);
  color: var(--color-accent-gold);
}

/* Empty state */
.spaces-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
}

.spaces-card__empty-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin-bottom: 12px;
}
```

### API

```tsx
interface SpacesCardProps {
  spaces: Array<{
    id: string;
    name: string;
    icon?: string;
    role?: 'member' | 'moderator' | 'admin' | 'owner';
  }>;
  maxDisplay?: number;
  onSpaceClick: (spaceId: string) => void;
  onViewAll?: () => void;
}
```

### Gold Usage
- Leader/Owner role badge (gold variant)

---

## COMPONENT 4: ToolsCard

Medium bento card showing tools user has built.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | 2-3 tools with usage stats | Show impact |
| Empty (own) | "Build your first tool" CTA | Encourage creation |
| Empty (other) | Card hidden | Don't show nothing |

### Full CSS Specification

```css
/* ========================================
   TOOLS CARD
   Profile bento card for HiveLab tools
   ======================================== */

.tools-card__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.tools-card__item {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  padding: 8px;
  margin: -8px;
  border-radius: 8px;
  transition: background-color 150ms ease-out;
}

.tools-card__item:hover {
  background: var(--color-bg-surface-1);
}

.tools-card__icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-bg-surface-2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-tertiary);
}

.tools-card__icon svg {
  width: 20px;
  height: 20px;
}

.tools-card__info {
  flex: 1;
  min-width: 0;
}

.tools-card__name {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tools-card__meta {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

/* Usage indicator */
.tools-card__usage {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--color-text-secondary);
}

.tools-card__usage--active {
  color: var(--color-accent-gold);
}

/* Empty state */
.tools-card__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  text-align: center;
  padding: 24px;
}

.tools-card__empty-icon {
  width: 48px;
  height: 48px;
  margin-bottom: 12px;
  color: var(--color-text-tertiary);
  opacity: 0.5;
}

.tools-card__empty-text {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
  margin-bottom: 16px;
}

.tools-card__empty-cta {
  padding: 8px 16px;
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
  border: none;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 150ms ease-out;
}

.tools-card__empty-cta:hover {
  opacity: 0.9;
}
```

### API

```tsx
interface ToolsCardProps {
  tools: Array<{
    id: string;
    name: string;
    icon?: React.ReactNode;
    activeUsers?: number;
    deployedTo?: string;
  }>;
  isOwnProfile?: boolean;
  onToolClick: (toolId: string) => void;
  onCreateTool?: () => void;
}
```

### Gold Usage
- "Build your first tool" CTA (own profile, empty state)
- Active users count when tool is being used

---

## COMPONENT 5: ConnectionsCard

Small bento card with mutual connections avatar stack.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | Avatar stack + count | Visual, compact |
| Framing | "X people you know" | Relevant |
| Fallback | "X connections" if no mutuals | Never empty text |

### Full CSS Specification

```css
/* ========================================
   CONNECTIONS CARD
   Avatar stack with mutual count
   ======================================== */

.connections-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
}

/* Avatar stack */
.connections-card__avatars {
  display: flex;
  margin-bottom: 12px;
}

.connections-card__avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-bg-card);
  object-fit: cover;
  background: var(--color-bg-surface-2);
}

.connections-card__avatar:not(:first-child) {
  margin-left: -10px;
}

.connections-card__avatar--more {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg-surface-2);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--color-text-secondary);
}

/* Count text */
.connections-card__count {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
}

.connections-card__count strong {
  color: var(--color-text-primary);
  font-weight: 600;
}

/* Empty state */
.connections-card__empty {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-tertiary);
}
```

### API

```tsx
interface ConnectionsCardProps {
  mutualConnections?: Array<{
    id: string;
    avatar?: string;
    name: string;
  }>;
  totalConnections: number;
  onClick?: () => void;
}
```

### Gold Usage
- None

---

## COMPONENT 6: ProfileCompletionTracker

Checklist shown on own profile when incomplete.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Display | Bento card with checklist | Integrated |
| Visibility | Own profile only, <100% | Not competitive |
| Items | Avatar, bio, interests, space, tool | Key actions |

### Full CSS Specification

```css
/* ========================================
   PROFILE COMPLETION TRACKER
   Checklist for own profile
   ======================================== */

.completion-tracker {
  padding: 16px;
}

/* Progress header */
.completion-tracker__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.completion-tracker__title {
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-primary);
}

.completion-tracker__percentage {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--color-text-secondary);
}

/* Progress bar */
.completion-tracker__bar {
  height: 4px;
  background: var(--color-bg-surface-2);
  border-radius: 2px;
  margin-bottom: 16px;
  overflow: hidden;
}

.completion-tracker__fill {
  height: 100%;
  background: var(--color-accent-gold);
  border-radius: 2px;
  transition: width 300ms ease-out;
}

/* Checklist */
.completion-tracker__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.completion-tracker__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.completion-tracker__check {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.completion-tracker__check--done {
  background: var(--color-accent-gold);
  color: var(--color-bg-page);
}

.completion-tracker__check--pending {
  border: 2px solid var(--color-border-default);
  background: transparent;
}

.completion-tracker__check svg {
  width: 12px;
  height: 12px;
}

.completion-tracker__label {
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--color-text-secondary);
  flex: 1;
}

.completion-tracker__label--done {
  color: var(--color-text-tertiary);
  text-decoration: line-through;
}

.completion-tracker__action {
  font-family: var(--font-body);
  font-size: 12px;
  color: var(--color-text-secondary);
  text-decoration: underline;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
}

.completion-tracker__action:hover {
  color: var(--color-text-primary);
}
```

### API

```tsx
interface CompletionItem {
  key: string;
  label: string;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

interface ProfileCompletionTrackerProps {
  items: CompletionItem[];
  percentage: number;
}

// Default items
const defaultItems: CompletionItem[] = [
  { key: 'avatar', label: 'Upload a profile photo', completed: false },
  { key: 'bio', label: 'Write a bio', completed: false },
  { key: 'interests', label: 'Select your interests', completed: false },
  { key: 'space', label: 'Join a space', completed: false },
  { key: 'tool', label: 'Build your first tool', completed: false },
];
```

### Gold Usage
- Progress bar fill is gold
- Completed checkmarks are gold
- "Build your first tool" triggers gold celebration when completed

---

## COMPONENT 7: GhostModeToggle

Privacy toggle switch.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Style | Standard switch | Familiar |
| Label | "Ghost Mode" | Clear |
| Sublabel | Explanation text | Context |

### Full CSS Specification

```css
/* ========================================
   GHOST MODE TOGGLE
   Privacy switch
   ======================================== */

.ghost-toggle {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 16px;
  background: var(--color-bg-surface-1);
  border-radius: 12px;
}

.ghost-toggle__content {
  flex: 1;
}

.ghost-toggle__label {
  font-family: var(--font-body);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.ghost-toggle__description {
  font-family: var(--font-body);
  font-size: 13px;
  color: var(--color-text-tertiary);
  line-height: 1.4;
}

/* Switch */
.ghost-toggle__switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-bg-surface-2);
  border-radius: 12px;
  cursor: pointer;
  transition: background-color 200ms ease-out;
  flex-shrink: 0;
}

.ghost-toggle__switch--active {
  background: var(--color-text-primary);
}

.ghost-toggle__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms ease-out;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.ghost-toggle__switch--active .ghost-toggle__knob {
  transform: translateX(20px);
}
```

### API

```tsx
interface GhostModeToggleProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}
```

### Gold Usage
- None (privacy, not achievement)

---

## COMPONENT 8: ConnectButton

Multi-state connection action button.

### Confirmed Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| States | Connect → Pending → Connected | Clear flow |
| Not connected | Outline button | Secondary action |
| Connected | Badge style with check | Confirmation |

### Full CSS Specification

```css
/* ========================================
   CONNECT BUTTON
   Multi-state connection action
   ======================================== */

.connect-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease-out;
}

/* Not connected */
.connect-btn--default {
  background: transparent;
  border: 1px solid var(--color-border-default);
  color: var(--color-text-primary);
}

.connect-btn--default:hover {
  background: var(--color-bg-surface-1);
  border-color: var(--color-text-primary);
}

/* Request sent */
.connect-btn--pending {
  background: transparent;
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-tertiary);
  cursor: default;
}

/* Request received (Accept) */
.connect-btn--accept {
  background: var(--color-text-primary);
  border: 1px solid var(--color-text-primary);
  color: var(--color-bg-page);
}

.connect-btn--accept:hover {
  opacity: 0.9;
}

/* Connected */
.connect-btn--connected {
  background: var(--color-bg-surface-2);
  border: 1px solid var(--color-border-subtle);
  color: var(--color-text-secondary);
  cursor: default;
}

.connect-btn--connected svg {
  width: 14px;
  height: 14px;
  color: var(--color-accent-gold);
}

/* Loading */
.connect-btn--loading {
  pointer-events: none;
}

.connect-btn__spinner {
  width: 14px;
  height: 14px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: connect-spin 600ms linear infinite;
}

@keyframes connect-spin {
  to { transform: rotate(360deg); }
}
```

### API

```tsx
type ConnectionState = 'none' | 'pending' | 'received' | 'connected';

interface ConnectButtonProps {
  state: ConnectionState;
  isLoading?: boolean;
  onConnect?: () => void;
  onAccept?: () => void;
  onDecline?: () => void;
}
```

### Gold Usage
- Connected checkmark is gold

---

## COMPONENT 9: ProfileSkeleton

Loading state for profile page.

### Full CSS Specification

```css
/* ========================================
   PROFILE SKELETON
   Loading placeholder
   ======================================== */

@keyframes profile-skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.8; }
}

.profile-skeleton__bone {
  background: var(--color-bg-surface-2);
  border-radius: 4px;
  animation: profile-skeleton-pulse 1.5s ease-in-out infinite;
}

/* Header skeleton */
.profile-skeleton__header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32px 24px;
}

.profile-skeleton__avatar {
  width: 96px;
  height: 96px;
  border-radius: 50%;
  margin-bottom: 16px;
}

.profile-skeleton__name {
  width: 180px;
  height: 24px;
  margin-bottom: 8px;
}

.profile-skeleton__meta {
  width: 120px;
  height: 14px;
  margin-bottom: 16px;
}

.profile-skeleton__bio {
  width: 280px;
  height: 14px;
  margin-bottom: 6px;
}

/* Bento skeleton */
.profile-skeleton__grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 0 24px;
}

.profile-skeleton__card {
  border-radius: 12px;
  min-height: 120px;
}

.profile-skeleton__card--large {
  grid-column: span 2;
  grid-row: span 2;
  min-height: 260px;
}

@media (max-width: 640px) {
  .profile-skeleton__grid {
    grid-template-columns: 1fr;
  }

  .profile-skeleton__card--large {
    grid-column: span 1;
    grid-row: span 1;
  }
}
```

### Gold Usage
- None

---

## PROFILE & IDENTITY GOLD SUMMARY

| Component | Gold Moment | Condition |
|-----------|-------------|-----------|
| ProfileHeader | Presence dot | Online AND opted-in |
| ProfileHeader | Achievement badges | Earned badges |
| SpacesCard | Leader role badge | Owner/Admin role |
| ToolsCard | Active users count | Tool being used |
| ToolsCard | "Build first tool" CTA | Own profile, empty |
| CompletionTracker | Progress bar, checks | Visual progress |
| ConnectButton | Connected checkmark | After connection |

**Total Gold Budget:** ~3-5% on profile page. Gold appears for presence (opt-in), achievements, and completion progress. Connections are NOT gold — they're normal, not gamified.

---

### Space Components

Community hub interface components.

---

#### SpaceHeader

Space page hero and navigation.

**Primitives Used:**
- Card (glass variant for landing atmosphere)
- Avatar (space avatar)
- Heading
- Text
- Badge
- Button
- AvatarGroup
- LiveCounter
- Tabs

**Structure:**
```
┌─────────────────────────────────────────────┐
│  [Space Avatar]                             │
│  Space Name                    [● Online]   │
│  Description text...                        │
│                                             │
│  [👤👤👤 127 members]  [Join] / [Leave]    │
│                                             │
│  [Chat] [Board] [Events] [Files] [Settings] │
└─────────────────────────────────────────────┘
```

**API:**
```tsx
interface SpaceHeaderProps {
  space: {
    id: string;
    name: string;
    description?: string;
    avatar?: string;
    memberCount: number;
    onlineCount: number;
    isJoined?: boolean;
    role?: 'member' | 'moderator' | 'admin' | 'owner';
  };
  activeTab: string;
  onTabChange: (tab: string) => void;
  onJoin?: () => void;
  onLeave?: () => void;
}
```

**Gold Usage:**
- LiveCounter for online count
- CTA button (Join) when not member
- Badge for admin/mod role

---

#### SpaceHero

Larger hero variant for space landing.

**Primitives Used:**
- Card (full-width, glass)
- Avatar (large)
- Heading (display size)
- Text
- Badge
- Button
- AvatarGroup
- LiveCounter
- ActivityEdge

**API:**
Similar to SpaceHeader but with:
- Larger avatar
- Cover image support
- More prominent stats
- Rich activity indication

**Gold Usage:**
- ActivityEdge based on space activity
- LiveCounter
- Featured badge

---

#### MemberList

Space members display.

**Primitives Used:**
- Card
- Avatar
- Text
- PresenceDot
- Badge (for roles)
- Button

**API:**
```tsx
interface MemberListProps {
  members: Array<{
    id: string;
    name: string;
    avatar?: string;
    status: 'online' | 'away' | 'offline';
    role: 'member' | 'moderator' | 'admin' | 'owner';
  }>;
  onMemberClick?: (userId: string) => void;
  showOnlineOnly?: boolean;
}
```

**Behavior:**
- Online members shown first
- Role badges displayed
- Search/filter supported
- Virtualized for large lists

**Gold Usage:**
- PresenceDot for online members
- Owner/Admin badges (gold variant)

---

#### SpaceRail

Right sidebar with widgets and context.

**Primitives Used:**
- Card
- Heading
- Various widgets

**Structure:**
```
┌──────────────────────┐
│  About               │
│  Description...      │
├──────────────────────┤
│  Tools               │
│  [Tool] [Tool]       │
├──────────────────────┤
│  Events              │
│  [Upcoming event]    │
├──────────────────────┤
│  Members             │
│  [👤👤👤 +24]        │
└──────────────────────┘
```

**API:**
```tsx
interface SpaceRailProps {
  space: Space;
  widgets?: Array<{
    type: 'about' | 'tools' | 'events' | 'members' | 'pinned' | 'custom';
    config?: any;
  }>;
}
```

**Gold Usage:**
- Inherited from child widgets
- Pinned messages indicator

---

### HiveLab Components

Visual tool builder interface.

---

#### ElementPalette

Draggable elements for tool composition.

**Primitives Used:**
- Card
- Icon
- Text
- Tooltip
- Separator

**Structure:**
```
┌──────────────────────┐
│  UNIVERSAL           │
│  [Icon] Text         │
│  [Icon] Button       │
│  [Icon] Image        │
├──────────────────────┤
│  CONNECTED           │
│  [Icon] User Card    │
│  [Icon] Space List   │
├──────────────────────┤
│  SPACE               │
│  [Icon] Member Picker│
│  [Icon] Poll         │
└──────────────────────┘
```

**API:**
```tsx
interface ElementPaletteProps {
  elements: Array<{
    id: string;
    type: string;
    name: string;
    icon: string;
    category: 'universal' | 'connected' | 'space';
  }>;
  onDragStart: (element: Element) => void;
}
```

**Behavior:**
- Drag elements onto canvas
- Grouped by category
- Search/filter supported
- Hover shows preview

**Gold Usage:**
None. Workshop atmosphere (reduced gold).

---

#### PropertiesPanel

Selected element configuration.

**Primitives Used:**
- Card
- PropertyField
- Input / Select / Switch / Checkbox
- Separator
- Text
- Icon

**Structure:**
```
┌──────────────────────┐
│  Button Properties   │
├──────────────────────┤
│  Label    [Edit]     │
│  Variant  [▾ CTA  ]  │
│  Size     [▾ lg   ]  │
├──────────────────────┤
│  STYLE               │
│  Width    [100%]     │
│  Margin   [0 0 0 0]  │
├──────────────────────┤
│  ACTIONS             │
│  On Click [▾ ...]    │
└──────────────────────┘
```

**API:**
```tsx
interface PropertiesPanelProps {
  element: CanvasElement | null;
  onChange: (changes: Partial<ElementConfig>) => void;
}
```

**Gold Usage:**
None. Workshop atmosphere.

---

#### ToolCanvas

Main building surface.

**Primitives Used:**
- CanvasArea
- HandleDot
- Card (for rendered elements)

**API:**
```tsx
interface ToolCanvasProps {
  elements: CanvasElement[];
  selectedId?: string;
  onSelect: (id: string | null) => void;
  onMove: (id: string, position: Position) => void;
  onResize: (id: string, size: Size) => void;
  showGrid?: boolean;
}
```

**Behavior:**
- Drag elements to reposition
- Resize via handles
- Multi-select with Shift
- Copy/paste supported
- Undo/redo supported

**Gold Usage:**
None. Workshop atmosphere.

---

#### LayersPanel

Z-order and visibility control.

**Primitives Used:**
- Card
- Text
- Icon
- Button

**API:**
```tsx
interface LayersPanelProps {
  elements: CanvasElement[];
  selectedId?: string;
  onSelect: (id: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
  onToggleVisibility: (id: string) => void;
}
```

**Gold Usage:**
None.

---

### Feedback Components

System states and user feedback.

---

#### EmptyState

When content doesn't exist yet.

**Primitives Used:**
- Card
- Icon
- Heading
- Text
- Button

**Structure:**
```
┌─────────────────────────────────────┐
│                                     │
│            [Large Icon]             │
│                                     │
│          No messages yet            │
│   Start a conversation with your    │
│          space members.             │
│                                     │
│         [Start Chatting]            │
│                                     │
└─────────────────────────────────────┘
```

**API:**
```tsx
interface EmptyStateProps {
  icon: string;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

<EmptyState
  icon="chat"
  title="No messages yet"
  description="Start a conversation with your space members."
  action={{ label: 'Start Chatting', onClick: openComposer }}
/>
```

**Gold Usage:**
- CTA button only

---

#### ErrorState

When something goes wrong.

**Primitives Used:**
- Card
- Icon (error style)
- Heading
- Text
- Button

**API:**
```tsx
interface ErrorStateProps {
  title?: string;
  message: string;
  retry?: () => void;
  goBack?: () => void;
}

<ErrorState
  title="Something went wrong"
  message="We couldn't load the space. Please try again."
  retry={refetch}
/>
```

**Gold Usage:**
None. Error states use muted colors.

---

#### LoadingOverlay

Full-area loading state.

**Primitives Used:**
- Skeleton (progressive)
- Card

**API:**
```tsx
interface LoadingOverlayProps {
  variant?: 'spinner' | 'skeleton' | 'progress';
  progress?: number; // For progress variant
}
```

**Behavior:**
- Skeleton matches content structure
- Fades in after 100ms (avoid flash)
- Fades out when content ready

**Gold Usage:**
- Progress bar (gold) if progress variant

---

### Media Components

Rich content display and upload.

---

#### MediaViewer

Image/video lightbox display.

**Primitives Used:**
- Modal (fullscreen variant)
- Button
- Icon
- Progress (for video)

**API:**
```tsx
interface MediaViewerProps {
  open: boolean;
  onClose: () => void;
  media: Array<{
    type: 'image' | 'video';
    url: string;
    alt?: string;
  }>;
  initialIndex?: number;
}
```

**Behavior:**
- Arrow keys navigate
- Pinch to zoom on mobile
- Swipe to navigate
- Click outside closes

**Gold Usage:**
None.

---

#### ImageCropper

Image crop before upload.

**Primitives Used:**
- Modal
- Button
- Slider (for zoom)

**API:**
```tsx
interface ImageCropperProps {
  image: string;
  aspectRatio?: number;
  onCrop: (croppedImage: Blob) => void;
  onCancel: () => void;
}
```

**Gold Usage:**
- CTA button (Crop & Save)

---

#### FileCard

File/document display.

**Primitives Used:**
- Card
- Icon (file type)
- Text
- Button

**API:**
```tsx
interface FileCardProps {
  file: {
    name: string;
    type: string;
    size: number;
    url: string;
  };
  onDownload?: () => void;
  onDelete?: () => void;
}
```

**Gold Usage:**
None.

---

## DATA DISPLAY COMPONENTS

Components for displaying structured data.

---

#### DataTable

Tabular data display.

**Primitives Used:**
- Card
- Text
- Icon
- Checkbox
- Button
- Skeleton

**API:**
```tsx
interface DataTableProps<T> {
  data: T[];
  columns: Array<{
    key: keyof T;
    header: string;
    sortable?: boolean;
    render?: (value: any, row: T) => React.ReactNode;
  }>;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  onSelectionChange?: (selected: T[]) => void;
  loading?: boolean;
}
```

**Gold Usage:**
- Selected row indicator (subtle gold edge)

---

#### StatCard

Metric display with optional trend.

**Primitives Used:**
- Card
- Heading (for number)
- Text
- Icon
- LiveCounter

**Structure:**
```
┌──────────────────────┐
│  Active Users        │
│  847  [↑ 12%]        │
│  vs last week        │
└──────────────────────┘
```

**API:**
```tsx
interface StatCardProps {
  label: string;
  value: number;
  trend?: { direction: 'up' | 'down'; percentage: number };
  live?: boolean; // Use LiveCounter
}
```

**Gold Usage:**
- LiveCounter if live=true
- Positive trend indicator (subtle)

---

#### ActivityFeed

Chronological activity list.

**Primitives Used:**
- Card
- Avatar
- Text
- Icon
- Separator

**API:**
```tsx
interface ActivityFeedProps {
  items: Array<{
    id: string;
    type: 'post' | 'join' | 'leave' | 'event' | 'tool';
    actor: { name: string; avatar?: string };
    target?: string;
    timestamp: Date;
  }>;
  onItemClick?: (item: ActivityItem) => void;
}
```

**Gold Usage:**
None. Neutral activity display.

---

#### LiveTicker

Horizontal scrolling live updates.

**Primitives Used:**
- Text
- Icon
- PresenceDot
- LiveCounter

**Structure:**
```
[● Alex joined CS Club] • [● Sarah created Study Buddy tool] • [● 12 people online in Design]
```

**API:**
```tsx
interface LiveTickerProps {
  items: Array<{
    id: string;
    content: string;
    timestamp: Date;
  }>;
  speed?: 'slow' | 'normal' | 'fast';
}
```

**Behavior:**
- Smooth horizontal scroll
- Pauses on hover
- New items fade in

**Gold Usage:**
- PresenceDots in items
- Numbers as LiveCounter

---

## ATMOSPHERE VARIANTS

All components respond to AtmosphereProvider context:

### Landing Atmosphere

```css
/* Rich, premium, Apple-like */
--blur-intensity: 12px;
--card-bg: rgba(20, 20, 20, 0.8);
--motion-scale: 1.0; /* Full animations */
--gold-intensity: 1.0;
```

Components add:
- Glass effects on cards
- Blur backdrops on headers
- Rich transitions
- Full gold intensity

### Spaces Atmosphere

```css
/* Default, balanced */
--blur-intensity: 8px;
--card-bg: #141414;
--motion-scale: 0.8; /* Standard animations */
--gold-intensity: 0.8;
```

Components use:
- Solid cards
- Standard transitions
- Normal gold intensity

### Workshop Atmosphere

```css
/* Focused, utilitarian */
--blur-intensity: 0px;
--card-bg: #0F0F0F;
--motion-scale: 0.5; /* Reduced animations */
--gold-intensity: 0.6;
```

Components minimize:
- No blur effects
- Sharp edges
- Minimal animation
- Reduced gold

---

## PATTERN 5: PROFILE & IDENTITY

### Philosophy

> **Your profile is what you do, not what you've accumulated.**
>
> No badges. No counts. No gamification.
> Rounded square avatars for intimacy. Gold only for presence and action.
> Your spaces show where you belong. Your tools show what you build. Your rhythm shows you're alive.

### Upstream Alignment

| Principle | Implementation |
|-----------|----------------|
| "Belonging without performance" | No follower counts, no vanity metrics |
| "Presence without pressure" | Gold dot only, no location tracking |
| "2am test" | Intimate avatars, casual copy, no corporate energy |
| "Gold = activity only" | Presence dot + Connect CTA, nothing else |

### Decision Summary

| Decision | Lock |
|----------|------|
| Header | F4: Balanced Synthesis (centered avatar, dot separator, no presence banner) |
| Grid | G5: Hybrid (smart defaults + template override + full custom) |
| Avatars | Rounded square, 22% radius (Apple-style) |
| Presence | Gold dot on avatar, no location tracking |
| Widgets | 10 total (5 core + 5 expression), no achievements |
| Connections | "Connect" action, "people you both know", count hidden |

---

## PATTERN 5 COMPONENT DECISIONS

### Decision Process

Each component decision includes:
- **Options** — All aligned with upstream (no violating options presented)
- **Comparison Table** — How other companies handle it
- **Upstream Alignment** — Which principles each option serves
- **Recommendation** — With reasoning

---

### COMPONENT: Avatar

#### Decision 1.1: Avatar Shape

| Option | Shape | Radius | Visual |
|--------|-------|--------|--------|
| **A: Circle** | Perfect circle | 50% | ○ |
| **B: Rounded Square** | Soft square | 22% | ▢ |
| **C: Squircle** | iOS-style continuous curve | ~44% superellipse | ⬜ |
| **D: Sharp Square** | Minimal rounding | 8% | □ |

**Industry Comparison:**

| Company | Shape | Why They Chose It |
|---------|-------|-------------------|
| **Apple** | Squircle (iOS icons) | Premium, distinctive, mathematical precision |
| **ChatGPT** | Circle | Simple, friendly, universal |
| **Vercel** | Circle | Clean, developer-standard |
| **Linear** | Rounded square (~20%) | Modern, distinctive, not default |
| **Discord** | Circle | Friendly, gaming culture |
| **Slack** | Rounded square | Professional but warm |
| **Tinder** | Rounded square | Personal, intimate, photo-forward |
| **Twitter/X** | Circle | Universal, simple |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Circle** | Universal but undistinctive. Doesn't express HIVE identity. | ⭐⭐ |
| **B: Rounded Square** | "Restraint is confidence" — not default. Apple lineage. Tinder intimacy. | ⭐⭐⭐⭐⭐ |
| **C: Squircle** | Apple-native but complex to implement. Could feel over-designed. | ⭐⭐⭐⭐ |
| **D: Sharp Square** | Brutalist. Could feel cold, violates "warmth in darkness". | ⭐⭐ |

**✓ LOCKED: B — Rounded Square (22% radius)**

Why: Not the default (most use circles), Apple/Tinder lineage = premium + intimate, photos crop better, matches "every pixel placed" + "restraint is confidence."

---

#### Decision 1.2: Avatar Sizes

| Option | Approach | Sizes |
|--------|----------|-------|
| **A: Minimal Set** | Only what's needed | 3 sizes (sm/md/lg) |
| **B: Linear Scale** | Even progression | 24/32/40/48/56/64 |
| **C: Contextual Set** | Named by use case | xs/sm/md/lg/xl/2xl with purpose |
| **D: Fluid** | CSS clamp() based | min-max range |

**Industry Comparison:**

| Company | Approach | Philosophy |
|---------|----------|------------|
| **Apple** | Contextual | Specific sizes for specific uses |
| **ChatGPT** | Minimal | ~3 sizes total |
| **Linear** | Contextual | Named sizes tied to contexts |
| **Radix** | Linear scale | 1-9 numeric scale |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Minimal** | "Restraint" but might not cover all cases | ⭐⭐⭐ |
| **B: Linear** | Systematic but potentially wasteful | ⭐⭐⭐ |
| **C: Contextual** | "Intentional everything" — each size has purpose | ⭐⭐⭐⭐⭐ |
| **D: Fluid** | Hard to maintain consistency | ⭐⭐ |

**✓ LOCKED: C — Contextual Set**

| Size | Dimension | Radius | Specific Use Case |
|------|-----------|--------|-------------------|
| xs | 24px | 5px | Typing indicators, inline mentions |
| sm | 32px | 7px | Comment threads, compact lists |
| md | 40px | 9px | Cards, navigation, standard context |
| lg | 56px | 12px | Profile cards, expanded views |
| xl | 80px | 18px | Profile header mobile |
| 2xl | 120px | 26px | Profile header desktop |

Why: Each size has explicit purpose. No sizes exist "just in case."

---

#### Decision 1.3: Avatar Fallback (No Image)

| Option | Approach | Visual |
|--------|----------|--------|
| **A: Initials** | First letter(s) of name | "SC" |
| **B: Icon** | Generic person silhouette | 👤 |
| **C: Gradient** | Generated from name/ID | 🟦 |
| **D: Monogram** | Styled single initial | "S" |

**Industry Comparison:**

| Company | Fallback | Feel |
|---------|----------|------|
| **Apple** | Silhouette icon | Neutral, universal |
| **ChatGPT** | Colored circle + initial | Personal but minimal |
| **Linear** | Initials on gray | Professional |
| **Slack** | Generated pattern | Distinctive but busy |
| **GitHub** | Identicon (geometric) | Developer culture |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Initials** | Personal, human. "Sound like a person." | ⭐⭐⭐⭐ |
| **B: Icon** | Impersonal. Violates "human, not corporate." | ⭐⭐ |
| **C: Gradient** | Could feel decorative. "No busy patterns." | ⭐⭐ |
| **D: Monogram** | Elegant, restrained. Apple-like. | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — Styled Monogram**

Single initial on #1A1A1A background, #818187 text. Cleaner than two initials, elegant, restrained.

---

#### Decision 1.4: Avatar Loading State

| Option | Approach |
|--------|----------|
| **A: Spinner** | Rotating indicator |
| **B: Pulse** | Opacity breathing |
| **C: Skeleton Shimmer** | Gradient sweep |
| **D: Blur-in** | Start blurred, sharpen |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Spinner** | "Never loading spinners" — explicit NEVER in PRINCIPLES | ❌ FORBIDDEN |
| **B: Pulse** | Subtle but unclear what's happening | ⭐⭐⭐ |
| **C: Shimmer** | "Loading is graceful" — skeleton states per PRINCIPLES | ⭐⭐⭐⭐⭐ |
| **D: Blur-in** | Premium but complex | ⭐⭐⭐⭐ |

**✓ LOCKED: C — Skeleton Shimmer**

Why: Explicitly called out in PRINCIPLES: "Loading is graceful — skeleton states, not spinners."

---

### COMPONENT: Presence Indicator

#### Decision 2.1: Presence Visual Form

| Option | Form | Visual |
|--------|------|--------|
| **A: Dot** | Small circle | ● |
| **B: Ring** | Outline around avatar | ◯ |
| **C: Glow** | Subtle aura | ✨ |
| **D: Badge** | Text label | "Online" |

**Industry Comparison:**

| Company | Presence Indicator | Feel |
|---------|-------------------|------|
| **Apple (iMessage)** | Green dot | Clear, universal |
| **Discord** | Colored dot (green/yellow/red) | Gamified, status-heavy |
| **Slack** | Green dot | Professional standard |
| **Linear** | Green dot (subtle) | Minimal |
| **WhatsApp** | Text "online" / "last seen" | Surveillance-heavy |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Dot** | "Pulse, not notification" — subtle indicator | ⭐⭐⭐⭐⭐ |
| **B: Ring** | Could feel like notification badge | ⭐⭐⭐ |
| **C: Glow** | "Denser = warmer" — interesting but complex | ⭐⭐⭐⭐ |
| **D: Badge** | Text is heavy, not ambient | ⭐⭐ |

**✓ LOCKED: A — Dot**

Industry standard, universally understood, subtle. Ours is gold (not green) per our color system.

---

#### Decision 2.2: Presence Color

| Option | Color | Meaning |
|--------|-------|---------|
| **A: Green** | Industry standard | Universal recognition |
| **B: Gold** | HIVE brand color | Activity = gold |
| **C: White** | Neutral | Fits grayscale system |
| **D: Blue** | Tech standard | Apple-adjacent |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Green** | Not in our color system. Would introduce new color. | ⭐⭐ |
| **B: Gold** | "Gold = activity only" — presence IS activity per PRINCIPLES | ⭐⭐⭐⭐⭐ |
| **C: White** | Bland, doesn't signal "life" | ⭐⭐ |
| **D: Blue** | Not in our system | ⭐ |

**✓ LOCKED: B — Gold (#FFD700)**

Why: PRINCIPLES explicitly states "Gold = activity only — Presence, achievement, CTA." Presence is the definition of activity. Creates distinctive HIVE look.

---

#### Decision 2.3: Presence Animation

| Option | Animation | Duration |
|--------|-----------|----------|
| **A: Static** | No animation | — |
| **B: Pulse** | Opacity breathe | 3s cycle |
| **C: Glow Pulse** | Size + opacity | 3s cycle |
| **D: Blink** | On/off | 1s cycle |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Static** | Violates "Gold pulses — living things breathe" | ⭐⭐ |
| **B: Pulse** | Exactly what PRINCIPLES say: "Breathing elements — 3-5s pulse" | ⭐⭐⭐⭐⭐ |
| **C: Glow Pulse** | Could be too attention-grabbing | ⭐⭐⭐ |
| **D: Blink** | Feels broken, not breathing | ⭐ |

**✓ LOCKED: B — Subtle Pulse (3s)**

Why: PRINCIPLES: "Gold pulses — living things breathe, dead things don't." Must respect `prefers-reduced-motion`.

---

#### Decision 2.4: Presence States

| Option | States Shown |
|--------|--------------|
| **A: Binary** | Online / Nothing |
| **B: Ternary** | Online / Away / Offline |
| **C: Full Status** | Online / Away / DND / Offline |
| **D: Timed** | Online / "5m ago" / Offline |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Binary** | "No surveillance" — we don't track absence | ⭐⭐⭐⭐⭐ |
| **B: Ternary** | "Away" implies tracking | ⭐⭐ |
| **C: Full Status** | Gamified, heavy | ⭐ |
| **D: Timed** | Explicit surveillance — "last seen" | ❌ FORBIDDEN |

**✓ LOCKED: A — Binary (Online or Nothing)**

Why: PHILOSOPHY says "Presence without pressure." We show you're here when you're here. No tracking when you left. No "last seen" surveillance.

---

### COMPONENT: Profile Stats Row

#### Decision 3.1: What Stats to Show

| Option | Stats Displayed |
|--------|-----------------|
| **A: Full Metrics** | Spaces, Tools, Connections, Posts, Views |
| **B: Core Three** | Spaces, Tools, Connections |
| **C: Activity Only** | Spaces, Tools (no people count) |
| **D: None** | No stats at all |

**Industry Comparison:**

| Company | Stats Shown | Feel |
|---------|-------------|------|
| **Instagram** | Posts, Followers, Following | Vanity-driven |
| **Twitter** | Followers, Following | Status game |
| **LinkedIn** | Connections, Profile views | Professional vanity |
| **GitHub** | Repos, Followers, Stars | Builder-focused |
| **Linear** | None visible | Work-focused |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Full Metrics** | "Never vanity metrics visible" — too many | ⭐ |
| **B: Core Three** | Spaces/Tools meaningful, Connections risky | ⭐⭐⭐ |
| **C: Activity Only** | Avoids people-counting | ⭐⭐⭐⭐ |
| **D: None** | Extreme restraint, loses useful info | ⭐⭐⭐ |

**✓ LOCKED: B — Core Three, with Connection count hidden**

- **Spaces count** = Community involvement (meaningful)
- **Tools count** = Building activity (meaningful, per "builder energy")
- **Connections** = Text only: "people you both know" (no count)

---

#### Decision 3.2: Stats Number Styling

| Option | Style | Example |
|--------|-------|---------|
| **A: Bold Large** | Prominent numbers | **127** Spaces |
| **B: Subtle Integrated** | Numbers same weight | 127 Spaces |
| **C: Separated** | Number above, label below | 127 ↵ Spaces |
| **D: Inline** | Sentence style | "Member of 127 spaces" |

**Industry Comparison:**

| Company | Number Style | Feel |
|---------|--------------|------|
| **Instagram** | Bold large, stacked | Vanity-forward |
| **Twitter** | Bold, inline | Status-forward |
| **GitHub** | Subtle, inline | Builder-focused |
| **Apple (App Store)** | Large number, small label below | Premium clarity |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Bold Large** | Could feel vanity-forward | ⭐⭐ |
| **B: Subtle Integrated** | "Restraint is confidence" | ⭐⭐⭐⭐ |
| **C: Separated** | Clear hierarchy, Apple-like | ⭐⭐⭐⭐⭐ |
| **D: Inline** | Conversational but takes space | ⭐⭐⭐ |

**✓ LOCKED: C — Separated (Number above, label below)**

Apple pattern (App Store ratings). Clear visual hierarchy. Numbers visible but not screaming.

---

#### Decision 3.3: Connections Display

| Option | Display | Example |
|--------|---------|---------|
| **A: Count** | Show number | "247 Connections" |
| **B: Mutual Only** | Show shared connections | "12 mutual" |
| **C: Text Only** | No number | "people you both know" |
| **D: Hidden** | Don't show connections at all | — |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Count** | "Never vanity metrics visible" — this IS vanity | ❌ FORBIDDEN |
| **B: Mutual Only** | Contextual, not vanity | ⭐⭐⭐⭐ |
| **C: Text Only** | No number, invites exploration | ⭐⭐⭐⭐⭐ |
| **D: Hidden** | Loses social proof entirely | ⭐⭐ |

**✓ LOCKED: C — Text Only ("people you both know")**

Why: No vanity counting. Language is warm, human ("people" not "connections"). On own profile: section doesn't appear.

---

### COMPONENT: Bento Widget (Base Container)

#### Decision 4.1: Widget Shape

| Option | Radius |
|--------|--------|
| **A: Sharp (8px)** | Linear/Vercel feel |
| **B: Soft (16px)** | Apple/ChatGPT zone |
| **C: Pill (24px)** | iOS widgets |
| **D: Mixed** | Different per size |

**Industry Comparison:**

| Company | Card Radius | Feel |
|---------|-------------|------|
| **Apple** | 12-16px | Premium, considered |
| **ChatGPT** | 12px | Clean, modern |
| **Linear** | 8px | Sharp, efficient |
| **Vercel** | 12px | Infrastructure aesthetic |
| **iOS Widgets** | 20-24px | Soft, friendly |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Sharp** | Linear/Vercel feel, but colder | ⭐⭐⭐ |
| **B: Soft** | "Warmth in darkness" — not too sharp | ⭐⭐⭐⭐⭐ |
| **C: Pill** | Could feel too soft | ⭐⭐⭐ |
| **D: Mixed** | Inconsistent | ⭐⭐ |

**✓ LOCKED: B — Soft (16px)**

Matches Apple/ChatGPT aesthetic. "Warmth in darkness." Professional but not cold.

---

#### Decision 4.2: Widget Border Treatment

| Option | Border |
|--------|--------|
| **A: Solid** | 1px solid line |
| **B: Subtle** | 1px at 6% opacity |
| **C: None** | Background only |
| **D: Glow** | Soft shadow |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Solid** | "Layers, not lines" — violates | ⭐⭐ |
| **B: Subtle** | Present for alignment, not decoration | ⭐⭐⭐⭐⭐ |
| **C: None** | Could feel ungrounded | ⭐⭐⭐ |
| **D: Glow** | "Glow, not light" — could work | ⭐⭐⭐⭐ |

**✓ LOCKED: B — Subtle (1px at 6% white)**

PRINCIPLES: "Layers, not lines" but we need SOME definition. 6% opacity = visible on close look, invisible at glance.

---

#### Decision 4.3: Widget Header Style

| Option | Style |
|--------|-------|
| **A: Bold Title** | Large, prominent |
| **B: Subtle Label** | Small, uppercase, muted |
| **C: Icon + Label** | Icon alongside text |
| **D: No Header** | Content only |

**Industry Comparison:**

| Company | Widget Headers | Feel |
|---------|---------------|------|
| **Apple (iOS widgets)** | Small, subtle | Content-forward |
| **Notion** | Bold or icon | Functional |
| **Linear** | Minimal | Clean |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Bold** | Could feel heavy | ⭐⭐ |
| **B: Subtle Label** | "Restraint is confidence" — lets content shine | ⭐⭐⭐⭐⭐ |
| **C: Icon + Label** | More visual noise | ⭐⭐⭐ |
| **D: No Header** | Could lose context | ⭐⭐⭐ |

**✓ LOCKED: B — Subtle Label**

12px, uppercase, muted (#818187). Labels widget without competing with content. Apple iOS widget style.

---

#### Decision 4.4: Widget Empty State Approach

| Option | Empty State |
|--------|-------------|
| **A: Hidden** | Don't show empty widgets |
| **B: Placeholder** | "Add X" prompt |
| **C: Ghost** | Faded/skeleton version |
| **D: CTA Card** | Turn into action card |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Hidden** | Clean but loses opportunity | ⭐⭐⭐ |
| **B: Placeholder** | "Suggest over demand" — inviting not pushy | ⭐⭐⭐⭐⭐ |
| **C: Ghost** | Could feel broken | ⭐⭐ |
| **D: CTA Card** | Could feel pressuring | ⭐⭐⭐ |

**✓ LOCKED: B — Placeholder with subtle prompt**

Per PRINCIPLES: "Invitations, not requirements." No gold on empty states (not earned yet).

---

### COMPONENT: Profile Card

#### Decision 5.1: Card Size Variants

| Option | Variants |
|--------|----------|
| **A: Single** | One size fits all |
| **B: Two** | Compact / Expanded |
| **C: Three** | Mini / Standard / Expanded |
| **D: Fluid** | Responsive to container |

**Industry Comparison:**

| Company | Card Variants | Approach |
|---------|---------------|----------|
| **Apple** | Context-specific | 2-3 variants |
| **Discord** | Mini / Full | 2 variants |
| **Slack** | Compact / Rich | 2 variants |
| **Twitter** | Mini / Card / Full | 3 variants |

**✓ LOCKED: C — Three Sizes**

| Variant | Use Case | Content |
|---------|----------|---------|
| Mini | Typing indicators, mentions | Avatar + Name |
| Standard | Member lists, search | Avatar + Name + Handle |
| Expanded | Hover cards, previews | + Bio + Connect CTA |

---

#### Decision 5.2: Connect CTA Placement

| Option | Placement |
|--------|-----------|
| **A: Always Visible** | On all card sizes |
| **B: Expanded Only** | Only on hover/expanded |
| **C: On Hover** | Appears on hover |
| **D: Never on Cards** | Only on full profile |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Always** | Could feel pushy | ⭐⭐ |
| **B: Expanded Only** | "Progressive disclosure" | ⭐⭐⭐⭐⭐ |
| **C: On Hover** | Mobile-unfriendly | ⭐⭐⭐ |
| **D: Never** | Loses opportunity | ⭐⭐⭐ |

**✓ LOCKED: B — Expanded Only**

Connect button is gold (precious, not scattered). Appears when you've committed attention. "Reveal over dump."

---

### COMPONENT: Ghost Mode Toggle

#### Decision 6.1: Toggle Visual Style

| Option | Style |
|--------|-------|
| **A: iOS Switch** | Sliding toggle |
| **B: Checkbox** | Check mark |
| **C: Button** | Toggle button |
| **D: Segmented** | [Visible] [Hidden] |

**Industry Comparison:**

| Company | Toggle Style |
|---------|--------------|
| **Apple** | iOS switch |
| **ChatGPT** | iOS switch |
| **Linear** | iOS switch |
| **Notion** | iOS-style |

**✓ LOCKED: A — iOS-Style Switch**

Universal understanding. Apple lineage. Premium feel.

---

#### Decision 6.2: Toggle Colors

| Option | Off State | On State |
|--------|-----------|----------|
| **A: Grayscale** | Gray track | White knob |
| **B: Gold Active** | Gray track | Gold knob |
| **C: Inverted** | Gray track | White track |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Grayscale** | "Everything else grayscale" — fits system | ⭐⭐⭐⭐⭐ |
| **B: Gold Active** | Gold not for settings — not activity | ⭐⭐ |
| **C: Inverted** | Could work | ⭐⭐⭐ |

**✓ LOCKED: A — Grayscale**

Ghost mode is a privacy SETTING, not an ACTIVITY or ACHIEVEMENT. Gold reserved for presence, CTAs.

---

### Pattern 5 Component Decisions Summary

| Component | Key Decision | Lock |
|-----------|--------------|------|
| Avatar | Shape | Rounded Square (22%) — Apple/Tinder lineage |
| Avatar | Sizes | Contextual 6-tier — each has purpose |
| Avatar | Fallback | Styled Monogram — elegant, restrained |
| Avatar | Loading | Skeleton Shimmer — per PRINCIPLES |
| Presence | Form | Dot — universal, subtle |
| Presence | Color | Gold — activity = gold per PRINCIPLES |
| Presence | Animation | 3s pulse — "living things breathe" |
| Presence | States | Binary — no surveillance |
| Stats | What to show | Spaces + Tools + text only connections |
| Stats | Number style | Separated (Apple pattern) |
| Stats | Connections | "people you both know" — no count |
| Widget | Shape | 16px radius — warm, Apple/ChatGPT |
| Widget | Border | 1px at 6% — subtle presence |
| Widget | Header | Subtle uppercase label |
| Widget | Empty | Placeholder with prompt |
| Profile Card | Variants | Three sizes (Mini/Standard/Expanded) |
| Profile Card | CTA | Expanded only — progressive disclosure |
| Ghost Toggle | Style | iOS switch |
| Ghost Toggle | Color | Grayscale — setting, not activity |

---

### Avatar System

The foundational identity element. Rounded squares for intimacy (Tinder/Apple feel).

#### Size Variants

| Context | Size | Radius | Use |
|---------|------|--------|-----|
| Profile page | 100px | 22px | Hero moment |
| Hover card | 64px | 14px | Recognition |
| Member list | 40px | 9px | Scanning |
| Chat/header | 32px | 7px | Compact |
| Inline mention | 20px | 4px | Text flow |

#### CSS Specification

```css
/* === AVATAR BASE === */

.avatar {
  border-radius: 22%;
  aspect-ratio: 1;
  object-fit: cover;
  background: #1A1A1A;
  flex-shrink: 0;
}

/* Size variants */
.avatar--xl {
  width: 100px;
  height: 100px;
}

.avatar--lg {
  width: 64px;
  height: 64px;
}

.avatar--md {
  width: 40px;
  height: 40px;
}

.avatar--sm {
  width: 32px;
  height: 32px;
}

.avatar--xs {
  width: 20px;
  height: 20px;
}

/* === AVATAR FALLBACK (Initials) === */

.avatar-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-weight: 600;
  color: #FAFAFA;
  text-transform: uppercase;
}

.avatar-fallback--xl { font-size: 40px; }
.avatar-fallback--lg { font-size: 26px; }
.avatar-fallback--md { font-size: 16px; }
.avatar-fallback--sm { font-size: 13px; }
.avatar-fallback--xs { font-size: 8px; }

/* Gradient backgrounds generated from name hash */
.avatar-fallback[data-hue="0"] { background: linear-gradient(135deg, #2D1F3D 0%, #1A1A2E 100%); }
.avatar-fallback[data-hue="1"] { background: linear-gradient(135deg, #1F2D3D 0%, #1A2A2E 100%); }
.avatar-fallback[data-hue="2"] { background: linear-gradient(135deg, #2D2D1F 0%, #2E2A1A 100%); }
.avatar-fallback[data-hue="3"] { background: linear-gradient(135deg, #3D1F2D 0%, #2E1A2A 100%); }
.avatar-fallback[data-hue="4"] { background: linear-gradient(135deg, #1F3D2D 0%, #1A2E2A 100%); }

/* === AVATAR WITH PRESENCE === */

.avatar-wrapper {
  position: relative;
  display: inline-block;
}

.avatar-wrapper__presence {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  background: #FFD700;
  border-radius: 50%;
  border: 3px solid var(--page-bg, #0A0A0A);
  animation: presence-breathe 3s ease-in-out infinite;
}

/* Scale presence dot with avatar size */
.avatar-wrapper--xl .avatar-wrapper__presence {
  width: 14px;
  height: 14px;
  bottom: 2px;
  right: 2px;
}

.avatar-wrapper--lg .avatar-wrapper__presence {
  width: 12px;
  height: 12px;
}

.avatar-wrapper--md .avatar-wrapper__presence {
  width: 10px;
  height: 10px;
  border-width: 2px;
}

.avatar-wrapper--sm .avatar-wrapper__presence {
  width: 8px;
  height: 8px;
  border-width: 2px;
}

.avatar-wrapper--xs .avatar-wrapper__presence {
  display: none; /* Too small for presence dot */
}

@keyframes presence-breathe {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(0.92);
  }
}

/* Offline: no dot shown (absence, not state) */
.avatar-wrapper--offline .avatar-wrapper__presence {
  display: none;
}

/* Ghost mode (self only): dashed border, no fill */
.avatar-wrapper--ghost .avatar-wrapper__presence {
  background: transparent;
  border: 2px dashed #4A4A4A;
  animation: none;
}
```

#### Component API

```typescript
interface AvatarProps {
  src?: string;
  name: string;              // For fallback initials + aria-label
  size: 'xl' | 'lg' | 'md' | 'sm' | 'xs';
  presence?: 'online' | 'offline' | 'ghost';
  className?: string;
}

// Usage
<Avatar
  src={user.avatarUrl}
  name={user.displayName}
  size="lg"
  presence="online"
/>
```

---

### Presence Indicator

Gold dot indicates online presence. No location tracking. No "last active" timestamps.

#### States

| State | Visual | Meaning |
|-------|--------|---------|
| Online | Gold dot, breathing animation | User is active on HIVE |
| Offline | No dot (absence) | User is not active |
| Ghost | Dashed circle (to self only) | User is in ghost mode |

#### CSS Specification

```css
/* === STANDALONE PRESENCE DOT === */

.presence-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.presence-dot--online {
  background: #FFD700;
  animation: presence-breathe 3s ease-in-out infinite;
}

.presence-dot--offline {
  display: none;
}

/* === PRESENCE TEXT (Profile header) === */

.presence-text {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #A1A1A6;
}

.presence-text__dot {
  width: 6px;
  height: 6px;
  background: #FFD700;
  border-radius: 50%;
  animation: presence-breathe 3s ease-in-out infinite;
}

.presence-text__label {
  color: #A1A1A6;
}
```

---

### Profile Header

The hero moment of identity. Centered, generous spacing, Apple reverence.

#### Layout

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              64px                                       │
│                                                                         │
│                         ┌────────────┐                                  │
│                         │            │                                  │
│                         │   AVATAR   │                                  │
│                         │   100px    │ ·                                │
│                         └────────────┘                                  │
│                              24px                                       │
│                            Name Here                                    │
│                              8px                                        │
│                            @handle                                      │
│                              16px                                       │
│                    Details · Details · Details                          │
│                              24px                                       │
│                   Bio line goes here...                                 │
│                              32px                                       │
│                    [Connect]    [Message]                               │
│                              48px                                       │
│                             · · ·                                       │
│                              32px                                       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### CSS Specification

```css
/* === PROFILE HEADER === */

.profile-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 64px 24px 32px;
  text-align: center;
}

/* Avatar */
.profile-header__avatar {
  margin-bottom: 24px;
}

/* Name */
.profile-header__name {
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: #FAFAFA;
  margin: 0;
}

/* Handle */
.profile-header__handle {
  font-family: 'SF Mono', 'JetBrains Mono', monospace;
  font-size: 15px;
  font-weight: 400;
  color: #A1A1A6;
  margin-top: 8px;
}

/* Metadata (Major · Year · School) */
.profile-header__meta {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #6B6B6B;
  margin-top: 16px;
}

.profile-header__meta-separator {
  margin: 0 8px;
  color: #4A4A4A;
}

/* Bio */
.profile-header__bio {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 400;
  line-height: 1.5;
  color: #A1A1A6;
  max-width: 420px;
  margin-top: 24px;
}

/* Actions */
.profile-header__actions {
  display: flex;
  gap: 12px;
  margin-top: 32px;
}

/* Dot separator */
.profile-header__separator {
  display: flex;
  justify-content: center;
  gap: 8px;
  margin-top: 48px;
  padding-bottom: 32px;
}

.profile-header__separator-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #3A3A3A;
}

/* === PROFILE ACTIONS === */

.profile-action {
  padding: 10px 24px;
  border-radius: 8px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 150ms ease;
  border: none;
}

/* Connect button (Primary - Gold) */
.profile-action--primary {
  background: #FFD700;
  color: #0A0A0A;
}

.profile-action--primary:hover {
  background: #E5C200;
  transform: translateY(-1px);
}

.profile-action--primary:active {
  transform: translateY(0);
}

/* Message button (Secondary) */
.profile-action--secondary {
  background: #1A1A1A;
  color: #FAFAFA;
  border: 1px solid #2A2A2A;
}

.profile-action--secondary:hover {
  background: #242424;
  border-color: #3A3A3A;
}

/* Connected state (Outline) */
.profile-action--connected {
  background: transparent;
  color: #6B6B6B;
  border: 1px solid #2A2A2A;
}

.profile-action--connected:hover {
  border-color: #3A3A3A;
  color: #A1A1A6;
}

/* Pending state */
.profile-action--pending {
  background: #1A1A1A;
  color: #6B6B6B;
  cursor: default;
}

/* Focus states - WHITE, never gold */
.profile-action:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}
```

#### Component API

```typescript
interface ProfileHeaderProps {
  user: {
    id: string;
    avatarUrl?: string;
    displayName: string;
    handle: string;
    major?: string;
    year?: string;
    school: string;
    bio?: string;
    isOnline: boolean;
    isGhost?: boolean;
  };
  connectionStatus: 'none' | 'pending_sent' | 'pending_received' | 'connected';
  isOwnProfile: boolean;
  onConnect: () => void;
  onMessage: () => void;
}
```

---

### Bento Grid System

G5 Hybrid: Smart defaults + template override + full customization.

#### Grid Structure

```css
/* === BENTO GRID === */

.bento-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 0 24px 48px;
  max-width: 800px;
  margin: 0 auto;
}

/* Widget sizes */
.bento-widget--1x1 { grid-column: span 1; grid-row: span 1; }
.bento-widget--2x1 { grid-column: span 2; grid-row: span 1; }
.bento-widget--2x2 { grid-column: span 2; grid-row: span 2; }
.bento-widget--3x1 { grid-column: span 3; grid-row: span 1; }
.bento-widget--4x1 { grid-column: span 4; grid-row: span 1; }
.bento-widget--4x2 { grid-column: span 4; grid-row: span 2; }

/* Widget base */
.bento-widget {
  background: #141414;
  border: 1px solid #1F1F1F;
  border-radius: 16px;
  padding: 20px;
  min-height: 120px;
  display: flex;
  flex-direction: column;
}

.bento-widget__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.bento-widget__title {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 500;
  color: #6B6B6B;
}

.bento-widget__action {
  font-size: 13px;
  color: #A1A1A6;
  text-decoration: none;
  transition: color 150ms ease;
}

.bento-widget__action:hover {
  color: #FAFAFA;
}

.bento-widget__content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

/* === MOBILE GRID === */

@media (max-width: 768px) {
  .bento-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 0 16px 32px;
  }

  .bento-widget--3x1,
  .bento-widget--4x1,
  .bento-widget--4x2 {
    grid-column: span 2;
  }
}

@media (max-width: 480px) {
  .bento-grid {
    grid-template-columns: 1fr;
  }

  .bento-widget--1x1,
  .bento-widget--2x1,
  .bento-widget--2x2,
  .bento-widget--3x1,
  .bento-widget--4x1,
  .bento-widget--4x2 {
    grid-column: span 1;
  }
}
```

#### Templates

```css
/* === TEMPLATE: BUILDER === */
.bento-grid--builder {
  /* Pinned Tool: 4x2, Tools: 2x2, Rhythm: 2x2, Spaces: 4x1 */
}

/* === TEMPLATE: SOCIAL === */
.bento-grid--social {
  /* Spaces: 2x2, People: 2x2, About: 4x1, Tools: 2x1 */
}

/* === TEMPLATE: MINIMAL === */
.bento-grid--minimal {
  /* Spaces: 4x1, Tools: 4x1 (if any) */
}
```

---

### Widget Specifications

#### About Widget

```css
/* === ABOUT WIDGET === */

.widget-about__bio {
  font-size: 15px;
  line-height: 1.6;
  color: #FAFAFA;
  margin-bottom: 16px;
}

.widget-about__interests {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.widget-about__interest {
  padding: 4px 12px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 100px;
  font-size: 13px;
  color: #A1A1A6;
}
```

#### Spaces Widget

```css
/* === SPACES WIDGET === */

.widget-spaces__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.widget-spaces__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.widget-spaces__icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: #1A1A1A;
}

.widget-spaces__name {
  font-size: 14px;
  color: #FAFAFA;
  flex: 1;
}

.widget-spaces__more {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 12px;
}
```

#### Tools Widget

```css
/* === TOOLS WIDGET === */

.widget-tools__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.widget-tools__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #1A1A1A;
  border-radius: 12px;
  transition: background 150ms ease;
}

.widget-tools__item:hover {
  background: #242424;
}

.widget-tools__icon {
  font-size: 20px;
}

.widget-tools__info {
  flex: 1;
}

.widget-tools__name {
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
}

.widget-tools__desc {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 2px;
}
```

#### People Widget (Connections)

```css
/* === PEOPLE WIDGET === */

.widget-people__mutual {
  margin-bottom: 16px;
}

.widget-people__mutual-label {
  font-size: 13px;
  color: #6B6B6B;
  margin-bottom: 12px;
}

.widget-people__mutual-faces {
  display: flex;
  align-items: center;
  gap: 8px;
}

.widget-people__mutual-avatar {
  width: 32px;
  height: 32px;
  border-radius: 22%;
  margin-left: -8px;
  border: 2px solid #141414;
}

.widget-people__mutual-avatar:first-child {
  margin-left: 0;
}

.widget-people__mutual-names {
  font-size: 14px;
  color: #A1A1A6;
  margin-left: 8px;
}
```

#### Rhythm Widget (Activity Graph)

```css
/* === RHYTHM WIDGET === */

.widget-rhythm {
  /* No title, just the graph */
}

.widget-rhythm__graph {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 48px;
  padding: 8px 0;
}

.widget-rhythm__bar {
  flex: 1;
  background: #2A2A2A;
  border-radius: 2px;
  min-height: 4px;
  transition: background 150ms ease;
}

.widget-rhythm__bar:hover {
  background: #4A4A4A;
}

/* Height variants (set via inline style or data attribute) */
.widget-rhythm__bar[data-level="1"] { height: 20%; }
.widget-rhythm__bar[data-level="2"] { height: 40%; }
.widget-rhythm__bar[data-level="3"] { height: 60%; }
.widget-rhythm__bar[data-level="4"] { height: 80%; }
.widget-rhythm__bar[data-level="5"] { height: 100%; }

/* NO NUMBERS. No "142 contributions". Just visual. */
```

#### Pinned Tool Widget

```css
/* === PINNED TOOL WIDGET === */

.widget-pinned-tool {
  display: flex;
  flex-direction: column;
}

.widget-pinned-tool__preview {
  flex: 1;
  background: #1A1A1A;
  border-radius: 12px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16px;
}

.widget-pinned-tool__preview-placeholder {
  font-size: 32px;
}

.widget-pinned-tool__name {
  font-size: 16px;
  font-weight: 600;
  color: #FAFAFA;
  margin-bottom: 4px;
}

.widget-pinned-tool__desc {
  font-size: 14px;
  color: #A1A1A6;
  line-height: 1.5;
}

.widget-pinned-tool__cta {
  margin-top: 16px;
  padding: 10px 20px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  color: #FAFAFA;
  font-size: 14px;
  text-align: center;
  transition: all 150ms ease;
}

.widget-pinned-tool__cta:hover {
  background: #242424;
  border-color: #3A3A3A;
}

/* NO GOLD for "high usage". Tool cards don't get gold accents. */
```

#### Currently Building Widget

```css
/* === CURRENTLY BUILDING WIDGET === */

.widget-building__status {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.widget-building__status-dot {
  width: 8px;
  height: 8px;
  background: #FFD700;
  border-radius: 50%;
  animation: presence-breathe 3s ease-in-out infinite;
}

.widget-building__status-label {
  font-size: 12px;
  font-weight: 500;
  color: #A1A1A6;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.widget-building__name {
  font-size: 16px;
  font-weight: 600;
  color: #FAFAFA;
  margin-bottom: 8px;
}

.widget-building__desc {
  font-size: 14px;
  color: #A1A1A6;
}

.widget-building__progress {
  margin-top: 16px;
  height: 4px;
  background: #2A2A2A;
  border-radius: 2px;
  overflow: hidden;
}

.widget-building__progress-bar {
  height: 100%;
  background: #4A4A4A;
  border-radius: 2px;
  transition: width 300ms ease;
}
```

#### Quote Widget

```css
/* === QUOTE WIDGET === */

.widget-quote__text {
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 500;
  font-style: italic;
  line-height: 1.5;
  color: #FAFAFA;
}

.widget-quote__text::before {
  content: '"';
  color: #4A4A4A;
}

.widget-quote__text::after {
  content: '"';
  color: #4A4A4A;
}

.widget-quote__source {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 12px;
}
```

#### Ask Me About Widget

```css
/* === ASK ME ABOUT WIDGET === */

.widget-askme__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.widget-askme__tag {
  padding: 8px 16px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  font-size: 14px;
  color: #FAFAFA;
  transition: all 150ms ease;
}

.widget-askme__tag:hover {
  background: #242424;
  border-color: #3A3A3A;
}
```

#### Links Widget

```css
/* === LINKS WIDGET === */

.widget-links__list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.widget-links__item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #1A1A1A;
  border-radius: 8px;
  text-decoration: none;
  transition: background 150ms ease;
}

.widget-links__item:hover {
  background: #242424;
}

.widget-links__icon {
  width: 20px;
  height: 20px;
  color: #6B6B6B;
}

.widget-links__url {
  font-size: 14px;
  color: #A1A1A6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

---

### Profile Cards (Compact)

Three size variants for different contexts.

#### Mini Card (Inline)

```css
/* === PROFILE CARD MINI === */

.profile-card-mini {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.profile-card-mini__avatar {
  width: 20px;
  height: 20px;
  border-radius: 22%;
}

.profile-card-mini__name {
  font-size: 14px;
  font-weight: 500;
  color: #FAFAFA;
}
```

#### Standard Card (Lists)

```css
/* === PROFILE CARD STANDARD === */

.profile-card-standard {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #141414;
  border: 1px solid #1F1F1F;
  border-radius: 12px;
  position: relative;
  transition: background 150ms ease;
}

.profile-card-standard:hover {
  background: #1A1A1A;
}

.profile-card-standard__avatar {
  width: 40px;
  height: 40px;
  border-radius: 22%;
  flex-shrink: 0;
}

.profile-card-standard__info {
  flex: 1;
  min-width: 0;
}

.profile-card-standard__name {
  font-size: 15px;
  font-weight: 600;
  color: #FAFAFA;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-card-standard__handle {
  font-family: 'SF Mono', monospace;
  font-size: 13px;
  color: #A1A1A6;
  margin-top: 2px;
}

.profile-card-standard__meta {
  font-size: 13px;
  color: #6B6B6B;
}

.profile-card-standard__mutual {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 4px;
}

.profile-card-standard__presence {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 8px;
  height: 8px;
  background: #FFD700;
  border-radius: 50%;
  animation: presence-breathe 3s ease-in-out infinite;
}
```

#### Expanded Card (Hover)

```css
/* === PROFILE CARD EXPANDED === */

.profile-card-expanded {
  width: 320px;
  padding: 20px;
  background: #141414;
  border: 1px solid #1F1F1F;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

.profile-card-expanded__header {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.profile-card-expanded__avatar {
  width: 64px;
  height: 64px;
  border-radius: 22%;
  flex-shrink: 0;
}

.profile-card-expanded__info {
  flex: 1;
}

.profile-card-expanded__name {
  font-size: 18px;
  font-weight: 600;
  color: #FAFAFA;
}

.profile-card-expanded__handle {
  font-family: 'SF Mono', monospace;
  font-size: 14px;
  color: #A1A1A6;
  margin-top: 4px;
}

.profile-card-expanded__meta {
  font-size: 13px;
  color: #6B6B6B;
  margin-top: 4px;
}

.profile-card-expanded__presence {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #A1A1A6;
}

.profile-card-expanded__presence-dot {
  width: 6px;
  height: 6px;
  background: #FFD700;
  border-radius: 50%;
}

.profile-card-expanded__bio {
  font-size: 14px;
  line-height: 1.5;
  color: #A1A1A6;
  margin-bottom: 16px;
}

.profile-card-expanded__section {
  background: #1A1A1A;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 12px;
}

.profile-card-expanded__section-label {
  font-size: 11px;
  font-weight: 500;
  color: #6B6B6B;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 8px;
}

.profile-card-expanded__spaces {
  font-size: 13px;
  color: #A1A1A6;
}

.profile-card-expanded__mutual {
  display: flex;
  align-items: center;
  gap: 8px;
}

.profile-card-expanded__mutual-faces {
  display: flex;
}

.profile-card-expanded__mutual-avatar {
  width: 24px;
  height: 24px;
  border-radius: 22%;
  margin-left: -6px;
  border: 2px solid #1A1A1A;
}

.profile-card-expanded__mutual-avatar:first-child {
  margin-left: 0;
}

.profile-card-expanded__mutual-text {
  font-size: 13px;
  color: #A1A1A6;
}

.profile-card-expanded__actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.profile-card-expanded__action {
  flex: 1;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  cursor: pointer;
  transition: all 150ms ease;
}

.profile-card-expanded__action--primary {
  background: #FFD700;
  color: #0A0A0A;
}

.profile-card-expanded__action--primary:hover {
  background: #E5C200;
}

.profile-card-expanded__action--secondary {
  background: #1A1A1A;
  color: #FAFAFA;
  border: 1px solid #2A2A2A;
}

.profile-card-expanded__action--secondary:hover {
  background: #242424;
}
```

---

### Ghost Mode Toggle

Quick access in profile dropdown.

```css
/* === GHOST MODE TOGGLE === */

.ghost-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #1A1A1A;
  border-radius: 8px;
  cursor: pointer;
  transition: background 150ms ease;
}

.ghost-toggle:hover {
  background: #242424;
}

.ghost-toggle__label {
  display: flex;
  align-items: center;
  gap: 8px;
}

.ghost-toggle__icon {
  font-size: 16px;
}

.ghost-toggle__text {
  font-size: 14px;
  color: #FAFAFA;
}

.ghost-toggle__duration {
  font-size: 13px;
  color: #6B6B6B;
  padding: 4px 8px;
  background: #141414;
  border-radius: 4px;
}

/* Active state */
.ghost-toggle--active {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.ghost-toggle--active .ghost-toggle__text {
  color: #A1A1A6;
}
```

---

### Empty States

Natural invitations, not nagging. No "Complete your profile!" energy.

```css
/* === PROFILE EMPTY STATE === */

.profile-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 24px;
  text-align: center;
  min-height: 120px;
}

.profile-empty__text {
  font-size: 15px;
  color: #6B6B6B;
  margin-bottom: 16px;
}

.profile-empty__cta {
  padding: 10px 20px;
  background: #1A1A1A;
  border: 1px solid #2A2A2A;
  border-radius: 8px;
  font-size: 14px;
  color: #FAFAFA;
  cursor: pointer;
  transition: all 150ms ease;
}

.profile-empty__cta:hover {
  background: #242424;
  border-color: #3A3A3A;
}

/* Widget-specific empty messages */
.widget-empty--about .profile-empty__text::before { content: "What are you about?"; }
.widget-empty--spaces .profile-empty__text::before { content: "Find your people."; }
.widget-empty--tools .profile-empty__text::before { content: "Build something."; }
.widget-empty--people .profile-empty__text::before { content: "No one yet."; }
```

---

### Profile Skeleton

Pulse animation for loading state.

```css
/* === PROFILE SKELETON === */

.profile-skeleton {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 0.7; }
}

.profile-skeleton__avatar {
  width: 100px;
  height: 100px;
  border-radius: 22%;
  background: #1A1A1A;
  margin: 64px auto 24px;
}

.profile-skeleton__name {
  width: 160px;
  height: 28px;
  background: #1A1A1A;
  border-radius: 8px;
  margin: 0 auto;
}

.profile-skeleton__handle {
  width: 100px;
  height: 16px;
  background: #1A1A1A;
  border-radius: 4px;
  margin: 8px auto 0;
}

.profile-skeleton__bio {
  width: 280px;
  height: 16px;
  background: #1A1A1A;
  border-radius: 4px;
  margin: 24px auto 0;
}

.profile-skeleton__actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 32px;
}

.profile-skeleton__action {
  width: 100px;
  height: 40px;
  background: #1A1A1A;
  border-radius: 8px;
}

.profile-skeleton__widget {
  background: #141414;
  border: 1px solid #1F1F1F;
  border-radius: 16px;
  min-height: 120px;
}
```

---

### Pattern 5 Gold Summary

| Element | Gold | Rationale |
|---------|------|-----------|
| Online presence dot | ✅ Yes | Presence indicator |
| Connect button | ✅ Yes | Primary CTA |
| Currently Building dot | ✅ Yes | Live activity |
| Achievement badges | ❌ No | Removed (gamification) |
| Tool usage indicators | ❌ No | Removed (vanity) |
| Borders/decoration | ❌ No | Never decorative |
| Hover/focus states | ❌ No | White only |
| Activity graph | ❌ No | Just visual, no gold |

**Total gold on profile: ~2%** (one dot, one button)

---

## PATTERN 6: TOOL BUILDING (HiveLab)

### Philosophy

> **Building is the point. Everything else is infrastructure.**
>
> Premium tools that feel like Vercel/Cursor. Builder momentum without anxiety.
> Three paths in: blank canvas, template, or AI. Your choice.
> Ship to your community today.

### Upstream Alignment

| Principle | Implementation |
|-----------|----------------|
| "Building without permission" | Multi-entry (blank/template/AI), no gatekeeping |
| "Ship to your community today" | 3-step deploy, fast path to live |
| "Builder energy" | Gold accents on active building, momentum feel |
| "Restraint is confidence" | Premium IDE chrome, no decoration |

---

## PATTERN 6 DECISIONS (L7)

### Decision Process

Each pattern decision shapes HOW the building experience works — the flows, layouts, and interaction models.

---

### PATTERN DECISION 1: IDE Layout Model

| Option | Layout | Description |
|--------|--------|-------------|
| **A: Classic Three-Panel** | Sidebar-Canvas-Panel | VSCode/Figma fixed panels |
| **B: Canvas-First** | Floating panels | Miro/Linear minimal chrome |
| **C: Rail + Context** | Thin rail + slide panels | Cursor/Arc efficiency |
| **D: HIVE Synthesis** | Rail + Bottom Belt + Context | Grounded builder |

**Industry Comparison:**

| Company | Layout Model | Philosophy |
|---------|--------------|------------|
| **Figma** | Classic 3-panel | Designer standard |
| **Cursor** | Rail + context | Developer efficiency |
| **Linear** | Minimal chrome | Focus on content |
| **Framer** | Canvas-first | Creative freedom |
| **Vercel** | Dashboard + deploy | Infrastructure |
| **v0** | Chat + preview | AI-first |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Classic** | Professional but not distinctive | ⭐⭐⭐ |
| **B: Floating** | Modern but features hidden | ⭐⭐⭐ |
| **C: Rail** | Efficient but steep learning | ⭐⭐⭐⭐ |
| **D: HIVE** | Builder energy + premium + accessible | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — HIVE Synthesis**

```
┌─────────────────────────────────────────┐
│ [Command Bar: AI / Search / Title]      │
├────┬────────────────────────────────────┤
│    │                                    │
│Rail│         CANVAS (bounded)           │
│    │                                    │
│    │                    [Context Panel] │
├────┴────────────────────────────────────┤
│ [Element Belt: Horizontal Categories]   │
└─────────────────────────────────────────┘
```

Why: Command bar (AI-first), Rail (Cursor efficiency), Bottom belt (always accessible), Context panel (progressive disclosure), Bounded canvas (tools have edges).

---

### PATTERN DECISION 2: Canvas Philosophy

| Option | Canvas Type | Description |
|--------|-------------|-------------|
| **A: Infinite** | Extends forever | Figma/Miro pattern |
| **B: Page-Based** | Fixed pages | Traditional design |
| **C: Bounded** | Visible edges | App builder pattern |
| **D: Responsive** | Bounded + breakpoints | Web-focused |

**Industry Comparison:**

| Company | Canvas | Why |
|---------|--------|-----|
| **Figma** | Infinite | Design exploration |
| **Framer** | Bounded + breakpoints | Real output |
| **Webflow** | Responsive bounded | Web reality |
| **Retool** | Bounded | App building |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Infinite** | Too open-ended for tools | ⭐⭐ |
| **B: Page** | Dated, not web-native | ⭐⭐ |
| **C: Bounded** | Tools are finite, clear output | ⭐⭐⭐⭐⭐ |
| **D: Responsive** | Future state, adds complexity | ⭐⭐⭐⭐ |

**✓ LOCKED: C — Bounded Canvas**

Why: HiveLab tools are utilities, not infinite design files. Bounded = what you build is what deploys.

---

### PATTERN DECISION 3: Element Organization

| Option | Organization |
|--------|--------------|
| **A: Single List** | All elements in one list |
| **B: Category Tabs** | Tab per category |
| **C: Tiered System** | Universal / Connected / Space |
| **D: Smart + Tiered** | AI suggestions + tiers |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Single** | Doesn't scale | ⭐⭐ |
| **B: Tabs** | Standard but not distinctive | ⭐⭐⭐ |
| **C: Tiered** | Matches 27-element architecture | ⭐⭐⭐⭐⭐ |
| **D: Smart** | Good future state | ⭐⭐⭐⭐ |

**✓ LOCKED: C — Tiered System**

```
[Universal ▼] [Connected ▼] [Space ▼] | [Search] [AI ✨]
```

Why: Matches our element architecture, teaches mental model, clear progression.

---

### PATTERN DECISION 4: Building Flow

| Option | Start Flow |
|--------|------------|
| **A: Blank Canvas** | Start empty |
| **B: Template-First** | Must pick template |
| **C: AI-First** | Start with prompt |
| **D: Multi-Entry** | Blank / Template / AI |

**Industry Comparison:**

| Company | Start Flow | Philosophy |
|---------|------------|------------|
| **Figma** | Blank or template | Designer choice |
| **v0** | AI prompt | AI-first |
| **Framer** | Template gallery | Quick results |
| **Notion** | Blank or template | Flexible |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Blank** | Freedom but paralysis risk | ⭐⭐⭐ |
| **B: Template** | Guided but restrictive | ⭐⭐⭐ |
| **C: AI-First** | Modern but impersonal | ⭐⭐⭐⭐ |
| **D: Multi-Entry** | "Building without permission" — your choice | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — Multi-Entry**

Why: Respects different builder styles, no gatekeeping.

---

### PATTERN DECISION 5: Save Model

| Option | Save Behavior |
|--------|---------------|
| **A: Manual** | Explicit save button |
| **B: Auto-Save** | Every change to cloud |
| **C: Draft Mode** | Local auto + explicit cloud |
| **D: Versions** | Auto-save + full history |

**Industry Comparison:**

| Company | Save Model | Philosophy |
|---------|------------|------------|
| **Figma** | Auto-save + versions | Never lose work |
| **Google Docs** | Auto-save | Always current |
| **VSCode** | Manual + backup | Developer control |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Manual** | Anxiety-inducing | ⭐⭐ |
| **B: Auto** | No experimentation room | ⭐⭐⭐ |
| **C: Draft** | Try things without fear | ⭐⭐⭐⭐⭐ |
| **D: Versions** | Good but complex for v1 | ⭐⭐⭐⭐ |

**✓ LOCKED: C — Draft Mode**

Why: Local auto-save (5s), explicit cloud save, undo stack (50 ops). Experiment freely.

---

### PATTERN DECISION 6: Deploy Flow

| Option | Deploy Steps |
|--------|--------------|
| **A: One-Click** | Single button |
| **B: Two-Step** | Preview → Confirm |
| **C: Three-Step** | Preview → Destination → Confirm |
| **D: Panel** | All options at once |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: One-Click** | Fast but risky | ⭐⭐⭐ |
| **B: Two-Step** | Good balance | ⭐⭐⭐⭐ |
| **C: Three-Step** | Guided, "Ship today" | ⭐⭐⭐⭐⭐ |
| **D: Panel** | Overwhelming | ⭐⭐ |

**✓ LOCKED: C — Three-Step Wizard**

```
Step 1: Preview ("This is how your tool will appear")
Step 2: Destination ("Where does it go?")
Step 3: Confirm ("Ready to ship!")
```

Why: Fast (3 clicks) but intentional. Clear path to live.

---

### PATTERN DECISION 7: AI Integration

| Option | AI Access |
|--------|-----------|
| **A: Separate Mode** | AI is different view |
| **B: Command Bar** | Cmd+K anywhere |
| **C: Inline** | Suggestions as you build |
| **D: Multi-Point** | Command + palette + right-click |

**Industry Comparison:**

| Company | AI Integration | Philosophy |
|---------|----------------|------------|
| **Cursor** | Inline + command | Developer flow |
| **v0** | Primary input | AI-first |
| **Notion** | Command bar | Available not intrusive |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Separate** | Context switching friction | ⭐⭐ |
| **B: Command** | Always available, builder flow | ⭐⭐⭐⭐⭐ |
| **C: Inline** | Could be noisy | ⭐⭐⭐ |
| **D: Multi-Point** | Future state | ⭐⭐⭐⭐ |

**✓ LOCKED: B — Command Bar (Cmd+K)**

Why: Invoke when needed, not intrusive. AI helps, doesn't take over.

---

### PATTERN DECISION 8: Template Model

| Option | Template Behavior |
|--------|-------------------|
| **A: Fork Only** | Clone, you own it |
| **B: Clone + Link** | Can pull updates |
| **C: Remix** | Credit original |
| **D: Fresh** | Templates just inspire |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Fork** | Clear ownership | ⭐⭐⭐⭐⭐ |
| **B: Link** | Complex for v1 | ⭐⭐⭐ |
| **C: Remix** | Social but complex | ⭐⭐⭐⭐ |
| **D: Fresh** | Defeats purpose | ⭐⭐ |

**✓ LOCKED: A — Fork Only**

Why: "Use as template" → it's now YOUR tool. Clear ownership.

---

### Pattern 6 Decisions Summary

| Decision | Question | Lock |
|----------|----------|------|
| IDE Layout | How panels arrange | HIVE Synthesis (Rail + Belt + Context) |
| Canvas | What is the canvas | Bounded (tools have edges) |
| Elements | How organized | Tiered (Universal / Connected / Space) |
| Start Flow | How to begin | Multi-Entry (Blank / Template / AI) |
| Save Model | How saving works | Draft Mode (local auto, explicit cloud) |
| Deploy Flow | Path to live | Three-Step Wizard |
| AI Integration | Where AI lives | Command Bar (Cmd+K) |
| Templates | How templates work | Fork Only (your copy) |

---

## PATTERN 6 COMPONENT DECISIONS (L6)

### Decision Process

Each component decision defines the building blocks used by Pattern 6.

---

### COMPONENT: ElementPaletteItem

#### Decision 1.1: Item Shape

| Option | Shape | Dimensions |
|--------|-------|------------|
| **A: Square** | 1:1 | 64×64px |
| **B: Landscape** | Wide | 80×48px |
| **C: Portrait** | Tall | 48×64px |
| **D: Circle** | Round | 56px |

**Industry Comparison:**

| Company | Item Shape | Feel |
|---------|------------|------|
| **Figma** | Square icons | Compact |
| **Notion** | Landscape | Readable |
| **Framer** | Square thumbnails | Visual |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Square** | Compact, fits grid | ⭐⭐⭐⭐⭐ |
| **B: Landscape** | Takes more belt space | ⭐⭐⭐ |
| **C: Portrait** | Awkward in horizontal belt | ⭐⭐ |
| **D: Circle** | Wastes space | ⭐⭐⭐ |

**✓ LOCKED: A — Square (64×64px)**

---

#### Decision 1.2: Item Content

| Option | Content |
|--------|---------|
| **A: Icon Only** | Icon, tooltip for name |
| **B: Icon + Label** | Icon above, label below |
| **C: Mini Preview** | Actual element render |
| **D: Label Only** | Text only |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Icon Only** | Cryptic for new users | ⭐⭐⭐ |
| **B: Icon + Label** | Clear identification | ⭐⭐⭐⭐⭐ |
| **C: Preview** | Complex to render | ⭐⭐⭐ |
| **D: Label** | Missing visual cue | ⭐⭐ |

**✓ LOCKED: B — Icon + Label**

---

#### Decision 1.3: Item Hover

| Option | Hover Effect |
|--------|--------------|
| **A: None** | Static |
| **B: Background** | Background change |
| **C: Border** | Border appears |
| **D: Gold Accent** | Gold treatment |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: None** | "Hover states matter" — violates | ⭐ |
| **B: Background** | Standard | ⭐⭐⭐⭐ |
| **C: Border** | Heavy | ⭐⭐⭐ |
| **D: Gold** | Invites building | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — Gold Accent (5% bg, 20% border)**

---

### COMPONENT: SelectionFrame

#### Decision 2.1: Frame Color

| Option | Color |
|--------|-------|
| **A: Blue** | Industry standard |
| **B: White** | Fits grayscale |
| **C: Gold** | Brand color |
| **D: Contextual** | Varies by type |

**Industry Comparison:**

| Company | Selection | Feel |
|---------|-----------|------|
| **Figma** | Blue | Industry standard |
| **Sketch** | Blue | Standard |
| **Framer** | Purple | Branded |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Blue** | Not in color system | ⭐⭐ |
| **B: White** | Fits grayscale | ⭐⭐⭐⭐⭐ |
| **C: Gold** | Gold for activity, not chrome | ⭐⭐ |
| **D: Contextual** | Inconsistent | ⭐⭐ |

**✓ LOCKED: B — White (50% opacity, 3% outer glow)**

---

#### Decision 2.2: Handle Style

| Option | Handle |
|--------|--------|
| **A: Squares** | Corner squares |
| **B: Circles** | Corner circles |
| **C: Diamonds** | Rotated squares |
| **D: Lines** | Edge midpoints |

**✓ LOCKED: A — Squares (8px, white, gold on hover)**

---

### COMPONENT: SnapGuide

#### Decision 3.1: Guide Color

| Option | Color |
|--------|-------|
| **A: Red** | High contrast |
| **B: Blue** | Standard |
| **C: White** | Fits system |
| **D: Gold** | Active feedback |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Red** | Error color, wrong context | ⭐ |
| **B: Blue** | Not in system | ⭐⭐ |
| **C: White** | Could miss | ⭐⭐⭐ |
| **D: Gold** | Active building feedback | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — Gold (60% opacity, glow effect)**

---

### COMPONENT: PropertiesSection

#### Decision 4.1: Header Style

| Option | Style |
|--------|-------|
| **A: Bold** | Prominent |
| **B: Subtle** | Small, uppercase |
| **C: Icon + Label** | Visual + text |
| **D: Divider** | Line only |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Bold** | Heavy | ⭐⭐ |
| **B: Subtle** | "Restraint is confidence" | ⭐⭐⭐⭐⭐ |
| **C: Icon** | More noise | ⭐⭐⭐ |
| **D: Divider** | Loses context | ⭐⭐ |

**✓ LOCKED: B — Subtle (12px, uppercase, #818187)**

---

#### Decision 4.2: Collapse Behavior

| Option | Behavior |
|--------|----------|
| **A: All Expanded** | Everything visible |
| **B: All Collapsed** | User expands |
| **C: Smart Default** | Common open, rare closed |
| **D: Remember** | Remembers preference |

**✓ LOCKED: D — Remember (with smart initial defaults)**

---

### COMPONENT: PropertyInput

#### Decision 5.1: Input Style

| Option | Style |
|--------|-------|
| **A: Full Width** | Spans panel |
| **B: Inline** | Label + input same row |
| **C: Stacked** | Label above |
| **D: Floating** | Label floats up |

**✓ LOCKED: B — Inline (compact, monospace)**

---

#### Decision 5.2: Change Feedback

| Option | Feedback |
|--------|----------|
| **A: None** | Silent |
| **B: Border Flash** | Border highlights |
| **C: Background Flash** | Background highlights |
| **D: Gold Flash** | Gold accent flash |

**✓ LOCKED: D — Gold Flash (300ms, 10% opacity)**

---

### COMPONENT: ToolCard

#### Decision 6.1: Card Layout

| Option | Layout |
|--------|--------|
| **A: Preview Only** | Screenshot only |
| **B: Preview + Meta** | Screenshot + info below |
| **C: Side by Side** | Preview left, info right |
| **D: Overlay** | Info overlays preview |

**Industry Comparison:**

| Company | Card Layout | Feel |
|---------|-------------|------|
| **App Store** | Preview + meta | Premium |
| **Figma Community** | Preview + meta | Standard |
| **Dribbble** | Preview focus | Visual |

**✓ LOCKED: B — Preview + Meta (vertical, Apple pattern)**

---

#### Decision 6.2: Usage Display

| Option | Usage |
|--------|-------|
| **A: Exact Count** | "847 uses" |
| **B: Tiered** | "100+ uses" |
| **C: None** | No usage shown |
| **D: Hover Only** | Hidden until hover |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Exact** | Vanity metric | ⭐ |
| **B: Tiered** | Shows trust without vanity | ⭐⭐⭐⭐ |
| **C: None** | Loses social proof | ⭐⭐⭐ |
| **D: Hover** | Progressive, not prominent | ⭐⭐⭐⭐⭐ |

**✓ LOCKED: D — Hover Only, Tiered (100+, 500+, 1K+)**

---

#### Decision 6.3: Hover Effect

| Option | Hover |
|--------|-------|
| **A: None** | Static |
| **B: Border** | Border highlights |
| **C: Lift** | translateY + shadow |
| **D: Scale** | Slight zoom |

**✓ LOCKED: C — Lift (translateY -4px, shadow increase)**

---

### COMPONENT: DeployStep

#### Decision 7.1: Step Indicator

| Option | Indicator |
|--------|-----------|
| **A: Numbers** | 1, 2, 3 |
| **B: Dots** | ○ ○ ○ |
| **C: Progress Bar** | ████░░ |
| **D: Checkmarks** | ✓ ○ ○ |

**Industry Comparison:**

| Company | Steps | Feel |
|---------|-------|------|
| **Apple** | Dots | Minimal |
| **Stripe** | Numbers + progress | Clear |

**✓ LOCKED: B — Dots (white, gold for current)**

---

#### Decision 7.2: Step Transition

| Option | Transition |
|--------|------------|
| **A: Cut** | Instant |
| **B: Fade** | Cross-fade |
| **C: Slide** | Horizontal |
| **D: Scale** | Zoom |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Cut** | "Never instant cuts" — violates | ❌ |
| **B: Fade** | Smooth per principles | ⭐⭐⭐⭐⭐ |
| **C: Slide** | Clear direction | ⭐⭐⭐⭐ |
| **D: Scale** | Playful | ⭐⭐⭐ |

**✓ LOCKED: B — Fade (300ms)**

---

### COMPONENT: AIPromptInput

#### Decision 8.1: Input Style

| Option | Style |
|--------|-------|
| **A: Single Line** | One-line |
| **B: Textarea** | Multi-line |
| **C: Chat** | Message bubbles |
| **D: Command** | Monospace |

**Industry Comparison:**

| Company | AI Input | Feel |
|---------|----------|------|
| **ChatGPT** | Textarea | Conversational |
| **v0** | Textarea | Builder |
| **Linear AI** | Single line | Quick |

**✓ LOCKED: B — Textarea (expandable, auto-grow)**

---

#### Decision 8.2: Submit Button

| Option | Button |
|--------|--------|
| **A: Gold Primary** | Full gold |
| **B: Outline** | Secondary |
| **C: Icon** | Sparkle only |
| **D: Text** | "Generate →" |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Gold** | Primary creation CTA | ⭐⭐⭐⭐⭐ |
| **B: Outline** | Not prominent | ⭐⭐⭐ |
| **C: Icon** | Missing context | ⭐⭐⭐ |
| **D: Text** | Too subtle | ⭐⭐ |

**✓ LOCKED: A — Gold Primary**

---

### COMPONENT: TemplateCard

#### Decision 9.1: Preview

| Option | Preview |
|--------|---------|
| **A: Screenshot** | Static image |
| **B: Live** | Actual render |
| **C: Illustration** | Stylized |
| **D: Placeholder** | Generic |

**✓ LOCKED: A — Screenshot (honest WYSIWYG)**

---

#### Decision 9.2: Info

| Option | Info |
|--------|------|
| **A: Name Only** | Title |
| **B: Name + Desc** | Title + description |
| **C: Name + Stats** | Title + usage |
| **D: Name + Category** | Title + badge |

**Upstream Alignment:**

| Option | Alignment | Score |
|--------|-----------|-------|
| **A: Name** | Too minimal | ⭐⭐ |
| **B: Desc** | Helpful | ⭐⭐⭐⭐⭐ |
| **C: Stats** | Vanity on templates | ⭐⭐ |
| **D: Category** | Useful | ⭐⭐⭐⭐ |

**✓ LOCKED: B — Name + Description (no stats)**

---

### Pattern 6 Component Decisions Summary

| Component | Decision | Lock |
|-----------|----------|------|
| ElementPaletteItem | Shape | Square (64×64) |
| ElementPaletteItem | Content | Icon + Label |
| ElementPaletteItem | Hover | Gold accent |
| SelectionFrame | Color | White |
| SelectionFrame | Handles | Squares (gold hover) |
| SnapGuide | Color | Gold (60%) |
| SnapGuide | Style | Glow line |
| PropertiesSection | Header | Subtle label |
| PropertiesSection | Collapse | Remember |
| PropertyInput | Style | Inline compact |
| PropertyInput | Feedback | Gold flash |
| ToolCard | Layout | Preview + Meta |
| ToolCard | Usage | Hover only, tiered |
| ToolCard | Hover | Lift effect |
| DeployStep | Indicator | Dots (gold current) |
| DeployStep | Transition | Fade (300ms) |
| AIPromptInput | Style | Textarea |
| AIPromptInput | Button | Gold primary |
| TemplateCard | Preview | Screenshot |
| TemplateCard | Info | Name + Description |

---

### Pattern 6 Gold Summary

| Component | Gold Usage | Justification |
|-----------|------------|---------------|
| ElementPaletteItem | Hover accent | Invites building |
| SelectionFrame | Handle hover | Active interaction |
| SnapGuide | Guide color | Alignment feedback |
| PropertyInput | Change flash | Confirms input |
| DeployStep | Current dot | Active step |
| AIPromptInput | Generate button | Primary creation CTA |

**Total: 6 gold touchpoints**, all tied to active building actions.

---

## PATTERN 6 CSS SPECIFICATIONS

### ElementPaletteItem

The building blocks in the element belt. Square tiles for maximum density in horizontal scroll.

#### Size & Layout

| Property | Value | Rationale |
|----------|-------|-----------|
| Dimensions | 64×64px | Fits 8+ in view on belt |
| Padding | 8px | Breathing room for icon |
| Gap | 4px between items | Tight but parseable |
| Border radius | 8px | Matches card system |

#### States

| State | Background | Border | Effect |
|-------|------------|--------|--------|
| Default | transparent | none | — |
| Hover | rgba(255,215,0,0.05) | rgba(255,215,0,0.2) | Gold invitation |
| Pressed | rgba(255,215,0,0.08) | rgba(255,215,0,0.3) | Confirm drag start |
| Dragging | rgba(255,215,0,0.1) | gold solid | Being moved |

#### CSS Specification

```css
/* === ELEMENT PALETTE ITEM === */

.element-palette-item {
  width: 64px;
  height: 64px;
  padding: 8px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  cursor: grab;
  background: transparent;
  border: 1px solid transparent;
  transition: all 150ms ease-out;
  flex-shrink: 0;
}

.element-palette-item:hover {
  background: rgba(255, 215, 0, 0.05);
  border-color: rgba(255, 215, 0, 0.2);
}

.element-palette-item:active {
  background: rgba(255, 215, 0, 0.08);
  border-color: rgba(255, 215, 0, 0.3);
  cursor: grabbing;
}

.element-palette-item--dragging {
  background: rgba(255, 215, 0, 0.1);
  border-color: #FFD700;
  opacity: 0.8;
}

/* Icon */
.element-palette-item__icon {
  width: 24px;
  height: 24px;
  color: #A1A1A6;
  transition: color 150ms ease-out;
}

.element-palette-item:hover .element-palette-item__icon {
  color: #FAFAFA;
}

/* Label */
.element-palette-item__label {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: #6B6B6B;
  text-align: center;
  line-height: 1.2;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 150ms ease-out;
}

.element-palette-item:hover .element-palette-item__label {
  color: #A1A1A6;
}

/* Category header in belt */
.element-belt__category {
  display: flex;
  align-items: center;
  padding: 0 16px;
  border-right: 1px solid rgba(255, 255, 255, 0.06);
}

.element-belt__category-label {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #4A4A4A;
  writing-mode: vertical-lr;
  transform: rotate(180deg);
}
```

#### Component API

```typescript
interface ElementPaletteItemProps {
  element: {
    id: string;
    name: string;
    icon: React.ReactNode;
    tier: 'universal' | 'connected' | 'space';
  };
  onDragStart: (element: Element) => void;
  isDragging?: boolean;
}
```

---

### SelectionFrame

Visual boundary when canvas elements are selected. White for grayscale purity, gold accents on handles.

#### Frame Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Border width | 1px | Subtle, precise |
| Border color | rgba(255,255,255,0.5) | Fits grayscale |
| Border style | solid | Clear boundary |
| Glow | 0 0 8px rgba(255,255,255,0.03) | Subtle depth |

#### Handle Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Size | 8×8px | Visible, grabbable |
| Shape | Square | Matches our aesthetic |
| Color | white | Grayscale system |
| Hover color | #FFD700 | Active interaction |
| Positions | 4 corners + 4 midpoints | Full resize control |

#### CSS Specification

```css
/* === SELECTION FRAME === */

.selection-frame {
  position: absolute;
  pointer-events: none;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.03);
}

/* Handles container */
.selection-frame__handles {
  position: absolute;
  inset: -4px;
}

/* Individual handle */
.selection-frame__handle {
  position: absolute;
  width: 8px;
  height: 8px;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  transition: all 150ms ease-out;
}

.selection-frame__handle:hover {
  background: #FFD700;
  transform: scale(1.2);
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

/* Corner handles */
.selection-frame__handle--nw {
  top: 0; left: 0;
  cursor: nw-resize;
}

.selection-frame__handle--ne {
  top: 0; right: 0;
  cursor: ne-resize;
}

.selection-frame__handle--sw {
  bottom: 0; left: 0;
  cursor: sw-resize;
}

.selection-frame__handle--se {
  bottom: 0; right: 0;
  cursor: se-resize;
}

/* Edge handles (midpoints) */
.selection-frame__handle--n {
  top: 0; left: 50%;
  transform: translateX(-50%);
  cursor: n-resize;
}

.selection-frame__handle--s {
  bottom: 0; left: 50%;
  transform: translateX(-50%);
  cursor: s-resize;
}

.selection-frame__handle--e {
  right: 0; top: 50%;
  transform: translateY(-50%);
  cursor: e-resize;
}

.selection-frame__handle--w {
  left: 0; top: 50%;
  transform: translateY(-50%);
  cursor: w-resize;
}

/* Multi-select (multiple elements selected) */
.selection-frame--multi {
  border-style: dashed;
  border-color: rgba(255, 255, 255, 0.3);
}

/* Locked element */
.selection-frame--locked .selection-frame__handle {
  background: #4A4A4A;
  cursor: not-allowed;
}

.selection-frame--locked .selection-frame__handle:hover {
  background: #4A4A4A;
  transform: none;
  box-shadow: none;
}
```

#### Component API

```typescript
interface SelectionFrameProps {
  bounds: { x: number; y: number; width: number; height: number };
  isMultiSelect?: boolean;
  isLocked?: boolean;
  onResize: (handle: ResizeHandle, delta: { x: number; y: number }) => void;
}

type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
```

---

### SnapGuide

Alignment guides that appear during drag. Gold for active building feedback.

#### Guide Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Width | 1px | Precise |
| Color | rgba(255,215,0,0.6) | Active feedback |
| Glow | 0 0 4px rgba(255,215,0,0.3) | Subtle emphasis |
| Extension | 16px beyond edges | Context for alignment |

#### CSS Specification

```css
/* === SNAP GUIDE === */

.snap-guide {
  position: absolute;
  background: rgba(255, 215, 0, 0.6);
  box-shadow: 0 0 4px rgba(255, 215, 0, 0.3);
  pointer-events: none;
  z-index: 1000;
}

/* Vertical guide */
.snap-guide--vertical {
  width: 1px;
  top: 0;
  bottom: 0;
}

/* Horizontal guide */
.snap-guide--horizontal {
  height: 1px;
  left: 0;
  right: 0;
}

/* Distance label (shows spacing value) */
.snap-guide__distance {
  position: absolute;
  background: rgba(255, 215, 0, 0.9);
  color: #0A0A0A;
  font-family: 'SF Mono', monospace;
  font-size: 10px;
  font-weight: 600;
  padding: 2px 4px;
  border-radius: 2px;
}

.snap-guide--vertical .snap-guide__distance {
  left: 4px;
  top: 50%;
  transform: translateY(-50%);
}

.snap-guide--horizontal .snap-guide__distance {
  top: 4px;
  left: 50%;
  transform: translateX(-50%);
}

/* Center indicator (when element is centered) */
.snap-guide--center::after {
  content: '';
  position: absolute;
  width: 6px;
  height: 6px;
  background: #FFD700;
  border-radius: 50%;
}

.snap-guide--vertical.snap-guide--center::after {
  left: -2px;
  top: 50%;
  transform: translateY(-50%);
}

.snap-guide--horizontal.snap-guide--center::after {
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
}

/* Grid snap indicator */
.snap-indicator {
  position: absolute;
  width: 4px;
  height: 4px;
  background: rgba(255, 215, 0, 0.4);
  border-radius: 50%;
  pointer-events: none;
  animation: snap-pulse 300ms ease-out;
}

@keyframes snap-pulse {
  0% {
    transform: scale(2);
    opacity: 0.8;
  }
  100% {
    transform: scale(1);
    opacity: 0;
  }
}
```

#### Component API

```typescript
interface SnapGuideProps {
  type: 'vertical' | 'horizontal';
  position: number;
  isCenter?: boolean;
  distance?: number;
}
```

---

### PropertiesSection

Collapsible groups in the properties panel. Subtle headers, remembered states.

#### Section Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Header height | 32px | Compact |
| Padding | 12px | Consistent spacing |
| Background | transparent | Inherits panel |
| Border | bottom 1px at 6% | Subtle separation |

#### CSS Specification

```css
/* === PROPERTIES SECTION === */

.properties-section {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.properties-section:last-child {
  border-bottom: none;
}

/* Header (collapsible trigger) */
.properties-section__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 32px;
  padding: 0 12px;
  cursor: pointer;
  user-select: none;
  transition: background 150ms ease-out;
}

.properties-section__header:hover {
  background: rgba(255, 255, 255, 0.02);
}

.properties-section__title {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #818187;
}

.properties-section__chevron {
  width: 12px;
  height: 12px;
  color: #4A4A4A;
  transition: transform 200ms ease-out;
}

.properties-section--collapsed .properties-section__chevron {
  transform: rotate(-90deg);
}

/* Content */
.properties-section__content {
  padding: 8px 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.properties-section--collapsed .properties-section__content {
  display: none;
}

/* Animate collapse (optional enhancement) */
.properties-section__content--animating {
  overflow: hidden;
  transition: height 200ms ease-out;
}
```

#### Component API

```typescript
interface PropertiesSectionProps {
  title: string;
  defaultExpanded?: boolean;
  persistKey?: string; // For remembering collapse state
  children: React.ReactNode;
}
```

---

### PropertyInput

Inline property editors. Compact, monospace values, gold flash on change.

#### Input Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Height | 28px | Compact |
| Font | SF Mono 12px | Values are data |
| Label width | 80px | Consistent alignment |
| Input background | rgba(255,255,255,0.04) | Subtle field |
| Focus ring | white 50% | Our focus standard |

#### Input Types

| Type | Appearance | Example |
|------|------------|---------|
| Text | Standard input | "Button Label" |
| Number | Input with increment | 16 |
| Color | Swatch + hex input | #FFD700 |
| Select | Dropdown | "Center" |
| Toggle | iOS switch | On/Off |

#### CSS Specification

```css
/* === PROPERTY INPUT === */

.property-input {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-input__label {
  width: 80px;
  flex-shrink: 0;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 500;
  color: #6B6B6B;
}

.property-input__field {
  flex: 1;
  min-width: 0;
}

/* Text/Number input */
.property-input__text {
  width: 100%;
  height: 28px;
  padding: 0 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: #FAFAFA;
  transition: all 150ms ease-out;
}

.property-input__text:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.property-input__text:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

/* Change feedback - gold flash */
.property-input__text--changed {
  animation: property-change-flash 300ms ease-out;
}

@keyframes property-change-flash {
  0% {
    background: rgba(255, 215, 0, 0.1);
    border-color: rgba(255, 215, 0, 0.3);
  }
  100% {
    background: rgba(255, 255, 255, 0.04);
    border-color: rgba(255, 255, 255, 0.08);
  }
}

/* Number input with stepper */
.property-input__number-wrapper {
  display: flex;
  align-items: center;
}

.property-input__number {
  width: 60px;
  text-align: center;
}

.property-input__stepper {
  display: flex;
  flex-direction: column;
  margin-left: -1px;
}

.property-input__stepper-btn {
  width: 20px;
  height: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #6B6B6B;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.property-input__stepper-btn:first-child {
  border-radius: 0 4px 0 0;
}

.property-input__stepper-btn:last-child {
  border-radius: 0 0 4px 0;
  margin-top: -1px;
}

.property-input__stepper-btn:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #FAFAFA;
}

/* Color input */
.property-input__color-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.property-input__color-swatch {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  flex-shrink: 0;
}

.property-input__color-hex {
  width: 72px;
}

/* Select */
.property-input__select {
  width: 100%;
  height: 28px;
  padding: 0 28px 0 8px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 4px;
  font-family: 'SF Mono', monospace;
  font-size: 12px;
  color: #FAFAFA;
  appearance: none;
  cursor: pointer;
  background-image: url("data:image/svg+xml,..."); /* Chevron */
  background-repeat: no-repeat;
  background-position: right 8px center;
}

/* Toggle */
.property-input__toggle {
  width: 36px;
  height: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  position: relative;
  cursor: pointer;
  transition: background 200ms ease-out;
}

.property-input__toggle--on {
  background: rgba(255, 255, 255, 0.3);
}

.property-input__toggle-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: white;
  border-radius: 50%;
  transition: transform 200ms ease-out;
}

.property-input__toggle--on .property-input__toggle-knob {
  transform: translateX(16px);
}
```

#### Component API

```typescript
interface PropertyInputProps {
  label: string;
  type: 'text' | 'number' | 'color' | 'select' | 'toggle';
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  options?: { value: string; label: string }[]; // For select
  min?: number; // For number
  max?: number;
  step?: number;
}
```

---

### ToolCard

Tool display in galleries, browse, and profile. Preview-forward with hover details.

#### Card Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Width | 280px (grid) | Fits 3-4 per row |
| Aspect | 4:3 preview | Standard thumbnail |
| Border radius | 12px | Matches card system |
| Background | #0F0F0F | Card elevation |
| Border | 1px at 6% | Subtle presence |

#### States

| State | Effect | Animation |
|-------|--------|-----------|
| Default | — | — |
| Hover | translateY(-4px), shadow | 200ms ease-out |
| Focus | White ring | — |
| Loading | Skeleton shimmer | — |

#### CSS Specification

```css
/* === TOOL CARD === */

.tool-card {
  width: 280px;
  background: #0F0F0F;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.tool-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.4);
  border-color: rgba(255, 255, 255, 0.1);
}

.tool-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

/* Preview (4:3 aspect) */
.tool-card__preview {
  aspect-ratio: 4 / 3;
  background: #1A1A1A;
  position: relative;
  overflow: hidden;
}

.tool-card__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Usage badge (hover only) */
.tool-card__usage {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  border-radius: 4px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #A1A1A6;
  opacity: 0;
  transform: translateY(4px);
  transition: all 200ms ease-out;
}

.tool-card:hover .tool-card__usage {
  opacity: 1;
  transform: translateY(0);
}

/* Meta section */
.tool-card__meta {
  padding: 12px 16px 16px;
}

.tool-card__name {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0;
  line-height: 1.3;
}

.tool-card__creator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
}

.tool-card__creator-avatar {
  width: 16px;
  height: 16px;
  border-radius: 22%;
}

.tool-card__creator-name {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 400;
  color: #6B6B6B;
}

/* Tier badge */
.tool-card__tier {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  border-radius: 4px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.tool-card__tier--universal { color: #A1A1A6; }
.tool-card__tier--connected { color: #7EB8FF; }
.tool-card__tier--space { color: #FFD700; }

/* Loading skeleton */
.tool-card--loading .tool-card__preview {
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
}

.tool-card--loading .tool-card__name,
.tool-card--loading .tool-card__creator-name {
  background: linear-gradient(90deg, #1A1A1A 25%, #2A2A2A 50%, #1A1A1A 75%);
  background-size: 200% 100%;
  animation: skeleton-shimmer 1.5s ease-in-out infinite;
  color: transparent;
  border-radius: 4px;
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
```

#### Component API

```typescript
interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    previewUrl?: string;
    creator: { name: string; avatarUrl?: string };
    tier: 'universal' | 'connected' | 'space';
    usageCount?: number;
  };
  showUsage?: boolean; // Show on hover
  onClick: () => void;
  isLoading?: boolean;
}
```

---

### DeployStep

Step indicators in the deploy wizard. Dots for minimal footprint, gold for active.

#### Step Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Dot size | 8px | Minimal |
| Gap | 12px | Clear separation |
| Active color | #FFD700 | Current step |
| Complete color | #4A4A4A | Done |
| Upcoming color | rgba(255,255,255,0.2) | Future |

#### CSS Specification

```css
/* === DEPLOY STEP === */

.deploy-steps {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.deploy-step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  transition: all 200ms ease-out;
}

.deploy-step-dot--complete {
  background: #4A4A4A;
}

.deploy-step-dot--active {
  background: #FFD700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.4);
}

/* Optional: Connecting lines */
.deploy-steps--with-lines {
  gap: 0;
}

.deploy-step-line {
  width: 32px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  transition: background 200ms ease-out;
}

.deploy-step-line--complete {
  background: #4A4A4A;
}

/* === DEPLOY WIZARD CONTENT === */

.deploy-wizard {
  display: flex;
  flex-direction: column;
  min-height: 400px;
}

.deploy-wizard__header {
  padding: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.deploy-wizard__title {
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-size: 20px;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 16px;
}

.deploy-wizard__content {
  flex: 1;
  padding: 24px;
  position: relative;
  overflow: hidden;
}

/* Step content with fade transition */
.deploy-wizard__step {
  position: absolute;
  inset: 24px;
  opacity: 0;
  transform: translateX(20px);
  transition: all 300ms ease-out;
  pointer-events: none;
}

.deploy-wizard__step--active {
  opacity: 1;
  transform: translateX(0);
  pointer-events: auto;
}

.deploy-wizard__step--exiting {
  opacity: 0;
  transform: translateX(-20px);
}

.deploy-wizard__footer {
  padding: 16px 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Step 1: Preview */
.deploy-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.deploy-preview__mockup {
  width: 100%;
  max-width: 400px;
  aspect-ratio: 16 / 10;
  background: #1A1A1A;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.deploy-preview__caption {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  color: #A1A1A6;
  text-align: center;
}

/* Step 2: Destination */
.deploy-destination__options {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.deploy-destination__option {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.deploy-destination__option:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.deploy-destination__option--selected {
  border-color: #FFD700;
  background: rgba(255, 215, 0, 0.05);
}

/* Step 3: Confirm */
.deploy-confirm {
  text-align: center;
}

.deploy-confirm__icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 16px;
  color: #FFD700;
}

.deploy-confirm__title {
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 8px;
}

.deploy-confirm__description {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  color: #A1A1A6;
}
```

#### Component API

```typescript
interface DeployStepProps {
  currentStep: 1 | 2 | 3;
  steps: Array<{
    title: string;
    content: React.ReactNode;
  }>;
  onNext: () => void;
  onBack: () => void;
  onComplete: () => void;
}
```

---

### AIPromptInput

AI generation input in command bar and start zone. Expandable textarea, gold generate button.

#### Input Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Min height | 44px | Single line start |
| Max height | 200px | Cap growth |
| Font | SF Pro Text 14px | Readable input |
| Background | rgba(255,255,255,0.04) | Subtle field |
| Border | 1px at 8% | Field boundary |

#### CSS Specification

```css
/* === AI PROMPT INPUT === */

.ai-prompt-input {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ai-prompt-input__wrapper {
  position: relative;
}

.ai-prompt-input__textarea {
  width: 100%;
  min-height: 44px;
  max-height: 200px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  color: #FAFAFA;
  resize: none;
  transition: all 150ms ease-out;
}

.ai-prompt-input__textarea::placeholder {
  color: #6B6B6B;
}

.ai-prompt-input__textarea:hover {
  border-color: rgba(255, 255, 255, 0.12);
}

.ai-prompt-input__textarea:focus {
  outline: none;
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.06);
}

/* Character count */
.ai-prompt-input__count {
  position: absolute;
  bottom: 8px;
  right: 12px;
  font-family: 'SF Mono', monospace;
  font-size: 11px;
  color: #4A4A4A;
  pointer-events: none;
}

.ai-prompt-input__count--warning {
  color: #FF9F0A;
}

.ai-prompt-input__count--error {
  color: #FF453A;
}

/* Actions row */
.ai-prompt-input__actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* Suggestions */
.ai-prompt-input__suggestions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.ai-prompt-input__suggestion {
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 12px;
  color: #A1A1A6;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.ai-prompt-input__suggestion:hover {
  background: rgba(255, 255, 255, 0.08);
  color: #FAFAFA;
}

/* Generate button (gold primary) */
.ai-prompt-input__generate {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: #FFD700;
  border: none;
  border-radius: 8px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #0A0A0A;
  cursor: pointer;
  transition: all 150ms ease-out;
}

.ai-prompt-input__generate:hover {
  background: #FFDF33;
  transform: translateY(-1px);
}

.ai-prompt-input__generate:active {
  background: #E5C200;
  transform: translateY(0);
}

.ai-prompt-input__generate:disabled {
  background: #4A4A4A;
  color: #818187;
  cursor: not-allowed;
  transform: none;
}

.ai-prompt-input__generate-icon {
  width: 16px;
  height: 16px;
}

/* Loading state */
.ai-prompt-input__generate--loading .ai-prompt-input__generate-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* === COMMAND BAR AI MODE === */

.command-bar--ai .ai-prompt-input__textarea {
  min-height: 36px;
  padding: 8px 12px;
  border-radius: 6px;
}

.command-bar--ai .ai-prompt-input__generate {
  padding: 8px 16px;
  font-size: 13px;
}
```

#### Component API

```typescript
interface AIPromptInputProps {
  placeholder?: string;
  maxLength?: number;
  suggestions?: string[];
  onSubmit: (prompt: string) => void;
  isLoading?: boolean;
  variant?: 'default' | 'command-bar';
}
```

---

### TemplateCard

Template gallery cards. Screenshot preview, name + description, no stats.

#### Card Specification

| Property | Value | Rationale |
|----------|-------|-----------|
| Width | 240px | Compact gallery |
| Aspect | 16:10 preview | Tool aspect |
| Border radius | 8px | Smaller card |
| Background | #0F0F0F | Card elevation |

#### CSS Specification

```css
/* === TEMPLATE CARD === */

.template-card {
  width: 240px;
  background: #0F0F0F;
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 200ms ease-out;
}

.template-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.1);
}

.template-card:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
}

/* Preview */
.template-card__preview {
  aspect-ratio: 16 / 10;
  background: #1A1A1A;
  overflow: hidden;
}

.template-card__preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 300ms ease-out;
}

.template-card:hover .template-card__preview-image {
  transform: scale(1.02);
}

/* Meta */
.template-card__meta {
  padding: 10px 12px 12px;
}

.template-card__name {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 13px;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0;
  line-height: 1.3;
}

.template-card__description {
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 11px;
  font-weight: 400;
  color: #6B6B6B;
  margin-top: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Category badge (optional) */
.template-card__category {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 10px;
  font-weight: 500;
  color: #818187;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

/* Featured variant */
.template-card--featured {
  width: 320px;
}

.template-card--featured .template-card__name {
  font-size: 15px;
}

.template-card--featured .template-card__description {
  font-size: 12px;
  -webkit-line-clamp: 3;
}

/* "Use Template" action on hover */
.template-card__action {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 6px 12px;
  background: rgba(255, 215, 0, 0.9);
  border: none;
  border-radius: 6px;
  font-family: 'SF Pro Text', -apple-system, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #0A0A0A;
  opacity: 0;
  transform: translateY(4px);
  transition: all 200ms ease-out;
  cursor: pointer;
}

.template-card:hover .template-card__action {
  opacity: 1;
  transform: translateY(0);
}

.template-card__action:hover {
  background: #FFD700;
}

/* Template gallery grid */
.template-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.template-gallery__section {
  margin-bottom: 32px;
}

.template-gallery__section-title {
  font-family: 'SF Pro Display', -apple-system, sans-serif;
  font-size: 16px;
  font-weight: 600;
  color: #FAFAFA;
  margin: 0 0 16px;
}
```

#### Component API

```typescript
interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string;
    previewUrl: string;
    category?: string;
  };
  isFeatured?: boolean;
  onSelect: (templateId: string) => void;
}
```

---

## BUILD ORDER

Implementation sequence based on dependencies:

### Phase 1: Foundation
1. EmptyState
2. ErrorState
3. LoadingOverlay
4. Skeleton (progressive)

### Phase 2: Navigation
5. MinimalSidebar
6. TopBar
7. Breadcrumb
8. CommandPalette

### Phase 3: Forms
9. SearchInput
10. FormField
11. ImageUploader
12. DatePicker

### Phase 4: Cards
13. SpaceCard
14. ToolCard
15. ProfileCard
16. EventCard
17. PostCard

### Phase 5: Data
18. DataTable
19. StatCard
20. ActivityFeed
21. LiveTicker

### Phase 6: Chat
22. MessageBubble
23. MessageGroup
24. ChatComposer
25. ThreadDrawer

### Phase 7: Profile
26. ProfileHeader
27. BentoGrid
28. ConnectionCard

### Phase 8: Space
29. SpaceHeader
30. SpaceHero
31. MemberList
32. SpaceRail

### Phase 9: HiveLab
33. ElementPalette
34. PropertiesPanel
35. ToolCanvas
36. LayersPanel

### Phase 10: Media
37. MediaViewer
38. ImageCropper
39. FileCard

---

## TESTING REQUIREMENTS

Each component needs:

1. **Visual regression** (Storybook + Chromatic)
   - All variants
   - All atmosphere contexts
   - Mobile breakpoints

2. **Accessibility** (axe-core + manual)
   - Keyboard navigation
   - Screen reader announcement
   - Focus management
   - Color contrast

3. **Interaction** (Testing Library)
   - Click handlers
   - Keyboard shortcuts
   - State changes

4. **Gold audit**
   - Verify gold usage matches specification
   - Total gold on screen within budget

---

## NEXT LEVEL

Components combine to form **Patterns (Level 7)** — recurring arrangements for specific user tasks.

See: `PATTERNS.md`

---

*Components are the sentences. Patterns are the paragraphs. Together they tell the HIVE story.*
