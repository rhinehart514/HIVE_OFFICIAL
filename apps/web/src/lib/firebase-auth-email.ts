/**
 * Firebase Auth Email utilities — LEGACY / DEAD CODE
 *
 * This file is NOT used in the actual authentication flow.
 * Real email sending uses:
 *   - OTP codes via /api/auth/send-code (Resend SDK)
 *   - Email service via ./email-service.ts (SendGrid)
 *   - Entry flow: components/entry/EntryFlowV2.tsx → /api/auth/send-code
 *
 * Kept for backward compatibility with email-service.ts which checks
 * isFirebaseEmailAuthEnabled() — always returns false, so this path
 * is never actually invoked.
 *
 * Safe to delete once email-service.ts import is removed.
 */

import { logger } from './logger';

/**
 * Check if Firebase email auth is enabled.
 * Always returns false — real auth uses OTP codes via Resend.
 */
export function isFirebaseEmailAuthEnabled(): boolean {
  return false;
}

interface MagicLinkEmailOptions {
  email: string;
  schoolName?: string;
  redirectUrl?: string;
  actionCodeSettings?: {
    url: string;
    handleCodeInApp: boolean;
  };
}

/**
 * @deprecated Not used. Real emails go through /api/auth/send-code + Resend.
 */
export async function sendFirebaseMagicLinkEmail(
  options: MagicLinkEmailOptions
): Promise<{ success: boolean; error?: string }> {
  logger.warn('sendFirebaseMagicLinkEmail called but this is dead code', {
    component: 'firebase-auth-email',
    email: options.email,
  });
  return {
    success: false,
    error: 'Firebase email auth is not enabled. Use /api/auth/send-code instead.',
  };
}
