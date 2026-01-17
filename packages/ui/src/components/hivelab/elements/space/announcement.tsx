'use client';

/**
 * Announcement Element (Space Tier)
 *
 * Create and send announcements to space members.
 * Requires: spaceId context (leaders only).
 */

import * as React from 'react';
import { useState } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { Card, CardContent } from '../../../../design-system/primitives';
import { Badge } from '../../../../design-system/primitives';
import { Button } from '../../../../design-system/primitives';
import type { ElementProps } from '../../../../lib/hivelab/element-system';

export function AnnouncementElement({ config, data, onChange, onAction, context }: ElementProps) {
  const [message, setMessage] = useState(data?.message || '');
  const [isSending, setIsSending] = useState(false);

  if (!context?.spaceId) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          <BellIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p>Announcement requires space context</p>
        </CardContent>
      </Card>
    );
  }

  const handleSend = async () => {
    if (!message.trim()) return;
    setIsSending(true);

    onChange?.({ message, pinned: config.pinned });
    onAction?.('send_announcement', {
      message,
      pinned: config.pinned,
      sendNotification: config.sendNotification,
      expiresAt: config.expiresAt,
    });

    setMessage('');
    setIsSending(false);
  };

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BellIcon className="h-4 w-4 text-amber-500" />
          <span className="font-medium text-sm">Announcement</span>
          {config.pinned && <Badge variant="outline" className="text-xs">Pinned</Badge>}
        </div>

        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Write your announcement..."
          className="w-full h-24 p-3 text-sm bg-background border rounded-lg resize-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        />

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {config.sendNotification && 'Will notify all members'}
          </div>
          <Button onClick={handleSend} disabled={!message.trim() || isSending} size="sm">
            {isSending ? 'Sending...' : 'Send'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
