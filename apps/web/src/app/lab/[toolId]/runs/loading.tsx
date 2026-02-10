export default function ToolRunsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 h-8 w-24 rounded bg-white/[0.06]" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
