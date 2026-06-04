import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();
    const correctEmail = process.env.ADMIN_EMAIL || 'spkchaudhary9211@gmail.com';
    const correctPassword = process.env.ADMIN_PASSWORD || 'Ankit@9211';

    if (email === correctEmail && password === correctPassword) {
      // Create token from credentials
      const token = Buffer.from(`${correctEmail}:${correctPassword}`).toString('base64');
      return NextResponse.json({ success: true, token });
    }

    return NextResponse.json({ success: false, error: 'Incorrect email or password' }, { status: 401 });
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Invalid request body' }, { status: 400 });
  }
}
