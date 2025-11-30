'use client';

import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import BottomNav from './BottomNav';
import { api } from '@/lib/api';
import type { FestivalConfig } from '@orby/types';

const SEPOLIA_ETHERSCAN_BASE = 'https://sepolia.etherscan.io/address/';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
  bgClass?: string;
  showVaultLink?: boolean;
}

/**
 * Layout Component
 * 
 * Wraps pages with navigation and optional Vault contract link in footer.
 * Requirements: 6.3 - Display Etherscan link to Vault contract
 */
export default function Layout({ 
  children, 
  hideNav = false, 
  bgClass = 'bg-orby-dark',
  showVaultLink = true 
}: LayoutProps) {
  const [festival, setFestival] = useState<FestivalConfig | null>(null);

  useEffect(() => {
    if (showVaultLink) {
      api.getFestival().then(setFestival).catch(console.error);
    }
  }, [showVaultLink]);

  return (
    <div className={`relative min-h-screen w-full overflow-hidden flex flex-col text-white ${bgClass}`}>
      <div className="flex-1 overflow-y-auto pb-32 no-scrollbar">
        {children}
      </div>
      
      {/* Vault Contract Link Footer (Requirement 6.3) */}
      {showVaultLink && festival?.vaultAddress && (
        <div className="fixed bottom-24 left-0 w-full flex justify-center z-40 pointer-events-none">
          <a
            href={`${SEPOLIA_ETHERSCAN_BASE}${festival.vaultAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto flex items-center gap-1.5 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full text-xs text-white/50 hover:text-white/80 border border-white/10 transition-colors"
          >
            <ExternalLink size={10} />
            Vault: {festival.vaultAddress.slice(0, 6)}...{festival.vaultAddress.slice(-4)}
          </a>
        </div>
      )}
      
      {!hideNav && <BottomNav />}
    </div>
  );
}
