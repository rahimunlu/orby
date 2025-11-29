'use client';

import Layout from '@/components/Layout';
import { Clock, ArrowDownLeft, Coffee, Music, ShoppingBag } from 'lucide-react';

const transactions = [
  { id: 1, type: 'purchase', title: 'Main Stage Bar', amount: '-24.00', time: '10 mins ago', icon: Coffee },
  { id: 2, type: 'topup', title: 'Wallet Deposit', amount: '+100.00', time: '2 hours ago', icon: ArrowDownLeft },
  { id: 3, type: 'purchase', title: 'Merch Stand', amount: '-45.00', time: '4 hours ago', icon: ShoppingBag },
  { id: 4, type: 'purchase', title: 'VIP Upgrade', amount: '-80.00', time: 'Yesterday', icon: Music },
];

export default function ActivityPage() {
  return (
    <Layout bgClass="bg-orby">
      <div className="flex flex-col text-white px-6 pt-6 pb-32 min-h-full">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <h1 className="text-3xl font-display font-black tracking-tighter lowercase italic text-white">orby</h1>
        </div>

        {/* Transactions List */}
        <div className="flex flex-col gap-4">
          <h2 className="font-display font-bold text-2xl mb-2 opacity-80 tracking-tight animate-fade-in text-white">
            Recent Activity
          </h2>

          {transactions.length > 0 ? (
            transactions.map((tx, index) => {
              const Icon = tx.icon;
              const isPositive = tx.amount.startsWith('+');
              return (
                <div
                  key={tx.id}
                  className="bg-black/10 backdrop-blur-sm border border-black/5 hover:bg-black/20 transition-all p-5 rounded-[24px] flex items-center justify-between group animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-full transition-transform duration-300 group-hover:scale-110 shadow-sm ${
                        isPositive ? 'bg-white text-orby' : 'bg-black/20 text-white'
                      }`}
                    >
                      <Icon size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg leading-tight tracking-tight text-white">
                        {tx.title}
                      </h3>
                      <p className="text-xs font-semibold opacity-60 uppercase tracking-wide font-sans text-white">
                        {tx.time}
                      </p>
                    </div>
                  </div>
                  <span className="text-xl font-bold tracking-tight font-sans text-white">{tx.amount}</span>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <div className="bg-white/10 rounded-full p-6 mb-4">
                <Clock size={32} className="opacity-40 text-white" />
              </div>
              <h3 className="text-xl font-display font-bold opacity-40 text-white">No activity yet</h3>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
