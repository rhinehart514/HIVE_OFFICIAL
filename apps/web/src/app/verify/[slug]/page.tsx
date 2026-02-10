'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  Shield,
  Calendar,
  Users,
  Wrench,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { MOTION } from '@hive/tokens';

const EASE = MOTION.ease.premium;

interface BadgeData {
  id: string;
  name: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold';
  icon: string;
}

interface VerifyRecord {
  user: {
    handle: string;
    fullName: string;
    avatarUrl: string | null;
    reputation: number;
  };
  space: {
    handle: string;
    name: string;
    memberCount: number;
    category: string | null;
    avatarUrl: string | null;
  };
  leadership: {
    role: string;
    joinedAt: string | null;
    tenureDays: number;
    isVerified: boolean;
  };
  metrics: {
    eventsCreated: number;
    toolsDeployed: number;
    messagesPosted: number;
    membersLed: number;
  };
  badges: {
    earned: BadgeData[];
    next: {
      name: string;
      description: string;
      progress: number;
      current: number;
      threshold: number;
    } | null;
    total: number;
  };
  generatedAt: string;
}

function MetricCard({
  icon: Icon,
  label,
  value,
  index,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.4 + index * 0.08, ease: EASE }}
      className="p-4 rounded-lg bg-white/[0.04] border border-white/[0.06]"
    >
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-white/40" />
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className="text-2xl font-semibold text-white tabular-nums">{value}</div>
    </motion.div>
  );
}

function formatTenure(days: number): string {
  if (days < 30) return `${days} days`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''}`;
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  return remaining > 0 ? `${years}y ${remaining}mo` : `${years} year${years !== 1 ? 's' : ''}`;
}

function roleLabel(role: string): string {
  switch (role) {
    case 'owner': return 'Owner';
    case 'admin': return 'Admin';
    case 'moderator': return 'Moderator';
    default: return role;
  }
}

export default function VerifyPage() {
  const params = useParams();
  const slug = params.slug as string;

  const { data: record, isLoading, error } = useQuery<VerifyRecord>({
    queryKey: ['verify', slug],
    queryFn: async () => {
      const res = await fetch(`/api/verify/${slug}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to load record');
      return json.data;
    },
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Shield className="w-8 h-8 text-white/20 animate-pulse" />
          <span className="text-sm text-white/40">Verifying leadership record...</span>
        </motion.div>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-sm"
        >
          <Shield className="w-10 h-10 text-white/20 mx-auto mb-4" />
          <h1 className="text-lg font-medium text-white mb-2">Record not found</h1>
          <p className="text-sm text-white/50">
            This leadership record doesn't exist or the user is no longer a leader of this space.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-ground,#0A0A09)]">
      <div className="max-w-lg mx-auto px-6 py-12">
        {/* Verified Badge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: EASE }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full
            bg-emerald-500/10 border border-emerald-500/20 mb-6">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-medium text-emerald-400">Verified Leadership</span>
          </div>
        </motion.div>

        {/* Identity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1, ease: EASE }}
          className="text-center mb-8"
        >
          {record.user.avatarUrl && (
            <img
              src={record.user.avatarUrl}
              alt={record.user.fullName}
              className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-white/[0.06]"
            />
          )}
          <h1 className="text-xl font-semibold text-white">{record.user.fullName}</h1>
          <p className="text-sm text-white/50 mt-1">@{record.user.handle}</p>
        </motion.div>

        {/* Role Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2, ease: EASE }}
          className="p-5 rounded-xl bg-white/[0.04] border border-white/[0.08] mb-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-white/40 mb-1">Role</div>
              <div className="text-sm font-medium text-white">
                {roleLabel(record.leadership.role)} of {record.space.name}
              </div>
            </div>
            <a
              href={`/s/${record.space.handle}`}
              className="text-xs text-white/40 hover:text-white/60 transition-colors flex items-center gap-1"
            >
              View space <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3" /> Tenure
              </div>
              <div className="text-sm font-medium text-white">
                {formatTenure(record.leadership.tenureDays)}
              </div>
            </div>
            <div>
              <div className="text-xs text-white/40 mb-1 flex items-center gap-1">
                <Users className="w-3 h-3" /> Members
              </div>
              <div className="text-sm font-medium text-white">
                {record.metrics.membersLed}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <MetricCard icon={Calendar} label="Events Created" value={record.metrics.eventsCreated} index={0} />
          <MetricCard icon={Wrench} label="Tools Deployed" value={record.metrics.toolsDeployed} index={1} />
          <MetricCard icon={MessageSquare} label="Messages Posted" value={record.metrics.messagesPosted} index={2} />
          <MetricCard icon={Users} label="Members Led" value={record.metrics.membersLed} index={3} />
        </div>

        {/* Badges */}
        {record.badges.earned.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6, ease: EASE }}
            className="mb-8"
          >
            <h3 className="text-xs font-medium text-white/40 tracking-wide mb-3">
              Earned Badges ({record.badges.total})
            </h3>
            <div className="flex flex-wrap gap-2">
              {record.badges.earned.map((badge) => {
                const tierColors = {
                  bronze: 'bg-orange-500/10 border-orange-500/20 text-orange-300',
                  silver: 'bg-gray-400/10 border-gray-400/20 text-gray-300',
                  gold: 'bg-[var(--color-gold)]/10 border-[var(--color-gold)]/20 text-[var(--color-gold)]',
                };
                return (
                  <div
                    key={badge.id}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full
                      border text-xs font-medium ${tierColors[badge.tier]}`}
                    title={badge.description}
                  >
                    {badge.name}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Next Badge Progress */}
        {record.badges.next && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7, ease: EASE }}
            className="mb-8 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-white/50">Next: {record.badges.next.name}</span>
              <span className="text-xs text-white/30">
                {record.badges.next.current}/{record.badges.next.threshold}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--color-gold)]/50"
                initial={{ width: 0 }}
                animate={{ width: `${record.badges.next.progress}%` }}
                transition={{ duration: 0.6, delay: 0.8, ease: EASE }}
              />
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.8 }}
          className="text-center"
        >
          <p className="text-xs text-white/30">
            Auto-tracked by HIVE · Generated {new Date(record.generatedAt).toLocaleDateString()}
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-1 mt-3 text-xs text-white/40 hover:text-white/60 transition-colors"
          >
            <Shield className="w-3 h-3" />
            Powered by HIVE
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
