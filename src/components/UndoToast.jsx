import React, { useEffect, useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import { triggerHaptic, soundEngine } from '../utils/haptics';
import { formatCurrency } from '../utils/budget';

export default function UndoToast({ lastExpense, onUndo, onDismiss, isDark }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!lastExpense) return;

    setProgress(100);
    const duration = 4000;
    const intervalTime = 40;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= step) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [lastExpense, onDismiss]);

  if (!lastExpense) return null;

  const handleUndo = () => {
    triggerHaptic('success');
    soundEngine.playSuccess();
    onUndo(lastExpense.id);
  };

  return (
    <aside
      aria-label="Bildirim"
      className="fixed bottom-6 left-4 right-4 z-40 max-w-md mx-auto animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <div
        className={`rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-3 border overflow-hidden relative ${
          isDark
            ? 'bg-neutral-900/95 border-neutral-700/80 text-white backdrop-blur-xl'
            : 'bg-white/95 border-neutral-200 text-neutral-900 shadow-xl backdrop-blur-xl'
        }`}
      >
        {/* Subtle timer progress bar on bottom */}
        <div
          className="absolute bottom-0 left-0 h-0.5 bg-cyan-500 transition-all ease-linear"
          style={{ width: `${progress}%` }}
        />

        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xl">{lastExpense.categoryIcon || '✅'}</span>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">
              {lastExpense.title}
            </p>
            <p className="text-[11px] font-semibold text-rose-500 num-tabular">
              -{formatCurrency(lastExpense.amount, true)} eklendi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleUndo}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold spring-tap flex items-center gap-1.5 transition-all ${
              isDark
                ? 'bg-neutral-800 hover:bg-neutral-700 text-cyan-400 border border-neutral-700'
                : 'bg-neutral-100 hover:bg-neutral-200 text-cyan-700 border border-neutral-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Geri Al</span>
          </button>

          <button
            type="button"
            onClick={onDismiss}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-500"
            aria-label="Kapat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
