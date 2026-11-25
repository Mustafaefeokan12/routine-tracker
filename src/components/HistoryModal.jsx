import React, { useState } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  Trash2,
  ArrowLeft,
  Check
} from 'lucide-react';
import { formatCurrency, formatTime } from '../utils/budget';
import { triggerHaptic } from '../utils/haptics';

const CATEGORY_OPTIONS = [
  { name: 'Tütün / IQOS', icon: '🚬' },
  { name: 'Kahve & Kafe', icon: '☕' },
  { name: 'Yemek & Restoran', icon: '🍔' },
  { name: 'Market & Gıda', icon: '🛒' },
  { name: 'Ulaşım & Akaryakıt', icon: '🚌' },
  { name: 'Diğer', icon: '📦' }
];

export default function HistoryModal({
  isOpen,
  onClose,
  history = [],
  isDark,
  onAddPastExpense,
  onDeleteExpense
}) {
  const [expandedDate, setExpandedDate] = useState(null);
  const [editingDay, setEditingDay] = useState(null);

  // Form state for adding past expense
  const [newTitle, setNewTitle] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORY_OPTIONS[0].name);

  if (!isOpen) return null;

  const toggleExpand = (dateStr) => {
    triggerHaptic('selection');
    setExpandedDate((prev) => (prev === dateStr ? null : dateStr));
  };

  const handleOpenEdit = (day) => {
    triggerHaptic('light');
    setEditingDay(day);
    setNewTitle('');
    setNewAmount('');
    setSelectedCategory(CATEGORY_OPTIONS[0].name);
  };

  const handleCloseEdit = () => {
    triggerHaptic('light');
    setEditingDay(null);
  };

  const handleAddExpenseSubmit = (e) => {
    e.preventDefault();
    const val = Number(newAmount);
    if (!val || val <= 0 || !editingDay) return;

    triggerHaptic('success');
    const catObj = CATEGORY_OPTIONS.find((c) => c.name === selectedCategory) || {
      name: 'Diğer',
      icon: '📦'
    };

    if (onAddPastExpense) {
      onAddPastExpense({
        title: newTitle.trim() || catObj.name,
        amount: val,
        category: catObj.name,
        categoryIcon: catObj.icon,
        date: editingDay.dateStr
      });
    }

    setNewTitle('');
    setNewAmount('');
  };

  const handleDeleteItem = (id) => {
    triggerHaptic('warning');
    if (onDeleteExpense) {
      onDeleteExpense(id);
    }
  };

  // Find active editing day items dynamically from history prop
  const currentEditingDayData = editingDay
    ? history.find((h) => h.dateStr === editingDay.dateStr) || editingDay
    : null;
  const editingDayItems = currentEditingDayData?.items || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={() => {
          if (editingDay) handleCloseEdit();
          else onClose();
        }}
      />

      <div
        className={`relative w-full max-w-md rounded-3xl p-6 transition-all max-h-[85vh] flex flex-col shadow-2xl border ${
          isDark
            ? 'bg-neutral-900 border-neutral-800 text-white'
            : 'bg-white border-neutral-200 text-neutral-900'
        }`}
      >
        {/* VIEW 1: Sub-View for Editing a Specific Day */}
        {editingDay ? (
          <div className="flex flex-col flex-1 overflow-hidden animate-fade-in">
            {/* Sub-Header */}
            <div className="flex items-center justify-between mb-4 shrink-0 pb-3 border-b border-neutral-800/60">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCloseEdit}
                  className={`p-2 rounded-xl spring-tap ${
                    isDark ? 'bg-neutral-800 text-neutral-300 hover:text-white' : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900'
                  }`}
                  title="Geri Dön"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-base font-bold tracking-tight">
                    {editingDay.fullDateLabel}
                  </h2>
                  <span className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    {editingDay.relativeLabel} • Toplam: {formatCurrency(currentEditingDayData?.totalSpent || 0, true)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseEdit}
                className={`p-2 rounded-full spring-tap ${
                  isDark ? 'bg-neutral-800 text-neutral-400 hover:text-white' : 'bg-neutral-100 text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto no-scrollbar space-y-4 flex-1 pr-0.5">
              {/* Form to Add Forgotten Expense to this Past Day */}
              <form
                onSubmit={handleAddExpenseSubmit}
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-neutral-300' : 'text-neutral-700'
                  }`}>
                    Bu Güne Harcama Ekle
                  </span>
                  <span className="text-[10px] text-cyan-500 font-semibold">
                    Geçmiş Gün Kaydı
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Açıklama (Örn: Kahve)"
                    className={`col-span-3 px-3 py-2 rounded-xl text-xs font-semibold outline-none ${
                      isDark
                        ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                        : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                    }`}
                  />
                  <input
                    type="text"
                    inputMode="numeric"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value.replace(/\D/g, ''))}
                    placeholder="Tutar (₺)"
                    required
                    className={`col-span-2 px-3 py-2 rounded-xl text-xs font-bold num-tabular outline-none ${
                      isDark
                        ? 'bg-neutral-900 border border-neutral-700 text-white focus:border-cyan-500'
                        : 'bg-white border border-neutral-300 text-neutral-900 focus:border-cyan-600'
                    }`}
                  />
                </div>

                {/* Category Selection Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {CATEGORY_OPTIONS.map((cat) => {
                    const isSelected = selectedCategory === cat.name;
                    return (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setSelectedCategory(cat.name)}
                        className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-black font-bold shadow-sm'
                            : isDark
                              ? 'bg-neutral-800 text-neutral-400 hover:text-white'
                              : 'bg-neutral-200/70 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.name.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={!newAmount || Number(newAmount) <= 0}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs spring-tap transition-all flex items-center justify-center gap-1.5 mt-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Bu Güne Kaydet</span>
                </button>
              </form>

              {/* Existing Expenses on this Day */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-bold uppercase tracking-wider ${
                    isDark ? 'text-neutral-400' : 'text-neutral-500'
                  }`}>
                    Günün Kayıtlı Harcamaları
                  </span>
                  <span className={`text-xs num-tabular ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    {editingDayItems.length} Adet
                  </span>
                </div>

                {editingDayItems.length === 0 ? (
                  <p className={`text-xs text-center py-6 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                    Bu güne ait harcama kaydı bulunmuyor.
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {editingDayItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isDark ? 'bg-neutral-800/40 border-neutral-800' : 'bg-neutral-50 border-neutral-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <span className="text-base">{item.categoryIcon || '📦'}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-semibold truncate">
                              {item.title}
                            </div>
                            <div className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                              {item.category || 'Diğer'}
                              {item.timestamp ? ` • ${formatTime(item.timestamp)}` : ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-extrabold num-tabular text-rose-500">
                            -{formatCurrency(item.amount, true)}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(item.id)}
                            className={`p-1.5 rounded-lg text-rose-500 spring-tap transition-colors ${
                              isDark ? 'hover:bg-rose-500/10' : 'hover:bg-rose-100'
                            }`}
                            title="Harcamayı Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW 2: Standard Day List with Pencil Icon */
          <div className="flex flex-col flex-1 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-500">
                  <CalendarIcon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Günlük Geçmiş</h2>
                  <p className={`text-xs ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                    Hangi gün ne kadar harcandı (06:00 sıfırlamalı)
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

            {/* Scrollable Day List */}
            <div className="overflow-y-auto no-scrollbar space-y-2.5 flex-1 pr-0.5">
              {history.length === 0 ? (
                <p className={`text-xs text-center py-8 ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                  Henüz geçmiş kayıt bulunmuyor.
                </p>
              ) : (
                history.map((day) => {
                  const isExpanded = expandedDate === day.dateStr;

                  return (
                    <div
                      key={day.dateStr}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isDark
                          ? 'bg-neutral-800/40 border-neutral-800 hover:border-neutral-700'
                          : 'bg-neutral-50 border-neutral-200/80 hover:border-neutral-300'
                      }`}
                    >
                      {/* Day Header Row */}
                      <div className="w-full p-3.5 flex items-center justify-between text-left">
                        <button
                          type="button"
                          onClick={() => toggleExpand(day.dateStr)}
                          className="flex-1 flex items-center justify-between text-left pr-2 spring-tap select-none"
                        >
                          <div className="min-w-0 pr-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                day.relativeLabel === 'Bugün'
                                  ? 'text-cyan-500'
                                  : isDark ? 'text-neutral-300' : 'text-neutral-700'
                              }`}>
                                {day.relativeLabel}
                              </span>
                              <span className={`text-xs ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                {day.fullDateLabel}
                              </span>
                            </div>

                            <div className="text-base font-extrabold num-tabular tracking-tight mt-0.5">
                              {formatCurrency(day.totalSpent, true)}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold num-tabular flex items-center gap-1 ${
                                day.isSurplus
                                  ? isDark
                                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : isDark
                                    ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {day.isSurplus ? '+' : ''}
                              {formatCurrency(day.net, true)}
                            </span>

                            {day.hasExpenses && (
                              <span className={`p-1 rounded-lg ${isDark ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </span>
                            )}
                          </div>
                        </button>

                        {/* Pencil Edit Icon for this Day */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(day)}
                          className={`p-2 rounded-xl spring-tap transition-colors shrink-0 ml-1 ${
                            isDark
                              ? 'bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700'
                              : 'bg-neutral-200/80 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-300'
                          }`}
                          title="Harcama Ekle / Düzenle"
                          aria-label="Harcama Ekle / Düzenle"
                        >
                          <Pencil className="w-3.5 h-3.5 stroke-[2.2]" />
                        </button>
                      </div>

                      {/* Expanded Item Details */}
                      {isExpanded && day.hasExpenses && (
                        <div className={`px-3.5 pb-3.5 pt-1 border-t space-y-1.5 ${
                          isDark ? 'border-neutral-800/80 bg-neutral-900/40' : 'border-neutral-200/60 bg-white/60'
                        }`}>
                          {day.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between py-1 text-xs"
                            >
                              <div className="flex items-center gap-2 min-w-0 pr-2">
                                <span>{item.categoryIcon || '📦'}</span>
                                <span className="font-semibold truncate">{item.title}</span>
                                <span className={`text-[10px] ${isDark ? 'text-neutral-500' : 'text-neutral-400'}`}>
                                  {formatTime(item.timestamp)}
                                </span>
                              </div>
                              <span className="font-bold num-tabular text-rose-500 shrink-0">
                                -{formatCurrency(item.amount, true)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
