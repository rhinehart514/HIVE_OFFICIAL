import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { ToolLayoutClient } from './tool-layout-client';

interface Props {
  children: React.ReactNode;
  params: Promise<{ toolId: string }>;
}

// Fetch tool data server-side for metadata
async function fetchToolForMetadata(toolId: string) {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  try {
    const response = await fetch(`${baseUrl}/api/tools/${toolId}`, {
      headers: sessionCookie ? { Cookie: `session=${sessionCookie}` } : {},
      cache: 'no-store',
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();
    // Handle different response shapes:
    // - Standard middleware: { success: true, data: { ...tool } }
    // - Legacy format: { tool: { ...tool } }
    // - Direct format: { id, name, ... }
    return json.data || json.tool || (json.id ? json : null);
  } catch {
    return null;
  }
}

/**
 * Tool Studio Layout
 *
 * Wraps all tool-specific routes: edit, preview, deploy, settings, analytics, run.
 * Provides dynamic OG metadata based on tool data.
 * Uses LayoutProvider to hide shell (immersion archetype).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = await fetchToolForMetadata(toolId);

  if (!tool) {
    return {
      title: 'Tool Not Found',
      description: 'This tool could not be found.',
    };
  }

  const name = tool.name || 'Untitled Tool';
  const description = tool.description || `${name} - built with HiveLab on HIVE.`;
  const category = tool.category || 'tool';

  return {
    title: `${name} · HiveLab`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} · HiveLab | HIVE`,
      description: description.slice(0, 160),
      type: 'website',
      siteName: 'HIVE',
    },
    twitter: {
      card: 'summary',
      title: `${name} · HiveLab | HIVE`,
      description: description.slice(0, 160),
    },
    keywords: ['hive', 'hivelab', 'tool', category, name.toLowerCase()],
  };
}

export default function ToolLayout({ children }: Props) {
  return <ToolLayoutClient>{children}</ToolLayoutClient>;
}
