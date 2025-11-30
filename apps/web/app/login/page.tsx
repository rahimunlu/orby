'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, LogIn, Plus, RefreshCw } from 'lucide-react';
import { wdkClient } from '@/lib/wdk/client';

/**
 * Login Page
 * 
 * Handles wallet creation and login flow:
 * - Check localStorage for existing seed on mount
 * - "Create New Wallet" button: generates seed, stores in localStorage
 * - "Login" button: initializes WDK, redirects to home
 * 
 * Requirements: 1.1, 1.2, 1.3
 */
export default function LoginPage() {
  const router = useRouter();
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check localStorage for existing seed on mount (Requirement 1.3)
  useEffect(() => {
    const checkWallet = () => {
      const exists = wdkClient.hasWallet();
      setHasWallet(exists);
      setLoading(false);
    };
    checkWallet();
  }, []);

  // Create New Wallet: generates seed, stores in localStorage (Requirement 1.1)
  const handleCreateWallet = () => {
    setActionLoading(true);
    setError(null);
    try {
      wdkClient.createWallet();
      setHasWallet(true);
    } catch (e) {
      console.error('Failed to create wallet:', e);
      setError('Failed to create wallet. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  // Login: validates seed exists and redirects to wallet (Requirement 1.2)
  const handleLogin = () => {
    setActionLoading(true);
    setError(null);
    try {
      if (!wdkClient.hasWallet()) {
        throw new Error('No wallet found');
      }
      const seed = wdkClient.getSeedPhrase();
      if (!seed || !wdkClient.validateMnemonic(seed)) {
        throw new Error('Invalid seed phrase');
      }
      router.push('/wallet');
    } catch (e) {
      console.error('Failed to login:', e);
      setError('Failed to access wallet. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-orby flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-orby flex flex-col text-white">
      {/* Background gradient effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[150px]" />
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-6xl sm:text-7xl font-display font-black tracking-tighter lowercase italic mb-4">
            orby
          </h1>
          <p className="text-white/70 text-lg font-sans">
            Festival Wallet
          </p>
        </div>

        {/* Wallet Icon */}
        <div className="mb-12 animate-scale-in">
          <div className="w-24 h-24 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/10">
            <Wallet size={48} className="text-white" />
          </div>
        </div>

        {/* Action Cards */}
        <div className="w-full max-w-sm space-y-4 animate-fade-in-up">
          {/* Create New Wallet Button */}
          <button
            onClick={handleCreateWallet}
            disabled={actionLoading}
            className="w-full bg-black hover:bg-zinc-900 active:scale-[0.98] transition-all duration-300 text-white rounded-[24px] p-6 flex items-center justify-between relative overflow-hidden group shadow-lg border border-white/5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orby/20 rounded-full flex items-center justify-center">
                <Plus size={24} className="text-orby-accent" />
              </div>
              <div className="text-left">
                <span className="text-xl font-display font-bold tracking-tight block">
                  Create New Wallet
                </span>
                <span className="text-sm text-white/60 font-sans">
                  Generate a new seed phrase
                </span>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          </button>

          {/* Login Button - Only enabled if wallet exists (Requirement 1.3) */}
          <button
            onClick={handleLogin}
            disabled={!hasWallet || actionLoading}
            className={`w-full backdrop-blur-md border transition-all duration-300 text-white rounded-[24px] p-6 flex items-center justify-between relative overflow-hidden group shadow-lg disabled:cursor-not-allowed ${
              hasWallet
                ? 'bg-white/10 border-white/20 hover:bg-white/20 active:scale-[0.98]'
                : 'bg-white/5 border-white/10 opacity-50'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                hasWallet ? 'bg-white/20' : 'bg-white/10'
              }`}>
                {actionLoading ? (
                  <RefreshCw size={24} className="text-white animate-spin" />
                ) : (
                  <LogIn size={24} className="text-white" />
                )}
              </div>
              <div className="text-left">
                <span className="text-xl font-display font-bold tracking-tight block">
                  Login
                </span>
                <span className="text-sm text-white/60 font-sans">
                  {hasWallet ? 'Access your existing wallet' : 'Create a wallet first'}
                </span>
              </div>
            </div>
            {hasWallet && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            )}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-200 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Wallet Status Indicator */}
        {hasWallet && (
          <div className="mt-8 flex items-center gap-2 text-white/60 text-sm animate-fade-in">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>Wallet found in storage</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative px-6 py-8 text-center">
        <p className="text-white/40 text-xs font-sans">
          Powered by Ethereum Sepolia • Chain ID: 11155111
        </p>
      </div>
    </div>
  );
}
