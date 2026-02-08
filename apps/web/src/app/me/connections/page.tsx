"use client";

/**
 * /me/connections — Connections Page
 *
 * Displays user's connections, followers, following, and friend requests.
 * Canonical URL under the "You" pillar.
 *
 * @version 2.0.0 - IA Unification (Jan 2026)
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
import {
  PeopleYouMayKnow,
  type UserSuggestion,
} from '@hive/ui';
import {
  revealVariants,
  staggerContainerVariants,
  cardHoverVariants,
} from '@hive/tokens';
import { useAuth } from '@hive/auth-logic';
import { useConnectionsEnabled } from '@/hooks/use-feature-flags';

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

type TabType = 'all' | 'friends' | 'following' | 'followers' | 'requests';

export default function ConnectionsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { enabled: connectionsEnabled, isLoading: flagsLoading } = useConnectionsEnabled();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [connections, setConnections] = useState<ConnectionData[]>([]);
  const [friends, setFriends] = useState<FriendData[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequestData[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequestData[]>([]);
  const [suggestions, setSuggestions] = useState<UserSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [stats, setStats] = useState<ConnectionStats>({
    totalConnections: 0,
    friends: 0,
    following: 0,
    followers: 0,
    pending: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const connectionsResponse = await fetch('/api/connections', {
        credentials: 'include'
      });

      if (!connectionsResponse.ok) {
        throw new Error('Failed to fetch connections');
      }

      const connectionsData = await connectionsResponse.json();

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

  // Fetch user suggestions
  const fetchSuggestions = useCallback(async () => {
    if (!user) return;

    try {
      setSuggestionsLoading(true);
      const response = await fetch('/api/users/suggestions?limit=10', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch {
      // Silently fail - suggestions are not critical
    } finally {
      setSuggestionsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user && connectionsEnabled) {
      fetchSuggestions();
    }
  }, [user, connectionsEnabled, fetchSuggestions]);

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

  // Handle connecting with a suggested user
  const handleSuggestionConnect = async (userId: string) => {
    await sendFriendRequest(userId);
    // Remove from suggestions after connecting
    setSuggestions(prev => prev.filter(s => s.user.id !== userId));
  };

  // Handle dismissing a suggestion
  const handleSuggestionDismiss = (userId: string) => {
    setSuggestions(prev => prev.filter(s => s.user.id !== userId));
  };

  // Handle viewing a suggested user's profile
  const handleSuggestionViewProfile = (userId: string, handle?: string) => {
    if (handle) {
      router.push(`/u/${handle}`);
    } else {
      router.push(`/profile/${userId}`);
    }
  };

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
        items = connections.map(c => ({
          id: c.profile?.id || c.connectionId,
          type: 'connection' as const,
          profile: c.profile,
          relationship: c.relationship,
          mutualSpaces: c.mutualSpaces,
          interactionCount: c.interactionCount,
        }));
    }

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

  if (!user) {
    router.push('/enter');
    return null;
  }

  // Feature flag gate - redirect if connections feature is not enabled
  if (!flagsLoading && !connectionsEnabled) {
    router.push('/me');
    return null;
  }

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
      <motion.div
        className="max-w-4xl mx-auto px-6 py-12"
        variants={staggerContainerVariants}
        initial="initial"
        animate="animate"
      >
        {/* Header */}
        <motion.div className="mb-10" variants={revealVariants}>
          <h1
            className="text-heading-sm font-semibold text-white mb-2 tracking-tight"
          >
            Connections
          </h1>
          <p className="text-white/50">
            Your network on HIVE
          </p>
        </motion.div>

        {/* People You May Know */}
        {(suggestionsLoading || suggestions.length > 0) && (
          <motion.div className="mb-8" variants={revealVariants}>
            <PeopleYouMayKnow
              suggestions={suggestions}
              isLoading={suggestionsLoading}
              onConnect={handleSuggestionConnect}
              onDismiss={handleSuggestionDismiss}
              onViewProfile={handleSuggestionViewProfile}
            />
          </motion.div>
        )}

        {/* Stats */}
        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8" variants={revealVariants}>
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
        <motion.div className="mb-6" variants={revealVariants}>
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
                    ? 'bg-white text-[var(--color-bg-void,#0A0A09)]'
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
        <motion.div className="mb-6" variants={revealVariants}>
          <Input
            placeholder="Search connections..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </motion.div>

        {/* Content */}
        <motion.div variants={revealVariants}>
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
              onBrowseSpaces={() => router.push('/home')}
            />
          ) : (
            <div className="grid gap-3">
              {filteredData.map((item) => {
                if (item.type === 'request') {
                  return null;
                }

                return (
                  <ConnectionCard
                    key={item.id}
                    profile={item.profile}
                    relationship={item.relationship}
                    mutualSpaces={item.mutualSpaces}
                    onViewProfile={() => {
                      const itemHandle = item.profile?.handle;
                      if (itemHandle) {
                        router.push(`/u/${itemHandle}`);
                      } else {
                        router.push(`/profile/${item.id}`);
                      }
                    }}
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
      </motion.div>
    </div>
  );
}

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
    <motion.div
      variants={cardHoverVariants}
      initial="rest"
      whileHover="hover"
    >
      <Card
        elevation="resting"
        interactive
        onClick={onViewProfile}
        className="p-4"
      >
        <div className="flex items-center gap-4">
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
    </motion.div>
  );
}

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
              &quot;{request.message}&quot;
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

function EmptyState({
  tab,
  onBrowseSpaces,
}: {
  tab: TabType;
  onBrowseSpaces: () => void;
}) {
  const messages: Record<TabType, { title: string; description: string; hint?: string; showCta?: boolean; ctaLabel?: string }> = {
    all: {
      title: 'Build your network',
      description: 'Join spaces and engage with others to make connections. Your classmates are waiting to meet you.',
      hint: 'Connections form naturally through shared spaces and interests',
      showCta: true,
      ctaLabel: 'Find Your Spaces',
    },
    friends: {
      title: 'No friends yet',
      description: 'Send friend requests to people you meet in spaces. Friends can see more of each other\'s activity.',
      hint: 'Look for the "Add Friend" button on profiles',
      showCta: true,
      ctaLabel: 'Find Classmates',
    },
    following: {
      title: 'Not following anyone',
      description: 'Follow interesting people to stay updated on their posts and events. It\'s a great way to learn from builders.',
      hint: 'Check out the "People" tab to discover who to follow',
      showCta: true,
      ctaLabel: 'Discover People',
    },
    followers: {
      title: 'No followers yet',
      description: 'As you participate in spaces and share your work, people will start following you.',
      hint: 'Post in spaces and engage with the community to grow your audience',
      showCta: false,
    },
    requests: {
      title: 'All caught up',
      description: 'No pending friend requests right now. When someone wants to connect, you\'ll see it here.',
      hint: 'You can also send requests to people you want to connect with',
      showCta: true,
      ctaLabel: 'Find Classmates',
    },
  };

  const { title, description, hint, showCta, ctaLabel } = messages[tab];

  return (
    <motion.div
      className="flex flex-col items-center justify-center py-16 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div
        className="w-16 h-16 rounded-xl bg-white/[0.04] flex items-center justify-center mb-5"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.1 }}
      >
        <svg className="w-7 h-7 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </motion.div>

      <motion.h3
        className="text-body-lg font-medium text-white/80 mb-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.15 }}
      >
        {title}
      </motion.h3>

      <motion.p
        className="text-body-sm text-white/40 max-w-sm mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: 0.2 }}
      >
        {description}
      </motion.p>

      {hint && (
        <motion.p
          className="text-label text-white/25 max-w-xs mb-6 italic"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.25 }}
        >
          {hint}
        </motion.p>
      )}

      {showCta && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.3 }}
        >
          <Button variant="cta" onClick={onBrowseSpaces}>
            {ctaLabel}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
