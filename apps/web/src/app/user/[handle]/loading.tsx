import { HiveLogo } from '@hive/ui';

/**
 * Loading state for handle-based redirect
 * Shows briefly while looking up profile and redirecting
 */
export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-pulse">
          <HiveLogo size="xl" variant="default" showIcon showText={false} />
        </div>
        <p className="text-sm text-[#818187]">Redirecting...</p>
      </div>
    </div>
  );
}
