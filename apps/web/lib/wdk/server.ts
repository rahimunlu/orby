import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import { type Address, type Hash, type Hex } from 'viem';

/**
 * Sepolia network configuration
 * Chain ID: 11155111
 */
export const SEPOLIA_CONFIG = {
  chainId: 11155111,
  rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
};

/**
 * Account indices for WDK
 * - Index 0: Admin account (for festival creation, contract deployment)
 * - Index 1: Demo user account (for topup, cashout operations)
 */
export const ACCOUNT_INDEX = {
  ADMIN: 0,
  DEMO_USER: 1,
} as const;

// Server-side WDK instance (singleton)
let serverWdk: WDK | null = null;

/**
 * WDK Server module for server-side wallet management
 * 
 * Uses Tether WDK for signing and broadcasting transactions on Sepolia.
 * Initialized from WDK_SEED_PHRASE environment variable.
 * 
 * Requirements: 9.2, 9.3
 */
export const wdkServer = {
  /**
   * Initialize WDK with mnemonic from environment variable
   * Uses singleton pattern to avoid re-initialization
   * 
   * @throws Error if WDK_SEED_PHRASE is not set
   */
  async init(): Promise<void> {
    if (serverWdk) return; // Already initialized
    
    const seedPhrase = process.env.WDK_SEED_PHRASE;
    if (!seedPhrase) {
      throw new Error('WDK_SEED_PHRASE environment variable is not set');
    }
    
    serverWdk = new WDK(seedPhrase);
    serverWdk.registerWallet('ethereum', WalletManagerEvm, {
      provider: SEPOLIA_CONFIG.rpcUrl,
    });
  },

  /**
   * Get WDK account for the specified index
   * 
   * @param index - Account index (0 = admin, 1 = demo user)
   * @returns WDK account instance
   * @requirement 9.3 - Use index 0 for admin, index 1 for demo user
   */
  async getAccount(index: number) {
    if (!serverWdk) await this.init();
    return serverWdk!.getAccount('ethereum', index);
  },

  /**
   * Get Ethereum address for the specified account index
   * 
   * @param index - Account index
   * @returns Ethereum address as hex string
   */
  async getAddress(index: number): Promise<Address> {
    const account = await this.getAccount(index);
    const address = await account.getAddress();
    return address as Address;
  },

  /**
   * Get ETH balance for the specified account
   * 
   * @param index - Account index
   * @returns Balance in wei as bigint
   */
  async getBalance(index: number): Promise<bigint> {
    const account = await this.getAccount(index);
    return account.getBalance();
  },

  /**
   * Send a transaction using WDK account
   * 
   * @param params - Transaction parameters
   * @param params.accountIndex - Account index to sign with
   * @param params.to - Destination address
   * @param params.value - ETH value to send (optional, defaults to 0)
   * @param params.data - Encoded contract call data (optional)
   * @returns Transaction hash
   * @requirement 9.2 - Use WDK wallet manager for signing and broadcasting
   */
  async sendTransaction(params: {
    accountIndex: number;
    to: Address;
    value?: bigint;
    data?: Hex;
  }): Promise<{ hash: Hash }> {
    const account = await this.getAccount(params.accountIndex);
    
    // Build transaction object compatible with WDK
    const tx: { to: string; value: bigint; data?: string } = {
      to: params.to,
      value: params.value || BigInt(0),
    };
    
    if (params.data) {
      tx.data = params.data;
    }
    
    const txResult = await account.sendTransaction(tx);
    
    return { hash: txResult.hash as Hash };
  },

  /**
   * Check if WDK server is initialized
   * 
   * @returns true if initialized, false otherwise
   */
  isInitialized(): boolean {
    return serverWdk !== null;
  },

  /**
   * Reset WDK instance (useful for testing)
   */
  reset(): void {
    serverWdk = null;
  },
};

export default wdkServer;
