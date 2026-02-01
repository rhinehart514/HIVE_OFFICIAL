import { redirect } from 'next/navigation';

/**
 * /profile/connections — Legacy Connections URL Redirect
 *
 * Redirects to the canonical /me/connections URL.
 *
 * @deprecated Use /me/connections
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

export default function LegacyConnectionsPage() {
  redirect('/me/connections');
}
