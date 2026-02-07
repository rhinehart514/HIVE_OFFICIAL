# Pages & Routes

Complete reference for every route in the HIVE web app.

**Stack:** Next.js 15 App Router, file-based routing at `apps/web/src/app/`

---

## Route Protection

### Middleware (`apps/web/src/middleware.ts`)

All routes pass through edge middleware. Behavior:

| Category | Routes | Behavior |
|----------|--------|----------|
| Public | `/`, `/enter`, `/about`, `/legal`, `/login`, `/schools` | No auth required |
| Admin | `/admin` | Requires admin role |
| API | `/api/*` | Rate limited (300 req/min global, 30 req/min sensitive) |
| Everything else | All other routes | Requires valid JWT session |

**Auth flow:**
- Unauthenticated users on protected routes redirect to `/?redirect={pathname}`
- Users with incomplete onboarding redirect to `/enter?state=identity`
- Session verified via JWT (`jose`) at edge from `__session` cookie

**Middleware redirects** (17 static + 2 dynamic):

| From | To |
|------|----|
| `/browse` | `/spaces` |
| `/discover` | `/explore` |
| `/search` | `/explore` |
| `/you` | `/me` |
| `/you/*` | `/me/*` |
| `/account` | `/me/settings` |
| `/account/*` | `/me/settings/*` |
| `/dashboard` | `/home` |
| `/activity` | `/home` |
| `/my-spaces` | `/home` |
| `/privacy` | `/legal/privacy` |
| `/terms` | `/legal/terms` |
| `/community-guidelines` | `/legal/community-guidelines` |
| `/orgs` | `/spaces` |
| `/organizations` | `/spaces` |
| `/clubs` | `/spaces` |
| `/groups` | `/spaces` |
| `/spaces/join/:code` | `/spaces?join=:code` (dynamic) |
| `/spaces/new/*` | `/spaces?create=true` (dynamic) |

### next.config.mjs Redirects (Permanent 301)

| From | To |
|------|----|
| `/auth/login` | `/enter` |
| `/auth/verify` | `/enter` |
| `/auth/expired` | `/enter?expired=true` |
| `/onboarding` | `/enter?state=identity` |
| `/tools` | `/lab` |
| `/tools/:path*` | `/lab/:path*` |
| `/hivelab` | `/lab` |
| `/hivelab/:path*` | `/lab/:path*` |
| `/calendar` | `/me/calendar` |
| `/notifications` | `/me/notifications` |
| `/settings` | `/me/settings` |
| `/settings/:path*` | `/me/settings/:path*` |

---

## Layouts

| Path | Type | Purpose |
|------|------|---------|
| `/layout.tsx` | Server | Root. Fonts (GeistSans, GeistMono, Space Grotesk, JetBrains Mono). Wraps in `<Providers>` + `<AppShell>` |
| `/s/[handle]/layout.tsx` | Server | Space layout. Dynamic metadata from space handle |
| `/lab/[toolId]/layout.tsx` | Server | Tool layout. Metadata from tool data via Firebase |
| `/legal/layout.tsx` | Server | Legal pages layout |
| `/rituals/layout.tsx` | Server | Rituals section layout |
| `/feed/layout.tsx` | Server | Feed section layout (deprecated area) |
| `/settings/layout.tsx` | Server | Settings section layout |
| `/spaces/layout.tsx` | Server | Legacy spaces section layout |

---

## Public Pages

### `/` Landing Page
- **Component:** Server
- **Auth:** None
- **Renders:** Marketing landing page
- **Key components:** `LandingHeader`, `HeroSection`, `ProblemSection`, `ProductSection`, `ComparisonSection`, `SocialProofSection`, `CTASection`, `LandingFooter`
- **Data:** Static

### `/enter` Entry Flow
- **Component:** Client (`'use client'`)
- **Auth:** None (public route)
- **Renders:** 4-phase onboarding: Gate (email) -> Naming (display name) -> Field (interests/major) -> Crossing (completion)
- **Key components:** `Entry`
- **Data:** `force-dynamic`. Reads `?expired`, `?state`, `?redirect` query params
- **Metadata:** "enter HIVE"

### `/login` Returning User Login
- **Component:** Client
- **Auth:** None (public route)
- **Renders:** Email -> verification code -> welcome back flow
- **Key components:** `EntryShell`, `EmailState`, `CodeState`, `useLoginMachine`
- **Data:** State machine drives transitions

### `/about` About Page
- **Component:** Client
- **Auth:** None (public route)
- **Renders:** Two tabs: "Our Story" (narrative with scroll animations, parallax) and "What's in the App" (feature showcase)
- **Key components:** `framer-motion` animations, `useInView`, scroll-triggered reveals
- **Data:** Static content with hardcoded team/feature data

### `/schools` Schools
- **Component:** Server
- **Auth:** None
- **Renders:** Nothing - immediate `redirect('/')`

### `/offline` Offline Fallback
- **Component:** Client
- **Auth:** None
- **Renders:** Offline state with retry button
- **Key components:** `WifiOff` icon, online detection via `navigator.onLine`

---

## Home & Discovery

### `/home` Activity Stream
- **Component:** Client
- **Auth:** Required
- **Renders:** Dashboard with greeting, happening now, up next events, your spaces grid, recent activity feed, suggested spaces
- **Key components:** `HomeGreeting`, `HappeningNow`, `UpNextEvents`, `YourSpaces`, `RecentActivity`, `SuggestedSpaces`, `NewUserEmptyState`
- **Data:** Fetches `/api/profile/my-spaces`, `/api/profile/dashboard`, `/api/activity-feed` via React Query

### `/explore` Discovery Feed
- **Component:** Client
- **Auth:** Required
- **Renders:** Curated discovery: For You recommendations, Popular This Week, People in Your Major, Upcoming Events. Search bar with debounce
- **Key components:** `ExploreSearch`, `ForYouSection`, `PopularSection`, `PeopleSection`, `EventsSection`
- **Data:** Fetches `/api/spaces/browse-v2`, `/api/users/search`, `/api/events`, `/api/profile`. URL query param sync for search

---

## Space Pages

### `/s/[handle]` Space Residence
- **Component:** Client
- **Auth:** Required
- **Renders:** Full space experience. Non-members see `SpaceThreshold` (join gate) or `GatheringThreshold` (quorum phase). Members see split-panel layout: sidebar (boards, tools, members) + chat feed + message input
- **Key components:** `SpaceThreshold`, `GatheringThreshold`, `SplitPanelLayout`, `SpaceSidebar`, `BoardsPanel`, `ChatMessage`, `MessageInput`, `TypingIndicator`, `ThreadPanel`
- **Dynamic imports:** `BoardCreationModal`, `MembersList`, `SpaceSettings`, `ToolDeployModal`
- **Data:** Fetches space by handle, members, messages, boards. Real-time Firestore listeners for chat

### `/s/[handle]/analytics` Space Analytics
- **Component:** Client
- **Auth:** Required + space leader role
- **Renders:** Analytics dashboard for space leaders: member growth, engagement metrics, activity charts
- **Key components:** `SpaceAnalytics`
- **Data:** Fetches space analytics data

### `/s/[handle]/tools/[toolId]` Space Tool Runtime
- **Component:** Client
- **Auth:** Required + space member
- **Renders:** Deployed HiveLab tool running within a space context
- **Key components:** `SpaceToolRuntime`
- **Data:** Loads tool deployment and renders in space context

---

## User / Me Pages

### `/me` Self Profile
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/u/{handle}` using current user's handle

### `/me/edit` Edit Profile (redirect)
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/profile/edit`

### `/me/notifications` Notifications Hub
- **Component:** Client
- **Auth:** Required
- **Renders:** Notification list with read/unread states, mark-all-read, notification categories
- **Key components:** `NotificationItem`, `NotificationFilters`
- **Data:** Fetches `/api/notifications` via React Query

### `/me/connections` Connections
- **Component:** Client
- **Auth:** Required
- **Renders:** Connections list (friends/peers). Feature-flagged via `useFeatureFlags().connectionsEnabled`
- **Key components:** `ConnectionsList`, `ConnectionCard`
- **Data:** Fetches user connections

### `/me/calendar` Calendar
- **Component:** Client
- **Auth:** Required
- **Renders:** Calendar view of user's events and space activities
- **Key components:** `CalendarView`, `useCalendar` hook
- **Data:** Fetches user's events

### `/me/reports` My Reports
- **Component:** Client
- **Auth:** Required
- **Renders:** List of content reports submitted by the user
- **Key components:** `ReportsList`
- **Data:** Fetches user's submitted reports

### `/me/settings` Settings
- **Component:** Client
- **Auth:** Required
- **Renders:** Settings hub with sections: profile, notifications, privacy, account. Reads `?section` query param for initial tab
- **Key components:** `SettingsNav`, `ProfileSettings`, `NotificationSettings`, `PrivacySettings`, `AccountSettings`
- **Data:** Fetches user profile, preferences

---

## Profile Pages

### `/u/[handle]` Canonical Profile
- **Component:** Server (metadata) + Client (content)
- **Auth:** Required
- **Renders:** Public profile page. Server component generates dynamic metadata (title, description, OG image). Client renders profile content
- **Key components:** `ProfileView`, `ProfileHeader`, `SpacesList`, `ActivityFeed`
- **Data:** Server fetches user by handle for metadata. Client fetches full profile data

### `/profile` Profile Index
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/profile/{userId}` for current user

### `/profile/[id]` Legacy Profile
- **Component:** Server
- **Auth:** Required
- **Renders:** Nothing - looks up user by ID, redirects to `/u/{handle}`. Falls back to `/home` if user not found

### `/profile/edit` Profile Editor
- **Component:** Client
- **Auth:** Required
- **Renders:** Full profile editor: avatar upload, display name, bio, major, interests, social links
- **Key components:** `ProfileEditor`, `AvatarUpload`, `InterestPicker`
- **Data:** Fetches current profile, submits updates

### `/profile/settings` (redirect)
- **Component:** Server
- **Auth:** Required
- **Renders:** Nothing - `redirect('/settings')`

### `/profile/calendar` Profile Calendar
- **Component:** Client
- **Auth:** Required
- **Renders:** Calendar view (same as `/me/calendar`)

### `/profile/connections` (redirect)
- **Component:** Server
- **Auth:** Required
- **Renders:** Nothing - `redirect('/me/connections')`

---

## Lab Pages

### `/lab` Builder Dashboard
- **Component:** Client
- **Auth:** Required
- **Renders:** Tool grid for user's created tools, or new-user welcome state. Filter/sort controls
- **Key components:** `ToolGrid`, `ToolCard`, `LabWelcome`
- **Data:** Fetches user's tools from `/api/lab/tools`

### `/lab/new` Create Tool
- **Component:** Client
- **Auth:** Required
- **Renders:** New tool creation wizard: name, description, template selection
- **Key components:** `CreateToolWizard`, `TemplateSelector`
- **Data:** Fetches available templates

### `/lab/create` (deprecated redirect)
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/lab/new`

### `/lab/[toolId]` Tool Studio
- **Component:** Client
- **Auth:** Required (tool owner)
- **Renders:** Full IDE experience: code editor, preview pane, settings panel, deploy controls. Reads `?mode` and `?settings` query params
- **Key components:** `HiveLabIDE`, `CodeEditor`, `PreviewPane`, `ToolSettings`
- **Data:** Fetches tool by ID, auto-saves changes

### `/lab/[toolId]/edit` (redirect)
- **Component:** Server
- **Auth:** Required
- **Renders:** Nothing - `redirect('/lab/{toolId}')`

### `/lab/[toolId]/run` (redirect)
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/lab/{toolId}?mode=use`

### `/lab/[toolId]/preview` Tool Preview
- **Component:** Client
- **Auth:** Required
- **Renders:** Standalone tool preview in isolation
- **Key components:** `ToolPreview`, `PreviewFrame`
- **Data:** Fetches tool data

### `/lab/[toolId]/deploy` Tool Deploy
- **Component:** Client
- **Auth:** Required (tool owner)
- **Renders:** Deploy configuration: target spaces, visibility, permissions
- **Key components:** `DeployConfig`, `SpaceSelector`
- **Data:** Fetches tool and available spaces

### `/lab/[toolId]/runs` Run History
- **Component:** Client
- **Auth:** Required (tool owner)
- **Renders:** History of tool executions with timestamps, inputs, outputs
- **Key components:** `RunsList`, `RunDetail`
- **Data:** Fetches tool run history

### `/lab/[toolId]/analytics` Tool Analytics
- **Component:** Client
- **Auth:** Required (tool owner)
- **Renders:** Tool usage analytics: runs, unique users, performance metrics
- **Key components:** `ToolAnalytics`, `UsageChart`
- **Data:** Fetches tool analytics data

### `/lab/[toolId]/settings` (redirect)
- **Component:** Server
- **Auth:** Required
- **Renders:** Nothing - `redirect('/lab/{toolId}?settings=true')`

### `/lab/templates` Template Gallery
- **Component:** Client
- **Auth:** Required
- **Renders:** Browse and search HiveLab tool templates
- **Key components:** `TemplateGallery`, `TemplateCard`
- **Data:** Fetches available templates

### `/lab/setups` Setup Gallery
- **Component:** Client
- **Auth:** Required
- **Renders:** Browse space setups (pre-configured tool bundles)
- **Key components:** `SetupGallery`, `SetupCard`
- **Data:** Fetches available setups

### `/lab/setups/new` Create Setup
- **Component:** Client
- **Auth:** Required
- **Renders:** Setup creation wizard
- **Key components:** `SetupWizard`
- **Data:** Fetches available tools for bundling

### `/lab/setups/[setupId]` Setup Detail
- **Component:** Client
- **Auth:** Required
- **Renders:** Setup overview with included tools, description, deploy button
- **Key components:** `SetupDetail`, `SetupToolList`
- **Data:** Fetches setup by ID

### `/lab/setups/[setupId]/edit` Edit Setup
- **Component:** Client
- **Auth:** Required (setup owner)
- **Renders:** Setup editing orchestration
- **Key components:** `SetupEditor`
- **Data:** Fetches setup data

### `/lab/setups/[setupId]/builder` Setup Builder
- **Component:** Client
- **Auth:** Required (setup owner)
- **Renders:** Visual setup builder with drag-and-drop tool arrangement
- **Key components:** `SetupBuilder`
- **Data:** Fetches setup and available tools

---

## Legacy Space Routes

### `/spaces` (deprecated)
- **Component:** Client
- **Auth:** Required
- **Renders:** Nothing - redirects to `/home`

### `/spaces/[spaceId]/tools` Space Tools
- **Component:** Client
- **Auth:** Required
- **Renders:** Tools deployed to a space

### `/spaces/[spaceId]/tools/[deploymentId]` Space Tool Deployment
- **Component:** Client
- **Auth:** Required
- **Renders:** Specific tool deployment within a space

### `/spaces/[spaceId]/setups` Space Setups
- **Component:** Client
- **Auth:** Required
- **Renders:** Setups deployed to a space

### `/spaces/[spaceId]/setups/[deploymentId]` Space Setup Deployment
- **Component:** Client
- **Auth:** Required
- **Renders:** Specific setup deployment within a space

---

## Rituals

### `/rituals` Rituals List
- **Component:** Client
- **Auth:** Required
- **Renders:** List of engagement rituals/patterns available to spaces
- **Key components:** `RitualsList`, `RitualCard`
- **Data:** Fetches available rituals

### `/rituals/[slug]` Ritual Detail
- **Component:** Client
- **Auth:** Required
- **Renders:** Individual ritual detail with description, setup guide, examples
- **Key components:** `RitualDetail`
- **Data:** Fetches ritual by slug

---

## Legal

### `/legal/privacy` Privacy Policy
- **Component:** Server
- **Auth:** None (nested under `/legal`, public)
- **Renders:** Privacy policy content
- **Data:** Static

### `/legal/terms` Terms of Service
- **Component:** Server
- **Auth:** None
- **Renders:** Terms of service content
- **Data:** Static

### `/legal/community-guidelines` Community Guidelines
- **Component:** Server
- **Auth:** None
- **Renders:** Community guidelines content
- **Data:** Static

---

## Other Pages

### `/resources` Resources
- **Component:** Client
- **Auth:** Required
- **Renders:** Resources page for space leaders and members

### `/templates` Templates
- **Component:** Client
- **Auth:** Required
- **Renders:** Template gallery (similar to `/lab/templates`)

### `/elements` Element Gallery
- **Component:** Client
- **Auth:** Required
- **Renders:** HiveLab element library for building tools

### `/leaders` Leader Landing
- **Component:** Client
- **Auth:** Required
- **Renders:** Landing page targeting space leaders with value props and onboarding

### `/design-system` Design System Showcase
- **Component:** Client
- **Auth:** Required
- **Renders:** Internal dev tool showing all design system tokens, components, and patterns
- **Note:** Development/internal use

---

## Legacy Redirect Pages

These pages exist only to redirect from old URLs to canonical routes:

| Page File | Redirects To | Method |
|-----------|-------------|--------|
| `/feed/page.tsx` | `/home` | Client `router.replace()` |
| `/feed/settings/page.tsx` | `/settings?section=account` | Server `redirect()` |
| `/hivelab/page.tsx` | `/lab` | Server `redirect()` |
| `/notifications/page.tsx` | `/me/notifications` | Server `redirect()` |
| `/notifications/settings/page.tsx` | `/settings?section=notifications` | Server `redirect()` |
| `/profile/settings/page.tsx` | `/settings` | Server `redirect()` |
| `/profile/connections/page.tsx` | `/me/connections` | Server `redirect()` |
| `/lab/create/page.tsx` | `/lab/new` | Client redirect |
| `/lab/[toolId]/edit/page.tsx` | `/lab/[toolId]` | Server `redirect()` |
| `/lab/[toolId]/run/page.tsx` | `/lab/[toolId]?mode=use` | Client redirect |
| `/lab/[toolId]/settings/page.tsx` | `/lab/[toolId]?settings=true` | Server `redirect()` |
| `/schools/page.tsx` | `/` | Server `redirect()` |
| `/spaces/page.tsx` | `/home` | Client redirect |

---

## HiveLab Demo

### `/hivelab/demo` HiveLab IDE Demo
- **Component:** Client
- **Auth:** Required
- **Renders:** Standalone HiveLab IDE demo environment for showcasing the tool builder
- **Note:** Demo/marketing use

---

## Route Summary

| Area | Active Pages | Redirect Pages |
|------|-------------|----------------|
| Public | 6 | 1 |
| Home/Discovery | 2 | 0 |
| Space (`/s/[handle]`) | 3 | 0 |
| User/Me | 6 | 1 |
| Profile | 4 | 3 |
| Lab | 16 | 3 |
| Legacy Spaces | 4 | 1 |
| Rituals | 2 | 0 |
| Legal | 3 | 0 |
| Other | 5 | 0 |
| Legacy Redirects | 0 | 5 |
| **Total** | **51** | **14** |

**65 total page.tsx files.** 8 layout.tsx files. ~30 redirect rules across middleware + next.config.mjs.
