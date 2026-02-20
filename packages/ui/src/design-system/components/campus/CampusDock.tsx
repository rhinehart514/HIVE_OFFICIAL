'use client';

import * as React from 'react';

export interface CampusDockProps {
  className?: string;
  children?: React.ReactNode;
}

export interface CampusDockItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

export function CampusDock({ className, children }: CampusDockProps) {
  return (
    <div className={className}>
      {children}
    </div>
  );
}

CampusDock.displayName = 'CampusDock';

export type DockSpaceItem = Record<string, unknown>;
export type DockToolItem = Record<string, unknown>;
