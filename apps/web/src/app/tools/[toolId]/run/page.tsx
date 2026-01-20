"use client";

/**
 * Tool Run Page - Redirects to Unified Tool Page
 *
 * This page is deprecated. The IDE and Runtime are now unified on the main tool page.
 * This redirect ensures old links continue to work.
 *
 * Old: /tools/[toolId]/run
 * New: /tools/[toolId]?mode=use
 */

import { useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";

export default function ToolRunRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const toolId = params.toolId as string;
  const spaceId = searchParams.get('spaceId');
  const deploymentId = searchParams.get('deploymentId');
  const isPreview = searchParams.get('preview') === 'true';

  useEffect(() => {
    // Build redirect URL with mode=use
    const redirectUrl = new URL(`/tools/${toolId}`, window.location.origin);
    redirectUrl.searchParams.set('mode', 'use');

    // Preserve relevant query params
    if (spaceId) {
      redirectUrl.searchParams.set('spaceId', spaceId);
    }
    if (deploymentId) {
      redirectUrl.searchParams.set('deploymentId', deploymentId);
    }
    if (isPreview) {
      redirectUrl.searchParams.set('preview', 'true');
    }

    // Use replace to avoid adding to browser history
    router.replace(redirectUrl.pathname + redirectUrl.search);
  }, [toolId, spaceId, deploymentId, isPreview, router]);

  // Show minimal loading state while redirecting
  return (
    <div className="min-h-screen bg-[var(--hivelab-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-[var(--hivelab-text-secondary)] text-sm">Redirecting...</p>
      </div>
    </div>
  );
}
