import { NextResponse } from 'next/server';

/**
 * GET /api/tools/recommendations
 * Stub: returns empty trending list. The discover page falls back to /api/tools/browse.
 */
export async function GET() {
  return NextResponse.json({ data: { trending: [] } });
}
