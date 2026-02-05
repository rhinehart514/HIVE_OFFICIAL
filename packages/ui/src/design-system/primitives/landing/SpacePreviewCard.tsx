'use client';

import * as React from 'react';
import Image from 'next/image';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../../lib/utils';
import { BorderBeam } from '../../../components/motion-primitives/border-beam';

const spacePreviewCardVariants = cva(
  [
    'relative flex flex-col gap-3 p-4 rounded-xl',
    'bg-white/[0.03] border border-white/[0.06]',
    'transition-all duration-300',
    'hover:brightness-110',
    'min-w-[160px] w-[160px]',
  ].join(' '),
  {
    variants: {
      warmth: {
        none: '',
        low: 'shadow-[0_0_0_1px_rgba(255,215,0,0.08)]',
        medium: 'shadow-[0_0_0_1px_rgba(255,215,0,0.15),0_0_12px_rgba(255,215,0,0.08)]',
        high: 'shadow-[0_0_0_1px_rgba(255,215,0,0.25),0_0_20px_rgba(255,215,0,0.12)]',
      },
    },
    defaultVariants: { warmth: 'none' },
  }
);

export interface SpacePreviewCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof spacePreviewCardVariants> {
  name: string;
  avatar?: string;
  shortName?: string;
  memberCount: number;
  isLive?: boolean;
  featured?: boolean;
}

export function SpacePreviewCard({
  name,
  avatar,
  shortName,
  memberCount,
  isLive = false,
  featured = false,
  warmth,
  className,
  ...props
}: SpacePreviewCardProps) {
  const effectiveWarmth = warmth ?? (isLive ? 'medium' : 'none');

  return (
    <div
      className={cn(spacePreviewCardVariants({ warmth: effectiveWarmth }), className)}
      {...props}
    >
      {featured && (
        <BorderBeam
          size={80}
          duration={12}
          colorFrom="var(--color-gold)"
          colorTo="rgba(255,215,0,0.3)"
        />
      )}

      {/* Avatar */}
      <div className="w-10 h-10 rounded-lg bg-white/[0.06] flex items-center justify-center overflow-hidden">
        {avatar ? (
          <Image src={avatar} alt={name} width={40} height={40} className="object-cover" sizes="40px" />
        ) : (
          <span className="text-label-sm font-bold text-white/60">
            {shortName || name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>

      {/* Name */}
      <p className="text-body font-medium text-white truncate">{name}</p>

      {/* Activity */}
      <div className="flex items-center gap-2">
        {isLive && (
          <span className="w-2 h-2 rounded-full bg-[var(--color-gold)] animate-pulse" />
        )}
        <span
          className={cn(
            'text-body-sm',
            isLive ? 'text-[var(--color-gold)]/80' : 'text-white/40'
          )}
        >
          {memberCount} {isLive ? 'now' : 'members'}
        </span>
      </div>
    </div>
  );
}

SpacePreviewCard.displayName = 'SpacePreviewCard';

export { spacePreviewCardVariants };
