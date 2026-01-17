export default function SpaceRolesLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-8 w-24 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
              <div className="h-5 w-32 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-4 w-48 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
