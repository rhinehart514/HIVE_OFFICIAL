import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool analytics now open on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default function AnalyticsRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}?settings=true&tab=analytics`);
}
