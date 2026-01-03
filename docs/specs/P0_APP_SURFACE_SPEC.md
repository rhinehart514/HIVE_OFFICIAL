# P0: App Surface + Capabilities Hardening Specification

> Implementation spec for Tool→App duality and capability system completion.
> Locked decisions: Jan 2, 2026

---

## 1. Firestore Schema Changes

### 1.1 `deployedTools/{deploymentId}` (Extended)

```typescript
interface DeploymentRecord {
  // === EXISTING FIELDS (unchanged) ===
  id: string;
  toolId: string;
  deployedBy: string;
  deployedTo: 'profile' | 'space';
  targetId: string;
  surface?: 'pinned' | 'posts' | 'events' | 'tools' | 'chat' | 'members';
  position: number;
  config: Record<string, unknown>;
  permissions: {
    canInteract: boolean;
    canView: boolean;
    canEdit: boolean;
    allowedRoles: string[];
  };
  status: DeploymentGovernanceStatus;
  deployedAt: string;
  lastUsed?: string;
  usageCount: number;
  settings: { /* ... */ };
  placementId: string;
  placementPath: string;
  creatorId: string;
  spaceId: string | null;
  profileId: string | null;
  campusId: string;
  capabilities: ToolCapabilities;
  budgets: ToolBudgets;
  capabilityLane: 'safe' | 'scoped' | 'power';
  experimental: boolean;

  // === NEW FIELDS (P0) ===

  /**
   * Surface modes this deployment supports.
   * - widget: Renders in sidebar (existing behavior)
   * - app: Renders full-screen in /spaces/[spaceId]/apps/[deploymentId]
   *
   * Default for existing deployments: { widget: true, app: false }
   */
  surfaceModes: {
    widget: boolean;
    app: boolean;
  };

  /**
   * Which surface is primary (affects default navigation)
   * - 'widget': Opens in sidebar by default
   * - 'app': Opens full-screen by default, widget is "mini view"
   */
  primarySurface: 'widget' | 'app';

  /**
   * App-specific configuration (only relevant when surfaceModes.app = true)
   */
  appConfig?: {
    /** Layout mode for app surface */
    layout: 'full' | 'centered' | 'sidebar';

    /** Whether to show the widget mini-view in sidebar when app is open */
    showWidgetWhenActive: boolean;

    /** Custom breadcrumb label (defaults to tool name) */
    breadcrumbLabel?: string;

    /** Reserved for v2: Multi-view configuration */
    _views?: ToolView[];
    _routes?: ToolRoute[];
    _defaultView?: string;
  };

  /**
   * Tool version snapshot at deployment time.
   * Enables version pinning for stability.
   */
  toolVersion: string;

  /**
   * Provenance tracking for trust + attribution
   */
  provenance: {
    /** Original tool creator */
    creatorId: string;
    /** If this deployment uses a forked tool */
    forkedFrom?: string;
    /** Full lineage chain (tool IDs) */
    lineage: string[];
    /** When tool was created */
    createdAt: string;
    /** Deployment trust tier */
    trustTier: 'unverified' | 'community' | 'verified' | 'system';
  };
}

// Reserved types for v2 (schema only, not shipped)
interface ToolView {
  id: string;
  name: string;
  icon?: string;
  layout: 'full' | 'centered' | 'sidebar';
}

interface ToolRoute {
  path: string;
  viewId: string;
}
```

### 1.2 `tools/{toolId}` (Extended)

```typescript
interface ToolRecord {
  // === EXISTING FIELDS (unchanged) ===
  id: string;
  name: string;
  description: string;
  ownerId: string;
  status: 'draft' | 'published' | 'archived';
  composition: ToolComposition;
  elements: CanvasElement[];
  currentVersion: string;
  // ... etc

  // === NEW FIELDS (P0) ===

  /**
   * Supported surface modes for this tool.
   * Deployers can only enable surfaces the tool supports.
   */
  supportedSurfaces: {
    widget: boolean;
    app: boolean;
  };

  /**
   * Recommended primary surface (deployer can override)
   */
  recommendedSurface: 'widget' | 'app';

  /**
   * App configuration template
   */
  appDefaults?: {
    layout: 'full' | 'centered' | 'sidebar';
    showWidgetWhenActive: boolean;
  };

  /**
   * Capabilities this tool requires.
   * Shown to deployers at install time.
   */
  requiredCapabilities: ToolCapabilities;

  /**
   * Object types this tool creates/reads.
   * Used for capability auto-generation.
   */
  objectTypes?: ObjectTypeReference[];

  /**
   * Provenance for the tool itself
   */
  provenance: {
    creatorId: string;
    createdAt: string;
    forkedFrom?: string;
    lineage: string[];
    forkCount: number;
    deploymentCount: number;
  };
}

interface ObjectTypeReference {
  /** Fully qualified type ID: publisherId.typeSlug */
  typeId: string;
  /** How this tool uses the object type */
  access: 'read' | 'write' | 'read_write';
}
```

### 1.3 `objectTypes/{typeId}` (New Collection)

```typescript
/**
 * Object type schema definition.
 * typeId format: {publisherId}.{typeSlug}
 * Example: "jacob.meeting_note", "hive.eboard_proposal"
 */
interface ObjectTypeSchema {
  /** Fully qualified ID: publisherId.typeSlug */
  id: string;

  /** Publisher (creator) user ID */
  publisherId: string;

  /** Type slug (3-40 chars, lowercase, underscores) */
  slug: string;

  /** Human-readable name */
  name: string;

  /** Description */
  description: string;

  /** JSON Schema for object data validation */
  dataSchema: JSONSchema7;

  /** Workflow states (optional) */
  workflow?: {
    states: WorkflowState[];
    transitions: WorkflowTransition[];
    initialState: string;
  };

  /** Field-level permissions */
  fieldPermissions?: Record<string, {
    readRoles: string[];
    writeRoles: string[];
  }>;

  /** Schema version (for migrations) */
  version: string;

  /** Previous versions for compatibility */
  previousVersions: string[];

  /** Visibility */
  visibility: 'private' | 'space' | 'campus' | 'public';

  /** Campus isolation */
  campusId: string;

  /** Timestamps */
  createdAt: string;
  updatedAt: string;
}

interface WorkflowState {
  id: string;
  name: string;
  color?: string;
  isFinal: boolean;
}

interface WorkflowTransition {
  from: string;
  to: string;
  action: string;
  allowedRoles: string[];
  conditions?: Record<string, unknown>;
}
```

### 1.4 `spaceObjects/{objectId}` (New Collection)

```typescript
/**
 * Object instance within a space.
 * Single collection with space filtering for query efficiency.
 */
interface SpaceObject {
  /** Object ID */
  id: string;

  /** Space this object belongs to */
  spaceId: string;

  /** Object type reference */
  typeId: string;

  /** Schema version this instance conforms to */
  schemaVersion: string;

  /** Current workflow state (if type has workflow) */
  state?: string;

  /** Object data (validated against schema) */
  data: Record<string, unknown>;

  /** Assigned user (optional, for queries like "my tasks") */
  assignedTo?: string;

  /** Creator */
  createdBy: string;
  createdAt: string;

  /** Last modifier */
  updatedBy: string;
  updatedAt: string;

  /** Campus isolation */
  campusId: string;

  /** Soft delete */
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}
```

### 1.5 Extended Capabilities Schema

```typescript
/**
 * Tool capability grants - what a deployed tool is allowed to do.
 */
export interface ToolCapabilities {
  // === LANE 1: SAFE (always allowed) ===
  read_own_state: true;
  write_own_state: true;

  // === LANE 2: SCOPED (leader approved) ===
  read_space_context?: boolean;
  read_space_members?: boolean;
  write_shared_state?: boolean;

  // === LANE 3: POWER (explicitly gated) ===
  create_posts?: boolean;
  send_notifications?: boolean;
  trigger_automations?: boolean;

  // === NEW: OBJECT CAPABILITIES (P0) ===

  /**
   * Object read permissions.
   * - false: No object read access
   * - true: Read all object types (restricted to verified/system)
   * - string[]: Read specific object types by typeId
   */
  objects_read?: boolean | string[];

  /**
   * Object write permissions.
   * Same format as objects_read.
   */
  objects_write?: boolean | string[];

  /**
   * Object delete permissions.
   * Same format as objects_read.
   */
  objects_delete?: boolean | string[];
}

/**
 * Validate capability request against trust tier.
 * Wildcards (true) only allowed for verified/system.
 */
export function validateCapabilityRequest(
  capabilities: Partial<ToolCapabilities>,
  trustTier: 'unverified' | 'community' | 'verified' | 'system'
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Wildcard object access restricted to verified+
  if (capabilities.objects_read === true && !['verified', 'system'].includes(trustTier)) {
    errors.push('Wildcard object read access requires verified trust tier');
  }
  if (capabilities.objects_write === true && !['verified', 'system'].includes(trustTier)) {
    errors.push('Wildcard object write access requires verified trust tier');
  }
  if (capabilities.objects_delete === true && !['verified', 'system'].includes(trustTier)) {
    errors.push('Wildcard object delete access requires verified trust tier');
  }

  return { valid: errors.length === 0, errors };
}
```

---

## 2. API Contract Changes

### 2.1 Deploy Route Changes

**File:** `apps/web/src/app/api/tools/deploy/route.ts`

```typescript
// Extended schema
const DeployToolSchema = z.object({
  toolId: z.string(),
  deployTo: z.enum(['profile', 'space']),
  targetId: z.string(),
  surface: SurfaceSchema.optional(),
  config: z.record(z.any()).optional(),
  permissions: DeploymentPermissionsSchema,
  settings: DeploymentSettingsSchema,
  capabilities: CapabilitiesSchema,
  budgets: BudgetsSchema,
  experimental: z.boolean().optional(),

  // === NEW (P0) ===
  surfaceModes: z.object({
    widget: z.boolean(),
    app: z.boolean(),
  }).optional(),
  primarySurface: z.enum(['widget', 'app']).optional(),
  appConfig: z.object({
    layout: z.enum(['full', 'centered', 'sidebar']).optional(),
    showWidgetWhenActive: z.boolean().optional(),
    breadcrumbLabel: z.string().max(50).optional(),
  }).optional(),
});

// Validation logic addition
async function validateSurfaceModes(toolData: ToolData, input: DeployToolInput) {
  const requestedModes = input.surfaceModes || { widget: true, app: false };
  const supportedModes = toolData.supportedSurfaces || { widget: true, app: false };

  if (requestedModes.app && !supportedModes.app) {
    return { ok: false, error: 'This tool does not support app surface' };
  }
  if (requestedModes.widget && !supportedModes.widget) {
    return { ok: false, error: 'This tool does not support widget surface' };
  }
  if (!requestedModes.widget && !requestedModes.app) {
    return { ok: false, error: 'At least one surface mode must be enabled' };
  }

  return { ok: true };
}
```

### 2.2 New Route: Get App Deployment

**File:** `apps/web/src/app/api/spaces/[spaceId]/apps/[deploymentId]/route.ts`

```typescript
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

/**
 * GET /api/spaces/[spaceId]/apps/[deploymentId]
 *
 * Returns deployment data for app surface rendering.
 * Validates:
 * - User is space member
 * - Deployment exists and is active
 * - Deployment has app surface enabled
 * - User has permission to view
 */
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const userId = getUserId(request as AuthenticatedRequest);
  const { spaceId, deploymentId } = context.params;

  // 1. Verify space membership
  const membershipQuery = await dbAdmin.collection('spaceMembers')
    .where('userId', '==', userId)
    .where('spaceId', '==', spaceId)
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .where('isActive', '==', true)
    .limit(1)
    .get();

  if (membershipQuery.empty) {
    return respond.error('You must be a space member to view this app', 'FORBIDDEN', { status: 403 });
  }

  const membership = membershipQuery.docs[0].data();

  // 2. Get deployment
  const deploymentDoc = await dbAdmin.collection('deployedTools').doc(deploymentId).get();

  if (!deploymentDoc.exists) {
    return respond.error('App not found', 'NOT_FOUND', { status: 404 });
  }

  const deployment = deploymentDoc.data();

  // 3. Validate deployment belongs to this space
  if (deployment.targetId !== spaceId || deployment.deployedTo !== 'space') {
    return respond.error('App not found in this space', 'NOT_FOUND', { status: 404 });
  }

  // 4. Check app surface is enabled
  const surfaceModes = deployment.surfaceModes || { widget: true, app: false };
  if (!surfaceModes.app) {
    return respond.error('This tool does not have app view enabled', 'FORBIDDEN', { status: 403 });
  }

  // 5. Check governance status
  if (!['active', 'experimental'].includes(deployment.status)) {
    return respond.error(`This app is ${deployment.status}`, 'FORBIDDEN', { status: 403 });
  }

  // 6. Check role permissions
  const allowedRoles = deployment.permissions?.allowedRoles || [];
  if (allowedRoles.length > 0 && !allowedRoles.includes(membership.role)) {
    return respond.error(
      `This app requires one of these roles: ${allowedRoles.join(', ')}`,
      'FORBIDDEN',
      { status: 403 }
    );
  }

  // 7. Get tool data
  const toolDoc = await dbAdmin.collection('tools').doc(deployment.toolId).get();
  if (!toolDoc.exists) {
    return respond.error('Tool not found', 'NOT_FOUND', { status: 404 });
  }

  const tool = toolDoc.data();

  // 8. Get space data for breadcrumb
  const spaceDoc = await dbAdmin.collection('spaces').doc(spaceId).get();
  const space = spaceDoc.data();

  return respond.success({
    deployment: {
      id: deploymentDoc.id,
      ...deployment,
    },
    tool: {
      id: toolDoc.id,
      name: tool.name,
      description: tool.description,
      composition: tool.composition,
      elements: tool.elements,
    },
    space: {
      id: spaceId,
      name: space?.name,
    },
    userRole: membership.role,
    grantedCapabilities: deployment.capabilities,
  });
});
```

### 2.3 Object CRUD Routes (P1, spec only)

**File:** `apps/web/src/app/api/spaces/[spaceId]/objects/route.ts`

```typescript
// Spec placeholder for P1
// POST - Create object
// GET - List objects (with filters)

// apps/web/src/app/api/spaces/[spaceId]/objects/[objectId]/route.ts
// GET - Read object
// PATCH - Update object
// DELETE - Delete object (soft delete)
```

---

## 3. UI Components

### 3.1 App Page Route

**File:** `apps/web/src/app/spaces/[spaceId]/apps/[deploymentId]/page.tsx`

```tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { SpaceLayout } from '@/components/spaces/space-layout';
import { AppSurface } from '@/components/hivelab/app-surface';
import { AppBreadcrumb } from '@/components/hivelab/app-breadcrumb';
import { getServerSession } from '@/lib/auth';
import { fetchAppDeployment } from '@/lib/api/tools';

interface AppPageProps {
  params: {
    spaceId: string;
    deploymentId: string;
  };
}

export default async function AppPage({ params }: AppPageProps) {
  const session = await getServerSession();
  if (!session) {
    redirect(`/auth/login?redirect=/spaces/${params.spaceId}/apps/${params.deploymentId}`);
  }

  const result = await fetchAppDeployment(params.spaceId, params.deploymentId);

  if (!result.ok) {
    if (result.status === 404) notFound();
    // For 403, show access denied within space context
    return (
      <SpaceLayout spaceId={params.spaceId}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <h2 className="text-xl font-medium text-white/90">Access Denied</h2>
            <p className="text-white/60 mt-2">{result.error}</p>
          </div>
        </div>
      </SpaceLayout>
    );
  }

  const { deployment, tool, space, grantedCapabilities } = result.data;

  return (
    <SpaceLayout spaceId={params.spaceId}>
      {/* Breadcrumb with return to chat */}
      <AppBreadcrumb
        spaceName={space.name}
        spaceId={params.spaceId}
        appName={deployment.appConfig?.breadcrumbLabel || tool.name}
      />

      {/* App Surface */}
      <Suspense fallback={<AppSurfaceSkeleton />}>
        <AppSurface
          deployment={deployment}
          tool={tool}
          capabilities={grantedCapabilities}
          layout={deployment.appConfig?.layout || 'full'}
        />
      </Suspense>
    </SpaceLayout>
  );
}

function AppSurfaceSkeleton() {
  return (
    <div className="flex-1 animate-pulse bg-[#141414] rounded-lg m-4" />
  );
}
```

### 3.2 App Breadcrumb Component

**File:** `packages/ui/src/components/hivelab/app-breadcrumb.tsx`

```tsx
'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';

interface AppBreadcrumbProps {
  spaceName: string;
  spaceId: string;
  appName: string;
}

export function AppBreadcrumb({ spaceName, spaceId, appName }: AppBreadcrumbProps) {
  return (
    <div className="sticky top-0 z-10 bg-[#0A0A0A]/95 backdrop-blur-sm border-b border-white/5">
      <div className="flex items-center h-12 px-4 gap-3">
        {/* Return to space chat */}
        <Link
          href={`/spaces/${spaceId}`}
          className="flex items-center gap-1.5 text-white/60 hover:text-white/90 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm">{spaceName}</span>
        </Link>

        <span className="text-white/20">/</span>

        {/* Current app */}
        <span className="text-sm text-white/90 font-medium">{appName}</span>
      </div>
    </div>
  );
}
```

### 3.3 App Surface Component

**File:** `packages/ui/src/components/hivelab/app-surface.tsx`

```tsx
'use client';

import { useMemo } from 'react';
import { ToolRuntime } from '@/components/hivelab/tool-runtime';
import { CapabilityContext } from '@/lib/hivelab/capability-context';
import type { DeploymentRecord, ToolRecord, ToolCapabilities } from '@hive/core';
import { cn } from '@/lib/utils';

interface AppSurfaceProps {
  deployment: DeploymentRecord;
  tool: ToolRecord;
  capabilities: ToolCapabilities;
  layout: 'full' | 'centered' | 'sidebar';
}

export function AppSurface({ deployment, tool, capabilities, layout }: AppSurfaceProps) {
  const layoutClasses = useMemo(() => {
    switch (layout) {
      case 'full':
        return 'w-full h-full';
      case 'centered':
        return 'max-w-4xl mx-auto py-8 px-4';
      case 'sidebar':
        return 'grid grid-cols-[1fr_300px] gap-4 h-full';
      default:
        return 'w-full h-full';
    }
  }, [layout]);

  return (
    <CapabilityContext.Provider value={capabilities}>
      <div className={cn('flex-1 overflow-auto', layoutClasses)}>
        <ToolRuntime
          deploymentId={deployment.id}
          toolId={tool.id}
          composition={tool.composition}
          elements={tool.elements}
          surface="app"
          className="h-full"
        />
      </div>
    </CapabilityContext.Provider>
  );
}
```

### 3.4 Widget "View Full" Link

**File:** Extend existing tool widget header

```tsx
// In packages/ui/src/components/hivelab/tool-widget.tsx

interface ToolWidgetProps {
  // ... existing props
  surfaceModes: { widget: boolean; app: boolean };
  spaceId?: string;
  deploymentId: string;
}

export function ToolWidget({
  surfaceModes,
  spaceId,
  deploymentId,
  // ... other props
}: ToolWidgetProps) {
  const showViewFull = surfaceModes.app && spaceId;

  return (
    <div className="tool-widget">
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
        <h3 className="text-sm font-medium text-white/90">{toolName}</h3>

        {showViewFull && (
          <Link
            href={`/spaces/${spaceId}/apps/${deploymentId}`}
            className="text-xs text-white/40 hover:text-white/70 transition-colors flex items-center gap-1"
          >
            View Full
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {/* Widget content */}
      <ToolRuntime surface="widget" /* ... */ />
    </div>
  );
}
```

---

## 4. Migration Script

**File:** `scripts/migrations/p0-surface-modes.ts`

```typescript
import { dbAdmin } from '@/lib/firebase-admin';
import { CURRENT_CAMPUS_ID } from '@/lib/secure-firebase-queries';

/**
 * Migration: Backfill surfaceModes for existing deployments
 *
 * Run with: npx ts-node scripts/migrations/p0-surface-modes.ts
 */
async function migrateSurfaceModes() {
  console.log('Starting P0 surface modes migration...');

  const deployments = await dbAdmin
    .collection('deployedTools')
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .get();

  console.log(`Found ${deployments.size} deployments to migrate`);

  const batch = dbAdmin.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;

  for (const doc of deployments.docs) {
    const data = doc.data();

    // Skip if already migrated
    if (data.surfaceModes) {
      continue;
    }

    batch.update(doc.ref, {
      // Default: widget only
      surfaceModes: {
        widget: true,
        app: false,
      },
      primarySurface: 'widget',

      // Ensure capabilities exist
      capabilities: data.capabilities || {
        read_own_state: true,
        write_own_state: true,
        write_shared_state: true,
      },

      // Ensure provenance exists
      provenance: data.provenance || {
        creatorId: data.deployedBy || data.creatorId || 'unknown',
        createdAt: data.deployedAt || new Date().toISOString(),
        lineage: [],
        trustTier: 'unverified',
      },

      // Migration metadata
      _migratedAt: new Date().toISOString(),
      _migrationVersion: 'p0-surface-modes-v1',
    });

    batchCount++;

    // Commit in batches
    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} documents`);
      batchCount = 0;
    }
  }

  // Commit remaining
  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${batchCount} documents`);
  }

  console.log('Migration complete!');
}

// Also migrate tools collection
async function migrateTools() {
  console.log('Migrating tools collection...');

  const tools = await dbAdmin
    .collection('tools')
    .where('campusId', '==', CURRENT_CAMPUS_ID)
    .get();

  console.log(`Found ${tools.size} tools to migrate`);

  const batch = dbAdmin.batch();
  let batchCount = 0;
  const BATCH_SIZE = 500;

  for (const doc of tools.docs) {
    const data = doc.data();

    if (data.supportedSurfaces) {
      continue;
    }

    batch.update(doc.ref, {
      // Default: widget only (tools must opt-in to app)
      supportedSurfaces: {
        widget: true,
        app: false,
      },
      recommendedSurface: 'widget',

      // Ensure provenance exists
      provenance: data.provenance || {
        creatorId: data.ownerId || 'unknown',
        createdAt: data.createdAt || new Date().toISOString(),
        lineage: [],
        forkCount: 0,
        deploymentCount: data.deploymentCount || 0,
      },

      // Ensure requiredCapabilities exists
      requiredCapabilities: data.requiredCapabilities || {
        read_own_state: true,
        write_own_state: true,
      },

      _migratedAt: new Date().toISOString(),
      _migrationVersion: 'p0-surface-modes-v1',
    });

    batchCount++;

    if (batchCount >= BATCH_SIZE) {
      await batch.commit();
      console.log(`Committed batch of ${batchCount} tools`);
      batchCount = 0;
    }
  }

  if (batchCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${batchCount} tools`);
  }

  console.log('Tools migration complete!');
}

// Run migrations
async function main() {
  try {
    await migrateSurfaceModes();
    await migrateTools();
    console.log('All migrations complete!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
```

---

## 5. Capability Enforcement Middleware

**File:** `apps/web/src/lib/middleware/capability-guard.ts`

```typescript
import { dbAdmin } from '@/lib/firebase-admin';
import { hasCapability, type ToolCapabilities } from '@hive/core';

export interface CapabilityCheck {
  capability: keyof ToolCapabilities;
  resourceType?: string; // For object capabilities: the object typeId
}

/**
 * Server-side capability enforcement.
 * Use in API routes that need capability gating.
 */
export async function enforceCapabilities(
  deploymentId: string,
  checks: CapabilityCheck[]
): Promise<{ allowed: boolean; denied: CapabilityCheck[]; capabilities: ToolCapabilities }> {
  // Load deployment
  const deploymentDoc = await dbAdmin.collection('deployedTools').doc(deploymentId).get();

  if (!deploymentDoc.exists) {
    return {
      allowed: false,
      denied: checks,
      capabilities: {} as ToolCapabilities
    };
  }

  const deployment = deploymentDoc.data();
  const capabilities = deployment?.capabilities || {};
  const denied: CapabilityCheck[] = [];

  for (const check of checks) {
    // Handle object capabilities with type specificity
    if (check.capability === 'objects_read' ||
        check.capability === 'objects_write' ||
        check.capability === 'objects_delete') {

      const capValue = capabilities[check.capability];

      if (capValue === false || capValue === undefined) {
        denied.push(check);
        continue;
      }

      if (capValue === true) {
        // Wildcard access - allowed
        continue;
      }

      if (Array.isArray(capValue) && check.resourceType) {
        // Check if specific type is in allowed list
        if (!capValue.includes(check.resourceType)) {
          denied.push(check);
        }
        continue;
      }

      // No resourceType specified but capability is array - deny
      denied.push(check);
      continue;
    }

    // Standard capability check
    if (!hasCapability(capabilities, check.capability)) {
      denied.push(check);
    }
  }

  return {
    allowed: denied.length === 0,
    denied,
    capabilities,
  };
}

/**
 * Middleware wrapper for capability-gated routes
 */
export function withCapabilityCheck(
  checks: CapabilityCheck[],
  handler: (req: Request, ctx: any, respond: any) => Promise<Response>
) {
  return async (req: Request, ctx: any, respond: any) => {
    const body = await req.clone().json().catch(() => ({}));
    const deploymentId = body.deploymentId || ctx.params?.deploymentId;

    if (!deploymentId) {
      return respond.error('Deployment ID required', 'INVALID_INPUT', { status: 400 });
    }

    const result = await enforceCapabilities(deploymentId, checks);

    if (!result.allowed) {
      const deniedCaps = result.denied.map(d => d.capability).join(', ');
      return respond.error(
        `Missing required capabilities: ${deniedCaps}`,
        'FORBIDDEN',
        { status: 403 }
      );
    }

    // Inject capabilities into context for handler use
    ctx.capabilities = result.capabilities;

    return handler(req, ctx, respond);
  };
}
```

---

## 6. Implementation Checklist

### Phase P0-A: App Surface (Estimate: 2-3 days)

- [ ] Extend `DeploymentRecord` schema with `surfaceModes`, `primarySurface`, `appConfig`
- [ ] Extend `ToolRecord` schema with `supportedSurfaces`, `recommendedSurface`
- [ ] Update deploy route to validate and store surface modes
- [ ] Create `/api/spaces/[spaceId]/apps/[deploymentId]` route
- [ ] Create app page at `/spaces/[spaceId]/apps/[deploymentId]`
- [ ] Create `AppBreadcrumb` component
- [ ] Create `AppSurface` component
- [ ] Add "View Full" link to widget header
- [ ] Run migration script for existing deployments

### Phase P0-B: Capability Hardening (Estimate: 1-2 days)

- [ ] Add object capabilities to `ToolCapabilities` interface
- [ ] Update `capabilities.ts` with validation functions
- [ ] Create `capability-guard.ts` middleware
- [ ] Update execute route to use middleware
- [ ] Add provenance population on tool create
- [ ] Add provenance population on tool fork
- [ ] Create `CapabilityContext` for client-side gating

### Phase P0-C: Object Types Foundation (Estimate: 2-3 days, can defer to P1)

- [ ] Create `objectTypes` collection schema
- [ ] Create `spaceObjects` collection schema
- [ ] Create object type validation service
- [ ] Create basic object CRUD routes
- [ ] Wire object capabilities to object routes

---

## 7. Testing Plan

### Unit Tests

```typescript
// capabilities.test.ts
describe('validateCapabilityRequest', () => {
  it('allows explicit type array for unverified', () => {
    const result = validateCapabilityRequest(
      { objects_read: ['jacob.meeting_note'] },
      'unverified'
    );
    expect(result.valid).toBe(true);
  });

  it('denies wildcard for unverified', () => {
    const result = validateCapabilityRequest(
      { objects_read: true },
      'unverified'
    );
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Wildcard object read access requires verified trust tier');
  });

  it('allows wildcard for verified', () => {
    const result = validateCapabilityRequest(
      { objects_read: true },
      'verified'
    );
    expect(result.valid).toBe(true);
  });
});
```

### Integration Tests

```typescript
// app-surface.test.ts
describe('App Surface API', () => {
  it('returns 403 if app surface not enabled', async () => {
    // Deploy tool with widget only
    // Try to access app route
    // Expect 403
  });

  it('returns deployment data for valid app request', async () => {
    // Deploy tool with app enabled
    // Access app route as space member
    // Expect deployment + tool data
  });

  it('respects role permissions', async () => {
    // Deploy tool with admin-only permission
    // Access as member
    // Expect 403
  });
});
```

### E2E Tests

```typescript
// app-navigation.spec.ts
test('can navigate from widget to app and back', async ({ page }) => {
  await page.goto('/spaces/test-space');

  // Find widget with app view
  const widget = page.locator('[data-testid="tool-widget"]').first();
  await widget.locator('text=View Full').click();

  // Should be on app page
  await expect(page).toHaveURL(/\/spaces\/test-space\/apps\//);

  // Breadcrumb should show space name
  await expect(page.locator('[data-testid="app-breadcrumb"]')).toContainText('Test Space');

  // Click back
  await page.locator('[data-testid="app-breadcrumb"] a').click();

  // Should be back on space
  await expect(page).toHaveURL('/spaces/test-space');
});
```

---

## 8. Rollout Plan

### Week 1: Foundation
1. Merge schema changes (non-breaking additions)
2. Run migration script on staging
3. Deploy API route changes
4. QA on staging

### Week 2: UI + Launch
1. Deploy app page and components
2. Enable for internal testing (feature flag)
3. Roll out to 10% of spaces
4. Monitor for issues
5. Full rollout

### Rollback Plan
- All changes are additive (no breaking changes)
- If issues: disable app surface via feature flag
- Existing widget behavior unchanged
