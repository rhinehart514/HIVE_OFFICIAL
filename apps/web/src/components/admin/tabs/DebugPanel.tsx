'use client';

import { useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import { Copy, Check, Bug } from 'lucide-react';
import { useAuth } from '@hive/auth-logic';
import { useFeatureFlags, FEATURE_FLAGS } from '@/hooks/use-feature-flags';

export function DebugPanel() {
  const { user, session } = useAuth();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { flags, isLoading: flagsLoading } = useFeatureFlags();
  const [copied, setCopied] = useState(false);

  // React Query stats
  const queryCache = queryClient.getQueryCache().getAll();
  const staleCount = queryCache.filter(q => q.isStale()).length;
  const fetchingCount = queryCache.filter(q => q.state.fetchStatus === 'fetching').length;

  // Check for flag overrides in sessionStorage
  let overrides: Record<string, boolean> = {};
  try {
    const raw = sessionStorage.getItem('hive_admin_flag_overrides');
    if (raw) overrides = JSON.parse(raw);
  } catch { /* intentionally empty */ }

  const debugData = {
    session: {
      userId: user?.uid || null,
      email: user?.email || null,
      campusId: user?.campusId || null,
      isAdmin: user?.isAdmin || false,
      handle: user?.handle || null,
      expiresAt: session?.expiresAt ? new Date(session.expiresAt).toISOString() : null,
      canRefresh: session?.canRefresh || false,
    },
    route: {
      pathname,
      searchParams: Object.fromEntries(searchParams.entries()),
    },
    flags: {
      values: flags,
      overrides,
      loading: flagsLoading,
    },
    queryCache: {
      total: queryCache.length,
      stale: staleCount,
      fetching: fetchingCount,
    },
    timestamp: new Date().toISOString(),
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Session */}
      <Section label="Session">
        <Row label="User ID" value={user?.uid} mono />
        <Row label="Email" value={user?.email} />
        <Row label="Campus" value={user?.campusId} mono />
        <Row label="Handle" value={user?.handle ? `@${user.handle}` : null} />
        <Row label="Admin" value={user?.isAdmin ? 'Yes' : 'No'} />
        <Row
          label="Expires"
          value={session?.expiresAt ? new Date(session.expiresAt).toLocaleTimeString() : 'Unknown'}
        />
      </Section>

      {/* Route */}
      <Section label="Route">
        <Row label="Path" value={pathname} mono />
        {searchParams.toString() && (
          <Row label="Params" value={searchParams.toString()} mono />
        )}
      </Section>

      {/* Feature Flags */}
      <Section label="Feature Flags">
        {flagsLoading ? (
          <p className="text-[11px] text-white/30">Loading...</p>
        ) : (
          Object.values(FEATURE_FLAGS).map(flagId => {
            const serverValue = flags[flagId] === true;
            const hasOverride = flagId in overrides;
            const effectiveValue = hasOverride ? overrides[flagId] : serverValue;

            return (
              <div key={flagId} className="flex items-center justify-between py-0.5">
                <span className="text-[11px] text-white/60 font-mono">{flagId}</span>
                <div className="flex items-center gap-1.5">
                  {hasOverride && (
                    <span className="text-[9px] text-blue-400 font-medium uppercase">override</span>
                  )}
                  <span
                    className={`text-[11px] font-medium ${
                      effectiveValue ? 'text-emerald-400' : 'text-white/30'
                    }`}
                  >
                    {effectiveValue ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </Section>

      {/* Query Cache */}
      <Section label="React Query">
        <Row label="Total" value={String(queryCache.length)} />
        <Row label="Stale" value={String(staleCount)} />
        <Row label="Fetching" value={String(fetchingCount)} />
      </Section>

      {/* Copy */}
      <button
        onClick={handleCopy}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 border border-white/10 rounded-lg text-[12px] text-white/60 font-medium transition-colors"
      >
        {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
        {copied ? 'Copied!' : 'Copy Debug JSON'}
      </button>
    </div>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white/50 text-[11px] font-medium uppercase tracking-wider mb-2">
        <Bug size={10} />
        {label}
      </div>
      <div className="space-y-1 pl-0.5">{children}</div>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[11px] text-white/40">{label}</span>
      <span
        className={`text-[11px] text-white/70 max-w-[200px] truncate ${mono ? 'font-mono' : ''}`}
        title={value || undefined}
      >
        {value || '—'}
      </span>
    </div>
  );
}
