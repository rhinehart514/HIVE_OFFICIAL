import { NextRequest, NextResponse } from 'next/server';
import { authenticationLayer } from '@/lib/middleware-utils';
import { getFirestore } from '@hive/firebase/server';

/**
 * POST /api/spaces/request
 *
 * Request a new space that doesn't exist yet.
 * Creates a space request record for admins to review.
 */
export async function POST(request: NextRequest) {
  // Authenticate user
  const authResult = await authenticationLayer(request);
  if (!authResult.authenticated || !authResult.userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { requestedName, message } = body;

    if (!requestedName) {
      return NextResponse.json(
        { error: 'Space name is required' },
        { status: 400 }
      );
    }

    const db = getFirestore();

    // Create space request
    const requestRef = await db.collection('spaceRequests').add({
      requestedName: requestedName.trim(),
      message: message || '',
      requestedBy: authResult.userId,
      requestedAt: new Date().toISOString(),
      status: 'pending', // pending, approved, rejected
      campusId: authResult.campusId || 'default',
    });

    return NextResponse.json({
      success: true,
      requestId: requestRef.id,
    });
  } catch (error) {
    console.error('Error creating space request:', error);
    return NextResponse.json(
      { error: 'Failed to create space request' },
      { status: 500 }
    );
  }
}
