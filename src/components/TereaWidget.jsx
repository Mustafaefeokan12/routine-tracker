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
    <div className="bg-[#17181d] border border-[#262832] rounded-3xl p-4 shadow-xl shadow-black/40">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400/20" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              Terea Sayacı & Harcama
            </h3>
            <p className="text-[11px] text-neutral-400">
              1 Dal: <strong className="text-amber-300 font-mono">{stickPrice.toFixed(2)} TL</strong> (Paket: {packPrice.toFixed(0)} TL)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 rounded-xl bg-[#23252e] text-neutral-300 hover:text-white transition-colors flex items-center gap-1 text-xs"
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Counter Controller */}
      <div className="p-3.5 rounded-2xl bg-[#121316] border border-[#262832] flex items-center justify-between">
        {/* Today Counts */}
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Bugün İçilen
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {todaySticks}
            </span>
            <span className="text-xs font-semibold text-neutral-400">Dal</span>
            <span className="text-xs text-neutral-500">({todayPacks} Paket)</span>
          </div>
          <p className="text-xs font-bold text-amber-400 mt-0.5 font-mono">
            Bugünkü Tutar: {todaySpent} TL
          </p>
        </div>

        {/* Counter Buttons (+ and -) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleDecrement}
            disabled={todaySticks <= 0}
            aria-label="Bir dal azalt"
            className="w-10 h-10 rounded-xl bg-[#20222a] border border-[#2e313d] disabled:opacity-30 text-neutral-300 hover:text-white flex items-center justify-center transition-all spring-click"
          >
            <Minus className="w-4 h-4" />
          </button>

          <button
            onClick={handleIncrement}
            aria-label="Bir dal ekle"
            className="w-14 h-14 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all spring-click"
          >
            <Plus className="w-7 h-7 stroke-[3]" />
          </button>
        </div>
      </div>

      {/* Financial Breakdown Table (Always visible compact or expanded) */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {/* Son 1 Hafta */}
        <div className="p-2.5 rounded-xl bg-[#121316] border border-[#23252e] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Son 7 Gün
          </span>
          <div className="mt-1">
            <p className="text-sm font-black text-white font-mono">{stats.weekSticks} Dal</p>
            <p className="text-[10px] font-bold text-amber-400 font-mono">
              {stats.weekSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium">({stats.weekPacks} Pkt)</span>
          </div>
        </div>

        {/* Bu Ayın 1'inden Beri */}
        <div className="p-2.5 rounded-xl bg-[#121316] border border-[#23252e] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Bu Ay (1'den)
          </span>
          <div className="mt-1">
            <p className="text-sm font-black text-white font-mono">{stats.monthSticks} Dal</p>
            <p className="text-[10px] font-bold text-amber-400 font-mono">
              {stats.monthSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium">({stats.monthPacks} Pkt)</span>
          </div>
        </div>

        {/* Tüm Zamanlar */}
        <div className="p-2.5 rounded-xl bg-[#121316] border border-[#23252e] flex flex-col justify-between">
          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">
            Tüm Zamanlar
          </span>
          <div className="mt-1">
            <p className="text-sm font-black text-white font-mono">{stats.allTimeSticks} Dal</p>
            <p className="text-[10px] font-bold text-amber-400 font-mono">
              {stats.allTimeSpent.toFixed(0)} TL
            </p>
            <span className="text-[9px] text-neutral-500 font-medium">({stats.allTimePacks} Pkt)</span>
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
