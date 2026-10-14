import React, { useState } from 'react';
import RoutineItem from './RoutineItem';
import { Plus, Sparkles, Clock, Tag, LayoutGrid, List } from 'lucide-react';

export default function RoutineList({
  routines,
  completedMap,
  quantityMap = {},
  onToggleRoutine,
  onDeleteRoutine,
  onOpenAddModal,
  onUpdateQuantity,
  onToggleMit,
  onToggleFreeze,
  onToggleSubtask
}) {
  const [filterMode, setFilterMode] = useState('time'); // 'time' | 'category'
  const [activeTime, setActiveTime] = useState('all');
  const [activeCategory, setActiveCategory] = useState('all');
  const [isEisenhowerView, setIsEisenhowerView] = useState(false);

  // Time filter logic
  const filteredRoutines = routines.filter((r) => {
    if (filterMode === 'time') {
      if (activeTime === 'all') return true;
      if (activeTime === 'todo') return !r.isRoutine;
      return r.timeOfDay === activeTime;
    } else {
      if (activeCategory === 'all') return true;
      if (activeCategory === 'study') return r.category === 'study';
      if (activeCategory === 'engineering') return r.category === 'engineering' || (r.title && r.title.toLowerCase().includes('mühendislik'));
      if (activeCategory === 'fitness') return r.category === 'fitness';
      if (activeCategory === 'health') return r.category === 'health';
      if (activeCategory === 'language') return r.category === 'language' || (r.title && (r.title.toLowerCase().includes('almanca') || r.title.toLowerCase().includes('dil')));
      if (activeCategory === 'mind') return r.category === 'mind';
      if (activeCategory === 'life') return r.category === 'life';
      return r.category === activeCategory;
    }
  });

  // Prioritize MIT tasks at the top of uncompleted routines
  const uncompleted = filteredRoutines
    .filter((r) => !completedMap[r.id])
    .sort((a, b) => {
      if (a.isMit && !b.isMit) return -1;
      if (!a.isMit && b.isMit) return 1;
      return (a.order || 0) - (b.order || 0);
    });

  const completed = filteredRoutines.filter((r) => !!completedMap[r.id]);

  const totalCompleted = routines.filter((r) => !!completedMap[r.id]).length;
  const isAllDone = routines.length > 0 && totalCompleted === routines.length;

  // Eisenhower Quadrant Grouping
  const q1Tasks = routines.filter((r) => r.isMit || r.eisenhower === 'q1');
  const q2Tasks = routines.filter(
    (r) =>
      !r.isMit &&
      !r.isTwoMinuteRule &&
      !r.isNegative &&
      (r.eisenhower === 'q2' || r.difficulty >= 3 || (!r.eisenhower && r.isRoutine))
  );
  const q3Tasks = routines.filter(
    (r) => !r.isMit && (r.isTwoMinuteRule || r.eisenhower === 'q3')
  );
  const q4Tasks = routines.filter(
    (r) =>
      !r.isMit &&
      (r.isNegative || r.eisenhower === 'q4' || (!r.isRoutine && !r.isTwoMinuteRule))
  );

  return (
    <div className="space-y-4 pb-24">
      {/* Dual Filter Header Switcher & Eisenhower View Toggle */}
      <div className="flex items-center justify-between pb-1 border-b border-[#23252e]">
        <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[#17181d] border border-[#262832] text-xs font-semibold">
          <button
            onClick={() => {
              setFilterMode('time');
              setIsEisenhowerView(false);
            }}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              filterMode === 'time' && !isEisenhowerView
                ? 'bg-[#2b2e3b] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Clock className="w-3 h-3" /> Zaman Dilimi
          </button>
          <button
            onClick={() => {
              setFilterMode('category');
              setIsEisenhowerView(false);
            }}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-all ${
              filterMode === 'category' && !isEisenhowerView
                ? 'bg-[#2b2e3b] text-white shadow'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Tag className="w-3 h-3" /> Yaşam Alanı
          </button>
        </div>

        {/* Eisenhower Matrix Toggle Button */}
        <button
          onClick={() => setIsEisenhowerView((prev) => !prev)}
          aria-label="Eisenhower Matrisi Görünümü"
          className={`px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-bold transition-all spring-click ${
            isEisenhowerView
              ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm shadow-amber-500/20'
              : 'bg-[#17181d] border-[#262832] text-neutral-400 hover:text-white'
          }`}
          title="Eisenhower 4-Kadran Matrisi"
        >
          {isEisenhowerView ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
          <span>{isEisenhowerView ? 'Liste' : 'Eisenhower'}</span>
        </button>
      </div>

      {/* Standard List View Filter Pills (Hidden when Eisenhower is active) */}
      {!isEisenhowerView && (
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {filterMode === 'time' ? (
            [
              { id: 'all', label: 'Tümü' },
              { id: 'morning', label: '🌅 Sabah' },
              { id: 'afternoon', label: '☀️ Öğle / Kampüs' },
              { id: 'evening', label: '🌙 Akşam' },
              { id: 'night', label: '🦉 Gece' },
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
              { id: 'study', label: '📚 Akademi / İTÜ' },
              { id: 'engineering', label: '⚙️ Mühendislik' },
              { id: 'fitness', label: '🏃‍♂️ Spor' },
              { id: 'health', label: '💧 Sağlık' },
              { id: 'language', label: '🇩🇪 Almanca' },
              { id: 'mind', label: '📖 Zihin' },
              { id: 'life', label: '🧘 Kişisel' }
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
      )}

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

      {/* Conditional Rendering: Quick Eisenhower 4-Quadrant View vs Standard List */}
      {isEisenhowerView ? (
        <div className="space-y-4 animate-fade-in">
          {/* Q1: Acil & Önemli (Do / Hemen Yap) */}
          <div className="p-3.5 rounded-2xl bg-[#17181d] border border-rose-900/40 shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#23252e]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-rose-400">🔥 1. Acil & Önemli</span>
                <span className="text-[10px] text-neutral-400">(Do / Hemen Yap)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950/60 text-rose-300 border border-rose-800/40">
                {q1Tasks.length} Görev
              </span>
            </div>
            <div className="space-y-2">
              {q1Tasks.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2 italic text-center">Bu kadranda görev yok.</p>
              ) : (
                q1Tasks.map((r) => (
                  <RoutineItem
                    key={r.id}
                    routine={r}
                    isCompleted={!!completedMap[r.id]}
                    currentQuantity={quantityMap[r.id] || 0}
                    onToggle={onToggleRoutine}
                    onDelete={onDeleteRoutine}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleMit={onToggleMit}
                    onToggleFreeze={onToggleFreeze}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Q2: Önemli & Acil Değil (Schedule / Planla) */}
          <div className="p-3.5 rounded-2xl bg-[#17181d] border border-emerald-900/40 shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#23252e]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-400">🎯 2. Önemli & Acil Değil</span>
                <span className="text-[10px] text-neutral-400">(Schedule / Planla)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800/40">
                {q2Tasks.length} Görev
              </span>
            </div>
            <div className="space-y-2">
              {q2Tasks.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2 italic text-center">Bu kadranda görev yok.</p>
              ) : (
                q2Tasks.map((r) => (
                  <RoutineItem
                    key={r.id}
                    routine={r}
                    isCompleted={!!completedMap[r.id]}
                    currentQuantity={quantityMap[r.id] || 0}
                    onToggle={onToggleRoutine}
                    onDelete={onDeleteRoutine}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleMit={onToggleMit}
                    onToggleFreeze={onToggleFreeze}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Q3: Acil & Hızlı (Delegate / Hızlı Bitir) */}
          <div className="p-3.5 rounded-2xl bg-[#17181d] border border-amber-900/40 shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#23252e]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400">⚡ 3. Acil & Hızlı</span>
                <span className="text-[10px] text-neutral-400">(Delegate / 2-Dk)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/40">
                {q3Tasks.length} Görev
              </span>
            </div>
            <div className="space-y-2">
              {q3Tasks.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2 italic text-center">Bu kadranda görev yok.</p>
              ) : (
                q3Tasks.map((r) => (
                  <RoutineItem
                    key={r.id}
                    routine={r}
                    isCompleted={!!completedMap[r.id]}
                    currentQuantity={quantityMap[r.id] || 0}
                    onToggle={onToggleRoutine}
                    onDelete={onDeleteRoutine}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleMit={onToggleMit}
                    onToggleFreeze={onToggleFreeze}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>
          </div>

          {/* Q4: Ne Acil Ne Önemli (Eliminate / Azalt / Diren) */}
          <div className="p-3.5 rounded-2xl bg-[#17181d] border border-neutral-800 shadow-sm">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#23252e]">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-neutral-400">⛔ 4. Ne Acil Ne Önemli</span>
                <span className="text-[10px] text-neutral-500">(Eliminate / Ele)</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#23252e] text-neutral-300 border border-[#2e313d]">
                {q4Tasks.length} Görev
              </span>
            </div>
            <div className="space-y-2">
              {q4Tasks.length === 0 ? (
                <p className="text-xs text-neutral-500 py-2 italic text-center">Bu kadranda görev yok.</p>
              ) : (
                q4Tasks.map((r) => (
                  <RoutineItem
                    key={r.id}
                    routine={r}
                    isCompleted={!!completedMap[r.id]}
                    currentQuantity={quantityMap[r.id] || 0}
                    onToggle={onToggleRoutine}
                    onDelete={onDeleteRoutine}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleMit={onToggleMit}
                    onToggleFreeze={onToggleFreeze}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Filtered List View */
        <>
          {/* Active / Uncompleted Routines (MIT first!) */}
          <div className="space-y-2.5">
            {uncompleted.map((r) => (
              <RoutineItem
                key={r.id}
                routine={r}
                isCompleted={false}
                currentQuantity={quantityMap[r.id] || 0}
                onToggle={onToggleRoutine}
                onDelete={onDeleteRoutine}
                onUpdateQuantity={onUpdateQuantity}
                onToggleMit={onToggleMit}
                onToggleFreeze={onToggleFreeze}
                onToggleSubtask={onToggleSubtask}
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
                    currentQuantity={quantityMap[r.id] || 0}
                    onToggle={onToggleRoutine}
                    onDelete={onDeleteRoutine}
                    onUpdateQuantity={onUpdateQuantity}
                    onToggleMit={onToggleMit}
                    onToggleFreeze={onToggleFreeze}
                    onToggleSubtask={onToggleSubtask}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
