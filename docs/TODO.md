# HIVE Development TODO

**Last Updated:** January 16, 2026
**Platform Status:** 97% Complete

---

## Current Focus

Maintenance mode. All core features shipped. Focus on polish and optimization.

---

## Completed Features (January 2026)

### Entry/Auth (100%)
- [x] Email-based OTP authentication
- [x] State machine entry flow (`/enter`)
- [x] Handle selection with validation
- [x] Session management with JWT

### Spaces (95%)
- [x] Space creation and management
- [x] Real-time chat with SSE
- [x] Board (channel) system
- [x] Member management and roles
- [x] Events integration
- [x] Tool deployment sidebar
- [x] Settings and visibility controls

### Feed (100%)
- [x] Post creation with composer modal
- [x] Comment system with threading
- [x] Like/unlike functionality
- [x] Trending sidebar (real data)
- [x] Post detail page (`/posts/[postId]`)

### Profiles (95%)
- [x] View profile (`/profile/[id]`)
- [x] Edit profile (`/profile/edit`)
- [x] Connections/followers
- [x] Placed tools display
- [x] Privacy settings

### HiveLab (95%)
- [x] Tool IDE with code editor
- [x] Template system
- [x] Tool deployment to spaces
- [x] Tool execution runtime
- [x] Analytics dashboard

### Discovery (95%)
- [x] Space browse with territories
- [x] Search functionality
- [x] Category filtering
- [x] Membership indicators

### Calendar (90%)
- [x] Personal calendar view
- [x] Space events integration
- [x] RSVP functionality
- [x] Event creation

### Notifications (90%)
- [x] Real-time notifications
- [x] Mark as read
- [x] Notification preferences

### Settings (95%)
- [x] Account settings
- [x] Privacy settings
- [x] Notification preferences
- [x] Connected accounts

---

## Remaining Work

### P1 - Polish Items
- [ ] Typing indicator optimization (reduce polling)
- [ ] Mobile navigation refinement
- [ ] Empty state improvements
- [ ] Loading skeleton consistency

### P2 - Feature Enhancements
- [ ] Thread notifications
- [ ] Read receipts
- [ ] Board reordering
- [ ] Space analytics (real data)

### P3 - Future Features (Gated)
- [ ] Rituals (feature-flagged, leaders-only)
- [ ] Push notifications (infrastructure ready)
- [ ] Voice messages (not started)
- [ ] Marketplace (not started)

---

## Technical Debt

### Low Priority
- [ ] Consolidate `users` and `profiles` collections
- [ ] Migrate legacy `reactions` field to `engagement`
- [ ] Add comprehensive test coverage
- [ ] Performance audit and optimization

### Documentation
- [x] Update CLAUDE.md with current status
- [x] Update DATABASE_SCHEMA.md with actual collections
- [x] Archive old audit reports
- [x] Clean up root-level TODO files

---

## Quality Gates

Before any release:
- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` succeeds
- [ ] `pnpm lint` passes
- [ ] Manual QA on core flows

---

## Notes

### Architecture Decisions
- Top-level collections (not subcollections) for membership, posts
- SSE for real-time updates (not WebSockets)
- Campus isolation via `campusId` field on all documents
- JWT sessions with Firebase Auth backend

### Design System
- 93 primitives, 138 composed components
- Use `@hive/ui/design-system/primitives` for all UI
- Gold is earned (1% rule), white focus rings
- Rounded square avatars (never circles)

### Key Paths
- Entry: `/enter` + `components/entry/`
- Feed: `/feed` + `/posts/[postId]`
- Spaces: `/spaces/[spaceId]` + chat hooks
- Profile: `/profile/[id]` + `/profile/edit`
- Tools: `/tools/[toolId]` + HiveLab components
