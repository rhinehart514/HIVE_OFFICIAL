import { redirect } from 'next/navigation';

/**
 * /schools now redirects to / (landing page is school selection)
 */
export default function SchoolsPage() {
  redirect('/');
}
