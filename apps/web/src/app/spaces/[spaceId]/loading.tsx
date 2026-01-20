/**
 * Space Detail Page - Loading Skeleton
 *
 * Staggered animation delays create a premium cascading effect:
 * - Header loads first (0ms)
 * - Tabs cascade (50ms each)
 * - Messages cascade (75ms each)
 * - Sidebar sections cascade (100ms each)
 */

import { Skeleton } from '@hive/ui';

function StaggeredSkeleton({
  className,
  delay,
}: {
  className: string;
  delay: number;
}) {
  return (
    <Skeleton
      className={className}
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

export default function SpaceDetailLoading() {
  return (
    <div className="h-screen flex flex-col bg-neutral-950">
      {/* Space header */}
      <div className="border-b border-neutral-800 bg-neutral-900/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <StaggeredSkeleton className="h-10 w-10 rounded-lg" delay={0} />
            <div>
              <StaggeredSkeleton className="h-5 w-48 mb-1" delay={25} />
              <StaggeredSkeleton className="h-3 w-32" delay={50} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StaggeredSkeleton className="h-8 w-20 rounded-lg" delay={75} />
            <StaggeredSkeleton className="h-8 w-8 rounded-lg" delay={100} />
          </div>
        </div>
      </div>

      {/* Board tabs */}
      <div className="border-b border-neutral-800 px-4 py-2">
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <StaggeredSkeleton
              key={i}
              className="h-8 w-24 rounded-full"
              delay={100 + i * 50}
            />
          ))}
        </div>
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat area - 60% */}
        <main className="flex-[3] flex flex-col border-r border-neutral-800/50 lg:border-r-0">
          {/* Messages area */}
          <div className="flex-1 p-4 space-y-4 overflow-hidden">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-3">
                <StaggeredSkeleton
                  className="h-9 w-9 rounded-full flex-shrink-0"
                  delay={250 + i * 75}
                />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <StaggeredSkeleton
                      className="h-4 w-24"
                      delay={275 + i * 75}
                    />
                    <StaggeredSkeleton
                      className="h-3 w-16"
                      delay={300 + i * 75}
                    />
                  </div>
                  <StaggeredSkeleton
                    className="h-4 w-full max-w-md"
                    delay={325 + i * 75}
                  />
                  <StaggeredSkeleton
                    className="h-4 w-3/4 max-w-sm"
                    delay={350 + i * 75}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Chat input */}
          <div className="border-t border-neutral-800 p-4">
            <StaggeredSkeleton className="h-12 w-full rounded-xl" delay={700} />
          </div>
        </main>

        {/* Sidebar - 40% (hidden on mobile) */}
        <aside className="hidden lg:flex lg:flex-col lg:flex-[2] max-w-[400px] border-l border-neutral-800 bg-neutral-950/50 overflow-y-auto">
          {/* Upcoming events section */}
          <div className="p-4 border-b border-neutral-800 space-y-4">
            <StaggeredSkeleton className="h-5 w-24" delay={300} />
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <StaggeredSkeleton
                    className="h-10 w-10 rounded-lg"
                    delay={350 + i * 50}
                  />
                  <div className="flex-1">
                    <StaggeredSkeleton
                      className="h-4 w-32 mb-1"
                      delay={375 + i * 50}
                    />
                    <StaggeredSkeleton
                      className="h-3 w-20"
                      delay={400 + i * 50}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pinned content section */}
          <div className="p-4 border-b border-neutral-800 space-y-4">
            <StaggeredSkeleton className="h-5 w-32" delay={500} />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <StaggeredSkeleton
                  key={i}
                  className="h-14 w-full rounded-lg"
                  delay={550 + i * 50}
                />
              ))}
            </div>
          </div>

          {/* Members section */}
          <div className="p-4 space-y-4">
            <StaggeredSkeleton className="h-5 w-28" delay={700} />
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((i) => (
                <StaggeredSkeleton
                  key={i}
                  className="h-8 w-8 rounded-full"
                  delay={750 + i * 40}
                />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
