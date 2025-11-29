import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Activity, Menu, QrCode } from 'lucide-react';
import { Tab } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  bgClass?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false, bgClass = 'bg-orby-dark' }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveTab = (): Tab => {
    const path = location.pathname;
    if (path === '/wallet' || path === '/') return Tab.WALLET;
    if (path === '/activity') return Tab.ACTIVITY;
    if (path === '/menu') return Tab.MENU;
    if (path === '/qr') return Tab.QR;
    return Tab.WALLET;
  };

  const activeTab = getActiveTab();

  const navItems = [
    { id: Tab.QR, icon: QrCode, label: 'QR', path: '/qr' },
    { id: Tab.WALLET, icon: Wallet, label: 'WALLET', path: '/wallet' },
    { id: Tab.ACTIVITY, icon: Activity, label: 'ACTIVITY', path: '/activity' },
    { id: Tab.MENU, icon: Menu, label: 'MENU', path: '/menu' },
  ];

  return (
    <div className={`relative min-h-screen w-full overflow-hidden flex flex-col text-white ${bgClass}`}>
      {/* Content Area */}
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </div>

      {/* Bottom Navigation */}
      {!hideNav && (
        <div className="fixed bottom-6 left-0 w-full flex justify-center z-50 pointer-events-none">
          <div className="w-[92%] max-w-md pointer-events-auto animate-fade-in-up delay-400">
            <div className="flex items-center justify-between bg-zinc-950/90 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl ring-1 ring-white/5">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.path)}
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
      )}
    </div>
  );
};

export default Layout;