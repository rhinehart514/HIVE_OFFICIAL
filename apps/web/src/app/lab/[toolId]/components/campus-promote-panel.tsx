'use client';

import { useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, Globe, TrendingUp, Users, Zap,
  CheckCircle2, Loader2, ArrowRight, AlertCircle,
} from 'lucide-react';
import { MOTION } from '@hive/tokens';
import type { PromotionStatus } from '@/app/api/tools/[toolId]/promote/route';

const EASE = MOTION.ease.premium;

const CAMPUS_CATEGORIES = [
  'Exchange', 'Social', 'Academic', 'Org Tools', 'Campus Life', 'Utility',
];

interface CampusPromotePanelProps {
  toolId: string;
  toolName: string;
  onClose: () => void;
}

async function fetchPromotionStatus(toolId: string): Promise<PromotionStatus> {
  const res = await fetch(`/api/tools/${toolId}/promote`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to check promotion status');
  const data = await res.json();
  return data.data || data;
}

export function CampusPromotePanel({ toolId, toolName, onClose }: CampusPromotePanelProps) {
  const queryClient = useQueryClient();
  const [slug, setSlug] = useState(() =>
    toolName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50)
  );
  const [category, setCategory] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: status, isLoading } = useQuery({
    queryKey: ['promotion-status', toolId],
    queryFn: () => fetchPromotionStatus(toolId),
    staleTime: 30000,
  });

  const handleSubmit = useCallback(async () => {
    if (!slug.trim() || !category) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/tools/${toolId}/promote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ slug: slug.trim(), category }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || err.message || 'Promotion failed');
      }
      const data = await res.json();
      toast.success('Submitted for campus review!', {
        description: `${toolName} will appear at /campus/${slug} once approved.`,
      });
      queryClient.invalidateQueries({ queryKey: ['promotion-status', toolId] });
      onClose();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  }, [toolId, toolName, slug, category, queryClient, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.96 }}
        transition={{ duration: 0.25, ease: EASE }}
        className="w-full max-w-md mx-4 rounded-2xl border border-white/[0.08] bg-[#0A0A0F] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#FFD700]/10 flex items-center justify-center">
              <Globe className="w-4 h-4 text-[#FFD700]" />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-white">Promote to Campus</h2>
              <p className="text-[11px] text-white/40">Make this app available campus-wide</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
            </div>
          ) : status?.alreadyPromoted ? (
            /* Already on campus */
            <div className="text-center py-4">
              <CheckCircle2 className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <p className="text-[15px] font-medium text-white mb-1">Already on Campus</p>
              <p className="text-[13px] text-white/45">
                {status.pendingReview
                  ? 'Pending admin review.'
                  : <>Live at <span className="text-[#FFD700]">/campus/{status.campusSlug}</span></>
                }
              </p>
            </div>
          ) : (
            <>
              {/* Usage stats */}
              <div className="grid grid-cols-3 gap-3">
                <StatCard
                  icon={<Zap className="w-3.5 h-3.5" />}
                  label="Total Uses"
                  value={status?.stats.totalUses ?? 0}
                  threshold={status?.thresholds.minTotalUses ?? 50}
                  met={(status?.stats.totalUses ?? 0) >= (status?.thresholds.minTotalUses ?? 50)}
                />
                <StatCard
                  icon={<TrendingUp className="w-3.5 h-3.5" />}
                  label="Deployments"
                  value={status?.stats.spaceDeployments ?? 0}
                  threshold={status?.thresholds.minSpaceDeployments ?? 3}
                  met={(status?.stats.spaceDeployments ?? 0) >= (status?.thresholds.minSpaceDeployments ?? 3)}
                />
                <StatCard
                  icon={<Users className="w-3.5 h-3.5" />}
                  label="Weekly Users"
                  value={status?.stats.weeklyUsers ?? 0}
                />
              </div>

              {!status?.eligible ? (
                /* Not eligible yet */
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <div className="flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-[13px] font-medium text-white/70 mb-1">Not eligible yet</p>
                      <p className="text-[12px] text-white/40 leading-relaxed">
                        Apps need {status?.thresholds.minTotalUses ?? 50}+ total uses and{' '}
                        {status?.thresholds.minSpaceDeployments ?? 3}+ space deployments before
                        campus promotion. Deploy to more spaces and grow usage to unlock.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Eligible — show form */
                <>
                  <div className="space-y-3">
                    {/* Slug */}
                    <div>
                      <label className="block text-[12px] font-medium text-white/45 mb-1.5">
                        Campus URL
                      </label>
                      <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden">
                        <span className="px-3 text-[13px] text-white/25 shrink-0">/campus/</span>
                        <input
                          type="text"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                          placeholder="my-tool"
                          maxLength={50}
                          className="flex-1 bg-transparent px-0 py-2.5 text-[14px] text-white outline-none placeholder:text-white/20"
                        />
                      </div>
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-[12px] font-medium text-white/45 mb-1.5">
                        Category
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {CAMPUS_CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setCategory(cat)}
                            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                              category === cat
                                ? 'bg-[#FFD700]/15 text-[#FFD700] border border-[#FFD700]/30'
                                : 'bg-white/[0.04] text-white/40 border border-white/[0.06] hover:text-white/60 hover:bg-white/[0.06]'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!slug.trim() || !category || submitting}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                  >
                    {submitting ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                    ) : (
                      <>Submit for Review <ArrowRight className="w-4 h-4" /></>
                    )}
                  </button>

                  <p className="text-[11px] text-white/25 text-center">
                    Admin will review before it goes live. Version will be pinned.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  threshold,
  met,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  threshold?: number;
  met?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center">
      <div className={`inline-flex items-center justify-center w-6 h-6 rounded-lg mb-1.5 ${
        met === true ? 'bg-green-500/10 text-green-400' :
        met === false ? 'bg-white/[0.04] text-white/30' :
        'bg-white/[0.04] text-white/40'
      }`}>
        {icon}
      </div>
      <div className="text-[16px] font-semibold text-white">{value}</div>
      <div className="text-[10px] text-white/35">{label}</div>
      {threshold !== undefined && (
        <div className={`text-[10px] mt-0.5 ${met ? 'text-green-400/60' : 'text-white/20'}`}>
          {met ? 'Met' : `Need ${threshold}`}
        </div>
      )}
    </div>
  );
}
