import React from 'react';
import { ArrowRight } from 'lucide-react';
import { AppScreen } from '../types/arena';

interface TopNavProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ currentScreen, onNavigate }) => {
  const navItems: Array<{ id: AppScreen; label: string }> = [
    { id: 'home', label: 'Pusat Operasi' },
    { id: 'guide', label: 'Panduan' },
    { id: 'mode-select', label: 'Pilih Mod' },
    { id: 'techniques', label: 'Teknik K1–K4' },
    { id: 'records', label: 'Rekod & Guru' },
  ];

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-[#1B0E3B]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
        {/* Zone 1: Single-line Brand Wordmark */}
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="font-display cursor-pointer text-left text-lg font-extrabold tracking-tight text-[#F7F5FC] whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26B9D1] rounded-md px-1"
        >
          ARENA PECUT <span className="text-[#FFC94A]">30M</span>
        </button>

        {/* Zone 2: Concise single-line nav links */}
        <nav
          aria-label="Navigasi Utama"
          className="hidden md:flex items-center gap-6 text-sm font-medium"
        >
          {navItems.map((item) => {
            const active =
              currentScreen === item.id ||
              (item.id === 'mode-select' &&
                (currentScreen === 'school-mode' || currentScreen === 'home-mode')) ||
              (item.id === 'records' && currentScreen === 'mission-complete');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`cursor-pointer whitespace-nowrap shrink-0 py-1 transition-colors border-b-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26B9D1] ${
                  active
                    ? 'border-[#26B9D1] text-[#F7F5FC] font-semibold'
                    : 'border-transparent text-[#C6BBE6] hover:text-[#F7F5FC] hover:border-white/30'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Quick Mission Action */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={() => onNavigate('mode-select')}
            className="cursor-pointer inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 rounded-lg bg-[#FFC94A] px-3.5 py-2 text-xs font-extrabold text-[#14092E] hover:bg-[#ffd56e] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#26B9D1]"
          >
            <span>Mula Misi</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Mobile compact single-row nav strip */}
      <nav
        aria-label="Navigasi Mudah Alih"
        className="flex md:hidden items-center justify-between gap-2 overflow-x-auto border-t border-white/10 px-4 py-2 text-xs font-medium"
      >
        {navItems.map((item) => {
          const active = currentScreen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className={`cursor-pointer whitespace-nowrap shrink-0 rounded-md px-2.5 py-1.5 transition-colors ${
                active
                  ? 'bg-[#7042C5] text-[#F7F5FC]'
                  : 'text-[#C6BBE6] hover:text-[#F7F5FC]'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </header>
  );
};
