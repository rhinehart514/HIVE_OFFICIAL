'use client';

import { useAdminToolbarSafe } from './AdminToolbarProvider';
import { X, Eye } from 'lucide-react';

export function ImpersonationBanner() {
  const ctx = useAdminToolbarSafe();

  if (!ctx?.impersonation) return null;

  const { impersonation, endImpersonation } = ctx;

  const handleEnd = async () => {
    try {
      await fetch('/api/admin/toolbar/impersonate', {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: impersonation.sessionId }),
      });
    } catch {
      // still end locally
    }
    endImpersonation();
  };

  return (
    <div className="sticky top-0 z-40 h-10 bg-red-500/90 flex items-center justify-center gap-3 px-4 text-white text-sm font-medium">
      <Eye size={14} />
      <span>
        Viewing as {impersonation.profile.displayName || 'Unknown'}
        {impersonation.profile.handle && ` (@${impersonation.profile.handle})`}
        {' — READ ONLY'}
      </span>
      <button
        onClick={handleEnd}
        className="ml-2 px-2 py-0.5 bg-white/[0.06] hover:bg-white/50 rounded text-xs font-semibold transition-colors flex items-center gap-1"
      >
        <X size={12} />
        Exit
      </button>
    </div>
  );
}
