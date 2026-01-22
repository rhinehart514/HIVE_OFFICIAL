import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool settings now open on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default function SettingsRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}?settings=true`);
}
