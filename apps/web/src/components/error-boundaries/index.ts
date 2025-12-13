// Production-ready error boundary system for HIVE platform
// Prevents app crashes by isolating component failures with graceful recovery

export { FeedErrorBoundary } from './feed-error-boundary';
export { SpacesErrorBoundary } from './spaces-error-boundary';
export { ProfileErrorBoundary } from './profile-error-boundary';
export { ToolsErrorBoundary } from './tools-error-boundary';

// Testing component (development only)
export { ErrorBoundaryTest } from './error-boundary-test';