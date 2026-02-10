'use client';

/**
 * Deploy Success Toast Component
 *
 * Triggered after successful tool deployment.
 * Shows confirmation with link to deployed space.
 *
 * GTM Loop: Builder flow completion
 */

import * as React from 'react';
import { CheckCircleIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { toast } from '@hive/ui';

interface DeploySuccessOptions {
  toolName: string;
  spaceName: string;
  spaceId: string;
  onViewInSpace?: () => void;
}

/**
 * Show deploy success toast with link to space
 */
export function showDeploySuccessToast({
  toolName,
  spaceName,
}: DeploySuccessOptions) {
  toast.success(
    `${toolName} is now live!`,
    `Deployed to ${spaceName}. Space members can now use it.`
  );
}

/**
 * DeploySuccessToast - Visual component for custom rendering
 * Use this if you need more control over the toast appearance
 */
export function DeploySuccessToast({
  toolName,
  spaceName,
  onViewInSpace,
  onDismiss,
}: DeploySuccessOptions & { onDismiss?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-[var(--bg-ground)] border border-white/[0.06] max-w-sm">
      {/* Success icon */}
      <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
        <CheckCircleIcon className="w-5 h-5 text-green-400" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white">
          {toolName} is now live!
        </p>
        <p className="text-xs text-white/50 mt-1">
          Deployed to {spaceName}
        </p>

        {/* Action */}
        {onViewInSpace && (
          <button
            onClick={() => {
              onViewInSpace();
              onDismiss?.();
            }}
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
          >
            View in space
            <ArrowRightIcon className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Dismiss */}
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="text-white/50 hover:text-white/50 p-1 -m-1"
        >
          <span className="sr-only">Dismiss</span>
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
