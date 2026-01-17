/**
 * ProfileEmptyState - Empty state when no spaces or connections
 */

interface ProfileEmptyStateProps {
  onNavigate: () => void;
}

export function ProfileEmptyState({ onNavigate }: ProfileEmptyStateProps) {
  return (
    <div className="max-w-md mx-auto px-4 py-8 text-center">
      <p className="text-[var(--text-muted)] text-sm">No spaces or connections yet</p>
      <button
        onClick={onNavigate}
        className="mt-3 text-sm text-[var(--text-secondary)] hover:text-white transition-colors"
      >
        Find classmates →
      </button>
    </div>
  );
}
