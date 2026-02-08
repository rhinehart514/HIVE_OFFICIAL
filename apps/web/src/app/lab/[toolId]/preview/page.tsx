import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool preview now opens on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default async function PreviewRedirectPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  redirect(`/lab/${toolId}?mode=use`);
}
