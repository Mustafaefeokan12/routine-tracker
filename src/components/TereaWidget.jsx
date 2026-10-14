import React, { useState } from 'react';
import { Flame, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { playTereaSound, triggerHaptic } from '../utils/sound';

export default function TereaWidget({
  todaySticks,
  stickPrice,
  stats,
  onIncrement,
  onDecrement,
  onOpenSettings
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  const packPrice = stickPrice * 20;
  const todaySpent = (todaySticks * stickPrice).toFixed(1);
  const todayPacks = (todaySticks / 20).toFixed(1);

  const handleIncrement = () => {
    triggerHaptic(20);
    playTereaSound();
    onIncrement();
  };

  const handleDecrement = () => {
    if (todaySticks > 0) {
      triggerHaptic(10);
      onDecrement();
    }
  };

  return (
    <div className="bg-[#14151a] border border-[#22242b] rounded-3xl p-4 shadow-sm">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-neutral-300">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight flex items-center gap-1.5">
              Terea Tüketimi
            </h3>
            <p className="text-[11px] text-neutral-400">
              1 Dal: <strong className="text-neutral-200 font-mono">{stickPrice.toFixed(2)} TL</strong> (Paket: {packPrice.toFixed(0)} TL)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-xl bg-[#1e2027] text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Counter Controller */}
      <div className="p-3.5 rounded-2xl bg-[#0f1014] border border-[#22242b] flex items-center justify-between">
        {/* Today Counts */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Bugün İçilen
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight privacy-blur">
              {todaySticks}
            </span>
            <span className="text-xs font-semibold text-neutral-400">Dal</span>
            <span className="text-xs text-neutral-500 privacy-blur">({todayPacks} Paket)</span>
          </div>
          <p className="text-xs font-semibold text-neutral-300 mt-0.5 font-mono privacy-blur">
            Bugünkü Tutar: {todaySpent} TL
          </p>
        </div>

        {/* Counter Buttons (+ and -) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            disabled={todaySticks <= 0}
            aria-label="Bir dal azalt"
            className="w-10 h-10 rounded-xl bg-[#1a1b22] border border-[#2a2c37] disabled:opacity-30 text-neutral-300 hover:text-white flex items-center justify-center transition-all spring-click"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={handleIncrement}
            aria-label="Bir dal ekle"
            className="w-12 h-12 rounded-2xl bg-neutral-100 hover:bg-white text-black flex items-center justify-center shadow-md transition-all spring-click"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Financial Breakdown Table */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {/* Son 1 Hafta */}
        <div className="p-2.5 rounded-xl bg-[#0f1014] border border-[#22242b] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Son 7 Gün
          </span>
          <div className="mt-1">
            <p className="text-sm font-bold text-white font-mono privacy-blur">{stats.weekSticks} Dal</p>
            <p className="text-[10px] font-semibold text-neutral-300 font-mono privacy-blur">
              {stats.weekSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium privacy-blur">({stats.weekPacks} Pkt)</span>
          </div>
        </div>

        {/* Bu Ayın 1'inden Beri */}
        <div className="p-2.5 rounded-xl bg-[#0f1014] border border-[#22242b] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Bu Ay (1'den)
          </span>
          <div className="mt-1">
            <p className="text-sm font-bold text-white font-mono privacy-blur">{stats.monthSticks} Dal</p>
            <p className="text-[10px] font-semibold text-neutral-300 font-mono privacy-blur">
              {stats.monthSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium privacy-blur">({stats.monthPacks} Pkt)</span>
          </div>
        </div>

        {/* Tüm Zamanlar */}
        <div className="p-2.5 rounded-xl bg-[#0f1014] border border-[#22242b] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Tüm Zamanlar
          </span>
          <div className="mt-1">
            <p className="text-sm font-bold text-white font-mono privacy-blur">{stats.allTimeSticks} Dal</p>
            <p className="text-[10px] font-semibold text-neutral-300 font-mono privacy-blur">
              {stats.allTimeSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium privacy-blur">({stats.allTimePacks} Pkt)</span>
          </div>
        </div>
      </div>

      {/* Expanded Analytics Details */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#23252e] space-y-2 text-xs text-neutral-400 animate-fade-in">
          <div className="flex items-center justify-between">
            <span>Günlük Ortalama:</span>
            <strong className="text-white font-mono">{stats.dailyAvgSticks} Dal / gün</strong>
          </div>
          <div className="flex items-center justify-between">
            <span>Aylık Tahmini Gider:</span>
            <strong className="text-amber-400 font-mono">
              {(stats.dailyAvgSticks * 30 * stickPrice).toFixed(0)} TL
            </strong>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[11px] text-neutral-500">1 Dal Fiyatını Değiştir:</span>
            <button
              onClick={onOpenSettings}
              className="text-[11px] font-bold text-neutral-300 hover:text-white underline underline-offset-2"
            >
              Ayarlara Git
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
