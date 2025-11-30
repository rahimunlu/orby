import { NextResponse } from 'next/server';
import { type Address } from 'viem';
import { wdkServer, ACCOUNT_INDEX } from '@/lib/wdk/server';
import { contractEncoders } from '@/lib/wdk/encoding';
import type { TopUpRequest, TopupResponse } from '@orby/types';

// Contract addresses from config
const USDT_ADDRESS = process.env.USDT_ADDRESS || '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0';
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793';

/**
 * POST /api/festival/topup
 * 
 * Deposits USDT into the vault and receives festival tokens
 * Step 1: Approve USDT spending by vault
 * Step 2: Call vault.deposit(amount)
 * 
 * Uses WDK server with demo user account (index 1)
 * 
 * Requirements: 3.3, 3.4
 */
export async function POST(request: Request) {
  try {
    const body: TopUpRequest = await request.json();
    const { userId, amountUsdt } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!amountUsdt || amountUsdt <= 0) {
      return NextResponse.json(
        { error: 'amountUsdt must be a positive number' },
        { status: 400 }
      );
    }

    // Convert USDT amount to base units (6 decimals)
    const usdtAmount = BigInt(Math.floor(amountUsdt * 1_000_000));

    // Step 1: Encode and send USDT approve(vault, amount)
    const approveData = contractEncoders.encodeApprove(
      VAULT_ADDRESS as Address,
      usdtAmount
    );

    const { hash: approvalHash } = await wdkServer.sendTransaction({
      accountIndex: ACCOUNT_INDEX.DEMO_USER,
      to: USDT_ADDRESS as Address,
      data: approveData,
    });

    // Step 2: Encode and send vault.deposit(amount)
    const depositData = contractEncoders.encodeDeposit(usdtAmount);

    const { hash: depositHash } = await wdkServer.sendTransaction({
      accountIndex: ACCOUNT_INDEX.DEMO_USER,
      to: VAULT_ADDRESS as Address,
      data: depositData,
    });

    const response: TopupResponse = {
      success: true,
      approvalHash,
      depositHash,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Topup error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process topup' },
      { status: 500 }
    );
  }
}
