# Admin Dashboard — TODO

**Status:** ~85% complete
**Target:** Ship-ready for campus deployment

---

## Ship-Ready Features

- [x] Authentication flow (JWT sessions, Firebase)
- [x] Command Center — all 5 views (Pulse, Territory, Momentum, Health, Impact)
- [x] Operations Center — core structure with mode switching
- [x] Mode Switcher (Command ↔ Operations)
- [x] Sidebar navigation with collapsible state
- [x] Rituals management (full CRUD)
- [x] Spaces management with health indicators
- [x] User management (search, suspend, role changes)
- [x] Content moderation (reports, violations, appeals)
- [x] Claims queue (leader verification)
- [x] Feature flag management (categorized, toggleable)
- [x] Analytics dashboard with charts
- [x] System health monitoring
- [x] Activity log viewer
- [x] Real-time SSE infrastructure
- [x] Zustand state management

---

## High Priority (Required for Launch)

### Notification Handlers
- [ ] Wire up notification bell click → notification panel
- [ ] Connect to SSE stream for real-time badge updates
- [ ] Toast notifications for critical alerts

### Space Edit Flow
- [ ] Complete space edit modal with validation
- [ ] Feature/unfeature toggle with confirmation
- [ ] Per-space feature flag overrides

### Pagination
- [ ] User list pagination (currently loads all)
- [ ] Space list pagination
- [ ] Activity log infinite scroll or pagination
- [ ] Report queue pagination for large volumes

---

## Medium Priority (Post-Launch Polish)

### AI Quality Dashboard
- [ ] Backend routes for AI metrics
- [ ] Generation tracking and failure rates
- [ ] Edit audit trail

### Nudge System
- [ ] `/api/admin/nudge` endpoint
- [ ] Nudge composer UI
- [ ] Audience targeting (by space, role, activity level)

### Design Token Alignment
- [ ] Audit hardcoded colors → replace with tokens
- [ ] Consistent spacing scale (4/8/12/16/24/32)
- [ ] Typography scale alignment

### Communications Module
- [ ] Announcement composer
- [ ] Push notification targeting
- [ ] Email campaign templates

---

## Stubbed Components (Low Priority)

These have working alternatives in the existing dashboards:

- `BuilderQueue.tsx` — Use `BuilderQueueEnhanced` instead
- `FlagQueue.tsx` — Use `FeatureFlagManagement` instead
- `UserLookup.tsx` — Use `UserManagementDashboard` instead

---

## Code Health

### Type Safety
- [ ] Remove `any` types in API response handlers
- [ ] Add proper typing to Firestore query results
- [ ] Validate API responses with Zod

### Error Handling
- [ ] Consistent error boundaries per section
- [ ] Retry logic for failed API calls
- [ ] Offline state handling

### Performance
- [ ] Lazy load Operations Center sections
- [ ] Memoize expensive chart calculations
- [ ] Virtualize long lists (users, spaces, logs)

---

## Testing

- [ ] E2E tests for critical flows (auth, moderation actions)
- [ ] Component tests for mode switching
- [ ] API route tests for admin endpoints

---

## Notes

**Mode Architecture:**
- Command Center = Executive demos, sales presentations
- Operations Center = Daily admin workflow

**Data Flow:**
- Real-time: SSE from `/api/admin/command/stream`
- Polling: Queue counts refresh every 30s
- Static: Analytics/time series via direct API calls

**Campus Isolation:**
All queries filter by `campusId` — enforced at API layer.
