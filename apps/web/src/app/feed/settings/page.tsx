/**
 * /feed/settings → Redirect to /settings?section=account
 *
 * Feed preferences are now consolidated in the main settings page.
 * This redirect maintains backwards compatibility with any bookmarks or links.
 */

import { redirect } from 'next/navigation';

export default function FeedSettingsRedirect() {
  redirect('/settings?section=account');
}
