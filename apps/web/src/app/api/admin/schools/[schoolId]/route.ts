/**
 * Admin School Detail API
 * Individual school management operations
 *
 * GET    /api/admin/schools/[schoolId] - Get school details
 * PATCH  /api/admin/schools/[schoolId] - Update school
 * DELETE /api/admin/schools/[schoolId] - Delete school (soft)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { clearDomainCache } from '@/lib/campus-context';
import { withCache } from '../../../../../lib/cache-headers';

// Validation schema for updating a school
const updateSchoolSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  shortName: z.string().min(1).max(20).optional(),
  emailDomains: z.object({
    student: z.array(z.string()),
    faculty: z.array(z.string()).optional(),
    staff: z.array(z.string()).optional(),
    alumni: z.array(z.string()).optional(),
  }).optional(),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string(),
  }).optional(),
  eventSources: z.array(z.object({
    type: z.enum(['campuslabs', 'presence', 'generic_rss', 'atom']),
    url: z.string().url(),
    enabled: z.boolean(),
    syncFrequency: z.enum(['daily', 'weekly']),
    hostMatchField: z.string().optional(),
    lastSyncAt: z.any().optional(),
  })).optional(),
  status: z.enum(['waitlist', 'beta', 'active', 'suspended']).optional(),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  maxUsers: z.number().positive().optional(),
  welcomeMessage: z.string().max(500).optional(),
});

interface RouteContext {
  params: Promise<{ schoolId: string }>;
}

/**
 * GET /api/admin/schools/[schoolId]
 * Get school details
 */
async function _GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { schoolId } = await context.params;

    // Require admin authentication
    const auth = await validateApiAuth(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const schoolDoc = await dbAdmin.collection('schools').doc(schoolId).get();

    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      school: {
        id: schoolDoc.id,
        ...schoolDoc.data(),
      },
    });
  } catch (error) {
    logger.error('Failed to get school', {
      component: 'admin-schools',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to get school' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/schools/[schoolId]
 * Update school configuration
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { schoolId } = await context.params;

    // Require admin authentication
    const auth = await validateApiAuth(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const schoolRef = dbAdmin.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();

    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const parsed = updateSchoolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid update data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updates = {
      ...parsed.data,
      isActive: parsed.data.status === 'active', // Backwards compatibility
      updatedAt: new Date(),
      updatedBy: auth.userId,
    };

    await schoolRef.update(updates);

    // Clear domain cache so changes are recognized
    clearDomainCache();

    logger.info('School updated', {
      component: 'admin-schools',
      schoolId,
      updatedBy: auth.userId,
      fields: Object.keys(parsed.data),
    });

    const updatedDoc = await schoolRef.get();

    return NextResponse.json({
      success: true,
      school: {
        id: updatedDoc.id,
        ...updatedDoc.data(),
      },
    });
  } catch (error) {
    logger.error('Failed to update school', {
      component: 'admin-schools',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to update school' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/schools/[schoolId]
 * Soft delete school (sets status to suspended)
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { schoolId } = await context.params;

    // Require admin authentication
    const auth = await validateApiAuth(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Prevent deletion of UB
    if (schoolId === 'ub-buffalo') {
      return NextResponse.json(
        { error: 'Cannot delete primary school' },
        { status: 403 }
      );
    }

    const schoolRef = dbAdmin.collection('schools').doc(schoolId);
    const schoolDoc = await schoolRef.get();

    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    // Soft delete - set status to suspended
    await schoolRef.update({
      status: 'suspended',
      isActive: false,
      suspendedAt: new Date(),
      suspendedBy: auth.userId,
      updatedAt: new Date(),
    });

    // Clear domain cache
    clearDomainCache();

    logger.info('School suspended', {
      component: 'admin-schools',
      schoolId,
      suspendedBy: auth.userId,
    });

    return NextResponse.json({
      success: true,
      message: 'School suspended',
    });
  } catch (error) {
    logger.error('Failed to delete school', {
      component: 'admin-schools',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to delete school' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'PRIVATE');
