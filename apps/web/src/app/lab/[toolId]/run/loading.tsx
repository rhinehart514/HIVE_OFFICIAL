/**
 * Loading state for /run redirect page
 * Minimal since it immediately redirects to the unified tool page
 */
export default function RunToolLoading() {
  return (
    <div className="min-h-screen bg-[var(--hivelab-bg)] flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[var(--life-gold)] border-t-transparent rounded-full  mx-auto mb-4" />
        <p className="text-[var(--hivelab-text-secondary)] text-sm">Loading...</p>
      </div>
    </div>
  );
}
