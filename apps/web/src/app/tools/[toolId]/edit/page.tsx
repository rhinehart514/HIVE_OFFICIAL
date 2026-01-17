import { redirect } from 'next/navigation';

export default function EditRedirectPage({ params }: { params: { toolId: string } }) {
  redirect(`/tools/${params.toolId}`);
}
