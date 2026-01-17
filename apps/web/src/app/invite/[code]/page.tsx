/**
 * /invite/[code] — Universal Invite Code Handler
 *
 * Archetype: Focus Flow
 * Purpose: Handle invite codes for any entity (spaces, events, etc.)
 * Shell: OFF
 *
 * Per HIVE App Map v1:
 * - Canonical route for invite redemption
 * - Determines invite type and redirects appropriately
 * - Falls back to space join for backwards compatibility
 */

import { redirect, notFound } from 'next/navigation';
import { headers } from 'next/headers';

interface InviteData {
  type: 'space' | 'event' | 'tool';
  targetId: string;
  isValid: boolean;
}

async function resolveInviteCode(code: string): Promise<InviteData | null> {
  try {
    // Get the host from headers to build absolute URL
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

    const res = await fetch(`${protocol}://${host}/api/invites/${code}`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      // If invite doesn't exist in new system, assume it's a space invite
      // for backwards compatibility
      return {
        type: 'space',
        targetId: code,
        isValid: true,
      };
    }

    return res.json();
  } catch {
    // Fallback to space invite for backwards compatibility
    return {
      type: 'space',
      targetId: code,
      isValid: true,
    };
  }
}

export default async function InviteCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  if (!code) {
    notFound();
  }

  const invite = await resolveInviteCode(code);

  if (!invite || !invite.isValid) {
    notFound();
  }

  // Redirect based on invite type
  switch (invite.type) {
    case 'space':
      redirect(`/spaces/join/${code}`);
    case 'event':
      redirect(`/events/${invite.targetId}?invite=${code}`);
    case 'tool':
      redirect(`/tools/${invite.targetId}?invite=${code}`);
    default:
      // Default to space join
      redirect(`/spaces/join/${code}`);
  }
}
