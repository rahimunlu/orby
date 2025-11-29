import type {
  FestivalConfig,
  UserBalance,
  CreateFestivalRequest,
  JoinResponse,
  TopUpRequest,
  TopupResponse,
  CashoutResponse,
} from '@orby/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '';

export const api = {
  // Admin endpoints
  getFestival: async (): Promise<FestivalConfig | null> => {
    const res = await fetch(`${API_BASE}/api/admin/festival`);
    if (!res.ok) return null;
    return res.json();
  },

  createFestival: async (data: CreateFestivalRequest): Promise<FestivalConfig> => {
    const res = await fetch(`${API_BASE}/api/admin/create-festival`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  // Festival endpoints
  join: async (nickname: string): Promise<JoinResponse> => {
    const res = await fetch(`${API_BASE}/api/festival/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nickname }),
    });
    return res.json();
  },

  getBalances: async (userId: string, sessionToken: string): Promise<UserBalance> => {
    const res = await fetch(
      `${API_BASE}/api/festival/balances?userId=${userId}&sessionToken=${sessionToken}`
    );
    return res.json();
  },

  topUp: async (data: TopUpRequest): Promise<TopupResponse> => {
    const res = await fetch(`${API_BASE}/api/festival/topup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  cashOut: async (userId: string, sessionToken: string): Promise<CashoutResponse> => {
    const res = await fetch(`${API_BASE}/api/festival/cashout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, sessionToken }),
    });
    return res.json();
  },
};
