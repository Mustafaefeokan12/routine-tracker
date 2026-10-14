import React, { useMemo, useState } from 'react';
import { getPastDaysList, formatShortDate, formatDateDisplay } from '../utils/date';
import { Flame, Trophy, TrendingUp, Calendar, Info, Sparkles, CheckSquare, DollarSign } from 'lucide-react';

export default function TrackerHeatmap({
  daysMap,
  todayStr,
  targetScore,
  tereaPrice = 6.0,
  onSelectDay,
  onSeedDemoData
}) {
  const [heatmapMode, setHeatmapMode] = useState('routine'); // 'routine' | 'terea'
  const daysList = useMemo(() => getPastDaysList(70, 4), []);

  // Compute summary stats
  const stats = useMemo(() => {
    let trackedCount = 0;
    let totalScoreSum = 0;
    let perfectDays = 0;
    let totalTereaSticks = 0;

    daysList.forEach((date) => {
      const day = daysMap[date];
      if (day) {
        if (day.totalScore > 0) {
          trackedCount++;
          totalScoreSum += day.totalScore;
          if (day.totalScore >= targetScore) perfectDays++;
        }
        if (day.tereaCount) {
          totalTereaSticks += day.tereaCount;
        }
      }
    });

    const avgScore = trackedCount > 0 ? Math.round(totalScoreSum / trackedCount) : 0;
    const totalTereaSpent = totalTereaSticks * tereaPrice;
    const totalTereaPacks = (totalTereaSticks / 20).toFixed(1);

    return { trackedCount, avgScore, perfectDays, totalTereaSticks, totalTereaSpent, totalTereaPacks };
  }, [daysMap, daysList, targetScore, tereaPrice]);

  // Routine Intensity
  const getRoutineIntensity = (score) => {
    if (!score || score === 0) return 'bg-[#15161c] border-[#22242e] text-neutral-600 hover:border-[#383b49]';
    if (score < 40) return 'bg-emerald-950/60 border-emerald-900/60 text-emerald-400 hover:border-emerald-700';
    if (score < 80) return 'bg-emerald-800/80 border-emerald-700 text-emerald-100 hover:bg-emerald-700';
    if (score < 100) return 'bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500';
    return 'bg-emerald-400 border-emerald-300 text-neutral-950 font-black shadow-md shadow-emerald-500/20';
  };

  // Terea Intensity
  const getTereaIntensity = (sticks) => {
    if (!sticks || sticks === 0) return 'bg-[#15161c] border-[#22242e] text-neutral-600 hover:border-[#383b49]';
    if (sticks <= 5) return 'bg-amber-950/40 border-amber-900/40 text-amber-300 hover:border-amber-700';
    if (sticks <= 10) return 'bg-amber-800/60 border-amber-700 text-amber-100 hover:bg-amber-700';
    if (sticks <= 15) return 'bg-amber-600 border-amber-500 text-white font-bold';
    return 'bg-amber-500 border-amber-300 text-neutral-950 font-black shadow-md shadow-amber-500/20';
  };

  return (
    <div className="space-y-5 pb-28">
      {/* KPI Cards Row (Dynamic based on mode) */}
      {heatmapMode === 'routine' ? (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Kayıtlı Gün</span>
            <p className="text-xl font-bold text-white mt-1.5">{stats.trackedCount}</p>
            <span className="text-[10px] text-neutral-500">Son 70 günde</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Ortalama</span>
            <p className="text-xl font-bold text-emerald-400 mt-1.5">{stats.avgScore} <span className="text-xs text-neutral-400 font-normal">P</span></p>
            <span className="text-[10px] text-neutral-500">Aktif günlerde</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Tam Gün</span>
            <p className="text-xl font-bold text-amber-400 mt-1.5">{stats.perfectDays}</p>
            <span className="text-[10px] text-neutral-500">100+ puan</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2.5">
          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Toplam Dal</span>
            <p className="text-xl font-bold text-amber-400 mt-1.5 font-mono">{stats.totalTereaSticks}</p>
            <span className="text-[10px] text-neutral-500">Son 70 günde</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Toplam Paket</span>
            <p className="text-xl font-bold text-white mt-1.5 font-mono">{stats.totalTereaPacks}</p>
            <span className="text-[10px] text-neutral-500">20 dal/paket</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Toplam Harcama</span>
            <p className="text-xl font-bold text-amber-300 mt-1.5 font-mono">{stats.totalTereaSpent.toFixed(0)} <span className="text-xs font-normal">TL</span></p>
            <span className="text-[10px] text-neutral-500">{tereaPrice.toFixed(1)} TL / dal</span>
          </div>
        </div>
      )}

      {/* Main Heatmap Container */}
      <div className="p-4 rounded-3xl bg-[#17181d] border border-[#262832] shadow-xl shadow-black/50">
        <div className="flex items-center justify-between mb-3.5">
          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#121316] border border-[#262832] text-xs font-semibold">
            <button
              onClick={() => setHeatmapMode('routine')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                heatmapMode === 'routine'
                  ? 'bg-[#2b2e3b] text-emerald-400 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <CheckSquare className="w-3 h-3" /> Rutin Puanı
            </button>
            <button
              onClick={() => setHeatmapMode('terea')}
              className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all ${
                heatmapMode === 'terea'
                  ? 'bg-[#2b2e3b] text-amber-400 font-bold shadow'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Flame className="w-3 h-3" /> Terea Tüketimi
            </button>
          </div>

          {/* Color Legend */}
          <div className="flex items-center gap-1 text-[10px] text-neutral-400">
            <span>Az</span>
            <div className="w-2.5 h-2.5 rounded-sm bg-[#15161c] border border-[#22242e]"></div>
            <div className={`w-2.5 h-2.5 rounded-sm ${heatmapMode === 'routine' ? 'bg-emerald-950 border border-emerald-900' : 'bg-amber-950 border border-amber-900'}`}></div>
            <div className={`w-2.5 h-2.5 rounded-sm ${heatmapMode === 'routine' ? 'bg-emerald-700' : 'bg-amber-700'}`}></div>
            <div className={`w-2.5 h-2.5 rounded-sm ${heatmapMode === 'routine' ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
            <span>Çok</span>
          </div>
        </div>

        {/* 70 Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 py-1">
          {daysList.map((date) => {
            const dayRecord = daysMap[date];
            const score = dayRecord?.totalScore || 0;
            const tereaCount = dayRecord?.tereaCount || 0;
            const isToday = date === todayStr;

            const intensityClass = heatmapMode === 'routine'
              ? getRoutineIntensity(score)
              : getTereaIntensity(tereaCount);

            const displayVal = heatmapMode === 'routine' ? score : tereaCount;

            return (
              <button
                key={date}
                onClick={() => onSelectDay(date)}
                title={`${formatDateDisplay(date)}: ${score} Puan | ${tereaCount} Dal Terea`}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all spring-click ${intensityClass} ${
                  isToday ? 'ring-2 ring-white/70' : ''
                }`}
              >
                <span className="text-[9px] font-semibold leading-none">
                  {date.split('-')[2]}
                </span>
                {displayVal > 0 && (
                  <span className="text-[8px] opacity-80 scale-90 leading-none mt-0.5 font-mono">
                    {displayVal}
                  </span>
                )}
                {isToday && (
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 ring-1 ring-black"></span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-[#23252e] flex items-center justify-between text-xs text-neutral-400">
          <span>⚪ Beyaz: <strong>Bugün</strong> • Dokununca detay açılır</span>
          <button
            onClick={onSeedDemoData}
            className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3 h-3" /> Test Verisi Doldur
          </button>
        </div>
      </div>

      {/* Weekly Trend Bar Chart (Last 7 Days) */}
      <div className="p-4 rounded-3xl bg-[#17181d] border border-[#262832]">
        <h3 className="text-sm font-bold text-white tracking-tight mb-1">
          {heatmapMode === 'routine' ? 'Son 7 Günlük Rutin Performansı' : 'Son 7 Günlük Terea Tüketimi (Dal)'}
        </h3>
        <p className="text-[11px] text-neutral-400 mb-4">
          {heatmapMode === 'routine' ? '100 puan hedefi karşılaştırması' : `Günlük dal sayısı ve tutar (${tereaPrice.toFixed(1)} TL/dal)`}
        </p>

        <div className="flex items-end justify-between gap-2 h-36 pt-4 px-1">
          {daysList.slice(-7).map((date) => {
            const dayRecord = daysMap[date];
            const score = dayRecord?.totalScore || 0;
            const terea = dayRecord?.tereaCount || 0;
            const isToday = date === todayStr;

            const val = heatmapMode === 'routine' ? score : terea;
            const maxVal = heatmapMode === 'routine' ? targetScore : 20;
            const barHeight = Math.min(Math.round((val / maxVal) * 100), 110);

            return (
              <div
                key={date}
                onClick={() => onSelectDay(date)}
                className="flex-1 flex flex-col items-center gap-1.5 cursor-pointer group"
              >
                <span className="text-[10px] font-mono text-neutral-400 group-hover:text-white transition-colors">
                  {val}
                </span>
                <div className="w-full bg-[#15161c] rounded-lg h-24 flex items-end p-0.5 border border-[#23252e]">
                  <div
                    style={{ height: `${Math.max(barHeight, 4)}%` }}
                    className={`w-full rounded-md transition-all duration-500 ${
                      heatmapMode === 'routine'
                        ? score >= targetScore
                          ? 'bg-emerald-400 group-hover:bg-emerald-300'
                          : score > 0
                          ? 'bg-emerald-600 group-hover:bg-emerald-500'
                          : 'bg-[#20222a]'
                        : terea > 0
                        ? 'bg-amber-400 group-hover:bg-amber-300'
                        : 'bg-[#20222a]'
                    }`}
                  ></div>
                </div>
                <span className={`text-[10px] font-medium ${isToday ? 'text-white font-bold' : 'text-neutral-500'}`}>
                  {formatShortDate(date)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
