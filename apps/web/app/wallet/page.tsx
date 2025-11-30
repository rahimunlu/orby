'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { session } from '@/lib/session';
import { wdkClient } from '@/lib/wdk/client';
import type { UserBalance, FestivalConfig } from '@orby/types';
import { ArrowUpRight, Plus, RefreshCw, Lock, Unlock, ExternalLink } from 'lucide-react';
import Layout from '@/components/Layout';

/**
 * Wallet Page
 * 
 * Displays user balances and provides deposit/cashout actions.
 * Shows on-chain USDT balance, Festival Token balance, locked USDT in Vault,
 * and redemption status (Open/Closed).
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4
 */
export default function WalletPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<UserBalance | null>(null);
  const [festival, setFestival] = useState<FestivalConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [toppingUp, setToppingUp] = useState(false);
  const [cashingOut, setCashingOut] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [depositAmount, setDepositAmount] = useState<number>(10);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

  // Check wallet initialization state and redirect if no wallet (Requirement 1.4)
  useEffect(() => {
    const checkAuth = () => {
      if (!wdkClient.hasWallet()) {
        router.push('/login');
        return;
      }
      setCheckingAuth(false);
    };
    checkAuth();
  }, [router]);

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
    if (!checkingAuth) {
      fetchData();
    }
  }, [checkingAuth]);


  // Handle deposit - calls /api/festival/topup (Requirement 3.3, 3.4)
  const handleTopUp = async () => {
    if (toppingUp || depositAmount <= 0) return;
    setToppingUp(true);
    try {
      const sess = session.get();
      const result = await api.topUp({
        userId: sess?.userId || 'user123',
        sessionToken: sess?.sessionToken || 'sessionToken',
        amountUsdt: depositAmount,
      });
      if (result.success) {
        await fetchData();
        showToast(`Deposit successful! TX: ${result.depositHash.slice(0, 10)}...`);
      } else {
        showToast('Deposit failed. Please try again.');
      }
    } catch (e) {
      console.error('Topup failed', e);
      showToast('Deposit failed. Please try again.');
    } finally {
      setToppingUp(false);
    }
  };

  // Handle cash out - calls /api/festival/cashout (Requirement 4.4)
  const handleCashOut = async () => {
    if (cashingOut) return;
    
    // Check if redemption is open or festival has ended
    if (festival && !festival.redemptionOpen && festival.endTime > Date.now() / 1000) {
      showToast('Redemption is not open yet.');
      return;
    }

    setCashingOut(true);
    try {
      const sess = session.get();
      const result = await api.cashOut(
        sess?.userId || 'user123',
        sess?.sessionToken || 'sessionToken'
      );
      if (result.success) {
        await fetchData();
        showToast(`Cash out successful! Returned: $${(parseFloat(result.usdtReturned) / 1e6).toFixed(2)} USDT`);
      } else {
        showToast('Cash out failed. Please try again.');
      }
    } catch (e) {
      console.error('Cashout failed', e);
      showToast('Cash out failed. Please try again.');
    } finally {
      setCashingOut(false);
    }
  };

  const showToast = (message: string) => {
    const toast = document.createElement('div');
    toast.className =
      'fixed top-6 left-1/2 transform -translate-x-1/2 bg-black/90 backdrop-blur-md text-white px-6 py-4 rounded-2xl border border-white/10 shadow-2xl z-50 font-bold animate-fade-in-down font-display tracking-tight flex items-center gap-3';
    toast.innerHTML = `<span class="text-orby">✓</span> ${message}`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  };

  // Format balances for display (with NaN protection)
  const displayTokenBalance = balance && balance.festivalTokens && !isNaN(parseFloat(balance.festivalTokens))
    ? (parseFloat(balance.festivalTokens) / 1e18).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      })
    : '0';

  const displayUsdtBalance = balance && balance.usdt && !isNaN(parseFloat(balance.usdt)) 
    ? (parseFloat(balance.usdt) / 1e6).toFixed(2) 
    : '0.00';
  
  // Display locked USDT in Vault (Requirement 5.3)
  const displayLockedUsdt = balance && balance.escrowedUSDT && !isNaN(parseFloat(balance.escrowedUSDT)) 
    ? (parseFloat(balance.escrowedUSDT) / 1e6).toFixed(2) 
    : '0.00';

  // Determine redemption status (Requirement 5.4)
  const isRedemptionOpen = festival?.redemptionOpen || (festival && festival.endTime <= Date.now() / 1000);
  const redemptionStatus = isRedemptionOpen ? 'Open' : 'Closed';

  // Show loading while checking authentication
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-orby flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }


  return (
    <Layout bgClass="bg-orby">
      <div className="flex flex-col text-white px-6 pt-6 min-h-[calc(100vh-96px)]">
        {/* Header */}
        <div className="flex justify-between items-center mb-4 animate-fade-in">
          <h1 className="text-3xl font-display font-black tracking-tighter lowercase italic">orby</h1>
          <div className="flex items-center gap-2">
            {/* Redemption Status Badge (Requirement 5.4) */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
              isRedemptionOpen 
                ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                : 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            }`}>
              {isRedemptionOpen ? <Unlock size={12} /> : <Lock size={12} />}
              {redemptionStatus}
            </div>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="bg-black/20 backdrop-blur-md text-white p-2 rounded-full border border-white/10 hover:bg-black/30 transition-colors"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Main Content - Festival Token Balance (Requirement 5.2) */}
        <div className="flex-1 flex flex-col justify-center items-center pb-4">
          <div className="text-center transform -translate-y-8 animate-scale-in">
            <div className="relative inline-block">
              <div className="text-[80px] sm:text-[100px] leading-none font-display font-black tracking-tighter mb-2 drop-shadow-sm">
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
                  {/* USDT Balance (Requirement 5.1) */}
                  <span className="text-xs bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-white/90 border border-white/10 shadow-sm">
                    USDT Balance: ${displayUsdtBalance}
                  </span>
                  {/* Locked USDT in Vault (Requirement 5.3) */}
                  <span className="text-xs bg-black/20 backdrop-blur-md px-4 py-1.5 rounded-full font-bold text-white/90 border border-white/10 shadow-sm flex items-center gap-1.5">
                    <Lock size={10} />
                    Locked in Vault: ${displayLockedUsdt}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>


        {/* Action Cards */}
        <div className="grid grid-cols-2 gap-4 mt-auto mb-4 w-full">
          {/* Deposit Button - opens modal */}
          <button
            onClick={() => setShowDepositModal(true)}
            disabled={toppingUp}
            className="bg-black hover:bg-zinc-900 active:scale-95 transition-all duration-300 text-white rounded-[32px] p-6 h-40 flex flex-col justify-between relative overflow-hidden group shadow-lg animate-fade-in-up delay-200 border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="absolute top-0 right-0 p-5 group-hover:rotate-90 transition-transform duration-300">
              <Plus size={28} className="text-orby" />
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-xs text-white/60 block mb-1">Add USDT</span>
              <span className="text-2xl font-display font-bold tracking-tight block group-hover:translate-x-1 transition-transform">
                {toppingUp ? 'ADDING...' : 'DEPOSIT'}
              </span>
            </div>
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>

          {/* Cash Out Button - calls /api/festival/cashout */}
          <button
            onClick={handleCashOut}
            disabled={cashingOut || !balance || parseFloat(balance.festivalTokens) === 0}
            className={`backdrop-blur-md border hover:bg-white/20 active:scale-95 transition-all duration-300 text-white rounded-[32px] p-6 h-40 flex flex-col justify-between relative overflow-hidden group animate-fade-in-up delay-300 disabled:opacity-50 disabled:cursor-not-allowed ${
              isRedemptionOpen 
                ? 'bg-green-500/10 border-green-500/30' 
                : 'bg-white/10 border-white/20'
            }`}
          >
            <div className="absolute top-0 right-0 p-5 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform duration-300">
              <ArrowUpRight size={28} strokeWidth={2.5} className="text-white opacity-80" />
            </div>
            <div className="mt-auto relative z-10">
              <span className="text-xs text-white/60 block mb-1 flex items-center gap-1">
                {isRedemptionOpen ? <Unlock size={10} /> : <Lock size={10} />}
                {isRedemptionOpen ? 'Available' : 'Locked'}
              </span>
              <span className="text-2xl font-display font-bold tracking-tight block group-hover:translate-x-1 transition-transform">
                {cashingOut ? 'CASHING...' : 'CASH OUT'}
              </span>
            </div>
          </button>
        </div>

        {/* Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-zinc-900 rounded-3xl p-6 w-80 border border-white/10">
              <h3 className="text-white font-bold text-lg mb-4">Deposit USDT</h3>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full bg-black/50 border border-white/20 rounded-xl px-4 py-3 text-white mb-4 focus:outline-none focus:border-orby"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDepositModal(false);
                    setCustomAmount('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white font-bold hover:bg-white/20 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const amount = parseFloat(customAmount);
                    if (amount > 0) {
                      setDepositAmount(amount);
                      setShowDepositModal(false);
                      setCustomAmount('');
                      handleTopUp();
                    }
                  }}
                  disabled={!customAmount || parseFloat(customAmount) <= 0}
                  className="flex-1 py-3 rounded-xl bg-orby text-white font-bold hover:bg-orby/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Deposit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Vault Info Link */}
        {festival?.vaultAddress && (
          <div className="mb-4 animate-fade-in-up delay-400">
            <a
              href={`https://sepolia.etherscan.io/address/${festival.vaultAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
            >
              <ExternalLink size={12} />
              View Vault on Etherscan
            </a>
          </div>
        )}
      </div>
    </Layout>
  );
}
