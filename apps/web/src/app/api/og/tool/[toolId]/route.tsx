import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

// Fetch tool data for OG image
async function getToolData(toolId: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://hive.college';
    const response = await fetch(`${baseUrl}/api/tools/${toolId}`, {
      headers: {
        'Cache-Control': 'no-cache',
      },
    });

    if (!response.ok) {
      throw new Error('Tool not found');
    }

    const data = await response.json();
    return data.data || data;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ toolId: string }> }
) {
  try {
    const { toolId } = await params;
    const tool = await getToolData(toolId);

    if (!tool) {
      // Return default HIVE card
      return new ImageResponse(
        (
          <div
            style={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#0A0A0A',
              backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)',
            }}
          >
            <div
              style={{
                fontSize: 120,
                fontWeight: 700,
                color: '#D4AF37',
                marginBottom: 32,
              }}
            >
              HIVE
            </div>
            <div
              style={{
                fontSize: 32,
                color: 'rgba(255, 255, 255, 0.6)',
              }}
            >
              Create tools in seconds
            </div>
          </div>
        ),
        {
          width: 1200,
          height: 630,
        }
      );
    }

    // Generate tool-specific card
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0A0A0A',
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(212, 175, 55, 0.05) 0%, transparent 50%)',
            padding: '80px',
          }}
        >
          {/* Header with HIVE logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: 60,
            }}
          >
            <div
              style={{
                fontSize: 32,
                fontWeight: 700,
                color: '#D4AF37',
              }}
            >
              HIVE
            </div>
          </div>

          {/* Tool content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            <div
              style={{
                fontSize: 72,
                fontWeight: 700,
                color: 'white',
                lineHeight: 1.2,
                marginBottom: 24,
                maxWidth: '90%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {tool.name}
            </div>

            {tool.description && (
              <div
                style={{
                  fontSize: 32,
                  color: 'rgba(255, 255, 255, 0.6)',
                  lineHeight: 1.4,
                  maxWidth: '90%',
                  overflow: 'hidden',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {tool.description}
              </div>
            )}
          </div>

          {/* Footer with attribution */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 60,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {tool.ownerAvatar && (
                <img
                  alt=""
                  src={tool.ownerAvatar}
                  width={48}
                  height={48}
                  style={{
                    borderRadius: '50%',
                  }}
                />
              )}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    color: 'white',
                  }}
                >
                  {tool.ownerName || 'Anonymous'}
                </div>
                {tool.campusName && (
                  <div
                    style={{
                      fontSize: 20,
                      color: 'rgba(255, 255, 255, 0.5)',
                    }}
                  >
                    {tool.campusName}
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 20,
                color: 'rgba(255, 255, 255, 0.4)',
              }}
            >
              <span>👁️</span>
              <span>{tool.viewCount || 0} views</span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Failed to generate OG image:', error);

    // Return error card
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0A0A0A',
          }}
        >
          <div
            style={{
              fontSize: 48,
              color: 'rgba(255, 255, 255, 0.6)',
            }}
          >
            HIVE
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
