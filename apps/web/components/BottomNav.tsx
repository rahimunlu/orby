'use client';

import { usePathname, useRouter } from 'next/navigation';
import { Wallet, Activity, Menu, QrCode } from 'lucide-react';
import { Tab } from '@orby/types';

const navItems = [
  { id: Tab.QR, icon: QrCode, label: 'QR', path: '/qr' },
  { id: Tab.WALLET, icon: Wallet, label: 'WALLET', path: '/wallet' },
  { id: Tab.ACTIVITY, icon: Activity, label: 'ACTIVITY', path: '/activity' },
  { id: Tab.MENU, icon: Menu, label: 'MENU', path: '/menu' },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): Tab => {
    if (pathname === '/wallet' || pathname === '/') return Tab.WALLET;
    if (pathname === '/activity') return Tab.ACTIVITY;
    if (pathname === '/menu') return Tab.MENU;
    if (pathname === '/qr') return Tab.QR;
    return Tab.WALLET;
  };

  const activeTab = getActiveTab();

  return (
    <div className="fixed bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none">
      <div className="w-[92%] max-w-md pointer-events-auto animate-fade-in-up delay-400">
        <div className="flex items-center justify-between bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl ring-1 ring-white/5">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => router.push(item.path)}
                className={`flex items-center gap-2 px-5 py-3 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-orby text-white shadow-[0_0_15px_rgba(40,80,255,0.5)] font-bold'
                    : 'text-zinc-500 hover:text-white'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && <span className="text-xs tracking-wider font-sans">{item.label}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
