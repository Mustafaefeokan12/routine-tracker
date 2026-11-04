import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, Plus, Check } from 'lucide-react';
import { triggerHaptic, soundEngine } from '../utils/haptics';
import { classifyExpense, CATEGORIES, DEFAULT_CATEGORY } from '../utils/categorizer';
import { formatCurrency } from '../utils/budget';

export default function AddExpenseSheet({
  isOpen,
  onClose,
  onSave,
  recentSuggestions = [],
  isDark
}) {
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const amountInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setAmount('');
      setTitle('');
      setSelectedCategory(null);
      setShowCategoryPicker(false);
      setTimeout(() => {
        amountInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Real-time AI Classification
  const autoCategory = selectedCategory || classifyExpense(title);

  if (!isOpen) return null;

  const handleAmountChange = (e) => {
    const val = e.target.value.replace(/,/g, '.');
    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSuggestionClick = (suggestedTitle) => {
    triggerHaptic('selection');
    setTitle(suggestedTitle);
    setSelectedCategory(null); // allow AI to re-classify
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) return;

    triggerHaptic('success');
    soundEngine.playSuccess();

    const finalTitle = title.trim() || 'Hızlı Harcama';
    const finalCategory = autoCategory.name;
    const finalCategoryIcon = autoCategory.icon;

    onSave({
      title: finalTitle,
      amount: parsedAmount,
      category: finalCategory,
      categoryIcon: finalCategoryIcon,
      isQuick: false
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      <div
        className={`relative w-full max-w-md rounded-t-[32px] sm:rounded-[32px] p-6 pb-8 transition-transform safe-bottom ${
          isDark
            ? 'bg-neutral-900 border border-neutral-800 text-white shadow-2xl'
            : 'bg-white border border-neutral-200 text-neutral-900 shadow-2xl'
        }`}
      >
        {/* iOS Drag Handle */}
        <div className="flex justify-center -mt-2 mb-4">
          <div className={`w-10 h-1.5 rounded-full ${isDark ? 'bg-neutral-700' : 'bg-neutral-300'}`} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold tracking-tight">Yeni Harcama</h2>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Input */}
          <div className="text-center py-2">
            <div className="flex items-center justify-center gap-1">
              <span className={`text-3xl font-bold ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                ₺
              </span>
              <input
                ref={amountInputRef}
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0"
                className={`text-5xl font-extrabold tracking-tight text-center w-48 bg-transparent outline-none num-tabular ${
                  isDark ? 'text-white placeholder-neutral-700' : 'text-neutral-900 placeholder-neutral-300'
                }`}
              />
            </div>
          </div>

          {/* Quick Suggestions Chips */}
          {recentSuggestions.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className={`text-[11px] font-medium whitespace-nowrap ${
                isDark ? 'text-neutral-500' : 'text-neutral-400'
              }`}>
                Öneri:
              </span>
              {recentSuggestions.slice(0, 3).map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => handleSuggestionClick(item.title)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold spring-tap whitespace-nowrap border ${
                    title === item.title
                      ? isDark
                        ? 'bg-neutral-800 text-white border-neutral-600'
                        : 'bg-neutral-900 text-white border-neutral-900'
                      : isDark
                        ? 'bg-neutral-800/60 text-neutral-300 border-neutral-700/60 hover:bg-neutral-800'
                        : 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200'
                  }`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          )}

          {/* Title Input */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setSelectedCategory(null);
              }}
              placeholder="Açıklama (opsiyonel, örn: Kahve, Berber)"
              className={`w-full px-4 py-3 rounded-2xl text-sm font-medium outline-none transition-all ${
                isDark
                  ? 'bg-neutral-800/80 border border-neutral-700/70 text-white placeholder-neutral-500 focus:border-neutral-500'
                  : 'bg-neutral-50 border border-neutral-200 text-neutral-900 placeholder-neutral-400 focus:border-neutral-400'
              }`}
            />
          </div>

          {/* Smart AI Categorization Badge */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('selection');
                setShowCategoryPicker(!showCategoryPicker);
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium spring-tap transition-all border ${
                isDark
                  ? 'bg-neutral-800/50 border-neutral-700/50 text-neutral-300 hover:bg-neutral-800'
                  : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Yapay Zeka:</span>
              <span className="font-bold">{autoCategory.icon} {autoCategory.name}</span>
              <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                (Değiştir)
              </span>
            </button>
          </div>

          {/* Category Picker Overlay (if user wants manual override) */}
          {showCategoryPicker && (
            <div className={`p-3 rounded-2xl grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto no-scrollbar border ${
              isDark ? 'bg-neutral-800 border-neutral-700' : 'bg-neutral-100 border-neutral-200'
            }`}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    triggerHaptic('selection');
                    setSelectedCategory(cat);
                    setShowCategoryPicker(false);
                  }}
                  className={`px-2.5 py-1.5 rounded-lg text-left text-xs font-medium spring-tap flex items-center gap-1.5 ${
                    autoCategory.name === cat.name
                      ? isDark ? 'bg-neutral-700 text-white font-bold' : 'bg-white text-neutral-900 font-bold shadow-xs'
                      : isDark ? 'text-neutral-400 hover:bg-neutral-700/50' : 'text-neutral-600 hover:bg-white/50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  <span className="truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!amount || parseFloat(amount) <= 0}
            className={`w-full py-3.5 rounded-2xl font-bold text-base spring-tap flex items-center justify-center gap-2 shadow-sm transition-all mt-4 ${
              !amount || parseFloat(amount) <= 0
                ? isDark
                  ? 'bg-neutral-800 text-neutral-600 cursor-not-allowed'
                  : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
                : isDark
                  ? 'bg-white text-black hover:bg-neutral-200 active:bg-neutral-300'
                  : 'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-black'
            }`}
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>Harcamayı Kaydet</span>
          </button>
        </form>
      </div>
    </div>
  );
}
