'use client';

import {
  Users,
  MessageSquare,
  Flag,
  Activity,
  TrendingUp,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import * as React from 'react';

import {
  AdminMetricCard,
  StatusPill,
  AuditLogList,
  ModerationQueue,
  type AuditLogEvent,
  type ModerationQueueItem,
} from './admin-dashboard-primitives';

import type { Meta, StoryObj } from '@storybook/react';


const meta = {
  title: '07-Admin/Dashboard Primitives',
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Admin dashboard primitive components including metrics, status pills, audit logs, and moderation queues. Built for campus admin dashboards with real-time monitoring and moderation capabilities.',
      },
    },
    backgrounds: {
      default: 'dark',
    },
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ===== ADMIN METRIC CARDS =====

export const MetricCard_Users: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Total Users"
        value={2847}
        delta={{ value: 12.5, label: '12.5% increase from last month' }}
        icon={Users}
        description="Active students on campus"
      />
    </div>
  ),
};

export const MetricCard_Posts: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Posts Today"
        value={134}
        delta={{ value: -8.2, label: '8.2% decrease from yesterday', tone: 'negative' }}
        icon={MessageSquare}
        description="Total posts created in the last 24 hours"
      />
    </div>
  ),
};

export const MetricCard_Reports: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Open Reports"
        value={7}
        delta={{ value: 3, label: '3 new reports', tone: 'negative' }}
        icon={Flag}
        description="Reports awaiting moderation"
      />
    </div>
  ),
};

export const MetricCard_Engagement: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Engagement Rate"
        value={68.4}
        format="percent"
        delta={{ value: 5.7, label: '5.7% increase' }}
        icon={Activity}
        description="Daily active users / Total users"
      />
    </div>
  ),
};

export const MetricCard_Revenue: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Monthly Revenue"
        value={12450}
        format="currency"
        currency="USD"
        delta={{ value: 23.1, label: '23.1% growth' }}
        icon={DollarSign}
        description="Subscription and premium feature revenue"
      />
    </div>
  ),
};

export const MetricCard_NoChange: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="System Health"
        value="Operational"
        delta={{ value: 0, label: 'No changes', tone: 'neutral' }}
        icon={ShieldCheck}
        description="All systems running normally"
      />
    </div>
  ),
};

export const MetricCard_Subtle: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Cache Hit Rate"
        value={97.2}
        format="percent"
        icon={TrendingUp}
        subtle
        description="Redis cache performance"
      />
    </div>
  ),
};

export const MetricCard_WithFooter: Story = {
  render: () => (
    <div className="w-[350px]">
      <AdminMetricCard
        title="Active Spaces"
        value={42}
        delta={{ value: 8, label: '8 new spaces this week' }}
        icon={Users}
        description="Spaces with activity in the last 7 days"
        footer={
          <div className="text-xs text-emerald-300">
            Top space: CS Department (347 active members)
          </div>
        }
      />
    </div>
  ),
};

// ===== METRIC CARD GRID =====

export const MetricDashboard: Story = {
  render: () => (
    <div className="w-full max-w-[1200px] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6 bg-[var(--hive-background-primary)]">
      <AdminMetricCard
        title="Total Users"
        value={2847}
        delta={{ value: 12.5 }}
        icon={Users}
      />
      <AdminMetricCard
        title="Posts Today"
        value={134}
        delta={{ value: -8.2, tone: 'negative' }}
        icon={MessageSquare}
      />
      <AdminMetricCard
        title="Open Reports"
        value={7}
        delta={{ value: 3, tone: 'negative' }}
        icon={Flag}
      />
      <AdminMetricCard
        title="Engagement"
        value={68.4}
        format="percent"
        delta={{ value: 5.7 }}
        icon={Activity}
      />
      <AdminMetricCard
        title="Revenue"
        value={12450}
        format="currency"
        delta={{ value: 23.1 }}
        icon={DollarSign}
      />
      <AdminMetricCard
        title="Uptime"
        value={99.98}
        format="percent"
        delta={{ value: 0, tone: 'neutral' }}
        icon={ShieldCheck}
      />
    </div>
  ),
};

// ===== STATUS PILLS =====

export const StatusPill_Neutral: Story = {
  render: () => <StatusPill label="Active" tone="neutral" />,
};

export const StatusPill_Info: Story = {
  render: () => <StatusPill label="In Review" tone="info" icon={Clock} />,
};

export const StatusPill_Success: Story = {
  render: () => <StatusPill label="Resolved" tone="success" icon={CheckCircle} />,
};

export const StatusPill_Warning: Story = {
  render: () => <StatusPill label="Pending" tone="warning" icon={AlertTriangle} />,
};

export const StatusPill_Danger: Story = {
  render: () => <StatusPill label="Escalated" tone="danger" icon={XCircle} />,
};

export const StatusPill_Collection: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2 p-6">
      <StatusPill label="Active" tone="neutral" />
      <StatusPill label="In Review" tone="info" icon={Clock} />
      <StatusPill label="Resolved" tone="success" icon={CheckCircle} />
      <StatusPill label="Pending" tone="warning" icon={AlertTriangle} />
      <StatusPill label="Escalated" tone="danger" icon={XCircle} />
      <StatusPill label="Low Priority" tone="info" />
      <StatusPill label="Medium Priority" tone="warning" />
      <StatusPill label="High Priority" tone="danger" />
    </div>
  ),
};

// ===== AUDIT LOG =====

const mockAuditEvents: AuditLogEvent[] = [
  {
    id: '1',
    summary: 'User banned from campus',
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    actor: 'admin@buffalo.edu',
    description: 'User violated community guidelines - repeated harassment',
    variant: 'critical',
    meta: ['MANUAL', 'PERMANENT'],
  },
  {
    id: '2',
    summary: 'Space created',
    timestamp: new Date(Date.now() - 1000 * 60 * 30),
    actor: 'moderator@buffalo.edu',
    description: 'New space "Grad Student Lounge" created',
    variant: 'positive',
    meta: ['AUTO-APPROVED'],
  },
  {
    id: '3',
    summary: 'Content flagged for review',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    actor: 'system',
    description: 'Post flagged by automated content filter',
    variant: 'warning',
    meta: ['AI-DETECTED', 'PROFANITY'],
  },
  {
    id: '4',
    summary: 'User verification approved',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
    actor: 'verifier@buffalo.edu',
    description: 'Student ID verification completed',
    variant: 'default',
  },
  {
    id: '5',
    summary: 'System maintenance scheduled',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24),
    actor: 'system',
    description: 'Database backup and optimization scheduled for tonight',
    variant: 'default',
    meta: ['SCHEDULED'],
  },
];

export const AuditLog_Default: Story = {
  render: () => (
    <div className="w-[600px]">
      <AuditLogList events={mockAuditEvents} />
    </div>
  ),
};

export const AuditLog_Empty: Story = {
  render: () => (
    <div className="w-[600px]">
      <AuditLogList events={[]} />
    </div>
  ),
};

export const AuditLog_CustomEmpty: Story = {
  render: () => (
    <div className="w-[600px]">
      <AuditLogList
        events={[]}
        emptyState={
          <div className="space-y-2">
            <p className="font-semibold">No recent activity</p>
            <p className="text-xs">Check back later for updates</p>
          </div>
        }
      />
    </div>
  ),
};

export const AuditLog_CustomTitle: Story = {
  render: () => (
    <div className="w-[600px]">
      <AuditLogList
        events={mockAuditEvents.slice(0, 3)}
        title="Security Events"
      />
    </div>
  ),
};

export const AuditLog_Critical: Story = {
  render: () => (
    <div className="w-[600px]">
      <AuditLogList
        events={[
          {
            id: '1',
            summary: 'Multiple failed login attempts detected',
            timestamp: new Date(Date.now() - 1000 * 60 * 2),
            actor: 'security-system',
            description: 'IP: 192.168.1.100 - Account locked for 30 minutes',
            variant: 'critical',
            meta: ['SECURITY', 'AUTO-LOCK'],
          },
          {
            id: '2',
            summary: 'Suspicious API activity',
            timestamp: new Date(Date.now() - 1000 * 60 * 15),
            actor: 'api-monitor',
            description: 'Rate limit exceeded - 500 requests in 60 seconds',
            variant: 'warning',
            meta: ['API', 'RATE-LIMIT'],
          },
        ]}
        title="Security Alerts"
      />
    </div>
  ),
};

// ===== MODERATION QUEUE =====

const mockModerationItems: ModerationQueueItem[] = [
  {
    id: '1',
    title: 'Inappropriate content in post',
    submittedBy: 'student123',
    submittedAt: new Date(Date.now() - 1000 * 60 * 10),
    summary: 'Post contains offensive language and violates community guidelines',
    status: 'pending',
    severity: 'high',
    tags: ['PROFANITY', 'URGENT'],
    ctaLabel: 'Review',
  },
  {
    id: '2',
    title: 'Spam in Space comments',
    submittedBy: 'user456',
    submittedAt: new Date(Date.now() - 1000 * 60 * 30),
    summary: 'User posting repetitive promotional content',
    status: 'under_review',
    severity: 'medium',
    tags: ['SPAM'],
    ctaLabel: 'View Details',
  },
  {
    id: '3',
    title: 'Harassment report',
    submittedBy: 'concerned_student',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 2),
    summary: 'User reported for targeted harassment in DMs',
    status: 'escalated',
    severity: 'high',
    tags: ['HARASSMENT', 'ESCALATED'],
    ctaLabel: 'Take Action',
  },
  {
    id: '4',
    title: 'Duplicate space request',
    submittedBy: 'club_president',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 5),
    summary: 'Space name conflicts with existing space',
    status: 'resolved',
    severity: 'low',
    tags: ['DUPLICATE'],
    ctaLabel: 'View',
  },
  {
    id: '5',
    title: 'False positive report',
    submittedBy: 'auto_mod',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
    summary: 'Automated system flagged content incorrectly',
    status: 'dismissed',
    severity: 'low',
    tags: ['AUTO-MOD', 'FALSE-POSITIVE'],
  },
];

export const ModerationQueue_Default: Story = {
  render: () => (
    <div className="w-[700px]">
      <ModerationQueue
        items={mockModerationItems}
        onAction={(item) => console.log('Action clicked:', item)}
      />
    </div>
  ),
};

export const ModerationQueue_Pending: Story = {
  render: () => (
    <div className="w-[700px]">
      <ModerationQueue
        items={mockModerationItems.filter(item => item.status === 'pending')}
        onAction={(item) => console.log('Action clicked:', item)}
      />
    </div>
  ),
};

export const ModerationQueue_HighPriority: Story = {
  render: () => (
    <div className="w-[700px]">
      <ModerationQueue
        items={mockModerationItems.filter(item => item.severity === 'high')}
        onAction={(item) => console.log('Action clicked:', item)}
      />
    </div>
  ),
};

export const ModerationQueue_Empty: Story = {
  render: () => (
    <div className="w-[700px]">
      <ModerationQueue items={[]} />
    </div>
  ),
};

export const ModerationQueue_CustomEmpty: Story = {
  render: () => (
    <div className="w-[700px]">
      <ModerationQueue
        items={[]}
        emptyState={
          <div className="space-y-2">
            <p className="font-semibold">All caught up!</p>
            <p className="text-xs">No items requiring moderation</p>
          </div>
        }
      />
    </div>
  ),
};

export const ModerationQueue_Interactive: Story = {
  render: () => {
    const [items, setItems] = React.useState(mockModerationItems);

    const handleAction = (item: ModerationQueueItem) => {
      setItems(prev => prev.filter(i => i.id !== item.id));
    };

    return (
      <div className="w-[700px]">
        <ModerationQueue
          items={items}
          onAction={handleAction}
        />
      </div>
    );
  },
};

// ===== REAL-WORLD ADMIN DASHBOARD =====

export const AdminDashboard_Overview: Story = {
  render: () => (
    <div className="w-full max-w-[1400px] p-6 bg-[var(--hive-background-primary)] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Campus Admin Dashboard</h1>
        <p className="text-white/60">University at Buffalo - HIVE Platform</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <AdminMetricCard
          title="Total Users"
          value={2847}
          delta={{ value: 12.5 }}
          icon={Users}
        />
        <AdminMetricCard
          title="Posts Today"
          value={134}
          delta={{ value: -8.2, tone: 'negative' }}
          icon={MessageSquare}
        />
        <AdminMetricCard
          title="Open Reports"
          value={7}
          delta={{ value: 3, tone: 'negative' }}
          icon={Flag}
        />
        <AdminMetricCard
          title="Engagement"
          value={68.4}
          format="percent"
          delta={{ value: 5.7 }}
          icon={Activity}
        />
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Moderation Queue */}
        <ModerationQueue
          items={mockModerationItems.filter(item =>
            item.status === 'pending' || item.status === 'under_review'
          )}
          onAction={(item) => console.log('Review:', item)}
        />

        {/* Audit Log */}
        <AuditLogList
          events={mockAuditEvents.slice(0, 5)}
          title="Recent Activity"
        />
      </div>
    </div>
  ),
};

export const AdminDashboard_Security: Story = {
  render: () => (
    <div className="w-full max-w-[1400px] p-6 bg-[var(--hive-background-primary)] space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Security Dashboard</h1>
        <p className="text-white/60">Monitor and respond to security events</p>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <AdminMetricCard
          title="Failed Logins"
          value={12}
          delta={{ value: 8, tone: 'negative' }}
          icon={AlertTriangle}
          description="Last 24 hours"
        />
        <AdminMetricCard
          title="Blocked IPs"
          value={3}
          delta={{ value: 0, tone: 'neutral' }}
          icon={ShieldCheck}
          description="Active blocks"
        />
        <AdminMetricCard
          title="Uptime"
          value={99.98}
          format="percent"
          delta={{ value: 0.02 }}
          icon={TrendingUp}
          description="Last 30 days"
        />
      </div>

      {/* Security Events */}
      <AuditLogList
        events={[
          {
            id: '1',
            summary: 'Multiple failed login attempts',
            timestamp: new Date(Date.now() - 1000 * 60 * 5),
            actor: 'security-system',
            description: 'Account locked after 5 failed attempts',
            variant: 'critical',
            meta: ['SECURITY', 'AUTO-LOCK'],
          },
          {
            id: '2',
            summary: 'Suspicious API activity detected',
            timestamp: new Date(Date.now() - 1000 * 60 * 30),
            actor: 'api-monitor',
            description: 'Rate limit exceeded - temporary block applied',
            variant: 'warning',
            meta: ['API', 'RATE-LIMIT'],
          },
          {
            id: '3',
            summary: 'Password reset requested',
            timestamp: new Date(Date.now() - 1000 * 60 * 60),
            actor: 'user@buffalo.edu',
            description: 'Password reset email sent successfully',
            variant: 'default',
          },
        ]}
        title="Security Events"
      />
    </div>
  ),
};

// ===== ACCESSIBILITY DEMO =====

export const Admin_Accessibility: Story = {
  render: () => (
    <div className="w-[600px] p-6 space-y-6">
      <div className="text-sm text-white/60 mb-4">
        <p className="font-medium text-white mb-2">Accessibility Features:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Semantic HTML with proper ARIA labels</li>
          <li>Time elements with machine-readable dateTime</li>
          <li>Icon aria-hidden attributes</li>
          <li>Color-independent status indicators</li>
          <li>Keyboard navigable actions</li>
          <li>High contrast text and borders</li>
        </ul>
      </div>

      <AdminMetricCard
        title="Accessible Metric"
        value={100}
        format="percent"
        delta={{ value: 5, label: 'Accessibility score increased by 5%' }}
        icon={CheckCircle}
        description="WCAG 2.1 AA compliant"
      />
    </div>
  ),
};

// ===== DARK MODE (DEFAULT) =====

export const DarkMode_Dashboard: Story = {
  parameters: {
    backgrounds: { default: 'dark' },
  },
  render: () => (
    <div className="w-full max-w-[1200px] p-6 bg-[var(--hive-background-primary)] space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AdminMetricCard
          title="Active Users"
          value={2847}
          delta={{ value: 12.5 }}
          icon={Users}
          description="Students online in the last hour"
        />
        <AdminMetricCard
          title="System Health"
          value="Excellent"
          delta={{ value: 0, tone: 'neutral' }}
          icon={ShieldCheck}
          description="All services operational"
        />
      </div>

      <AuditLogList
        events={mockAuditEvents.slice(0, 3)}
        title="Recent Events"
      />
    </div>
  ),
};
