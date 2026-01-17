/**
 * Intent Confirmation Component
 *
 * Inline confirmation UI for detected user intents (e.g., creating events, polls).
 */

import * as React from 'react';
import { IntentConfirmationInline } from '@hive/ui';

type IntentType = 'event' | 'poll' | 'task' | 'announcement' | 'reminder' | 'question';
type IntentPreview = { type: IntentType; title?: string; description?: string };

interface IntentConfirmationProps {
  intent: { intentType?: string };
  isLoading: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function IntentConfirmation({
  intent,
  isLoading,
  onConfirm,
  onDismiss,
}: IntentConfirmationProps) {
  // Only render if we have a valid intent type
  if (!intent.intentType) {
    return null;
  }

  const intentPreview: IntentPreview = {
    type: intent.intentType as IntentType,
  };

  return (
    <div className="absolute bottom-24 left-4 right-4 z-50 max-w-3xl mx-auto">
      <IntentConfirmationInline
        intent={intentPreview}
        onConfirm={async () => onConfirm()}
        onCancel={onDismiss}
        isLoading={isLoading}
      />
    </div>
  );
}
