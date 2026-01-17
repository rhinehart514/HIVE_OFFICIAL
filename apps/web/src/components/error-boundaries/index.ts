// Production-ready error boundary system for HIVE platform
// Prevents app crashes by isolating component failures with graceful recovery
// All boundaries use the shared ErrorBoundary class with context-aware fallbacks

export { FeedErrorBoundary } from './feed-error-boundary';
export { SpacesErrorBoundary } from './spaces-error-boundary';
export { ProfileErrorBoundary } from './profile-error-boundary';
export { ToolsErrorBoundary } from './tools-error-boundary';

// Note: ErrorBoundaryTest exists for local development testing
// but is not exported to avoid accidental production usage