import { NextResponse } from 'next/server';
import { getAds, updateAds, getDbConnectionStatus } from '@/lib/db';

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
    const ads = await getAds();
    const dbStatus = getDbConnectionStatus();
    return NextResponse.json({ ads, dbStatus });
  } catch (err: any) {
    console.error('GET /api/ads error:', err);
    return NextResponse.json({ 
      error: `Failed to fetch ads: ${err?.message || String(err)}`,
      dbStatus: getDbConnectionStatus()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!verifyAdmin(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { placement, code } = body;

    if (!placement) {
      return NextResponse.json({ error: 'Placement parameter is required' }, { status: 400 });
    }

    const ad = await updateAds(placement, code || '');
    return NextResponse.json(ad);
  } catch (err: any) {
    console.error('POST /api/ads error:', err);
    return NextResponse.json({ error: `Failed to update ads: ${err?.message || String(err)}` }, { status: 500 });
  }
}
