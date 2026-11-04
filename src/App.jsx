import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  db,
  initDatabase,
  getSetting,
  setSetting,
  DEFAULT_SETTINGS
} from './db';
import {
  computeBudgetMetrics,
  getTodayString
} from './utils/budget';
import { triggerHaptic, soundEngine } from './utils/haptics';

import Header from './components/Header';
import BudgetSummaryCard from './components/BudgetSummaryCard';
import QuickActionCards from './components/QuickActionCards';
import ExpenseList from './components/ExpenseList';
import YemekKartiSheet from './components/YemekKartiSheet';
import AddExpenseSheet from './components/AddExpenseSheet';
import UndoToast from './components/UndoToast';
import AnalyticsModal from './components/AnalyticsModal';
import HistoryModal from './components/HistoryModal';
import SettingsModal from './components/SettingsModal';
import { Plus } from 'lucide-react';

export default function App() {
  const [expenses, setExpenses] = useState([]);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Modals
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isYemekKartiOpen, setIsYemekKartiOpen] = useState(false);
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Undo Toast state
  const [lastExpense, setLastExpense] = useState(null);

  // Load Database & Settings
  const loadData = useCallback(async () => {
    try {
      await initDatabase();

      const [loadedExpenses, loadedSettings, loadedSuggestions] = await Promise.all([
        db.expenses.orderBy('timestamp').reverse().toArray(),
        db.settings.toArray(),
        db.suggestions.orderBy('useCount').reverse().limit(5).toArray()
      ]);

      const settingsMap = { ...DEFAULT_SETTINGS };
      for (const item of loadedSettings) {
        settingsMap[item.key] = item.value;
      }

      setExpenses(loadedExpenses);
      setSettings(settingsMap);
      setSuggestions(loadedSuggestions);
      setIsLoaded(true);
    } catch (err) {
      console.error('Veri yükleme hatası:', err);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Apply Theme dynamically
  const isDark = useMemo(() => {
    if (settings.theme === 'light') return false;
    if (settings.theme === 'dark') return true;
    // System preference fallback
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  }, [settings.theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }

    const metaThemeColor = document.querySelector("meta[name='theme-color']");
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', isDark ? '#000000' : '#f2f2f7');
    }
  }, [isDark]);

  // Financial Metrics Computation with 06:00 AM Day Boundary
  const todayStr = useMemo(() => getTodayString(new Date(), 6), []);

  const metrics = useMemo(() => {
    return computeBudgetMetrics({
      expenses,
      monthlyIncome: settings.monthlyIncome,
      salaryDay: settings.salaryDay,
      currentBalance: settings.currentBalance,
      balanceSetDate: settings.balanceSetDate,
      resetHour: 6,
      targetDate: new Date()
    });
  }, [expenses, settings.monthlyIncome, settings.salaryDay, settings.currentBalance, settings.balanceSetDate]);

  // Daily Spending History for Calendar Modal
  const history = useMemo(() => {
    return computeDailyHistory({
      expenses,
      dailyAllowance: metrics.dailyAllowance,
      targetDate: new Date(),
      resetHour: 6,
      daysCount: 16
    });
  }, [expenses, metrics.dailyAllowance]);

  // 1. Add IQOS Quick Expense
  const handleAddIqos = async () => {
    const currentLogicalToday = getTodayString(new Date(), 6);
    const newExp = {
      title: 'IQOS (1 Paket)',
      amount: settings.iqosPrice || 220,
      category: 'Tütün / IQOS',
      categoryIcon: '🚬',
      isQuick: true,
      timestamp: Date.now(),
      date: currentLogicalToday
    };

    const id = await db.expenses.add(newExp);
    const saved = { ...newExp, id };
    setExpenses((prev) => [saved, ...prev]);
    setLastExpense(saved);
  };

  // 2. Add Yemek Karti Expense
  const handleSaveYemekKarti = async (expData) => {
    const currentLogicalToday = getTodayString(new Date(), 6);
    const newExp = {
      ...expData,
      timestamp: Date.now(),
      date: currentLogicalToday
    };

    const id = await db.expenses.add(newExp);
    const saved = { ...newExp, id };
    setExpenses((prev) => [saved, ...prev]);
    setLastExpense(saved);
  };

  // 3. Add Custom / Serbest Expense
  const handleSaveCustomExpense = async (expData) => {
    const currentLogicalToday = getTodayString(new Date(), 6);
    const newExp = {
      ...expData,
      timestamp: Date.now(),
      date: currentLogicalToday
    };

    const id = await db.expenses.add(newExp);
    const saved = { ...newExp, id };
    setExpenses((prev) => [saved, ...prev]);
    setLastExpense(saved);

    // Update suggestions if custom title was provided
    if (expData.title && expData.title !== 'Hızlı Harcama') {
      const existing = await db.suggestions.where('title').equalsIgnoreCase(expData.title).first();
      if (existing) {
        await db.suggestions.update(existing.id, {
          useCount: (existing.useCount || 1) + 1,
          lastUsed: Date.now()
        });
      } else {
        await db.suggestions.add({
          title: expData.title,
          useCount: 1,
          lastUsed: Date.now()
        });
      }
      const updatedSuggestions = await db.suggestions.orderBy('useCount').reverse().limit(5).toArray();
      setSuggestions(updatedSuggestions);
    }
  };

  // 4. Delete Expense
  const handleDeleteExpense = async (id) => {
    await db.expenses.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    if (lastExpense && lastExpense.id === id) {
      setLastExpense(null);
    }
  };

  // 5. Undo Last Expense
  const handleUndo = async (id) => {
    await db.expenses.delete(id);
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    setLastExpense(null);
  };

  // 6. Update Settings
  const handleUpdateSetting = async (key, value) => {
    await setSetting(key, value);
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (!isLoaded) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${
        isDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-neutral-900'
      }`}>
        <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-200 select-none pb-24 ${
        isDark ? 'bg-black text-white' : 'bg-[#f2f2f7] text-neutral-900'
      }`}
    >
      <main className="max-w-md mx-auto px-4 safe-top">
        {/* Navigation Header */}
        <Header
          onOpenHistory={() => setIsHistoryOpen(true)}
          onOpenAnalytics={() => setIsAnalyticsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          isDark={isDark}
        />

        {/* Hero Budget & Daily Allowance Summary Card */}
        <BudgetSummaryCard metrics={metrics} isDark={isDark} />

        {/* 2 Primary Tactile Fast Action Cards (IQOS & Yemek Kartı) */}
        <QuickActionCards
          iqosPrice={settings.iqosPrice}
          onAddIqos={handleAddIqos}
          onOpenYemekKarti={() => setIsYemekKartiOpen(true)}
          isDark={isDark}
        />

        {/* Expense Flow List */}
        <ExpenseList
          expenses={expenses}
          onDeleteExpense={handleDeleteExpense}
          todayStr={todayStr}
          isDark={isDark}
        />
      </main>

      {/* Floating Action '+' Button for Free Entry */}
      <div className="fixed bottom-6 right-5 z-30 safe-bottom">
        <button
          type="button"
          onClick={() => {
            triggerHaptic('medium');
            soundEngine.playPop();
            setIsAddExpenseOpen(true);
          }}
          className={`w-14 h-14 rounded-full flex items-center justify-center spring-tap shadow-lg border transition-transform ${
            isDark
              ? 'bg-white text-black border-neutral-300 hover:bg-neutral-200 shadow-white/10 active:scale-95'
              : 'bg-neutral-900 text-white border-neutral-800 hover:bg-black shadow-black/20 active:scale-95'
          }`}
          title="Hızlı Harcama Ekle"
          aria-label="Hızlı Harcama Ekle"
        >
          <Plus className="w-7 h-7 stroke-[2.6]" />
        </button>
      </div>

      {/* Undo Toast Notification */}
      <UndoToast
        lastExpense={lastExpense}
        onUndo={handleUndo}
        onDismiss={() => setLastExpense(null)}
        isDark={isDark}
      />

      {/* Yemek Kartı Bottom Sheet */}
      <YemekKartiSheet
        isOpen={isYemekKartiOpen}
        onClose={() => setIsYemekKartiOpen(false)}
        onSave={handleSaveYemekKarti}
        isDark={isDark}
      />

      {/* Add Custom Expense Bottom Sheet */}
      <AddExpenseSheet
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onSave={handleSaveCustomExpense}
        recentSuggestions={suggestions}
        isDark={isDark}
      />

      {/* Calendar History Modal */}
      <HistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        isDark={isDark}
      />

      {/* Analytics Modal */}
      <AnalyticsModal
        isOpen={isAnalyticsOpen}
        onClose={() => setIsAnalyticsOpen(false)}
        metrics={metrics}
        isDark={isDark}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSetting={handleUpdateSetting}
        onDataReset={() => {
          setExpenses([]);
          setLastExpense(null);
        }}
        isDark={isDark}
      />
    </div>
  );
}
