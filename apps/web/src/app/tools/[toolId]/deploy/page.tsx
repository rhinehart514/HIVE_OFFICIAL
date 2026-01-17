import { redirect } from 'next/navigation';

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
