import React, { useMemo, useState } from 'react';
import { getPastDaysList, formatShortDate, formatDateDisplay } from '../utils/date';
import { Flame, Sparkles, CheckSquare, Trophy, Tag } from 'lucide-react';

export default function TrackerHeatmap({
  daysMap,
  todayStr,
  targetScore,
  tereaPrice = 6.0,
  categoryScoresMap = {},
  onSelectDay,
  onSeedDemoData,
  onClearHistory
}) {
  const [heatmapMode, setHeatmapMode] = useState('routine'); // 'routine' | 'terea'
  const [selectedCategory, setSelectedCategory] = useState('all');
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

  // All-time highest single day (En İyi Gün / Best Day Ever)
  const bestDayEver = useMemo(() => {
    let best = null;
    Object.keys(daysMap).forEach((date) => {
      const day = daysMap[date];
      if (day && day.totalScore > 0) {
        if (!best || day.totalScore > best.totalScore) {
          best = day;
        }
      }
    });
    return best;
  }, [daysMap]);

  // Routine Intensity
  const getRoutineIntensity = (score, isCategoryFiltered = false) => {
    if (!score || score === 0) return 'bg-[#15161c] border-[#22242e] text-neutral-600 hover:border-[#383b49]';
    if (isCategoryFiltered) {
      if (score < 15) return 'bg-emerald-950/60 border-emerald-900/60 text-emerald-400 hover:border-emerald-700';
      if (score < 25) return 'bg-emerald-800/80 border-emerald-700 text-emerald-100 hover:bg-emerald-700';
      if (score < 40) return 'bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500';
      return 'bg-emerald-400 border-emerald-300 text-neutral-950 font-black shadow-md shadow-emerald-500/20';
    }
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
    <div className="space-y-4 pb-28">
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
            <p className="text-xl font-bold text-amber-400 mt-1.5 font-mono privacy-blur">{stats.totalTereaSticks}</p>
            <span className="text-[10px] text-neutral-500">Son 70 günde</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Toplam Paket</span>
            <p className="text-xl font-bold text-white mt-1.5 font-mono privacy-blur">{stats.totalTereaPacks}</p>
            <span className="text-[10px] text-neutral-500">20 dal/paket</span>
          </div>

          <div className="p-3 rounded-2xl bg-[#17181d] border border-[#262832] flex flex-col justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Toplam Harcama</span>
            <p className="text-xl font-bold text-amber-300 mt-1.5 font-mono privacy-blur">{stats.totalTereaSpent.toFixed(0)} <span className="text-xs font-normal">TL</span></p>
            <span className="text-[10px] text-neutral-500">{tereaPrice.toFixed(1)} TL / dal</span>
          </div>
        </div>
      )}

      {/* "En İyi Gün" (Best Day Ever) Card */}
      {bestDayEver && (
        <div
          onClick={() => onSelectDay(bestDayEver.date)}
          className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/25 via-[#17181d] to-[#17181d] border border-amber-500/35 shadow-md shadow-amber-500/5 cursor-pointer spring-click flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Tüm Zamanların Rekoru
                </span>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  En İyi Gün ⭐
                </span>
              </div>
              <p className="text-sm font-bold text-white mt-0.5">
                {formatDateDisplay(bestDayEver.date)}
              </p>
              <p className="text-[11px] text-neutral-400">
                {bestDayEver.completedCount || Math.floor(bestDayEver.totalScore / 20)} Rutin Başarıyla Tamamlandı
              </p>
            </div>
          </div>

          <div className="text-right pl-2">
            <span className="text-2xl font-black text-amber-400 font-mono leading-none">
              {bestDayEver.totalScore}
            </span>
            <span className="text-[10px] font-bold text-neutral-400 block mt-0.5">Puan</span>
          </div>
        </div>
      )}

      {/* Main Heatmap Container */}
      <div className="p-4 rounded-3xl bg-[#17181d] border border-[#262832] shadow-xl shadow-black/50">
        <div className="flex items-center justify-between mb-3">
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

        {/* Category Filter Pills (Active for Routine Heatmap) */}
        {heatmapMode === 'routine' && (
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-2.5 mb-1 pt-1 border-b border-[#23252e]">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1 flex-shrink-0 mr-1">
              <Tag className="w-3 h-3" /> Filtre:
            </span>
            {[
              { id: 'all', label: 'Tümü' },
              { id: 'study', label: '📚 Akademi' },
              { id: 'engineering', label: '⚙️ Mühendislik' },
              { id: 'fitness', label: '🏃‍♂️ Spor' },
              { id: 'health', label: '💧 Sağlık' },
              { id: 'language', label: '🇩🇪 Almanca' },
              { id: 'mind', label: '📖 Zihin' },
              { id: 'life', label: '🧘 Yaşam' }
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition-all spring-click ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 font-bold'
                    : 'bg-[#121316] border border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* 70 Days Grid */}
        <div className="grid grid-cols-7 gap-1.5 py-1">
          {daysList.map((date) => {
            const dayRecord = daysMap[date];
            const rawScore = dayRecord?.totalScore || 0;
            const tereaCount = dayRecord?.tereaCount || 0;
            const isToday = date === todayStr;

            // Apply Category Filter to score if active
            let displayScore = rawScore;
            if (heatmapMode === 'routine' && selectedCategory !== 'all') {
              displayScore = (categoryScoresMap[date] && categoryScoresMap[date][selectedCategory]) || 0;
            }

            const intensityClass = heatmapMode === 'routine'
              ? getRoutineIntensity(displayScore, selectedCategory !== 'all')
              : getTereaIntensity(tereaCount);

            const displayVal = heatmapMode === 'routine' ? displayScore : tereaCount;

            return (
              <button
                key={date}
                onClick={() => onSelectDay(date)}
                title={`${formatDateDisplay(date)}: ${displayScore} Puan | ${tereaCount} Dal Terea`}
                className={`relative aspect-square rounded-xl border flex flex-col items-center justify-center transition-all spring-click ${intensityClass} ${
                  isToday ? 'ring-2 ring-white/70' : ''
                }`}
              >
                <span className="text-[9px] font-semibold leading-none">
                  {date.split('-')[2]}
                </span>
                {displayVal > 0 && (
                  <span className={`text-[8px] opacity-80 scale-90 leading-none mt-0.5 font-mono ${heatmapMode === 'terea' ? 'privacy-blur' : ''}`}>
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
          <div className="flex items-center gap-3">
            {onClearHistory && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Geçmiş günler ve test verileri temizlensin mi?')) {
                    onClearHistory();
                  }
                }}
                className="text-[11px] font-medium text-red-400/80 hover:text-red-300 transition-colors"
              >
                Verileri Temizle
              </button>
            )}
            <button
              type="button"
              onClick={onSeedDemoData}
              className="text-[11px] font-semibold text-neutral-400 hover:text-neutral-200 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-neutral-500" /> Test Verisi Doldur
            </button>
          </div>
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
                <span className={`text-[10px] font-mono text-neutral-400 group-hover:text-white transition-colors ${heatmapMode === 'terea' ? 'privacy-blur' : ''}`}>
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
