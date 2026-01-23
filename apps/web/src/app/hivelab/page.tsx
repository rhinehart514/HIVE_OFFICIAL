import { redirect } from 'next/navigation';

/**
 * HiveLab Hub - Redirects to /lab
 *
 * HiveLab is now integrated into the main web app as "Lab".
 * This route maintains backward compatibility.
 */
export default function HiveLabPage() {
  redirect('/lab');
}
