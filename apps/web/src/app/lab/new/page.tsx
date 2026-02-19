'use client';

/**
 * /lab/new — Conversational Tool Creation
 *
 * The primary creation experience for HiveLab.
 * Students describe what they want, AI builds it.
 *
 * Accepts URL params:
 * - ?prompt=X    Pre-fill and auto-submit the prompt
 * - ?spaceId=X   Space context for generation
 * - ?spaceType=X Space type for context
 * - ?spaceName=X Space name for display
 */

import { Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@hive/auth-logic';
import { BrandSpinner } from '@hive/ui';

import { ConversationalCreator } from '@/components/hivelab/conversational/ConversationalCreator';

function NewToolPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();

  const prompt = searchParams.get('prompt') || undefined;
  const spaceId = searchParams.get('spaceId');
  const spaceType = searchParams.get('spaceType') || undefined;
  const spaceName = searchParams.get('spaceName') || undefined;

  // Build space context if params exist
  const spaceContext = spaceId && spaceName
    ? { spaceId, spaceName, spaceType }
    : undefined;

  // Auth loading
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <BrandSpinner size="md" variant="default" />
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    const returnUrl = `/lab/new${prompt ? `?prompt=${encodeURIComponent(prompt)}` : ''}`;
    router.push(`/enter?redirect=${encodeURIComponent(returnUrl)}`);
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <BrandSpinner size="md" variant="default" />
      </div>
    );
  }

  return (
    <ConversationalCreator
      initialPrompt={prompt}
      spaceContext={spaceContext}
    />
  );
}

export default function NewToolPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black">
          <BrandSpinner size="md" variant="default" />
        </div>
      }
    >
      <NewToolPageInner />
    </Suspense>
  );
}
