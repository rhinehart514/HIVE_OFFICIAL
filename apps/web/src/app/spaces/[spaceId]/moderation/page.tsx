'use client';

/**
 * /spaces/[spaceId]/moderation — Moderation Queue
 *
 * Archetype: Discovery
 * Purpose: Review and moderate flagged content
 * Shell: ON
 *
 * Per HIVE App Map v1:
 * - View flagged messages and content
 * - Take moderation actions
 * - View moderation history
 */

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Flag, Check, X, AlertTriangle, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Text, Heading, Card, Button, Badge, SimpleAvatar } from '@hive/ui/design-system/primitives';
import { DiscoveryLayout, DiscoveryList, DiscoveryEmpty } from '@hive/ui';
import { useAuth } from '@hive/auth-logic';

interface FlaggedItem {
  id: string;
  type: 'message' | 'post' | 'comment';
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  reportedBy: string;
  reportReason: string;
  reportedAt: string;
  status: 'pending' | 'approved' | 'removed';
}

export default function SpaceModerationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const spaceId = params?.spaceId as string;

  const [items, setItems] = React.useState<FlaggedItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [filter, setFilter] = React.useState<'pending' | 'all'>('pending');

  // Check admin status and fetch flagged items
  React.useEffect(() => {
    async function fetchData() {
      if (!spaceId || !isAuthenticated) return;

      try {
        // Check if user is admin
        const memberRes = await fetch(`/api/spaces/${spaceId}/member`, {
          credentials: 'include',
        });
        if (memberRes.ok) {
          const memberData = await memberRes.json();
          setIsAdmin(memberData.role === 'owner' || memberData.role === 'admin');
        }

        // Fetch flagged items
        const moderationRes = await fetch(`/api/spaces/${spaceId}/moderation`, {
          credentials: 'include',
        });
        if (moderationRes.ok) {
          const data = await moderationRes.json();
          setItems(data.items || []);
        }
      } catch {
        // Failed to fetch - queue will show as empty
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [spaceId, isAuthenticated]);

  // Handle moderation action
  const handleAction = async (itemId: string, action: 'approve' | 'remove') => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/moderation/${itemId}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        setItems(prev =>
          prev.map(item =>
            item.id === itemId
              ? { ...item, status: action === 'approve' ? 'approved' : 'removed' }
              : item
          )
        );
      }
    } catch {
      // Failed to take action - item state unchanged
    }
  };

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push(`/enter?from=/spaces/${spaceId}/moderation`);
    return null;
  }

  // Filter items
  const filteredItems = filter === 'pending'
    ? items.filter(item => item.status === 'pending')
    : items;

  // Header
  const header = (
    <div className="flex items-center gap-3">
      <Link
        href={`/spaces/${spaceId}/settings`}
        className="p-2 -ml-2 text-white/50 hover:text-white transition-colors"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>
      <div>
        <div className="flex items-center gap-2">
          <Heading level={1} className="text-xl">
            Moderation
          </Heading>
          {items.filter(i => i.status === 'pending').length > 0 && (
            <Badge variant="gold" size="sm">
              {items.filter(i => i.status === 'pending').length} pending
            </Badge>
          )}
        </div>
        <Text size="sm" tone="muted">
          Review flagged content
        </Text>
      </div>
    </div>
  );

  return (
    <DiscoveryLayout header={header}>
      {/* Loading */}
      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-white/[0.04] animate-pulse" />
          ))}
        </div>
      )}

      {/* Access denied */}
      {!isLoading && !isAdmin && (
        <DiscoveryEmpty
          message="You don't have permission to moderate"
          action={
            <Button
              variant="secondary"
              onClick={() => router.push(`/spaces/${spaceId}`)}
            >
              Back to Space
            </Button>
          }
        />
      )}

      {/* Moderation queue */}
      {!isLoading && isAdmin && (
        <div className="space-y-6">
          {/* Filter tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('pending')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                filter === 'pending'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm transition-colors',
                filter === 'all'
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/50 hover:text-white/80'
              )}
            >
              All
            </button>
          </div>

          {/* Empty state */}
          {filteredItems.length === 0 && (
            <DiscoveryEmpty
              message={filter === 'pending' ? 'No items pending review' : 'No flagged content'}
              action={
                <div className="flex items-center gap-2 text-green-500">
                  <Check className="h-4 w-4" />
                  <Text size="sm">All clear!</Text>
                </div>
              }
            />
          )}

          {/* Items list */}
          <DiscoveryList gap="md">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={cn(
                  'p-4',
                  item.status === 'approved' && 'opacity-60',
                  item.status === 'removed' && 'opacity-40'
                )}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <SimpleAvatar
                      src={item.authorAvatar}
                      fallback={item.authorName.substring(0, 2)}
                      size="sm"
                    />
                    <div>
                      <Text weight="medium">{item.authorName}</Text>
                      <div className="flex items-center gap-2">
                        <Badge variant="neutral" size="sm">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          {item.type}
                        </Badge>
                        <Text size="xs" tone="muted">
                          {new Date(item.reportedAt).toLocaleDateString()}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {item.status !== 'pending' && (
                    <Badge
                      variant={item.status === 'approved' ? 'neutral' : 'neutral'}
                      size="sm"
                    >
                      {item.status === 'approved' ? (
                        <>
                          <Check className="h-3 w-3 mr-1" />
                          Approved
                        </>
                      ) : (
                        <>
                          <X className="h-3 w-3 mr-1" />
                          Removed
                        </>
                      )}
                    </Badge>
                  )}
                </div>

                {/* Content */}
                <div className="bg-white/[0.02] rounded-lg p-3 mb-3">
                  <Text size="sm" className="line-clamp-3">
                    {item.content}
                  </Text>
                </div>

                {/* Report info */}
                <div className="flex items-center gap-2 mb-3">
                  <Flag className="h-3 w-3 text-amber-500" />
                  <Text size="sm" tone="muted">
                    Reported for: <span className="text-white/70">{item.reportReason}</span>
                  </Text>
                </div>

                {/* Actions */}
                {item.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => handleAction(item.id, 'approve')}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleAction(item.id, 'remove')}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </DiscoveryList>

          {/* Guidelines reminder */}
          <Card className="p-4 bg-amber-500/[0.06] border-amber-500/20">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <Text weight="medium" size="sm" className="mb-1">
                  Moderation Guidelines
                </Text>
                <Text size="sm" tone="muted">
                  Review content objectively. Remove items that violate community guidelines.
                  When in doubt, consult another admin.
                </Text>
              </div>
            </div>
          </Card>
        </div>
      )}
    </DiscoveryLayout>
  );
}
