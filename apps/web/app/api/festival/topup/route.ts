import { NextResponse } from 'next/server';
import { balanceStore } from '@/lib/store';

export async function POST(request: Request) {
  const { userId, sessionToken, amountUsdt } = await request.json();

  if (!userId || !amountUsdt) {
    return NextResponse.json({ error: 'userId and amountUsdt required' }, { status: 400 });
  }

  // Convert USDT to base units (6 decimals)
  const usdtAmount = BigInt(Math.floor(amountUsdt * 1_000_000));

  // Check if user has enough USDT
  const currentBalance = balanceStore.get(userId);
  if (currentBalance.usdt < usdtAmount) {
    return NextResponse.json({ error: 'Insufficient USDT balance' }, { status: 400 });
  }

  // SUBTRACT USDT from balance (user pays)
  balanceStore.subtractUsdt(userId, usdtAmount);

  // ADD festival tokens (user receives, 1:1 ratio)
  const tokenAmount = BigInt(Math.floor(amountUsdt * 1e18));
  balanceStore.addTokens(userId, tokenAmount);

  // Generate mock transaction hashes
  const transferHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  const mintHash = '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');

  return NextResponse.json({
    success: true,
    transferHash,
    mintHash,
  });
}
