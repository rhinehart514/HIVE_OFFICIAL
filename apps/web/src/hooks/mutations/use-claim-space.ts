'use client';

/**
 * useClaimSpace - Mutation hook for claiming unclaimed spaces
 *
 * Wires POST /api/spaces/claim to submit claim requests for unclaimed spaces.
 * Used by leaders to claim pre-seeded spaces for their organizations.
 *
 * @version 1.0.0 - Phase 1 Wiring (Feb 2026)
 */

import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export type ProofType = 'email' | 'document' | 'social' | 'referral' | 'none';

interface ClaimSpaceParams {
  spaceId: string;
  role: string;
  proofType?: ProofType;
  proofUrl?: string;
}

interface ClaimSpaceResponse {
  success: boolean;
  message: string;
  data?: {
    spaceId: string;
    claimStatus: 'pending' | 'approved';
  };
}

async function claimSpace(params: ClaimSpaceParams): Promise<ClaimSpaceResponse> {
  const response = await fetch('/api/spaces/claim', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || 'Failed to claim space');
  }

  return response.json();
}

export function useClaimSpace() {
  const { toast } = useToast();
  const router = useRouter();

  return useMutation({
    mutationFn: claimSpace,
    onSuccess: (data) => {
      if (data.data?.claimStatus === 'approved') {
        toast.success('Space claimed!', 'You now have leader access');
        // Redirect to the space to see leader view
        if (data.data?.spaceId) {
          router.refresh(); // Refresh to update auth state
        }
      } else {
        toast.success('Claim submitted', 'You have provisional access while we verify');
      }
    },
    onError: (error: Error) => {
      if (error.message.includes('already been claimed')) {
        toast.error('Space unavailable', 'This space has already been claimed by another leader');
      } else {
        toast.error('Claim failed', error.message || 'Please try again');
      }
    },
  });
}
