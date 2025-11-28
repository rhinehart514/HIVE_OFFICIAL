/**
 * Onboarding Page Loading Skeleton
 * Shows a centered loading state matching the onboarding wizard
 */

export default function OnboardingLoading() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      {/* Logo placeholder */}
      <div className="w-12 h-12 rounded-xl bg-gold-500/20 animate-pulse mb-8" />

      {/* Card Container */}
      <div className="w-full max-w-md bg-neutral-900/50 border border-neutral-800/50 rounded-2xl p-8">
        {/* Progress bar */}
        <div className="flex gap-2 mb-8">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-1 flex-1 rounded-full bg-neutral-800 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>

        {/* Title */}
        <div className="h-7 w-48 bg-neutral-800 rounded mb-3 animate-pulse" />

        {/* Subtitle */}
        <div className="h-4 w-64 bg-neutral-800/60 rounded mb-8 animate-pulse" />

        {/* Form fields placeholder */}
        <div className="space-y-4 mb-8">
          <div className="h-11 w-full bg-neutral-800/50 rounded-lg animate-pulse" />
          <div className="h-11 w-full bg-neutral-800/50 rounded-lg animate-pulse" />
          <div className="h-11 w-full bg-neutral-800/50 rounded-lg animate-pulse" />
        </div>

        {/* Continue button */}
        <div className="h-11 w-full bg-gold-500/20 rounded-lg animate-pulse" />
      </div>

      {/* Footer link */}
      <div className="h-4 w-32 bg-neutral-800/40 rounded mt-6 animate-pulse" />
    </div>
  );
}
