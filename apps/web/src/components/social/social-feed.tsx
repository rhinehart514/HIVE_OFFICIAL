/**
 * Social Feed - Temporary stub for MVP
 * Will be fully implemented post-launch
 */

"use client";

import React from 'react';
import { Card } from '@hive/ui';

type SocialFeedVariant = "home" | "campus" | "space";

interface SocialFeedProps {
  feedType?: SocialFeedVariant;
  className?: string;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ feedType = "home", className }) => {
  return (
    <Card className={className ? `p-6 ${className}` : "p-6"}>
      <h2 className="text-xl font-bold text-[var(--hive-text-primary)] mb-4">Social Feed</h2>
      <p className="text-[var(--hive-text-secondary)]">
        Read-only {feedType} feed preview coming soon. This is a non-interactive placeholder for UX flows.
      </p>
    </Card>
  );
};

export default SocialFeed;
