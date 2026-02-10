/**
 * SpacesLedSection - Display spaces user is leading
 */

import { InView } from '@hive/ui';
import { TrophyIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { ProfileV2ApiResponse } from '@/components/profile/profile-adapter';

interface SpacesLedSectionProps {
  spacesLed: ProfileV2ApiResponse['spaces'];
  isOwnProfile: boolean;
  onSpaceClick: (spaceId: string) => void;
  onClaimSpace: () => void;
}

export function SpacesLedSection({
  spacesLed,
  isOwnProfile,
  onSpaceClick,
  onClaimSpace,
}: SpacesLedSectionProps) {
  if (spacesLed.length === 0) return null;

  return (
    <InView
      variants={{
        hidden: { opacity: 0, y: 24 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      viewOptions={{ once: true, margin: '0px 0px -100px 0px' }}
    >
      <div className="rounded-lg bg-[var(--bg-surface)]/50 border border-[var(--border)]/50 overflow-hidden">
        <div className="p-6 border-b border-[var(--border)]/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[var(--life-gold)]/10">
              <TrophyIcon className="w-5 h-5 text-[var(--life-gold)]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Spaces I Lead</h3>
              <p className="text-sm text-[var(--text-muted)]">
                {spacesLed.length} space{spacesLed.length > 1 ? 's' : ''} under your leadership
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-[var(--border)]/50">
          {spacesLed.map((space) => (
            <button
              key={space.id}
              onClick={() => onSpaceClick(space.id)}
              className="w-full p-4 flex items-center gap-4 hover:bg-white/[0.06] transition-colors text-left group"
            >
              <div className="w-12 h-12 rounded-lg bg-[var(--bg-surface)] flex items-center justify-center overflow-hidden flex-shrink-0">
                {space.imageUrl ? (
                  <img src={space.imageUrl} alt={space.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xl font-bold text-[var(--text-muted)]">
                    {space.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-white truncate group-hover:text-[var(--life-gold)] transition-colors">
                  {space.name}
                </h4>
                <p className="text-sm text-[var(--text-muted)]">
                  {space.role === 'owner' ? 'Owner' : 'Admin'} • {space.memberCount || 0} member{(space.memberCount || 0) !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--text-secondary)] transition-colors" />
            </button>
          ))}
        </div>
        {isOwnProfile && (
          <div className="p-4 bg-[var(--bg-surface)]/30 border-t border-[var(--border)]/50">
            <button
              onClick={onClaimSpace}
              className="w-full py-2.5 px-4 rounded-lg bg-[var(--life-gold)]/10 hover:bg-[var(--life-gold)]/20 text-[var(--life-gold)] text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <TrophyIcon className="w-4 h-4" />
              Claim Another Space
            </button>
          </div>
        )}
      </div>
    </InView>
  );
}
