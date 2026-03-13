import { redirect } from 'next/navigation';

// Templates page removed — uses redirect() to navigate to chat-first /build
export default function TemplatesPage() {
  redirect('/build');
}
