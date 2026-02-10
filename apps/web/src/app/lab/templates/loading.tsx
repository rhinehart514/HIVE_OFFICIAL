export default function ToolTemplatesLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="mb-6 h-8 w-36 rounded bg-white/[0.06]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 rounded-lg bg-white/[0.06]" />
          ))}
        </div>
      </div>
    </div>
  );
}
