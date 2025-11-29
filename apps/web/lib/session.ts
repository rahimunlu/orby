const STORAGE_KEY = 'orby_session';

export interface SessionData {
  userId: string;
  sessionToken: string;
  address: string;
}

export const session = {
  save: (userId: string, sessionToken: string, address: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId, sessionToken, address }));
  },

  get: (): SessionData | null => {
    if (typeof window === 'undefined') return null;
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  },

  clear: () => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
