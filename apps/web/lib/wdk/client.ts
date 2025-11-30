'use client';

import * as bip39 from 'bip39';

/**
 * Sepolia network configuration
 * Chain ID: 11155111
 */
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
};

/**
 * LocalStorage key for storing the BIP-39 seed phrase
 */
const STORAGE_KEY = 'orby_seed';

/**
 * WDK Client for client-side wallet management
 * 
 * Uses bip39 for mnemonic generation (browser-compatible)
 * Server-side WDK handles blockchain operations via API routes
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.5
 */
export const wdkClient = {
  /**
   * Create a new wallet by generating a BIP-39 mnemonic
   * Stores the seed phrase in localStorage under 'orby_seed' key
   * 
   * @returns The generated seed phrase
   * @requirement 1.1 - Generate BIP-39 mnemonic
   */
  createWallet(): string {
    if (typeof window === 'undefined') {
      throw new Error('createWallet can only be called in browser environment');
    }
    const seedPhrase = bip39.generateMnemonic();
    localStorage.setItem(STORAGE_KEY, seedPhrase);
    return seedPhrase;
  },

  /**
   * Check if a wallet seed exists in localStorage
   * 
   * @returns true if seed exists, false otherwise
   * @requirement 1.3 - Check localStorage for 'orby_seed'
   */
  hasWallet(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem(STORAGE_KEY);
  },

  /**
   * Get the stored seed phrase from localStorage
   * 
   * @returns The seed phrase or null if not found
   */
  getSeedPhrase(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(STORAGE_KEY);
  },

  /**
   * Validate a BIP-39 mnemonic
   * 
   * @param mnemonic - The mnemonic to validate
   * @returns true if valid, false otherwise
   */
  validateMnemonic(mnemonic: string): boolean {
    return bip39.validateMnemonic(mnemonic);
  },

  /**
   * Check if WDK is initialized (user has a wallet)
   * For client-side, this just checks if seed exists
   * 
   * @returns true if seed exists, false otherwise
   */
  isInitialized(): boolean {
    return this.hasWallet();
  },

  /**
   * Clear wallet - Remove seed phrase from localStorage
   * Use with caution - this will permanently remove the wallet
   */
  clearWallet(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};

export default wdkClient;
