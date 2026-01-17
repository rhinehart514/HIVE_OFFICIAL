export default function EventDetailLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-48 bg-white/5 rounded-xl animate-pulse mb-6" />
        <div className="h-8 w-64 bg-white/5 rounded animate-pulse mb-4" />
        <div className="h-4 w-48 bg-white/5 rounded animate-pulse mb-2" />
        <div className="h-4 w-32 bg-white/5 rounded animate-pulse mb-8" />
        <div className="h-24 bg-white/5 rounded-lg animate-pulse" />
      </div>
    </div>
  );
}
