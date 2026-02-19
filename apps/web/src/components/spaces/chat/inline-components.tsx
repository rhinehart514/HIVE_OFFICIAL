'use client';

/**
 * Inline Components - STUB (Feb 2026)
 * System removed. Stub to keep message-item compiling.
 */

import * as React from 'react';

export interface InlineComponentData {
  id: string;
  type: 'poll' | 'countdown' | 'rsvp' | 'signup';
  [key: string]: unknown;
}

interface InlineComponentProps {
  component: InlineComponentData;
  onVote?: (optionIndex: number) => void;
  onRsvp?: (response: string) => void;
}

export function InlineComponent(_props: InlineComponentProps) {
  return null; // Removed Feb 2026
}
