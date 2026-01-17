"use client";

/**
 * Connections Page
 *
 * Displays user's connections, followers, following, and friend requests.
 * Uses the new connections API endpoints.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Card,
  Button,
  Input,
  Badge,
  Text,
  getInitials,
} from '@hive/ui/design-system/primitives';
import { useAuth } from '@hive/auth-logic';

// Types for connections API
interface ConnectionProfile {
  id: string;
  handle?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  bio?: string;
  major?: string;
  graduationYear?: number;
}

interface ConnectionData {
  connectionId: string;
  relationship: 'friend' | 'following' | 'follower' | 'pending';
  profile?: ConnectionProfile;
  source?: string;
  mutualSpaces?: string[];
  interactionCount?: number;
  createdAt?: string | null;
}

interface FriendData {
  id: string;
  handle?: string;
  firstName?: string;
  lastName?: string;
  profilePhoto?: string;
  bio?: string;
  major?: string;
  connectionDate?: string | null;
  mutualSpaces?: string[];
}

interface FriendRequestData {
  requestId: string;
  fromUserId: string;
  toUserId?: string;
  createdAt?: string | null;
  message?: string | null;
}

interface ConnectionStats {
  totalConnections: number;
  friends: number;
  following: number;
  followers: number;
  pending: number;
}

// LOCKED: Premium easing
const EASE = [0.22, 1, 0.36, 1] as const;

const fadeIn = (delay: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35, delay, ease: EASE },
});

type TabType = 'all' | 'friends' | 'following' | 'followers' | 'requests';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestData[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestData[]>([]);
  const [stats, setStats] = useState<ConnectionStats>({
    totalConnections: 0,
    friends: 0,
    following: 0,
    followers: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Fetch connections data
  const fetchConnections = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Fetch connections
      const connectionsResponse = await fetch('/api/connections', {
        credentials: 'include'
      });

      if (!connectionsResponse.ok) {
        throw new Error('Failed to fetch connections');
      }

      const connectionsData = await connectionsResponse.json();

      // Fetch friends and requests
      const friendsResponse = await fetch('/api/friends?include_requests=true', {
        credentials: 'include'
      });

      if (!friendsResponse.ok) {
        throw new Error('Failed to fetch friends');
      }

      const friendsData = await friendsResponse.json();

      setConnections(connectionsData.data || []);
      setFriends(friendsData.friends || []);
      setReceivedRequests(friendsData.receivedRequests || []);
      setSentRequests(friendsData.sentRequests || []);
      setStats({
        totalConnections: connectionsData.stats?.totalConnections || 0,
        friends: connectionsData.stats?.friends || friendsData.count || 0,
        following: connectionsData.stats?.following || 0,
        followers: connectionsData.stats?.followers || 0,
        pending: connectionsData.stats?.pending || 0,
      });
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchConnections();
    }
  }, [user, fetchConnections]);

  // Action handlers
  const sendFriendRequest = async (toUserId: string, message?: string) => {
    const response = await fetch('/api/friends', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ toUserId, message })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send friend request');
    }
    await fetchConnections();
  };

  const acceptFriendRequest = async (requestId: string) => {
    const response = await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, action: 'accept' })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to accept friend request');
    }
    await fetchConnections();
  };

  const rejectFriendRequest = async (requestId: string) => {
    const response = await fetch('/api/friends', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ requestId, action: 'reject' })
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject friend request');
    }
    await fetchConnections();
  };

  const unfriend = async (friendId: string) => {
    const response = await fetch(`/api/friends?friendId=${encodeURIComponent(friendId)}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to unfriend');
    }
    await fetchConnections();
  };

  // Redirect if not authenticated
  if (!user) {
    router.push('/enter');
    return null;
  }

  // Filter connections based on tab and search
  const filteredData = useMemo(() => {
    interface FilteredItem {
      id: string;
      type: 'connection' | 'friend' | 'following' | 'follower' | 'request';
      profile?: ConnectionProfile;
      relationship?: string;
      mutualSpaces?: string[];
      interactionCount?: number;
      requestId?: string;
      fromUserId?: string;
      message?: string | null;
      createdAt?: string | null;
    }

    let items: FilteredItem[] = [];

    switch (activeTab) {
      case 'friends':
        items = friends.map(f => ({
          id: f.id,
          type: 'friend' as const,
          profile: {
            id: f.id,
            handle: f.handle,
            firstName: f.firstName,
            lastName: f.lastName,
            profilePhoto: f.profilePhoto,
            bio: f.bio,
            major: f.major,
          },
          relationship: 'friend',
          mutualSpaces: f.mutualSpaces || [],
        }));
        break;

      case 'following':
        items = connections
          .filter(c => c.relationship === 'following')
          .map(c => ({
            id: c.profile?.id || c.connectionId,
            type: 'following' as const,
            profile: c.profile,
            relationship: c.relationship,
            mutualSpaces: c.mutualSpaces,
            interactionCount: c.interactionCount,
          }));
        break;

      case 'followers':
        items = connections
          .filter(c => c.relationship === 'follower')
          .map(c => ({
            id: c.profile?.id || c.connectionId,
            type: 'follower' as const,
            profile: c.profile,
            relationship: c.relationship,
            mutualSpaces: c.mutualSpaces,
            interactionCount: c.interactionCount,
          }));
        break;

      case 'requests':
        items = [
          ...receivedRequests.map(r => ({
            id: r.requestId,
            type: 'request' as const,
            requestId: r.requestId,
            fromUserId: r.fromUserId,
            message: r.message,
            createdAt: r.createdAt,
          })),
        ];
        break;

      default:
        // 'all' - show all connections
        items = connections.map(c => ({
          id: c.profile?.id || c.connectionId,
          type: 'connection' as const,
          profile: c.profile,
          relationship: c.relationship,
          mutualSpaces: c.mutualSpaces,
          interactionCount: c.interactionCount,
        }));
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item => {
        if (item.profile) {
          const fullName = `${item.profile.firstName || ''} ${item.profile.lastName || ''}`.toLowerCase();
          const handle = (item.profile.handle || '').toLowerCase();
          return fullName.includes(query) || handle.includes(query);
        }
        return false;
      });
    }

    return items;
  }, [activeTab, connections, friends, receivedRequests, searchQuery]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="text-white/60">Loading connections...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center gap-4">
        <Text className="text-white/60">Failed to load connections</Text>
        <Button onClick={fetchConnections}>Try Again</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full overflow-y-auto">
      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <motion.div className="mb-10" {...fadeIn(0)}>
          <h1
            className="text-[28px] font-semibold text-white mb-2 tracking-tight"
          >
            Connections
          </h1>
          <p className="text-white/50">
            Your network on HIVE
          </p>
        </motion.div>

        {/* Stats */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" {...fadeIn(0.05)}>
          <Card elevation="resting" className="text-center py-4">
            <div className="text-2xl font-semibold text-white">
              {stats.totalConnections}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Connections
            </div>
          </Card>
          <Card elevation="resting" className="text-center py-4">
            <div className="text-2xl font-semibold text-white">
              {stats.friends}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Friends
            </div>
          </Card>
          <Card elevation="resting" className="text-center py-4">
            <div className="text-2xl font-semibold text-white">
              {stats.following}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Following
            </div>
          </Card>
          <Card elevation="resting" className="text-center py-4">
            <div className="text-2xl font-semibold text-white">
              {stats.followers}
            </div>
            <div className="text-xs text-white/40 uppercase tracking-wider">
              Followers
            </div>
          </Card>
        </motion.div>

        {/* Tabs */}
        <motion.div className="mb-6" {...fadeIn(0.1)}>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {[
              { id: 'all', label: 'All' },
              { id: 'friends', label: 'Friends', count: stats.friends },
              { id: 'following', label: 'Following', count: stats.following },
              { id: 'followers', label: 'Followers', count: stats.followers },
              { id: 'requests', label: 'Requests', count: stats.pending },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap
                  ${activeTab === tab.id
                    ? 'bg-white text-black'
                    : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }
                `}
              >
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <span className="ml-1.5 text-xs opacity-70">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div className="mb-6" {...fadeIn(0.15)}>
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Content */}
        <motion.div {...fadeIn(0.2)}>
          {activeTab === 'requests' && receivedRequests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                Pending Requests
              </h3>
              <div className="space-y-3">
                {receivedRequests.map((request) => (
                  <FriendRequestCard
                    key={request.requestId}
                    request={request}
                    onAccept={() => acceptFriendRequest(request.requestId)}
                    onReject={() => rejectFriendRequest(request.requestId)}
                  />
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requests' && sentRequests.length > 0 && (
            <div className="mb-8">
              <h3 className="text-sm font-medium text-white/40 uppercase tracking-wider mb-4">
                Sent Requests
              </h3>
              <div className="space-y-3">
                {sentRequests.map((request) => (
                  <Card key={request.requestId} elevation="resting" className="p-4">
                    <div className="flex items-center justify-between">
                      <Text className="text-white/60">
                        Request sent to user
                      </Text>
                      <Badge variant="neutral" size="sm">
                        Pending
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {filteredData.length === 0 ? (
            <EmptyState
              tab={activeTab}
              onBrowseSpaces={() => router.push('/spaces/browse')}
            />
          ) : (
            <div className="grid gap-3">
              {filteredData.map((item) => {
                if (item.type === 'request') {
                  return null; // Handled above
                }

                return (
                  <ConnectionCard
                    key={item.id}
                    profile={item.profile}
                    relationship={item.relationship}
                    mutualSpaces={item.mutualSpaces}
                    onViewProfile={() => router.push(`/profile/${item.id}`)}
                    onSendFriendRequest={
                      item.relationship === 'follower'
                        ? () => sendFriendRequest(item.id)
                        : undefined
                    }
                    onUnfriend={
                      item.relationship === 'friend'
                        ? () => unfriend(item.id)
                        : undefined
                    }
                  />
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Connection Card Component
function ConnectionCard({
  profile,
  relationship,
  mutualSpaces,
  onViewProfile,
  onSendFriendRequest,
  onUnfriend,
}: {
  profile?: {
    id: string;
    handle?: string;
    firstName?: string;
    lastName?: string;
    profilePhoto?: string;
    bio?: string;
    major?: string;
  };
  relationship?: string;
  mutualSpaces?: string[];
  onViewProfile: () => void;
  onSendFriendRequest?: () => void;
  onUnfriend?: () => void;
}) {
  if (!profile) return null;

  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'HIVE User';
  const initials = getInitials(fullName);

  return (
    <Card
      elevation="resting"
      interactive
      onClick={onViewProfile}
      className="p-4"
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
          style={{
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.04)',
          }}
        >
          {profile.profilePhoto ? (
            <img
              src={profile.profilePhoto}
              alt={fullName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-white/5 flex items-center justify-center">
              <span className="text-lg text-white/30">{initials}</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Text className="font-medium truncate">{fullName}</Text>
            {relationship === 'friend' && (
              <Badge variant="gold" size="sm">Friend</Badge>
            )}
          </div>
          {profile.handle && (
            <Text size="sm" className="text-white/40">
              @{profile.handle}
            </Text>
          )}
          {(mutualSpaces?.length || 0) > 0 && (
            <Text size="sm" className="text-white/30 mt-0.5">
              {mutualSpaces!.length} shared space{mutualSpaces!.length !== 1 ? 's' : ''}
            </Text>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          {onSendFriendRequest && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onSendFriendRequest}
            >
              Add Friend
            </Button>
          )}
          {onUnfriend && (
            <Button
              size="sm"
              variant="ghost"
              onClick={onUnfriend}
            >
              Unfriend
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Friend Request Card Component
function FriendRequestCard({
  request,
  onAccept,
  onReject,
}: {
  request: {
    requestId: string;
    fromUserId: string;
    message?: string | null;
    createdAt?: string | null;
  };
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <Card elevation="resting" className="p-4">
      <div className="flex items-center justify-between">
        <div>
          <Text className="font-medium">Friend Request</Text>
          {request.message && (
            <Text size="sm" className="text-white/50 mt-1">
              "{request.message}"
            </Text>
          )}
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="cta" onClick={onAccept}>
            Accept
          </Button>
          <Button size="sm" variant="ghost" onClick={onReject}>
            Decline
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Empty State Component
function EmptyState({
  tab,
  onBrowseSpaces,
}: {
  tab: TabType;
  onBrowseSpaces: () => void;
}) {
  const messages: Record<TabType, { title: string; description: string }> = {
    all: {
      title: 'No connections yet',
      description: 'Join spaces to meet people and build your network',
    },
    friends: {
      title: 'No friends yet',
      description: 'Send friend requests to people you connect with',
    },
    following: {
      title: 'Not following anyone',
      description: 'Follow people to see their activity',
    },
    followers: {
      title: 'No followers yet',
      description: 'As you participate in spaces, people will follow you',
    },
    requests: {
      title: 'No pending requests',
      description: 'Friend requests will appear here',
    },
  };

  const { title, description } = messages[tab];

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <h3 className="text-lg font-medium text-white/60 mb-1">{title}</h3>
      <p className="text-sm text-white/40 max-w-sm mb-6">{description}</p>
      {tab === 'all' && (
        <Button variant="cta" onClick={onBrowseSpaces}>
          Browse Spaces
        </Button>
      )}
    </div>
  );
}
