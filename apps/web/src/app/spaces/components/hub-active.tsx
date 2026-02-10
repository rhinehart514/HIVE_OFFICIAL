'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Plus } from 'lucide-react';
import { Button } from '@hive/ui/design-system/primitives';
import { OrganizationsGrid } from './space-orbit';
import type { IdentityClaim, Space } from '../hooks/useSpacesHQ';

interface HubActiveProps {
  identityClaims: {
    major: IdentityClaim | null;
    home: IdentityClaim | null;
    greek: IdentityClaim | null;
  };
  organizations: Space[];
  onCreateSpace?: () => void;
  onMuteSpace?: (spaceId: string) => void;
  onLeaveSpace?: (spaceId: string) => void;
}

function ClaimChip({ label, claim }: { label: string; claim: IdentityClaim | null }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.06] px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-1 text-sm text-white">{claim?.spaceName ?? 'Unclaimed'}</p>
    </div>
  );
}

export function HubActive({
  identityClaims,
  organizations,
  onCreateSpace,
  onMuteSpace,
  onLeaveSpace,
}: HubActiveProps) {
  return (
    <div className="flex-1 px-6 pb-8">
      <section className="mb-6">
        <h2 className="mb-3 text-xs font-medium uppercase tracking-wider text-white/50">Identity</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <ClaimChip label="Major" claim={identityClaims.major} />
          <ClaimChip label="Home" claim={identityClaims.home} />
          <ClaimChip label="Greek" claim={identityClaims.greek} />
        </div>
      </section>

      <section className="flex-1">
        <h2 className="mb-4 text-xs font-medium uppercase tracking-wider text-white/50">Your Organizations</h2>
        <OrganizationsGrid
          spaces={organizations}
          maxVisible={12}
          onMuteSpace={onMuteSpace}
          onLeaveSpace={onLeaveSpace}
        />
      </section>

      <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4">
        <Link
          href="/discover"
          className="group flex items-center gap-2 text-sm text-white/50 transition-colors hover:text-white"
        >
          Browse more spaces
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
        </Link>

        {onCreateSpace && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCreateSpace}
            className="text-white/50 hover:bg-white/[0.06] hover:text-white"
          >
            <Plus size={14} className="mr-1.5" />
            Create
          </Button>
        )}
      </div>
    </div>
  );
}

HubActive.displayName = 'HubActive';
