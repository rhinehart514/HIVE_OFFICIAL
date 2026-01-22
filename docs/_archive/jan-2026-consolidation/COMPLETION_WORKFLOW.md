# HIVE Platform Completion Workflow

> **Created**: January 12, 2026
> **Purpose**: Structured workflow for completing the platform before launch
> **Status**: Ready for review

---

## Current Reality (Post-Audit)

### What's Actually Complete (Not What We Thought)

| Feature | Documented Status | Actual Status | Notes |
|---------|------------------|---------------|-------|
| Ghost Mode UI | 75% (modal missing) | **100% COMPLETE** | Modal at `apps/web/src/components/privacy/GhostModeModal.tsx`, wired in Settings |
| Auth Flow | 95% | **100% COMPLETE** | OTP flow, session management, mobile responsive |
| Onboarding | 95% | **100% COMPLETE** | 3-step immersive, flag pickers, auto-join |
| Landing | 95% | **100% COMPLETE** | threshold-buttery.tsx premium aesthetic |
| Spaces Core | 96% | **96% COMPLETE** | Chat, theater mode, all tabs functional |
| Profiles | 75% | **90% COMPLETE** | Bento grid, editing, privacy, connections |
| Settings | 331 lines | **100% COMPLETE** | Full settings with ghost mode integration |
| Notifications | 314 lines | **100% COMPLETE** | Production ready |
| Schools | 578 lines | **100% COMPLETE** | Production ready |
| Leaders | 380 lines | **100% COMPLETE** | Production ready |

### What Actually Needs Work

| Feature | Issue | Severity | Effort |
|---------|-------|----------|--------|
| HiveLab Settings Modal | Shows "coming soon" toast | **P0** | 2-4 hours |
| HiveLab Delete Confirm | Uses browser `confirm()` | **P1** | 1-2 hours |
| HiveLab Error Messages | Generic errors | **P1** | 2-3 hours |
| Events/Calendar | Mock data only | **P1** | Decision needed |
| Resources Page | Had broken external links | **P0** | FIXED Jan 12 |
| Stub Components | Blocking some space features | **P2** | 4-8 hours |

---

## Workflow Decision Framework

### Before Starting Any Task

```
┌─────────────────────────────────────────────────────────────┐
│                    TASK EVALUATION                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Is this a launch blocker?                               │
│     YES → Proceed immediately                                │
│     NO  → Move to step 2                                     │
│                                                              │
│  2. Does user benefit directly?                             │
│     YES → Proceed with priority                              │
│     NO  → Question if needed                                 │
│                                                              │
│  3. Is scope clear?                                         │
│     YES → Proceed                                            │
│     NO  → Document scope first, get approval                 │
│                                                              │
│  4. Estimated effort?                                       │
│     <1 hour → Do it                                          │
│     1-4 hours → Plan before starting                         │
│     >4 hours → Full spec required                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Task Categories & Workflows

### Category A: UI Bug Fixes
**Examples**: Broken links, wrong colors, missing focus states
**Workflow**:
1. Identify the file
2. Read current implementation
3. Make minimal fix
4. Verify fix visually
5. Check typecheck passes

**Acceptance**: Issue resolved, no regressions

### Category B: Missing UI Components
**Examples**: Settings modal, confirmation dialogs
**Workflow**:
1. Document what the component should do
2. Check for similar patterns in codebase
3. Plan component structure
4. Get approval on approach
5. Build component
6. Wire into existing code
7. Test all interactions

**Acceptance**: Component works, follows design system, passes typecheck

### Category C: Feature Completion
**Examples**: Events integration, Calendar real data
**Workflow**:
1. Document current state (what exists)
2. Document target state (what should exist)
3. Identify gaps (what's missing)
4. Break into tasks
5. Get approval on scope
6. Build iteratively
7. Verify each piece works

**Acceptance**: Feature fully functional end-to-end

### Category D: Refactoring/Cleanup
**Examples**: Stub component removal, design system migration
**Workflow**:
1. Inventory what needs changing
2. Map dependencies
3. Create migration plan
4. Get approval
5. Migrate piece by piece
6. Verify each step
7. Delete old code only after new code verified

**Acceptance**: No regressions, cleaner codebase

---

## Priority Queue (Ordered)

### P0 — Launch Blockers (Must Fix)

| # | Task | Category | Status | Est. |
|---|------|----------|--------|------|
| 1 | Resources page broken links | A | **DONE** | - |
| 2 | HiveLab Settings modal | B | Pending | 2-4h |

### P1 — Important (Should Fix)

| # | Task | Category | Status | Est. |
|---|------|----------|--------|------|
| 3 | HiveLab Delete confirmation dialog | B | Pending | 1-2h |
| 4 | HiveLab error messages improvement | A | Pending | 2-3h |
| 5 | Events/Calendar scope decision | - | Decision | 0 |

### P2 — Nice to Have (Could Fix)

| # | Task | Category | Status | Est. |
|---|------|----------|--------|------|
| 6 | Profile "View All" connections button | A | Pending | 0.5h |
| 7 | Stub component implementation | D | Pending | 4-8h |
| 8 | HiveLab mobile responsiveness | A | Pending | 2-4h |

### Decisions Needed

| Decision | Options | Impact | Owner |
|----------|---------|--------|-------|
| Events/Calendar | A) Real backend, B) Placeholder, C) Remove | P1 | User |
| Stub components | A) Implement all, B) Implement critical, C) Remove usages | P2 | User |

---

## Working Agreement

### Before Each Session

1. **Review this document** - Know what's next
2. **Check priority queue** - Work in order
3. **State what you're doing** - "Starting task #X"
4. **Estimate time** - "Should take ~2 hours"

### During Work

1. **Follow category workflow** - Each type has a process
2. **Get approval at decision points** - Don't assume
3. **Update status** - Mark progress
4. **Stop if scope creeps** - Re-evaluate

### After Each Task

1. **Verify it works** - Test the change
2. **Update status** - Mark complete
3. **Note any blockers** - For next tasks
4. **Move to next priority** - In order

---

## Acceptance Criteria (All Tasks)

- [ ] Typecheck passes (`pnpm typecheck`)
- [ ] Follows design system (tokens, not hardcoded)
- [ ] No regressions (existing features still work)
- [ ] Scope matches what was approved
- [ ] Code is production-ready

---

## Files Modified Log

| Date | File | Change | By |
|------|------|--------|-----|
| Jan 12, 2026 | `apps/web/src/app/resources/page.tsx` | Fixed broken external links, converted to internal routes | Claude |

---

## Next Steps

**Before proceeding with any more building:**

1. ✅ Document everything (this file)
2. ⬜ User reviews and approves workflow
3. ⬜ User decides on Events/Calendar scope
4. ⬜ User decides on Stub component approach
5. ⬜ Begin P0 tasks (HiveLab Settings modal)

---

*This document is the source of truth for completion work.*
