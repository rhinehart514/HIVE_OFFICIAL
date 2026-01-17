export default function SpaceAnalyticsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="h-8 w-32 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
