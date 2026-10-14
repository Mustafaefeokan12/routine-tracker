import React from 'react';
import { Flame, Settings as SettingsIcon, BarChart3, Trophy, Eye, EyeOff } from 'lucide-react';
import { formatDateDisplay } from '../utils/date';

export default function Header({
  todayStr,
  currentScore,
  targetScore,
  streak,
  freezeUsed,
  todayTereaSticks,
  tereaPrice,
  onOpenSettings,
  onOpenBadges,
  onToggleView,
  currentView,
  privacyMode = false,
  onTogglePrivacy
}) {
  const percentage = Math.min(Math.round((currentScore / (targetScore || 100)) * 100), 100);
  const isOverachieved = currentScore > targetScore;
  const todayTereaSpent = (todayTereaSticks * tereaPrice).toFixed(0);

  return (
    <header className="sticky top-0 z-20 bg-[#0f1014]/90 backdrop-blur-2xl border-b border-[#23252e] px-4 pt-3 pb-3 safe-top">
      <div className="max-w-md mx-auto">
        {/* Top Info Row */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {formatDateDisplay(todayStr)}
              </p>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white mt-0.5">
              Rutin & Terea Tracker
            </h1>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onTogglePrivacy}
              aria-label="Gizlilik Kalkanı"
              className={`p-2.5 rounded-xl border transition-all spring-click ${
                privacyMode
                  ? 'bg-cyan-950/50 border-cyan-700/60 text-cyan-300 shadow-sm shadow-cyan-500/20'
                  : 'bg-[#17181d] border-[#23252e] text-neutral-300 hover:text-white'
              }`}
              title={privacyMode ? 'Gizlilik Kalkanı Aktif (Bulanık)' : 'Gizlilik Kalkanını Aç'}
            >
              {privacyMode ? <EyeOff className="w-5 h-5 text-cyan-400" /> : <Eye className="w-5 h-5" />}
            </button>
            <button
              onClick={onOpenBadges}
              aria-label="Rozetler & Seviye"
              className="p-2.5 rounded-xl bg-[#17181d] border border-[#23252e] text-amber-400 hover:text-amber-300 spring-click"
              title="Seviye ve Rozetler"
            >
              <Trophy className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleView}
              aria-label="Görünüm Değiştir"
              className={`p-2.5 rounded-xl border transition-all spring-click ${
                currentView === 'tracker'
                  ? 'bg-[#23252e] border-[#363945] text-emerald-400'
                  : 'bg-[#17181d] border-[#23252e] text-neutral-300 hover:text-white'
              }`}
              title="Aktivite Isı Haritası"
            >
              <BarChart3 className="w-5 h-5" />
            </button>
            <button
              onClick={onOpenSettings}
              aria-label="Ayarlar"
              className="p-2.5 rounded-xl bg-[#17181d] border border-[#23252e] text-neutral-300 hover:text-white spring-click"
              title="Ayarlar"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Daily Score & Streak Banner */}
        <div className="bg-[#17181d] border border-[#262832] rounded-2xl p-3.5 flex items-center justify-between shadow-lg shadow-black/40">
          <div className="flex items-center gap-3.5">
            {/* Circular Progress Ring */}
            <div className="relative w-14 h-14 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-[#262832]"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={isOverachieved ? 'text-amber-400' : 'text-emerald-400'}
                  strokeDasharray={`${percentage}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-white leading-none">
                  %{percentage}
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-black tracking-tight text-white privacy-blur">
                  {currentScore}
                </span>
                <span className="text-xs font-semibold text-neutral-400">
                  / {targetScore} P
                </span>
                {isOverachieved && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    +Bonus
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {currentScore >= targetScore
                  ? '🎯 Hedef aşıldı!'
                  : `Hedefe ${targetScore - currentScore} puan kaldı`}
              </p>
            </div>
          </div>

          {/* Right Stats: Streak & Terea Quick Pill */}
          <div className="flex flex-col items-end gap-1.5 pl-3 border-l border-[#262832]">
            {/* Streak */}
            <div className="flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400/20" />
              <span className="text-xs font-bold text-white font-mono">
                {streak} Gün {freezeUsed && <span title="Dondurma Koruması">❄️</span>}
              </span>
            </div>

            {/* Terea Quick Pill */}
            <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] font-bold text-amber-300 font-mono privacy-blur">
              {todayTereaSticks} Dal • {todayTereaSpent} TL
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
