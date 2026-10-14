import React, { useState } from 'react';
import { X, Plus, Star } from 'lucide-react';

export default function QuickAddModal({ isOpen, onClose, onAddRoutine }) {
  const [title, setTitle] = useState('');
  const [weight, setWeight] = useState(15);
  const [category, setCategory] = useState('study');
  const [timeOfDay, setTimeOfDay] = useState('anytime');
  const [difficulty, setDifficulty] = useState(3);
  const [isRoutine, setIsRoutine] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddRoutine({
      title: title.trim(),
      weight: Number(weight) || 10,
      category,
      timeOfDay,
      difficulty: Number(difficulty) || 1,
      isRoutine,
      archived: false,
      order: Date.now()
    });

    setTitle('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-[#17181d] border border-[#262832] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#23252e]">
          <h3 className="text-sm font-bold text-white tracking-tight">
            Yeni Görev / Rutin Ekle
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
              placeholder="Örn: 30 Dk Algoritma / Kodlama..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 transition-colors"
            />
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
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#121316] border border-[#262832] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-neutral-500"
              >
                <option value="study">📚 Akademi</option>
                <option value="fitness">🏃‍♂️ Fitness</option>
                <option value="health">💧 Sağlık</option>
                <option value="mind">📖 Zihin</option>
                <option value="life">🧘 Yaşam</option>
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
              </select>
            </div>
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
            <Plus className="w-4 h-4 stroke-[3]" /> Listeye Ekle
          </button>
        </form>
      </div>
    </div>
  );
}
