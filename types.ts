export interface UserBalance {
  usdt: string; // 6 decimals
  festivalTokens: string; // 18 decimals
}

export interface FestivalConfig {
  festivalName: string;
  festivalSymbol: string;
  tokenAddress: string;
  ownerAddress: string;
}

export interface TopUpRequest {
  userId: string;
  sessionToken: string;
  amountUsdt: number;
}

export interface CreateFestivalRequest {
  festivalName: string;
  festivalSymbol: string;
}

// Navigation Types
export enum Tab {
  WALLET = 'WALLET',
  ACTIVITY = 'ACTIVITY',
  MENU = 'MENU',
  QR = 'QR'
}