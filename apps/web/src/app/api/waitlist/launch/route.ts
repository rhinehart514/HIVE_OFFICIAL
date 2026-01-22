import { NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { db } from '@/lib/firebase-admin';
import { HttpStatus } from '@/lib/api-response-types';

/**
 * POST /api/waitlist/launch
 *
 * Simple email capture for launch notification waitlist.
 * No school required - just email.
 */
export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const waitlistRef = db.collection('launch_waitlist').doc(normalizedEmail);

    const existing = await waitlistRef.get();

    if (existing.exists) {
      // Already on waitlist - still return success
      return NextResponse.json({
        success: true,
        message: "You're already on the list!"
      });
    }

    await waitlistRef.set({
      email: normalizedEmail,
      joinedAt: FieldValue.serverTimestamp(),
      source: 'landing_page',
    });

    return NextResponse.json({
      success: true,
      message: "You're on the list!"
    });
  } catch (error) {
    console.error('Launch waitlist error:', error);
    return NextResponse.json(
      { success: false, error: 'Something went wrong' },
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
