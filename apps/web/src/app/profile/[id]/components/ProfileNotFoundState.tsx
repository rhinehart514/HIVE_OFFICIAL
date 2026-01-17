/**
 * ProfileNotFoundState - Not found state for profile page
 */

interface ProfileNotFoundStateProps {
  onNavigate: () => void;
}

export function ProfileNotFoundState({ onNavigate }: ProfileNotFoundStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-void)]">
      <div className="text-center max-w-md">
        <p className="text-[var(--text-muted)] text-sm mb-2">Profile Not Found</p>
        <p className="text-[var(--text-secondary)] mb-6">
          This profile doesn&apos;t exist or has been removed.
        </p>
        <button
          onClick={onNavigate}
          className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          Back to Feed →
        </button>
      </div>
    </div>
  );
}
