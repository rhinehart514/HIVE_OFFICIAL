import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { dbAdmin, isFirebaseConfigured } from '@/lib/firebase-admin';
import { logger } from '@/lib/logger';
import { validateOrigin } from '@/lib/security-middleware';
import { ApiResponseHelper, HttpStatus } from '@/lib/api-response-types';
import { enforceRateLimit } from '@/lib/secure-rate-limiter';

const ACCESS_GATE_ENABLED = process.env.NEXT_PUBLIC_ACCESS_GATE_ENABLED === 'true';

const verifyCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d{6}$/, 'Code must be numeric'),
});

/**
 * POST /api/auth/verify-access-code
 * Verify 6-digit access code for gated launch
 */
export async function POST(request: NextRequest) {
  try {
    // If gate is disabled, allow all
    if (!ACCESS_GATE_ENABLED) {
      return NextResponse.json(
        ApiResponseHelper.success({ valid: true }),
        { status: HttpStatus.OK }
      );
    }

    // Origin validation
    if (!validateOrigin(request)) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid request origin', 'FORBIDDEN'),
        { status: HttpStatus.FORBIDDEN }
      );
    }

    // Rate limiting
    const rateLimitResult = await enforceRateLimit('accessCode', request);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        ApiResponseHelper.error(
          rateLimitResult.error || 'Rate limit exceeded',
          'RATE_LIMITED'
        ),
        { status: rateLimitResult.status }
      );
    }

    // Parse and validate request
    const body = await request.json();
    const validation = verifyCodeSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        ApiResponseHelper.error('Invalid code format', 'INVALID_INPUT'),
        { status: HttpStatus.BAD_REQUEST }
      );
    }

    const { code } = validation.data;

    // Check against Firestore access codes
    if (isFirebaseConfigured) {
      const codeDoc = await dbAdmin.collection('access_codes').doc(code).get();

      if (codeDoc.exists) {
        const codeData = codeDoc.data();

        // Check if code is active
        if (codeData?.active === true) {
          // Optional: Track usage
          await dbAdmin
            .collection('access_codes')
            .doc(code)
            .update({
              lastUsed: new Date(),
              useCount: (codeData.useCount || 0) + 1,
            });

          logger.info('Access code verified', {
            code: code.substring(0, 2) + '****',
            uses: (codeData.useCount || 0) + 1,
          });

          return NextResponse.json(
            ApiResponseHelper.success({ valid: true }),
            { status: HttpStatus.OK }
          );
        }

        // Code exists but is inactive
        logger.warn('Access code inactive', {
          code: code.substring(0, 2) + '****',
        });
        return NextResponse.json(
          ApiResponseHelper.error('Invalid code', 'INVALID_CODE'),
          { status: HttpStatus.FORBIDDEN }
        );
      }
    }

    // Code not found
    logger.info('Access code not found', {
      code: code.substring(0, 2) + '****',
    });

    return NextResponse.json(
      ApiResponseHelper.error('Invalid code', 'INVALID_CODE'),
      { status: HttpStatus.FORBIDDEN }
    );
  } catch (error) {
    logger.error('Access code verification failed', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      ApiResponseHelper.error('Internal error', 'INTERNAL_ERROR'),
      { status: HttpStatus.INTERNAL_SERVER_ERROR }
    );
  }
}
