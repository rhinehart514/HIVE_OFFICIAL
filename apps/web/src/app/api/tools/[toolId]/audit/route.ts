/**
 * Tool Audit Log API
 *
 * Sprint 5: Audit Trail
 *
 * GET /api/tools/:toolId/audit - Fetch audit log for a tool
 *
 * Tracks:
 * - Tool edits (who, when, what changed)
 * - Automation runs (trigger, status, actions)
 * - Connection changes (added, removed, modified)
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';
import { getCurrentUser } from '@/lib/auth-server';
import { checkSpacePermission } from '@/lib/space-permission-middleware';
import { logger } from '@/lib/structured-logger';
import type {
  AuditEntry,
  AuditLogQuery,
  AuditLogResponse,
  AuditEventType,
} from '@hive/core';
import {
  AUDIT_COLLECTION,
} from '@hive/core';
import { withCache } from '../../../../../lib/cache-headers';

// ============================================================================
// GET - Fetch audit log
// ============================================================================

async function _GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const user = await getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get tool deployment to check permissions
    const toolDoc = await db.collection('deployedTools').doc(toolId).get();
    if (!toolDoc.exists) {
      return NextResponse.json(
        { error: 'Tool not found' },
        { status: 404 }
      );
    }

    const tool = toolDoc.data();
    const spaceId = tool?.spaceId;

    // Check if user is a space officer (only officers can view audit logs)
    if (spaceId) {
      const permResult = await checkSpacePermission(spaceId, user.uid, 'admin');
      if (!permResult.hasPermission) {
        return NextResponse.json(
          { error: 'Only space officers can view audit logs' },
          { status: 403 }
        );
      }
    } else {
      // Personal tool - must be owner
      if (tool?.createdBy !== user.uid) {
        return NextResponse.json(
          { error: 'Only the tool owner can view audit logs' },
          { status: 403 }
        );
      }
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const query: AuditLogQuery = {
      types: searchParams.get('types')?.split(',') as AuditEventType[] | undefined,
      actorId: searchParams.get('actorId') || undefined,
      startDate: searchParams.get('startDate') || undefined,
      endDate: searchParams.get('endDate') || undefined,
      limit: parseInt(searchParams.get('limit') || '50', 10),
      cursor: searchParams.get('cursor') || undefined,
    };

    // Build Firestore query
    let auditQuery = db
      .collection('deployedTools')
      .doc(toolId)
      .collection(AUDIT_COLLECTION)
      .orderBy('timestamp', 'desc')
      .limit(query.limit || 50);

    // Apply filters
    if (query.types && query.types.length > 0) {
      auditQuery = auditQuery.where('type', 'in', query.types);
    }

    if (query.actorId) {
      auditQuery = auditQuery.where('actor.userId', '==', query.actorId);
    }

    if (query.startDate) {
      auditQuery = auditQuery.where('timestamp', '>=', query.startDate);
    }

    if (query.endDate) {
      auditQuery = auditQuery.where('timestamp', '<=', query.endDate);
    }

    // Apply cursor for pagination
    if (query.cursor) {
      const cursorDoc = await db
        .collection('deployedTools')
        .doc(toolId)
        .collection(AUDIT_COLLECTION)
        .doc(query.cursor)
        .get();
      if (cursorDoc.exists) {
        auditQuery = auditQuery.startAfter(cursorDoc);
      }
    }

    // Execute query
    const snapshot = await auditQuery.get();

    const entries: AuditEntry[] = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AuditEntry[];

    // Determine if there are more results
    const hasMore = entries.length === (query.limit || 50);
    const nextCursor = hasMore && entries.length > 0
      ? entries[entries.length - 1].id
      : undefined;

    const response: AuditLogResponse = {
      entries,
      hasMore,
      nextCursor,
    };

    logger.info('Audit log fetched', {
      toolId,
      userId: user.uid,
      entryCount: entries.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error('Failed to fetch audit log', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to fetch audit log' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET /summary - Fetch audit summary (different endpoint but same file)
// This would typically be a separate route but for simplicity we handle
// it via query param
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const user = await getCurrentUser(request);
    const body = await request.json();

    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // POST is used to create audit entries (internal use)
    // Verify this is a server-to-server call with admin secret
    const adminSecret = request.headers.get('X-Admin-Secret');
    if (adminSecret !== process.env.ADMIN_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const entry = body as Partial<AuditEntry>;

    if (!entry.type || !entry.description || !entry.actor) {
      return NextResponse.json(
        { error: 'Missing required fields: type, description, actor' },
        { status: 400 }
      );
    }

    // Create audit entry
    const auditEntry: AuditEntry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      deploymentId: toolId,
      type: entry.type,
      description: entry.description,
      actor: entry.actor,
      changes: entry.changes,
      metadata: entry.metadata,
      timestamp: new Date().toISOString(),
      ipAddress: request.headers.get('x-forwarded-for') || undefined,
      userAgent: request.headers.get('user-agent') || undefined,
    };

    // Write to Firestore
    await db
      .collection('deployedTools')
      .doc(toolId)
      .collection(AUDIT_COLLECTION)
      .doc(auditEntry.id)
      .set(auditEntry);

    logger.info('Audit entry created', {
      toolId,
      entryId: auditEntry.id,
      type: entry.type,
    });

    return NextResponse.json({ success: true, id: auditEntry.id });
  } catch (error) {
    logger.error('Failed to create audit entry', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to create audit entry' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'SHORT');
