import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Try parsing the URL to check its validity and extract the origin
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(imageUrl);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const origin = parsedUrl.origin;

    // Fetch the image from the server context to bypass hotlinking protection
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': origin, // Set referer to target origin to spoof native site requests
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      },
      next: { revalidate: 3600 } // Cache target image locally for 1 hour
    });

    if (!res.ok) {
      console.error(`Image proxy fetch failed for ${imageUrl} with status ${res.status}`);
      // Return a sleek default SVG placeholder instead of crashing
      return new NextResponse(
        `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360" viewBox="0 0 640 360">
          <defs>
            <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#120e24" />
              <stop offset="100%" stop-color="#05030a" />
            </linearGradient>
          </defs>
          <rect width="640" height="360" fill="url(#g)"/>
          <text x="50%" y="50%" fill="#9333ea" font-family="sans-serif" font-weight="bold" font-size="18" text-anchor="middle" opacity="0.8">Thumbnail Not Available</text>
          <rect x="2" y="2" width="636" height="356" fill="none" stroke="#9333ea" stroke-width="2" stroke-dasharray="10" opacity="0.3"/>
        </svg>`,
        {
          headers: {
            'Content-Type': 'image/svg+xml',
            'Cache-Control': 'public, max-age=600' // Short cache for errors
          }
        }
      );
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache in client browser and edge CDN for 24h
        'Access-Control-Allow-Origin': '*' // Enable CORS
      }
    });
  } catch (err: any) {
    console.error('Image proxy server error:', err);
    return NextResponse.json({ error: 'Server failed to proxy image' }, { status: 500 });
  }
}
