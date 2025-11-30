import { NextResponse } from 'next/server';
import { createPublicClient, http, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { wdkServer, ACCOUNT_INDEX, SEPOLIA_CONFIG } from '@/lib/wdk/server';
import { ERC20_ABI, FESTIVAL_VAULT_ABI } from '@/lib/wdk/encoding';
import type { UserBalance } from '@orby/types';

// Contract addresses from config
const USDT_ADDRESS = process.env.USDT_ADDRESS || '0xaa8e23fb1079ea71e0a56f48a2aa51851d8433d0';
const TOKEN_ADDRESS = process.env.TOKEN_ADDRESS || '0x5ea6c8f79943148811f8CFCc0CC4DdFd66518E53';
const VAULT_ADDRESS = process.env.VAULT_ADDRESS || '0x559504A83Cc1cFb3f096568AB7E8b7eC0AC94793';

/**
 * GET /api/festival/balances
 * 
 * Queries on-chain balances for the user:
 * - USDT balance
 * - Festival Token balance
 * - Escrowed USDT in Vault
 * 
 * Requirements: 5.1, 5.2, 5.3
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

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

    // Get user's address (demo user account)
    const userAddress = await wdkServer.getAddress(ACCOUNT_INDEX.DEMO_USER);

    // Query USDT balance from chain
    const usdtBalance = await publicClient.readContract({
      address: USDT_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }) as bigint;

    // Query Festival Token balance from chain
    const tokenBalance = await publicClient.readContract({
      address: TOKEN_ADDRESS as Address,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [userAddress],
    }) as bigint;

    // Query escrowedUSDT from Vault
    const escrowedUSDT = await publicClient.readContract({
      address: VAULT_ADDRESS as Address,
      abi: FESTIVAL_VAULT_ABI,
      functionName: 'escrowedUSDT',
      args: [userAddress],
    }) as bigint;

    const response: UserBalance = {
      usdt: usdtBalance.toString(),
      festivalTokens: tokenBalance.toString(),
      escrowedUSDT: escrowedUSDT.toString(),
      userAddress,
      treasuryAddress: VAULT_ADDRESS,
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
