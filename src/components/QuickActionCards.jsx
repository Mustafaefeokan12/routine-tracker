import React from 'react';
import { triggerHaptic, soundEngine } from '../utils/haptics';
import { formatCurrency } from '../utils/budget';
import { CreditCard, Sparkles } from 'lucide-react';

export default function QuickActionCards({
  iqosPrice = 220,
  onAddIqos,
  onOpenYemekKarti,
  isDark
}) {
  const handleIqosClick = () => {
    triggerHaptic('medium');
    soundEngine.playPop();
    onAddIqos();
  };

  const handleYemekKartiClick = () => {
    triggerHaptic('light');
    soundEngine.playPop();
    onOpenYemekKarti();
  };

  return (
    <div className="grid grid-cols-2 gap-3.5 my-4">
      {/* 1. IQOS Quick Action Card */}
      <button
        type="button"
        onClick={handleIqosClick}
        className={`group relative text-left p-4.5 rounded-3xl spring-tap transition-all flex flex-col justify-between min-h-[126px] ${
          isDark
            ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:bg-neutral-800/90'
            : 'bg-white border border-neutral-200/90 hover:border-neutral-300 shadow-sm active:bg-neutral-50'
        }`}
      >
        <div className="flex items-start justify-between w-full">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            🚬
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-100 text-neutral-700'
          }`}>
            +1 Paket
          </span>
        </div>

        <div>
          <h3 className={`text-base font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            IQOS
          </h3>
          <p className="text-sm font-semibold text-amber-500 num-tabular mt-0.5">
            {formatCurrency(iqosPrice, true)}
          </p>
        </div>
      </button>

      {/* 2. Yemek Kartı Quick Action Card */}
      <button
        type="button"
        onClick={handleYemekKartiClick}
        className={`group relative text-left p-4.5 rounded-3xl spring-tap transition-all flex flex-col justify-between min-h-[126px] ${
          isDark
            ? 'bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:bg-neutral-800/90'
            : 'bg-white border border-neutral-200/90 hover:border-neutral-300 shadow-sm active:bg-neutral-50'
        }`}
      >
        <div className="flex items-start justify-between w-full">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
            💳
          </div>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
            isDark ? 'bg-neutral-800 text-cyan-400' : 'bg-cyan-50 text-cyan-700'
          }`}>
            60 ₺ Katları
          </span>
        </div>

        <div>
          <h3 className={`text-base font-bold tracking-tight ${
            isDark ? 'text-white' : 'text-neutral-900'
          }`}>
            Yemek Kartı
          </h3>
          <p className={`text-xs font-medium mt-0.5 ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            İTÜ Kart Yükle
          </p>
        </div>
      </button>
    </div>
  );
}
