import { redirect } from 'next/navigation';

/**
 * /settings — Legacy Settings URL Redirect
 *
 * Redirects to the canonical /me/settings URL.
 *
 * @deprecated Use /me/settings
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

export default function LegacySettingsPage() {
  redirect('/me/settings');
}
