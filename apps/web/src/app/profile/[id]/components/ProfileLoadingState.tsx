/**
 * ProfileLoadingState - Loading skeleton for profile page
 */

import { HiveLogo } from '@hive/ui';

export function ProfileLoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-void)]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <HiveLogo className="w-10 h-10 text-[#FFD700]" />
        </div>
        <p className="text-sm text-[var(--text-muted)]">Loading profile...</p>
      </div>
    </div>
  );
}
