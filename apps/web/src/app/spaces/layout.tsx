import { type Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Spaces',
  description: 'Discover and join communities on campus',
};

export default function SpacesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      {children}
    </div>
  );
}
