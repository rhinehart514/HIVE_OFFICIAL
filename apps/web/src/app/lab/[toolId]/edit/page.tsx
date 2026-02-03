import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool editing now happens on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default async function EditRedirectPage({ params }: { params: Promise<{ toolId: string }> }) {
  const { toolId } = await params;
  redirect(`/lab/${toolId}`);
}
