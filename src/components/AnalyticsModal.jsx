import React from 'react';
import { X, PieChart, TrendingUp, Calendar, Zap } from 'lucide-react';
import { formatCurrency } from '../utils/budget';

export default function AnalyticsModal({ isOpen, onClose, metrics, isDark }) {
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

                return (
                  <div
                    key={cat.name}
                    className={`p-3.5 rounded-2xl border ${
                      isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/70'
                    }`}
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
                      <span className="text-sm font-bold num-tabular">
                        {formatCurrency(cat.total, true)}
                      </span>
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
