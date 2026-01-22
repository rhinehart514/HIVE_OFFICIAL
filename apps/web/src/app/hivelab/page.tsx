import { redirect } from 'next/navigation';

/**
 * HiveLab Hub - Redirects to /tools
 *
 * HiveLab is now integrated into the main web app.
 * This route maintains backward compatibility.
 */
export default function HiveLabPage() {
  redirect('/tools');
}
