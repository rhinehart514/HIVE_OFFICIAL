/**
 * Admin Schools API
 * CRUD operations for managing school configurations
 *
 * GET  /api/admin/schools - List all schools
 * POST /api/admin/schools - Create new school
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin } from '@/lib/firebase-admin';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { clearDomainCache } from '@/lib/campus-context';
import { withCache } from '../../../../lib/cache-headers';

// Validation schema for creating a school
const createSchoolSchema = z.object({
  id: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/, 'ID must be lowercase alphanumeric with hyphens'),
  name: z.string().min(1).max(100),
  shortName: z.string().min(1).max(20).optional(),
  domain: z.string().min(3).max(100), // Primary domain
  emailDomains: z.object({
    student: z.array(z.string()).min(1),
    faculty: z.array(z.string()).optional().default([]),
    staff: z.array(z.string()).optional().default([]),
    alumni: z.array(z.string()).optional().default([]),
  }),
  location: z.object({
    city: z.string(),
    state: z.string(),
    country: z.string().default('USA'),
  }),
  eventSources: z.array(z.object({
    type: z.enum(['campuslabs', 'presence', 'generic_rss', 'atom']),
    url: z.string().url(),
    enabled: z.boolean().default(true),
    syncFrequency: z.enum(['daily', 'weekly']).default('weekly'),
    hostMatchField: z.string().optional(),
  })).optional().default([]),
  status: z.enum(['waitlist', 'beta', 'active', 'suspended']).default('waitlist'),
  brandColors: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
  maxUsers: z.number().positive().optional(),
  welcomeMessage: z.string().max(500).optional(),
});

/**
 * GET /api/admin/schools
 * List all schools with full configuration
 */
async function _GET(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await validateApiAuth(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const schoolsSnapshot = await dbAdmin.collection('schools').get();
    const schools = schoolsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({
      success: true,
      schools,
      count: schools.length,
    });
  } catch (error) {
    logger.error('Failed to list schools', {
      component: 'admin-schools',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to list schools' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/schools
 * Create a new school configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Require admin authentication
    const auth = await validateApiAuth(request);
    if (!auth.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const parsed = createSchoolSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid school data', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if school already exists
    const existingDoc = await dbAdmin.collection('schools').doc(data.id).get();
    if (existingDoc.exists) {
      return NextResponse.json(
        { error: 'School with this ID already exists' },
        { status: 409 }
      );
    }

    // Check for domain conflicts
    const allSchools = await dbAdmin.collection('schools').get();
    const existingDomains = new Set<string>();
    allSchools.docs.forEach(doc => {
      const school = doc.data();
      if (school.domain) existingDomains.add(school.domain);
      const emailDomains = school.emailDomains || {};
      [...(emailDomains.student || []), ...(emailDomains.faculty || []),
       ...(emailDomains.staff || []), ...(emailDomains.alumni || [])]
        .forEach(d => existingDomains.add(d));
    });

    const newDomains = [data.domain, ...data.emailDomains.student,
      ...(data.emailDomains.faculty || []), ...(data.emailDomains.staff || []),
      ...(data.emailDomains.alumni || [])];

    const conflictingDomains = newDomains.filter(d => existingDomains.has(d));
    if (conflictingDomains.length > 0) {
      return NextResponse.json(
        { error: `Domain(s) already in use: ${conflictingDomains.join(', ')}` },
        { status: 409 }
      );
    }

    // Create school document
    const now = new Date();
    const schoolData = {
      ...data,
      campusId: data.id, // campusId matches document ID
      isActive: data.status === 'active', // Backwards compatibility
      stats: {
        studentCount: 0,
        facultyCount: 0,
      },
      createdAt: now,
      updatedAt: now,
      createdBy: auth.userId,
    };

    await dbAdmin.collection('schools').doc(data.id).set(schoolData);

    // Clear domain cache so new school is recognized
    clearDomainCache();

    logger.info('School created', {
      component: 'admin-schools',
      schoolId: data.id,
      createdBy: auth.userId,
    });

    return NextResponse.json({
      success: true,
      school: schoolData,
    }, { status: 201 });
  } catch (error) {
    logger.error('Failed to create school', {
      component: 'admin-schools',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to create school' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'PRIVATE');
