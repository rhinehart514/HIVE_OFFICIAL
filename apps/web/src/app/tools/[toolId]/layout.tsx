import type { Metadata } from 'next';
import { cookies } from 'next/headers';

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

    const data = await response.json();
    return data.tool || data;
  } catch {
    return null;
  }
}

/**
 * Tool Studio Layout
 *
 * Wraps all tool-specific routes: edit, preview, deploy, settings, analytics, run.
 * Provides dynamic OG metadata based on tool data.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = await fetchToolForMetadata(toolId);

  if (!tool) {
    return {
      title: 'Tool Not Found - HiveLab',
      description: 'This tool could not be found.',
    };
  }

  const name = tool.name || 'Untitled Tool';
  const description = tool.description || `${name} - built with HiveLab on HIVE.`;
  const category = tool.category || 'tool';

  return {
    title: `${name} - HiveLab`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} - HiveLab`,
      description: description.slice(0, 160),
      type: 'website',
      siteName: 'HIVE',
    },
    twitter: {
      card: 'summary',
      title: `${name} - HiveLab`,
      description: description.slice(0, 160),
    },
    keywords: ['hive', 'hivelab', 'tool', category, name.toLowerCase()],
  };
}

export default function ToolLayout({ children }: Props) {
  // Full bleed layout for studio - each page controls its own chrome
  return children;
}
