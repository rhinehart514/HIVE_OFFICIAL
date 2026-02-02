# ADR-007: Space State Machine Consolidation

**Status:** Proposed
**Date:** 2026-02-02
**Author:** Deep Audit Task #5

## Context

The `EnhancedSpace` domain entity currently uses **three separate state machines** that can combine in invalid or confusing ways:

### Current State Machines

1. **`status` (SpaceStatus)** - Ownership lifecycle
   - `unclaimed`: Pre-seeded from UBLinked, no owner
   - `active`: Has activity but unclaimed (rarely used)
   - `claimed`: Owner has claimed the space
   - `verified`: Admin has verified the leader

2. **`publishStatus` (SpacePublishStatus)** - Visibility lifecycle
   - `stealth`: Being set up, only visible to leaders
   - `live`: Publicly visible in directory
   - `rejected`: Leader request rejected

3. **`activationStatus` (ActivationStatus)** - Quorum lifecycle
   - `ghost`: 0 members, space exists but dormant
   - `gathering`: 1 to threshold-1 members
   - `open`: threshold+ members, full features unlocked

### Invalid State Combinations

The orthogonal state machines allow these invalid/confusing combinations:

| status | publishStatus | activationStatus | Problem |
|--------|--------------|------------------|---------|
| unclaimed | stealth | open | Unclaimed spaces shouldn't be stealth |
| rejected | live | gathering | Rejected shouldn't be live |
| verified | rejected | open | Verified can't be rejected |
| claimed | live | ghost | Live claimed space with 0 members? |

### Current Code Location

- `packages/core/src/domain/spaces/aggregates/enhanced-space.ts`

## Decision

Consolidate into a single `SpaceLifecycleState` enum representing the canonical lifecycle:

```typescript
type SpaceLifecycleState =
  | 'seeded'      // Pre-seeded from external source, unclaimed
  | 'claimed'     // Leader has claimed, setting up (stealth)
  | 'pending'     // Leader request submitted, awaiting admin verification
  | 'live'        // Verified and publicly visible
  | 'suspended'   // Temporarily disabled by admin
  | 'archived';   // Soft-deleted, recoverable
```

### State Transition Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│   ┌──────────┐    claim()    ┌─────────┐    submit()   ┌─────────┐     │
│   │  seeded  │───────────────▶ claimed │───────────────▶ pending │     │
│   └──────────┘               └─────────┘               └────┬────┘     │
│        │                          │                         │          │
│        │                          │ goLive()                │ verify() │
│        │                          │ (auto-verify)           │          │
│        ▼                          ▼                         ▼          │
│   (external                  ┌────────┐◀────────────────────┘          │
│    removal)                  │  live  │                                │
│                              └────┬───┘                                │
│                                   │                                    │
│                    suspend()      │      archive()                     │
│                         ┌─────────┴─────────┐                          │
│                         ▼                   ▼                          │
│                   ┌───────────┐       ┌──────────┐                     │
│                   │ suspended │       │ archived │                     │
│                   └─────┬─────┘       └──────────┘                     │
│                         │                                              │
│                         │ reinstate()                                  │
│                         ▼                                              │
│                       (live)                                           │
│                                                                        │
└─────────────────────────────────────────────────────────────────────────┘
```

### Derived Properties

The old state values become computed properties based on lifecycle state:

```typescript
class EnhancedSpace {
  // Single source of truth
  readonly lifecycleState: SpaceLifecycleState;
  readonly memberCount: number;
  readonly activationThreshold: number = 10;

  // Derived from lifecycle
  get isPublic(): boolean {
    return this.lifecycleState === 'live';
  }

  get isClaimed(): boolean {
    return this.lifecycleState !== 'seeded';
  }

  get isVerified(): boolean {
    return this.lifecycleState === 'live';
  }

  // Derived from member count (not lifecycle)
  get isActivated(): boolean {
    return this.memberCount >= this.activationThreshold;
  }

  get activationProgress(): number {
    return Math.min(1, this.memberCount / this.activationThreshold);
  }

  // Feature gates based on both lifecycle AND activation
  get canChat(): boolean {
    return this.lifecycleState === 'live' || this.isClaimed;
  }

  get hasFullFeatures(): boolean {
    return this.lifecycleState === 'live' && this.isActivated;
  }
}
```

### Migration Path

1. **Phase 1: Add Unified State (Non-Breaking)**
   - Add `lifecycleState` field alongside existing fields
   - Compute `lifecycleState` from existing fields on read
   - New code writes to both

2. **Phase 2: Migrate Consumers**
   - Update all queries to use `lifecycleState`
   - Update UI components to use derived properties
   - Add deprecation warnings on old fields

3. **Phase 3: Remove Old Fields**
   - Remove `status`, `publishStatus`
   - Keep `activationStatus` as computed-only (or remove entirely)
   - Clean up repository mappers

### Mapping Table

| Old State Combo | New State |
|-----------------|-----------|
| status=unclaimed, publishStatus=live | `seeded` |
| status=claimed, publishStatus=stealth | `claimed` |
| status=claimed, publishStatus=live, pending request | `pending` |
| status=verified, publishStatus=live | `live` |
| status=*, publishStatus=rejected | `suspended` |

### Activation vs Lifecycle

**Key Insight:** Activation (quorum) is orthogonal to lifecycle but much simpler:

- Activation is purely a function of `memberCount >= threshold`
- It gates features (chat, events, etc.) but doesn't affect visibility
- A `live` space with 0 members is valid (it just has limited features)

So activation should be a **computed property**, not a stored state:

```typescript
// Instead of storing activationStatus, compute it:
get activationLevel(): 'ghost' | 'gathering' | 'open' {
  if (this.memberCount === 0) return 'ghost';
  if (this.memberCount < this.activationThreshold) return 'gathering';
  return 'open';
}
```

## Consequences

### Positive

- Single source of truth for space state
- Invalid state combinations become impossible
- Simpler mental model for developers
- Easier to reason about permissions/visibility
- Activation becomes a pure function (no state to corrupt)

### Negative

- Requires migration of existing data
- Breaking change for code that directly checks `publishStatus`
- Need to update all 85+ space-related API endpoints

### Risks

- Data migration could cause temporary inconsistencies
- Need comprehensive test coverage before migration
- Some edge cases may not map cleanly

## Implementation Notes

### Files to Update

1. **Domain Layer**
   - `packages/core/src/domain/spaces/aggregates/enhanced-space.ts` - Primary changes
   - `packages/core/src/domain/spaces/value-objects/*.ts` - New SpaceLifecycleState VO

2. **Infrastructure Layer**
   - `packages/core/src/infrastructure/repositories/firebase/space.mapper.ts` - Mapping logic
   - All space query filters

3. **Application Layer**
   - `packages/core/src/application/spaces/space.dto.ts` - DTO changes
   - `packages/core/src/application/spaces/space.presenter.ts` - Presenter changes

4. **API Layer**
   - All `/api/spaces/*` routes that filter or mutate state

5. **UI Layer**
   - Space threshold/residence components
   - Space settings
   - Admin dashboards

### Estimated Effort

- Phase 1: 4-6 hours
- Phase 2: 8-12 hours
- Phase 3: 2-4 hours
- Testing: 4-6 hours
- **Total: 18-28 hours**

## References

- `packages/core/src/domain/spaces/aggregates/enhanced-space.ts:70-100` - Current state type definitions
- Space Deep Audit (2026-02-02) - Identified this as P1 issue
