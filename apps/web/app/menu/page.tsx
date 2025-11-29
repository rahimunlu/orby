'use client';

import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';
import { ArrowDown, Plus, Sparkles, MoreHorizontal } from 'lucide-react';

export default function MenuPage() {
  const router = useRouter();

  const menuItems = [
    { label: 'Deposit', icon: Plus, action: () => router.push('/wallet'), highlight: true },
    { label: 'Withdraw', icon: ArrowDown, action: () => {}, highlight: false },
    { label: 'Rewards', icon: Sparkles, action: () => {}, highlight: false },
    { label: 'More', icon: MoreHorizontal, action: () => {}, highlight: false },
  ];

  return (
    <Layout bgClass="bg-zinc-950">
      <div className="min-h-screen text-white px-6 pt-6 pb-32">
        {/* Header */}
        <div className="flex justify-between items-center mb-12 animate-fade-in">
          <h1 className="text-3xl font-display font-black tracking-tighter lowercase italic text-orby">orby</h1>
        </div>

        <div className="space-y-4">
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <button
                key={index}
                onClick={item.action}
                className="w-full flex items-center justify-between p-6 rounded-[24px] hover:bg-zinc-900 active:bg-zinc-800 active:scale-[0.98] transition-all duration-300 group animate-fade-in-up"
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <span
                  className={`text-4xl font-display font-bold tracking-tight transition-colors ${
                    item.highlight ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  {item.label}
                </span>
                <div
                  className={`p-3 rounded-full transition-transform group-hover:rotate-12 ${
                    item.highlight
                      ? 'bg-orby text-white shadow-[0_0_20px_rgba(40,80,255,0.4)]'
                      : 'bg-zinc-900 text-zinc-500 group-hover:text-zinc-300'
                  }`}
                >
                  <Icon size={24} strokeWidth={3} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 px-6 animate-fade-in delay-400">
          <button
            onClick={() => router.push('/admin')}
            className="text-zinc-700 text-sm font-bold tracking-[0.2em] uppercase hover:text-orby transition-colors font-sans"
          >
            Admin Access
          </button>
        </div>
      </div>
    </Layout>
  );
}
