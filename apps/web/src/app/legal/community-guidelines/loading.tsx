export default function CommunityGuidelinesLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="h-10 w-72 bg-white/[0.06] rounded  mb-8" />
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-4 w-full bg-white/[0.06] rounded " />
          ))}
        </div>
      </div>
    </div>
  );
}
