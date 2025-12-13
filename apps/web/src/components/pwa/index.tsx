'use client';

/**
 * PWA Components
 *
 * Exports all PWA-related components for easy importing.
 */

import { InstallBanner } from './install-banner';
import { UpdateNotification } from './update-notification';
import { PushNotificationPrompt } from './push-prompt';

export { InstallBanner, UpdateNotification, PushNotificationPrompt };

/**
 * PWAManager - Combines all PWA UI components
 *
 * Add this to your providers to enable all PWA features:
 * - Install prompt banner
 * - Update notifications
 * - Push notification prompt
 * - Offline status handling
 */
export function PWAManager() {
  return (
    <>
      <InstallBanner />
      <UpdateNotification />
      <PushNotificationPrompt />
    </>
  );
}
