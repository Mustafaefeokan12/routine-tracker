import React from 'react';
import { formatCurrency } from '../utils/budget';
import { ArrowUpRight, ArrowDownRight, Sparkles, Calendar } from 'lucide-react';

export default function BudgetSummaryCard({ metrics, isDark }) {
  if (!metrics) return null;

  const {
    dailyAllowance = 0,
    todayNet = 0,
    isTodaySurplus = true,
    cycleRemaining = 0,
    cyclePercentSpent = 0,
    cycle = { startLabel: '', endLabel: '', remainingDays: 0 },
    isBalanceActive = false,
    daysLeftInPeriod = 0
  } = metrics;

  return (
    <section
      className={`rounded-3xl p-5 transition-all shadow-sm ${
        isDark
          ? 'bg-neutral-900/90 border border-neutral-800/80 text-white'
          : 'bg-white border border-neutral-200/80 text-neutral-900 shadow-sm'
      }`}
    >
      {/* Top Banner when Mid-Cycle Active Balance is set */}
      {isBalanceActive && (
        <div className={`flex items-center gap-2 mb-3.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
          isDark
            ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
            : 'bg-cyan-50 text-cyan-800 border border-cyan-200'
        }`}>
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>20 Kasım'a kadar {formatCurrency(metrics.monthlyIncome, true)} bütçe devrede ({daysLeftInPeriod} gün)</span>
        </div>
      )}

      {/* Today's Net Indicator Pill */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <span className={`text-[11px] font-bold uppercase tracking-wider ${
            isDark ? 'text-neutral-400' : 'text-neutral-500'
          }`}>
            Bugünün Durumu
          </span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-3xl font-extrabold tracking-tight num-tabular">
              {isTodaySurplus ? '+' : ''}
              {formatCurrency(todayNet, true)}
            </span>
          </div>
        </div>

        <div
          className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-semibold ${
            isTodaySurplus
              ? isDark
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : isDark
                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {isTodaySurplus ? (
            <>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              <span>Kardasın</span>
            </>
          ) : (
            <>
              <ArrowDownRight className="w-4 h-4 stroke-[2.5]" />
              <span>Aştın</span>
            </>
          )}
        </div>
      </div>

      {/* Budget Progress Bar */}
      <div className="space-y-2 mt-5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
            {isBalanceActive ? 'Kalan Nakit: ' : 'Aylık Kalan: '}
            <strong className={isDark ? 'text-neutral-200' : 'text-neutral-800'}>
              {formatCurrency(cycleRemaining, true)}
            </strong>
          </span>
          <span className="num-tabular font-semibold">
            %{Math.round(cyclePercentSpent)} harcandı
          </span>
        </div>

        {/* Apple Sleek Progress Track */}
        <div className={`h-2.5 w-full rounded-full overflow-hidden ${
          isDark ? 'bg-neutral-800' : 'bg-neutral-100'
        }`}>
          <div
            className={`h-full rounded-full transition-all duration-500 ease-out ${
              cyclePercentSpent > 90
                ? 'bg-rose-500'
                : cyclePercentSpent > 70
                  ? 'bg-amber-500'
                  : isDark
                    ? 'bg-emerald-400'
                    : 'bg-emerald-500'
            }`}
            style={{ width: `${Math.min(100, Math.max(0, cyclePercentSpent))}%` }}
          />
        </div>

        {/* Sub-Info Row */}
        <div className={`flex items-center justify-between text-[11px] pt-1 ${
          isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          <span>
            Günlük Hak: <strong className={isDark ? 'text-neutral-300' : 'text-neutral-700'}>{formatCurrency(dailyAllowance, true)}</strong>
          </span>
          <span>
            {isBalanceActive ? (
              `20 Kasım'a ${daysLeftInPeriod} gün kaldı`
            ) : (
              `${cycle.startLabel} – ${cycle.endLabel} (${cycle.remainingDays} gün)`
            )}
          </span>
        </div>
      </div>
    </section>
  );
}
