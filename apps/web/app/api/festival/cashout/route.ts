import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { wdkServer, ACCOUNT_INDEX, SEPOLIA_CONFIG } from '@/lib/wdk/server';
import { contractEncoders, ERC20_ABI, tokensToUsdt } from '@/lib/wdk/encoding';
import type { CashoutResponse } from '@orby/types';

// Contract addresses from config
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '0x5ea6c8f79943148811f8CFCc0CC4DdFd66518E53';
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793';

/**
 * POST /api/festival/cashout
 * 
 * Withdraws all festival tokens and returns USDT
 * Step 1: Query user's token balance
 * Step 2: Call vault.withdraw(balance)
 * 
 * Uses WDK server with demo user account (index 1)
 * 
 * Requirements: 4.4
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Create public client to query balances
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_CONFIG.rpcUrl),
    });

    // Get user's address
    const userAddress = await wdkServer.getAddress(ACCOUNT_INDEX.DEMO_USER);

    // Query user's token balance
    const tokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }) as bigint;

    if (tokenBalance === BigInt(0)) {
      return NextResponse.json(
        { error: 'No tokens to withdraw' },
        { status: 400 }
      );
    }

    // Encode and send vault.withdraw(balance)
    const withdrawData = contractEncoders.encodeWithdraw(tokenBalance);

    const { hash: withdrawHash } = await wdkServer.sendTransaction({
      accountIndex: ACCOUNT_INDEX.DEMO_USER,
      to: VAULT_ADDRESS as Address,
      data: withdrawData,
    });

    // Calculate USDT returned (convert 18 decimals to 6)
    const usdtReturned = tokensToUsdt(tokenBalance);

    const response: CashoutResponse = {
      success: true,
      withdrawHash,
      usdtReturned: usdtReturned.toString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Cashout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to process cashout' },
      { status: 500 }
    );
  }
}
