/**
 * Profile Page Loading Skeleton
 * Matches the profile page layout with bento grid
 */

function AvatarSkeleton() {
  return (
    <div className="relative">
      <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-neutral-800 animate-pulse" />
      <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-neutral-700 animate-pulse" />
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="h-6 w-8 bg-neutral-800 rounded animate-pulse" />
      <div className="h-3 w-12 bg-neutral-800/60 rounded animate-pulse" />
    </div>
  );
}

function BentoCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-5 animate-pulse ${className}`}>
      <div className="h-4 w-24 bg-neutral-800 rounded mb-4" />
      <div className="space-y-2">
        <div className="h-3 w-full bg-neutral-800/60 rounded" />
        <div className="h-3 w-3/4 bg-neutral-800/60 rounded" />
      </div>
    </div>
  );
}

export default function ProfileLoading() {
  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-6 mb-10">
          <AvatarSkeleton />

          <div className="flex-1 text-center md:text-left">
            {/* Name */}
            <div className="h-8 w-48 bg-neutral-800 rounded mb-2 mx-auto md:mx-0" />
            {/* Handle */}
            <div className="h-4 w-32 bg-neutral-800/60 rounded mb-4 mx-auto md:mx-0" />
            {/* Bio */}
            <div className="h-4 w-64 bg-neutral-800/50 rounded mb-4 mx-auto md:mx-0" />

            {/* Stats Row */}
            <div className="flex justify-center md:justify-start gap-8 mt-4">
              <StatSkeleton />
              <StatSkeleton />
              <StatSkeleton />
            </div>
          </div>

          {/* Edit Button */}
          <div className="h-10 w-24 bg-neutral-800 rounded-lg animate-pulse" />
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <BentoCardSkeleton className="md:col-span-2" />
          <BentoCardSkeleton />
          <BentoCardSkeleton />
          <BentoCardSkeleton className="md:col-span-2" />
          <BentoCardSkeleton className="lg:col-span-3" />
        </div>
      </div>
    </div>
  );
}
