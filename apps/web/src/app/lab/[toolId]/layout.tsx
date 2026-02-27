import type { Metadata } from 'next';

interface Props {
  children: React.ReactNode;
  params: Promise<{ toolId: string }>;
}

async function fetchToolForMetadata(toolId: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';
  try {
    const response = await fetch(`${baseUrl}/api/tools/${toolId}`, {
      cache: 'no-store',
    });
    if (!response.ok) return null;
    const json = await response.json();
    return json.data || json.tool || (json.id ? json : null);
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { toolId } = await params;
  const tool = await fetchToolForMetadata(toolId);

  if (!tool) {
    return {
      title: 'HiveLab',
      description: 'Create anything for your campus.',
    };
  }

  const name = tool.name || 'Untitled';
  const description = tool.description || `${name} — built on HIVE.`;

  return {
    title: `${name} · HiveLab`,
    description: description.slice(0, 160),
    openGraph: {
      title: `${name} · HiveLab | HIVE`,
      description: description.slice(0, 160),
      type: 'website',
      siteName: 'HIVE',
    },
  };
}

export default function ToolLayout({ children }: Props) {
  return <>{children}</>;
}
