import type {
  ProfileSystem,
  BentoGridLayout,
  ProfileSystemConnection as Connection,
  Friend,
  ProfileBadge as Badge,
} from "@hive/core";
import { ProfileSystemConnectionType as ConnectionType } from "@hive/core";

// Mirror the VisibilityLevel enum from @hive/core/types/profile-system
enum VisibilityLevel {
  GHOST = 'ghost',
  FRIENDS_ONLY = 'friends',
  CONNECTIONS = 'connections',
  CAMPUS = 'campus'
}

const mapVisibilityLevel = (level?: string): VisibilityLevel => {
  switch (level) {
    case 'ghost':
    case 'private':
      return VisibilityLevel.GHOST;
    case 'friends':
    case 'friends_only':
      return VisibilityLevel.FRIENDS_ONLY;
    case 'connections':
      return VisibilityLevel.CONNECTIONS;
    case 'campus':
    case 'public':
    default:
      return VisibilityLevel.CAMPUS;
  }
};

type ViewerMeta = {
  relationship: "self" | "friend" | "connection" | "campus";
  isOwnProfile: boolean;
  isConnection: boolean;
  isFriend: boolean;
};

type ApiConnection = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  sharedSpaces?: string[];
  isFriend?: boolean;
  connectionStrength?: number;
  mutualConnections?: number;
  lastInteractionAt?: string | null;
};

type ApiSpace = {
  id: string;
  name: string;
  role: string;
  memberCount: number;
  lastActivityAt?: string;
  headline?: string;
  imageUrl?: string;
};

type ApiSuggestion = {
  id: string;
  name: string;
  reason: string;
  category?: string;
};

export type ProfileV2ApiResponse = {
  profile: {
    id: string;
    handle: string;
    fullName: string;
    firstName: string;
    lastName: string;
    campusId: string;
    avatarUrl?: string | null;
    pronouns?: string | null;
    bio?: string;
    major?: string;
    graduationYear?: number | null;
    interests?: string[];
    badges?: string[];
    presence?: {
      status?: string;
      lastSeen?: string | null;
      isGhostMode?: boolean;
    };
    stats?: {
      spacesJoined?: number;
      connections?: number;
      friends?: number;
      toolsCreated?: number;
      activeRituals?: number;
      reputation?: number;
      currentStreak?: number;
    };
  };
  grid: {
    cards: Array<Record<string, unknown>>;
    mobileLayout: Array<Record<string, unknown>>;
    lastModified?: string;
  };
  stats: ProfileV2ApiResponse["profile"]["stats"];
  spaces: ApiSpace[];
  connections: ApiConnection[];
  activities: Array<Record<string, unknown>>;
  intelligence?: {
    suggestions?: ApiSuggestion[];
  };
  viewer: ViewerMeta;
  privacy: {
    profileLevel: string;
    widgets: Record<string, string | undefined>;
  };
};

const toDate = (value: string | number | Date | null | undefined): Date => {
  if (!value) return new Date();
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const buildConnections = (connections: ApiConnection[]): {
  friends: Friend[];
  others: Connection[];
  summaries: Array<Connection & { displayName?: string; avatarUrl?: string | null }>;
} => {
  const friends: Friend[] = [];
  const others: Connection[] = [];
  const summaries: Array<Connection & { displayName?: string; avatarUrl?: string | null }> = [];

  connections.forEach((conn) => {
    const sharedSpaces = Array.isArray(conn.sharedSpaces) ? conn.sharedSpaces : [];
    const connectedAt = toDate(conn.lastInteractionAt);

    if (conn.isFriend) {
      const friend: Friend = {
        userId: conn.id,
        type: ConnectionType.FRIEND,
        sharedSpaces,
        connectedAt,
        lastInteraction: connectedAt,
        mutualFriends: conn.mutualConnections ?? 0,
        friendsSince: connectedAt,
      };
      friends.push(friend);
      summaries.push({ ...friend, displayName: conn.name, avatarUrl: conn.avatarUrl ?? null });
    } else {
      const connection: Connection = {
        userId: conn.id,
        type: ConnectionType.CONNECTION,
        sharedSpaces,
        connectedAt,
        lastInteraction: conn.lastInteractionAt ? connectedAt : undefined,
      };
      others.push(connection);
      summaries.push({ ...connection, displayName: conn.name, avatarUrl: conn.avatarUrl ?? null });
    }
  });

  return { friends, others, summaries };
};

const buildSuggestions = (suggestions: ApiSuggestion[] | undefined) => {
  if (!Array.isArray(suggestions)) return [];
  return suggestions.map((suggestion) => ({
    userId: suggestion.id,
    score: 0.75,
    name: suggestion.name,
    reason: suggestion.reason,
    reasons: [suggestion.reason],
    factors: {
      mutualFriends: 0,
      sharedSpaces: 0,
      scheduleOverlap: 0,
      academicMatch: 0,
      interactionStyle: 0,
    },
  }));
};

const buildGrid = (grid: ProfileV2ApiResponse["grid"]): BentoGridLayout => ({
  cards: grid.cards as unknown as BentoGridLayout["cards"],
  mobileLayout: grid.mobileLayout as unknown as BentoGridLayout["mobileLayout"],
  lastModified: toDate(grid.lastModified ?? Date.now()),
});

const buildBadges = (badges: string[] | undefined): Badge[] => {
  if (!Array.isArray(badges)) return [];
  return badges.map((badge, index): Badge => ({
    id: badge,
    type: "builder",
    name: badge,
    description: badge,
    earnedAt: new Date(Date.now() - index * 86400000),
    displayOrder: index,
  }));
};

export const profileApiResponseToProfileSystem = (payload: ProfileV2ApiResponse): ProfileSystem => {
  const { profile, grid, connections, intelligence, stats } = payload;
  const now = new Date();
  const { friends, others, summaries } = buildConnections(connections);
  const suggestions = buildSuggestions(intelligence?.suggestions);
  const primaryStats = stats ?? profile.stats ?? {};

  const system: ProfileSystem = {
    userId: profile.id,
    campusId: profile.campusId || 'ub-buffalo',
    handle: profile.handle || '',
    identity: {
      academic: {
        name: profile.fullName,
        majors: profile.major ? [profile.major] : [],
        minors: [],
        year: 'junior' as 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate',
        pronouns: profile.pronouns ?? undefined,
        graduationYear: profile.graduationYear ?? now.getFullYear(),
      },
      photoCarousel: {
        photos: [],
        currentIndex: 0,
        rotationInterval: 30000,
        lastUpdated: now,
        freshnessThreshold: 1000 * 60 * 60 * 24 * 42,
      },
      badges: buildBadges(profile.badges),
    },
    connections: {
      friends,
      connections: others,
      pendingRequests: [],
      blockedUsers: [],
    },
    presence: {
      vibe: profile.presence?.status === 'online' ? '🎯 Thriving' : '😮‍💨 Surviving',
      vibeUpdatedAt: now,
      lastActive: toDate(profile.presence?.lastSeen ?? Date.now()),
      isOnline: profile.presence?.status === 'online',
    },
    grid: buildGrid(grid),
    privacy: {
      ghostMode: profile.presence?.isGhostMode ?? false,
      visibilityLevel: mapVisibilityLevel(payload.privacy?.profileLevel),
      scheduleSharing: { friends: true, connections: true },
      availabilityBroadcast: { friends: true, connections: false, campus: false },
      discoveryParticipation: true,
      spaceActivityVisibility: new Map<string, boolean>(),
    },
    intelligence: {
      schedule: [],
      overlaps: [],
      suggestions,
      lastCalculated: now,
    },
    createdAt: now,
    updatedAt: now,
    completeness: (primaryStats as Record<string, unknown> | undefined)?.completionPercentage as number ?? 70,
    isSetupComplete: true,
  };

  (system as unknown as Record<string, unknown>).stats = {
    ...primaryStats,
  };
  (system as unknown as Record<string, unknown>).spaces = payload.spaces;
  (system as unknown as Record<string, unknown>).activities = payload.activities;
  (system as unknown as Record<string, unknown>).connectionSummaries = summaries;
  (system as unknown as Record<string, unknown>).viewer = payload.viewer;

  return system;
};

// Retained helper for edit page bootstrap when only partial profile is available
export function toProfileSystemFromMinimal(specLike: Record<string, unknown>): ProfileSystem {
  const now = new Date();
  return {
    userId: (specLike.userId as string) || 'me',
    campusId: (specLike.campusId as string) || 'ub-buffalo',
    handle: (specLike.handle as string) || '',
    identity: {
      academic: {
        name: ((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.name as string || (specLike.fullName as string) || 'Student',
        year: (((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.year as 'freshman' | 'sophomore' | 'junior' | 'senior' | 'graduate') || 'junior',
        majors: ((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.majors as string[] || (specLike.major ? [specLike.major as string] : []),
        minors: (((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.minors as string[]) || [],
        pronouns: ((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.pronouns as string | undefined,
        graduationYear: (((specLike.identity as Record<string, unknown> | undefined)?.academic as Record<string, unknown> | undefined)?.graduationYear as number) || new Date().getFullYear(),
      },
      photoCarousel: {
        photos: [],
        currentIndex: 0,
        rotationInterval: 30000,
        lastUpdated: now,
        freshnessThreshold: 1000 * 60 * 60 * 24 * 42,
      },
      badges: [],
    },
    connections: { friends: [], connections: [], pendingRequests: [], blockedUsers: [] },
    presence: {
      vibe: ((specLike.presence as Record<string, unknown> | undefined)?.vibe as string) || '🎯 Thriving',
      vibeUpdatedAt: now,
      lastActive: now,
      isOnline: true,
    },
    grid: (specLike.grid as BentoGridLayout) || ({ cards: [], mobileLayout: [], lastModified: now } as BentoGridLayout),
    privacy: (specLike.privacy as ProfileSystem["privacy"]) || {
      ghostMode: false,
      visibilityLevel: VisibilityLevel.CAMPUS,
      scheduleSharing: { friends: true, connections: false },
      availabilityBroadcast: { friends: true, connections: false, campus: false },
      discoveryParticipation: true,
      spaceActivityVisibility: new Map<string, boolean>(),
    },
    intelligence: { schedule: [], overlaps: [], suggestions: [], lastCalculated: now },
    createdAt: (specLike.createdAt as Date) || now,
    updatedAt: (specLike.updatedAt as Date) || now,
    completeness: (specLike.completeness as number) || 60,
    isSetupComplete: (specLike.isSetupComplete as boolean) ?? true,
  };
}
