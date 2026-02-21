import { type NextRequest, NextResponse } from 'next/server';
import { dbAdmin } from '@/lib/firebase-admin';
import { logger } from "@/lib/logger";
import { ApiResponseHelper, HttpStatus, ErrorCodes as _ErrorCodes } from "@/lib/api-response-types";
import { getDefaultCampusId } from '@/lib/campus-context';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const { feedback, timestamp } = await request.json();

    if (!feedback || typeof feedback !== 'string' || feedback.trim().length === 0) {
      return NextResponse.json(ApiResponseHelper.error("Feedback content is required", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    if (feedback.length > 500) {
      return NextResponse.json(ApiResponseHelper.error("Feedback too long (max 500 characters)", "INVALID_INPUT"), { status: HttpStatus.BAD_REQUEST });
    }

    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const feedbackData = {
      feedback: feedback.trim(),
      campusId: getDefaultCampusId(),
      ip,
      userAgent,
      submittedAt: timestamp || new Date().toISOString(),
      createdAt: FieldValue.serverTimestamp(),
    };

    const docRef = await dbAdmin.collection('feedback').add(feedbackData);

    logger.info('Feedback persisted', { feedbackId: docRef.id });

    return NextResponse.json({
      success: true,
      message: 'Feedback received successfully',
      id: docRef.id,
    });

  } catch (error) {
    logger.error(
      'Feedback submission error',
      { error: error instanceof Error ? error.message : String(error) }
    );

    return NextResponse.json(ApiResponseHelper.error("Failed to submit feedback", "INTERNAL_ERROR"), { status: HttpStatus.INTERNAL_SERVER_ERROR });
  }
}
