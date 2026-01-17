import { redirect } from 'next/navigation';

export default function AnalyticsRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}?settings=true&tab=analytics`);
}
