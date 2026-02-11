/**
 * GET /api/campus/catalogs
 *
 * Returns interest categories and majors for a campus.
 * Used by onboarding interest picker.
 * Public endpoint — no auth required (catalog data is not sensitive).
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { withCache } from '@/lib/cache-headers';

export const GET = withCache(async (request: NextRequest) => {
  if (!isFirebaseConfigured) {
    return NextResponse.json({ interests: [], majors: [], gradPrograms: [] });
  }

  const { searchParams } = new URL(request.url);
  const campusId = searchParams.get('campusId') || 'ub-buffalo';

  try {
    // Try campus-specific first, fall back to default
    let doc = await dbAdmin.collection('campusCatalogs').doc(campusId).get();
    if (!doc.exists) {
      doc = await dbAdmin.collection('campusCatalogs').doc('default').get();
    }

    if (!doc.exists) {
      return NextResponse.json({ interests: [], majors: [], gradPrograms: [] });
    }

    const data = doc.data()!;
    return NextResponse.json({
      interests: data.interests || [],
      majors: data.majors || [],
      graduatePrograms: data.graduatePrograms || [],
    });
  } catch {
    return NextResponse.json({ interests: [], majors: [], gradPrograms: [] });
  }
}, 'LONG');
