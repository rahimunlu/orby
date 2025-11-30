import { NextResponse } from 'next/server';
import { type Address } from 'viem';
import { wdkServer, ACCOUNT_INDEX } from '@/lib/wdk/server';
import { contractEncoders } from '@/lib/wdk/encoding';

// TestUSDT contract address
const TESTUSDT_ADDRESS = process.env.NEXT_PUBLIC_TESTUSDT_ADDRESS;

if (!TESTUSDT_ADDRESS) {
  console.warn('Warning: NEXT_PUBLIC_TESTUSDT_ADDRESS not configured');
}

/**
 * POST /api/admin/faucet
 * 
 * Mints TestUSDT tokens to the specified address.
 * Uses admin account (index 0) which is the contract owner.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { address, amount } = body;

    // Validate address
    if (!address || !address.startsWith('0x') || address.length !== 42) {
      return NextResponse.json(
        { error: 'Invalid address format' },
        { status: 400 }
      );
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be a positive number' },
        { status: 400 }
      );
    }

    if (!TESTUSDT_ADDRESS) {
      return NextResponse.json(
        { error: 'TestUSDT address not configured' },
        { status: 500 }
      );
    }

    // Convert amount to base units (6 decimals)
    const amountInBaseUnits = BigInt(Math.floor(amount * 1_000_000));

    // Encode faucet call
    const faucetData = contractEncoders.encodeFaucet(
      address as Address,
      amountInBaseUnits
    );

    // Send transaction using admin account (owner)
    const { hash } = await wdkServer.sendTransaction({
      accountIndex: ACCOUNT_INDEX.ADMIN,
      to: TESTUSDT_ADDRESS as Address,
      data: faucetData,
    });

    return NextResponse.json({
      success: true,
      hash,
      amount,
      recipient: address,
    });
  } catch (error) {
    console.error('Faucet error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to send tokens' },
      { status: 500 }
    );
  }
}
