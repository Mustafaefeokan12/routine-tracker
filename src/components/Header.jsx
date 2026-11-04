import React from 'react';
import { Calendar, PieChart, Settings } from 'lucide-react';
import { triggerHaptic } from '../utils/haptics';
import { getLogicalDate } from '../utils/budget';

export default function Header({ onOpenHistory, onOpenAnalytics, onOpenSettings, isDark }) {
  // Use 06:00 AM logical date
  const logicalToday = getLogicalDate(new Date(), 6);
  const dateFormatted = logicalToday.toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  return (
    <header className="flex items-center justify-between pt-2 pb-4 px-1">
      <div>
        <p className={`text-xs font-semibold uppercase tracking-wider ${
          isDark ? 'text-neutral-400' : 'text-neutral-500'
        }`}>
          {dateFormatted}
        </p>
        <h1 className={`text-2xl font-bold tracking-tight ${
          isDark ? 'text-white' : 'text-neutral-900'
        }`}>
          Budget
        </h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Calendar / Past Days History */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenHistory();
          }}
          className={`p-2.5 rounded-full spring-tap ${
            isDark
              ? 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              : 'bg-white text-neutral-600 hover:text-neutral-900 shadow-sm border border-neutral-200/70'
          }`}
          title="Günlük Harcama Geçmişi"
          aria-label="Günlük Harcama Geçmişi"
        >
          <Calendar className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Analytics Breakdown */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenAnalytics();
          }}
          className={`p-2.5 rounded-full spring-tap ${
            isDark
              ? 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              : 'bg-white text-neutral-600 hover:text-neutral-900 shadow-sm border border-neutral-200/70'
          }`}
          title="Kategori Analizi"
          aria-label="Kategori Analizi"
        >
          <PieChart className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Settings */}
        <button
          type="button"
          onClick={() => {
            triggerHaptic('light');
            onOpenSettings();
          }}
          className={`p-2.5 rounded-full spring-tap ${
            isDark
              ? 'bg-neutral-900 text-neutral-300 hover:text-white border border-neutral-800'
              : 'bg-white text-neutral-600 hover:text-neutral-900 shadow-sm border border-neutral-200/70'
          }`}
          title="Ayarlar"
          aria-label="Ayarlar"
        >
          <Settings className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>
    </header>
  );
}
