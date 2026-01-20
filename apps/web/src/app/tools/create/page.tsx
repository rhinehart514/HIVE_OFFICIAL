'use client';

/**
 * /tools/create Redirect
 *
 * This route is deprecated. All tool creation now happens on /tools.
 * This page handles legacy sessionStorage prompts and redirects to the new flow.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateToolRedirect() {
  const router = useRouter();

  useEffect(() => {
    // Handle legacy sessionStorage approach
    const prompt = sessionStorage.getItem('hivelab_initial_prompt');
    const template = sessionStorage.getItem('hivelab_template_id');

    // Clear after reading
    sessionStorage.removeItem('hivelab_initial_prompt');
    sessionStorage.removeItem('hivelab_template_id');

    // Build redirect URL with params
    const params = new URLSearchParams();
    if (prompt) params.set('prompt', prompt);
    if (template) params.set('template', template);

    const query = params.toString();
    router.replace(`/tools${query ? `?${query}` : ''}`);
  }, [router]);

  // Minimal loading state while redirecting
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--bg-void, #050504)' }}
    >
      <div className="w-5 h-5 border-2 border-white/10 border-t-white/50 rounded-full animate-spin" />
    </div>
  );
}
