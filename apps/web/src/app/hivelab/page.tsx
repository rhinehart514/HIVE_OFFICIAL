import { redirect } from 'next/navigation';

/**
 * HiveLab Hub - Redirects to Tools
 *
 * For HiveLab-only launch, /tools is the main hub.
 * Users see their tools + marketplace, then click "Create" to build.
 */
export default function HiveLabPage() {
  redirect('/tools');
}
