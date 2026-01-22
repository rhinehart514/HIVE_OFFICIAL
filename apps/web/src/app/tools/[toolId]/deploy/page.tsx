import { redirect } from 'next/navigation';

/**
 * Tool Deploy Entry Point
 *
 * This route redirects to the main tool page with deploy modal open.
 * Kept as an entry point for deployment flows from external sources.
 */
export default function DeployRedirectPage({
  params,
  searchParams
}: {
  params: { toolId: string };
  searchParams: { spaceId?: string };
}) {
  const spaceParam = searchParams.spaceId ? `&spaceId=${searchParams.spaceId}` : '';
  redirect(`/tools/${params.toolId}?deploy=true${spaceParam}`);
}
