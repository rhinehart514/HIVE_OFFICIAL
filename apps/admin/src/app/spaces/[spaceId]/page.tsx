"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useAdminAuth } from "@/lib/auth";
import { Button, Badge, HiveCard as Card, CardContent, CardHeader, CardTitle } from "@hive/ui";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  UsersIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  WrenchIcon,
  ShieldCheckIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  PlayIcon,
  PauseIcon,
  ArchiveBoxIcon,
  PencilIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";

// Aliases
const ArrowLeft = ArrowLeftIcon;
const RefreshCw = ArrowPathIcon;
const Users = UsersIcon;
const MessageSquare = ChatBubbleLeftIcon;
const Calendar = CalendarIcon;
const Wrench = WrenchIcon;
const Shield = ShieldCheckIcon;
const Settings = Cog6ToothIcon;
const BarChart = ChartBarIcon;
const AlertTriangle = ExclamationTriangleIcon;
const CheckCircle = CheckCircleIcon;
const XCircle = XCircleIcon;
const Clock = ClockIcon;
const Play = PlayIcon;
const Pause = PauseIcon;
const Archive = ArchiveBoxIcon;
const Edit = PencilIcon;
const Globe = GlobeAltIcon;

interface SpaceDetail {
  id: string;
  name: string;
  handle?: string;
  description: string;
  type: string;
  category: string;
  status: string;
  activationStatus: 'ghost' | 'gathering' | 'open';
  isVerified: boolean;
  isFeatured: boolean;
  campusId: string;
  campusName?: string;
  memberCount: number;
  activationThreshold: number;
  healthScore: number;
  createdAt: string;
  updatedAt: string;
  activatedAt?: string;
  surfaces: {
    chat: boolean;
    events: boolean;
    tools: boolean;
    members: boolean;
  };
  internalMetrics?: {
    memberCount: number;
    trendingScore: number;
    postCount: number;
  };
  moderationInfo?: {
    flags: number;
    reports: number;
    lastReviewedAt?: string;
  };
}

interface SpaceMember {
  id: string;
  userId: string;
  displayName: string;
  email?: string;
  role: 'admin' | 'leader' | 'member';
  joinedAt: string;
  isFoundingMember: boolean;
}

interface ActivityMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorHandle?: string;
  createdAt: string;
  type: 'text' | 'image' | 'file' | 'system';
}

interface ActivityEvent {
  id: string;
  title: string;
  description?: string;
  startAt: string;
  endAt?: string;
  creatorId: string;
  creatorName: string;
  attendeeCount: number;
}

interface ActivityTool {
  id: string;
  name: string;
  type: string;
  deployedAt: string;
  deployedBy: string;
  deployedByName: string;
}

interface SpaceActivity {
  recentMessages: ActivityMessage[];
  recentEvents: ActivityEvent[];
  recentTools: ActivityTool[];
  stats: {
    totalMessages: number;
    totalEvents: number;
    totalTools: number;
  };
}

type TabId = 'overview' | 'members' | 'activity' | 'moderation' | 'settings';

const tabs: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart },
  { id: 'members', label: 'Members', icon: Users },
  { id: 'activity', label: 'Activity', icon: MessageSquare },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function SpaceDetailPage({ params }: { params: Promise<{ spaceId: string }> }) {
  const { spaceId } = use(params);
  const { admin } = useAdminAuth();

  const [space, setSpace] = useState<SpaceDetail | null>(null);
  const [members, setMembers] = useState<SpaceMember[]>([]);
  const [activity, setActivity] = useState<SpaceActivity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [actionLoading, setActionLoading] = useState(false);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchSpace = useCallback(async () => {
    if (!admin) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/spaces/${spaceId}`, {
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch space');
      }

      const data = await response.json();
      setSpace(data.data?.space || data.space);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load space');
    } finally {
      setLoading(false);
    }
  }, [admin, spaceId]);

  const fetchMembers = useCallback(async () => {
    if (!admin || activeTab !== 'members') return;

    try {
      const response = await fetch(`/api/admin/spaces/${spaceId}/members`, {
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMembers(data.data?.members || data.members || []);
      }
    } catch {
      // Members endpoint may not exist yet - that's ok
    }
  }, [admin, spaceId, activeTab]);

  const fetchActivity = useCallback(async () => {
    if (!admin || activeTab !== 'activity') return;

    setActivityLoading(true);
    try {
      const response = await fetch(`/api/admin/spaces/${spaceId}/activity`, {
        headers: {
          'Authorization': `Bearer ${admin.id}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const activityData = data.data || data;
        setActivity({
          recentMessages: activityData.recentMessages || [],
          recentEvents: activityData.recentEvents || [],
          recentTools: activityData.recentTools || [],
          stats: activityData.stats || { totalMessages: 0, totalEvents: 0, totalTools: 0 },
        });
      }
    } catch {
      // Activity endpoint may not exist yet - that's ok
    } finally {
      setActivityLoading(false);
    }
  }, [admin, spaceId, activeTab]);

  const handleAction = async (action: string, reason?: string) => {
    if (!admin) return;

    setActionLoading(true);
    try {
      const response = await fetch(`/api/admin/spaces/${spaceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${admin.id}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${action} space`);
      }

      await fetchSpace();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchSpace();
  }, [fetchSpace]);

  useEffect(() => {
    if (activeTab === 'members') {
      fetchMembers();
    }
    if (activeTab === 'activity') {
      fetchActivity();
    }
  }, [fetchMembers, fetchActivity, activeTab]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (error || !space) {
    return (
      <div className="space-y-4">
        <Link href="/spaces" className="inline-flex items-center gap-2 text-white/50 hover:text-white">
          <ArrowLeft className="h-4 w-4" />
          Back to Spaces
        </Link>
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-red-400" />
              <div>
                <h3 className="text-lg font-medium text-white">Error Loading Space</h3>
                <p className="text-red-400">{error || 'Space not found'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'activated': return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'dormant': return <Clock className="h-5 w-5 text-white/50" />;
      case 'frozen': return <XCircle className="h-5 w-5 text-red-400" />;
      default: return <Clock className="h-5 w-5 text-white/50" />;
    }
  };

  const getActivationBadge = (status: string) => {
    switch (status) {
      case 'ghost': return <Badge className="bg-white/[0.08] text-white/50">Ghost</Badge>;
      case 'gathering': return <Badge className="bg-blue-500/20 text-blue-400">Gathering</Badge>;
      case 'open': return <Badge className="bg-green-500/20 text-green-400">Open</Badge>;
      default: return null;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 70) return 'text-green-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link href="/spaces" className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Spaces
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center">
            <Globe className="h-8 w-8 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{space.name}</h1>
              {space.isVerified && (
                <Badge className="bg-blue-500/20 text-blue-400">Verified</Badge>
              )}
              {space.isFeatured && (
                <Badge className="bg-amber-500/20 text-amber-400">Featured</Badge>
              )}
            </div>
            {space.handle && (
              <p className="text-white/50 mt-1">@{space.handle}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              {getStatusIcon(space.status)}
              <span className="text-white capitalize">{space.status}</span>
              <span className="text-white/30">·</span>
              {getActivationBadge(space.activationStatus)}
              <span className="text-white/30">·</span>
              <span className={getHealthColor(space.healthScore)}>
                Health: {space.healthScore}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={fetchSpace}
            disabled={loading}
            variant="outline"
            className="border-white/[0.12] text-white/70"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          {space.status === 'activated' ? (
            <Button
              onClick={() => handleAction('disable', 'Admin action')}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              <Pause className="h-4 w-4 mr-2" />
              Disable
            </Button>
          ) : (
            <Button
              onClick={() => handleAction('enable')}
              disabled={actionLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Enable
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-white/[0.08] pb-px">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative
                ${isActive
                  ? 'text-amber-400'
                  : 'text-white/50 hover:text-white'
                }
              `}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {isActive && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-400" />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Info */}
          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/50">ID</span>
                <span className="text-white font-mono text-sm">{space.id.slice(0, 8)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Type</span>
                <span className="text-white capitalize">{space.type?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Category</span>
                <span className="text-white capitalize">{space.category?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Campus</span>
                <span className="text-white">{space.campusName || space.campusId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Created</span>
                <span className="text-white">{new Date(space.createdAt).toLocaleDateString()}</span>
              </div>
              {space.activatedAt && (
                <div className="flex justify-between">
                  <span className="text-white/50">Activated</span>
                  <span className="text-white">{new Date(space.activatedAt).toLocaleDateString()}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activation Progress */}
          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Activation Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-white/50">Current Phase</span>
                {getActivationBadge(space.activationStatus)}
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/50">Progress</span>
                  <span className="text-white">
                    {space.memberCount}/{space.activationThreshold}
                  </span>
                </div>
                <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (space.memberCount / space.activationThreshold) * 100)}%`
                    }}
                  />
                </div>
              </div>
              <div className="flex justify-between">
                <span className="text-white/50">Health Score</span>
                <span className={`font-semibold ${getHealthColor(space.healthScore)}`}>
                  {space.healthScore}/100
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Surfaces */}
          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Active Surfaces</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(space.surfaces).map(([surface, enabled]) => (
                <div key={surface} className="flex items-center justify-between">
                  <span className="text-white/50 capitalize flex items-center gap-2">
                    {surface === 'chat' && <MessageSquare className="h-4 w-4" />}
                    {surface === 'events' && <Calendar className="h-4 w-4" />}
                    {surface === 'tools' && <Wrench className="h-4 w-4" />}
                    {surface === 'members' && <Users className="h-4 w-4" />}
                    {surface}
                  </span>
                  <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-white/20'}`} />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Description */}
          <Card className="border-white/[0.08] bg-[#141414] lg:col-span-3">
            <CardHeader>
              <CardTitle className="text-white text-lg">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/70">
                {space.description || 'No description provided.'}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'members' && (
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">
                Members ({members.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-white/30 mx-auto mb-3" />
                <p className="text-white/50">No members yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {members.map(member => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg hover:bg-white/[0.04] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/[0.08] flex items-center justify-center">
                        <Users className="h-5 w-5 text-white/50" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{member.displayName}</span>
                          {member.isFoundingMember && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-xs">Founder</Badge>
                          )}
                        </div>
                        {member.email && (
                          <span className="text-white/40 text-sm">{member.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        className={
                          member.role === 'admin' ? 'bg-purple-500/20 text-purple-400' :
                          member.role === 'leader' ? 'bg-amber-500/20 text-amber-400' :
                          'bg-white/[0.08] text-white/50'
                        }
                      >
                        {member.role}
                      </Badge>
                      <span className="text-white/40 text-sm">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-6">
          {/* Activity Stats */}
          {activity && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-white/[0.08] bg-[#141414]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <MessageSquare className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Total Messages</p>
                      <p className="text-2xl font-bold text-white">{activity.stats.totalMessages}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/[0.08] bg-[#141414]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Total Events</p>
                      <p className="text-2xl font-bold text-white">{activity.stats.totalEvents}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-white/[0.08] bg-[#141414]">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20">
                      <Wrench className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm text-white/50">Tools Deployed</p>
                      <p className="text-2xl font-bold text-white">{activity.stats.totalTools}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Messages */}
          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-400" />
                Recent Messages
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLoading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin text-white/50" />
                </div>
              ) : !activity || activity.recentMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-white/30 mx-auto mb-3" />
                  <p className="text-white/50">No messages yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {activity.recentMessages.map(msg => (
                    <div key={msg.id} className="p-3 bg-white/[0.02] rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium text-sm">{msg.authorName}</span>
                        {msg.authorHandle && (
                          <span className="text-white/40 text-xs">@{msg.authorHandle}</span>
                        )}
                        <span className="text-white/30 text-xs ml-auto">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm line-clamp-2">{msg.content}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Events */}
          {activity && activity.recentEvents.length > 0 && (
            <Card className="border-white/[0.08] bg-[#141414]">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-400" />
                  Recent Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {activity.recentEvents.map(event => (
                    <div key={event.id} className="p-3 bg-white/[0.02] rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-medium">{event.title}</span>
                        <Badge className="bg-purple-500/20 text-purple-400">
                          {event.attendeeCount} attendees
                        </Badge>
                      </div>
                      <p className="text-white/50 text-sm">
                        {new Date(event.startAt).toLocaleString()} · Created by {event.creatorName}
                      </p>
                      {event.description && (
                        <p className="text-white/40 text-sm mt-1 line-clamp-1">{event.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Tools */}
          {activity && activity.recentTools.length > 0 && (
            <Card className="border-white/[0.08] bg-[#141414]">
              <CardHeader>
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-amber-400" />
                  Recently Deployed Tools
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {activity.recentTools.map(tool => (
                    <div key={tool.id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-lg">
                      <div>
                        <span className="text-white font-medium">{tool.name}</span>
                        <p className="text-white/40 text-sm">
                          Deployed by {tool.deployedByName}
                        </p>
                      </div>
                      <span className="text-white/30 text-xs">
                        {new Date(tool.deployedAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {activeTab === 'moderation' && (
        <div className="space-y-6">
          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Moderation Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-white/[0.02] rounded-lg">
                  <span className="text-white/50 text-sm">Active Flags</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {space.moderationInfo?.flags || 0}
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-lg">
                  <span className="text-white/50 text-sm">Reports</span>
                  <p className="text-2xl font-bold text-white mt-1">
                    {space.moderationInfo?.reports || 0}
                  </p>
                </div>
                <div className="p-4 bg-white/[0.02] rounded-lg">
                  <span className="text-white/50 text-sm">Last Reviewed</span>
                  <p className="text-lg font-medium text-white mt-1">
                    {space.moderationInfo?.lastReviewedAt
                      ? new Date(space.moderationInfo.lastReviewedAt).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/[0.08] bg-[#141414]">
            <CardHeader>
              <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Warn Leader
              </Button>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Freeze Space
              </Button>
              <Link href={`/spaces/${spaceId}/moderation`}>
                <Button
                  variant="outline"
                  className="border-white/[0.12] text-white/70"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  View Full Queue
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <Card className="border-white/[0.08] bg-[#141414]">
          <CardHeader>
            <CardTitle className="text-white text-lg">Space Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-white font-medium">Administrative Actions</h4>
              <div className="flex flex-wrap gap-3">
                {!space.isVerified ? (
                  <Button
                    onClick={() => handleAction('verify')}
                    disabled={actionLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verify Space
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction('unverify', 'Admin unverify')}
                    disabled={actionLoading}
                    variant="outline"
                    className="border-blue-500/30 text-blue-400"
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Remove Verification
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-amber-500/30 text-amber-400"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Details
                </Button>

                <Button
                  variant="outline"
                  className="border-white/[0.12] text-white/50"
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive Space
                </Button>
              </div>
            </div>

            <div className="border-t border-white/[0.08] pt-6">
              <h4 className="text-white font-medium mb-4">Danger Zone</h4>
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              >
                <XCircle className="h-4 w-4 mr-2" />
                Permanently Delete Space
              </Button>
              <p className="text-white/40 text-sm mt-2">
                This action cannot be undone. All data will be permanently removed.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
