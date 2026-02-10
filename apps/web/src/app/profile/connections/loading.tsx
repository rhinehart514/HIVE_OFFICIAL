export default function ProfileConnectionsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-36 bg-white/[0.06] rounded  mb-6" />
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.06]">
              <div className="w-10 h-10 rounded-full bg-white/[0.06] " />
              <div className="flex-1">
                <div className="h-4 w-24 bg-white/[0.06] rounded  mb-1" />
                <div className="h-3 w-16 bg-white/[0.06] rounded " />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
