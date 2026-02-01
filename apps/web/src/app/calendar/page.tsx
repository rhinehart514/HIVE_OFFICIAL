import { redirect } from 'next/navigation';

/**
 * /calendar — Legacy Calendar URL Redirect
 *
 * Redirects to the canonical /me/calendar URL.
 *
 * @deprecated Use /me/calendar
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

export default function LegacyCalendarPage() {
  redirect('/me/calendar');
}
