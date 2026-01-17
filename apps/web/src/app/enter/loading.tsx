/**
 * Entry Loading State
 *
 * Matches the EntryShell visual with centered loading spinner.
 * Keeps user oriented during initial hydration.
 */

export default function EntryLoading() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      {/* Subtle ambient glow (neutral state) */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.05) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 text-center">
        {/* Loading spinner */}
        <div className="mb-6 flex justify-center">
          <div className="w-12 h-12 relative">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-white/60 animate-spin" />
          </div>
        </div>

        <p className="text-sm text-white/40">Loading</p>
      </div>
    </div>
  );
}
