import { ImageResponse } from 'next/og';

export const runtime = 'edge';

/**
 * GET /api/og/landing
 *
 * Custom OG image for hive.college landing page.
 * Shows the creation prompt + campus context.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#080808',
          backgroundImage:
            'radial-gradient(circle at 30% 30%, rgba(16, 185, 129, 0.06) 0%, transparent 50%)',
          padding: '80px',
        }}
      >
        {/* HIVE wordmark */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 700,
            color: '#D4AF37',
            marginBottom: 60,
          }}
        >
          HIVE
        </div>

        {/* Main headline */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: 'white',
              lineHeight: 1.1,
              marginBottom: 24,
            }}
          >
            Your campus runs on
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: '#10B981',
              lineHeight: 1.1,
              marginBottom: 40,
            }}
          >
            what you make.
          </div>

          {/* Prompt mock */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              borderRadius: 16,
              border: '1px solid rgba(16, 185, 129, 0.15)',
              backgroundColor: 'rgba(16, 185, 129, 0.03)',
              padding: '20px 28px',
              maxWidth: 600,
            }}
          >
            <div
              style={{
                fontSize: 24,
                color: 'rgba(255, 255, 255, 0.5)',
              }}
            >
              &quot;Make a rush RSVP tracker for my frat&quot;
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#10B981',
              }}
            />
            <div
              style={{
                fontSize: 20,
                color: 'rgba(16, 185, 129, 0.7)',
              }}
            >
              Live at University at Buffalo
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              color: 'rgba(255, 255, 255, 0.3)',
            }}
          >
            hive.college
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    }
  );
}
