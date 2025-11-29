// Simple in-memory store for mock balances
// In production, this will be replaced with blockchain queries

interface UserBalanceStore {
  usdt: bigint;
  festivalTokens: bigint;
}

const balances = new Map<string, UserBalanceStore>();

// Initialize with default balance
const DEFAULT_BALANCE: UserBalanceStore = {
  usdt: BigInt(100_000_000), // 100 USDT (6 decimals)
  festivalTokens: BigInt(5_000_000_000_000_000_000), // 5 tokens (18 decimals)
};

export const balanceStore = {
  get: (userId: string): UserBalanceStore => {
    if (!balances.has(userId)) {
      balances.set(userId, { ...DEFAULT_BALANCE });
    }
    return balances.get(userId)!;
  },

  addUsdt: (userId: string, amount: bigint) => {
    const balance = balanceStore.get(userId);
    balance.usdt += amount;
  },

  addTokens: (userId: string, amount: bigint) => {
    const balance = balanceStore.get(userId);
    balance.festivalTokens += amount;
  },

  subtractUsdt: (userId: string, amount: bigint) => {
    const balance = balanceStore.get(userId);
    balance.usdt -= amount;
  },

  subtractTokens: (userId: string, amount: bigint) => {
    const balance = balanceStore.get(userId);
    balance.festivalTokens -= amount;
  },
};
