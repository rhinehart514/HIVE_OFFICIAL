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

    // Fetch residential spaces for housing picker (on-campus + off-campus)
    const [onCampusSnap, offCampusSnap] = await Promise.all([
      dbAdmin.collection('spaces').where('campusId', '==', campusId).where('identityType', '==', 'residential').get(),
      dbAdmin.collection('spaces').where('campusId', '==', campusId).where('identityType', '==', 'residential-offcampus').get(),
    ]);

    const toOption = (d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, name: d.data().name });
    const residentialSpaces = onCampusSnap.docs.map(toOption).sort((a, b) => a.name.localeCompare(b.name));
    const offCampusSpaces = offCampusSnap.docs.map(toOption).sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({
      interests: data.interests || [],
      majors: data.majors || [],
      graduatePrograms: data.graduatePrograms || [],
      residentialSpaces,
      offCampusSpaces,
    });
  } catch {
    return NextResponse.json({ interests: [], majors: [], gradPrograms: [] });
  }
}, 'LONG');
