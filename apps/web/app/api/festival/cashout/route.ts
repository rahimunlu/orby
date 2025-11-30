import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { SEPOLIA_CONFIG } from '@/lib/wdk/server';
import { contractEncoders, ERC20_ABI, tokensToUsdt } from '@/lib/wdk/encoding';
import type { CashoutResponse } from '@orby/types';

// Contract addresses from environment
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_FESTIVAL_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_FESTIVAL_VAULT_ADDRESS || process.env.VAULT_ADDRESS;
const RPC_URL = process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org';

if (!TOKEN_ADDRESS || !VAULT_ADDRESS) {
  console.warn('Warning: TOKEN_ADDRESS or VAULT_ADDRESS not configured in environment');
}

/**
 * POST /api/festival/cashout
 * 
 * Withdraws all festival tokens and returns USDT
 * Step 1: Query user's token balance
 * Step 2: Call vault.withdraw(balance)
 * 
 * Uses user's seed phrase from request body
 * 
 * Requirements: 4.4
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, seedPhrase } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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
    const userAddress = await account.getAddress();

    // Create public client to query balances
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_CONFIG.rpcUrl),
    });

    // Query user's token balance
    const tokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as Address],
    }) as bigint;

    if (tokenBalance === BigInt(0)) {
      return NextResponse.json(
        { error: 'No tokens to withdraw' },
        { status: 400 }
      );
    }

    // Encode and send vault.withdraw(balance)
    const withdrawData = contractEncoders.encodeWithdraw(tokenBalance);

    const withdrawTx = await account.sendTransaction({
      to: VAULT_ADDRESS as string,
      value: BigInt(0),
      data: withdrawData as string,
    } as Parameters<typeof account.sendTransaction>[0]);

    // Calculate USDT returned (convert 18 decimals to 6)
    const usdtReturned = tokensToUsdt(tokenBalance);

    const response: CashoutResponse = {
      success: true,
      withdrawHash: withdrawTx.hash,
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
