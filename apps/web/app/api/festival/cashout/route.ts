import { NextResponse } from 'next/server';
import { balanceStore } from '@/lib/store';

export async function POST(request: Request) {
  const { userId, sessionToken } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Get current balance
  const balance = balanceStore.get(userId);

  // Burn all festival tokens
  const tokensToBurn = balance.festivalTokens;
  balanceStore.subtractTokens(userId, tokensToBurn);

  // Return USDT (1:1 conversion)
  const usdtToReturn = tokensToBurn / BigInt(1e12); // Convert 18 decimals to 6
  balanceStore.addUsdt(userId, usdtToReturn);

  // Generate mock transaction hashes
  const burnHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const transferHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return NextResponse.json({
    success: true,
    burnHash,
    transferHash,
  });
}
