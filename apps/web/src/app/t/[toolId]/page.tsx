/**
 * Standalone Tool Page - /t/[toolId]
 *
 * Server component for metadata generation and public tool access.
 * Delegates UI to StandaloneToolClient.
 */

import { Metadata } from 'next';
import { StandaloneToolLoader } from './StandaloneToolLoader';

interface Props {
  params: Promise<{ toolId: string }>;
}

interface ToolData {
  id: string;
  name: string;
  description?: string;
  ownerName?: string;
}

// Fetch tool data for metadata (server-side)
async function fetchToolForMetadata(toolId: string): Promise<ToolData | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';
    const response = await fetch(`${baseUrl}/api/tools/${toolId}`, {
      cache: 'no-store', // Always fetch fresh for OG tags
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    return result.data || result;
  } catch {
    return null;
  }
}

// Generate metadata for OG tags and SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = await fetchToolForMetadata(toolId);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';

  if (!tool) {
    return {
      title: 'Creation',
      description: 'Create and share on HIVE',
      openGraph: {
        title: 'HIVE',
        description: 'Create and share on HIVE',
        siteName: 'HIVE',
        type: 'website',
      },
    };
  }

  const ogDescription = tool.description
    || (tool.ownerName ? `Built by ${tool.ownerName} on HIVE` : 'An interactive tool on HIVE');

  return {
    title: `${tool.name} | HIVE`,
    description: ogDescription,
    openGraph: {
      title: tool.name,
      description: ogDescription,
      url: `${baseUrl}/t/${toolId}`,
      siteName: 'HIVE',
      images: [
        {
          url: `${baseUrl}/api/og/tool/${toolId}`,
          width: 1200,
          height: 630,
          alt: tool.name,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: tool.name,
      description: ogDescription,
      images: [`${baseUrl}/api/og/tool/${toolId}`],
    },
    other: {
      'theme-color': '#000000',
    },
  };
}

export default async function StandaloneToolPage({ params }: Props) {
  const { toolId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';

  return <StandaloneToolLoader toolId={toolId} baseUrl={baseUrl} />;
}
