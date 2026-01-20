/**
 * Validate Space Invite Code
 *
 * GET /api/spaces/invite/[code]/validate
 *
 * Validates an invite code and returns space preview information.
 * Used by the join page to show space details before joining.
 *
 * @author HIVE Frontend Team
 * @version 1.0.0
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from '@/lib/structured-logger';
import { verifySession } from '@/lib/session';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;

  if (!code) {
    return NextResponse.json(
      { success: false, error: 'Invite code is required' },
      { status: 400 }
    );
  }

  try {
    // Look up invite by code
    const invitesSnapshot = await dbAdmin
      .collection('spaceInvites')
      .where('code', '==', code)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (invitesSnapshot.empty) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired invite code' },
        { status: 404 }
      );
    }

    const inviteDoc = invitesSnapshot.docs[0];
    const inviteData = inviteDoc.data();

    // Check expiration
    if (inviteData.expiresAt) {
      const expiresAt = inviteData.expiresAt.toDate?.() || new Date(inviteData.expiresAt);
      if (expiresAt < new Date()) {
        // Deactivate expired invite
        await inviteDoc.ref.update({ isActive: false });
        return NextResponse.json(
          { success: false, error: 'This invite link has expired' },
          { status: 410 }
        );
      }
    }

    // Check max uses
    if (inviteData.maxUses && inviteData.uses >= inviteData.maxUses) {
      // Deactivate exhausted invite
      await inviteDoc.ref.update({ isActive: false });
      return NextResponse.json(
        { success: false, error: 'This invite link has reached its maximum uses' },
        { status: 410 }
      );
    }

    // Get space details
    const spaceDoc = await dbAdmin.collection('spaces').doc(inviteData.spaceId).get();

    if (!spaceDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Space not found' },
        { status: 404 }
      );
    }

    const spaceData = spaceDoc.data();

    // Check if user is already a member (if authenticated)
    let isAlreadyMember = false;
    const sessionCookie = request.cookies.get('hive_session');
    if (sessionCookie?.value) {
      try {
        const session = await verifySession(sessionCookie.value);
        if (session?.userId) {
          const membershipSnapshot = await dbAdmin
            .collection('spaceMembers')
            .where('spaceId', '==', inviteData.spaceId)
            .where('userId', '==', session.userId)
            .where('isActive', '==', true)
            .limit(1)
            .get();

          isAlreadyMember = !membershipSnapshot.empty;
        }
      } catch {
        // Session invalid, continue as unauthenticated
      }
    }

    logger.info('Invite code validated', {
      code,
      spaceId: inviteData.spaceId,
      endpoint: '/api/spaces/invite/[code]/validate',
    });

    return NextResponse.json({
      success: true,
      space: {
        id: spaceDoc.id,
        name: spaceData?.name || 'Unknown Space',
        description: spaceData?.description,
        avatarUrl: spaceData?.iconUrl || spaceData?.avatarUrl,
        bannerUrl: spaceData?.bannerUrl,
        memberCount: spaceData?.memberCount || 0,
        category: spaceData?.category || 'general',
        isVerified: spaceData?.isVerified || false,
        isPrivate: spaceData?.visibility === 'private',
        isValid: true,
      },
      isAlreadyMember,
    });
  } catch (error) {
    logger.error('Failed to validate invite code', {
      error: error instanceof Error ? error.message : String(error),
      code,
      endpoint: '/api/spaces/invite/[code]/validate',
    });
    return NextResponse.json(
      { success: false, error: 'Failed to validate invite code' },
      { status: 500 }
    );
  }
}
