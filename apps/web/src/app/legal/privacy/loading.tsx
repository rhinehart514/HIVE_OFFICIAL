export default function PrivacyLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-10 w-56 bg-white/5 rounded animate-pulse mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full bg-white/5 rounded animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
