import { redirect } from 'next/navigation';

/**
 * /notifications — Legacy Notifications URL Redirect
 *
 * Redirects to the canonical /me/notifications URL.
 *
 * @deprecated Use /me/notifications
 * @version 2.0.0 - IA Unification (Jan 2026)
 */

export default function LegacyNotificationsPage() {
  redirect('/me/notifications');
}
