export default function SpaceSettingsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-28 bg-white/5 rounded animate-pulse mb-8" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="h-4 w-24 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-12 w-full bg-white/5 rounded-lg animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
