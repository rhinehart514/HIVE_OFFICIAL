'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Clock, CheckCircle, XCircle, Inbox } from 'lucide-react';
import { Text, Button, toast, Avatar, AvatarImage, AvatarFallback, getInitials } from '@hive/ui';
import { MOTION } from '@hive/tokens';
import type { JoinRequest } from './types';

interface SettingsRequestsProps {
  spaceId: string;
}

export function SettingsRequests({ spaceId }: SettingsRequestsProps) {
  const [joinRequests, setJoinRequests] = React.useState<JoinRequest[]>([]);
  const [joinRequestsLoading, setJoinRequestsLoading] = React.useState(false);
  const [joinRequestActionId, setJoinRequestActionId] = React.useState<string | null>(null);

  const fetchJoinRequests = React.useCallback(async () => {
    setJoinRequestsLoading(true);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/join-requests?status=pending`, {
        credentials: 'include',
      });
      if (response.ok) {
        const data = await response.json();
        setJoinRequests(data.data?.requests || []);
      } else {
        setJoinRequests([]);
      }
    } catch {
      setJoinRequests([]);
    } finally {
      setJoinRequestsLoading(false);
    }
  }, [spaceId]);

  React.useEffect(() => {
    fetchJoinRequests();
  }, [fetchJoinRequests]);

  const handleJoinRequestAction = async (requestId: string, action: 'approve' | 'reject') => {
    setJoinRequestActionId(requestId);
    try {
      const response = await fetch(`/api/spaces/${spaceId}/join-requests`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ requestId, action }),
      });

      if (!response.ok) {
        throw new Error('Action failed');
      }

      toast.success(
        action === 'approve' ? 'Request approved' : 'Request declined',
        action === 'approve'
          ? 'Member has been added to the space'
          : 'The request has been declined'
      );

      setJoinRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      toast.error('Action failed', 'Please try again');
    } finally {
      setJoinRequestActionId(null);
    }
  };

  return (
    <>
      <h2
        className="text-title-lg font-semibold text-white mb-2"
        style={{ fontFamily: 'var(--font-clash)' }}
      >
        Join Requests
      </h2>
      <Text size="sm" tone="muted" className="mb-8">
        Review and manage pending membership requests
      </Text>

      {joinRequestsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-white/50" />
        </div>
      ) : joinRequests.length === 0 ? (
        <div className="text-center py-12 rounded-lg bg-white/[0.05] border border-white/[0.05]">
          <Inbox className="w-10 h-10 mx-auto mb-4 text-white/50" />
          <Text weight="medium" className="text-white/50 mb-1">
            No pending requests
          </Text>
          <Text size="sm" tone="muted">
            New join requests from prospective members will appear here
          </Text>
        </div>
      ) : (
        <div className="space-y-3">
          <Text size="xs" weight="medium" className="uppercase tracking-wider text-white/50 px-1">
            Pending ({joinRequests.length})
          </Text>
          {joinRequests.map((request) => {
            const isProcessing = joinRequestActionId === request.id;
            return (
              <motion.div
                key={request.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: MOTION.ease.premium }}
                className="p-4 rounded-lg bg-white/[0.05] border border-white/[0.05]"
              >
                <div className="flex items-center gap-3">
                  <Avatar size="default">
                    {request.user?.avatarUrl && <AvatarImage src={request.user.avatarUrl} />}
                    <AvatarFallback>
                      {request.user ? getInitials(request.user.displayName) : '?'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <Text size="sm" weight="medium" className="truncate">
                      {request.user?.displayName || 'Unknown User'}
                    </Text>
                    {request.user?.handle && (
                      <Text size="xs" tone="muted" className="font-sans truncate">
                        @{request.user.handle}
                      </Text>
                    )}
                    {request.createdAt && (
                      <div className="flex items-center gap-1.5 mt-1">
                        <Clock className="w-3 h-3 text-white/50" />
                        <Text size="xs" tone="muted">
                          {new Date(request.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleJoinRequestAction(request.id, 'reject')}
                      disabled={isProcessing}
                      className="text-red-400/60 hover:text-red-400 hover:bg-red-500/10"
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Decline
                    </Button>
                    <Button
                      variant="cta"
                      size="sm"
                      onClick={() => handleJoinRequestAction(request.id, 'approve')}
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <Loader2 className="w-4 h-4 mr-1.5" />
                      ) : (
                        <CheckCircle className="w-4 h-4 mr-1.5" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>

                {request.message && (
                  <div className="mt-3 p-3 rounded-lg bg-white/[0.05] border border-white/[0.05]">
                    <Text size="xs" tone="muted" className="mb-1">Message</Text>
                    <Text size="sm" className="text-white/50">
                      {request.message}
                    </Text>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </>
  );
}
