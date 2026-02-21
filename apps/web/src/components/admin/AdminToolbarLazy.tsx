'use client';

import dynamic from 'next/dynamic';

const AdminToolbar = dynamic(() => import('./AdminToolbar'), { ssr: false });

export function AdminToolbarLazy() {
  return <AdminToolbar />;
}
