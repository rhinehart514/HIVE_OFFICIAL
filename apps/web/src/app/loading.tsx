/**
 * Root Loading State
 *
 * Shows loading spinner for the app root.
 */

export default function RootLoading() {
  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-white/10 border-t-white/60 rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm text-white/40">Loading HIVE...</p>
      </div>
    </div>
  );
}
