import { NextResponse } from 'next/server';
import { balanceStore } from '@/lib/store';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const sessionToken = searchParams.get('sessionToken');

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Get balance from in-memory store
  const balance = balanceStore.get(userId);

  return NextResponse.json({
    usdt: balance.usdt.toString(),
    festivalTokens: balance.festivalTokens.toString(),
    userAddress: '0x' + userId.replace(/-/g, '').slice(0, 40).padEnd(40, '0'),
    treasuryAddress: '0xTreasury' + '0'.repeat(32),
  });
}
