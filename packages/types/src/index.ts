// User & Session Types
export interface UserBalance {
  usdt: string;
  festivalTokens: string;
  userAddress: string;
  treasuryAddress: string;
}

export interface FestivalConfig {
  name: string;
  symbol: string;
  tokenAddress: string;
  ownerAddress: string;
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
  transferHash: string;
  mintHash: string;
}

export interface CashoutResponse {
  success: boolean;
  burnHash: string;
  transferHash: string;
}

// Navigation Types
export enum Tab {
  WALLET = 'WALLET',
  ACTIVITY = 'ACTIVITY',
  MENU = 'MENU',
  QR = 'QR'
}
