import React from 'react';
import { Check, Star, Trash2, Clock } from 'lucide-react';

const CATEGORY_MAP = {
  health: { label: 'Sağlık', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800/40' },
  study: { label: 'Akademi', color: 'text-indigo-400 bg-indigo-950/40 border-indigo-800/40' },
  fitness: { label: 'Fitness', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' },
  mind: { label: 'Zihin', color: 'text-amber-400 bg-amber-950/40 border-amber-800/40' },
  life: { label: 'Yaşam', color: 'text-rose-400 bg-rose-950/40 border-rose-800/40' },
};

const TIME_MAP = {
  morning: 'Sabah',
  afternoon: 'Öğle',
  evening: 'Akşam',
  anytime: 'Gün Boyu'
};

export default function RoutineItem({
  routine,
  isCompleted,
  onToggle,
  onDelete
}) {
  const cat = CATEGORY_MAP[routine.category] || { label: 'Genel', color: 'text-neutral-400 bg-[#17181d] border-[#262832]' };

  const handleToggle = () => {
    // Apple haptic feedback
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(isCompleted ? 15 : [20, 30, 20]);
    }
    onToggle(routine);
  };

  return (
    <div
      onClick={handleToggle}
      className={`group relative flex items-start gap-3 p-3.5 rounded-2xl border transition-all duration-200 select-none cursor-pointer spring-click ${
        isCompleted
          ? 'bg-[#14151a]/60 border-[#20222a] opacity-55'
          : 'bg-[#17181d] border-[#262832] hover:border-[#383b49] shadow-sm'
      }`}
    >
      {/* Custom Animated Checkbox */}
      <button
        type="button"
        aria-label="Tamamla"
        onClick={(e) => {
          e.stopPropagation();
          handleToggle();
        }}
        className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
          isCompleted
            ? 'bg-emerald-500 border-emerald-500 text-black shadow-md shadow-emerald-500/20'
            : 'border-[#363946] bg-[#1a1c22] hover:border-neutral-400 text-transparent'
        }`}
      >
        <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}`} />
      </button>

      {/* Main Routine Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-semibold tracking-tight transition-all truncate ${
              isCompleted ? 'line-through text-neutral-500' : 'text-neutral-100'
            }`}
          >
            {routine.title}
          </p>

          {!routine.isRoutine && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#23252e] text-neutral-400 border border-[#2e313d]">
              To-Do
            </span>
          )}
        </div>

        {/* Badges / Metadata row */}
        <div className="flex items-center gap-2 mt-1.5 text-xs">
          {/* Category Pill */}
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cat.color}`}>
            {cat.label}
          </span>

          {/* Time Block */}
          {routine.timeOfDay && (
            <span className="text-[10px] font-medium text-neutral-400 flex items-center gap-1">
              <Clock className="w-2.5 h-2.5" />
              {TIME_MAP[routine.timeOfDay] || routine.timeOfDay}
            </span>
          )}

          {/* Difficulty Stars */}
          {routine.difficulty > 0 && (
            <div className="flex items-center text-amber-400/80">
              {[...Array(routine.difficulty)].map((_, i) => (
                <Star key={i} className="w-2.5 h-2.5 fill-amber-400/80" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Side: Score Pill & Action */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span
          className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-colors ${
            isCompleted
              ? 'bg-emerald-950/30 text-emerald-400/80 border-emerald-900/40'
              : 'bg-[#20222a] text-emerald-400 border-[#2e313d]'
          }`}
        >
          +{routine.weight}P
        </span>

        {/* Delete button */}
        <button
          type="button"
          aria-label="Sil"
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`"${routine.title}" görevini silmek istediğinize emin misiniz?`)) {
              onDelete(routine.id);
            }
          }}
          className="p-1 rounded-lg text-neutral-600 hover:text-rose-400 hover:bg-[#20222a] transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
