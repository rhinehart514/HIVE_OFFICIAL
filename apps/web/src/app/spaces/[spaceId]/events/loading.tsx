export default function SpaceEventsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-28 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-white/5 rounded-lg animate-pulse shrink-0" />
                <div className="flex-1">
                  <div className="h-5 w-48 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-2" />
                  <div className="h-3 w-24 bg-white/5 rounded animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
