import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool settings now open on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default async function SettingsRedirectPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  redirect(`/tools/${toolId}?settings=true`);
}
