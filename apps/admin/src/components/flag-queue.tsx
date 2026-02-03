"use client";

import { Button, useToast } from "@hive/ui";

export function FlagQueue() {
  const { toast } = useToast();

  const handleDismiss = () => {
    toast.info('Coming soon', 'Dismiss functionality is under development');
  };

  const handleRemove = () => {
    toast.info('Coming soon', 'Remove functionality is under development');
  };

  return (
    <div className="space-y-4">
      <div className="text-sm text-white/50">No flagged content to review</div>

      {/* TODO: Implement content flag queue */}
      <div className="space-y-3">
        <div className="rounded-md border border-white/[0.12] bg-[var(--bg-ground)]/50 p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-400">
                  Inappropriate Content
                </span>
                <span className="text-xs text-white/50">2 reports</span>
              </div>
              <div className="text-sm text-white mb-2">
                &quot;This is sample flagged content that would appear
                here...&quot;
              </div>
              <div className="text-xs text-white/50">
                Posted by @sampleuser in #general
              </div>
            </div>
            <div className="flex gap-2 ml-4">
              <Button variant="outline" size="sm" onClick={handleDismiss}>
                Dismiss
              </Button>
              <Button variant="destructive" size="sm" onClick={handleRemove}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
