export default function ProfileEditLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="h-8 w-32 bg-white/[0.06] rounded  mb-8" />
        <div className="space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-white/[0.06] " />
            <div className="h-10 w-32 bg-white/[0.06] rounded-lg " />
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i}>
              <div className="h-4 w-20 bg-white/[0.06] rounded  mb-2" />
              <div className="h-12 w-full bg-white/[0.06] rounded-lg " />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
