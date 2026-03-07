'use client';

/**
 * DeploymentTargetCard + Helpers
 *
 * Sub-components for DeploymentTarget: card, avatar, surface selector.
 * Split from DeploymentTarget.tsx for modularity.
 */

import * as React from 'react';
import { motion } from 'framer-motion';
import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const surfaceClass = 'bg-white/[0.02]';

const springConfig = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

// Card variants
const deploymentTargetCardVariants = cva(
  [
    'relative',
    'rounded-xl',
    'p-4',
    'border border-white/[0.06]',
    'transition-all duration-200',
    'cursor-pointer',
    'hover:brightness-110',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50',
  ].join(' '),
  {
    variants: {
      selected: {
        true: 'ring-2 ring-white/50 border-white/20',
        false: '',
      },
      disabled: {
        true: 'opacity-40 cursor-not-allowed hover:brightness-100',
        false: '',
      },
    },
    defaultVariants: {
      selected: false,
      disabled: false,
    },
  }
);

// Surface pill variants
const surfacePillVariants = cva(
  [
    'inline-flex items-center',
    'px-2 py-1',
    'rounded-md',
    'text-label-xs font-medium',
    'transition-colors duration-150',
  ].join(' '),
  {
    variants: {
      variant: {
        default: 'bg-white/[0.06] text-white/60',
        selected: 'bg-white/20 text-white',
        disabled: 'bg-white/[0.03] text-white/30',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export type DeploymentSurface = 'sidebar' | 'tab' | 'widget';

export interface DeploymentSpaceTarget {
  id: string;
  name: string;
  memberCount?: number;
  avatarUrl?: string;
  description?: string;
  isLeader?: boolean;
  availableSurfaces?: DeploymentSurface[];
  isDeployed?: boolean;
}

// Space avatar component
const DeploymentSpaceAvatar: React.FC<{
  name: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
}> = ({ name, avatarUrl, size = 'md' }) => {
  const sizeClasses = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm';

  return (
    <div
      className={cn(
        sizeClasses,
        'rounded-lg flex items-center justify-center shrink-0',
        'bg-white/[0.06] border border-white/[0.06]',
        'font-medium text-white/60'
      )}
    >
      {avatarUrl ? (
        <img src={avatarUrl} alt={name} className="w-full h-full object-cover rounded-lg" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
};

// Check icon
const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 16 16" fill="currentColor">
    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z" />
  </svg>
);

// Space card component
const DeploymentTargetCard: React.FC<{
  target: DeploymentSpaceTarget;
  isSelected: boolean;
  isDeploying: boolean;
  onClick: () => void;
}> = ({ target, isSelected, isDeploying, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDeploying}
      className={cn(deploymentTargetCardVariants({ selected: isSelected, disabled: isDeploying }), surfaceClass)}
    >
      <div className="flex items-start gap-3">
        <DeploymentSpaceAvatar name={target.name} avatarUrl={target.avatarUrl} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">{target.name}</span>
            {target.isLeader && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-label-xs font-medium bg-[#D4AF37]/20 text-[#D4AF37]">
                Leader
              </span>
            )}
          </div>
          {target.memberCount !== undefined && (
            <span className="text-xs text-white/40 tabular-nums">
              {target.memberCount.toLocaleString()} members
            </span>
          )}
          {target.isDeployed && (
            <span className="flex items-center gap-1 text-label-xs text-white/50 mt-1">
              <CheckIcon className="w-3 h-3" />
              Already deployed
            </span>
          )}
        </div>
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={springConfig}
            className="shrink-0 w-5 h-5 rounded-full bg-white/20 flex items-center justify-center"
          >
            <CheckIcon className="w-3 h-3 text-white" />
          </motion.div>
        )}
        {isDeploying && (
          <div className="shrink-0 w-5 h-5 flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          </div>
        )}
      </div>
    </button>
  );
};

// Surface selector component
const DeploymentSurfaceSelector: React.FC<{
  value: DeploymentSurface;
  onChange: (surface: DeploymentSurface) => void;
  availableSurfaces?: DeploymentSurface[];
}> = ({ value, onChange, availableSurfaces = ['sidebar'] }) => {
  const surfaces: { id: DeploymentSurface; label: string; available: boolean }[] = [
    { id: 'sidebar', label: 'Sidebar', available: availableSurfaces.includes('sidebar') },
    { id: 'tab', label: 'Tab', available: availableSurfaces.includes('tab') },
    { id: 'widget', label: 'Widget', available: availableSurfaces.includes('widget') },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/[0.03]">
      {surfaces.map((surface) => (
        <button
          key={surface.id}
          type="button"
          onClick={() => surface.available && onChange(surface.id)}
          disabled={!surface.available}
          className={cn(
            surfacePillVariants({
              variant: !surface.available ? 'disabled' : value === surface.id ? 'selected' : 'default',
            }),
            'cursor-pointer disabled:cursor-not-allowed'
          )}
        >
          {surface.label}
          {!surface.available && <span className="ml-1 text-[8px] text-white/30">Soon</span>}
        </button>
      ))}
    </div>
  );
};

export {
  DeploymentTargetCard,
  DeploymentSpaceAvatar,
  DeploymentSurfaceSelector,
  deploymentTargetCardVariants,
  surfacePillVariants as deploymentSurfacePillVariants,
};
