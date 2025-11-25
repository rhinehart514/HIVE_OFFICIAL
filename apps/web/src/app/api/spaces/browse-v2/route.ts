/**
 * Spaces Browse API Route V2
 * Uses CQRS pattern for space discovery
 */

import { type NextRequest, NextResponse } from 'next/server';
import { FirebaseUnitOfWork } from '@hive/core';
import { withAuthAndErrors } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';

export const GET = withAuthAndErrors(async (request: NextRequest, context) => {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || 'all';
    const sort = searchParams.get('sort') || 'trending';
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const userId = context.userId;
    // Derive campusId from profile when available; fall back to default
    const unitOfWork = new FirebaseUnitOfWork();
    let campusId = 'ub-buffalo';
    try {
      const profileResult = await unitOfWork.profiles.findById(userId);
      if (profileResult?.isSuccess) {
        const profile = profileResult.getValue() as Record<string, unknown> & { campusId?: string };
        campusId = profile?.campusId || campusId;
      }
    } catch {
      // ignore profile lookup failures; keep default campusId
    }

    logger.info('Browse spaces request', {
      category,
      sort,
      limit,
      userId,
      campusId,
      endpoint: '/api/spaces/browse-v2'
    });

    // Get spaces using repository

    let spacesResult;
    if (sort === 'trending') {
      spacesResult = await unitOfWork.spaces.findTrending(campusId, limit);
    } else if (sort === 'recommended') {
      // Get user profile for interests
      const profileResult = await unitOfWork.profiles.findById(userId);
      const profile = profileResult.isSuccess ?
        profileResult.getValue() as Record<string, unknown> & { interests?: Array<string>; major?: string } :
        null;
      const interests = profile?.interests || [];
      const major = profile?.major;

      spacesResult = await unitOfWork.spaces.findRecommended(campusId, interests, major);
    } else if (category !== 'all') {
      spacesResult = await unitOfWork.spaces.findByCategory(category, campusId);
    } else {
      spacesResult = await unitOfWork.spaces.findByCampus(campusId, limit);
    }

    if (spacesResult.isFailure) {
      logger.error(
      `Failed to browse spaces at /api/spaces/browse-v2`,
      spacesResult.error
    );

      return NextResponse.json(
        { error: 'Failed to load spaces' },
        { status: 500 }
      );
    }

    const spaces = spacesResult.getValue();

    // Get user's joined spaces to mark them
    const userSpacesResult = await unitOfWork.spaces.findUserSpaces(userId);
    const userSpaceIds = userSpacesResult.isSuccess
      ? (userSpacesResult.getValue() as Array<Record<string, unknown> & { id?: { id?: string } | string }>).map((s) => {
          if (typeof s.id === 'object' && s.id !== null && 'id' in s.id) {
            return (s.id as { id?: string }).id ?? '';
          }
          return typeof s.id === 'string' ? s.id : '';
        })
      : [];

    // Transform spaces for API response
    type SpaceData = Record<string, unknown> & {
      id?: { id?: string } | string;
      name?: { name?: string } | string;
      description?: { value?: string } | string;
      category?: { value?: string } | string;
      memberCount?: number;
      postCount?: number;
      isVerified?: boolean;
      visibility?: string;
      trendingScore?: number;
      createdAt?: string;
      lastActivityAt?: string;
      tabs?: Array<Record<string, unknown> & { id?: { id?: string } | string; title?: string; messageCount?: number; isArchived?: boolean }>;
      widgets?: Array<Record<string, unknown> & { isEnabled?: boolean; type?: string; config?: unknown }>;
    };

    const transformedSpaces = (spaces as SpaceData[]).map((space) => {
      const spaceId = typeof space.id === 'object' && space.id !== null && 'id' in space.id
        ? (space.id as { id?: string }).id ?? ''
        : typeof space.id === 'string' ? space.id : '';

      return {
        id: spaceId,
        name: typeof space.name === 'object' && space.name !== null && 'name' in space.name
          ? (space.name as { name?: string }).name ?? ''
          : typeof space.name === 'string' ? space.name : '',
        description: typeof space.description === 'object' && space.description !== null && 'value' in space.description
          ? (space.description as { value?: string }).value ?? ''
          : typeof space.description === 'string' ? space.description : '',
        category: typeof space.category === 'object' && space.category !== null && 'value' in space.category
          ? (space.category as { value?: string }).value ?? ''
          : typeof space.category === 'string' ? space.category : '',
        memberCount: space.memberCount,
        postCount: space.postCount,
        isVerified: space.isVerified,
        isJoined: userSpaceIds.includes(spaceId),
        visibility: space.visibility,
        trendingScore: space.trendingScore,
        createdAt: space.createdAt,
        lastActivityAt: space.lastActivityAt,
        tabs: (space.tabs || []).map((tab) => {
          const tabId = typeof tab.id === 'object' && tab.id !== null && 'id' in tab.id
            ? (tab.id as { id?: string }).id ?? ''
            : typeof tab.id === 'string' ? tab.id : '';

          return {
            id: tabId,
            title: tab.title,
            messageCount: tab.messageCount,
            isActive: !tab.isArchived
          };
        }),
        widgets: (space.widgets || [])
          .filter((w) => w.isEnabled)
          .map((widget) => ({
            type: widget.type,
            config: widget.config
          }))
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        spaces: transformedSpaces,
        totalCount: transformedSpaces.length,
        hasMore: transformedSpaces.length === limit
      }
    });
  } catch (error) {
    logger.error('Browse spaces error', {
      error,
      endpoint: '/api/spaces/browse-v2'
    });

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
