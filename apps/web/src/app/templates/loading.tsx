export default function TemplatesLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="h-8 w-36 bg-white/[0.06] rounded  mb-6" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 bg-white/[0.06] rounded-lg " />
          ))}
        </div>
      </div>
    </div>
  );
}
