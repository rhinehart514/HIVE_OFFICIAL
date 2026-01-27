/**
 * /notifications/settings → Redirect to /settings?section=notifications
 *
 * Notification preferences are now consolidated in the main settings page.
 * This redirect maintains backwards compatibility with any bookmarks or links.
 */

import { redirect } from 'next/navigation';

export default function NotificationSettingsRedirect() {
  redirect('/settings?section=notifications');
}
