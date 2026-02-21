'use client';

import dynamic from 'next/dynamic';

const StandaloneToolClient = dynamic(
  () => import('./StandaloneToolClient').then(mod => ({ default: mod.StandaloneToolClient })),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="w-full max-w-[480px]">
          <div className="rounded-2xl bg-[#080808] border border-white/[0.06] p-8">
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-40 bg-white/[0.04] rounded-lg" />
              <div className="h-4 w-64 bg-white/[0.03] rounded-lg" />
              <div className="h-px bg-white/[0.06] my-4" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
              <div className="h-11 bg-white/[0.03] rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    ),
  }
);

export function StandaloneToolLoader({ toolId, baseUrl }: { toolId: string; baseUrl: string }) {
  return <StandaloneToolClient toolId={toolId} baseUrl={baseUrl} />;
}
