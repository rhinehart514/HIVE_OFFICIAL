/**
 * Temporary stub components for non-MVP features
 * These will be replaced with full implementations post-launch
 */

import React from 'react';

export const HiveModal = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
  return <div {...props}>{children}</div>;
};

export const HiveModalContent = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
  return <div {...props}>{children}</div>;
};

export const PageContainer = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
  return <div className="min-h-screen bg-[var(--hive-background-primary)] p-4" {...props}>{children}</div>;
};

export const Alert = ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
  return <div role="alert" {...props}>{children}</div>;
};

export const SchoolsPageHeader = (_props: { onComingSoonClick?: () => void }) => {
  return (
    <div className="mb-8 space-y-2">
      <h1 className="text-3xl font-bold text-white">Choose your campus</h1>
      <p className="text-sm text-white/60">
        HIVE is rolling out school by school. Pick your university to see status and join the waitlist.
      </p>
    </div>
  );
};
