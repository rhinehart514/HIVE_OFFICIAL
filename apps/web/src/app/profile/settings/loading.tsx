export default function ProfileSettingsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="h-8 w-28 bg-white/5 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
