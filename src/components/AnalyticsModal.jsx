import React, { useState, useMemo } from 'react';
import { X, PieChart, ChevronDown, ChevronUp, Layers, Calendar } from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/budget';
import { triggerHaptic } from '../utils/haptics';

export default function AnalyticsModal({ isOpen, onClose, metrics, isDark, expenses = [] }) {
  const [activeTab, setActiveTab] = useState('period'); // 'period' | 'all'
  const [expandedCategory, setExpandedCategory] = useState(null);

  const cycle = metrics?.cycle || {
    startLabel: '',
    endLabel: '',
    elapsedDays: 1,
    startDate: new Date(),
    endDate: new Date()
  };

  const cycleStartTs = useMemo(() => {
    return cycle.startDate instanceof Date ? cycle.startDate.getTime() : new Date(cycle.startDate).getTime();
  }, [cycle.startDate]);

  const cycleEndTs = useMemo(() => {
    return cycle.endDate instanceof Date ? cycle.endDate.getTime() : new Date(cycle.endDate).getTime();
  }, [cycle.endDate]);

  // Filter expenses strictly according to the active tab
  const activeExpenses = useMemo(() => {
    if (activeTab === 'period') {
      return expenses.filter((e) => {
        const ts = e.timestamp || (e.date ? new Date(e.date + 'T12:00:00').getTime() : 0);
        return ts >= cycleStartTs && ts <= cycleEndTs;
      });
    }
    return [...expenses];
  }, [expenses, activeTab, cycleStartTs, cycleEndTs]);

  // Total spent in active view
  const activeTotalSpent = useMemo(() => {
    return activeExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  }, [activeExpenses]);

  // Group active expenses by category with 100% item-to-total parity
  const categoryGroups = useMemo(() => {
    const groups = {};
    for (const exp of activeExpenses) {
      const catName = exp.category || 'Diğer';
      const catIcon = exp.categoryIcon || '📦';
      const amount = Number(exp.amount) || 0;

      if (!groups[catName]) {
        groups[catName] = {
          name: catName,
          icon: catIcon,
          total: 0,
          count: 0,
          items: []
        };
      }
      groups[catName].total += amount;
      groups[catName].count += 1;
      groups[catName].items.push(exp);
    }

    // Sort items inside each category by date/time (newest first)
    Object.values(groups).forEach((g) => {
      g.items.sort((a, b) => {
        const tsA = a.timestamp || (a.date ? new Date(a.date + 'T12:00:00').getTime() : 0);
        const tsB = b.timestamp || (b.date ? new Date(b.date + 'T12:00:00').getTime() : 0);
        return tsB - tsA;
      });
    });

    // Sort categories by highest total spent
    return Object.values(groups).sort((a, b) => b.total - a.total);
  }, [activeExpenses]);

  // Average daily spent
  const avgDailySpent = useMemo(() => {
    if (activeTab === 'period') {
      const days = Math.max(1, cycle.elapsedDays || 1);
      return activeTotalSpent / days;
    }
    // All-time: unique days with expenses or 1
    const uniqueDates = new Set(expenses.map((e) => e.date).filter(Boolean));
    const dayCount = Math.max(1, uniqueDates.size);
    return activeTotalSpent / dayCount;
  }, [activeTab, activeTotalSpent, cycle.elapsedDays, expenses]);

  if (!isOpen) return null;

  const toggleCategory = (catName) => {
    triggerHaptic('selection');
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  const handleTabChange = (tab) => {
    triggerHaptic('light');
    setActiveTab(tab);
    setExpandedCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-3xl p-6 transition-all max-h-[90vh] overflow-y-auto no-scrollbar shadow-2xl border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Kategori Dağılımı</h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {activeTab === 'period'
                  ? `${cycle.startLabel} – ${cycle.endLabel} Dönemi`
                  : 'Tüm Zamanlar (Genel Toplam)'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-full spring-tap ${
              isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control Toggle: Dönem (Bu Ay) vs Tüm Zamanlar */}
        <div className={`p-1 rounded-2xl flex items-center gap-1 mb-4 border ${
          isDark ? 'bg-neutral-800/80 border-neutral-700/60' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <button
            type="button"
            onClick={() => handleTabChange('period')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all spring-tap flex items-center justify-center gap-1.5 ${
              activeTab === 'period'
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-purple-700 shadow-sm'
                : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Bu Ay (Dönem)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('all')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all spring-tap flex items-center justify-center gap-1.5 ${
              activeTab === 'all'
                ? isDark
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-purple-700 shadow-sm'
                : isDark
                  ? 'text-neutral-400 hover:text-neutral-200'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5 stroke-[2.2]" />
            <span>Tüm Zamanlar</span>
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => handleTabChange(activeTab === 'period' ? 'all' : 'period')}
            className={`p-3.5 rounded-2xl border text-left spring-tap cursor-pointer transition-all ${
              isDark ? 'bg-neutral-800/50 border-neutral-800 hover:border-neutral-700' : 'bg-neutral-50 border-neutral-200/80 hover:border-neutral-300'
            }`}
            title="Dönem / Genel Görünüm Değiştir"
          >
            <div className="flex items-center justify-between">
              <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
                isDark ? 'text-neutral-400' : 'text-neutral-500'
              }`}>
                Toplam Harcanan
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                activeTab === 'all'
                  ? 'bg-purple-500/20 text-purple-400'
                  : isDark ? 'bg-neutral-700 text-neutral-300' : 'bg-neutral-200 text-neutral-700'
              }`}>
                {activeTab === 'all' ? 'Tümü' : 'Dönem'}
              </span>
            </div>
            <span className="text-xl font-extrabold num-tabular tracking-tight mt-0.5 block">
              {formatCurrency(activeTotalSpent, true)}
            </span>
          </button>

          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
          }`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Günlük Ortalama
            </span>
            <span className="text-xl font-extrabold num-tabular tracking-tight mt-0.5 block text-cyan-500">
              {formatCurrency(avgDailySpent, true)}
            </span>
          </div>
        </div>

        {/* Category Breakdown List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Harcama Kalemleri
            </h3>
            <span className={`text-xs num-tabular ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {categoryGroups.length} Kategori
            </span>
          </div>

          {categoryGroups.length === 0 ? (
            <p className={`text-xs text-center py-8 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              {activeTab === 'period'
                ? 'Bu dönemde henüz harcama kaydı bulunmuyor.'
                : 'Henüz kayıtlı harcama bulunmuyor.'}
            </p>
          ) : (
            <div className="space-y-2.5">
              {categoryGroups.map((cat) => {
                const percent = activeTotalSpent > 0 ? (cat.total / activeTotalSpent) * 100 : 0;
                const isExpanded = expandedCategory === cat.name;

                return (
                  <div
                    key={cat.name}
                    className={`rounded-2xl border transition-all overflow-hidden ${
                      isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/70'
                    }`}
                  >
                    {/* Category Header Row (Clickable) */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(cat.name)}
                      className="w-full p-3.5 text-left select-none spring-tap"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{cat.icon}</span>
                          <span className="text-sm font-bold tracking-tight">
                            {cat.name}
                          </span>
                          <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            ({cat.count} işlem)
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-bold num-tabular">
                            {formatCurrency(cat.total, true)}
                          </span>
                          <span className={`p-0.5 rounded ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </span>
                        </div>
                      </div>

                      {/* Progress Track */}
                      <div className="flex items-center gap-2">
                        <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${
                          isDark ? 'bg-neutral-700/60' : 'bg-neutral-200'
                        }`}>
                          <div
                            className="h-full rounded-full bg-cyan-500 transition-all duration-300"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <span className={`text-[11px] font-semibold num-tabular w-9 text-right ${
                          isDark ? 'text-neutral-400' : 'text-neutral-500'
                        }`}>
                          %{Math.round(percent)}
                        </span>
                      </div>
                    </button>

                    {/* Accordion: Full List of items matching cat.total 100% */}
                    {isExpanded && (
                      <div className={`border-t px-3.5 py-3 space-y-2 animate-fade-in ${
                        isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-neutral-200/60 bg-white/80'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500 pb-0.5">
                          <span>
                            {activeTab === 'period' ? 'Bu Dönemdeki Harcamalar' : 'Tüm Zamanlardaki Harcamalar'}
                          </span>
                          <span className="num-tabular">{cat.items.length} Kayıt</span>
                        </div>
                        {cat.items.length === 0 ? (
                          <p className={`text-xs py-2 text-center ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Bu kategoride harcama kaydı yok.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
                            {cat.items.map((exp) => (
                              <div
                                key={exp.id || exp.timestamp}
                                className={`flex items-center justify-between p-2.5 rounded-xl text-xs ${
                                  isDark ? 'bg-neutral-800/60' : 'bg-neutral-100/70'
                                }`}
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="font-semibold truncate">
                                    {exp.title || cat.name}
                                  </div>
                                  <div className={`text-[10px] mt-0.5 ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                    {exp.date ? exp.date.split('-').reverse().slice(0, 2).join('.') : ''}
                                    {exp.timestamp ? ` • ${formatTime(exp.timestamp)}` : ''}
                                  </div>
                                </div>
                                <span className="font-extrabold num-tabular text-rose-500 shrink-0">
                                  -{formatCurrency(exp.amount, true)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
