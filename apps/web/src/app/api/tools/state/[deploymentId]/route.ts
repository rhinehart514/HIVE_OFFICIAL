/**
 * Tool State API — /api/tools/state/[deploymentId]
 *
 * Handles state persistence for both standalone and space-deployed tools.
 * deploymentId format: "standalone:{toolId}" or "{spaceId}"
 *
 * Methods: GET, PUT, PATCH
 */

import * as admin from 'firebase-admin';
import { dbAdmin } from '@/lib/firebase-admin';
import {
  withAuthAndErrors,
  getUserId,
  type AuthenticatedRequest,
} from '@/lib/middleware';

function parseDeploymentId(deploymentId: string): {
  toolId: string | null;
  spaceId: string | null;
  isStandalone: boolean;
} {
  if (deploymentId.startsWith('standalone:')) {
    return {
      toolId: deploymentId.replace('standalone:', ''),
      spaceId: null,
      isStandalone: true,
    };
  }
  // Format: "{toolId}_{spaceId}_{scope}" or just spaceId
  return {
    toolId: null,
    spaceId: deploymentId,
    isStandalone: false,
  };
}

function getStandaloneStateDocId(
  toolId: string,
  scope: 'shared' | 'personal',
  userId: string
): string {
  return scope === 'shared'
    ? `${toolId}_standalone_shared`
    : `${toolId}_standalone_${userId}`;
}

type RouteContext = { params: Promise<{ deploymentId: string }> };

// GET — read state
export const GET = withAuthAndErrors(async (request, context, respond) => {
  const { deploymentId: rawId } = await (context as unknown as RouteContext).params;
  const deploymentId = decodeURIComponent(rawId);
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId, isStandalone } = parseDeploymentId(deploymentId);

  if (!isStandalone || !toolId) {
    return respond.error('Use /api/tools/[toolId]/state for space tools', 'INVALID_INPUT', { status: 400 });
  }

  const db = dbAdmin;
  const sharedDocId = getStandaloneStateDocId(toolId, 'shared', userId);
  const personalDocId = getStandaloneStateDocId(toolId, 'personal', userId);

  const [sharedDoc, personalDoc] = await Promise.all([
    db.collection('tool_states').doc(sharedDocId).get(),
    db.collection('tool_states').doc(personalDocId).get(),
  ]);

  return respond.success({
    shared: sharedDoc.exists ? sharedDoc.data()?.state || {} : {},
    personal: personalDoc.exists ? personalDoc.data()?.state || {} : {},
  });
});

// PUT — save full state
export const PUT = withAuthAndErrors(async (request, context, respond) => {
  const { deploymentId: rawId } = await (context as unknown as RouteContext).params;
  const deploymentId = decodeURIComponent(rawId);
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId: parsedToolId, isStandalone } = parseDeploymentId(deploymentId);

  if (!isStandalone) {
    return respond.error('Use /api/tools/[toolId]/state for space tools', 'INVALID_INPUT', { status: 400 });
  }

  const body = await request.json();
  const { state, toolId: bodyToolId } = body;
  const toolId = parsedToolId || bodyToolId;

  if (!toolId) {
    return respond.error('toolId is required', 'INVALID_INPUT', { status: 400 });
  }

  if (!state || typeof state !== 'object') {
    return respond.error('state object is required', 'INVALID_INPUT', { status: 400 });
  }

  const db = dbAdmin;

  // Save shared state (counters, participation, etc.)
  const sharedDocId = getStandaloneStateDocId(toolId, 'shared', userId);
  await db.collection('tool_states').doc(sharedDocId).set(
    {
      toolId,
      deploymentId: 'standalone',
      scope: 'shared',
      state,
      metadata: {
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  // Also save personal state
  const personalDocId = getStandaloneStateDocId(toolId, 'personal', userId);
  await db.collection('tool_states').doc(personalDocId).set(
    {
      toolId,
      deploymentId: 'standalone',
      userId,
      scope: 'personal',
      state,
      metadata: {
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  return respond.success({ savedAt: new Date().toISOString() });
});

// PATCH — partial state update
export const PATCH = withAuthAndErrors(async (request, context, respond) => {
  const { deploymentId: rawId } = await (context as unknown as RouteContext).params;
  const deploymentId = decodeURIComponent(rawId);
  const userId = getUserId(request as AuthenticatedRequest);
  const { toolId: parsedToolId, isStandalone } = parseDeploymentId(deploymentId);

  if (!isStandalone) {
    return respond.error('Use /api/tools/[toolId]/state for space tools', 'INVALID_INPUT', { status: 400 });
  }

  const body = await request.json();
  const { state, toolId: bodyToolId, scope = 'shared' } = body;
  const toolId = parsedToolId || bodyToolId;

  if (!toolId) {
    return respond.error('toolId is required', 'INVALID_INPUT', { status: 400 });
  }

  const db = dbAdmin;
  const docId = getStandaloneStateDocId(toolId, scope, userId);

  // Merge into existing state
  const existingDoc = await db.collection('tool_states').doc(docId).get();
  const existingState = existingDoc.exists ? existingDoc.data()?.state || {} : {};
  const mergedState = { ...existingState, ...state };

  await db.collection('tool_states').doc(docId).set(
    {
      toolId,
      deploymentId: 'standalone',
      ...(scope === 'personal' ? { userId } : {}),
      scope,
      state: mergedState,
      metadata: {
        updatedBy: userId,
        updatedAt: new Date().toISOString(),
        savedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    },
    { merge: true }
  );

  return respond.success({ savedAt: new Date().toISOString() });
});
