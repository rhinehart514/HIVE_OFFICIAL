/**
 * Standalone Tool Page - /t/[toolId]
 *
 * Server component for metadata generation and public tool access.
 * Delegates interactive UI to StandaloneToolClient.
 */

import { Metadata } from 'next';
import { StandaloneToolClient } from './StandaloneToolClient';

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
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.com';

  if (!tool) {
    return {
      title: 'Tool | HIVE',
      description: 'Create and share tools instantly',
    };
  }

  return {
    title: `${tool.name} | HIVE`,
    description: tool.description || `Check out this tool on HIVE`,
    openGraph: {
      title: tool.name,
      description: tool.description || `Built by ${tool.ownerName || 'a HIVE user'}`,
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
      description: tool.description || `Built by ${tool.ownerName || 'a HIVE user'}`,
      images: [`${baseUrl}/api/og/tool/${toolId}`],
    },
  };
}

export default async function StandaloneToolPage({ params }: Props) {
  const { toolId } = await params;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://hive.com');

  return <StandaloneToolClient toolId={toolId} baseUrl={baseUrl} />;
}
