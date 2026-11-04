import React, { useState } from 'react';
import { X, CreditCard, Check } from 'lucide-react';
import { triggerHaptic, soundEngine } from '../utils/haptics';
import { formatCurrency } from '../utils/budget';

const MEAL_PRESETS = [
  { amount: 60, label: '1 Öğün' },
  { amount: 120, label: '2 Öğün' },
  { amount: 300, label: '5 Öğün' },
  { amount: 600, label: '10 Öğün' }
];

export default function YemekKartiSheet({ isOpen, onClose, onSave, isDark }) {
  const [selectedAmount, setSelectedAmount] = useState(120);
  const [customMeals, setCustomMeals] = useState('');

  if (!isOpen) return null;

  const currentAmount = customMeals ? (Number(customMeals) * 60) : selectedAmount;
  const currentMeals = Math.round(currentAmount / 60);

  const handleSelectPreset = (amt) => {
    triggerHaptic('selection');
    setSelectedAmount(amt);
    setCustomMeals('');
  };

  const handleCustomChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setCustomMeals(val);
    }
  };

  const handleConfirm = () => {
    if (currentAmount <= 0) return;
    triggerHaptic('success');
    soundEngine.playSuccess();
    onSave({
      title: `Yemek Kartı Yükleme (${currentMeals} Öğün)`,
      amount: currentAmount,
      category: 'Yemekhane & Kart',
      categoryIcon: '🍱',
      isQuick: true
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm transition-opacity p-0 sm:p-4">
      {/* Backdrop tap to close */}
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
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">💳</span>
            <div>
              <h2 className="text-lg font-bold tracking-tight">Yemek Kartı Yükleme</h2>
              <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                İTÜ Kart yükleme tutarını seçin
              </p>
            </div>
          </div>
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

        {/* Preset Chips */}
        <div className="grid grid-cols-2 gap-2.5 my-4">
          {MEAL_PRESETS.map((preset) => {
            const isSelected = !customMeals && selectedAmount === preset.amount;
            return (
              <button
                key={preset.amount}
                type="button"
                onClick={() => handleSelectPreset(preset.amount)}
                className={`p-3.5 rounded-2xl text-left spring-tap transition-all flex items-center justify-between border ${
                  isSelected
                    ? isDark
                      ? 'bg-cyan-500/15 border-cyan-500 text-white'
                      : 'bg-cyan-50 border-cyan-500 text-cyan-950'
                    : isDark
                      ? 'bg-neutral-800/80 border-neutral-700/60 text-neutral-300 hover:bg-neutral-800'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                }`}
              >
                <div>
                  <div className="text-base font-bold num-tabular">
                    {preset.amount} ₺
                  </div>
                  <div className={`text-xs font-medium ${isSelected ? (isDark ? 'text-cyan-300' : 'text-cyan-700') : (isDark ? 'text-neutral-400' : 'text-neutral-500')}`}>
                    {preset.label}
                  </div>
                </div>
                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-cyan-500 text-black flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Multiple of 60 */}
        <div className={`p-3.5 rounded-2xl border mb-5 ${
          isDark ? 'bg-neutral-800/50 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
        }`}>
          <div className="flex items-center justify-between text-xs font-medium mb-1.5">
            <span className={isDark ? 'text-neutral-400' : 'text-neutral-500'}>
              Farklı Öğün Sayısı:
            </span>
            {customMeals && (
              <span className="font-bold text-cyan-500 num-tabular">
                = {currentAmount} ₺
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={customMeals}
              onChange={handleCustomChange}
              placeholder="Örn: 8 (öğün)"
              className={`w-full px-3 py-2 rounded-xl text-sm font-semibold num-tabular outline-none ${
                isDark
                  ? 'bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:border-cyan-500'
                  : 'bg-white border border-neutral-300 text-neutral-900 placeholder-neutral-400 focus:border-cyan-600'
              }`}
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={currentAmount <= 0}
          className={`w-full py-3.5 rounded-2xl font-bold text-base spring-tap flex items-center justify-center gap-2 shadow-sm transition-all ${
            isDark
              ? 'bg-cyan-500 text-black hover:bg-cyan-400 active:bg-cyan-600'
              : 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800'
          }`}
        >
          <CreditCard className="w-5 h-5" />
          <span>Karta Yükle ({formatCurrency(currentAmount, true)})</span>
        </button>
      </div>
    </div>
  );
}
