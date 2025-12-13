import { NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { currentEnvironment } from '@/lib/env';
import { logger } from '@/lib/logger';

/**
 * Development-only endpoint to seed the ub-buffalo school
 * POST /api/admin/seed-school
 */
export async function POST() {
  // Only allow in development
  if (currentEnvironment === 'production') {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  try {
    const schoolData = {
      id: 'ub-buffalo',
      name: 'University at Buffalo',
      domain: 'buffalo.edu',
      active: true,
      campusId: 'ub-buffalo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        allowedEmailDomains: ['buffalo.edu'],
        features: {
          spaces: true,
          rituals: true,
          hiveLab: true
        }
      }
    };

    await dbAdmin.collection('schools').doc('ub-buffalo').set(schoolData, { merge: true });

    return NextResponse.json({
      success: true,
      message: 'School ub-buffalo created successfully',
      data: schoolData
    });
  } catch (error) {
    logger.error('Failed to seed school', {}, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: 'Failed to seed school', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check if school exists
 */
export async function GET() {
  try {
    const schoolDoc = await dbAdmin.collection('schools').doc('ub-buffalo').get();

    if (schoolDoc.exists) {
      return NextResponse.json({
        exists: true,
        data: schoolDoc.data()
      });
    }

    return NextResponse.json({
      exists: false,
      message: 'School ub-buffalo does not exist. POST to this endpoint to create it.'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check school', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
