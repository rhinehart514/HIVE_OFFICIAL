export default function SpaceModerationLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-36 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
