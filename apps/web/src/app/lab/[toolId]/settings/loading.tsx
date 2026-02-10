export default function ToolSettingsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-8 h-8 w-28 rounded bg-white/[0.06]" />
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i}>
              <div className="mb-2 h-4 w-24 rounded bg-white/[0.06]" />
              <div className="h-12 w-full rounded-lg bg-white/[0.06]" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
