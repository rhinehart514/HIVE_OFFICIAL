export default function ToolAnalyticsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 h-8 w-32 rounded bg-white/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
        <div className="h-64 rounded-lg bg-white/[0.06]" />
      </div>
    </div>
  );
}
