import React, { useState } from 'react';
import { Trash2, Clock, Calendar } from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/budget';
import { triggerHaptic } from '../utils/haptics';

export default function ExpenseList({
  expenses = [],
  onDeleteExpense,
  todayStr,
  isDark
}) {
  const [viewFilter, setViewFilter] = useState('today'); // 'today' | 'all'

  const filteredExpenses = expenses.filter((exp) => {
    if (viewFilter === 'today') {
      return exp.date === todayStr;
    }
    return true; // all
  });

  const handleDelete = (id, e) => {
    e.stopPropagation();
    triggerHaptic('warning');
    onDeleteExpense(id);
  };

  return (
    <div className="space-y-3 pb-24">
      {/* Section Header & View Switcher */}
      <div className="flex items-center justify-between px-1">
        <h2 className={`text-sm font-bold uppercase tracking-wider ${
          isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          {viewFilter === 'today' ? 'Bugünün Harcamaları' : 'Tüm Harcamalar'}
        </h2>

        <div className={`flex items-center p-0.5 rounded-xl border ${
          isDark ? 'bg-neutral-900 border-neutral-800' : 'bg-neutral-100 border-neutral-200'
        }`}>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewFilter('today');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold spring-tap transition-all ${
              viewFilter === 'today'
                ? isDark
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'bg-white text-neutral-900 shadow-xs'
                : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Bugün
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('selection');
              setViewFilter('all');
            }}
            className={`px-3 py-1 rounded-lg text-xs font-semibold spring-tap transition-all ${
              viewFilter === 'all'
                ? isDark
                  ? 'bg-neutral-800 text-white shadow-xs'
                  : 'bg-white text-neutral-900 shadow-xs'
                : isDark
                  ? 'text-neutral-400 hover:text-white'
                  : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            Tümü
          </button>
        </div>
      </div>

      {/* List Container */}
      {filteredExpenses.length === 0 ? (
        <div className={`p-8 rounded-3xl text-center border ${
          isDark ? 'bg-neutral-900/50 border-neutral-800/80 text-neutral-400' : 'bg-white border-neutral-200 text-neutral-500 shadow-xs'
        }`}>
          <div className="text-3xl mb-2">✨</div>
          <p className="text-sm font-semibold">
            {viewFilter === 'today' ? 'Bugün henüz harcama yok.' : 'Henüz kayıtlı harcama bulunmuyor.'}
          </p>
          <p className="text-xs opacity-75 mt-0.5">
            {viewFilter === 'today' ? 'Temiz bir bütçe günü!' : 'Yukarıdaki butonlardan hemen ekleyebilirsiniz.'}
          </p>
        </div>
      ) : (
        <div className={`rounded-3xl overflow-hidden border divide-y ${
          isDark
            ? 'bg-neutral-900/90 border-neutral-800/80 divide-neutral-800/60'
            : 'bg-white border-neutral-200/80 divide-neutral-100 shadow-xs'
        }`}>
          {filteredExpenses.map((exp) => (
            <div
              key={exp.id}
              className={`p-3.5 sm:p-4 flex items-center justify-between group transition-colors ${
                isDark ? 'hover:bg-neutral-800/50' : 'hover:bg-neutral-50'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                  isDark ? 'bg-neutral-800' : 'bg-neutral-100'
                }`}>
                  {exp.categoryIcon || '📦'}
                </div>

                <div className="min-w-0">
                  <h4 className={`text-sm font-bold truncate tracking-tight ${
                    isDark ? 'text-white' : 'text-neutral-900'
                  }`}>
                    {exp.title}
                  </h4>
                  <div className={`flex items-center gap-2 text-[11px] font-medium mt-0.5 ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    <span>{exp.category}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 opacity-60" />
                      {formatTime(exp.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 ml-3">
                <span className="text-sm font-extrabold num-tabular tracking-tight text-rose-500">
                  -{formatCurrency(exp.amount, true)}
                </span>

                <button
                  type="button"
                  onClick={(e) => handleDelete(exp.id, e)}
                  className={`p-2 rounded-xl spring-tap text-neutral-400 hover:text-rose-500 transition-colors ${
                    isDark ? 'hover:bg-neutral-800' : 'hover:bg-neutral-100'
                  }`}
                  title="Sil"
                  aria-label="Sil"
                >
                  <Trash2 className="w-4 h-4 stroke-[2]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
