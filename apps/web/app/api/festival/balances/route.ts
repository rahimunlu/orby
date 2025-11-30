import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_CONFIG } from '@/lib/wdk/server';
import { ERC20_ABI, FESTIVAL_VAULT_ABI } from '@/lib/wdk/encoding';
import type { UserBalance } from '@orby/types';

// Contract addresses from environment
const USDT_ADDRESS = process.env.NEXT_PUBLIC_TESTUSDT_ADDRESS || process.env.USDT_ADDRESS;
const TOKEN_ADDRESS = process.env.NEXT_PUBLIC_FESTIVAL_TOKEN_ADDRESS || process.env.TOKEN_ADDRESS;
const VAULT_ADDRESS = process.env.NEXT_PUBLIC_FESTIVAL_VAULT_ADDRESS || process.env.VAULT_ADDRESS;

if (!USDT_ADDRESS || !TOKEN_ADDRESS || !VAULT_ADDRESS) {
  console.warn('Warning: Contract addresses not fully configured in environment');
}

/**
 * GET /api/festival/balances
 * 
 * Queries on-chain balances for the user:
 * - USDT balance
 * - Festival Token balance
 * - Escrowed USDT in Vault
 * 
 * Now accepts userAddress as query param (derived from user's seed on client)
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const userAddress = searchParams.get('userAddress');

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    if (!userAddress) {
      return NextResponse.json(
        { error: 'userAddress is required' },
        { status: 400 }
      );
    }

    // Create public client to query balances
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_CONFIG.rpcUrl),
    });

    // Query USDT balance from chain
    const usdtBalance = await publicClient.readContract({
      address: USDT_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as Address],
    }) as bigint;

    // Query Festival Token balance from chain
    const tokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress as Address],
    }) as bigint;

    // Query escrowedUSDT from Vault
    const escrowedUSDT = await publicClient.readContract({
      address: VAULT_ADDRESS as Address,
      abi: FESTIVAL_VAULT_ABI,
      functionName: 'escrowedUSDT',
      args: [userAddress as Address],
    }) as bigint;

    const response: UserBalance = {
      usdt: usdtBalance.toString(),
      festivalTokens: tokenBalance.toString(),
      escrowedUSDT: escrowedUSDT.toString(),
      userAddress,
      treasuryAddress: VAULT_ADDRESS || '',
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Balances error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch balances' },
      { status: 500 }
    );
  }
}
