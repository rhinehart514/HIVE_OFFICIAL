# HIVE Discovery System: UI/UX Audit & Recommendations

**Last Updated:** February 2026
**Status:** Strategic Design Review
**Design DNA:** Spotify (personalized discovery) + Linear (command palette) + App Store (category browsing) + TikTok (algorithmic feed) + Pinterest (visual saves)

---

## Executive Summary

The HIVE discovery system currently delivers a functional "For You" feed with search, but lacks the **addictive serendipity** and **efficient intent-based navigation** that define 2026's best discovery experiences. This audit identifies 15 specific opportunities across visual design, layout, interaction, and experience layers.

**Core Tension:** Discovery must serve two opposite user modes:
1. **Browser** — "Show me something interesting" (Spotify's For You)
2. **Hunter** — "I know what I want, get me there" (Linear's Cmd+K)

Current implementation over-indexes on browse at the expense of hunt.

---

## Part 1: Visual Design Agents

### 1. Search Interface Designer

#### Current Assessment
- **Location:** `ExploreSearch.tsx` — ChatGPT-style prominent input (h-14, rounded-2xl)
- **What works:** Large touch target, clear icon, clear button, scope indicator support
- **What doesn't:**
  - No autocomplete/suggestions while typing
  - No recent searches shown
  - No keyboard shortcut hint (Cmd+K)
  - No voice search option
  - Results appear after debounce (300ms) with no intermediate feedback

#### 2026 Design Direction
**Reference:** Linear's command palette + Raycast's instant results

Linear shows:
- Keyboard shortcut badge (subtle, right-aligned)
- Recent items immediately on focus (before typing)
- Category chips that filter results
- Fuzzy matching with highlighted characters

Raycast shows:
- Action suggestions ("Search in Spaces", "Search People")
- Result preview on hover
- Keyboard navigation with arrow keys

#### Specific Recommendations

**A. Instant Suggestions Panel**
```
[Search bar with focus]
│
├── Recent (3 items)
│   └── "machine learning" · "robotics club" · "dorm B"
│
├── Quick Actions
│   └── [Browse Spaces] [Find People] [See Events]
│
└── Trending Now
    └── "AI Club" · "Housing Lottery" · "Career Fair"
```
- Show on focus, before user types
- Recent: Personal history (localStorage, sync if auth)
- Trending: Campus-wide hot searches from past 24h

**B. Typeahead Autocomplete**
- After 1 character: Show matching space names, person names
- Highlight matching characters (Linear-style)
- Max 6 suggestions, grouped by type
- Press Tab to complete, Enter to search

**C. Keyboard Navigation**
- Add `Cmd+K` / `Ctrl+K` global shortcut
- Arrow keys navigate suggestions
- Escape closes suggestions
- Badge in search bar: "Cmd+K" (subtle, 8px opacity 40%)

**D. Intermediate Loading State**
- Replace skeleton cards with shimmer animation inside existing layout
- Show "Searching spaces, people, events..." text
- Cancel previous request on new keystroke

**E. Voice Search** (Stretch)
- Microphone icon, right side
- Uses Web Speech API
- Transcription appears in real-time

#### Implementation Notes
- Debounce remains 300ms but show intermediate state immediately
- Recent searches: `localStorage.setItem('hive:recentSearches', JSON.stringify([]))`
- Trending: New endpoint `/api/search/trending` (aggregate from search logs)

---

### 2. Space Card Designer

#### Current Assessment
- **Location:** `SpaceCard.tsx` — Glass surface, tilt effect, reveals on stagger
- **Information shown:** Name, handle, description (2-line clamp), member count, last active, category badge, online indicator
- **What works:** Clean hierarchy, appropriate density, category badge
- **What doesn't:**
  - No preview image/banner
  - Online indicator only shows count, not faces
  - No "mutual friends" signal (data exists via `mutualEnrichment`)
  - No upcoming event teaser (data exists via `eventEnrichment`)
  - Join button not visible — requires click-through
  - No "Quick Join" for open spaces

#### 2026 Design Direction
**Reference:** Discord server preview + Spotify playlist card + App Store app preview

Discord shows:
- Banner image at top (optional)
- Online members with avatar stack
- "X friends are here" mutual signal

Spotify shows:
- Album art as hero visual
- Subtle gradient overlay for text legibility
- Secondary action (play) visible on hover

App Store shows:
- Screenshots carousel
- "Get" button directly on card
- Category + age rating inline

#### Specific Recommendations

**A. Information Hierarchy Redesign**
```
┌─────────────────────────────────────────┐
│  [Banner/Pattern/Gradient]  ← Optional  │
├─────────────────────────────────────────┤
│  🟢 3 online                     [Join] │
│  ──────────────────────────────────────│
│  Space Name Here                        │
│  @handle · Tech                         │
│                                         │
│  Description text that spans two lines  │
│  maximum with a proper ellipsis...      │
│                                         │
│  ──────────────────────────────────────│
│  👥 234 members · 🗓 Event Friday       │
│  [Avatar][Avatar][Avatar] +2 friends    │
└─────────────────────────────────────────┘
```

**B. Visual Signals Addition**
- **Online Faces:** Show 3 avatar circles (24px) for online members, not just count
- **Mutual Friends:** If `mutuals.count > 0`, show avatar stack + "X friends are here"
- **Next Event:** If `nextEvents.has(spaceId)`, show event name + relative time
- **Activity Heat:** Subtle glow intensity based on recent messages (last 24h)

**C. Direct Actions**
- **Quick Join Button:** For open spaces, show "Join" button directly on card
- **Request Access:** For closed spaces, show "Request" button with lock icon
- **Bookmark/Save:** Heart icon on hover (save for later)

**D. Ghost Space Card Enhancement** (`GhostSpaceCard.tsx`)
Current ghost cards show:
- Dashed border, "Unclaimed" badge
- Waitlist count
- "Notify Me" + "Claim This Space" buttons

**Enhancement:**
- Add urgency: "12 students waiting — claim in the next 24h to lead"
- Show top 3 waitlist avatars
- Pulsing animation on CTA when waitlist > 10

#### Implementation Notes
- Mutuals data: Already fetched in `browse-v2/route.ts` via `fetchMutualEnrichment`
- Events data: Already fetched via `fetchEventEnrichment`
- Need to pass these to SpaceCard component (currently transformed in `toSpaceBrowseDTOList`)
- Banner images: Add optional `bannerUrl` field to space schema

---

### 3. Person Card Designer

#### Current Assessment
- **Location:** `PeopleGrid.tsx` → `PersonCard` + `PersonCompactCard` (in explore page)
- **Information shown:** Avatar, name, handle, role/major, mutual spaces count, online indicator, "Connected" badge
- **What works:** Compact layout, mutual spaces signal, online indicator
- **What doesn't:**
  - No shared interests shown
  - No action buttons (connect, message) on card
  - No "context" — how did this person appear? (same major, same space, friend of friend)
  - Profile link goes to `/profile/${id}` but should be `/u/${handle}`

#### 2026 Design Direction
**Reference:** LinkedIn "People You May Know" + Twitter's "Who to follow" + Bumble's profile cards

LinkedIn shows:
- Connection path ("Via John Smith")
- Mutual connections count with faces
- "Connect" button inline

Twitter shows:
- Bio preview (1 line)
- "Follow" button inline
- "Based on your interests" context

Bumble shows:
- Shared interests as pills
- Action buttons prominent

#### Specific Recommendations

**A. Context-First Design**
```
┌─────────────────────────────────────────┐
│  [Avatar]  Sarah Chen                   │
│  (🟢)      @sarahc · CS '26             │
│                                         │
│  ╭──────────────────────────────────╮  │
│  │ 🔗 Same major · AI/ML interest   │  │ ← Why shown
│  ╰──────────────────────────────────╯  │
│                                         │
│  [🏠 2 mutual spaces]  [💬 Message]     │
└─────────────────────────────────────────┘
```

**B. Contextual Signals**
- **Why shown:** "Same major", "In your space", "Friend of @mike", "Shares 3 interests"
- **Shared interests:** Show 1-2 matching interest pills (small, muted)
- **Connection path:** If connected via mutual, show "Connected via @handle"

**C. Inline Actions**
- **Message:** If DMs enabled, show message icon
- **Connect:** If not connected, show connect/add button
- **View Profile:** Entire card is clickable

**D. Link Fix**
- Change `/profile/${person.id}` to `/u/${person.handle}` (handle-based URLs)

#### Implementation Notes
- Need to pass user's interests to people search for matching
- Connection path: Requires 2-hop connection query (expensive, cache heavily)
- DMs: Check `useFeatureFlags().dmsEnabled`

---

### 4. Category Browser

#### Current Assessment
- **Location:** No dedicated category browser exists
- **How categories work:** Categories are filters within search, not browsable surfaces
- **Available categories:** `major`, `interests`, `home`, `greek` (from browse API)
- **What's missing:**
  - No visual category grid/carousel
  - No "browse by interest" flow
  - No academic area navigation

#### 2026 Design Direction
**Reference:** Spotify's "Browse All" + App Store categories + Pinterest topic browsing

Spotify shows:
- Large colorful tiles for each genre
- Custom illustrations per category
- Grid layout, 2-3 columns

App Store shows:
- Horizontal scroll of featured
- Category pills at top
- Full category pages with curated lists

Pinterest shows:
- Interest pills as entry points
- Infinite scroll within topic
- Related topics sidebar

#### Specific Recommendations

**A. Category Quick Access (Explore Page Header)**
```
┌─────────────────────────────────────────────────────────────┐
│ [🎓 Major] [🏠 Living] [🎭 Greek] [🔬 Research] [⚽ Sports] │
└─────────────────────────────────────────────────────────────┘
```
- Horizontal scroll of category pills
- Icon + label
- Click goes to `/explore?category=major`

**B. Category Deep Pages**
New route: `/explore/[category]`
```
/explore/major → "Find Your Academic Community"
/explore/interests → "Explore Your Passions"
/explore/greek → "Greek Life at [Campus]"
/explore/living → "Your Neighbors"
```

Each page shows:
- Hero header with category illustration
- Filter chips (for sub-categories)
- Grid of matching spaces

**C. Interest Browsing**
Pull from user's profile interests to show:
- "Spaces matching AI/ML" section
- "More in Tech" section
- "Related: Robotics, Data Science"

**D. Academic School Grouping**
Major browse already groups by `AcademicSchool` (from `MAJOR_CATALOG`):
- School of Engineering
- College of Arts & Sciences
- School of Management
- etc.

Show as expandable sections or tabs.

#### Implementation Notes
- Category data: Available in `BrowseQuerySchema` (major, interests, home, greek)
- Interest matching: Use profile interests against space tags
- School grouping: Already implemented in `browse/route.ts` → `groupSpacesBySchool`

---

## Part 2: Layout Agents

### 5. Explore Page Architect

#### Current Assessment
- **Location:** `/explore/page.tsx` — Single-column feed layout
- **Sections:**
  1. Header ("Discover Your Campus")
  2. Search bar
  3. If searching: Search results (spaces, ghost spaces, people, events)
  4. If not searching: Curated feed (For You → Popular → People in Major → Events)
- **Max width:** 5xl (64rem)
- **What works:** Clean single-column focus, clear sections, search-to-feed transition
- **What doesn't:**
  - No sidebar for filters/categories
  - No "tabs" for switching between Spaces/People/Events/Tools
  - No persistent navigation within explore
  - Mobile: No bottom filter sheet

#### 2026 Design Direction
**Reference:** TikTok (full-screen feed) + Spotify (sidebar + main) + App Store (tabs + feed)

TikTok shows:
- Two-column toggle: Following / For You
- Minimal UI, content-first

Spotify shows:
- Persistent sidebar with sections
- Main area for active view
- Quick filters at top

App Store shows:
- Bottom tabs for top-level sections
- Horizontal carousels + vertical lists
- Pull-to-refresh

#### Specific Recommendations

**A. Layout Structure: Desktop**
```
┌─────────────────────────────────────────────────────────────────────┐
│ [Sidebar 240px]           │        [Main Content]                   │
│                           │                                          │
│ DISCOVER                  │  Search...                       [Cmd+K] │
│  ├─ For You              │                                          │
│  ├─ Popular              │  ┌─ Category Pills ─────────────────────┐│
│  └─ New                  │  │ [All] [Major] [Interests] [Greek]    ││
│                           │  └─────────────────────────────────────┘│
│ CATEGORIES                │                                          │
│  ├─ By Major             │  For You                           See all│
│  ├─ By Interest          │  ┌──────┐ ┌──────┐ ┌──────┐             │
│  ├─ Greek Life           │  │      │ │      │ │      │             │
│  └─ Residence            │  └──────┘ └──────┘ └──────┘             │
│                           │                                          │
│ PEOPLE                    │  Popular This Week                       │
│  └─ Find Classmates      │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐    │
│                           │  └──────┘ └──────┘ └──────┘ └──────┘    │
│ EVENTS                    │                                          │
│  └─ This Week            │  People in CS                    View all │
│                           │  ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐    │
│ TOOLS                     │  └────┘ └────┘ └────┘ └────┘ └────┘    │
│  └─ Browse Lab           │                                          │
└─────────────────────────────────────────────────────────────────────┘
```

**B. Layout Structure: Mobile**
```
┌─────────────────────────────────┐
│  🔍 Search...           [Cmd+K] │
├─────────────────────────────────┤
│  [Spaces] [People] [Events]     │ ← Sticky top tabs
├─────────────────────────────────┤
│                                 │
│  For You                        │
│  ┌─────────┐  ┌─────────┐      │
│  │ Card    │  │ Card    │      │
│  └─────────┘  └─────────┘      │
│                                 │
│  [Filter] button → Bottom Sheet │
│                                 │
└─────────────────────────────────┘
```

**C. Section "See All" Pages**
- "For You" → See all goes to infinite scroll of personalized recommendations
- "Popular" → See all shows trending spaces campus-wide
- "People in [Major]" → See all shows all students in major

**D. Tab Navigation Option**
Resurrect `TabNav.tsx` component (currently unused):
- Spaces | People | Events | Tools
- URL state: `/explore?tab=people`
- Each tab has its own curated feed structure

#### Implementation Notes
- Sidebar: Only show on desktop (≥1024px)
- Tabs: Use existing `TabNav` component
- Mobile filters: Use Radix Dialog as bottom sheet
- State: URL params for tab + category (`/explore?tab=spaces&category=major`)

---

### 6. Search Results Layout

#### Current Assessment
- **Location:** `SearchResultsSection` in `/explore/page.tsx`
- **Mixed results handling:** Separate sections for spaces, ghost spaces, people, events
- **Section titles:** "Spaces matching [query]", "People matching [query]", etc.
- **Empty state:** Glass surface with "No results" message
- **What works:** Clear grouping by type
- **What doesn't:**
  - No relevance-ranked mixed feed (all spaces before any people)
  - No result type indicator icons
  - No keyboard navigation through results
  - No "Show more" per section

#### 2026 Design Direction
**Reference:** Linear search results + Spotlight + Algolia InstantSearch

Linear shows:
- Mixed results ranked by relevance
- Type icon before each result
- Keyboard navigation with highlighting

Spotlight shows:
- Categories as collapsible sections
- Top result highlighted
- Preview on right side

Algolia shows:
- Facet counts per category
- Refinement chips
- Highlighting matched terms

#### Specific Recommendations

**A. Relevance-First Mixed Feed**
Backend already calculates `relevanceScore` per result. Use it:
```
Search: "robotics"

Top Results                                       [Spaces: 3] [People: 5] [Events: 1]
┌────────────────────────────────────────────────────────────────────────────────────┐
│ 🏠 Robotics Club                    12 members · Tech        [Join]                │ ← Space
│ 👤 Alex Kim                         Robotics Lab Lead · 2 mutual spaces             │ ← Person
│ 📅 Robotics Competition Info        Tomorrow 3pm · Robotics Club                   │ ← Event
│ 🏠 AI & Robotics Research           8 members · Research     [Request]             │ ← Space
│ 👤 Jordan Lee                       ME '25 · Robotics interest                      │ ← Person
└────────────────────────────────────────────────────────────────────────────────────┘
```

**B. Type Filters**
```
[All] [🏠 Spaces (3)] [👤 People (5)] [📅 Events (1)] [🔧 Tools (0)]
```
- Clicking filter narrows results
- Count badges show available results per type
- "All" shows mixed relevance-ranked

**C. Highlight Matched Terms**
In result title/description, highlight the query match:
- "**Robotic**s Club" — bold the matched portion
- Use `<mark>` or custom span with `bg-gold-500/20`

**D. Keyboard Navigation**
- Arrow keys move selection highlight
- Enter navigates to selected result
- Tab cycles between sections
- `j`/`k` vim-style navigation

**E. Result Actions**
- Space: "Join" / "Request" / "View"
- Person: "View Profile" / "Message"
- Event: "RSVP" / "View"

#### Implementation Notes
- Search API already returns `relevanceScore` — sort all results together
- Type icons: Map `result.type` to icon component
- Highlighting: Use regex to wrap matched substrings
- Keyboard: Use `useKeyboardNavigation` hook or similar

---

### 7. Category Deep Page

#### Current Assessment
- **No dedicated category pages exist**
- Browse API supports category filtering
- `/spaces/browse` route doesn't exist (redirects to `/home`)

#### 2026 Design Direction
**Reference:** App Store category pages + Product Hunt topics + Dribbble tags

App Store shows:
- Hero banner with category name
- "Essential" picks section
- Full grid below
- Sort/filter options

Product Hunt shows:
- Topic description
- "Popular in [topic]" section
- Related topics sidebar

#### Specific Recommendations

**A. Route Structure**
```
/explore/category/[slug]

Examples:
- /explore/category/major → Academic communities
- /explore/category/greek → Greek life
- /explore/category/sports → Athletics & recreation
- /explore/category/arts → Creative communities
```

**B. Page Layout**
```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Explore                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ 🎓                                                   │   │
│  │ Academic Communities                                 │   │
│  │ Find spaces for your major, department, or field    │   │
│  │                                                      │   │
│  │ [234 spaces]  [12.4k members]                       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Sub-categories                                             │
│  [Engineering] [Arts & Sci] [Business] [Health] [All]       │
│                                                             │
│  Sort: [Most Active ▾]                                      │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Space   │  │ Space   │  │ Space   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐                     │
│  │ Space   │  │ Space   │  │ Space   │                     │
│  └─────────┘  └─────────┘  └─────────┘                     │
│                                                             │
│  [Load More]                                                │
└─────────────────────────────────────────────────────────────┘
```

**C. Filters & Sorts**
- **Sort:** Most Active, Most Members, Newest, Alphabetical
- **Sub-filters:** Academic school (for major), Interest tags (for interests)
- **Member count range:** 1-10, 10-50, 50+

**D. Related Categories**
Sidebar or footer: "Also explore: [Related Category] [Related Category]"

#### Implementation Notes
- New page: `/app/explore/category/[slug]/page.tsx`
- Use existing `browse-v2` API with `category` param
- Sub-categories: Map from `SPACE_TYPE` constants
- Hero content: Static copy per category (similar to `CATEGORY_COPY` in browse API)

---

### 8. Onboarding Discovery

#### Current Assessment
- **New user flow:** `/home` shows `NewUserState` component
- **Recommendations:** Fetched from `/api/profile/dashboard?includeRecommendations=true`
- **UI:** List of 5 recommended spaces with "Join" buttons
- **CTA:** "Explore All Spaces" button
- **What works:** Simple, clear call to action
- **What doesn't:**
  - No explanation of why spaces are recommended
  - No interest-based filtering
  - No "skip" or "do this later" option
  - No progress indicator

#### 2026 Design Direction
**Reference:** Spotify onboarding (choose artists) + Netflix profiles + TikTok interests

Spotify shows:
- "Choose 3 artists you like"
- Grid of options with checkboxes
- Progress: "2 of 3 selected"

Netflix shows:
- Profile customization
- Genre preferences
- "Tell us what you like"

TikTok shows:
- Interest selection bubbles
- Skip option available
- Algorithm starts immediately

#### Specific Recommendations

**A. Two-Path Onboarding Discovery**

**Path 1: Interest-First** (Recommended)
```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  What are you into?                                         │
│  (Select at least 3 to personalize your experience)        │
│                                                             │
│  ┌──────┐  ┌──────────┐  ┌────────┐  ┌──────┐             │
│  │ Tech │  │ Research │  │ Sports │  │ Arts │             │
│  └──────┘  └──────────┘  └────────┘  └──────┘             │
│                                                             │
│  ┌────────┐  ┌────────┐  ┌──────────┐  ┌────────┐         │
│  │ Gaming │  │ Music  │  │ Business │  │ Health │         │
│  └────────┘  └────────┘  └──────────┘  └────────┘         │
│                                                             │
│  [Continue with 4 interests]              [Skip for now →] │
│                                                             │
└─────────────────────────────────────────────────────────────┘

↓

Spaces for you based on Tech, Research, Gaming, Music
┌─────────┐  ┌─────────┐  ┌─────────┐
│ Robotics│  │ AI Club │  │ E-Sports│
│ [Join]  │  │ [Join]  │  │ [Join]  │
└─────────┘  └─────────┘  └─────────┘

[Join 2 more to continue →]
```

**Path 2: Auto-Join Recommendations**
If user skips interest selection:
- Show top 5 spaces by popularity
- "We'll personalize as you explore"

**B. Progress Indicator**
```
Step 1: Interests (optional) → Step 2: Join 3+ spaces → Done!
[●●○]
```

**C. Identity Spaces Prompt**
After general onboarding, prompt for identity spaces:
```
Claim your spots

Your Major                     Your Residence
┌─────────────────┐           ┌─────────────────┐
│ Computer Science │           │ Find your dorm  │
│ 234 students     │           │ →               │
│ [Claim]          │           │                 │
└─────────────────┘           └─────────────────┘
```

**D. "Do This Later" Escape Hatch**
- Skip button on every step
- "Explore on your own" option
- Persist partially completed state

#### Implementation Notes
- New component: `OnboardingDiscovery.tsx`
- Interest selection: Update profile interests via `/api/profile`
- Minimum spaces: Track in localStorage, show nudge if < 3 after 24h
- Identity prompt: Reuse `IdentityConstellation` component from SpacesHQ

---

## Part 3: Interaction Agents

### 9. Search Behavior Designer

#### Current Assessment
- **Input:** Standard text input with debounce (300ms)
- **Autocomplete:** None
- **Recent searches:** Not saved
- **Keyboard shortcuts:** None
- **Search scope:** Global across all types

#### 2026 Design Direction
**Reference:** Algolia DocSearch + GitHub search + VS Code command palette

Algolia shows:
- Instant results while typing
- Category navigation
- Keyboard-first interaction

GitHub shows:
- Slash command to activate
- Scoped search (in:title, org:x)
- Recent and suggested queries

VS Code shows:
- `>` prefix for commands
- `@` prefix for symbols
- `#` prefix for files

#### Specific Recommendations

**A. Search Activation**
- `Cmd+K` / `Ctrl+K` — Opens search modal (not inline)
- `/` key — Focus search when not in input (like GitHub)
- Click search bar — Show suggestions panel immediately

**B. Search Modal Experience**
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search HIVE...                                     [Esc] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ Recent                                                      │
│  └─ robotics club                                  [×]     │
│  └─ sarah chen                                     [×]     │
│                                                             │
│ Jump to                                                     │
│  └─ → Your Spaces                              [Enter]     │
│  └─ → Browse All                               [Enter]     │
│  └─ → Settings                                 [Enter]     │
│                                                             │
│ [↑↓ to navigate] [Enter to select] [Esc to close]          │
└─────────────────────────────────────────────────────────────┘
```

**C. As-You-Type Behavior**
1. **0 chars:** Show recents + quick jumps
2. **1 char:** Start showing autocomplete (space/person names starting with char)
3. **2+ chars:** Full search results with categories

**D. Scoped Search Syntax** (Advanced)
- `in:spaces robotics` — Only search spaces
- `in:people sarah` — Only search people
- `major:cs` — Filter people by major
- Show syntax hint on focus

**E. Voice Search** (Stretch)
- Microphone icon in search bar
- Web Speech API transcription
- Auto-submit after speech ends

#### Implementation Notes
- Modal: Use Radix Dialog with keyboard handling
- Recent: `localStorage.getItem('hive:searches')` array, max 10
- Quick jumps: Static list of common actions
- Scoped syntax: Parse query prefix before API call

---

### 10. Filter & Sort Designer

#### Current Assessment
- **Filters:** Implicit category filters only (via URL params)
- **Sorts:** `sort` param in browse API (trending, recommended, newest, popular)
- **UI:** No visible filter/sort controls on explore page
- **What's missing:** Interactive filter UI, sort dropdown, active filter badges

#### 2026 Design Direction
**Reference:** Airbnb filters + Notion database filters + Amazon sort/filter bar

Airbnb shows:
- Filter chips at top
- "More filters" modal
- Active filter count badge

Notion shows:
- Filter builder UI
- Multiple conditions
- Save as view

Amazon shows:
- Sort dropdown
- Faceted filters sidebar
- Applied filter breadcrumbs

#### Specific Recommendations

**A. Top Filter Bar**
```
┌─────────────────────────────────────────────────────────────────────┐
│ Sort: [Most Active ▾]    [All Types ▾]    [Any Size ▾]    [⚙ More] │
│                                                                     │
│ Applied: [Tech ×] [10+ members ×]                      [Clear all] │
└─────────────────────────────────────────────────────────────────────┘
```

**B. Filter Options**

**Type Filter:**
- All Types
- Major/Academic
- Clubs & Organizations
- Greek Life
- Residence
- Research Groups

**Size Filter:**
- Any Size
- Small (1-10 members)
- Medium (11-50 members)
- Large (50+ members)

**Activity Filter:**
- Any Activity
- Active today
- Active this week
- Newly created

**Interest Filter:**
- Multi-select from profile interests
- Shows "Tech (3)", "Sports (7)" with counts

**C. Sort Options**
- Most Active (default)
- Most Members
- Newest
- Recommended for You

**D. Mobile: Bottom Sheet Filters**
```
[Filter & Sort]  ← Sticky button at bottom

Opens bottom sheet:
┌─────────────────────────────────────┐
│ Filter & Sort                   [×] │
├─────────────────────────────────────┤
│ Sort by                             │
│ ◉ Most Active  ○ Most Members       │
│ ○ Newest       ○ Recommended        │
├─────────────────────────────────────┤
│ Type                                │
│ [All] [Academic] [Clubs] [Greek]... │
├─────────────────────────────────────┤
│ Size                                │
│ [Any] [Small] [Medium] [Large]      │
├─────────────────────────────────────┤
│ [Apply Filters (24 results)]        │
└─────────────────────────────────────┘
```

**E. URL State Persistence**
Filters sync to URL: `/explore?sort=newest&type=academic&size=large`
- Shareable links
- Browser back/forward works
- Bookmarkable views

#### Implementation Notes
- Filter component: New `ExploreFilters.tsx`
- URL state: Use `useSearchParams` + `router.replace`
- Result counts: Add endpoint `/api/spaces/browse-v2/counts` for facet counts
- Mobile sheet: Radix Dialog or custom bottom sheet component

---

### 11. Preview & Join Flow

#### Current Assessment
- **Preview:** Click card → Navigate to `/s/[handle]` (full page)
- **Join:** On space page, "Join" button → POST `/api/spaces/join-v2`
- **Join types:** Direct join (open), Request (closed), Waitlist (ghost)
- **What's missing:**
  - No hover preview
  - No modal preview
  - No inline join on card
  - No join confirmation

#### 2026 Design Direction
**Reference:** Slack workspace preview + Discord server preview + Product Hunt product modal

Slack shows:
- Inline workspace preview
- "Join" button prominent
- Member preview

Discord shows:
- Server preview modal
- Channel list preview
- "Accept Invite" CTA

Product Hunt shows:
- Modal overlay
- Full product info
- Upvote without navigating

#### Specific Recommendations

**A. Hover Preview (Desktop)**
After 300ms hover on space card:
```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────┐                                 │
│  │    Card content         │  Preview Panel                  │
│  │    (unchanged)          │  ──────────────────────────     │
│  │                         │  AI/ML Club                     │
│  │                         │  @aiml · 234 members            │
│  │                         │                                 │
│  └─────────────────────────┘  Full description that wasn't   │
│                               truncated on the card. This    │
│                               can be several lines long.     │
│                                                              │
│                               Recent Activity                │
│                               • New member: Sarah C.         │
│                               • Event: Demo Day Friday       │
│                                                              │
│                               [Join Space]  [View Full →]    │
└──────────────────────────────────────────────────────────────┘
```

**B. Quick Join on Card**
Add "Join" button directly on SpaceCard:
- Open spaces: Shows "Join" → Instant join, toast confirmation
- Closed spaces: Shows "Request" → Request sent toast
- Ghost spaces: Shows "Notify Me" → Waitlist join

**C. Join Confirmation Modal**
For spaces with specific requirements:
```
┌─────────────────────────────────────────────┐
│  Join AI/ML Club?                           │
│                                             │
│  This space is open to all students.        │
│                                             │
│  ☑ Add to home screen                       │
│  ☑ Enable notifications                     │
│                                             │
│  [Cancel]                     [Join Space]  │
└─────────────────────────────────────────────┘
```

**D. Request Flow** (Closed Spaces)
```
┌─────────────────────────────────────────────┐
│  Request to join Research Lab?              │
│                                             │
│  This space requires approval.              │
│                                             │
│  Add a note (optional):                     │
│  ┌─────────────────────────────────────┐   │
│  │ I'm interested in the robotics      │   │
│  │ project and have experience with... │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [Cancel]                [Send Request]     │
└─────────────────────────────────────────────┘
```

**E. Post-Join Celebration**
After successful join:
```
┌─────────────────────────────────────────────┐
│                                             │
│              🎉                             │
│                                             │
│  You're in!                                 │
│  Welcome to AI/ML Club                      │
│                                             │
│  234 members · 12 events this semester      │
│                                             │
│  [Explore Space]        [Continue Browsing] │
└─────────────────────────────────────────────┘
```

#### Implementation Notes
- Hover preview: Use Radix HoverCard or custom with delay
- Quick join: New `joinSpace` function with optimistic UI
- Request modal: Radix AlertDialog
- Post-join: Toast with action button or modal

---

### 12. Serendipity Mechanic

#### Current Assessment
- **No serendipity features exist**
- "For You" is interest-based, not truly random
- No "surprise me" or "random space" feature
- No cross-interest discovery

#### 2026 Design Direction
**Reference:** Spotify "Discover Weekly" + StumbleUpon + Twitter "Topics for you"

Spotify shows:
- Weekly algorithmic playlist
- "Fans also like" for cross-artist discovery
- Radio feature for endless discovery

StumbleUpon showed:
- "Stumble!" button for random content
- Interest-based randomization
- "Like" to train algorithm

Twitter shows:
- "Topics for you" suggestions
- "Because you follow @x" context

#### Specific Recommendations

**A. "Surprise Me" Feature**
Button on explore page: [🎲 Surprise Me]

Click → Modal or full-page reveal:
```
┌─────────────────────────────────────────────┐
│                                             │
│  We found something for you...              │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │                                     │   │
│  │        [Large Space Card]           │   │
│  │                                     │   │
│  │        Philosophy Club              │   │
│  │        "Where big questions meet"   │   │
│  │        42 members · Active today    │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  Why this? Students with your interests     │
│  often join unexpected communities.         │
│                                             │
│  [Not for me]  [Join!]  [Show Another 🎲]   │
└─────────────────────────────────────────────┘
```

**B. "Discovery Roulette"** (Gamified)
Weekly challenge: "Join 3 spaces outside your comfort zone"
- Track in profile
- Badge: "Explorer" for completing
- Shows unexpected matches

**C. "Fans Also Join"**
On space page sidebar:
```
Students in AI/ML Club also join:
├─ Philosophy of Mind (32% overlap)
├─ Entrepreneurship (28% overlap)
└─ Chess Club (24% overlap)
```

**D. "Random Space" API**
New endpoint: `GET /api/spaces/random`
- Returns 1-3 random spaces
- Weighted by: Activity level, user's unexplored interests
- Excludes: Already joined, already dismissed

**E. "Discover Tab"** (Alternative to For You)
Instead of algorithmic "For You", offer:
- **For You** — Interest-matched
- **Discover** — Serendipitous, cross-interest
- **Rising** — New spaces gaining traction

#### Implementation Notes
- Random API: Firestore doesn't support random, use client-side random from cached list
- "Not for me": Track dismissed spaces, weight down similar
- Overlap calculation: Compare member sets across spaces (expensive, cache daily)
- Weekly challenge: Store in profile, reset every Monday

---

## Part 4: Experience Agents

### 13. New Student Discovery

#### Current Assessment
- **Entry point:** `/home` after entry completion
- **What shows:** `NewUserState` with recommendations
- **Recommendations source:** `/api/profile/dashboard`
- **Minimum friction:** Can join spaces with 1 click
- **What's missing:**
  - No guided tour
  - No "first 5 spaces" goal
  - No progress celebration
  - No personalization based on entry data (major, year, interests)

#### 2026 Design Direction
**Reference:** Duolingo onboarding + Headspace journey + LinkedIn "Complete your profile"

Duolingo shows:
- Clear goal: "5 minutes a day"
- Progress celebration
- Streak mechanics

Headspace shows:
- Guided first experience
- "Day 1 of your journey"
- Celebration animations

LinkedIn shows:
- Profile strength meter
- "Add 5 skills" nudges
- Connection suggestions

#### Specific Recommendations

**A. First-Time Experience Flow**

**Step 1: Welcome (After Entry)**
```
Welcome to HIVE, Sarah! 🐝

You're one of 1,234 students at UB building their campus network.

Here's how students use HIVE:
• Join spaces to find your people
• Chat and plan with communities
• Never miss campus events

[Let's find your first space →]
```

**Step 2: Interest Confirmation**
```
Let's make this personal

You mentioned these interests:
[AI/ML ✓] [Robotics ✓] [Gaming ✓]

Anything else?
[Research] [Music] [Fitness] [Art] [+Add]

[Continue →]
```

**Step 3: Recommended Spaces**
```
Spaces that match your vibe

Based on your interests, major, and what students like you join:

┌─────────┐  ┌─────────┐  ┌─────────┐
│ AI Club │  │ CS '26  │  │ E-Sports│
│  [Join] │  │  [Join] │  │  [Join] │
└─────────┘  └─────────┘  └─────────┘

┌─────────┐  ┌─────────┐  ┌─────────┐
│ Robotics│  │ Hackers │  │ Tech    │
│  [Join] │  │  [Join] │  │  [Join] │
└─────────┘  └─────────┘  └─────────┘

[Skip for now]                        [2/5 joined, keep going!]
```

**Step 4: Celebration**
```
🎉 You're all set!

You joined 5 spaces. Here's what's next:
• Say hi in AI Club (3 online now)
• Check out the Demo Day event Friday
• Explore more spaces anytime

[Go to AI Club]        [Browse more]
```

**B. Progress Persistence**
- Store onboarding progress in profile
- Resume if user drops off
- "Continue setting up" banner on home

**C. Identity Space Prompts**
After general onboarding, nudge for identity spaces:
- "Claim your major space" (if major set)
- "Find your dorm" (if residence known)
- Dismissable, shows again after 48h

**D. Early Activity Prompts**
After joining spaces, prompt engagement:
- "Sarah joined AI Club — say hi!"
- "Event happening tomorrow in Robotics"

#### Implementation Notes
- New component: `OnboardingFlow.tsx` (multi-step)
- Entry data: Pull from profile (major, year, interests)
- Progress: Store `onboardingStep` in profile or localStorage
- Celebrations: Use confetti library (already likely in stack)

---

### 14. Returning User Discovery

#### Current Assessment
- **Entry point:** `/home` with existing spaces
- **Discovery surface:** "Suggested for You" section (1 recommendation)
- **Explore access:** "Browse all" link to `/explore`
- **What's missing:**
  - No "New since you left" section
  - No friend activity feed
  - No trending/viral content
  - No "spaces your friends joined" notifications

#### 2026 Design Direction
**Reference:** Instagram Explore + LinkedIn "Connections activity" + Twitter Trending

Instagram shows:
- Explore tab with algorithmic content
- "Suggested for you" in feed
- Activity from friends

LinkedIn shows:
- "John Smith joined a new company"
- "12 connections posted today"

Twitter shows:
- "What's happening" trending topics
- "Because you follow @x" context

#### Specific Recommendations

**A. "What's New" Section on Home**
```
What's New

┌─ New Spaces ──────────────────────────────────────────┐
│ 🆕 UB Startups (created 2 days ago)    [View]        │
│    For student founders. 12 joined already.          │
└───────────────────────────────────────────────────────┘

┌─ Friends Activity ────────────────────────────────────┐
│ 👤 Alex Kim joined Chess Club                        │
│ 👤 Jordan Lee joined Philosophy                      │
│ [See all friend activity]                            │
└───────────────────────────────────────────────────────┘
```

**B. "Trending on Campus" Section**
```
Trending on Campus

🔥 Housing Lottery space is blowing up (142 new members this week)
🔥 Career Fair space has 3 new events
🔥 "Best study spots" post got 89 reactions

[Explore trending →]
```

**C. "You Might Like" Weekly Digest**
Push notification or email:
```
Weekly Discover

Based on your activity, here are spaces growing that match your interests:

1. Quantum Computing Club — Tech interest, 40% of AI Club members joined
2. Debate Society — Research interest, active discussions
3. Hiking Club — Trending this week, outdoor activities

[Open in HIVE]
```

**D. "Because You Joined X" Context**
On explore page, show context for recommendations:
```
Because you're in AI Club

┌─────────┐  ┌─────────┐  ┌─────────┐
│ ML Lab  │  │ PyTorch │  │ Kaggle  │
│         │  │ Study   │  │ Group   │
└─────────┘  └─────────┘  └─────────┘
```

**E. "Revisit" Nudges**
For spaces user hasn't visited in 2+ weeks:
```
┌────────────────────────────────────────────────────┐
│ 👋 It's been a while in Robotics Club              │
│    12 new messages · Event tomorrow                │
│                                                    │
│    [Catch up]                        [Mute space]  │
└────────────────────────────────────────────────────┘
```

#### Implementation Notes
- New spaces: Query `createdAt > 7 days ago` + `memberCount > 5`
- Friend activity: SSE or polling from activity feed
- Trending: Track weekly member growth, calculate % increase
- Weekly digest: Cloud Function scheduled email

---

### 15. Empty Results Handler

#### Current Assessment
- **Current UI:** Glass surface with "No results for [query]" + "Try a different search term or browse the feed below"
- **Location:** `SearchResultsSection` in explore page
- **What works:** Clear message, doesn't feel broken
- **What doesn't:**
  - No suggestions for similar queries
  - No "did you mean" corrections
  - No prompt to create what's missing
  - No fallback content

#### 2026 Design Direction
**Reference:** Google "No results" + Dribbble empty states + Airbnb "Explore nearby"

Google shows:
- "Did you mean: [corrected query]"
- Suggestions based on partial match
- Related searches

Dribbble shows:
- Encouraging empty state
- Related content
- "Be the first to..." prompt

Airbnb shows:
- "Expand your search"
- "Explore flexible dates"
- Alternative suggestions

#### Specific Recommendations

**A. Tiered Empty State**

**Tier 1: Spelling Correction**
If query has typo potential:
```
No results for "robtoics"

Did you mean "robotics"? [Search robotics]
```

**Tier 2: Partial Matches**
If some results exist in other categories:
```
No spaces match "philosophy"

But we found:
• 3 people interested in Philosophy [View]
• 1 event: "Philosophy Meetup" [View]

[Search again] [Browse all spaces]
```

**Tier 3: Related Suggestions**
```
No results for "underwater basket weaving"

Try searching for:
• "Crafts" (12 spaces)
• "Art clubs" (8 spaces)
• "Hobby groups" (15 spaces)

[Browse all spaces]
```

**Tier 4: Create Prompt**
```
No spaces match "quantum computing"

Be the first!
Start a space for quantum computing and
get notified when others join.

[Create "Quantum Computing" Space]

Or browse related:
• AI/ML Club (156 members)
• Physics Club (42 members)
```

**B. Visual Empty State**
Instead of plain text:
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                 🔍                                  │
│                                                     │
│   No matches for "quantum computing"                │
│                                                     │
│   ┌───────────────────────────────────────────┐    │
│   │ 💡 Be the first to create this space      │    │
│   │                                           │    │
│   │    [Create Space]                         │    │
│   └───────────────────────────────────────────┘    │
│                                                     │
│   Related searches: [Physics] [Math] [Research]     │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**C. Smart Fallbacks**
- Show trending spaces as fallback
- Show friend activity as fallback
- Never leave user at dead end

**D. Zero-Result Analytics**
Track queries that return 0 results → inform content gaps
- Dashboard for admins: "Top searches with no results"
- Use to seed ghost spaces

#### Implementation Notes
- Spelling: Use simple Levenshtein distance for suggestions
- Partial matches: Return counts per category even when some are 0
- Create prompt: Pre-fill space name from query
- Analytics: Log to `/api/analytics/search-miss`

---

## Implementation Priority Matrix

### P0: Ship This Week
1. **Quick Join on Cards** — Highest friction reduction
2. **Recent Searches** — Low effort, high usability
3. **Cmd+K Keyboard Shortcut** — Power user retention
4. **Fix Profile Link** — `/profile/id` → `/u/handle`

### P1: Ship This Sprint
5. **Search Modal with Recents** — Better search experience
6. **Mutual Friends on Cards** — Data exists, just surface it
7. **Event Teaser on Cards** — Data exists, just surface it
8. **Category Pills on Explore** — Navigation improvement
9. **Filter/Sort Bar** — Basic discovery controls

### P2: Ship This Month
10. **Hover Preview** — Desktop enhancement
11. **Category Deep Pages** — `/explore/category/[slug]`
12. **Improved Empty States** — Better dead-end handling
13. **New User Onboarding Flow** — First-time experience
14. **"Surprise Me" Feature** — Serendipity

### P3: Future Consideration
15. **Voice Search** — Accessibility & modern UX
16. **Weekly Discovery Digest** — Engagement emails
17. **Friend Activity Feed** — Social discovery
18. **Spelling Correction** — Search quality
19. **Desktop Sidebar** — Layout restructure

---

## Design Tokens Reference

All visual implementations should use existing tokens from `@hive/tokens`:

```typescript
// Motion
MOTION.duration.base     // 200ms
MOTION.duration.standard // 300ms
MOTION.ease.premium      // Custom easing

// Colors
var(--life-gold)         // Primary accent
var(--bg-ground)         // Background
white/[0.06]             // Borders
white/[0.04]             // Subtle fills

// Typography
text-body                // 14px
text-body-sm             // 13px
text-label               // 12px
text-heading-sm          // 20px

// Spacing
gap-3                    // 12px
gap-4                    // 16px
p-4, p-5                 // 16px, 20px
```

---

## Appendix: File Reference

| Component | Path |
|-----------|------|
| Explore Page | `/apps/web/src/app/explore/page.tsx` |
| Search Component | `/apps/web/src/components/explore/ExploreSearch.tsx` |
| Space Card | `/apps/web/src/components/explore/SpaceCard.tsx` |
| Ghost Space Card | `/apps/web/src/components/explore/GhostSpaceCard.tsx` |
| People Grid | `/apps/web/src/components/explore/PeopleGrid.tsx` |
| Event List | `/apps/web/src/components/explore/EventList.tsx` |
| Tool Gallery | `/apps/web/src/components/explore/ToolGallery.tsx` |
| Tab Nav | `/apps/web/src/components/explore/TabNav.tsx` |
| Search API | `/apps/web/src/app/api/search/route.ts` |
| Browse API v2 | `/apps/web/src/app/api/spaces/browse-v2/route.ts` |
| Home Page | `/apps/web/src/app/home/page.tsx` |
| Spaces HQ | `/apps/web/src/app/spaces/components/SpacesHQ.tsx` |
| Hub Onboarding | `/apps/web/src/app/spaces/components/hub-onboarding.tsx` |

---

**Next Steps:**
1. Review with product team
2. Prioritize based on user research data
3. Create Figma mockups for P0/P1 items
4. Implement incrementally with A/B testing
