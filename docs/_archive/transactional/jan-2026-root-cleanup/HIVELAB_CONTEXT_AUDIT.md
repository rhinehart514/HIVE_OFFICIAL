# HiveLab Context Gatekeeping - Complete Audit
**Date:** January 21, 2026
**Status:** ⚠️ UI Complete, Backend Incomplete

---

## Executive Summary

**What Works:**
- ✅ UI-level context gatekeeping (selection page, validation, display)
- ✅ Cross-app routing (web ↔ hivelab)
- ✅ Deploy modal pre-selection based on URL params
- ✅ Space page entry point with "Build" button

**Critical Gaps:**
- ❌ Context not persisted to database
- ❌ No API-level validation or enforcement
- ❌ Profile tool deployment not implemented
- ❌ Security gaps (client-side only validation)
- ❌ No migration strategy for existing tools

---

## Architecture Analysis

### Current Implementation

#### 1. Context Flow (URL-Based)
```
/select-context
  → URL params: ?context=space&spaceId=X&spaceName=Y
  → /create (validates params exist)
  → /[toolId] (shows context banner)
  → /[toolId]/deploy (pre-selects target)
```

**Problem:** Context only exists in URL params. Not persisted anywhere.

#### 2. Database Schema

**Tools Collection** (from DATABASE_SCHEMA.md):
```typescript
interface Tool {
  name: string;
  description: string;
  creatorId: string;
  type: 'template' | 'custom';
  status: 'draft' | 'published' | 'archived';
  // ❌ NO contextType field
  // ❌ NO contextId field
  // ❌ NO deploymentTarget field
}
```

**PlacedTools Collection**:
```typescript
interface PlacedTool {
  toolId: string;
  placementType: 'space' | 'profile';  // ✅ This exists
  spaceId?: string;
  profileId?: string;
}
```

**Disconnect:** Placements know their type, but tools don't know their intended context.

#### 3. API Endpoints

**POST /api/tools** (route.ts:135-408):
- ✅ Accepts `isSpaceTool` and `spaceId` fields
- ✅ Validates user has builder/admin role if `isSpaceTool === true`
- ❌ Does NOT accept `contextType` field
- ❌ Frontend IDE never sends context during creation/save

**PUT /api/tools** (route.ts:417-490):
```typescript
const handleSave = async (updatedComposition) => {
  await apiClient.put(`/api/tools/${toolId}`, {
    name: updatedComposition.name,
    description: updatedComposition.description,
    elements: updatedComposition.elements,
    // ❌ NO contextType sent
    // ❌ NO spaceId sent
  });
};
```

**Deployment** (/api/tools/[toolId]/deploy/route.ts:18-205):
- ✅ Validates user is member of target space
- ✅ Validates user has admin/leader/builder/moderator role
- ✅ Creates placement document
- ✅ Prevents duplicate deployments
- ❌ Does NOT validate tool was built for that space

---

## Critical Issues

### 1. **Context Not Persisted** 🔴 CRITICAL

**Current Behavior:**
- User selects "Build for Space X"
- Context shown in IDE header: "Building for: Space X"
- User saves tool
- Tool document has NO record of this context
- User closes browser
- Opens tool later → No context information

**Impact:**
- Context is ephemeral
- Lost on page refresh, browser close, or direct URL access
- Can't filter "tools built for Space X" vs "tools built for Profile"
- Can't enforce "tools built for Space X can only deploy to Space X"

**What's Needed:**
```typescript
interface Tool {
  // Add these fields:
  contextType: 'space' | 'profile' | 'feed' | null;
  contextId: string | null;  // spaceId or profileId
  contextName: string | null;  // For display purposes
}
```

---

### 2. **No API Validation** 🔴 CRITICAL

**Current Behavior:**
- IDE sends context via URL params
- IDE save function never includes context in payload
- API never receives or stores context
- Anyone can create tools without context

**Impact:**
- Gatekeeping is purely cosmetic
- Users could bypass UI and POST directly to API
- No server-side enforcement of context rules

**What's Needed:**
```typescript
// POST /api/tools should require:
const CreateToolSchema = z.object({
  name: z.string(),
  // ... existing fields
  contextType: z.enum(['space', 'profile', 'feed']).optional(),
  contextId: z.string().optional(),
  // Validate: if contextType is 'space', contextId must be provided
  // Validate: user has permission for that space
});
```

---

### 3. **Security Gap** 🟡 MEDIUM

**Current Behavior:**
- User can craft URL: `?context=space&spaceId=ANY_SPACE_ID`
- IDE shows "Building for: That Space"
- No validation until deployment attempt

**Impact:**
- Misleading UI (user thinks they're authorized)
- Deployment fails late in flow (poor UX)
- Potential for social engineering ("Look, I built this for your space!")

**What's Needed:**
- Validate space access on IDE page load
- Redirect to context selection if user lacks permission
- Show error if context params are invalid

---

### 4. **Profile Tools Not Implemented** 🟡 MEDIUM

**Current Behavior:**
- Context selection shows "My Profile" option
- User clicks "Build for Profile"
- Tool gets created
- Deployment flow shows... what?
- No `/api/profile/[userId]/tools` endpoint
- No UI for profile tools

**Impact:**
- Feature appears to exist but doesn't work
- Users may create profile tools that can't be deployed
- Profile context is a dead end

**What's Needed:**
- Profile tool deployment endpoint
- Profile page tools section
- Profile tools API (GET /api/profile/tools)
- placed_tools support for profileId

---

### 5. **Existing Tools Migration** 🟡 MEDIUM

**Current Behavior:**
- All existing tools have no context fields
- Opening an old tool in IDE → no context banner
- Deploying an old tool → works (no restrictions)

**Impact:**
- Inconsistent experience (new tools gated, old tools not)
- Two classes of tools in system
- Can't apply context-based features to old tools

**What's Needed:**
- Migration script to set `contextType: null` for existing tools
- UI handles null context gracefully ("No context assigned")
- Allow retroactive context assignment

---

### 6. **Tool Reusability Unclear** 🟢 LOW

**Current Behavior:**
- User builds tool for Space A
- Can they deploy to Space B?
- Current UX implies "no" (context is sticky)
- Current backend allows "yes" (no validation)

**Design Question:**
Should tools be:
- **Context-bound:** Tool built for Space A can only deploy to Space A
- **Reusable:** Tool built for Space A can deploy anywhere (context is a suggestion)

**Recommendation:**
Make tools reusable but track "original context":
```typescript
interface Tool {
  originalContext: {
    type: 'space' | 'profile';
    id: string;
    name: string;
  } | null;
  // Can deploy anywhere, but shows where it was originally built
}
```

---

### 7. **Feed Context Placeholder** 🟢 LOW

**Current Behavior:**
- Context selection shows "Feed Tools - Coming Soon"
- No backend implementation
- No database fields
- Pure UI placeholder

**Impact:**
- None (clearly marked as coming soon)

**Future Work:**
- Define feed tool architecture
- Add `contextType: 'feed'`
- Feed-specific deployment logic

---

## Data Flow Gaps

### Current Flow (Broken)
```
1. User selects context → URL params
2. /create validates URL → Passes
3. /[toolId] shows banner → URL params
4. User saves tool → API call with NO context ❌
5. Tool created → No context in DB ❌
6. User deploys → Pre-selects target from URL ✅
7. Deployment succeeds → No validation ❌
```

### Correct Flow (Needed)
```
1. User selects context → URL params
2. /create validates URL → Passes
3. /[toolId] validates user permission → Server-side check ✅
4. User saves tool → API call WITH context ✅
5. Tool created → Context saved to DB ✅
6. User deploys → Validates tool context matches target ✅
7. Deployment succeeds → Fully validated ✅
```

---

## Recommendations

### Phase 1: Critical Fixes (P0)

1. **Add Context Fields to Tool Schema**
   ```typescript
   // In @hive/core ToolSchema
   contextType: z.enum(['space', 'profile', 'feed']).nullable(),
   contextId: z.string().nullable(),
   contextName: z.string().nullable(),
   ```

2. **Update HiveLab IDE Save Logic**
   ```typescript
   // apps/hivelab/src/app/[toolId]/page.tsx
   const handleSave = async (comp) => {
     await apiClient.put(`/api/tools/${toolId}`, {
       ...comp,
       contextType: context,  // From URL params
       contextId: spaceId,
       contextName: spaceName,
     });
   };
   ```

3. **Update API to Accept & Validate Context**
   ```typescript
   // apps/web/src/app/api/tools/route.ts
   const EnhancedCreateToolSchema = CreateToolSchema.extend({
     contextType: z.enum(['space', 'profile', 'feed']).optional(),
     contextId: z.string().optional(),
     contextName: z.string().optional(),
   }).refine(
     (data) => {
       // If contextType is 'space', contextId must be provided
       if (data.contextType === 'space') return !!data.contextId;
       return true;
     },
     { message: "contextId required when contextType is 'space'" }
   );

   // In POST handler:
   if (contextType === 'space' && contextId) {
     // Validate user has permission for this space
     const memberSnapshot = await db.collection('spaceMembers')
       .where('userId', '==', userId)
       .where('spaceId', '==', contextId)
       .where('status', '==', 'active')
       .where('role', 'in', ['owner', 'leader', 'admin', 'builder'])
       .limit(1)
       .get();

     if (memberSnapshot.empty) {
       return respond.error('Not authorized for this space', 'FORBIDDEN');
     }
   }
   ```

4. **Add Server-Side Context Validation**
   ```typescript
   // In /[toolId]/page.tsx
   useEffect(() => {
     if (context === 'space' && spaceId) {
       // Validate user has permission
       fetch(`/api/spaces/${spaceId}/check-builder-permission`)
         .then(r => r.json())
         .then(data => {
           if (!data.hasPermission) {
             setError('You do not have permission for this space');
             router.push('/select-context');
           }
         });
     }
   }, [context, spaceId]);
   ```

5. **Migration Script for Existing Tools**
   ```typescript
   // scripts/migrate-tools-add-context.ts
   const tools = await db.collection('tools').get();
   const batch = db.batch();

   tools.docs.forEach(doc => {
     batch.update(doc.ref, {
       contextType: null,
       contextId: null,
       contextName: null,
     });
   });

   await batch.commit();
   ```

### Phase 2: Profile Tools (P1)

6. **Implement Profile Tool Deployment**
   - Add `/api/profile/tools` endpoint
   - Update deployment logic to handle `targetType: 'profile'`
   - Create profile tools UI section

7. **Profile Tools Display**
   - Add tools section to profile page
   - Show deployed profile tools
   - Allow tool removal

### Phase 3: Enhancements (P2)

8. **Tool Provenance Dashboard**
   - Show "Originally built for: Space X"
   - Track deployment history
   - Show where tool is currently deployed

9. **Context-Based Filtering**
   - Filter tools by context type
   - "Show tools built for spaces"
   - "Show tools built for profile"

10. **Deployment Restrictions (Optional)**
    - Add `allowCrossContextDeployment` setting
    - Space-specific tools can't deploy elsewhere
    - Profile-specific tools stay on profile

---

## Testing Checklist

### Current State (Before Fixes)
- [ ] Create tool with space context → Context not in DB ❌
- [ ] Refresh IDE page → Context lost ❌
- [ ] Edit old tool → No context shown ❌
- [ ] Deploy to wrong space → No validation ❌
- [ ] Build for profile → Can't deploy ❌

### Target State (After Fixes)
- [ ] Create tool with space context → Context saved to DB ✅
- [ ] Refresh IDE page → Context persists from DB ✅
- [ ] Edit old tool → Shows "No context" gracefully ✅
- [ ] Deploy to wrong space → Validation error ✅
- [ ] Build for profile → Deploy works ✅
- [ ] Manually set wrong spaceId in URL → Validation error ✅
- [ ] User without permission tries to build → Access denied ✅

---

## Files Requiring Updates

### Backend
1. `packages/core/src/domain/tools/tool.entity.ts` - Add context fields to schema
2. `apps/web/src/app/api/tools/route.ts` - Accept & validate context
3. `apps/web/src/app/api/tools/[toolId]/deploy/route.ts` - Validate context match
4. `apps/web/src/app/api/profile/tools/route.ts` - NEW: Profile tools endpoint

### Frontend (HiveLab)
5. `apps/hivelab/src/app/[toolId]/page.tsx` - Send context on save, validate on load
6. `apps/hivelab/src/app/select-context/page.tsx` - Validate space permission

### Database
7. Migration script to add context fields to existing tools

---

## Timeline Estimate

- **Phase 1 (Critical):** 4-6 hours
  - Schema update: 30 min
  - API updates: 2 hours
  - Frontend updates: 2 hours
  - Migration script: 30 min
  - Testing: 1 hour

- **Phase 2 (Profile Tools):** 3-4 hours
  - Profile deployment: 2 hours
  - Profile UI: 2 hours

- **Phase 3 (Enhancements):** 2-3 hours per feature

**Total for Production-Ready:** ~8-10 hours

---

## Risk Assessment

**If Shipped As-Is:**
- 🔴 **HIGH:** Context gatekeeping is cosmetic only
- 🔴 **HIGH:** Tools have no record of intended context
- 🟡 **MEDIUM:** Profile tools appear to work but don't
- 🟡 **MEDIUM:** Security gap (client-side only validation)
- 🟢 **LOW:** User confusion (why did deployment fail?)

**After Phase 1 Fixes:**
- ✅ Context properly persisted and enforced
- ✅ Server-side validation in place
- ✅ Existing tools handled gracefully
- ⚠️ Profile tools still incomplete (but clearly gated)

---

## Conclusion

The current implementation has **excellent UX** but **no backend enforcement**. It's a facade—users experience context gatekeeping, but the database and API don't know about it.

**Critical Path:** Phase 1 fixes are essential before launch. Without them, the context system provides no real value and could mislead users.

**Recommendation:** Complete Phase 1 before any production deployment. Phase 2 can follow shortly after if profile tools are needed.
