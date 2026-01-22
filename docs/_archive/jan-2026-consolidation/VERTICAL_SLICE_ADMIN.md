# Vertical Slice: Admin Panel

## Module Status: 70% Complete

**Purpose:** Platform-wide administration, analytics, and moderation control center for HIVE operators.

**Launch Priority:** Secondary (enables soft launch monitoring but not user-facing)

---

## Architecture Overview

```
apps/admin/                     # Standalone Next.js app (port 3001)
├── src/
│   ├── app/
│   │   ├── dashboard/page.tsx  # Main dashboard entry
│   │   ├── ai-quality/page.tsx # AI generation monitoring
│   │   ├── builder-requests/   # Builder approval queue
│   │   ├── spaces/             # Space administration
│   │   ├── rituals/            # Ritual management
│   │   └── auth/login/         # Admin authentication
│   ├── components/
│   │   ├── comprehensive-admin-dashboard.tsx  # Main dashboard (255 lines)
│   │   ├── admin-navigation.tsx               # Tab system (93 lines)
│   │   ├── metric-cards.tsx                   # Quick stats (194 lines)
│   │   ├── builder-queue-enhanced.tsx         # Approval queue (225 lines)
│   │   ├── content-moderation-dashboard.tsx   # Moderation (466 lines)
│   │   ├── analytics-dashboard.tsx            # Platform analytics (372 lines)
│   │   └── space-management-dashboard.tsx     # Space admin
│   └── lib/
│       └── auth.ts                            # useAdminAuth hook

apps/web/src/app/api/admin/
├── analytics/comprehensive/route.ts  # Platform metrics (473 lines)
├── builder-requests/route.ts         # Approval workflow (255 lines)
├── ai-quality/metrics/route.ts       # AI tracking (143 lines)
├── content-moderation/route.ts       # Flagged content
├── dashboard/route.ts                # Quick stats
└── seed-school/route.ts              # Data seeding
```

---

## Core Component: ComprehensiveAdminDashboard

**Location:** `apps/admin/src/components/comprehensive-admin-dashboard.tsx` (255 lines)

The main admin interface with 7 tabs:

```typescript
const tabs = [
  { id: 'overview',  label: 'Overview',  icon: '🏠' },  // Key metrics + health
  { id: 'users',     label: 'Users',     icon: '👥' },  // User management
  { id: 'spaces',    label: 'Spaces',    icon: '🏢' },  // Space admin
  { id: 'content',   label: 'Content',   icon: '📝' },  // Moderation
  { id: 'builders',  label: 'Builders',  icon: '🔨' },  // Approval queue
  { id: 'analytics', label: 'Analytics', icon: '📊' },  // Deep analytics
  { id: 'system',    label: 'System',    icon: '⚙️' },  // Config + flags
];
```

### Tab Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ HIVE Admin Dashboard                            admin@hive.io   │
│ Complete platform control and oversight         ● super_admin   │
├─────────────────────────────────────────────────────────────────┤
│ [Overview] [Users] [Spaces] [Content 3] [Builders 5] [Analytics]│
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Tab Content Area                                              │
│                                                                  │
│   - MetricCards (overview)                                      │
│   - BuilderQueueEnhanced (builders)                             │
│   - ContentModerationDashboard (content)                        │
│   - AnalyticsDashboard (analytics)                              │
│   - System configuration (system)                               │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│ System Status: Healthy    Last Updated: 3:45 PM    HIVE v1.0.0 │
└─────────────────────────────────────────────────────────────────┘
```

### Pending Counts with Real-time Updates

```typescript
// Auto-refresh every 30 seconds
const fetchPendingCounts = useCallback(async () => {
  const [builderResponse, contentResponse] = await Promise.all([
    fetch('/api/admin/builder-requests'),
    fetch('/api/admin/content-moderation'),
  ]);

  setPendingCounts({
    builderRequests: builderData.requests?.filter(r => r.status === 'pending').length || 0,
    flaggedContent: contentData.flaggedContent?.filter(c => c.status === 'pending').length || 0,
    userReports: 0,  // TODO: Implement
  });
}, [admin]);

useEffect(() => {
  fetchPendingCounts();
  const interval = setInterval(fetchPendingCounts, 30000);
  return () => clearInterval(interval);
}, [fetchPendingCounts]);
```

---

## Metric Cards: Quick Platform Stats

**Location:** `apps/admin/src/components/metric-cards.tsx` (194 lines)

Displays key platform health indicators at a glance:

```
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ Total Users  │ │ Conversion   │ │ Drop-off     │ │ Active Tools │
│     247      │ │    78.3%     │ │   21.7%      │ │      15      │
│ Registered   │ │ Onboarding   │ │ Abandonment  │ │ Deployed     │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘

┌────────────────────────────────────────────────────────────────┐
│ ⚠️  3 items require moderation                                 │
│    Check the Content Flags section below                       │
└────────────────────────────────────────────────────────────────┘
```

### Data Source

```typescript
// Fetches from comprehensive analytics API
const response = await fetch('/api/admin/analytics/comprehensive?timeRange=30d');
const platformMetrics = data.data?.platformMetrics || {};

// Calculates conversion rate from onboarding completion
const conversionRate = totalUsers > 0
  ? Math.round((completedOnboarding / totalUsers) * 1000) / 10
  : 0;

setMetrics({
  totalUsers: platformMetrics.totalUsers || 0,
  conversionRate,
  onboardingDropOff: 100 - conversionRate,
  activeBuilders: platformMetrics.activeTools || 0,
  flaggedContent: data.data?.violationAnalytics?.pendingViolations || 0,
});
```

---

## Builder Request Approval Queue

**Location:** `apps/admin/src/components/builder-queue-enhanced.tsx` (225 lines)

**Purpose:** Approve or reject requests from users who want to become space leaders/builders.

### Request Interface

```typescript
interface BuilderRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  spaceId: string;
  spaceName: string;
  reason: string;        // Why they want to lead
  experience: string;    // Their leadership experience
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  urgency: 'normal' | 'urgent';
}
```

### UI Layout

```
┌────────────────────────────────────────────────────────────────┐
│ Builder Queue                    [5 pending] [2 urgent] [↻]   │
├────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ John Smith                                [URGENT]         │ │
│ │ johnsmith@buffalo.edu                                      │ │
│ │ Space: Computer Science Club                               │ │
│ │                                                            │ │
│ │ Reason: I'm the current president of CS Club...           │ │
│ │ Experience: Led 3 student orgs, organized hackathon...    │ │
│ │                                                            │ │
│ │ Submitted 2 hours ago              [Reject] [✓ Approve]   │ │
│ └────────────────────────────────────────────────────────────┘ │
│ ┌────────────────────────────────────────────────────────────┐ │
│ │ Jane Doe                                                   │ │
│ │ janedoe@buffalo.edu                                        │ │
│ │ Space: Photography Club                                    │ │
│ │ ...                                                        │ │
│ └────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

### Approval Workflow

```typescript
const handleRequest = async (requestId: string, action: 'approve' | 'reject') => {
  const response = await fetch('/api/admin/builder-requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${admin.id}`,
    },
    body: JSON.stringify({ requestId, action }),
  });

  // Backend updates:
  // 1. builderRequest.status = action === 'approve' ? 'approved' : 'rejected'
  // 2. builderRequest.reviewedAt = now
  // 3. builderRequest.reviewedBy = adminId
  // 4. If approved: spaceMembers[userId].role = 'leader'
  // 5. Send notification to user

  await fetchRequests();  // Refresh list
};
```

---

## Comprehensive Analytics API

**Location:** `apps/web/src/app/api/admin/analytics/comprehensive/route.ts` (473 lines)

**Purpose:** Aggregates platform-wide metrics for admin dashboard.

### Query Strategy

```typescript
// Parallel Firestore queries for performance
const [
  usersSnapshot,
  spacesSnapshot,
  postsSnapshot,
  eventsSnapshot,
  toolsSnapshot,
] = await Promise.all([
  dbAdmin.collection('profiles')
    .where('campusId', '==', campusId)
    .where('onboardingComplete', '==', true)
    .get(),
  dbAdmin.collection('spaces')
    .where('campusId', '==', campusId)
    .get(),
  dbAdmin.collection('posts')
    .where('campusId', '==', campusId)
    .where('createdAt', '>=', periodStart)
    .get(),
  dbAdmin.collection('events')
    .where('campusId', '==', campusId)
    .get(),
  dbAdmin.collection('tools')
    .where('campusId', '==', campusId)
    .get(),
]);
```

### Metrics Calculated

```typescript
interface PlatformMetrics {
  totalUsers: number;
  activeUsers: number;           // DAU/WAU/MAU from activity events
  totalSpaces: number;
  activeSpaces: number;          // Has activity in last 30 days
  totalPosts: number;
  totalEvents: number;
  totalTools: number;
  activeTools: number;           // Deployed tools
}

interface UserMetrics {
  byMajor: Record<string, number>;
  byYear: Record<string, number>;
  byOnboardingStep: Record<string, number>;
  retentionRate: number;
}

interface SpaceMetrics {
  byCategory: Record<string, number>;
  avgMembersPerSpace: number;
  spacesWithTools: number;
  activationRate: number;        // Spaces with 3+ messages
}

interface EngagementMetrics {
  messagesPerDay: number[];
  reactionsPerDay: number[];
  toolInteractionsPerDay: number[];
}
```

---

## AI Quality Dashboard

**Location:** `apps/admin/src/app/ai-quality/page.tsx` (376 lines)

**Purpose:** Monitor HiveLab AI generation quality in real-time.

### Quality Metrics Interface

```typescript
interface QualityMetrics {
  period: { start: string; end: string; granularity: string };

  generation: {
    total: number;
    uniqueUsers: number;
    avgQualityScore: number;     // 0-100 quality score
    scoreDistribution: {
      excellent: number;         // 80-100
      good: number;              // 60-79
      acceptable: number;        // 40-59
      poor: number;              // 0-39
    };
    acceptanceRate: number;      // Fully accepted
    partialAcceptRate: number;   // Edited then used
    rejectionRate: number;       // Discarded
    deploymentRate: number;      // Actually deployed
    editRate: number;            // User modified
    abandonmentRate: number;     // Started but left
  };

  performance: {
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    fallbackRate: number;        // Template fallback %
  };

  failures: {
    total: number;
    byType: Record<string, number>;  // parse_error, validation, timeout
    topErrors: Array<{ message: string; count: number }>;
    avgRetries: number;
    fallbackSuccessRate: number;
  };

  edits: {  // "Gold Signal" - what users change
    totalSessions: number;
    avgEditsPerSession: number;
    avgElementsAdded: number;
    avgElementsRemoved: number;
    mostRemovedElements: Array<{ elementType: string; count: number; rate: number }>;
    mostAddedElements: Array<{ elementType: string; count: number; rate: number }>;
    outcomeDistribution: {
      deployed: number;
      saved: number;
      discarded: number;
    };
  };

  elementUsage: Record<string, number>;
  topValidationErrors: Array<{ code: string; count: number }>;
}
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ AI Quality Dashboard          [Hour] [Day] [Week] [Month]       │
│ Monitor HiveLab AI generation quality in real-time              │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│ │ Total Gen │ │ Avg Score │ │ Accept %  │ │ Failures  │        │
│ │    156    │ │   72/100  │ │   84%     │ │     3     │        │
│ │ 45 users  │ │   Good    │ │ 12% part. │ │ 2% fallbk │        │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
├─────────────────────────────────────────────────────────────────┤
│ Quality Score Distribution                                      │
│ [█████████████░░░░░░░░] Excellent: 45  Good: 62  OK: 38  Poor: 11│
├────────────────────────────┬────────────────────────────────────┤
│ Performance                │ User Corrections [Gold Signal]     │
│                            │                                    │
│ Avg Latency:    1,245ms    │ Edit Sessions:     89              │
│ P50 Latency:    980ms      │ Avg Edits/Session: 3.2             │
│ P95 Latency:    3,200ms    │ Elements Added:    +2.1            │
│ P99 Latency:    5,100ms    │ Elements Removed:  -1.4            │
├────────────────────────────┴────────────────────────────────────┤
│ Most Removed Elements          │ Most Added Elements            │
│                                │                                │
│ decorative-image    23 (18%)   │ poll           34 (26%)        │
│ spacer              18 (14%)   │ countdown      28 (22%)        │
│ generic-text        15 (12%)   │ form-field     21 (16%)        │
└────────────────────────────────┴────────────────────────────────┘
```

### Gold Signal: User Corrections

The most valuable data for improving AI generation is what users change:

```typescript
// Track what elements users remove (AI over-generates)
mostRemovedElements: [
  { elementType: 'decorative-image', count: 23, rate: 0.18 },
  { elementType: 'spacer', count: 18, rate: 0.14 },
]

// Track what elements users add (AI under-generates)
mostAddedElements: [
  { elementType: 'poll', count: 34, rate: 0.26 },
  { elementType: 'countdown', count: 28, rate: 0.22 },
]

// Use this to tune AI prompts and element weighting
```

---

## Content Moderation Dashboard

**Location:** `apps/admin/src/components/content-moderation-dashboard.tsx` (466 lines)

**Purpose:** Review and act on flagged content from ML moderation and user reports.

### Flagged Content Interface

```typescript
interface FlaggedContent {
  id: string;
  type: 'message' | 'post' | 'comment' | 'profile' | 'tool';
  contentId: string;
  content: string;
  authorId: string;
  authorName: string;
  spaceId?: string;
  spaceName?: string;

  flag: {
    reason: 'harassment' | 'spam' | 'inappropriate' | 'hate_speech' | 'violence' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    reportedBy?: string;     // User report
    autoDetected?: boolean;  // ML flagged
    confidence?: number;     // ML confidence score
  };

  status: 'pending' | 'approved' | 'removed' | 'warned';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  action?: {
    type: 'approve' | 'remove' | 'warn';
    note?: string;
  };
}
```

### Moderation Actions

```typescript
// Available actions for moderators
const moderationActions = {
  approve: {
    description: 'Content is acceptable, remove flag',
    updates: { status: 'approved', reviewedAt: now, reviewedBy: adminId }
  },
  remove: {
    description: 'Delete content, notify author',
    updates: { status: 'removed', reviewedAt: now, reviewedBy: adminId },
    sideEffects: [
      'Delete original content',
      'Send notification to author',
      'Log moderation action',
      'Increment author violation count'
    ]
  },
  warn: {
    description: 'Keep content, warn author',
    updates: { status: 'warned', reviewedAt: now, reviewedBy: adminId },
    sideEffects: [
      'Send warning notification to author',
      'Log moderation action'
    ]
  }
};
```

### Severity Badges

```typescript
const getSeverityBadge = (severity: string) => {
  switch (severity) {
    case 'critical': return <Badge className="bg-red-600">Critical</Badge>;
    case 'high':     return <Badge className="bg-orange-600">High</Badge>;
    case 'medium':   return <Badge className="bg-yellow-600">Medium</Badge>;
    case 'low':      return <Badge className="bg-gray-600">Low</Badge>;
  }
};
```

---

## Admin Authentication

**Location:** `apps/admin/src/lib/auth.ts`

### useAdminAuth Hook

```typescript
interface Admin {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: string[];
}

export function useAdminAuth() {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check admin session cookie
    // Validate against admin whitelist
    // Set admin state
  }, []);

  return { admin, loading, isAuthenticated };
}
```

### Protected Route Pattern

```typescript
// apps/admin/src/app/dashboard/page.tsx
export default function AdminDashboard() {
  const router = useRouter();
  const { admin, loading, isAuthenticated } = useAdminAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [loading, isAuthenticated, router]);

  if (loading) return <LoadingSpinner />;
  if (!admin) return null;

  return <ComprehensiveAdminDashboard />;
}
```

---

## Analytics Dashboard

**Location:** `apps/admin/src/components/analytics-dashboard.tsx` (372 lines)

### Platform Stats Interface

```typescript
interface PlatformStats {
  users: {
    total: number;
    active: number;
    inactive: number;
    byMajor: Record<string, number>;
    byYear: Record<string, number>;
    growth: {
      lastWeek: number;
      lastMonth: number;
    };
  };

  spaces: {
    total: number;
    active: number;
    dormant: number;
    byType: Record<string, {
      total: number;
      active: number;
      dormant: number;
      members: number;
    }>;
    hasBuilders: number;
    totalMembers: number;
    averageMembers: number;
    activationRate: number;
  };

  builderRequests: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    urgent: number;
    approvalRate: number;
    averageResponseTime: number;
  };

  system: {
    status: string;
    uptime: number;
    memory: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    collections: {
      users: number;
      spaces: number;
      builderRequests: number;
    };
    lastUpdated: string;
  };
}
```

### Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ Platform Analytics                      Last updated: 3:45 PM   │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐        │
│ │ Total     │ │ Total     │ │ Builder   │ │ System    │        │
│ │ Users     │ │ Spaces    │ │ Requests  │ │ Status    │        │
│ │   247     │ │    89     │ │    23     │ │ ● Healthy │        │
│ │ 198 activ │ │ 67 active │ │ 5 pending │ │ 14d 6h 23m│        │
│ └───────────┘ └───────────┘ └───────────┘ └───────────┘        │
├────────────────────────────┬────────────────────────────────────┤
│ User Analytics             │ Space Analytics                    │
│                            │                                    │
│ Active Users:      198     │ Activation Rate:   75%            │
│ Inactive Users:    49      │ Average Members:   12.3           │
│                            │ Total Members:     1,092          │
│ Top Majors:                │                                    │
│ Computer Science   89      │ By Type:                          │
│ Engineering        45      │ academic          34/42           │
│ Business           32      │ social            25/31           │
│ Biology            21      │ professional      8/16            │
├────────────────────────────┼────────────────────────────────────┤
│ Builder Requests           │ System Health                      │
│                            │                                    │
│ Approval Rate:     78%     │ Status:          ● Healthy        │
│ Avg Response:      4.2h    │ Memory Usage:    245.3MB          │
│ Urgent:            2       │ Total Memory:    512.0MB          │
│                            │                                    │
│ [Pending: 5] [Approved: 18]│ Collections:                      │
│ [Rejected: 0]              │ Users: 247  Spaces: 89  Reqs: 23  │
└────────────────────────────┴────────────────────────────────────┘
```

---

## Navigation with Pending Count Badges

**Location:** `apps/admin/src/components/admin-navigation.tsx` (93 lines)

```typescript
const tabs = [
  { id: 'overview',  label: 'Overview',  icon: '🏠', description: 'Platform overview' },
  { id: 'users',     label: 'Users',     icon: '👥', badge: pendingCounts?.userReports },
  { id: 'spaces',    label: 'Spaces',    icon: '🏢' },
  { id: 'content',   label: 'Content',   icon: '📝', badge: pendingCounts?.flaggedContent },
  { id: 'builders',  label: 'Builders',  icon: '🔨', badge: pendingCounts?.builderRequests },
  { id: 'analytics', label: 'Analytics', icon: '📊' },
  { id: 'system',    label: 'System',    icon: '⚙️' },
];

// Badge display
{tab.badge && tab.badge > 0 && (
  <Badge variant="destructive" className="ml-1 text-xs">
    {tab.badge}
  </Badge>
)}
```

---

## API Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/admin/analytics/comprehensive` | GET | Full platform metrics |
| `/api/admin/analytics/realtime` | GET | Live stats |
| `/api/admin/builder-requests` | GET | List pending requests |
| `/api/admin/builder-requests` | POST | Approve/reject request |
| `/api/admin/content-moderation` | GET | Flagged content list |
| `/api/admin/content-moderation` | POST | Moderate content |
| `/api/admin/ai-quality/metrics` | GET | AI generation quality |
| `/api/admin/ai-quality/generations` | GET | Recent generations log |
| `/api/admin/ai-quality/failures` | GET | Failed generations |
| `/api/admin/ai-quality/edits` | GET | User edit patterns |
| `/api/admin/dashboard` | GET | Quick stats |
| `/api/admin/spaces` | GET | All spaces for admin |
| `/api/admin/spaces/[spaceId]` | PATCH | Admin space updates |
| `/api/admin/seed-school` | POST | Seed campus data |
| `/api/admin/moderation/feedback` | GET | Moderation feedback |
| `/api/admin/tools/review-stats` | GET | Tool review stats |

---

## Submodule Completion

| Submodule | Status | Notes |
|-----------|--------|-------|
| Dashboard Layout | ✅ Complete | 7-tab navigation |
| Metric Cards | ✅ Complete | Real-time stats |
| Builder Queue | ✅ Complete | Approve/reject workflow |
| Content Moderation | ✅ Complete | ML + manual review |
| AI Quality Dashboard | ✅ Complete | Generation metrics |
| Analytics Dashboard | ⚠️ 80% | Some mock data |
| Space Management | ✅ Complete | Full CRUD |
| User Management | ⚠️ 70% | Basic lookup |
| System Configuration | ⚠️ 50% | Feature flags display only |
| Activity Log | ⚠️ 60% | Basic logging |
| Notifications | ⚠️ 50% | Basic display |

---

## Pre-Launch Blockers

### Critical
- None (admin panel is secondary to user-facing features)

### Important
1. **Real Analytics Data** - Replace remaining mock data with Firestore queries
2. **User Management** - Add bulk operations, export functionality
3. **System Config** - Make feature flags toggleable (currently display only)

### Nice to Have
- Advanced filtering on all tables
- Export to CSV/Excel
- Scheduled reports
- Multi-admin audit trail
- Role-based permission granularity

---

## Security Considerations

1. **Separate App** - Admin runs on port 3001, isolated from user app
2. **Whitelist Auth** - Only pre-approved emails can access
3. **Role Hierarchy** - super_admin > admin > moderator
4. **Audit Trail** - All moderation actions logged with reviewer ID
5. **Rate Limiting** - Should be added for bulk operations
6. **CSRF Protection** - Inherited from shared auth system

---

## Files Reference

| Component | Location | Lines |
|-----------|----------|-------|
| Dashboard Page | `apps/admin/src/app/dashboard/page.tsx` | 32 |
| Comprehensive Dashboard | `apps/admin/src/components/comprehensive-admin-dashboard.tsx` | 255 |
| Admin Navigation | `apps/admin/src/components/admin-navigation.tsx` | 93 |
| Metric Cards | `apps/admin/src/components/metric-cards.tsx` | 194 |
| Builder Queue | `apps/admin/src/components/builder-queue-enhanced.tsx` | 225 |
| Content Moderation | `apps/admin/src/components/content-moderation-dashboard.tsx` | 466 |
| Analytics Dashboard | `apps/admin/src/components/analytics-dashboard.tsx` | 372 |
| AI Quality Page | `apps/admin/src/app/ai-quality/page.tsx` | 376 |
| Comprehensive API | `apps/web/src/app/api/admin/analytics/comprehensive/route.ts` | 473 |
| Builder Requests API | `apps/web/src/app/api/admin/builder-requests/route.ts` | 255 |
| AI Quality API | `apps/web/src/app/api/admin/ai-quality/metrics/route.ts` | 143 |

---

*Last Updated: December 2025*
