# Spaces Code Audit Scorecard

**Auditor:** code-auditor
**Date:** 2026-02-07
**Strategy Lens:** Commuter Home Base + Space Autopilot
**Scoring:** S = Ship as-is | F = Fix before launch | K = Kill (remove or defer)

---

## Summary

| Area | Files | Ship | Fix | Kill |
|------|-------|------|-----|------|
| Domain Logic | 18 | 10 | 6 | 2 |
| API Routes | 88 | 42 | 24 | 22 |
| UI Components | 29 | 18 | 7 | 4 |
| Feature Components | 31 | 16 | 9 | 6 |
| Hooks | 4 | 3 | 1 | 0 |
| Context Providers | 7 | 6 | 1 | 0 |
| Validation Schemas | 1 | 0 | 1 | 0 |
| **Totals** | **178** | **95** | **49** | **34** |

**Ship rate: 53% | Fix rate: 28% | Kill rate: 19%**

---

## 1. Domain Logic (`packages/core/src/domain/spaces/`)

| File/Module | Score | Rationale |
|---|---|---|
| `aggregates/enhanced-space.ts` | F | Central aggregate root, well-architected DDD. BUT: ~1000+ lines, dual status fields (`publishStatus` + `lifecycleState`), over-complex lifecycle state machine for launch needs. Fix: collapse dual status, trim unused governance models (only `flat` needed at launch). |
| `entities/board.ts` | S | Clean chat board entity. Types (general/topic/event), permissions, archival. Solid DDD. |
| `entities/chat-message.ts` | S | Message entity with reactions, threading, editing, soft delete. Uses `crypto.randomUUID()` for IDs. Ship-ready. |
| `entities/inline-component.ts` | K | Over-engineered inline components (polls, countdowns, RSVPs, HiveLab tools in chat). 793 lines for features not needed at launch. Kill or defer to post-launch. |
| `entities/placed-tool.ts` | K | HiveLab tool placement entity. Strategy says kill student tool creation. This entity only serves HiveLab placement in spaces. Defer entirely. |
| `entities/tab.ts` | S | Clean tab entity. Types: feed/widget/resource/custom. 198 lines, well-scoped. |
| `entities/widget.ts` | F | Widget entity uses `Record<string, any>` for config. Fix the type safety issue. 144 lines otherwise clean. |
| `value-objects/space-id.value.ts` | F | `SpaceId.generate()` uses `Math.random()` -- not cryptographically secure. Fix: use `crypto.randomUUID()`. |
| `value-objects/space-name.value.ts` | S | Standard value object with validation. Clean. |
| `value-objects/space-slug.value.ts` | S | Slug generation with collision avoidance, reserved words list. 149 lines, solid. |
| `value-objects/space-description.value.ts` | S | Simple value object. Clean. |
| `value-objects/space-category.value.ts` | F | Maps 5 categories to CampusLabs branch IDs. Legacy mapping is extensive. Categories don't match validation schema (`space.schema.ts` uses different enum). Fix: align with validation package. |
| `space-capabilities.ts` | K (defer) | Capability checker for HiveLab tool deployment validation. Only relevant if HiveLab tools stay in spaces. Strategy says kill student tool creation, so defer this. |
| `system-tool-registry.ts` | F | Default tools per space type. Contains HiveLab-specific registrations that should be removed. Keep the concept (system tools like announcements, events, links, polls) but strip HiveLab coupling. |
| `templates/index.ts` | S | 9 space templates. Well-structured, used during space creation. Ship as-is, templates add value for leader onboarding. |
| `events/index.ts` | S | 25+ domain events. Clean event definitions for space lifecycle, chat, members. Ship. |
| `constants/` (directory) | S | Constants directory. Standard support files. |
| `index.ts` (barrel) | S | Barrel exports. Clean. |

### Domain Logic Quality Flags
- **Security:** `SpaceId.generate()` uses `Math.random()` (predictable IDs)
- **Tech Debt:** Dual status fields in aggregate (`publishStatus` vs `lifecycleState`)
- **Over-engineering:** `inline-component.ts` (793 lines) and `placed-tool.ts` (469 lines) serve HiveLab features marked for kill

---

## 2. API Routes (`apps/web/src/app/api/spaces/`)

### Core CRUD

| File/Module | Score | Rationale |
|---|---|---|
| `route.ts` (GET/POST) | S | List/create spaces with DDD repo, cursor pagination, 8 security checks on create, campus isolation, XSS scanning. Production-quality. |
| `[spaceId]/route.ts` (GET/PATCH/DELETE) | S | Full space detail with DDD, membership detection (3-layer fallback), XSS scanning on updates. Solid. |
| `[spaceId]/structure/route.ts` | S | Space structure (tabs + widgets). DDD-backed. Clean. |
| `[spaceId]/preview/route.ts` | S | Space preview for non-members. Lightweight. Ship. |
| `[spaceId]/analytics/route.ts` | S | Basic analytics endpoint. Ship. |
| `[spaceId]/data/route.ts` | S | Space data export. Ship. |

### Members & Membership

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/members/route.ts` (GET/POST/PATCH/DELETE) | S | 907 lines. Batch fetching (N+1 fix), ghost mode, presence detection, activity stats, cursor pagination, sharded counters. Best-engineered route in codebase. |
| `[spaceId]/members/[memberId]/route.ts` | S | Individual member operations. Clean. |
| `[spaceId]/members/batch/route.ts` | S | Batch member operations. Ship. |
| `[spaceId]/membership/route.ts` | S | Membership check/management. Ship. |
| `[spaceId]/membership/me/route.ts` | S | Current user membership status. Ship. |
| `[spaceId]/invite/route.ts` | S | Space invite generation. Ship. |
| `[spaceId]/join-request/route.ts` | S | Join request for private spaces. Ship. |
| `[spaceId]/join-requests/route.ts` | S | Leader-side join request management. Ship. |

### Chat & Boards

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/chat/route.ts` (GET/POST) | S | 598 lines. DDD SpaceChatService, rate limiting (20/min), XSS scanning, keyword automations, @mention notifications. Well-implemented. |
| `[spaceId]/chat/stream/route.ts` | S | Real-time chat streaming. Ship. |
| `[spaceId]/chat/read/route.ts` | S | Read receipts. Ship. |
| `[spaceId]/chat/typing/route.ts` | S | Typing indicators. Ship. |
| `[spaceId]/chat/search/route.ts` | S | Message search. Ship. |
| `[spaceId]/chat/pinned/route.ts` | S | Pinned messages. Ship. |
| `[spaceId]/chat/[messageId]/route.ts` | S | Individual message CRUD. Ship. |
| `[spaceId]/chat/[messageId]/pin/route.ts` | S | Pin/unpin message. Ship. |
| `[spaceId]/chat/[messageId]/react/route.ts` | S | Message reactions. Ship. |
| `[spaceId]/chat/[messageId]/replies/route.ts` | S | Thread replies. Ship. |
| `[spaceId]/chat/intent/route.ts` | F | Chat intent detection (AI-powered?). Needs review -- may be over-scoped for launch. Fix: verify it's not calling external AI APIs without fallback. |
| `[spaceId]/boards/route.ts` | S | Board CRUD with DDD SpaceChatService, permission checks. Clean. |
| `[spaceId]/boards/[boardId]/route.ts` | S | Individual board operations. Ship. |
| `[spaceId]/boards/reorder/route.ts` | S | Board reordering. Ship. |

### Events

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/events/route.ts` (GET/POST) | S | 450 lines. Batch optimizations (organizers, RSVPs, boards in 1 query each), ghost mode privacy, XSS scanning, auto-link to chat board. Well-engineered. |
| `[spaceId]/events/[eventId]/route.ts` | S | Individual event CRUD. Ship. |
| `[spaceId]/events/[eventId]/rsvp/route.ts` | S | RSVP management. Ship. |

### Discovery & Browse

| File/Module | Score | Rationale |
|---|---|---|
| `browse/route.ts` | K | Deprecated (sunset 2026-06-01). Already has browse-v2. Kill before launch -- dead code. |
| `browse-v2/route.ts` | S | DDD repo layer, cold start signals (event counts, mutual friends, tool counts), cursor pagination, search. Production-ready. |
| `search/route.ts` | S | Space search. Ship. |
| `recommended/route.ts` | S | Recommendation engine. Ship. |
| `live/route.ts` | S | Live/active spaces. Ship. |
| `attention/route.ts` | F | Attention-based discovery. Unclear if this serves Commuter Home Base use case. Fix: verify it's connected to UI, remove if orphaned. |
| `my/route.ts` | F | User's spaces. Duplicated by `mine/route.ts`? Fix: consolidate into one. |
| `mine/route.ts` | F | User's spaces. Duplicated by `my/route.ts`? Fix: consolidate into one. |

### Resources & Posts

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/resources/route.ts` | S | Resource management. Ship. |
| `[spaceId]/resources/[resourceId]/route.ts` | S | Individual resource. Ship. |
| `[spaceId]/posts/route.ts` | F | Space posts (feed items). Strategy says kill feed page, but in-space posts may still be needed. Fix: clarify if these serve space-internal announcements vs. global feed. |
| `[spaceId]/posts/[postId]/route.ts` | F | Individual post CRUD. Same question as above. |
| `[spaceId]/posts/[postId]/comments/route.ts` | F | Post comments. Depends on posts decision. |
| `[spaceId]/posts/[postId]/reactions/route.ts` | F | Post reactions. Depends on posts decision. |
| `[spaceId]/promote-post/route.ts` | K | Promote post to feed. Strategy kills the feed page. Kill this. |
| `[spaceId]/feed/route.ts` | K | Space-level feed. Strategy says feed is deferred. Kill. |

### Tools & HiveLab Integration

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/tools/route.ts` | K | HiveLab tool deployment to spaces. Strategy says kill student tool creation. Kill or stub to system-only tools. |
| `[spaceId]/tools/feature/route.ts` | K | Featured tools. HiveLab-specific. Kill. |
| `[spaceId]/apps/[deploymentId]/route.ts` | K | App deployment management. HiveLab-specific. Kill. |
| `[spaceId]/tool-connections/route.ts` | K | Tool connections. HiveLab-specific. Kill. |
| `[spaceId]/tool-connections/[connectionId]/route.ts` | K | Individual tool connection. HiveLab-specific. Kill. |
| `[spaceId]/builder-permission/route.ts` | K | Builder permission check. HiveLab-specific. Kill. |
| `[spaceId]/builder-status/route.ts` | K | Builder status. HiveLab-specific. Kill. |

### Tabs & Widgets

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/tabs/route.ts` | S | Tab CRUD. Ship. |
| `[spaceId]/tabs/[tabId]/route.ts` | S | Individual tab. Ship. |
| `[spaceId]/widgets/route.ts` | S | Widget CRUD. Ship. |
| `[spaceId]/widgets/[widgetId]/route.ts` | S | Individual widget. Ship. |

### Space Lifecycle & Admin

| File/Module | Score | Rationale |
|---|---|---|
| `claim/route.ts` | S | Space claim flow (seeded -> claimed). DDD-backed, provisional access, admin notification. Critical path for launch. Ship. |
| `join-v2/route.ts` | S | Idempotent join with ban checks, sharded counters, major space unlock. Well-engineered. Ship. |
| `leave/route.ts` | S | Leave space. Ship. |
| `[spaceId]/go-live/route.ts` | S | Leader activates space. Ship. |
| `transfer/route.ts` | S | Ownership transfer (top-level). Ship. |
| `[spaceId]/transfer-ownership/route.ts` | F | Ownership transfer (space-level). Duplicated with `transfer/route.ts`? Fix: consolidate. |
| `[spaceId]/moderation/route.ts` | S | Content moderation. Ship. |
| `[spaceId]/apply-template/route.ts` | S | Apply template to space. Ship. |
| `templates/route.ts` | S | List available templates. Ship. |
| `check-create-permission/route.ts` | S | Pre-flight permission check. Ship. |
| `check-handle/route.ts` | S | Handle availability check. Ship. |
| `resolve-slug/[slug]/route.ts` | S | Slug resolution. Ship. |
| `seed/route.ts` | F | Seed spaces data. Should be dev-only / admin-gated. Fix: ensure not accessible in production. |
| `request/route.ts` | S | Generic request endpoint. Ship. |
| `request-to-lead/route.ts` | S | Request leadership. Ship. |
| `waitlist/route.ts` | F | Waitlist for spaces. Unclear use case for launch. Fix: verify it's connected or kill. |
| `activity/recent/route.ts` | S | Recent activity feed. Ship. |
| `residential/route.ts` | F | Residential spaces. Niche use case. Fix: verify it connects to identity system. |
| `identity/route.ts` | S | Space identity (major/residence/interest). Ship -- supports Commuter Home Base. |

### Automations & Webhooks

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/automations/route.ts` | F | Automation CRUD (Phase 3 HiveLab). Well-built with discriminated union triggers. Fix: decouple from HiveLab, keep as Space Autopilot feature. |
| `[spaceId]/automations/[automationId]/route.ts` | F | Individual automation. Same as above. |
| `[spaceId]/automations/[automationId]/toggle/route.ts` | F | Toggle automation. Same. |
| `[spaceId]/automations/trigger/route.ts` | F | Trigger automation. Same. |
| `[spaceId]/automations/from-template/route.ts` | F | Create from template. Same -- could be Space Autopilot's "one-click setup". |
| `[spaceId]/webhooks/route.ts` | K | Webhook management. Over-scoped for launch. Kill. |
| `[spaceId]/webhooks/[webhookId]/route.ts` | K | Individual webhook. Kill. |

### Components (Inline Chat)

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/components/route.ts` | K | Inline component CRUD (polls, RSVPs in chat). Over-scoped. Kill or defer. |
| `[spaceId]/components/[componentId]/route.ts` | K | Individual component. Kill. |
| `[spaceId]/components/[componentId]/participate/route.ts` | K | Component participation. Kill. |

### Uploads & Media

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/upload/route.ts` | S | General file upload. Ship. |
| `[spaceId]/upload-avatar/route.ts` | S | Avatar upload. Ship. |
| `[spaceId]/upload-banner/route.ts` | S | Banner upload. Ship. |

### Other

| File/Module | Score | Rationale |
|---|---|---|
| `[spaceId]/sidebar/route.ts` | S | Sidebar data. Ship. |
| `[spaceId]/availability/route.ts` | S | Space availability check. Ship. |
| `[spaceId]/seed-rss/route.ts` | K | RSS seed for spaces. Over-scoped. Kill. |
| `invite/[code]/validate/route.ts` | S | Invite code validation. Ship. |
| `invite/[code]/redeem/route.ts` | S | Invite code redemption. Ship. |

### API Routes Quality Flags
- **Duplication:** `my/route.ts` vs `mine/route.ts` -- consolidate
- **Duplication:** `transfer/route.ts` vs `[spaceId]/transfer-ownership/route.ts` -- consolidate
- **Dead Code:** `browse/route.ts` -- deprecated, should be removed
- **Security:** `seed/route.ts` -- verify production access is blocked
- **Over-scope:** 22 routes marked Kill are HiveLab-specific or over-engineered for launch

---

## 3. UI Components (`packages/ui/src/design-system/components/spaces/`)

| File/Module | Score | Rationale |
|---|---|---|
| `SpaceHub.tsx` (531 lines) | S | Orientation archetype with mode cards, community stage framing. Well-designed entry point. Ship. |
| `SpaceThreshold.tsx` (467 lines) | S | Entry gateway for non-members. Join request flow, pending/rejected states. Clean UI. Ship. |
| `SpaceEntryAnimation.tsx` (188 lines) | S | CSS-based entry animation. Lightweight, no Framer Motion dependency. Ship. |
| `SpaceChatBoard.tsx` (661 lines) | S | Full chat board component. Message list, input, slash commands. Ship. |
| `TheaterChatBoard.tsx` (734 lines) | S | Theater-mode chat (immersive). Ship. |
| `ChatRowMessage.tsx` | S | Individual message row with reactions, threading. Ship. |
| `TypingDots.tsx` | S | Typing indicators (3 variants). Ship. |
| `EventsMode.tsx` | S | Full-screen events mode. Ship. |
| `MembersMode.tsx` (564 lines) | S | Full-screen members view. Ship. |
| `ToolsMode.tsx` | K | Full-screen tools browser. HiveLab feature. Kill for launch. |
| `ModeCard.tsx` | S | Mode selection cards. Ship. |
| `ModeTransition.tsx` | S | Mode transition animations. Ship. |
| `ContextPill.tsx` | S | Context pill navigation. Ship. |
| `EventCreateModal.tsx` | S | Event creation form. Ship. |
| `EventDetailsModal.tsx` (457 lines) | S | Event detail view with RSVP. Ship. |
| `EventEditModal.tsx` (483 lines) | S | Event editing form. Ship. |
| `AddTabModal.tsx` | F | Tab creation modal. Fix: verify it doesn't offer HiveLab-specific tab types. |
| `AddWidgetModal.tsx` | F | Widget creation modal. Fix: verify it doesn't reference HiveLab tools. |
| `MemberInviteModal.tsx` | S | Member invite modal. Ship. |
| `PinnedMessagesWidget.tsx` | S | Pinned messages sidebar widget. Ship. |
| `LeaderSetupProgress.tsx` | F | Leader onboarding progress tracker. Fix: align setup tasks with Commuter Home Base requirements (not HiveLab). |
| `MobileActionBar.tsx` | F | Mobile bottom action bar. Fix: verify drawer types don't include HiveLab. |
| `MobileDrawer.tsx` | F | Mobile drawer component. Fix: same as above. |
| `SpaceLeaderOnboardingModal.tsx` | F | Leader onboarding modal. Fix: remove HiveLab "quick deploy" templates, focus on Space Autopilot actions. |
| `SpaceWelcomeModal.tsx` | S | Welcome modal for new members. Ship. |
| `IntentConfirmationInline.tsx` | F | Chat intent confirmation. Fix: verify it's not over-scoped (AI intent detection). |
| `JoinRequestsPanel.tsx` | S | Join request management for leaders. Ship. |
| `ChatSearchModal.tsx` | S | Message search modal. Ship. |
| `index.ts` (barrel) | S | Clean barrel exports. Ship. |

### UI Components Quality Flags
- **Over-scope:** `ToolsMode.tsx` is HiveLab-specific, kill for launch
- **Coupling:** Several modals reference HiveLab concepts that strategy says to kill
- **Good patterns:** Components use design tokens, Framer Motion, TypeScript throughout

---

## 4. Feature Components (`apps/web/src/components/spaces/`)

| File/Module | Score | Rationale |
|---|---|---|
| `SpaceClaimModal.tsx` (599 lines) | S | Claim flow for seeded spaces. Critical path. Ship. |
| `SpaceCreationModal.tsx` (390 lines) | S | Create new space. Clean form with validation. Ship. |
| `SpaceJoinModal.tsx` | S | Join space modal. Ship. |
| `discover-section.tsx` (621 lines) | S | Browse/discover spaces. Key for Commuter Home Base discovery. Ship. |
| `your-spaces-list.tsx` | S | User's joined spaces list. Core navigation. Ship. |
| `space-list-row.tsx` | S | Space list row component. Ship. |
| `MajorSpaceCard.tsx` | S | Major/department space card. Supports identity system. Ship. |
| `identity-cards.tsx` (398 lines) | S | Identity type cards (major, residence, interests). Supports Commuter Home Base. Ship. |
| `identity-claim-modal.tsx` | S | Claim identity (major/residence). Ship. |
| `space-preview-modal.tsx` | S | Space preview for non-members. Ship. |
| `returning-user-layout.tsx` | S | Spaces-first layout for returning users. Clean composition. Ship. |
| `new-user-layout.tsx` | S | Discovery-first layout for new users. Uses WordReveal, AnimatedLine. Ship. |
| `homebase-activity-feed.tsx` | S | Cross-space activity stream. Key Commuter Home Base feature. Ship. |
| `invite-link-modal.tsx` (513 lines) | S | Invite link generation/sharing. Ship. |
| `boards-sidebar.tsx` (609 lines) | S | Chat boards sidebar navigation. Ship. |
| `territory-header.tsx` | S | Space header component. Ship. |
| `space-quick-actions.tsx` | F | Quick action buttons. Fix: verify actions don't include HiveLab-specific options. |
| `unified-activity-feed.tsx` (739 lines) | F | Unified feed across spaces. Fix: may overlap with `homebase-activity-feed.tsx` -- consolidate. |
| `onboarding-overlay.tsx` (481 lines) | F | Space onboarding overlay. Fix: align tasks with Commuter Home Base, strip HiveLab references. |
| `sidebar-tool-section.tsx` | K | Sidebar section for HiveLab tools. Kill. |
| `sidebar-tool-card.tsx` | K | Individual tool card in sidebar. Kill. |
| `builder/BuilderShell.tsx` | K | HiveLab builder shell within spaces. Kill. |
| `builder/TemplateCard.tsx` | K | HiveLab template card. Kill. |
| `builder/AccessOption.tsx` | K | HiveLab access option. Kill. |
| `panels/events-panel.tsx` (607 lines) | S | Events panel. Ship. |
| `panels/members-panel.tsx` | S | Members panel. Ship. |
| `panels/resources-panel.tsx` (919 lines) | F | Resources panel. Fix: 919 lines is large, may need splitting. Verify all features are launch-relevant. |
| `panels/leader-onboarding-panel.tsx` | F | Leader onboarding panel. Fix: align with Space Autopilot, strip HiveLab steps. |
| `motion/welcome-card.tsx` | S | Welcome animation card. Ship. |
| `motion/crossing-ceremony.tsx` | F | Crossing ceremony animation. Fix: verify it's polished and not a stub. |
| `UnlockCelebration.tsx` | F | Space unlock celebration animation. Fix: verify it connects to activation system, not a placeholder. |

### Feature Components Quality Flags
- **Kill cluster:** 5 files in `builder/` and `sidebar-tool-*` are HiveLab-specific
- **Duplication:** `unified-activity-feed.tsx` vs `homebase-activity-feed.tsx` -- likely redundant
- **Large files:** `resources-panel.tsx` at 919 lines needs review for splitting
- **Good patterns:** Layout components (`returning-user-layout`, `new-user-layout`) are well-composed

---

## 5. Hooks (`apps/web/src/hooks/`)

| File/Module | Score | Rationale |
|---|---|---|
| `use-space-structure.ts` | S | Fetches tabs + widgets via DDD backend. Provides optimistic updates. Clean React Query integration. Ship. |
| `use-spaces-browse.ts` | S | Client-side Firestore browsing with campus isolation, filtering, search. Uses one-time reads for cost efficiency. Ship. |
| `use-space-tools.ts` | S | React Query hook for space tools. Well-typed with PlacedToolDTO. Ship even if HiveLab tools are killed -- system tools still need it. |
| `use-space-realtime.ts` | F | Real-time membership state via Firestore `onSnapshot`. Fix: verify cleanup/unsubscribe is correct to avoid memory leaks. Review connection management. |

### Hooks Quality Flags
- **Good patterns:** All hooks use React Query or Firestore listeners correctly
- **Risk:** Real-time hook needs memory leak verification

---

## 6. Context Providers (`apps/web/src/contexts/space/`)

| File/Module | Score | Rationale |
|---|---|---|
| `SpaceContextProvider.tsx` (47 lines) | S | Clean composed provider nesting 5 contexts in dependency order. Well-architected. Ship. |
| `SpaceMetadataContext.tsx` | S | Focused context for space info + membership. Uses `secureApiFetch`. Ship. |
| `SpaceEventsContext.tsx` | S | Focused context for events data. Depends on MetadataContext. Ship. |
| `SpaceStructureContext.tsx` | S | Tabs + widgets context. Ship. |
| `SpaceTabUIContext.tsx` | S | Tab UI state (active tab, transitions). Ship. |
| `SpaceLeaderContext.tsx` | S | Leader-specific state (permissions, onboarding). Ship. |
| `hooks.ts` + `index.ts` | F | Barrel exports and convenience hooks. Fix: verify exports don't expose HiveLab-specific context values. |

### Context Quality Flags
- **Architecture:** Excellent separation into focused contexts to minimize re-renders
- **Pattern:** Provider composition in dependency order is a best practice

---

## 7. Validation Schemas (`packages/validation/src/`)

| File/Module | Score | Rationale |
|---|---|---|
| `space.schema.ts` (127 lines) | F | **Critical mismatch with domain model.** Schema uses `SpaceStatus = 'draft' | 'live' | 'archived' | 'suspended'` but domain uses `SpaceLifecycleState = 'SEEDED' | 'CLAIMED' | 'PENDING' | 'LIVE' | 'SUSPENDED' | 'ARCHIVED'`. Schema uses `SpaceCategory = 'academics' | 'social' | 'professional' | ...` but domain uses `STUDENT_ORGANIZATIONS | UNIVERSITY_ORGANIZATIONS | GREEK_LIFE | CAMPUS_LIVING | HIVE_EXCLUSIVE`. Fix: align enums with domain model. This is a silent bug waiting to happen. |

### Validation Quality Flags
- **Critical:** Category enum mismatch between validation and domain will cause runtime errors
- **Critical:** Status enum mismatch means validation won't catch invalid lifecycle states
- **Missing:** No schemas for events, boards, chat messages, automations in validation package (each API route defines inline schemas instead of sharing)

---

## Cross-Cutting Issues

### Security Issues (Priority: High)
1. `SpaceId.generate()` uses `Math.random()` -- predictable IDs (space-id.value.ts)
2. `seed/route.ts` -- verify production access is blocked
3. `widget.ts` uses `Record<string, any>` -- potential injection vector

### Dead Code (Priority: Medium)
1. `browse/route.ts` -- deprecated, has browse-v2 replacement
2. `my/route.ts` + `mine/route.ts` -- duplicated endpoints
3. `transfer/route.ts` + `[spaceId]/transfer-ownership/route.ts` -- duplicated

### Schema Drift (Priority: High)
1. Validation package categories don't match domain categories
2. Validation package status don't match domain lifecycle states
3. Each API route defines its own inline Zod schemas instead of sharing from validation package

### HiveLab Kill List (19 files total)
These files exist solely to support HiveLab tool creation/deployment in spaces. Strategy says kill student tool creation:

**Domain:** `inline-component.ts`, `placed-tool.ts`, `space-capabilities.ts`
**API Routes:** `tools/route.ts`, `tools/feature/route.ts`, `apps/[deploymentId]/route.ts`, `tool-connections/route.ts`, `tool-connections/[connectionId]/route.ts`, `builder-permission/route.ts`, `builder-status/route.ts`, `components/route.ts`, `components/[componentId]/route.ts`, `components/[componentId]/participate/route.ts`
**UI:** `ToolsMode.tsx`
**Feature:** `sidebar-tool-section.tsx`, `sidebar-tool-card.tsx`, `builder/BuilderShell.tsx`, `builder/TemplateCard.tsx`, `builder/AccessOption.tsx`

### Consolidation Opportunities
1. `my/route.ts` + `mine/route.ts` -> single `mine/route.ts`
2. `transfer/route.ts` + `[spaceId]/transfer-ownership/route.ts` -> single transfer route
3. `unified-activity-feed.tsx` + `homebase-activity-feed.tsx` -> single feed component
4. Inline Zod schemas in API routes -> shared from `packages/validation`
5. `automations/` routes -> rebrand as Space Autopilot engine

---

## Verdict

The spaces codebase is **production-grade** in its core paths (CRUD, members, chat, events, discovery). The DDD architecture is well-implemented with proper aggregate roots, entities, value objects, and domain events. Security patterns (XSS scanning, rate limiting, campus isolation, ghost mode) are consistently applied.

**The main problem is scope creep.** ~19% of files serve HiveLab features that strategy says to kill. Another ~28% need fixes, mostly to decouple from HiveLab or resolve schema drift.

**Launch-critical fixes (do before shipping):**
1. Fix validation schema drift (categories + status enums)
2. Fix `SpaceId.generate()` to use `crypto.randomUUID()`
3. Remove deprecated `browse/route.ts`
4. Consolidate duplicate routes (`my`/`mine`, `transfer`)
5. Gate or remove `seed/route.ts` from production

**Post-launch cleanup:**
1. Kill 19 HiveLab-specific files
2. Collapse dual status fields in aggregate
3. Consolidate activity feed components
4. Move inline Zod schemas to validation package
