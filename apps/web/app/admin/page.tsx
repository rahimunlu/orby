'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { FestivalConfig } from '@orby/types';
import { ArrowLeft, Rocket, CheckCircle, ExternalLink, Copy, Check, Droplets } from 'lucide-react';

const SEPOLIA_ETHERSCAN_BASE = 'https://sepolia.etherscan.io/address/';

/**
 * Admin Page
 * 
 * Displays Token and Vault addresses after creation with Sepolia Etherscan links.
 * Requirements: 6.3
 */
export default function AdminPage() {
  const router = useRouter();
  const [festival, setFestival] = useState<FestivalConfig | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [deploying, setDeploying] = useState(false);
  
  // Copy state
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Faucet state
  const [faucetAddress, setFaucetAddress] = useState('');
  const [faucetAmount, setFaucetAmount] = useState('100');
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState<{ success: boolean; hash?: string; error?: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const data = await api.getFestival();
    setFestival(data);
    setLoading(false);
  };

  const handleDeploy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !symbol) return;

    setDeploying(true);
    try {
      const newFest = await api.createFestival({ festivalName: name, festivalSymbol: symbol });
      setFestival(newFest);
    } catch (err) {
      console.error(err);
    } finally {
      setDeploying(false);
    }
  };


  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleFaucet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!faucetAddress || !faucetAmount) return;

    setFaucetLoading(true);
    setFaucetResult(null);

    try {
      const res = await fetch('/api/admin/faucet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          address: faucetAddress,
          amount: parseFloat(faucetAmount),
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setFaucetResult({ success: true, hash: data.hash });
        setFaucetAddress('');
      } else {
        setFaucetResult({ success: false, error: data.error });
      }
    } catch (err) {
      setFaucetResult({ success: false, error: 'Network error' });
    } finally {
      setFaucetLoading(false);
    }
  };

  const AddressDisplay = ({ 
    label, 
    address, 
    fieldId,
    showEtherscan = true 
  }: { 
    label: string; 
    address: string; 
    fieldId: string;
    showEtherscan?: boolean;
  }) => (
    <div>
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">
        {label}
      </label>
      <div className="bg-black p-3 rounded-lg mt-1 flex items-center justify-between gap-2">
        <span className="break-all font-mono text-xs text-orby flex-1">
          {address}
        </span>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => copyToClipboard(address, fieldId)}
            className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
            title="Copy address"
          >
            {copiedField === fieldId ? (
              <Check size={14} className="text-green-500" />
            ) : (
              <Copy size={14} className="text-zinc-500" />
            )}
          </button>
          {showEtherscan && (
            <a
              href={`${SEPOLIA_ETHERSCAN_BASE}${address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-md hover:bg-zinc-800 transition-colors"
              title="View on Etherscan"
            >
              <ExternalLink size={14} className="text-zinc-500 hover:text-orby" />
            </a>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-32">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button
          onClick={() => router.push('/menu')}
          className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-display font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-xs text-zinc-500 font-sans uppercase tracking-wider">Festival Token Management</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center pt-20">
          <div className="w-8 h-8 border-4 border-orby border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : festival ? (
        // Existing Festival View with Token and Vault addresses (Requirement 6.3)
        <div className="animate-fade-in-up">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                <CheckCircle size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg font-display tracking-tight">Active Festival</h2>
                <p className="text-sm text-zinc-400 font-sans">Contracts deployed on Sepolia</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Name</label>
                  <p className="text-xl font-bold font-display">{festival.name}</p>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Symbol</label>
                  <p className="text-xl font-bold font-display">{festival.symbol}</p>
                </div>
              </div>
              
              {/* Token Address with Etherscan link (Requirement 6.3) */}
              <AddressDisplay 
                label="Token Contract" 
                address={festival.tokenAddress} 
                fieldId="token"
              />
              
              {/* Vault Address with Etherscan link (Requirement 6.3) */}
              <AddressDisplay 
                label="Vault Contract" 
                address={festival.vaultAddress} 
                fieldId="vault"
              />
              
              {/* Owner Address */}
              <AddressDisplay 
                label="Owner Address" 
                address={festival.ownerAddress} 
                fieldId="owner"
              />

              {/* Factory Address */}
              {festival.factoryAddress && (
                <AddressDisplay 
                  label="Factory Contract" 
                  address={festival.factoryAddress} 
                  fieldId="factory"
                />
              )}
            </div>


            {/* Quick Links to Etherscan */}
            <div className="mt-6 pt-6 border-t border-zinc-800">
              <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans mb-3 block">
                Quick Links
              </label>
              <div className="grid grid-cols-2 gap-3">
                <a
                  href={`${SEPOLIA_ETHERSCAN_BASE}${festival.tokenAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-800 hover:bg-zinc-700 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors font-sans text-sm"
                >
                  Token <ExternalLink size={14} />
                </a>
                <a
                  href={`${SEPOLIA_ETHERSCAN_BASE}${festival.vaultAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-zinc-800 hover:bg-zinc-700 py-3 px-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors font-sans text-sm"
                >
                  Vault <ExternalLink size={14} />
                </a>
              </div>
            </div>
          </div>

          {/* TestUSDT Faucet */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full">
                <Droplets size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg font-display tracking-tight">TestUSDT Faucet</h2>
                <p className="text-sm text-zinc-400 font-sans">Send test tokens to any address</p>
              </div>
            </div>

            <form onSubmit={handleFaucet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 font-sans">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-orby"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 font-sans">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  max="10000"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-sans focus:outline-none focus:border-orby"
                />
              </div>

              <button
                type="submit"
                disabled={faucetLoading || !faucetAddress || !faucetAmount}
                className={`w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 font-sans ${
                  faucetLoading || !faucetAddress || !faucetAmount
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-500 active:scale-95 transition-all'
                }`}
              >
                {faucetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Droplets size={18} />
                    Send TestUSDT
                  </>
                )}
              </button>
            </form>

            {/* Faucet Result */}
            {faucetResult && (
              <div className={`mt-4 p-4 rounded-xl ${faucetResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                {faucetResult.success ? (
                  <div>
                    <p className="text-green-400 font-bold text-sm mb-2">✓ Tokens sent successfully!</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${faucetResult.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View transaction <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <p className="text-red-400 font-bold text-sm">✗ {faucetResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Network Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-sans uppercase tracking-wider">Network</span>
              <span className="text-sm font-bold text-orby">Sepolia Testnet</span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-zinc-500 font-sans uppercase tracking-wider">Chain ID</span>
              <span className="text-sm font-mono text-zinc-400">11155111</span>
            </div>
          </div>
        </div>
      ) : (
        // Creation Form + Faucet (when no festival exists)
        <div className="animate-fade-in-up">
          <div className="bg-orby rounded-3xl p-6 mb-6 text-black">
            <h2 className="text-3xl font-display font-black mb-2 tracking-tight">Create Token</h2>
            <p className="opacity-70 font-medium mb-6 font-sans">Deploy a new festival currency on Sepolia.</p>

            <form onSubmit={handleDeploy} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-1 font-sans">
                  Festival Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Summer Fest 24"
                  className="w-full bg-black/10 focus:bg-white/50 transition-colors border-0 rounded-xl px-4 py-3 placeholder-black/30 font-bold outline-none ring-0 font-sans"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-1 font-sans">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  placeholder="e.g. SMR24"
                  maxLength={5}
                  className="w-full bg-black/10 focus:bg-white/50 transition-colors border-0 rounded-xl px-4 py-3 placeholder-black/30 font-bold outline-none ring-0 uppercase font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={deploying || !name || !symbol}
                className={`w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-4 font-display tracking-tight ${
                  deploying || !name || !symbol
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:scale-[1.02] active:scale-95 transition-transform'
                }`}
              >
                {deploying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{' '}
                    Deploying to Sepolia...
                  </>
                ) : (
                  <>
                    Deploy Token <Rocket size={20} />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* TestUSDT Faucet - Always visible */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-blue-500/20 text-blue-500 p-2 rounded-full">
                <Droplets size={24} />
              </div>
              <div>
                <h2 className="font-bold text-lg font-display tracking-tight">TestUSDT Faucet</h2>
                <p className="text-sm text-zinc-400 font-sans">Send test tokens to any address</p>
              </div>
            </div>

            <form onSubmit={handleFaucet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 font-sans">
                  Recipient Address
                </label>
                <input
                  type="text"
                  value={faucetAddress}
                  onChange={(e) => setFaucetAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-mono text-sm focus:outline-none focus:border-orby"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1 font-sans">
                  Amount (USDT)
                </label>
                <input
                  type="number"
                  value={faucetAmount}
                  onChange={(e) => setFaucetAmount(e.target.value)}
                  placeholder="100"
                  min="1"
                  max="10000"
                  className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 font-sans focus:outline-none focus:border-orby"
                />
              </div>

              <button
                type="submit"
                disabled={faucetLoading || !faucetAddress || !faucetAmount}
                className={`w-full bg-blue-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 font-sans ${
                  faucetLoading || !faucetAddress || !faucetAmount
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-blue-500 active:scale-95 transition-all'
                }`}
              >
                {faucetLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Droplets size={18} />
                    Send TestUSDT
                  </>
                )}
              </button>
            </form>

            {/* Faucet Result */}
            {faucetResult && (
              <div className={`mt-4 p-4 rounded-xl ${faucetResult.success ? 'bg-green-500/10 border border-green-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
                {faucetResult.success ? (
                  <div>
                    <p className="text-green-400 font-bold text-sm mb-2">✓ Tokens sent successfully!</p>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${faucetResult.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1"
                    >
                      View transaction <ExternalLink size={12} />
                    </a>
                  </div>
                ) : (
                  <p className="text-red-400 font-bold text-sm">✗ {faucetResult.error}</p>
                )}
              </div>
            )}
          </div>

          {/* Network Info */}
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-sans uppercase tracking-wider">Target Network</span>
              <span className="text-sm font-bold text-orby">Sepolia Testnet</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
