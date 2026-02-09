import { redirect } from 'next/navigation';

export default function RitualsLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect('/discover');
}
