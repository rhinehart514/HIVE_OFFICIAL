'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp, Sparkles } from 'lucide-react';

interface ImpactTool {
  id: string;
  name: string;
  useCount: number;
  shellFormat: string | null;
}

interface ImpactData {
  tools: ImpactTool[];
  totalResponses: number;
}

/* ─── Count-up animation (rule 24: 800ms ease-out cubic) ──────── */

function CountUp({ target, duration = 800 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current || target === 0) {
      setCount(target);
      return;
    }
    hasAnimated.current = true;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCount(target);
      return;
    }
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

/* ─── Next creation suggestion ────────────────────────────────── */

const NEXT_SUGGESTIONS: Record<string, { prompt: string; label: string }> = {
  poll: { prompt: 'Create a bracket for your group', label: 'Try a bracket' },
  bracket: { prompt: 'Create a poll for your next meeting', label: 'Try a poll' },
  rsvp: { prompt: 'Create a poll to decide what to do', label: 'Try a poll' },
  signup: { prompt: 'Create an RSVP for your next event', label: 'Try an RSVP' },
  countdown: { prompt: 'Create a poll for your group', label: 'Try a poll' },
};

function getNextSuggestion(tools: ImpactTool[]): { prompt: string; label: string } | null {
  if (tools.length === 0) return null;
  const bestTool = tools.reduce((a, b) => (b.useCount > a.useCount ? b : a), tools[0]);
  const format = bestTool.shellFormat ?? 'poll';
  return NEXT_SUGGESTIONS[format] ?? NEXT_SUGGESTIONS.poll;
}

/* ─── Impact Strip ────────────────────────────────────────────── */

export function ImpactStrip() {
  const router = useRouter();
  const [data, setData] = useState<ImpactData | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/tools/my-tools', { credentials: 'include' })
      .then(res => res.json())
      .then(result => {
        const tools = result?.data?.tools || [];
        if (tools.length > 0) {
          const mapped: ImpactTool[] = tools.map((t: { id: string; name: string; useCount: number; shellFormat: string | null }) => ({
            id: t.id,
            name: t.name,
            useCount: t.useCount || 0,
            shellFormat: t.shellFormat ?? null,
          }));
          const totalResponses = mapped.reduce((sum: number, t: ImpactTool) => sum + t.useCount, 0);
          setData({ tools: mapped, totalResponses });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const suggestion = useMemo(() => data ? getNextSuggestion(data.tools) : null, [data]);
  const bestTool = useMemo(() => {
    if (!data) return null;
    return data.tools.reduce((a, b) => (b.useCount > a.useCount ? b : a), data.tools[0]);
  }, [data]);

  if (!loaded || !data || data.tools.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="relative mb-6 rounded-2xl border border-white/[0.05] bg-card p-4"
    >
      {/* Gold glow — creation surface emphasis (rule 19) */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top center, rgba(255,215,0,0.04), transparent 70%)' }}
      />

      <div className="relative">
        {/* Headline — emotional, not informational */}
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-4 h-4 text-[#FFD700]/70" />
          <span className="text-[15px] text-white/70">
            <span className="text-white font-semibold">
              <CountUp target={data.totalResponses} />
            </span>
            {' '}people engaged with your apps
          </span>
        </div>

        {/* Best-performing app callout */}
        {bestTool && bestTool.useCount > 0 && (
          <p className="text-[13px] text-white/50 mb-3 pl-6">
            <button
              onClick={() => router.push(`/t/${bestTool.id}`)}
              className="text-white/70 hover:text-white transition-colors duration-100"
            >
              {bestTool.name}
            </button>
            {' '}is your most active — {bestTool.useCount} response{bestTool.useCount !== 1 ? 's' : ''}
          </p>
        )}

        {/* Per-app horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {data.tools.slice(0, 8).map(tool => (
            <button
              key={tool.id}
              onClick={() => router.push(`/t/${tool.id}`)}
              className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full
                bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]
                transition-colors duration-100 group"
            >
              <span className="text-[13px] text-white/50 group-hover:text-white/70 truncate max-w-[120px] transition-colors">
                {tool.name}
              </span>
              {tool.useCount > 0 && (
                <span className="font-mono text-[11px] text-emerald-400">
                  {tool.useCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Next creation suggestion */}
        {suggestion && (
          <button
            onClick={() => router.push(`/build?prompt=${encodeURIComponent(suggestion.prompt)}`)}
            className="mt-3 flex items-center gap-1.5 text-[13px] text-[#FFD700]/70 hover:text-[#FFD700] transition-colors duration-100"
          >
            <Sparkles className="w-3 h-3" />
            {suggestion.label}
          </button>
        )}
      </div>
    </motion.div>
  );
}
