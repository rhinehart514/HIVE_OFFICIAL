import { redirect } from 'next/navigation';

/**
 * Legacy settings page - redirects to unified /settings
 * This page is deprecated in favor of the consolidated settings experience.
 */
export default function ProfileSettingsPage() {
  redirect('/settings');
}
