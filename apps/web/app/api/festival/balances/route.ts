import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const sessionToken = searchParams.get('sessionToken');

  // TODO: Validate session, fetch from blockchain
  
  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 });
  }

  // Mock balance response
  return NextResponse.json({
    usdt: '10000000', // 10.00 USDT (6 decimals)
    festivalTokens: '5000000000000000000', // 5 tokens (18 decimals)
    userAddress: '0x' + userId.replace(/-/g, '').slice(0, 40).padEnd(40, '0'),
    treasuryAddress: '0xTreasury' + '0'.repeat(32),
  });
}
