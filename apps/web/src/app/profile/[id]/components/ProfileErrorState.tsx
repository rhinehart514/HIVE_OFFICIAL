/**
 * ProfileErrorState - Error state for profile page
 */

interface ProfileErrorStateProps {
  error: string;
  onNavigate: () => void;
}

export function ProfileErrorState({ error, onNavigate }: ProfileErrorStateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[var(--bg-void)]">
      <div className="text-center max-w-md">
        <p className="text-[var(--text-muted)] text-sm mb-2">Profile Not Available</p>
        <p className="text-[var(--text-secondary)] mb-6">{error}</p>
        <button
          onClick={onNavigate}
          className="text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
        >
          Browse Spaces →
        </button>
      </div>
    </div>
  );
}
