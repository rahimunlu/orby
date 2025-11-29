'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { session } from '@/lib/session';
import type { UserBalance, FestivalConfig } from '@orby/types';
import { ArrowUpRight, Plus, RefreshCw } from 'lucide-react';
import Layout from '@/components/Layout';

export default function WalletPage() {
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [festival, setFestival] = useState<FestivalConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const sess = session.get();
      const userId = sess?.userId || 'user123';
      const sessionToken = sess?.sessionToken || 'sessionToken';
      
      const [bal, fest] = await Promise.all([
        api.getBalances(userId, sessionToken),
        api.getFestival(),
      ]);
      setBalance(bal);
      setFestival(fest);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTopUp = async () => {
    if (toppingUp) return;
    setToppingUp(true);
    try {
      const sess = session.get();
      await api.topUp({
        userId: sess?.userId || 'user123',
        sessionToken: sess?.sessionToken || 'sessionToken',
        amountUsdt: 10,
      });
      await fetchData();
      showToast('Top up successful!');
    } catch (e) {
      console.error('Topup failed', e);
    } finally {
      setToppingUp(false);
    }
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-6 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/10 shadow-2xl z-50 font-bold animate-fade-in-down font-display tracking-tight flex items-center gap-3';
    toast.innerHTML = `<span class="text-orby">✓</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const displayTokenBalance = balance
    ? (parseFloat(balance.festivalTokens) / 1e18).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : '0';

  const displayUsdtBalance = balance ? (parseFloat(balance.usdt) / 1e6).toFixed(2) : '0.00';

  return (
    <Layout bgClass="bg-orby">
      <div className="flex flex-col text-white px-6 pt-6 min-h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 animate-fade-in">
          <h1 className="text-3xl font-display font-black tracking-tighter lowercase italic">orby</h1>
          <div className="bg-black/20 backdrop-blur-md text-white px-4 py-1.5 rounded-full font-bold text-sm border border-white/10 tracking-wide font-sans">
            PTS 0
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center items-center pb-12">
          <div className="text-center transform -translate-y-8 animate-scale-in">
            <div className="relative inline-block">
              <div className="text-[100px] sm:text-[120px] leading-none font-display font-black tracking-tighter mb-2 drop-shadow-sm">
                ${displayTokenBalance}
              </div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white blur-[100px] opacity-20 pointer-events-none rounded-full"></div>
            </div>

            <div className="flex flex-col gap-2 items-center opacity-90 font-medium text-lg font-sans animate-fade-in-up delay-100">
              {loading ? (
                <RefreshCw className="animate-spin mb-2" />
              ) : (
                <>
                  <span className="tracking-widest uppercase text-xs font-bold text-white/80 mb-1">
                    {festival ? festival.symbol : 'TOKENS'} Available
                  </span>
                  <span className="text-xs bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-white/90 border border-white/10 shadow-sm">
                    USDT Balance: ${displayUsdtBalance}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-4 w-full">
          <button
            onClick={handleTopUp}
            disabled={toppingUp}
            className="bg-black hover:bg-zinc-900 active:scale-95 transition-all duration-300 text-white rounded-[32px] p-6 h-48 flex flex-col justify-between relative overflow-hidden group shadow-lg animate-fade-in-up delay-200 border border-white/5"
          >
            <div className="absolute top-0 right-0 p-5 group-hover:rotate-90 transition-transform duration-300">
              <Plus size={32} className="text-orby" />
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-3xl font-display font-bold tracking-tight block group-hover:translate-x-1 transition-transform">
                {toppingUp ? 'ADDING...' : 'DEPOSIT'}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>

          <button className="bg-white/10 backdrop-blur-md border border-white/20 hover:bg-white/20 active:scale-95 transition-all duration-300 text-white rounded-[32px] p-6 h-48 flex flex-col justify-between relative overflow-hidden group animate-fade-in-up delay-300">
            <div className="absolute top-0 right-0 p-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300">
              <ArrowUpRight size={32} strokeWidth={2.5} className="text-white opacity-80" />
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-3xl font-display font-bold tracking-tight block group-hover:translate-x-1 transition-transform">
                REQUEST
              </span>
            </div>
          </button>
        </div>
      </div>
    </Layout>
  );
}
