import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool preview now happens on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default function PreviewRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}`);
}
