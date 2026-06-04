import { NextResponse } from 'next/server';
import { getVideos, addVideo, deleteVideo } from '@/lib/db';

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '');
  const correctEmail = process.env.ADMIN_EMAIL || 'spkchaudhary9211@gmail.com';
  const correctPassword = process.env.ADMIN_PASSWORD || 'Ankit@9211';
  const expectedToken = Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64');
  return token === expectedToken;
}

export async function GET() {
  try {
    const videos = await getVideos();
    return NextResponse.json(videos);
  } catch (err: any) {
    console.error('GET /api/videos error:', err);
    return NextResponse.json({ error: `Failed to fetch videos: ${err?.message || String(err)}` }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { title, description, url, category, customThumbnail } = body;

    if (!title || !url || !category) {
      return NextResponse.json({ error: 'Title, URL, and Category are required' }, { status: 400 });
    }

    const video = await addVideo({ title, description: description || '', url, category }, customThumbnail);
    return NextResponse.json(video);
  } catch (err: any) {
    console.error('POST /api/videos error:', err);
    return NextResponse.json({ error: `Failed to add video: ${err?.message || String(err)}` }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID parameter is required' }, { status: 400 });
    }

    const success = await deleteVideo(id);
    if (success) {
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: 'Video not found' }, { status: 404 });
  } catch (err: any) {
    console.error('DELETE /api/videos error:', err);
    return NextResponse.json({ error: `Failed to delete video: ${err?.message || String(err)}` }, { status: 500 });
  }
}
