/**
 * Admin Waitlist Notification API
 *
 * Manual trigger for notifying waitlisted users when a school goes active.
 *
 * GET  /api/admin/schools/[schoolId]/notify-waitlist - Preview waitlist count
 * POST /api/admin/schools/[schoolId]/notify-waitlist - Send notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { validateApiAuth } from '@/lib/api-auth-middleware';
import { logger } from '@/lib/logger';
import { generateSchoolLaunchEmail } from '@/lib/waitlist-email-templates';
import { Resend } from 'resend';
import { withCache } from '../../../../../../lib/cache-headers';

interface RouteContext {
  params: Promise<{ schoolId: string }>;
}

const BATCH_SIZE = 50; // Resend batch limit

/**
 * GET /api/admin/schools/[schoolId]/notify-waitlist
 * Preview waitlist entries for this school
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

    if (!isFirebaseConfigured) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    // Get school info
    const schoolDoc = await dbAdmin.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const schoolData = schoolDoc.data();
    const schoolName = schoolData?.name || schoolId;

    // Query waitlist entries matching this school
    // Match by schoolId OR schoolName (for entries before schoolId was added)
    const waitlistQuery = await dbAdmin
      .collection('school_waitlist')
      .where('notified', '==', false)
      .get();

    // Filter for matching school
    const matchingEntries = waitlistQuery.docs.filter(doc => {
      const data = doc.data();
      return (
        data.schoolId === schoolId ||
        data.schoolName?.toLowerCase() === schoolName.toLowerCase()
      );
    });

    const pendingCount = matchingEntries.length;
    const emails = matchingEntries.map(doc => doc.data().email);

    return NextResponse.json({
      success: true,
      schoolId,
      schoolName,
      schoolStatus: schoolData?.status || 'unknown',
      pendingCount,
      emails: emails.slice(0, 10), // Preview first 10
      hasMore: pendingCount > 10,
    });
  } catch (error) {
    logger.error('Failed to preview waitlist', {
      component: 'admin-notify-waitlist',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to preview waitlist' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/schools/[schoolId]/notify-waitlist
 * Send notification emails to waitlisted users
 */
export async function POST(
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

    if (!isFirebaseConfigured) {
      return NextResponse.json(
        { error: 'Firebase not configured' },
        { status: 500 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      );
    }

    // Get school info
    const schoolDoc = await dbAdmin.collection('schools').doc(schoolId).get();
    if (!schoolDoc.exists) {
      return NextResponse.json(
        { error: 'School not found' },
        { status: 404 }
      );
    }

    const schoolData = schoolDoc.data();
    const schoolName = schoolData?.name || schoolId;

    // Verify school is active before sending
    if (schoolData?.status !== 'active' && schoolData?.status !== 'beta') {
      return NextResponse.json(
        {
          error: 'School must be active before sending notifications',
          currentStatus: schoolData?.status
        },
        { status: 400 }
      );
    }

    // Query waitlist entries
    const waitlistQuery = await dbAdmin
      .collection('school_waitlist')
      .where('notified', '==', false)
      .get();

    // Filter for matching school
    const matchingEntries = waitlistQuery.docs.filter(doc => {
      const data = doc.data();
      return (
        data.schoolId === schoolId ||
        data.schoolName?.toLowerCase() === schoolName.toLowerCase()
      );
    });

    if (matchingEntries.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending waitlist entries for this school',
        sentCount: 0,
      });
    }

    // Initialize Resend
    const resend = new Resend(resendApiKey);
    const fromEmail = process.env.RESEND_FROM_EMAIL || 'hello@hive.college';

    // Process in batches
    let sentCount = 0;
    let failedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < matchingEntries.length; i += BATCH_SIZE) {
      const batch = matchingEntries.slice(i, i + BATCH_SIZE);

      // Send emails in batch
      const emailPromises = batch.map(async (doc) => {
        const data = doc.data();
        const email = data.email;

        try {
          const { subject, html } = generateSchoolLaunchEmail({
            schoolName,
            schoolId,
            recipientEmail: email,
          });

          const result = await resend.emails.send({
            from: `HIVE <${fromEmail}>`,
            to: email,
            subject,
            html,
          });

          if (result.error) {
            throw new Error(result.error.message);
          }

          // Mark as notified
          await doc.ref.update({
            notified: true,
            notifiedAt: new Date().toISOString(),
            notifiedBy: auth.userId,
          });

          return { success: true, email };
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.warn('Failed to send waitlist notification', {
            component: 'admin-notify-waitlist',
            email: email.replace(/(.{3}).*@/, '$1***@'),
            error: errorMsg,
          });
          return { success: false, email, error: errorMsg };
        }
      });

      const results = await Promise.all(emailPromises);

      for (const result of results) {
        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
          if (result.error) {
            errors.push(`${result.email}: ${result.error}`);
          }
        }
      }

      // Small delay between batches to avoid rate limits
      if (i + BATCH_SIZE < matchingEntries.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    logger.info('Waitlist notifications sent', {
      component: 'admin-notify-waitlist',
      schoolId,
      schoolName,
      sentCount,
      failedCount,
      triggeredBy: auth.userId,
    });

    return NextResponse.json({
      success: true,
      schoolId,
      schoolName,
      sentCount,
      failedCount,
      errors: errors.slice(0, 5), // Return first 5 errors
    });
  } catch (error) {
    logger.error('Failed to send waitlist notifications', {
      component: 'admin-notify-waitlist',
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      { error: 'Failed to send notifications' },
      { status: 500 }
    );
  }
}

export const GET = withCache(_GET, 'PRIVATE');
