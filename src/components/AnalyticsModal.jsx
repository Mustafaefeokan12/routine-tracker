import React, { useState } from 'react';
import { X, PieChart, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/budget';
import { triggerHaptic } from '../utils/haptics';

export default function AnalyticsModal({ isOpen, onClose, metrics, isDark, expenses = [] }) {
  const [expandedCategory, setExpandedCategory] = useState(null);

  if (!isOpen) return null;

  const {
    monthlyIncome,
    cycleTotalSpent,
    cycleRemaining,
    cyclePercentSpent,
    avgDailySpent,
    categories = [],
    cycle
  } = metrics;

  const toggleCategory = (catName) => {
    triggerHaptic('selection');
    setExpandedCategory((prev) => (prev === catName ? null : catName));
  };

  const getCategoryExpenses = (catName) => {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    return expenses.filter((exp) => {
      const expTs = exp.timestamp || new Date(exp.date + 'T12:00:00').getTime();
      const matchesCategory = (exp.category === catName) || (!exp.category && catName === 'Diğer');
      return matchesCategory && expTs >= thirtyDaysAgo;
    }).sort((a, b) => {
      const tsA = a.timestamp || new Date(a.date + 'T12:00:00').getTime();
      const tsB = b.timestamp || new Date(b.date + 'T12:00:00').getTime();
      return tsB - tsA;
    });
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
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Kategori Dağılımı</h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                {cycle.startLabel} – {cycle.endLabel} Dönemi
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

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5">
          <div className={`p-3.5 rounded-2xl border ${
            isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
          }`}>
            <span className={`text-[11px] font-semibold uppercase tracking-wider block ${
              isDark ? 'text-neutral-400' : 'text-neutral-500'
            }`}>
              Toplam Harcanan
            </span>
            <span className="text-xl font-extrabold num-tabular tracking-tight mt-0.5 block">
              {formatCurrency(cycleTotalSpent, true)}
            </span>
          </div>

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
          <h3 className={`text-xs font-bold uppercase tracking-wider px-1 ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            Harcama Kalemleri
          </h3>

          {categories.length === 0 ? (
            <p className={`text-xs text-center py-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Bu dönemde henüz kategori kaydı bulunmuyor.
            </p>
          ) : (
            <div className="space-y-2.5">
              {categories.map((cat) => {
                const percent = cycleTotalSpent > 0 ? (cat.total / cycleTotalSpent) * 100 : 0;
                const isExpanded = expandedCategory === cat.name;
                const catExpenses = isExpanded ? getCategoryExpenses(cat.name) : [];

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

                    {/* Accordion: Expenses in this category over the last 30 days */}
                    {isExpanded && (
                      <div className={`border-t px-3.5 py-3 space-y-2 animate-fade-in ${
                        isDark ? 'border-neutral-800 bg-neutral-900/60' : 'border-neutral-200/60 bg-white/80'
                      }`}>
                        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-neutral-500 pb-0.5">
                          <span>Son 1 Aydaki Harcamalar</span>
                          <span className="num-tabular">{catExpenses.length} Kayıt</span>
                        </div>
                        {catExpenses.length === 0 ? (
                          <p className={`text-xs py-2 text-center ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            Bu kategoride son 30 günde harcama kaydı yok.
                          </p>
                        ) : (
                          <div className="space-y-1.5 max-h-48 overflow-y-auto no-scrollbar">
                            {catExpenses.map((exp) => (
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
