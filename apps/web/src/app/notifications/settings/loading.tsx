export default function NotificationSettingsLoading() {
  return (
    <div className="min-h-screen w-full">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="h-8 w-48 bg-white/5 rounded animate-pulse mb-6" />
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
