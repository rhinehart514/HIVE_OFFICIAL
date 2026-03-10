'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

interface MyTool {
  id: string;
  name: string;
  status: string;
  updatedAt: string;
  deployments: number;
  useCount: number;
}

interface MyAppsStats {
  totalTools: number;
  totalUsers: number;
  weeklyInteractions: number;
}

export function MyAppsSection() {
  const router = useRouter();
  const [tools, setTools] = useState<MyTool[]>([]);
  const [stats, setStats] = useState<MyAppsStats | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/tools/my-tools', { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        if (data?.data?.tools) {
          setTools(data.data.tools);
          setStats(data.data.stats);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  if (!loaded) return null;

  if (tools.length === 0) {
    return (
      <div className="mt-6">
        <span className="text-xs text-white/30 uppercase tracking-wider">Your Apps</span>
        <p className="text-sm text-white/30 mt-2">
          Apps you make show up here. Try typing what you need above.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
      className="mt-6"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-white/30 uppercase tracking-wider">Your Apps</span>
        {stats && stats.totalUsers > 0 && (
          <span className="text-[11px] text-white/30">
            {stats.totalUsers} user{stats.totalUsers !== 1 ? 's' : ''} reached
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {tools.slice(0, 5).map(tool => (
          <button
            key={tool.id}
            onClick={() => router.push(`/build/${tool.id}`)}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
              bg-white/[0.02] hover:bg-white/[0.04] transition-colors text-left group"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/50 group-hover:text-white/70 truncate transition-colors">
                {tool.name}
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-white/30 flex-shrink-0">
              {tool.deployments > 0 && (
                <span>{tool.deployments} space{tool.deployments !== 1 ? 's' : ''}</span>
              )}
              {tool.useCount > 0 && (
                <span>{tool.useCount} use{tool.useCount !== 1 ? 's' : ''}</span>
              )}
              <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
