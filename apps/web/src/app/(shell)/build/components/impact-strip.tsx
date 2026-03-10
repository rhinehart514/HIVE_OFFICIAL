'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

interface ImpactTool {
  id: string;
  name: string;
  useCount: number;
}

interface ImpactData {
  tools: ImpactTool[];
  totalResponses: number;
}

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
    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);

  return <span ref={ref}>{count}</span>;
}

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
          const mapped: ImpactTool[] = tools.map((t: { id: string; name: string; useCount: number }) => ({
            id: t.id,
            name: t.name,
            useCount: t.useCount || 0,
          }));
          const totalResponses = mapped.reduce((sum: number, t: ImpactTool) => sum + t.useCount, 0);
          setData({ tools: mapped, totalResponses });
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded || !data || data.tools.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="mb-4"
    >
      {/* Total impact */}
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-3.5 h-3.5 text-[#FFD700]/70" />
        <span className="text-white/70 text-sm font-medium">
          <span className="text-white font-semibold">
            <CountUp target={data.totalResponses} />
          </span>
          {' '}total responses across your apps
        </span>
      </div>

      {/* Per-app horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
        {data.tools.slice(0, 10).map(tool => (
          <button
            key={tool.id}
            onClick={() => router.push(`/build/${tool.id}`)}
            className="flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-full
              bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]
              transition-colors duration-100 group"
          >
            <span className="text-xs text-white/50 group-hover:text-white/70 truncate max-w-[120px] transition-colors">
              {tool.name}
            </span>
            {tool.useCount > 0 && (
              <span className="text-[11px] font-mono text-emerald-400/80">
                {tool.useCount}
              </span>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
