import { NextResponse } from 'next/server';
import { createPublicClient, http, decodeEventLog, type Address } from 'viem';
import { sepolia } from 'viem/chains';
import { wdkServer, ACCOUNT_INDEX, SEPOLIA_CONFIG } from '@/lib/wdk/server';
import { contractEncoders, FESTIVAL_FACTORY_ABI } from '@/lib/wdk/encoding';
import type { FestivalConfig, CreateFestivalRequest } from '@orby/types';
import * as fs from 'fs';
import * as path from 'path';

// Factory address from deployment
const FACTORY_ADDRESS = process.env.FACTORY_ADDRESS || '0x73eA5768CF25b4D9Ee342A364948543E202C2D8d';

// Path to festival config file
const CONFIG_PATH = path.join(process.cwd(), '..', 'contracts', 'festival-config.json');

/**
 * POST /api/admin/create-festival
 * 
 * Creates a new festival by calling FestivalFactory.createFestival
 * Uses WDK server with admin account (index 0)
 * 
 * Requirements: 6.1, 6.2, 6.4
 */
export async function POST(request: Request) {
  try {
    const body: CreateFestivalRequest = await request.json();
    const { festivalName, festivalSymbol } = body;

    if (!festivalName || !festivalSymbol) {
      return NextResponse.json(
        { error: 'festivalName and festivalSymbol are required' },
        { status: 400 }
      );
    }

    // Default times: start now, end in 3 days
    const now = Math.floor(Date.now() / 1000);
    const startTime = BigInt(now);
    const endTime = BigInt(now + 3 * 24 * 60 * 60); // 3 days from now

    // Encode createFestival call
    const data = contractEncoders.encodeCreateFestival(
      festivalName,
      festivalSymbol.toUpperCase(),
      startTime,
      endTime
    );

    // Send transaction using WDK admin account
    const { hash } = await wdkServer.sendTransaction({
      accountIndex: ACCOUNT_INDEX.ADMIN,
      to: FACTORY_ADDRESS as Address,
      data,
    });

    // Create public client to wait for receipt and decode logs
    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(SEPOLIA_CONFIG.rpcUrl),
    });

    // Wait for transaction receipt
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    // Find FestivalCreated event in logs
    let tokenAddress: Address | undefined;
    let vaultAddress: Address | undefined;

    for (const log of receipt.logs) {
      try {
        const decoded = decodeEventLog({
          abi: FESTIVAL_FACTORY_ABI,
          data: log.data,
          topics: log.topics,
        });

        if (decoded.eventName === 'FestivalCreated') {
          tokenAddress = decoded.args.token as Address;
          vaultAddress = decoded.args.vault as Address;
          break;
        }
      } catch {
        // Not our event, continue
      }
    }

    if (!tokenAddress || !vaultAddress) {
      return NextResponse.json(
        { error: 'Failed to decode FestivalCreated event from transaction' },
        { status: 500 }
      );
    }

    // Get owner address
    const ownerAddress = await wdkServer.getAddress(ACCOUNT_INDEX.ADMIN);

    // Build config object
    const config: FestivalConfig = {
      name: festivalName,
      symbol: festivalSymbol.toUpperCase(),
      tokenAddress,
      vaultAddress,
      ownerAddress,
      factoryAddress: FACTORY_ADDRESS,
      startTime: Number(startTime),
      endTime: Number(endTime),
      redemptionOpen: false,
      createdAt: new Date().toISOString(),
      network: 'sepolia',
      chainId: SEPOLIA_CONFIG.chainId,
    };

    // Save config to file
    try {
      fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
      console.warn('Could not save config to file:', err);
    }

    return NextResponse.json({
      name: config.name,
      symbol: config.symbol,
      tokenAddress: config.tokenAddress,
      vaultAddress: config.vaultAddress,
      ownerAddress: config.ownerAddress,
      transactionHash: hash,
    });
  } catch (error) {
    console.error('Create festival error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create festival' },
      { status: 500 }
    );
  }
}
