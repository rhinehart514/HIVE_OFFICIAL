export default function RitualsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="h-8 w-28 bg-white/5 rounded animate-pulse mb-6" />
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
