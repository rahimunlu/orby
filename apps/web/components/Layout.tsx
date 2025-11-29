'use client';

import BottomNav from './BottomNav';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  bgClass?: string;
}

export default function Layout({ children, hideNav = false, bgClass = 'bg-orby-dark' }: LayoutProps) {
  return (
    <div className={`relative min-h-screen w-full overflow-hidden flex flex-col text-white ${bgClass}`}>
      <div className="flex-1 overflow-y-auto pb-24 no-scrollbar">
        {children}
      </div>
      {!hideNav && <BottomNav />}
    </div>
  );
}
