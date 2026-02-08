import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool deployment now opens on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default async function DeployRedirectPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  redirect(`/lab/${toolId}?deploy=true`);
}
