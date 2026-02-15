import { NextResponse } from 'next/server';

/**
 * GET /api/tools/browse
 * Stub: proxies to /api/tools/discover and reshapes the response.
 * Returns { tools: ToolSummary[] }
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '20';

  try {
    // Build absolute URL for internal fetch
    const origin = new URL(request.url).origin;
    const discoverUrl = `${origin}/api/tools/discover?limit=${limit}&sort=popular`;
    const res = await fetch(discoverUrl, {
      headers: { cookie: request.headers.get('cookie') || '' },
    });

    if (!res.ok) {
      return NextResponse.json({ data: { tools: [] } });
    }

    const payload = await res.json();
    const rawTools = payload?.data?.tools || payload?.tools || [];

    const tools = rawTools.map((t: Record<string, unknown>) => ({
      id: t.id,
      toolId: t.id,
      name: t.title || t.name || 'Untitled',
      description: t.description || '',
      deploymentCount: (t.forkCount as number) || 0,
    }));

    return NextResponse.json({ data: { tools } });
  } catch {
    return NextResponse.json({ data: { tools: [] } });
  }
}
