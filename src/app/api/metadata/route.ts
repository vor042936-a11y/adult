import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetUrl = searchParams.get('url');

    if (!targetUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
    }

    // Attempt to fetch the target URL with standard user agent to avoid basic bot triggers
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Site returned error code: ${res.status}` }, { status: 400 });
    }

    // Inspect content-type
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('video/') || contentType.includes('application/x-mpegURL') || contentType.includes('application/vnd.apple.mpegurl')) {
      // It's a direct stream file, extract name from the URL pathname
      const urlObj = new URL(targetUrl);
      const filename = urlObj.pathname.split('/').pop() || 'Direct Video Stream';
      const cleanTitle = decodeURIComponent(filename).replace(/\.[^/.]+$/, ""); // remove extension
      return NextResponse.json({ 
        title: cleanTitle || 'Direct Video Stream', 
        thumbnail: '' 
      });
    }

    const html = await res.text();

    // 1. Title Extraction
    let title = '';
    // Standard HTML title tag
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].trim();
    }

    // OpenGraph Title (og:title)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i) ||
                         html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:title["']/i);
    if (ogTitleMatch && ogTitleMatch[1]) {
      title = ogTitleMatch[1].trim();
    }

    // 2. Thumbnail Extraction
    let thumbnail = '';
    // OpenGraph Image (og:image)
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i) ||
                          html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogImageMatch && ogImageMatch[1]) {
      thumbnail = ogImageMatch[1].trim();
    }

    // Twitter Image fallback
    if (!thumbnail) {
      const twitterImageMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i) ||
                                html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image["']/i);
      if (twitterImageMatch && twitterImageMatch[1]) {
        thumbnail = twitterImageMatch[1].trim();
      }
    }

    // Clean html entities inside title
    if (title) {
      title = title
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'")
        .replace(/&ndash;/g, '-')
        .replace(/&mdash;/g, '-');
    }

    return NextResponse.json({ title, thumbnail });
  } catch (err: any) {
    console.error('Metadata API extraction error:', err);
    return NextResponse.json({ error: err.message || 'Scraper failed to connect to site' }, { status: 500 });
  }
}
