import { redirect } from 'next/navigation';

export default function SettingsRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}?settings=true`);
}
