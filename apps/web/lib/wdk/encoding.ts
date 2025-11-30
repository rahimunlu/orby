import { encodeFunctionData, type Address, type Hex } from 'viem';

/**
 * Contract ABIs for encoding function calls
 * 
 * These are minimal ABIs containing only the functions we need to encode.
 * Full ABIs are available in packages/contracts/artifacts/
 */

// ERC20 ABI (for USDT approve and balanceOf)
export const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'totalSupply',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// FestivalFactory ABI
export const FESTIVAL_FACTORY_ABI = [
  {
    inputs: [
      { name: 'name', type: 'string' },
      { name: 'symbol', type: 'string' },
      { name: 'startTime', type: 'uint256' },
      { name: 'endTime', type: 'uint256' },
    ],
    name: 'createFestival',
    outputs: [
      { name: 'token', type: 'address' },
      { name: 'vault', type: 'address' },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdt',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: 'token', type: 'address' },
      { indexed: true, name: 'vault', type: 'address' },
      { indexed: false, name: 'name', type: 'string' },
      { indexed: false, name: 'symbol', type: 'string' },
    ],
    name: 'FestivalCreated',
    type: 'event',
  },
] as const;

// FestivalVault ABI
export const FESTIVAL_VAULT_ABI = [
  {
    inputs: [{ name: 'usdtAmount', type: 'uint256' }],
    name: 'deposit',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'tokenAmount', type: 'uint256' }],
    name: 'withdraw',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'open', type: 'bool' }],
    name: 'setRedemptionOpen',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'user', type: 'address' }],
    name: 'escrowedUSDT',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'redemptionOpen',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'festivalStart',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'festivalEnd',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'usdt',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const;

// FestivalToken ABI (extends ERC20)
export const FESTIVAL_TOKEN_ABI = [
  ...ERC20_ABI,
  {
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { name: 'from', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    name: 'burn',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;

/**
 * Encoding utilities for contract interactions
 * 
 * Uses Viem's encodeFunctionData for ABI encoding.
 * Requirement: 9.1 - Use Viem's encodeFunctionData for ABI encoding
 */
export const contractEncoders = {
  /**
   * Encode ERC20 approve call
   * 
   * @param spender - Address to approve
   * @param amount - Amount to approve (in token's smallest unit)
   * @returns Encoded function data
   */
  encodeApprove(spender: Address, amount: bigint): Hex {
    return encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [spender, amount],
    });
  },

  /**
   * Encode FestivalFactory.createFestival call
   * 
   * @param name - Festival token name
   * @param symbol - Festival token symbol
   * @param startTime - Festival start timestamp
   * @param endTime - Festival end timestamp
   * @returns Encoded function data
   */
  encodeCreateFestival(
    name: string,
    symbol: string,
    startTime: bigint,
    endTime: bigint
  ): Hex {
    return encodeFunctionData({
      abi: FESTIVAL_FACTORY_ABI,
      functionName: 'createFestival',
      args: [name, symbol, startTime, endTime],
    });
  },

  /**
   * Encode FestivalVault.deposit call
   * 
   * @param usdtAmount - USDT amount to deposit (6 decimals)
   * @returns Encoded function data
   */
  encodeDeposit(usdtAmount: bigint): Hex {
    return encodeFunctionData({
      abi: FESTIVAL_VAULT_ABI,
      functionName: 'deposit',
      args: [usdtAmount],
    });
  },

  /**
   * Encode FestivalVault.withdraw call
   * 
   * @param tokenAmount - Token amount to withdraw (18 decimals)
   * @returns Encoded function data
   */
  encodeWithdraw(tokenAmount: bigint): Hex {
    return encodeFunctionData({
      abi: FESTIVAL_VAULT_ABI,
      functionName: 'withdraw',
      args: [tokenAmount],
    });
  },

  /**
   * Encode FestivalVault.setRedemptionOpen call
   * 
   * @param open - Whether redemption should be open
   * @returns Encoded function data
   */
  encodeSetRedemptionOpen(open: boolean): Hex {
    return encodeFunctionData({
      abi: FESTIVAL_VAULT_ABI,
      functionName: 'setRedemptionOpen',
      args: [open],
    });
  },
};

/**
 * Decimal conversion constants
 * USDT has 6 decimals, Festival Token has 18 decimals
 */
export const DECIMALS = {
  USDT: 6,
  FESTIVAL_TOKEN: 18,
  CONVERSION_FACTOR: BigInt(10) ** BigInt(12), // 10^(18-6) = 10^12
} as const;

/**
 * Convert USDT amount (6 decimals) to Festival Token amount (18 decimals)
 * 
 * @param usdtAmount - Amount in USDT (6 decimals)
 * @returns Amount in Festival Tokens (18 decimals)
 */
export function usdtToTokens(usdtAmount: bigint): bigint {
  return usdtAmount * DECIMALS.CONVERSION_FACTOR;
}

/**
 * Convert Festival Token amount (18 decimals) to USDT amount (6 decimals)
 * 
 * @param tokenAmount - Amount in Festival Tokens (18 decimals)
 * @returns Amount in USDT (6 decimals)
 */
export function tokensToUsdt(tokenAmount: bigint): bigint {
  return tokenAmount / DECIMALS.CONVERSION_FACTOR;
}

export default contractEncoders;
