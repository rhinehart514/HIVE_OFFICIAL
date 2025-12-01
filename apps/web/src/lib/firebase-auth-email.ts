// Firebase Auth Email utilities
// Stub implementation for magic link email functionality

/**
 * Check if Firebase email auth is enabled
 */
export function isFirebaseEmailAuthEnabled(): boolean {
  return false; // Disabled by default, enable when Firebase email is configured
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
 * Send a magic link email for passwordless authentication
 */
export async function sendFirebaseMagicLinkEmail(
  options: MagicLinkEmailOptions
): Promise<{ success: boolean; error?: string }> {
  if (!isFirebaseEmailAuthEnabled()) {
    return {
      success: false,
      error: 'Firebase email authentication is not enabled',
    };
  }

  try {
    // TODO: Implement actual Firebase email sending
    // eslint-disable-next-line no-console
    console.log(`[Firebase Auth] Would send magic link to: ${options.email}`);
    return { success: true };
  } catch (error) {
    console.error('[Firebase Auth] Error sending magic link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to send email',
    };
  }
}
