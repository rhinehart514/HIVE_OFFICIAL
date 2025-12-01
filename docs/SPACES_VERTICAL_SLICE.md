# HIVE Spaces Feature - Complete Vertical Slice

## Overview

The Spaces feature is a comprehensive vertical slice enabling users to discover, create, join, and manage community spaces on the HIVE platform. This document provides a complete map of the stack across all layers: frontend pages, hooks, context, UI components, API routes, domain models, and infrastructure.

## 1. Frontend Pages

Location: `apps/web/src/app/spaces/`

### Core Pages

| File | Purpose |
|------|---------|
| **page.tsx** | Spaces discovery page with premium hero section, category filtering, search, and featured/recommended sections. Uses `useSpaceDiscovery` hook for unified data management. |
| **browse/page.tsx** | Browse spaces with search, filters (category, member count), and join functionality. Supports pagination and optimistic updates. |
| **create/page.tsx** | Space creation form with validation, category selection, join policy, visibility, and guidelines agreement. Shows success state with redirect. |
| **[spaceId]/page.tsx** | Space detail page with SpaceContext provider. Displays space header, tabs, feed, members, tools. Supports post creation, reactions, and member management. |
| **[spaceId]/settings/page.tsx** | Space settings page for leaders (name, description, visibility, tags, settings). Leader-only functionality. |
| **[spaceId]/members/page.tsx** | Members list page showing all space members with role badges and member count. |
| **[spaceId]/events/page.tsx** | Events page listing space events with RSVP functionality. |
| **[spaceId]/resources/page.tsx** | Resources page (likely for links, files, documents). |
| **[spaceId]/calendar/page.tsx** | Calendar view for space events and scheduling. |
| **s/[slug]/page.tsx** | Slug-based space resolver (alternative to ID-based routing). |
| **[spaceId]/layout.tsx** | Layout wrapper for space detail pages. Contains SpaceSubnav client component. |
| **loading.tsx** | Loading skeletons for space pages (multiple locations). |

## 2. Frontend Hooks

Location: `apps/web/src/hooks/`

### Space-Related Hooks

| File | Purpose | Key Exports |
|------|---------|------------|
| **use-space.ts** | Basic space data fetching and membership state. Handles join/leave with optimistic updates. | `useSpace()` returns `{space, isMember, isLeader, joinSpace, leaveSpace, isLoading, error}` |
| **use-space-discovery.ts** | Advanced discovery management with sections (featured, recommended, popular, new), filtering, search, and pagination. Debounced search (300ms). | `useSpaceDiscovery(options)` - filters, sections, joinSpace, joiningIds, refresh |
| **use-api-spaces.ts** | Simple API wrapper for fetching spaces list with filtering and search. Uses legacy `api.spaces` client. | `useApiSpaces(options)` - spaces, loading, error, refetch |
| **use-space-structure.ts** | Manages space structure (tabs and widgets) with leader actions. Provides CRUD operations on tabs/widgets with optimistic updates. | `useSpaceStructure(spaceId)` - tabs, widgets, permissions, canEdit, addTab, removeWidget, etc. |
| **use-is-space-leader.ts** | Utility hook to check if current user is a space leader. | `useIsSpaceLeader(spaceId)` - boolean |

## 3. Frontend Context

Location: `apps/web/src/contexts/`

### SpaceContext

| File | Purpose |
|------|---------|
| **SpaceContext.tsx** | Unified context for space detail pages. Combines space basic info, membership state, structure (tabs/widgets), and leader actions. Provides single source of truth for space page state. |

**SpaceContextValue Interface:**
- `space` - SpaceDetailDTO with name, description, memberCount, visibility, etc.
- `membership` - SpaceMembership with isMember, isLeader, role
- `tabs`, `widgets`, `permissions` - Structure data from useSpaceStructure
- `visibleTabs`, `enabledWidgets`, `defaultTab` - Filtered structure
- `activeTabId`, `setActiveTabId`, `activeTab` - Active tab state
- `joinSpace()`, `leaveSpace()`, `refresh()` - Actions
- `leaderActions` - Conditional object with tab/widget operations
- Loading states: `isLoading`, `isStructureLoading`, `isMutating`

## 4. UI Components

Location: `packages/ui/src/atomic/03-Spaces/`

### Component Hierarchy

#### Atoms (Basic Elements)
- **top-bar-nav.tsx** - Navigation bar for space header with tabs, icons, actions
- **category-pill.tsx** - Category badge/pill component
- **member-stack.tsx** - Avatar stack showing multiple members
- **activity-badge.tsx** - Badge indicating space activity level
- **momentum-indicator.tsx** - Visual indicator for space momentum/trending
- **glass-surface.tsx** - Glass morphism surface component
- **sticky-rail.tsx** - Sticky sidebar rail for space navigation

#### Molecules (Composite Components)
- **space-header.tsx** - Space name, description, member count display
- **space-composer.tsx** - Post composer/editor component
- **space-tab-bar.tsx** - Tabbed navigation for space sections
- **pinned-posts-stack.tsx** - Stack of pinned posts
- **now-card.tsx** - "What's happening now" widget
- **rail-widget.tsx** - Sidebar widget component
- **space-about-widget.tsx** - Space info widget (description, members, leaders)
- **space-tools-widget.tsx** - Featured tools widget
- **category-filter-bar.tsx** - Filter bar for categories
- **discovery-section-header.tsx** - Header for discovery sections
- **space-discovery-card.tsx** - Discovery card for spaces in browse
- **space-hero-card.tsx** - Large featured space card
- **space-empty-state.tsx** - Empty state component
- **collapsible-widget.tsx** - Collapsible widget container
- **mobile-inline-section.tsx** - Mobile-optimized inline sections
- **navigation-primitives.tsx** - Navigation building blocks

#### Organisms (Complex Components)
- **space-detail-header.tsx** - Premium space header with Ken Burns effect, parallax, tabs, actions
- **space-sidebar.tsx** - Complete sidebar with about, tools, leaders sections
- **space-post-composer.tsx** - Full post composer modal
- **space-board-layout.tsx** - 60/40 split layout (content + sidebar)
- **space-board-skeleton.tsx** - Loading skeleton for space board
- **space-dynamic-content.tsx** - Tab content switcher (feed, widgets, resources)
- **spaces-hero-section.tsx** - Bento grid hero section for featured spaces
- **spaces-discovery-grid.tsx** - Grid of discovery cards

#### Templates & Layouts
- **space-board-template.tsx** - Template combining header, content, and sidebar
- **space-split-layout.tsx** - Split layout container

#### Storybook
- **Spaces.stories.tsx** - Storybook stories for space components
- **top-bar-nav.stories.tsx** - Navigation stories

## 5. API Routes

Location: `apps/web/src/app/api/spaces/`

### Root Endpoints

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/spaces` | GET, POST | List spaces with filtering/search; Create new space |
| `/api/spaces/search` | POST | Search spaces by query and filters |
| `/api/spaces/browse-v2` | GET | Browse spaces (alternative endpoint) |
| `/api/spaces/recommended` | GET | Get recommended/featured/popular/new sections |
| `/api/spaces/mine` | GET | Get current user's spaces |
| `/api/spaces/my` | GET | Alias for mine (legacy) |
| `/api/spaces/resolve-slug/[slug]` | GET | Resolve slug to space ID |
| `/api/spaces/check-create-permission` | GET | Check if user can create spaces |
| `/api/spaces/join-v2` | POST | Join space (v2 with optimistic updates) |
| `/api/spaces/join` | POST | Join space (legacy) |
| `/api/spaces/leave` | POST | Leave space |
| `/api/spaces/request-to-lead` | POST | Request leadership position |
| `/api/spaces/transfer` | POST | Transfer space ownership |
| `/api/spaces/seed` | POST | Seed demo spaces (development) |

### Space Detail Endpoints

| Route | Methods | Purpose |
|-------|---------|---------|
| `/api/spaces/[spaceId]` | GET, PATCH, DELETE | Get/update/delete space |
| `/api/spaces/[spaceId]/structure` | GET | Get complete space structure (tabs + widgets) |
| `/api/spaces/[spaceId]/tabs` | GET, POST | List/create tabs |
| `/api/spaces/[spaceId]/tabs/[tabId]` | GET, PATCH, DELETE | Manage individual tabs |
| `/api/spaces/[spaceId]/widgets` | GET, POST | List/create widgets |
| `/api/spaces/[spaceId]/widgets/[widgetId]` | GET, PATCH, DELETE | Manage individual widgets |
| `/api/spaces/[spaceId]/builder-status` | GET | Get caller's role and permissions |
| `/api/spaces/[spaceId]/membership` | GET, POST | Get/manage membership |
| `/api/spaces/[spaceId]/members` | GET, POST | List/add members |
| `/api/spaces/[spaceId]/members/[memberId]` | GET, PATCH, DELETE | Manage individual members |
| `/api/spaces/[spaceId]/feed` | GET | Get space activity feed |
| `/api/spaces/[spaceId]/posts` | GET, POST | List/create posts |
| `/api/spaces/[spaceId]/posts/[postId]` | GET, PATCH, DELETE | Manage individual posts |
| `/api/spaces/[spaceId]/posts/[postId]/comments` | GET, POST | Post comments |
| `/api/spaces/[spaceId]/posts/[postId]/reactions` | POST | Add reactions (likes) |
| `/api/spaces/[spaceId]/promote-post` | POST | Promote post to main feed |
| `/api/spaces/[spaceId]/events` | GET, POST | List/create events |
| `/api/spaces/[spaceId]/events/[eventId]` | GET, PATCH, DELETE | Manage events |
| `/api/spaces/[spaceId]/events/[eventId]/rsvp` | POST | RSVP to event |
| `/api/spaces/[spaceId]/tools` | GET, POST | List/add tools |
| `/api/spaces/[spaceId]/tools/feature` | POST | Feature a tool in space |
| `/api/spaces/[spaceId]/seed-rss` | POST | Seed space with RSS content |

### Key Route Patterns

**Route Security:**
- All routes use `withAuthAndErrors()` middleware for authentication
- Most use DDD repository pattern via `getServerSpaceRepository()`
- Campus validation using `CURRENT_CAMPUS_ID`
- Role-based access control (owner, admin, member, guest)

**Response Format:**
- Success: `{ success: true, data: {...} }` or `{ data: {...} }`
- Error: `{ error: "message", status: HttpStatus.XXX }`

## 6. Core Domain Models (DDD)

Location: `packages/core/src/domain/spaces/`

### Aggregates

#### EnhancedSpace (Root Aggregate)
**File:** `aggregates/enhanced-space.ts`
- **Properties:**
  - `spaceId: SpaceId` - Unique space identifier
  - `name: SpaceName` - Space name (value object)
  - `slug: SpaceSlug` - URL-friendly slug
  - `description: SpaceDescription` - Space description
  - `category: SpaceCategory` - Space category
  - `campusId: CampusId` - Associated campus
  - `members: SpaceMember[]` - Member list with roles
  - `tabs: Tab[]` - Navigation tabs
  - `widgets: Widget[]` - UI widgets
  - `settings: SpaceSettings` - Configuration
  - `visibility: 'public' | 'private'`
  - `isActive, isVerified, trendingScore`
  - `rushMode?: RushMode` - Greek life rush period support
  - `createdAt, updatedAt, lastActivityAt`

**Member Roles:**
- `owner` - Full control, cannot be demoted, only one per space
- `admin` - Full management permissions
- `moderator` - Content moderation and member management
- `member` - Basic participation rights
- `guest` - Read-only access (private spaces)

**Settings Interface:**
- `allowInvites: boolean`
- `requireApproval: boolean`
- `allowRSS: boolean`
- `maxMembers?: number`
- `isPublic: boolean`

### Entities

#### Tab Entity
**File:** `entities/tab.ts`
- **Properties:**
  - `name: string` - Tab name
  - `type: 'feed' | 'widget' | 'resource' | 'custom'`
  - `isDefault: boolean`
  - `order: number`
  - `widgets: string[]` - Widget IDs
  - `isVisible: boolean`
  - `messageCount: number`
  - `createdAt, lastActivityAt, expiresAt, isArchived`

- **Methods:**
  - `static create(props, id)` - Factory method with validation
  - `addWidget(widgetId)` - Add widget to tab
  - `removeWidget(widgetId)` - Remove widget
  - `setName(name)` - Update name with validation
  - `setOrder(order)` - Change tab order
  - `setVisibility(isVisible)` - Show/hide tab
  - `update(updates)` - Batch update returning changed fields
  - `archive()` / `unarchive()` - Soft delete operations

#### Widget Entity
**File:** `entities/widget.ts`
- **Properties:**
  - `type: 'calendar' | 'poll' | 'links' | 'files' | 'rss' | 'custom'`
  - `title: string`
  - `config: Record<string, any>` - Widget-specific configuration
  - `isVisible, isEnabled, order: number`
  - `position: {x, y, width, height}` - Layout position

- **Methods:**
  - `static create(props, id)` - Factory with validation
  - `updateConfig(config)` - Update widget configuration
  - `setTitle(title)` - Update with validation
  - `setVisibility(isVisible)` - Toggle visibility
  - `setEnabled(isEnabled)` - Enable/disable
  - `setOrder(order)` - Change order
  - `update(updates)` - Batch update with change tracking

### Value Objects

| File | Purpose |
|------|---------|
| **space-id.value.ts** | Unique space identifier |
| **space-name.value.ts** | Space name (validated, immutable) |
| **space-slug.value.ts** | URL-friendly slug (validated) |
| **space-description.value.ts** | Space description (validated) |
| **space-category.value.ts** | Category enum (student_org, residential, etc.) |

### Domain Events

**File:** `events/index.ts`
- `SpaceUpdatedEvent`
- `TabCreatedEvent`
- `TabUpdatedEvent`
- `TabRemovedEvent`
- `TabsReorderedEvent`
- `WidgetCreatedEvent`
- `WidgetUpdatedEvent`
- `WidgetRemovedEvent`
- `WidgetAttachedToTabEvent`
- `WidgetDetachedFromTabEvent`

## 7. Infrastructure Layer

Location: `packages/core/src/infrastructure/`

### Repositories

#### ISpaceRepository (Interface)
**File:** `repositories/interfaces.ts`
- `findById(id)` - Get space by ID
- `findByName(name, campusId)` - Get space by name
- `findBySlug(slug, campusId)` - Get space by slug
- `findWithPagination(query)` - Paginated search with filters
- `findUserSpaces(userId)` - Get spaces user belongs to
- `save(space)` - Persist space aggregate
- `delete(id)` - Delete space

#### FirebaseSpaceRepository (Client SDK)
**File:** `repositories/firebase/space.repository.ts`
- Implements ISpaceRepository using Firebase client SDK
- Uses Firestore collections: `spaces`, `spaceMembers`
- Returns Result<T> pattern for error handling
- Supports filtering by category, name, campus

#### FirebaseAdminSpaceRepository (Admin SDK)
**File:** `repositories/firebase-admin/space.repository.ts`
- Admin SDK version with elevated privileges
- Used in server-side APIs
- Supports batch operations and transactions
- Better performance for complex queries

#### SpaceMapper
**File:** `repositories/firebase/space.mapper.ts`
- Maps between:
  - **Domain:** EnhancedSpace aggregate
  - **Persistence:** Firestore documents
- Handles value object instantiation
- Converts timestamps, nested objects, arrays

**Key Methods:**
- `toDomain(id, document)` - Firestore → Domain
- `toPersistence(space)` - Domain → Firestore
- `toDetailDTO(space)` - Domain → API DTO

### Service Pattern

Server-side service created via:
```typescript
createServerSpaceManagementService(spaceRepo)
```

Provides operations:
- Create space with validation
- Update space metadata
- Manage membership (join, leave, role changes)
- Manage tabs and widgets
- Query spaces with complex filters

## 8. Data Flow & Integration Points

### Discovery Flow
```
User visits /spaces
  ↓
SpacesDiscoveryPage renders
  ↓
useSpaceDiscovery hook initializes
  ↓
Fetches /api/spaces/recommended (sections)
  ↓
Fetches /api/spaces (paginated list)
  ↓
Renders SpacesHeroSection (featured)
  ↓
Renders SpacesDiscoveryGrid (recommended, popular, new)
  ↓
User joins space → optimistic update in hook
  ↓
Calls /api/spaces/join-v2
  ↓
JoinCelebration animation
  ↓
Navigate to /spaces/[spaceId]
```

### Space Detail Flow
```
User navigates to /spaces/[spaceId]
  ↓
SpaceBoardPage renders SpaceContextProvider
  ↓
SpaceContextProvider initializes:
  - Fetches /api/spaces/[spaceId] (basic info)
  - useSpaceStructure(spaceId) fetches structure
  - Loads members, tools, leaders
  ↓
SpaceDetailContent consumes context
  ↓
Renders SpaceDetailHeader (with tabs)
  ↓
Renders SpaceDynamicContent (active tab)
  ↓
Renders sidebar with SpaceSidebar
  ↓
Feed/widgets/resources rendered based on activeTab
```

### Structure Management (Leaders Only)
```
Leader clicks "Edit tabs"
  ↓
isWidgetEditMode = true
  ↓
SpaceDynamicContent shows edit controls
  ↓
addTab → POST /api/spaces/[spaceId]/tabs
  ↓
Optimistic update in useSpaceStructure
  ↓
UI reflects change immediately
  ↓
Server sync, rollback on error
```

## 9. Key Features & Capabilities

### User Features
- **Discovery** - Browse spaces by category, search, filter by member count
- **Membership** - Join/leave spaces with optimistic UI updates
- **Participation** - Create posts, react, comment, RSVP to events
- **Exploration** - View space details, members, tools, events

### Leader Features
- **Creation** - Create spaces with category, visibility, join policy
- **Management** - Edit space info, member roles, settings
- **Structure** - Add/edit/remove tabs and widgets
- **Content** - Manage posts, pin/promote, moderate
- **Tools** - Feature/install tools in space
- **Events** - Create events, manage RSVPs

### Technical Features
- **Optimistic Updates** - Immediate UI feedback before server sync
- **Debounced Search** - 300ms debounce for performance
- **Caching** - 5-minute cache on space lists (via unstable_cache)
- **Error Boundaries** - SpacesErrorBoundary for graceful degradation
- **Lazy Loading** - Pagination with "load more" for lists
- **Responsive Design** - Mobile-optimized layouts

## 10. Type Safety & Validation

### Zod Schemas (Runtime Validation)
- `createSpaceSchema` - Create space input validation
- `UpdateSpaceSchema` - Update space metadata
- `CreateTabSchema` - Tab creation
- `CreateWidgetSchema` - Widget creation
- `UpdateTabSchema` - Tab updates
- `UpdateWidgetSchema` - Widget updates

### TypeScript Interfaces (Compile-time)
- `DiscoverySpace` - Space data in discovery context
- `SpaceDetailDTO` - API response for space detail
- `SpaceMembership` - User membership state
- `SpaceTab`, `SpaceWidget` - Structure components
- `SpaceContextValue` - Context data shape

## 11. Constants & Configuration

**Categories:**
- `student_org` - Student organizations
- `residential` - Dorm/housing communities
- `university_org` - Official university groups
- `greek_life` - Fraternities, sororities
- `club`, `academic`, `sports`, `arts` - Other categories

**Join Policies:**
- `open` - Anyone can join
- `approval` - Leaders approve requests
- `invite_only` - Invitation-only

**Visibility:**
- `public` - Anyone can see posts
- `members_only` - Only members see content

**Tab Types:**
- `feed` - Activity feed (default)
- `widget` - Widget container
- `resource` - Resources/links
- `custom` - Custom tab

**Widget Types:**
- `calendar` - Event calendar
- `poll` - Voting/polls
- `links` - Link collection
- `files` - File storage
- `rss` - RSS feed
- `custom` - Custom widget

## 12. Error Handling

### Client-Side
- Try-catch blocks with error state
- Retry buttons on failure
- Error toast notifications
- Graceful degradation with fallback UI

### Server-Side
- `withAuthAndErrors()` middleware
- Result<T> pattern (success/failure)
- Zod validation for inputs
- Campus security checks
- Role-based access control
- Firestore error handling

## 13. Performance Considerations

- **Debouncing:** Search (300ms)
- **Pagination:** Cursor-based with next cursor tracking
- **Caching:** 5-minute cache on space list (unstable_cache)
- **Optimistic Updates:** Immediate UI feedback with rollback
- **Request Cancellation:** AbortController for search requests
- **Lazy Loading:** Load more pattern for large lists
- **Code Splitting:** Dynamic component imports where applicable

## 14. Current Integration Status

- **DDD Repository Pattern** - Fully integrated in API routes
- **SpaceContext** - Used in space detail pages
- **useSpaceDiscovery** - Primary hook for discovery pages
- **useSpaceStructure** - Manages tabs/widgets
- **Tab/Widget Entities** - Domain models exist but not fully integrated in all APIs

**TODO/Future:**
- Complete integration of EnhancedSpace aggregate
- Event publication after operations
- Full leader request workflow
- Rush mode for Greek life spaces
- Advanced recommendation algorithm

---

**Generated:** November 30, 2025
**Scope:** Current state (not future plans)
**Coverage:** All layers from UI to domain models
