import { redirect } from 'next/navigation';

// Templates page removed — creation is now chat-first via /build
export default function TemplatesPage() {
  redirect('/build');
}
