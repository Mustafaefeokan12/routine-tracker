import React, { useState } from 'react';
import RoutineItem from './RoutineItem';
import { CheckCircle2, Plus, Sparkles, Filter, Clock, Tag } from 'lucide-react';

export default function RoutineList({
  routines,
  completedMap,
  onToggleRoutine,
  onDeleteRoutine,
  onOpenAddModal
}) {
  const [filterMode, setFilterMode] = useState('time'); // 'time' | 'category'
  const [activeTime, setActiveTime] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredRoutines = routines.filter((r) => {
    if (filterMode === 'time') {
      if (activeTime === 'all') return true;
      if (activeTime === 'todo') return !r.isRoutine;
      return r.timeOfDay === activeTime;
    } else {
      if (activeCategory === 'all') return true;
      return r.category === activeCategory;
    }
  });

  const uncompleted = filteredRoutines.filter((r) => !completedMap[r.id]);
  const completed = filteredRoutines.filter((r) => !!completedMap[r.id]);

  const totalCompleted = routines.filter((r) => !!completedMap[r.id]).length;
  const isAllDone = routines.length > 0 && totalCompleted === routines.length;

  return (
    <div className="space-y-4 pb-24">
      {/* Dual Filter Header Switcher */}
      <div className="flex items-center justify-between pb-1 border-b border-[#23252e]">
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#17181d] border border-[#262832] text-xs font-semibold">
          <button
            onClick={() => setFilterMode('time')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              filterMode === 'time'
                ? 'bg-[#2b2e3b] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Zaman Dilimi
          </button>
          <button
            onClick={() => setFilterMode('category')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              filterMode === 'category'
                ? 'bg-[#2b2e3b] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tag className="w-3 h-3" /> Kategori
          </button>
        </div>

        <span className="text-[11px] text-neutral-400 font-medium">
          {filteredRoutines.length} Görev
        </span>
      </div>

      {/* Filter Options Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {filterMode === 'time' ? (
          [
            { id: 'all', label: 'Tümü' },
            { id: 'morning', label: '🌅 Sabah' },
            { id: 'afternoon', label: '☀️ Öğle/Kampüs' },
            { id: 'evening', label: '🌙 Akşam' },
            { id: 'todo', label: '📌 Tekil To-Do' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTime(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all spring-click ${
                activeTime === tab.id
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#17181d] border border-[#262832] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))
        ) : (
          [
            { id: 'all', label: 'Tümü' },
            { id: 'study', label: '📚 Akademi' },
            { id: 'fitness', label: '🏃‍♂️ Spor' },
            { id: 'mind', label: '📖 Zihin' },
            { id: 'health', label: '💧 Sağlık' },
            { id: 'life', label: '🧘 Yaşam' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all spring-click ${
                activeCategory === tab.id
                  ? 'bg-white text-black font-bold shadow-sm'
                  : 'bg-[#17181d] border border-[#262832] text-neutral-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))
        )}
      </div>

      {/* Routine Status Summary */}
      <div className="flex items-center justify-between text-xs px-1 text-neutral-400">
        <span>
          Tamamlanan: <strong className="text-white">{totalCompleted}</strong> / {routines.length}
        </span>
        {isAllDone && (
          <span className="text-emerald-400 font-bold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" /> Tüm liste tamamlandı!
          </span>
        )}
      </div>

      {/* Active / Uncompleted Routines */}
      <div className="space-y-2.5">
        {uncompleted.map((r) => (
          <RoutineItem
            key={r.id}
            routine={r}
            isCompleted={false}
            onToggle={onToggleRoutine}
            onDelete={onDeleteRoutine}
          />
        ))}
      </div>

      {/* Empty State */}
      {uncompleted.length === 0 && completed.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl border border-dashed border-[#2b2e3a] bg-[#14151a]">
          <p className="text-neutral-400 text-sm font-medium">Bu filtrede gösterilecek görev yok.</p>
          <button
            onClick={onOpenAddModal}
            className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#23252e] hover:bg-[#2e313d] text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" /> Yeni Rutin / Görev Ekle
          </button>
        </div>
      )}

      {/* Completed Section Divider */}
      {completed.length > 0 && (
        <div className="pt-3">
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Tamamlananlar ({completed.length})
            </span>
            <div className="flex-1 h-px bg-[#23252e]"></div>
          </div>

          <div className="space-y-2.5">
            {completed.map((r) => (
              <RoutineItem
                key={r.id}
                routine={r}
                isCompleted={true}
                onToggle={onToggleRoutine}
                onDelete={onDeleteRoutine}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
