import { redirect } from 'next/navigation';

export default function PreviewRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}`);
}
