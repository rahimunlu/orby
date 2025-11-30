import { NextResponse } from 'next/server';
import { type Address } from 'viem';
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { contractEncoders } from '@/lib/wdk/encoding';
import type { TopupResponse } from '@orby/types';

// Contract addresses from environment
const USDT_ADDRESS = process.env.NEXT_PUBLIC_TESTUSDT_ADDRESS || process.env.USDT_ADDRESS;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_FESTIVAL_VAULT_ADDRESS || process.env.VAULT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

if (!USDT_ADDRESS || !VAULT_ADDRESS) {
  console.warn('Warning: USDT_ADDRESS or VAULT_ADDRESS not configured in environment');
}

/**
 * POST /api/festival/topup
 * 
 * Deposits USDT into the vault and receives festival tokens
 * Step 1: Approve USDT spending by vault
 * Step 2: Wait for approval confirmation
 * Step 3: Call vault.deposit(amount)
 * 
 * Uses user's seed phrase from request body
 * 
 * Requirements: 3.3, 3.4
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, amountUsdt, seedPhrase } = body;

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

    if (!seedPhrase) {
      return NextResponse.json(
        { error: 'seedPhrase is required' },
        { status: 400 }
      );
    }

    // Initialize WDK with user's seed phrase
    const wdk = new WDK(seedPhrase);
    wdk.registerWallet('ethereum', WalletManagerEvm, {
      provider: RPC_URL,
    });

    const account = await wdk.getAccount('ethereum', 0);

    // Convert USDT amount to base units (6 decimals)
    const usdtAmount = BigInt(Math.floor(amountUsdt * 1_000_000));

    // Step 1: Encode and send USDT approve(vault, amount)
    const approveData = contractEncoders.encodeApprove(
      VAULT_ADDRESS as Address,
      usdtAmount
    );

    const approveTx = await account.sendTransaction({
      to: USDT_ADDRESS as string,
      value: BigInt(0),
      data: approveData as string,
    } as Parameters<typeof account.sendTransaction>[0]);

    console.log('Approval tx sent:', approveTx.hash);

    // Step 2: Wait a bit for approval to be mined (simple delay)
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Encode and send vault.deposit(amount)
    const depositData = contractEncoders.encodeDeposit(usdtAmount);

    const depositTx = await account.sendTransaction({
      to: VAULT_ADDRESS as string,
      value: BigInt(0),
      data: depositData as string,
    } as Parameters<typeof account.sendTransaction>[0]);

    console.log('Deposit tx sent:', depositTx.hash);

    const response: TopupResponse = {
      success: true,
      approvalHash: approveTx.hash,
      depositHash: depositTx.hash,
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
