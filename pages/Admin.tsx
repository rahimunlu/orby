import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/mockApi';
import { FestivalConfig } from '../types';
import { ArrowLeft, Rocket, CheckCircle, ExternalLink } from 'lucide-react';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  const [festival, setFestival] = useState<FestivalConfig | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [deploying, setDeploying] = useState(false);

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

  return (
    <div className="min-h-screen bg-zinc-950 text-white p-6 pb-32">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
            <button onClick={() => navigate('/menu')} className="p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-white transition-colors">
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
            // Existing Festival View
            <div className="animate-fade-in-up">
                <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 mb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-green-500/20 text-green-500 p-2 rounded-full">
                            <CheckCircle size={24} />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg font-display tracking-tight">Active Festival</h2>
                            <p className="text-sm text-zinc-400 font-sans">Token deployed successfully</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Name</label>
                            <p className="text-xl font-bold font-display">{festival.festivalName}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Symbol</label>
                            <p className="text-xl font-bold font-display">{festival.festivalSymbol}</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Contract Address</label>
                            <div className="bg-black p-3 rounded-lg mt-1 break-all font-mono text-xs text-orby">
                                {festival.tokenAddress}
                            </div>
                        </div>
                         <div>
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-sans">Owner</label>
                            <div className="bg-black p-3 rounded-lg mt-1 break-all font-mono text-xs text-zinc-400">
                                {festival.ownerAddress}
                            </div>
                        </div>
                    </div>

                    <button className="w-full mt-8 bg-zinc-800 hover:bg-zinc-700 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors font-sans uppercase text-sm tracking-wide">
                        View in Explorer <ExternalLink size={16} />
                    </button>
                </div>
            </div>
        ) : (
            // Creation Form
            <div className="animate-fade-in-up">
                <div className="bg-orby rounded-3xl p-6 mb-6 text-black">
                    <h2 className="text-3xl font-display font-black mb-2 tracking-tight">Create Token</h2>
                    <p className="opacity-70 font-medium mb-6 font-sans">Deploy a new festival currency on-chain.</p>
                    
                    <form onSubmit={handleDeploy} className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-1 font-sans">Festival Name</label>
                            <input 
                                type="text" 
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="e.g. Summer Fest 24"
                                className="w-full bg-black/10 focus:bg-white/50 transition-colors border-0 rounded-xl px-4 py-3 placeholder-black/30 font-bold outline-none ring-0 font-sans"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wide opacity-60 mb-1 font-sans">Token Symbol</label>
                            <input 
                                type="text" 
                                value={symbol}
                                onChange={e => setSymbol(e.target.value)}
                                placeholder="e.g. SMR24"
                                maxLength={5}
                                className="w-full bg-black/10 focus:bg-white/50 transition-colors border-0 rounded-xl px-4 py-3 placeholder-black/30 font-bold outline-none ring-0 uppercase font-sans"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={deploying || !name || !symbol}
                            className={`w-full bg-black text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 mt-4 font-display tracking-tight ${
                                (deploying || !name || !symbol) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-95 transition-transform'
                            }`}
                        >
                            {deploying ? (
                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> Deploying...</>
                            ) : (
                                <>Deploy Token <Rocket size={20} /></>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminPage;