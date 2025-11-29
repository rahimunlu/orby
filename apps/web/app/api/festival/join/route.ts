import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  const { nickname } = await request.json();

  // TODO: Create user wallet, generate session
  
  const userId = randomUUID();
  const sessionToken = randomUUID();
  const address = '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return NextResponse.json({
    userId,
    sessionToken,
    address,
  });
}
