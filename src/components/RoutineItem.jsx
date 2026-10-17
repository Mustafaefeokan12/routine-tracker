import React, { useState } from 'react';
import {
  Check,
  Star,
  Trash2,
  Pencil,
  Clock,
  Plus,
  Minus,
  ChevronDown,
  ChevronUp,
  Link2,
  Snowflake,
  ShieldAlert
} from 'lucide-react';

const CATEGORY_MAP = {
  study: { label: 'Akademi', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  engineering: { label: 'Mühendislik', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  fitness: { label: 'Fitness', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  health: { label: 'Sağlık', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  language: { label: 'Almanca', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  mind: { label: 'Zihin', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' },
  life: { label: 'Yaşam', color: 'text-neutral-300 bg-neutral-900 border-[#262832]' }
};

const TIME_MAP = {
  morning: 'Sabah',
  afternoon: 'Öğle',
  evening: 'Akşam',
  night: 'Gece',
  anytime: 'Gün Boyu'
};

const getQuantityStep = (unit, target) => {
  if (!unit) return 1;
  const u = unit.toLowerCase();
  if (u === 'l' || u === 'litre' || u === 'lt') return 0.5;
  if (u === 'sayfa' || u === 'p') return 5;
  if (u === 'adım' || u === 'adim') return 500;
  if (u === 'dk' || u === 'dakika') return 5;
  if (target >= 100) return 10;
  return 1;
};

export default function RoutineItem({
  routine,
  isCompleted,
  currentQuantity = 0,
  onToggle,
  onDelete,
  onEdit,
  onUpdateQuantity,
  onToggleMit,
  onToggleFreeze,
  onToggleSubtask
}) {
  const [subtasksOpen, setSubtasksOpen] = useState(false);

  const cat = CATEGORY_MAP[routine.category] || {
    label: 'Genel',
    color: 'text-neutral-400 bg-[#17181d] border-[#262832]'
  };

  const isQuantity = routine.type === 'quantity' || (routine.targetQuantity && routine.unit);
  const targetQty = Number(routine.targetQuantity) || 1;
  const step = getQuantityStep(routine.unit, targetQty);
  const qtyPercentage = Math.min(Math.round(((Number(currentQuantity) || 0) / targetQty) * 100), 100);

  const subtasks = routine.subtasks || [];
  const completedSubtasksCount = subtasks.filter((s) => s.done).length;

  const handleToggle = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(isCompleted ? 15 : [20, 30, 20]);
    }
    onToggle(routine);
  };

  const handleQuantityDelta = (delta, e) => {
    e.stopPropagation();
    const curr = Number(currentQuantity) || 0;
    const nextVal = Math.max(0, Math.round((curr + delta) * 100) / 100);

    if (onUpdateQuantity) {
      onUpdateQuantity(routine, nextVal);
    }

    // Auto-completion and un-completion handled cleanly in onUpdateQuantity (App.jsx) without resetting progress to 0.
    // Redundant call removed: if (nextVal >= targetQty && !isCompleted) { handleToggle(); }
  };

  return (
    <div
      onClick={handleToggle}
      className={`group relative flex flex-col p-3.5 rounded-2xl border transition-all duration-150 select-none cursor-pointer spring-click ${
        routine.isFrozen
          ? 'bg-[#121418] border-neutral-700/50 text-neutral-400'
          : routine.isMit && !isCompleted
          ? 'bg-[#17181f] border-neutral-700 shadow-sm'
          : routine.isNegative
          ? isCompleted
            ? 'bg-[#121317] border-neutral-800 opacity-60'
            : 'bg-[#161418] border-neutral-800'
          : isCompleted
          ? 'bg-[#111215] border-[#1d1e26] opacity-50'
          : 'bg-[#15161b] border-[#23252f] hover:border-[#343644]'
      }`}
    >
      {/* Top Main Row */}
      <div className="flex items-start gap-3 w-full">
        {/* Checkbox / Resistance Button */}
        <button
          type="button"
          aria-label={routine.isNegative ? 'Direnildi Olarak İşaretle' : 'Tamamla'}
          onClick={(e) => {
            e.stopPropagation();
            if (isQuantity && onUpdateQuantity) {
              if (!isCompleted) {
                onUpdateQuantity(routine, targetQty);
              } else {
                onUpdateQuantity(routine, 0);
              }
            } else {
              handleToggle();
            }
          }}
          className={`mt-0.5 flex-shrink-0 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
            isCompleted
              ? routine.isNegative
                ? 'bg-emerald-500 border-emerald-500 text-black shadow-sm'
                : 'bg-emerald-500 border-emerald-500 text-black shadow-sm'
              : routine.isNegative
              ? 'border-neutral-700 bg-neutral-900 text-neutral-400 hover:border-neutral-500'
              : 'border-[#363946] bg-[#1a1c22] hover:border-neutral-400 text-transparent'
          }`}
        >
          <Check className={`w-3.5 h-3.5 stroke-[3] transition-transform ${isCompleted ? 'scale-100' : 'scale-0'}`} />
        </button>

        {/* Routine Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className={`text-sm font-semibold tracking-tight transition-all break-words privacy-blur ${
                isCompleted ? 'line-through text-neutral-500' : 'text-neutral-100'
              }`}
            >
              {routine.title}
            </p>

            {/* MIT Star Badge */}
            {routine.isMit && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-neutral-800 text-amber-300 border border-neutral-700 flex items-center gap-1">
                ⭐ MIT
              </span>
            )}

            {/* 2-Minute Rule Tag */}
            {routine.isTwoMinuteRule && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-0.5">
                ⚡ 2-Dk
              </span>
            )}

            {/* Negative Habit Badge */}
            {routine.isNegative && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                <ShieldAlert className="w-3 h-3 text-neutral-400" />
                {isCompleted ? 'Direnildi ✅' : 'Direnme'}
              </span>
            )}

            {/* Routine Freeze Badge */}
            {routine.isFrozen && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center gap-1">
                <Snowflake className="w-3 h-3" /> Donduruldu
              </span>
            )}

            {!routine.isRoutine && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md bg-neutral-800 text-neutral-400 border border-neutral-700">
                To-Do
              </span>
            )}
          </div>

          {/* Habit Stacking Indicator */}
          {routine.anchorRoutineTitle && (
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-cyan-400/90 bg-cyan-950/30 border border-cyan-800/40 px-2 py-0.5 rounded-lg w-fit mt-1.5">
              <Link2 className="w-3 h-3" />
              <span>Zincir: {routine.anchorRoutineTitle} ➔ {routine.title}</span>
            </div>
          )}

          {/* Badges / Metadata row */}
          <div className="flex items-center gap-2 mt-1.5 text-xs flex-wrap">
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

            {/* Sub-Checklist Toggle Pill */}
            {subtasks.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSubtasksOpen((prev) => !prev);
                }}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-[#20222a] border border-[#2e313d] text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
              >
                <span>{completedSubtasksCount}/{subtasks.length} alt görev</span>
                {subtasksOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: MIT Star, Freeze, Score Pill & Action */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Interactive MIT Toggle Star */}
          {onToggleMit && (
            <button
              type="button"
              aria-label={routine.isMit ? "MIT'den Çıkar" : 'MIT Yap'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMit(routine);
              }}
              className={`p-1 rounded-lg border transition-all spring-click ${
                routine.isMit
                  ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                  : 'border-transparent text-neutral-600 hover:text-amber-400 hover:bg-[#20222a]'
              }`}
              title={routine.isMit ? 'Günün En Önemli Görevi (MIT)' : 'MIT Olarak İşaretle'}
            >
              <Star className={`w-3.5 h-3.5 ${routine.isMit ? 'fill-amber-400 text-amber-400' : ''}`} />
            </button>
          )}

          {/* Interactive Freeze Toggle */}
          {onToggleFreeze && (
            <button
              type="button"
              aria-label={routine.isFrozen ? 'Rutini Çöz' : 'Rutini Dondur'}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFreeze(routine);
              }}
              className={`p-1 rounded-lg border transition-all spring-click ${
                routine.isFrozen
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'border-transparent text-neutral-600 hover:text-cyan-400 hover:bg-[#20222a]'
              }`}
              title={routine.isFrozen ? 'Dondurmayı Kaldır' : 'Rutini Dondur (Muafiyet)'}
            >
              <Snowflake className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Score Pill */}
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-xl border transition-colors ${
              isCompleted
                ? 'bg-emerald-950/30 text-emerald-400/80 border-emerald-900/40'
                : 'bg-[#20222a] text-emerald-400 border-[#2e313d]'
            }`}
          >
            +{routine.weight}P
          </span>

          {/* Edit button */}
          {onEdit && (
            <button
              type="button"
              aria-label="Düzenle"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(routine);
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white active:text-white hover:bg-[#20222a] transition-colors spring-click"
              title="Görevi Düzenle"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

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
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 active:text-rose-400 hover:bg-[#20222a] transition-colors spring-click"
            title="Görevi Sil"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quantity Tracker Bar & Controls */}
      {isQuantity && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-2.5 border-t border-[#23252e] flex flex-col gap-1.5"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-semibold text-neutral-400">
              İlerleme:{' '}
              <strong className="text-white font-mono">
                {currentQuantity} / {targetQty} {routine.unit || ''}
              </strong>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={(e) => handleQuantityDelta(-step, e)}
                disabled={Number(currentQuantity) <= 0}
                className="w-6 h-6 rounded-lg bg-[#20222a] hover:bg-[#2b2e3a] disabled:opacity-30 border border-[#2e313d] flex items-center justify-center text-neutral-300 hover:text-white spring-click"
              >
                <Minus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => handleQuantityDelta(step, e)}
                className="w-6 h-6 rounded-lg bg-[#20222a] hover:bg-[#2b2e3a] border border-[#2e313d] flex items-center justify-center text-emerald-400 hover:text-emerald-300 spring-click"
              >
                <Plus className="w-3 h-3" />
              </button>
              <button
                type="button"
                onClick={(e) => handleQuantityDelta(step, e)}
                className="px-2 py-0.5 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-[10px] font-bold text-emerald-400 hover:bg-emerald-900/50 spring-click"
              >
                +{step}{routine.unit || ''}
              </button>
            </div>
          </div>

          {/* Smooth Horizontal Progress Bar */}
          <div className="w-full bg-[#121316] rounded-full h-1.5 overflow-hidden border border-[#262832]">
            <div
              style={{ width: `${qtyPercentage}%` }}
              className={`h-full rounded-full transition-all duration-300 ${
                qtyPercentage >= 100
                  ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                  : 'bg-emerald-500/80'
              }`}
            ></div>
          </div>
        </div>
      )}

      {/* Sub-Checklist Collapsible Section */}
      {subtasks.length > 0 && subtasksOpen && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="mt-3 pt-2.5 border-t border-[#23252e] space-y-2 animate-fade-in"
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Alt Adımlar ({completedSubtasksCount}/{subtasks.length})
          </span>
          <div className="space-y-1.5 pl-1">
            {subtasks.map((st) => (
              <div
                key={st.id}
                onClick={() => onToggleSubtask && onToggleSubtask(routine, st.id)}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[#20222a]/60 cursor-pointer text-xs transition-colors"
              >
                <div
                  className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                    st.done
                      ? 'bg-emerald-500 border-emerald-500 text-black'
                      : 'border-[#363946] bg-[#1a1c22]'
                  }`}
                >
                  {st.done && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className={`text-xs ${st.done ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                  {st.text}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
