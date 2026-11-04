import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/budget';
import { triggerHaptic } from '../utils/haptics';

export default function HistoryModal({ isOpen, onClose, history = [], isDark }) {
  const [expandedDate, setExpandedDate] = useState(null);

  if (!isOpen) return null;

  const toggleExpand = (dateStr) => {
    triggerHaptic('selection');
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-3xl p-6 transition-all max-h-[85vh] flex flex-col shadow-2xl border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
              <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Günlük Geçmiş</h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                Hangi gün ne kadar harcandı (06:00 sıfırlamalı)
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

        {/* Scrollable Day List */}
        <div className="overflow-y-auto no-scrollbar space-y-2.5 flex-1 pr-0.5">
          {history.length === 0 ? (
            <p className={`text-xs text-center py-8 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
              Henüz geçmiş kayıt bulunmuyor.
            </p>
          ) : (
            history.map((day) => {
              const isExpanded = expandedDate === day.dateStr;

              return (
                <div
                  key={day.dateStr}
                  className={`rounded-2xl border transition-all overflow-hidden ${
                    isDark
                      ? 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'
                      : 'bg-neutral-50 border-neutral-200/80 hover:border-neutral-300'
                  }`}
                >
                {/* Day Header Row */}
                <button
                  type="button"
                  onClick={() => toggleExpand(day.dateStr)}
                  className="w-full p-3.5 flex items-center justify-between text-left spring-tap"
                >
                  <div className="min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        day.relativeLabel === 'Bugün'
                          ? 'text-cyan-500'
                          : isDark ? 'text-neutral-300' : 'text-neutral-700'
                      }`}>
                        {day.relativeLabel}
                      </span>
                      <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                        {day.fullDateLabel}
                      </span>
                    </div>

                    <div className="text-base font-extrabold num-tabular tracking-tight mt-0.5">
                      {formatCurrency(day.totalSpent, true)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold num-tabular flex items-center gap-1 ${
                        day.isSurplus
                          ? isDark
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isDark
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {day.isSurplus ? '+' : ''}
                      {formatCurrency(day.net, true)}
                    </span>

                    {day.hasExpenses && (
                      <span className={`p-1 rounded-lg ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    )}
                  </div>
                </button>

                {/* Expanded Item Details */}
                {isExpanded && day.hasExpenses && (
                  <div className={`px-3.5 pb-3.5 pt-1 border-t space-y-1.5 ${
                    isDark ? 'border-neutral-800/80 bg-neutral-900/40' : 'border-neutral-200/60 bg-white/60'
                  }`}>
                    {day.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between py-1 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                          <span>{item.categoryIcon || '📦'}</span>
                          <span className="font-semibold truncate">{item.title}</span>
                          <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                            {formatTime(item.timestamp)}
                          </span>
                        </div>
                        <span className="font-bold num-tabular text-rose-500 shrink-0">
                          -{formatCurrency(item.amount, true)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}
