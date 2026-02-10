'use client';

import { motion } from '@hive/ui/design-system/primitives';

const sidebarItems = [
  { label: 'EC', active: true },
  { label: 'AC', active: false },
  { label: 'DS', active: false },
];

const posts = [
  { title: 'Meeting tomorrow at 6pm', time: '2h ago', replies: 4 },
  { title: 'New project kickoff thread', time: '5h ago', replies: 12 },
];

export function ProductMock() {
  return (
    <div className="relative group">
      <div className="overflow-hidden rounded-lg border border-white/[0.06] bg-[var(--bg-ground)]">
        {/* Window chrome */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06] bg-[var(--bg-ground)]">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/[0.06]" />
          </div>
          <span className="text-[10px] text-white/50 tracking-wider uppercase">HIVE</span>
          <div className="w-12" />
        </div>

        {/* Body */}
        <div className="flex min-h-[240px]">
          {/* Sidebar */}
          <div className="w-14 border-r border-white/[0.06] py-3 flex flex-col items-center gap-2">
            {sidebarItems.map((item) => (
              <motion.div
                key={item.label}
                className={`w-9 h-9 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                  item.active
                    ? 'border border-[#FFD700]/20 bg-[#FFD700]/10 text-[#FFD700]'
                    : 'border border-white/[0.06] bg-white/[0.06] text-white/50'
                }`}
                variants={{
                  hidden: { opacity: 0, scale: 0.8 },
                  visible: { opacity: 1, scale: 1 },
                }}
              >
                {item.label}
              </motion.div>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-5 h-5 rounded bg-[#FFD700]/10 flex items-center justify-center">
                <span className="text-[8px] text-[#FFD700] font-bold">EC</span>
              </div>
              <span className="text-xs font-medium text-white">Engineering Club</span>
            </div>

            {posts.map((post) => (
              <motion.div
                key={post.title}
                className="rounded-lg border border-white/[0.06] bg-white/[0.06] p-3"
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 1, y: 0 },
                }}
              >
                <p className="text-[11px] text-white/50 mb-1">{post.title}</p>
                <div className="flex items-center gap-3 text-[9px] text-white/25">
                  <span>{post.time}</span>
                  <span>{post.replies} replies</span>
                </div>
              </motion.div>
            ))}

            <div className="mt-3 flex items-center gap-2 text-[9px] text-white/50">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
              12 members online
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
