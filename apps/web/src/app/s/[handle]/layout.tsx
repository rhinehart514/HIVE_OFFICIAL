import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Space',
  description: 'Your community on HIVE',
};

export default function SpaceLayout({ children }: { children: React.ReactNode }) {
  return children;
}
