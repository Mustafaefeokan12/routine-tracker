import React, { useState, useEffect } from 'react';
import { X, Plus, Star, Trash2, Check } from 'lucide-react';

export default function QuickAddModal({
  isOpen,
  onClose,
  onAddRoutine,
  onUpdateRoutine,
  editingRoutine = null,
  existingRoutines = []
}) {
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState(15);
  const [category, setCategory] = useState('study');
  const [timeOfDay, setTimeOfDay] = useState('anytime');
  const [difficulty, setDifficulty] = useState(3);
  const [isRoutine, setIsRoutine] = useState(true);

  // M3 Modular features
  const [isMit, setIsMit] = useState(false);
  const [isTwoMinuteRule, setIsTwoMinuteRule] = useState(false);
  const [isNegative, setIsNegative] = useState(false);
  const [type, setType] = useState('boolean'); // 'boolean' | 'quantity'
  const [targetQuantity, setTargetQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [anchorRoutineTitle, setAnchorRoutineTitle] = useState('');
  const [eisenhower, setEisenhower] = useState('q2');

  // Subtasks
  const [subtasks, setSubtasks] = useState([]);
  const [subtaskInput, setSubtaskInput] = useState('');

  // Prefill or reset state on open/edit
  useEffect(() => {
    if (editingRoutine) {
      setTitle(editingRoutine.title || '');
      setWeight(editingRoutine.weight || 15);
      setCategory(editingRoutine.category || 'study');
      setTimeOfDay(editingRoutine.timeOfDay || 'anytime');
      setDifficulty(editingRoutine.difficulty || 3);
      setIsRoutine(editingRoutine.isRoutine !== false);
      setIsMit(!!editingRoutine.isMit);
      setIsTwoMinuteRule(!!editingRoutine.isTwoMinuteRule);
      setIsNegative(!!editingRoutine.isNegative);
      setType(editingRoutine.type || 'boolean');
      setTargetQuantity(editingRoutine.targetQuantity ? String(editingRoutine.targetQuantity) : '');
      setUnit(editingRoutine.unit || '');
      setAnchorRoutineTitle(editingRoutine.anchorRoutineTitle || '');
      setEisenhower(editingRoutine.eisenhower || 'q2');
      setSubtasks(editingRoutine.subtasks || []);
    } else {
      setTitle('');
      setWeight(15);
      setCategory('study');
      setTimeOfDay('anytime');
      setDifficulty(3);
      setIsRoutine(true);
      setIsMit(false);
      setIsTwoMinuteRule(false);
      setIsNegative(false);
      setType('boolean');
      setTargetQuantity('');
      setUnit('');
      setAnchorRoutineTitle('');
      setEisenhower('q2');
      setSubtasks([]);
    }
  }, [editingRoutine, isOpen]);

  if (!isOpen) return null;

  const handleAddSubtask = (e) => {
    e.preventDefault();
    if (!subtaskInput.trim()) return;
    setSubtasks((prev) => [
      ...prev,
      { id: `st_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`, text: subtaskInput.trim(), done: false }
    ]);
    setSubtaskInput('');
  };

  const handleRemoveSubtask = (id) => {
    setSubtasks((prev) => prev.filter((s) => s.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const routineData = {
      title: title.trim(),
      weight: Number(weight) || 10,
      category,
      timeOfDay,
      difficulty: Number(difficulty) || 1,
      isRoutine,
      isMit,
      isTwoMinuteRule,
      isNegative,
      type,
      targetQuantity: type === 'quantity' ? (Number(targetQuantity) || 1) : null,
      unit: type === 'quantity' ? (unit.trim() || 'kez') : null,
      anchorRoutineTitle: anchorRoutineTitle.trim() || null,
      eisenhower: isMit ? 'q1' : isNegative ? 'q4' : isTwoMinuteRule ? 'q3' : eisenhower,
      subtasks: subtasks.length > 0 ? subtasks : undefined,
    };

    if (editingRoutine) {
      if (onUpdateRoutine) {
        onUpdateRoutine({
          ...editingRoutine,
          ...routineData
        });
      }
    } else {
      onAddRoutine({
        ...routineData,
        archived: false,
        order: Date.now()
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#17181d] border border-[#262832] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23252e]">
          <h3 className="text-sm font-bold text-white tracking-tight">
            {editingRoutine ? 'Rutini / Görevi Düzenle' : 'Yeni Görev / Rutin Ekle'}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#23252e] text-neutral-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Routine vs Single To-Do Switch */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121316] border border-[#262832] text-xs font-semibold">
            <button
              type="button"
              onClick={() => setIsRoutine(true)}
              className={`py-2 rounded-lg transition-all ${
                isRoutine ? 'bg-[#2e313e] text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🔄 Günlük Rutin (Tekrarlı)
            </button>
            <button
              type="button"
              onClick={() => setIsRoutine(false)}
              className={`py-2 rounded-lg transition-all ${
                !isRoutine ? 'bg-[#2e313e] text-white font-bold shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              📌 Tekil To-Do (Bugünlük)
            </button>
          </div>

          {/* Title Input */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Başlık
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Örn: 45 Dk Odaklı Mühendislik..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
          </div>

          {/* Habit Type (Standard vs Quantity Tracker) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Takip Türü
            </label>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121316] border border-[#262832] text-xs font-semibold">
              <button
                type="button"
                onClick={() => setType('boolean')}
                className={`py-1.5 rounded-lg transition-all ${
                  type === 'boolean'
                    ? 'bg-[#2e313e] text-emerald-400 font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                ✅ Standart (Tamamla)
              </button>
              <button
                type="button"
                onClick={() => setType('quantity')}
                className={`py-1.5 rounded-lg transition-all ${
                  type === 'quantity'
                    ? 'bg-[#2e313e] text-cyan-400 font-bold shadow'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                📊 Miktar Takibi (L, Sayfa, Adım)
              </button>
            </div>

            {/* Quantity Inputs */}
            {type === 'quantity' && (
              <div className="grid grid-cols-2 gap-2 mt-2 p-2.5 rounded-xl bg-[#121316] border border-[#262832]">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Hedef Miktar
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Örn: 2.5 veya 20"
                    value={targetQuantity}
                    onChange={(e) => setTargetQuantity(e.target.value)}
                    className="w-full bg-[#17181d] border border-[#2e313d] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1">
                    Birim
                  </label>
                  <input
                    type="text"
                    placeholder="Örn: L, sayfa, adım"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-[#17181d] border border-[#2e313d] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Productivity Flags: MIT, 2-Min Rule, Negative Habit */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Özel Nitelikler
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setIsMit((prev) => !prev)}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  isMit
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-sm shadow-amber-500/20'
                    : 'bg-[#121316] border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                ⭐ MIT (Öncelikli)
              </button>

              <button
                type="button"
                onClick={() => setIsTwoMinuteRule((prev) => !prev)}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  isTwoMinuteRule
                    ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-300'
                    : 'bg-[#121316] border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                ⚡ 2-Dk Kuralı
              </button>

              <button
                type="button"
                onClick={() => setIsNegative((prev) => !prev)}
                className={`py-2 px-1.5 rounded-xl border text-[11px] font-bold transition-all text-center ${
                  isNegative
                    ? 'bg-rose-950/40 border-rose-800/50 text-rose-300'
                    : 'bg-[#121316] border-[#262832] text-neutral-400 hover:text-white'
                }`}
              >
                ⛔ Direnme
              </button>
            </div>
          </div>

          {/* Score Weight Buttons */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Kazanılacak Puan: <strong className="text-emerald-400">+{weight} Puan</strong>
            </label>
            <div className="grid grid-cols-5 gap-1.5">
              {[5, 10, 15, 20, 25].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setWeight(val)}
                  className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                    weight === val
                      ? 'bg-emerald-500 border-emerald-400 text-black shadow-md shadow-emerald-500/20'
                      : 'bg-[#121316] border-[#262832] text-neutral-300 hover:border-neutral-600'
                  }`}
                >
                  +{val}P
                </button>
              ))}
            </div>
          </div>

          {/* Category & Time of Day */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Yaşam Alanı
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="study">📚 Akademi / İTÜ</option>
                <option value="engineering">⚙️ Mühendislik</option>
                <option value="fitness">🏃‍♂️ Fitness & Spor</option>
                <option value="health">💧 Sağlık</option>
                <option value="language">🇩🇪 Dil / Almanca</option>
                <option value="mind">📖 Zihin / Okuma</option>
                <option value="life">🧘 Kişisel Yaşam</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Zaman Dilimi
              </label>
              <select
                value={timeOfDay}
                onChange={(e) => setTimeOfDay(e.target.value)}
                className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="anytime">🕒 Gün Boyu</option>
                <option value="morning">🌅 Sabah</option>
                <option value="afternoon">☀️ Öğle</option>
                <option value="evening">🌙 Akşam</option>
                <option value="night">🦉 Gece</option>
              </select>
            </div>
          </div>

          {/* Habit Stacking (Anchor Routine) */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Alışkanlık Zinciri (Habit Stacking)
            </label>
            {existingRoutines.length > 0 ? (
              <select
                value={anchorRoutineTitle}
                onChange={(e) => setAnchorRoutineTitle(e.target.value)}
                className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="">Bağlantı Yok (Bağımsız)</option>
                {existingRoutines.map((r) => (
                  <option key={r.id} value={r.title}>
                    Bağlanacak Öncül: {r.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                placeholder="Örn: Sabah kahvesi içtikten sonra..."
                value={anchorRoutineTitle}
                onChange={(e) => setAnchorRoutineTitle(e.target.value)}
                className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            )}
          </div>

          {/* Eisenhower Matrix Quadrant Selector */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Eisenhower Öncelik Kadranı
            </label>
            <select
              value={eisenhower}
              onChange={(e) => setEisenhower(e.target.value)}
              className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
            >
              <option value="q1">🔥 1. Kadran: Acil & Önemli (Do / Hemen Yap)</option>
              <option value="q2">🎯 2. Kadran: Önemli & Acil Değil (Schedule / Planla)</option>
              <option value="q3">⚡ 3. Kadran: Acil & Hızlı (Delegate / 2-Dk)</option>
              <option value="q4">⛔ 4. Kadran: Düşük Öncelik (Eliminate / Azalt)</option>
            </select>
          </div>

          {/* Sub-Checklist Builder */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Alt Görevler ({subtasks.length})
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Alt adım ekle (Örn: Isınma, Konu tekrarı...)"
                value={subtaskInput}
                onChange={(e) => setSubtaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask(e);
                  }
                }}
                className="flex-1 bg-[#121316] border border-[#262832] rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
              <button
                type="button"
                onClick={handleAddSubtask}
                className="px-3 py-1.5 rounded-xl bg-[#23252e] hover:bg-[#2e313d] text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Ekle
              </button>
            </div>

            {subtasks.length > 0 && (
              <div className="mt-2 space-y-1 max-h-28 overflow-y-auto no-scrollbar">
                {subtasks.map((st) => (
                  <div
                    key={st.id}
                    className="flex items-center justify-between p-1.5 rounded-lg bg-[#121316] border border-[#262832] text-xs text-neutral-300"
                  >
                    <span>• {st.text}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSubtask(st.id)}
                      className="text-neutral-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Difficulty Rating */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
              Zorluk Seviyesi
            </label>
            <div className="flex items-center gap-1.5 bg-[#121316] border border-[#262832] rounded-xl p-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setDifficulty(star)}
                  className="p-1 hover:scale-110 transition-transform"
                >
                  <Star
                    className={`w-5 h-5 ${
                      star <= difficulty
                        ? 'fill-amber-400 text-amber-400'
                        : 'text-neutral-700'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!title.trim()}
            className="w-full py-3 rounded-xl bg-white hover:bg-neutral-200 disabled:opacity-40 text-black text-sm font-bold flex items-center justify-center gap-2 transition-all spring-click mt-2 shadow-lg"
          >
            {editingRoutine ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" /> Değişiklikleri Kaydet
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 stroke-[3]" /> Listeye Ekle
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
