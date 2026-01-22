import { redirect } from 'next/navigation';

/**
 * @deprecated This route is deprecated. Tool editing now happens on the main tool page.
 * Redirect maintained for backward compatibility.
 */
export default function EditRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}`);
}
