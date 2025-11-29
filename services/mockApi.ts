import { FestivalConfig, UserBalance, TopUpRequest, CreateFestivalRequest } from '../types';

const DELAY_MS = 600;

// Helper for delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock Data Store Keys
const STORAGE_KEYS = {
  FESTIVAL: 'orby_festival_config',
  BALANCE: 'orby_user_balance_v2'
};

// Initial Balance
const INITIAL_BALANCE: UserBalance = {
  usdt: "10000000", // 10.00 USDT (6 decimals)
  festivalTokens: "0" // 0.00 Tokens (18 decimals)
};

export const api = {
  // GET /api/festival/balances
  getBalances: async (userId: string, sessionToken: string): Promise<UserBalance> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(STORAGE_KEYS.BALANCE);
    if (!stored) {
      localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(INITIAL_BALANCE));
      return INITIAL_BALANCE;
    }
    return JSON.parse(stored);
  },

  // POST /api/festival/topup
  topUp: async (data: TopUpRequest): Promise<{ txHash: string; status: string }> => {
    await delay(DELAY_MS);
    
    // Logic: Decrease USDT, Increase Festival Tokens (1:1 rate for simplicity)
    const stored = localStorage.getItem(STORAGE_KEYS.BALANCE);
    const currentBalance: UserBalance = stored ? JSON.parse(stored) : INITIAL_BALANCE;

    // Parse values (mocking BigInt logic with simple floats for UI demo purposes)
    const currentUsdt = parseFloat(currentBalance.usdt) / 1000000;
    const currentTokens = parseFloat(currentBalance.festivalTokens) / 1000000000000000000;

    // Add mock topup
    const newTokens = currentTokens + data.amountUsdt;
    // Note: In a real app we would deduct USDT, but here we just mint tokens for the demo flow
    
    const newBalance: UserBalance = {
      usdt: currentBalance.usdt,
      festivalTokens: (newTokens * 1000000000000000000).toLocaleString('fullwide', { useGrouping: false })
    };

    localStorage.setItem(STORAGE_KEYS.BALANCE, JSON.stringify(newBalance));

    return {
      txHash: "0x" + Math.random().toString(16).substr(2, 40),
      status: "success"
    };
  },

  // GET /api/admin/festival
  getFestival: async (): Promise<FestivalConfig | null> => {
    await delay(DELAY_MS);
    const stored = localStorage.getItem(STORAGE_KEYS.FESTIVAL);
    return stored ? JSON.parse(stored) : null;
  },

  // POST /api/admin/create-festival
  createFestival: async (data: CreateFestivalRequest): Promise<FestivalConfig> => {
    await delay(1500); // Longer delay for "deployment"
    
    const newFestival: FestivalConfig = {
      festivalName: data.festivalName,
      festivalSymbol: data.festivalSymbol.toUpperCase(),
      tokenAddress: "0x71C...9A21", // Mock address
      ownerAddress: "0xAdmin...Treasury"
    };

    localStorage.setItem(STORAGE_KEYS.FESTIVAL, JSON.stringify(newFestival));
    return newFestival;
  }
};