// User & Session Types
export interface UserBalance {
  usdt: string;
  festivalTokens: string;
  escrowedUSDT: string;
  userAddress: string;
  treasuryAddress: string;
}

export interface FestivalConfig {
  name: string;
  symbol: string;
  tokenAddress: string;
  vaultAddress: string;
  ownerAddress: string;
  factoryAddress: string;
  startTime: number;
  endTime: number;
  redemptionOpen?: boolean;
  createdAt?: string;
  network?: string;
  chainId?: number;
}

// Request Types
export interface TopUpRequest {
  userId: string;
  sessionToken: string;
  amountUsdt: number;
}

export interface CreateFestivalRequest {
  festivalName: string;
  festivalSymbol: string;
}

// Response Types
export interface JoinResponse {
  userId: string;
  sessionToken: string;
  address: string;
}

export interface TopupResponse {
  success: boolean;
  approvalHash: string;
  depositHash: string;
}

export interface CashoutResponse {
  success: boolean;
  withdrawHash: string;
  usdtReturned: string;
}

// Navigation Types
export enum Tab {
  WALLET = 'WALLET',
  ACTIVITY = 'ACTIVITY',
  MENU = 'MENU',
  QR = 'QR'
}
