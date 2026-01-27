/**
 * HIVE Space Surface Manager
 * Admin interface for managing the Six Surfaces of each HIVE space
 */

"use client";

import React, { useState, useCallback } from "react";
import { Button as Button, HiveCard as Card, CardContent, Badge } from "@hive/ui";
import { ChatBubbleLeftIcon, BoltIcon, CalendarIcon, UsersIcon, DocumentTextIcon, InformationCircleIcon, Cog6ToothIcon, EyeIcon, PlusIcon, TrashIcon, ClockIcon, HashtagIcon, AcademicCapIcon, HomeIcon, HeartIcon, Square3Stack3DIcon } from '@heroicons/react/24/outline';

// Aliases for lucide compatibility
const Layers = Square3Stack3DIcon;

interface SpaceSurface {
  id: string;
  name: string;
  type: 'post_board' | 'tools' | 'events' | 'members' | 'resources' | 'about';
  isEnabled: boolean;
  permissions: {
    canView: string[];
    canPost: string[];
    canModerate: string[];
  };
  settings: {
    allowComments: boolean;
    requireApproval: boolean;
    enableNotifications: boolean;
    publiclyVisible: boolean;
  };
  analytics: {
    totalPosts: number;
    activeUsers: number;
    engagementRate: number;
    lastActivity: string;
  };
}

interface ToolSlot {
  id: string;
  position: number;
  tool?: {
    id: string;
    name: string;
    type: string;
    description: string;
    creator: string;
    usageCount: number;
    isActive: boolean;
  };
  isOccupied: boolean;
  category: 'academic_coordination' | 'community_tools' | 'social_features' | 'utility';
}

interface HiveSpace {
  id: string;
  name: string;
  type: 'student_organizations' | 'university_organizations' | 'greek_life' | 'campus_living' | 'hive_exclusive';
  subType: 'academic_major' | 'class_year' | 'university_organization' | 'dorm_building' | 'off_campus_area' | 'greek_chapter' | 'greek_council' | 'student_club' | 'interest_community' | 'user_created';
  surfaces: SpaceSurface[];
  toolSlots: ToolSlot[];
  maxToolSlots: number;
  memberCount: number;
  leadership: {
    id: string;
    name: string;
    role: 'leader' | 'co_leader' | 'moderator';
  }[];
}

interface HiveSpaceSurfaceManagerProps {
  space: HiveSpace;
  onUpdateSurface: (surfaceId: string, updates: Partial<SpaceSurface>) => Promise<void>;
  onRemoveTool: (slotId: string) => Promise<void>;
  enableFeatureFlag?: boolean;
}

const SurfaceCard: React.FC<{
  surface: SpaceSurface;
  onToggle: () => void;
  onEdit: () => void;
}> = ({ surface, onToggle, onEdit }) => {
  const getSurfaceIcon = (type: SpaceSurface['type']) => {
    switch (type) {
      case 'post_board': return <ChatBubbleLeftIcon className="w-5 h-5" />;
      case 'tools': return <BoltIcon className="w-5 h-5" />;
      case 'events': return <CalendarIcon className="w-5 h-5" />;
      case 'members': return <UsersIcon className="w-5 h-5" />;
      case 'resources': return <DocumentTextIcon className="w-5 h-5" />;
      case 'about': return <InformationCircleIcon className="w-5 h-5" />;
      default: return <HashtagIcon className="w-5 h-5" />;
    }
  };

  const getSurfaceColor = (type: SpaceSurface['type']) => {
    switch (type) {
      case 'post_board': return 'text-blue-400';
      case 'tools': return 'text-amber-400';
      case 'events': return 'text-green-400';
      case 'members': return 'text-purple-400';
      case 'resources': return 'text-orange-400';
      case 'about': return 'text-white/50';
      default: return 'text-white/50';
    }
  };

  const getSurfaceDescription = (type: SpaceSurface['type']) => {
    switch (type) {
      case 'post_board': return 'Community communication and discussions';
      case 'tools': return 'Functional capabilities and coordination tools';
      case 'events': return 'CalendarIcon view of community events';
      case 'members': return 'Directory and membership management';
      case 'resources': return 'File sharing and resource repository';
      case 'about': return 'Static community information and guidelines';
      default: return 'Space surface';
    }
  };

  return (
    <Card className={`border transition-all ${surface.isEnabled ? 'border-green-500/30 bg-green-500/5' : 'border-white/[0.12] bg-[var(--bg-ground)]/50'}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-[var(--bg-ground)] ${getSurfaceColor(surface.type)}`}>
              {getSurfaceIcon(surface.type)}
            </div>
            <div>
              <h3 className="font-semibold text-white capitalize">{surface.name.replace('_', ' ')}</h3>
              <p className="text-sm text-white/50">{getSurfaceDescription(surface.type)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={onEdit}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Cog6ToothIcon className="w-4 h-4" />
            </Button>
            <div className="flex items-center">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={surface.isEnabled}
                  onChange={onToggle}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-white/[0.12] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-white/[0.08] after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {surface.isEnabled && (
          <div className="space-y-3">
            {/* Analytics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-[var(--bg-ground)]/50 rounded">
                <div className="text-sm font-semibold text-white">{surface.analytics.totalPosts}</div>
                <div className="text-xs text-white/50">
                  {surface.type === 'tools' ? 'Tools' : surface.type === 'events' ? 'Events' : 'Posts'}
                </div>
              </div>
              <div className="text-center p-2 bg-[var(--bg-ground)]/50 rounded">
                <div className="text-sm font-semibold text-green-400">{surface.analytics.activeUsers}</div>
                <div className="text-xs text-white/50">Active UsersIcon</div>
              </div>
            </div>

            {/* Cog6ToothIcon Summary */}
            <div className="flex flex-wrap gap-1">
              {surface.settings.allowComments && (
                <Badge size="sm" className="bg-blue-500/10 text-blue-400">Comments</Badge>
              )}
              {surface.settings.requireApproval && (
                <Badge size="sm" className="bg-yellow-500/10 text-yellow-400">Approval</Badge>
              )}
              {surface.settings.enableNotifications && (
                <Badge size="sm" className="bg-green-500/10 text-green-400">Notifications</Badge>
              )}
              {surface.settings.publiclyVisible && (
                <Badge size="sm" className="bg-purple-500/10 text-purple-400">Public</Badge>
              )}
            </div>

            {/* Last Activity */}
            <div className="text-xs text-white/50 flex items-center space-x-1">
              <ClockIcon className="w-3 h-3" />
              <span>Last activity: {new Date(surface.analytics.lastActivity).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ToolSlotCard: React.FC<{
  slot: ToolSlot;
  spaceType: HiveSpace['type'];
  spaceSubType: HiveSpace['subType'];
  onInstall: () => void;
  onRemove: () => void;
  onEdit: () => void;
}> = ({ slot, spaceType, spaceSubType, onInstall, onRemove, onEdit }) => {
  const getCategoryColor = (category: ToolSlot['category']) => {
    switch (category) {
      case 'academic_coordination': return 'text-blue-400';
      case 'community_tools': return 'text-green-400';
      case 'social_features': return 'text-purple-400';
      case 'utility': return 'text-orange-400';
      default: return 'text-white/50';
    }
  };

  const getRecommendedTools = (spaceType: HiveSpace['type'], spaceSubType: HiveSpace['subType']) => {
    const baseTools = ['Event Planner', 'Quick Poll', 'Resource Sharing', 'Announcement System'];

    if (spaceType === 'university_organizations' && spaceSubType === 'academic_major') {
      return [...baseTools, 'Study Group Matcher', 'Project Team Builder', 'Course Coordination', 'Career Planning'];
    }

    if (spaceType === 'campus_living') {
      return [...baseTools, 'Floor Coordination', 'Maintenance Requests', 'Package Tracking', 'Community Guidelines'];
    }

    if (spaceType === 'greek_life') {
      return [...baseTools, 'Recruitment Tools', 'Chapter Management', 'Event RSVP', 'Brotherhood/Sisterhood'];
    }

    if (spaceType === 'student_organizations') {
      return [...baseTools, 'Member Directory', 'Project Collaboration', 'Meeting Scheduler', 'Interest Matching'];
    }

    if (spaceType === 'hive_exclusive') {
      return [...baseTools, 'Member Directory', 'Custom Branding', 'Meeting Scheduler', 'Goal Tracking'];
    }

    return baseTools;
  };

  const recommendedTools = getRecommendedTools(spaceType, spaceSubType);

  return (
    <Card className={`border transition-all ${slot.isOccupied ? 'border-amber-500/30 bg-amber-500/5' : 'border-dashed border-white/[0.12] bg-[var(--bg-ground)]/30'}`}>
      <CardContent className="p-4">
        {slot.isOccupied && slot.tool ? (
          // Occupied Slot
          <div>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-white">{slot.tool.name}</h3>
                <p className="text-sm text-white/50">{slot.tool.description}</p>
                <div className="flex items-center space-x-2 mt-1">
                  <Badge size="sm" className={getCategoryColor(slot.category)}>
                    {slot.category.replace('_', ' ')}
                  </Badge>
                  <span className="text-xs text-white/40">by {slot.tool.creator}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button size="sm" variant="ghost" onClick={onEdit}>
                  <Cog6ToothIcon className="w-4 h-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onRemove} className="text-red-400 hover:text-red-300">
                  <TrashIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="text-center p-2 bg-[var(--bg-ground)]/50 rounded">
                <div className="text-sm font-semibold text-white">{slot.tool.usageCount}</div>
                <div className="text-xs text-white/50">Uses</div>
              </div>
              <div className="text-center p-2 bg-[var(--bg-ground)]/50 rounded">
                <div className={`text-sm font-semibold ${slot.tool.isActive ? 'text-green-400' : 'text-white/50'}`}>
                  {slot.tool.isActive ? 'Active' : 'Inactive'}
                </div>
                <div className="text-xs text-white/50">Status</div>
              </div>
            </div>
          </div>
        ) : (
          // Empty Slot
          <div className="text-center">
            <div className="w-12 h-12 mx-auto mb-3 border-2 border-dashed border-white/[0.12] rounded-lg flex items-center justify-center">
              <PlusIcon className="w-6 h-6 text-white/30" />
            </div>
            <h3 className="font-medium text-white/50 mb-2">Tool Slot {slot.position}</h3>
            <p className="text-sm text-white/40 mb-3">Install a tool for your community</p>
            
            <Button size="sm" onClick={onInstall} className="bg-amber-500 hover:bg-amber-600 text-black">
              <PlusIcon className="w-4 h-4 mr-1" />
              Install Tool
            </Button>
            
            {/* Recommended Tools */}
            <div className="mt-3 pt-3 border-t border-white/[0.08]">
              <p className="text-xs text-white/40 mb-2">Recommended for {spaceSubType.replace('_', ' ')}:</p>
              <div className="flex flex-wrap gap-1">
                {recommendedTools.slice(0, 3).map((tool) => (
                  <Badge key={tool} size="sm" variant="outline" className="text-xs">
                    {tool}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const HiveSpaceSurfaceManager: React.FC<HiveSpaceSurfaceManagerProps> = ({
  space,
  onUpdateSurface,
  onRemoveTool,
  enableFeatureFlag = true
}) => {
  const [activeTab, setActiveTab] = useState<'surfaces' | 'tools'>('surfaces');

  const handleSurfaceToggle = useCallback(async (surface: SpaceSurface) => {
    await onUpdateSurface(surface.id, { isEnabled: !surface.isEnabled });
  }, [onUpdateSurface]);

  const handleToolInstall = useCallback(async (_slot: ToolSlot) => {
    // TODO: Open tool marketplace modal
    // setSelectedSlot(slot);
  }, []);

  const handleToolRemove = useCallback(async (slot: ToolSlot) => {
    await onRemoveTool(slot.id);
  }, [onRemoveTool]);

  const getSpaceTypeInfo = () => {
    const typeColors: Record<HiveSpace['type'], string> = {
      student_organizations: 'text-green-400',
      university_organizations: 'text-blue-400',
      greek_life: 'text-purple-400',
      campus_living: 'text-orange-400',
      hive_exclusive: 'text-amber-400',
    };

    const typeIcons: Record<HiveSpace['type'], typeof AcademicCapIcon> = {
      student_organizations: HeartIcon,
      university_organizations: AcademicCapIcon,
      greek_life: UsersIcon,
      campus_living: HomeIcon,
      hive_exclusive: HeartIcon,
    };

    const TypeIcon = typeIcons[space.type];

    return {
      color: typeColors[space.type],
      icon: <TypeIcon className="w-5 h-5" />,
      label: space.type.replace('_', ' '),
      subLabel: space.subType.replace('_', ' ')
    };
  };

  if (!enableFeatureFlag) {
    return (
      <div className="text-center py-8">
        <Cog6ToothIcon className="w-12 h-12 text-white/50 mx-auto mb-4" />
        <p className="text-white/50">Space surface management is not available</p>
      </div>
    );
  }

  const typeInfo = getSpaceTypeInfo();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className={`p-2 rounded-lg bg-[var(--bg-ground)] ${typeInfo.color}`}>
              {typeInfo.icon}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{space.name}</h2>
              <div className="flex items-center space-x-2 text-sm text-white/50">
                <span className="capitalize">{typeInfo.subLabel}</span>
                <span>•</span>
                <span>{space.memberCount} members</span>
                <span>•</span>
                <span>{space.toolSlots.filter(s => s.isOccupied).length}/{space.maxToolSlots} tools</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="border-white/[0.12] text-white/70"
          >
            <EyeIcon className="w-4 h-4 mr-2" />
            Preview Space
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center bg-[var(--bg-ground)]/50 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('surfaces')}
          className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'surfaces'
              ? 'bg-blue-600 text-white'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Six Surfaces</span>
          <Badge size="sm" className={activeTab === 'surfaces' ? 'bg-white/20' : 'bg-white/[0.08]'}>
            {space.surfaces.filter(s => s.isEnabled).length}/6
          </Badge>
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`flex-1 px-4 py-2 text-sm rounded-md transition-colors flex items-center justify-center gap-2 ${
            activeTab === 'tools'
              ? 'bg-amber-600 text-white'
              : 'text-white/50 hover:text-white'
          }`}
        >
          <BoltIcon className="w-4 h-4" />
          <span>Tool Slots</span>
          <Badge size="sm" className={activeTab === 'tools' ? 'bg-white/20' : 'bg-white/[0.08]'}>
            {space.toolSlots.filter(s => s.isOccupied).length}/{space.maxToolSlots}
          </Badge>
        </button>
      </div>

      {/* Content */}
      {activeTab === 'surfaces' ? (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">The Six Surfaces</h3>
            <p className="text-white/50 text-sm">
              Every HIVE space has six consistent surfaces. Enable and configure each surface for your community.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {space.surfaces.map((surface) => (
              <SurfaceCard
                key={surface.id}
                surface={surface}
                onToggle={() => handleSurfaceToggle(surface)}
                onEdit={() => {/* setSelectedSurface(surface) */}}
              />
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-white mb-2">Tool Slots ({space.toolSlots.filter(s => s.isOccupied).length}/{space.maxToolSlots})</h3>
            <p className="text-white/50 text-sm">
              Tools provide all functional capabilities within your space. Install tools that help your community coordinate and collaborate.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {space.toolSlots.map((slot) => (
              <ToolSlotCard
                key={slot.id}
                slot={slot}
                spaceType={space.type}
                spaceSubType={space.subType}
                onInstall={() => handleToolInstall(slot)}
                onRemove={() => handleToolRemove(slot)}
                onEdit={() => {/* setSelectedSlot(slot) */}}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
