/**
 * Entry Loading State
 *
 * Matches the EntryShell visual with centered loading spinner.
 * Keeps user oriented during initial hydration.
 */

export default function EntryLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="absolute inset-0 pointer-events-none bg-white/[0.06]" />

      <div className="relative z-10 text-center">
        {/* Static loading marker */}
        <div className="mb-6 flex justify-center">
          <div className="w-12 h-12 relative rounded-full border border-white/[0.06]">
            <div className="absolute inset-0 m-auto h-2.5 w-2.5 rounded-full bg-white/50" />
          </div>
        </div>

        <p className="text-sm text-white/40">Loading</p>
      </div>
    </div>
  );
}
