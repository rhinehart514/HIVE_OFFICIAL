import { NextRequest } from 'next/server';
import QRCode from 'qrcode';
import { withErrors } from '@/lib/middleware';

export const GET = withErrors(async (request: Request, _context, respond) => {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return respond.error('URL parameter required', 'INVALID_INPUT', { status: 400 });
  }

  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
    errorCorrectionLevel: 'M',
  });

  // Extract base64 data
  const base64Data = qrDataUrl.split(',')[1];
  const buffer = Buffer.from(base64Data, 'base64');

  return new Response(buffer, {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}, { rateLimit: { maxRequests: 50, windowMs: 60000 } });
