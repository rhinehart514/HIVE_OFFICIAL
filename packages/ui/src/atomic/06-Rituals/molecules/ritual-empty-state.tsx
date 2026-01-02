'use client';

import { Package, Target, type LucideIcon } from 'lucide-react';
import * as React from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../00-Global/atoms/button';
import { Card } from '../../00-Global/atoms/card';

export interface RitualEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const RitualEmptyState: React.FC<RitualEmptyStateProps> = ({
  icon: IconComponent = Target,
  title = 'No Rituals Yet',
  message = 'Check back soon for campus-wide events and competitions.',
  actionLabel,
  onAction,
  className,
  ...props
}) => {
  return (
    <Card
      className={cn('border-white/10 bg-white/5 p-12 text-center', className)}
      {...props}
    >
      <div className="mb-4 flex items-center justify-center">
        <IconComponent className="h-16 w-16 text-[var(--hive-text-tertiary)]" />
      </div>
      <h3 className="mb-2 text-lg font-semibold text-white">{title}</h3>
      <p className="mb-4 text-sm text-white/60">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} size="sm">
          <Package className="mr-2 h-4 w-4" />
          {actionLabel}
        </Button>
      )}
    </Card>
  );
};
