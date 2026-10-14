import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db, initDatabase } from './db';
import { getTodayString, calculateStreaks, getPastDaysList } from './utils/date';
import { playClickSound } from './utils/sound';
import Header from './components/Header';
import RoutineList from './components/RoutineList';
import TrackerHeatmap from './components/TrackerHeatmap';
import TereaWidget from './components/TereaWidget';
import QuickAddModal from './components/QuickAddModal';
import DayDetailModal from './components/DayDetailModal';
import SettingsModal from './components/SettingsModal';
import BadgesModal from './components/BadgesModal';
import PinLockScreen from './components/PinLockScreen';
import { CheckSquare, BarChart2, Plus } from 'lucide-react';

export default function App() {
  const [routines, setRoutines] = useState([]);
  const [completedMap, setCompletedMap] = useState({});
  const [quantityMap, setQuantityMap] = useState({});
  const [currentScore, setCurrentScore] = useState(0);
  const [targetScore, setTargetScore] = useState(100);
  const [resetHour, setResetHour] = useState(4); // 04:00 Night Owl default
  const [todayStr, setTodayStr] = useState(getTodayString(4));
  const [daysMap, setDaysMap] = useState({});
  const [categoryScoresMap, setCategoryScoresMap] = useState({});
  const [streak, setStreak] = useState(0);
  const [freezeUsed, setFreezeUsed] = useState(false);

  // Security PIN State
  const [pinEnabled, setPinEnabled] = useState(false);
  const [storedPinHash, setStoredPinHash] = useState('');
  const [isAppLocked, setIsAppLocked] = useState(false);
  const isPinCheckedRef = useRef(false);

  // Terea State
  const [tereaPrice, setTereaPrice] = useState(6.0); // 6.00 TL per stick (120 TL pack)
  const [todayTereaSticks, setTodayTereaSticks] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Privacy Shield (Blur Mode)
  const [privacyMode, setPrivacyMode] = useState(false);

  // UI Navigation & Modals
  const [currentView, setCurrentView] = useState('routines'); // 'routines' | 'tracker'
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isBadgesModalOpen, setIsBadgesModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Load all data from IndexedDB
  const loadData = useCallback(async () => {
    await initDatabase();

    // Load Settings
    const targetSet = await db.settings.get('dailyTarget');
    const targetVal = targetSet ? targetSet.value : 100;
    setTargetScore(targetVal);

    const resetSet = await db.settings.get('resetHour');
    const resetVal = resetSet ? resetSet.value : 4;
    setResetHour(resetVal);

    const priceSet = await db.settings.get('tereaStickPrice');
    const priceVal = priceSet ? priceSet.value : 6.0;
    setTereaPrice(priceVal);

    const soundSet = await db.settings.get('soundEnabled');
    setSoundEnabled(soundSet ? soundSet.value : true);

    // Load Security PIN settings
    const pinEnabledSet = await db.settings.get('pinEnabled');
    const pinHashSet = await db.settings.get('pinHash');
    const hasPin = !!(pinEnabledSet?.value && pinHashSet?.value);
    setPinEnabled(hasPin);
    setStoredPinHash(pinHashSet?.value || '');
    if (hasPin) {
      setIsAppLocked((prev) => (isPinCheckedRef.current ? prev : true));
    } else {
      setIsAppLocked(false);
    }
    isPinCheckedRef.current = true;

    const currentToday = getTodayString(resetVal);
    setTodayStr(currentToday);

    // Load Routines
    const activeRoutines = await db.routines
      .filter((r) => !r.archived)
      .sortBy('order');
    setRoutines(activeRoutines);

    // Load Today's Completed Routine Logs
    const todayLogs = await db.logs.where('date').equals(currentToday).toArray();
    const map = {};
    const qMap = {};
    let score = 0;
    todayLogs.forEach((log) => {
      map[log.routineId] = true;
      score += log.weight || 0;
      if (log.currentQuantity !== undefined) {
        qMap[log.routineId] = log.currentQuantity;
      }
    });
    setCompletedMap(map);
    setQuantityMap((prev) => ({ ...prev, ...qMap }));
    setCurrentScore(score);

    // Load Today's Terea Sticks
    const todayDayRecord = await db.days.get(currentToday);
    const sticks = todayDayRecord?.tereaCount || 0;
    setTodayTereaSticks(sticks);

    // Load All Days for Heatmap & Streak
    const allDays = await db.days.toArray();
    const dMap = {};
    allDays.forEach((d) => {
      dMap[d.date] = d;
    });
    // Ensure today is reflected in map
    dMap[currentToday] = {
      date: currentToday,
      totalScore: score,
      targetScore: targetVal,
      completedCount: todayLogs.length,
      tereaCount: sticks,
      note: dMap[currentToday]?.note || ''
    };
    setDaysMap(dMap);

    // Compute Category Breakdown Map for Heatmap
    const allLogs = await db.logs.toArray();
    const routinesMap = {};
    activeRoutines.forEach((r) => {
      routinesMap[r.id] = r;
    });

    const catMap = {};
    allLogs.forEach((log) => {
      const d = log.date;
      if (!catMap[d]) catMap[d] = {};
      const r = routinesMap[log.routineId];
      const cat = r?.category || 'study';
      catMap[d][cat] = (catMap[d][cat] || 0) + (log.weight || 0);
    });
    setCategoryScoresMap(catMap);

    // Calculate Streaks with Flexible Discipline
    const streakInfo = calculateStreaks(dMap, 80, resetVal);
    setStreak(streakInfo.currentStreak);
    setFreezeUsed(streakInfo.freezeUsed);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Compute Advanced Terea Expense Statistics (Week, Month-to-date, All-time)
  const tereaStats = useMemo(() => {
    const past7Days = getPastDaysList(7, resetHour);
    const [year, month] = todayStr.split('-');
    const currentMonthPrefix = `${year}-${month}`;

    let weekSticks = 0;
    let monthSticks = 0;
    let allTimeSticks = 0;
    let trackedDaysWithTerea = 0;

    Object.keys(daysMap).forEach((date) => {
      const count = daysMap[date]?.tereaCount || 0;
      allTimeSticks += count;
      if (count > 0) trackedDaysWithTerea++;

      if (past7Days.includes(date)) {
        weekSticks += count;
      }
      if (date.startsWith(currentMonthPrefix)) {
        monthSticks += count;
      }
    });

    const weekSpent = weekSticks * tereaPrice;
    const weekPacks = (weekSticks / 20).toFixed(1);

    const monthSpent = monthSticks * tereaPrice;
    const monthPacks = (monthSticks / 20).toFixed(1);

    const allTimeSpent = allTimeSticks * tereaPrice;
    const allTimePacks = (allTimeSticks / 20).toFixed(1);

    const dailyAvgSticks = trackedDaysWithTerea > 0
      ? (allTimeSticks / Math.max(trackedDaysWithTerea, 1)).toFixed(1)
      : todayTereaSticks.toFixed(1);

    return {
      weekSticks,
      weekSpent,
      weekPacks,
      monthSticks,
      monthSpent,
      monthPacks,
      allTimeSticks,
      allTimeSpent,
      allTimePacks,
      dailyAvgSticks
    };
  }, [daysMap, todayStr, resetHour, tereaPrice, todayTereaSticks]);

  // Toggle routine completion
  const handleToggleRoutine = async (routine) => {
    if (soundEnabled) playClickSound();
    const isCompleted = !!completedMap[routine.id];
    const logId = `${todayStr}_${routine.id}`;

    let newScore = currentScore;
    const newMap = { ...completedMap };
    const isQty = routine.type === 'quantity' || (routine.targetQuantity && routine.unit);
    const targetQ = Number(routine.targetQuantity) || 1;

    if (!isCompleted) {
      // Mark Completed
      const qtyToSet = isQty ? targetQ : undefined;
      await db.logs.put({
        id: logId,
        date: todayStr,
        routineId: routine.id,
        title: routine.title,
        weight: routine.weight,
        currentQuantity: qtyToSet,
        completedAt: new Date().toISOString()
      });
      newMap[routine.id] = true;
      newScore += routine.weight;

      if (isQty) {
        setQuantityMap((prev) => ({ ...prev, [routine.id]: targetQ }));
      }

      // Celebrate 100 Score with Apple-like micro confetti
      if (newScore >= targetScore && currentScore < targetScore) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
        });
      }
    } else {
      // Mark Uncompleted
      await db.logs.delete(logId);
      delete newMap[routine.id];
      newScore = Math.max(0, newScore - routine.weight);

      if (isQty) {
        setQuantityMap((prev) => ({ ...prev, [routine.id]: 0 }));
      }
    }

    setCompletedMap(newMap);
    setCurrentScore(newScore);

    const completedCount = Object.keys(newMap).length;
    await db.days.put({
      date: todayStr,
      totalScore: newScore,
      targetScore,
      completedCount,
      tereaCount: todayTereaSticks,
      note: daysMap[todayStr]?.note || ''
    });

    const updatedMap = {
      ...daysMap,
      [todayStr]: {
        date: todayStr,
        totalScore: newScore,
        targetScore,
        completedCount,
        tereaCount: todayTereaSticks,
        note: daysMap[todayStr]?.note || ''
      }
    };
    setDaysMap(updatedMap);

    const streakInfo = calculateStreaks(updatedMap, 80, resetHour);
    setStreak(streakInfo.currentStreak);
    setFreezeUsed(streakInfo.freezeUsed);

    // Update category map in memory
    const cat = routine.category || 'study';
    setCategoryScoresMap((prev) => {
      const dayCats = { ...(prev[todayStr] || {}) };
      const currentCatScore = dayCats[cat] || 0;
      dayCats[cat] = !isCompleted
        ? currentCatScore + routine.weight
        : Math.max(0, currentCatScore - routine.weight);
      return { ...prev, [todayStr]: dayCats };
    });
  };

  // Update quantity habit progress
  const handleUpdateQuantity = async (routine, newQty) => {
    setQuantityMap((prev) => ({ ...prev, [routine.id]: newQty }));
    const logId = `${todayStr}_${routine.id}`;
    const targetQ = Number(routine.targetQuantity) || 1;
    const isCompleted = !!completedMap[routine.id];

    if (newQty >= targetQ && !isCompleted) {
      // Auto-complete routine
      if (soundEnabled) playClickSound();
      await db.logs.put({
        id: logId,
        date: todayStr,
        routineId: routine.id,
        title: routine.title,
        weight: routine.weight,
        currentQuantity: newQty,
        completedAt: new Date().toISOString()
      });

      const newScore = currentScore + routine.weight;
      const newMap = { ...completedMap, [routine.id]: true };
      setCompletedMap(newMap);
      setCurrentScore(newScore);

      if (newScore >= targetScore && currentScore < targetScore) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
        });
      }

      await db.days.put({
        date: todayStr,
        totalScore: newScore,
        targetScore,
        completedCount: Object.keys(newMap).length,
        tereaCount: todayTereaSticks,
        note: daysMap[todayStr]?.note || ''
      });

      const updatedMap = {
        ...daysMap,
        [todayStr]: {
          date: todayStr,
          totalScore: newScore,
          targetScore,
          completedCount: Object.keys(newMap).length,
          tereaCount: todayTereaSticks,
          note: daysMap[todayStr]?.note || ''
        }
      };
      setDaysMap(updatedMap);
      const streakInfo = calculateStreaks(updatedMap, 80, resetHour);
      setStreak(streakInfo.currentStreak);
      setFreezeUsed(streakInfo.freezeUsed);

      const cat = routine.category || 'study';
      setCategoryScoresMap((prev) => {
        const dayCats = { ...(prev[todayStr] || {}) };
        dayCats[cat] = (dayCats[cat] || 0) + routine.weight;
        return { ...prev, [todayStr]: dayCats };
      });
    } else if (newQty < targetQ && isCompleted) {
      // Un-complete routine
      await db.logs.delete(logId);
      const newScore = Math.max(0, currentScore - routine.weight);
      const newMap = { ...completedMap };
      delete newMap[routine.id];
      setCompletedMap(newMap);
      setCurrentScore(newScore);

      await db.days.put({
        date: todayStr,
        totalScore: newScore,
        targetScore,
        completedCount: Object.keys(newMap).length,
        tereaCount: todayTereaSticks,
        note: daysMap[todayStr]?.note || ''
      });

      const updatedMap = {
        ...daysMap,
        [todayStr]: {
          date: todayStr,
          totalScore: newScore,
          targetScore,
          completedCount: Object.keys(newMap).length,
          tereaCount: todayTereaSticks,
          note: daysMap[todayStr]?.note || ''
        }
      };
      setDaysMap(updatedMap);
      const streakInfo = calculateStreaks(updatedMap, 80, resetHour);
      setStreak(streakInfo.currentStreak);
      setFreezeUsed(streakInfo.freezeUsed);

      const cat = routine.category || 'study';
      setCategoryScoresMap((prev) => {
        const dayCats = { ...(prev[todayStr] || {}) };
        dayCats[cat] = Math.max(0, (dayCats[cat] || 0) - routine.weight);
        return { ...prev, [todayStr]: dayCats };
      });
    } else if (isCompleted) {
      // Update quantity on existing log
      await db.logs.update(logId, { currentQuantity: newQty });
    }
  };

  // Toggle MIT star
  const handleToggleMit = async (routine) => {
    const nextMit = !routine.isMit;
    await db.routines.update(routine.id, { isMit: nextMit });
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? { ...r, isMit: nextMit } : r))
    );
  };

  // Toggle routine freeze
  const handleToggleFreeze = async (routine) => {
    const nextFreeze = !routine.isFrozen;
    await db.routines.update(routine.id, { isFrozen: nextFreeze });
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? { ...r, isFrozen: nextFreeze } : r))
    );
  };

  // Toggle subtask in checklist
  const handleToggleSubtask = async (routine, subtaskId) => {
    const updatedSubtasks = (routine.subtasks || []).map((st) =>
      st.id === subtaskId ? { ...st, done: !st.done } : st
    );
    await db.routines.update(routine.id, { subtasks: updatedSubtasks });
    setRoutines((prev) =>
      prev.map((r) => (r.id === routine.id ? { ...r, subtasks: updatedSubtasks } : r))
    );

    const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
    if (allDone && !completedMap[routine.id]) {
      handleToggleRoutine(routine);
    }
  };

  // Terea Increment (+)
  const handleIncrementTerea = async () => {
    const newCount = todayTereaSticks + 1;
    setTodayTereaSticks(newCount);

    await db.tereaLogs.add({
      date: todayStr,
      timestamp: new Date().toISOString(),
      pricePerStick: tereaPrice
    });

    await db.days.put({
      date: todayStr,
      totalScore: currentScore,
      targetScore,
      completedCount: Object.keys(completedMap).length,
      tereaCount: newCount,
      note: daysMap[todayStr]?.note || ''
    });

    setDaysMap((prev) => ({
      ...prev,
      [todayStr]: {
        ...(prev[todayStr] || {}),
        date: todayStr,
        tereaCount: newCount
      }
    }));
  };

  // Terea Decrement (-)
  const handleDecrementTerea = async () => {
    if (todayTereaSticks <= 0) return;
    const newCount = todayTereaSticks - 1;
    setTodayTereaSticks(newCount);

    await db.days.put({
      date: todayStr,
      totalScore: currentScore,
      targetScore,
      completedCount: Object.keys(completedMap).length,
      tereaCount: newCount,
      note: daysMap[todayStr]?.note || ''
    });

    setDaysMap((prev) => ({
      ...prev,
      [todayStr]: {
        ...(prev[todayStr] || {}),
        date: todayStr,
        tereaCount: newCount
      }
    }));
  };

  // Add new routine or one-time to-do
  const handleAddRoutine = async (newRoutine) => {
    await db.routines.add(newRoutine);
    await loadData();
  };

  // Delete routine
  const handleDeleteRoutine = async (id) => {
    await db.routines.delete(id);
    await db.logs.where('routineId').equals(id).delete();
    await loadData();
  };

  // Save note for a specific day
  const handleUpdateDayNote = async (dateStr, note) => {
    const existing = daysMap[dateStr] || {
      date: dateStr,
      totalScore: 0,
      targetScore,
      completedCount: 0,
      tereaCount: 0
    };
    const updated = { ...existing, note };
    await db.days.put(updated);
    setDaysMap((prev) => ({ ...prev, [dateStr]: updated }));
  };

  // Update target score setting
  const handleUpdateTargetScore = async (val) => {
    setTargetScore(val);
    await db.settings.put({ key: 'dailyTarget', value: val });
    await loadData();
  };

  // Update reset hour setting
  const handleUpdateResetHour = async (hour) => {
    setResetHour(hour);
    await db.settings.put({ key: 'resetHour', value: hour });
    await loadData();
  };

  // Update Terea price per stick
  const handleUpdateTereaPrice = async (price) => {
    setTereaPrice(price);
    await db.settings.put({ key: 'tereaStickPrice', value: price });
  };

  // Toggle sound effects
  const handleToggleSound = async () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    await db.settings.put({ key: 'soundEnabled', value: next });
  };

  // Save new PIN
  const handleSavePin = async (hash) => {
    await db.settings.put({ key: 'pinHash', value: hash });
    await db.settings.put({ key: 'pinEnabled', value: true });
    setStoredPinHash(hash);
    setPinEnabled(true);
  };

  // Remove PIN
  const handleRemovePin = async () => {
    await db.settings.delete('pinHash');
    await db.settings.put({ key: 'pinEnabled', value: false });
    setStoredPinHash('');
    setPinEnabled(false);
    setIsAppLocked(false);
  };

  // Seed 30 days of realistic history (Both Routines + Terea Consumption)
  const handleSeedDemoData = async () => {
    const base = new Date();
    const scores = [100, 85, 95, 110, 70, 100, 105, 90, 80, 100, 60, 95, 100, 115, 85, 100, 75, 90, 100, 105];
    const tereaCounts = [12, 10, 14, 8, 15, 11, 9, 13, 10, 12, 16, 11, 10, 8, 14, 12, 9, 13, 11, 10];

    for (let i = 1; i <= 30; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      const score = scores[i % scores.length];
      const terea = tereaCounts[i % tereaCounts.length];

      await db.days.put({
        date: dateStr,
        totalScore: score,
        targetScore: 100,
        completedCount: Math.floor(score / 20),
        tereaCount: terea,
        note: i === 3 ? 'Kütüphanede 3 saat blok çalışma yapıldı.' : ''
      });

      await db.logs.put({
        id: `${dateStr}_demo1`,
        date: dateStr,
        routineId: 1,
        title: '📚 Odaklı Mühendislik / Ders Çalışması (45 dk)',
        weight: 25,
        completedAt: `${dateStr}T10:00:00.000Z`
      });
      await db.logs.put({
        id: `${dateStr}_demo2`,
        date: dateStr,
        routineId: 2,
        title: '🏃‍♂️ Günlük Egzersiz veya 7.500 Adım',
        weight: 20,
        completedAt: `${dateStr}T15:00:00.000Z`
      });
    }

    await loadData();
  };

  return (
    <div className={`min-h-screen bg-[#0f1014] text-[#f1f2f6] flex flex-col font-sans selection:bg-neutral-800 ${privacyMode ? 'privacy-active' : ''}`}>
      {/* Top Header */}
      <Header
        todayStr={todayStr}
        currentScore={currentScore}
        targetScore={targetScore}
        streak={streak}
        freezeUsed={freezeUsed}
        todayTereaSticks={todayTereaSticks}
        tereaPrice={tereaPrice}
        privacyMode={privacyMode}
        onTogglePrivacy={() => setPrivacyMode((p) => !p)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenBadges={() => setIsBadgesModalOpen(true)}
        onToggleView={() => setCurrentView((v) => (v === 'routines' ? 'tracker' : 'routines'))}
        currentView={currentView}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-md w-full mx-auto px-4 pt-3 space-y-4">
        {currentView === 'routines' ? (
          <>
            {/* Terea Counter & Spending Engine Widget */}
            <TereaWidget
              todaySticks={todayTereaSticks}
              stickPrice={tereaPrice}
              stats={tereaStats}
              onIncrement={handleIncrementTerea}
              onDecrement={handleDecrementTerea}
              onOpenSettings={() => setIsSettingsModalOpen(true)}
            />

            {/* Routine & To-Do List with Dual Filters & Eisenhower Matrix */}
            <RoutineList
              routines={routines}
              completedMap={completedMap}
              quantityMap={quantityMap}
              onToggleRoutine={handleToggleRoutine}
              onDeleteRoutine={handleDeleteRoutine}
              onOpenAddModal={() => setIsAddModalOpen(true)}
              onUpdateQuantity={handleUpdateQuantity}
              onToggleMit={handleToggleMit}
              onToggleFreeze={handleToggleFreeze}
              onToggleSubtask={handleToggleSubtask}
            />
          </>
        ) : (
          <TrackerHeatmap
            daysMap={daysMap}
            todayStr={todayStr}
            targetScore={targetScore}
            tereaPrice={tereaPrice}
            categoryScoresMap={categoryScoresMap}
            onSelectDay={(date) => setSelectedDay(date)}
            onSeedDemoData={handleSeedDemoData}
          />
        )}
      </main>

      {/* Mobile Floating Action & Bottom Bar (Apple Slate) */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-[#0f1014]/90 backdrop-blur-2xl border-t border-[#23252e] px-6 py-2 safe-bottom">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setCurrentView('routines')}
            className={`flex flex-col items-center gap-1 transition-colors spring-click ${
              currentView === 'routines' ? 'text-white' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            <span className="text-[10px] font-bold">Rutin & Terea</span>
          </button>

          {/* Center Quick Add FAB */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            aria-label="Yeni Rutin Ekle"
            className="w-12 h-12 -mt-5 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 hover:bg-neutral-200 transition-all spring-click"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          <button
            onClick={() => setCurrentView('tracker')}
            className={`flex flex-col items-center gap-1 transition-colors spring-click ${
              currentView === 'tracker' ? 'text-emerald-400' : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <BarChart2 className="w-5 h-5" />
            <span className="text-[10px] font-bold">Geçmiş & Isı</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <QuickAddModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddRoutine={handleAddRoutine}
        existingRoutines={routines}
      />

      <DayDetailModal
        dateStr={selectedDay}
        dayRecord={selectedDay ? daysMap[selectedDay] : null}
        tereaPrice={tereaPrice}
        onClose={() => setSelectedDay(null)}
        onUpdateDayNote={handleUpdateDayNote}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        targetScore={targetScore}
        onUpdateTargetScore={handleUpdateTargetScore}
        resetHour={resetHour}
        onUpdateResetHour={handleUpdateResetHour}
        tereaStickPrice={tereaPrice}
        onUpdateTereaPrice={handleUpdateTereaPrice}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        onSeedDemoData={handleSeedDemoData}
        onReloadData={loadData}
        pinEnabled={pinEnabled}
        storedPinHash={storedPinHash}
        onSavePin={handleSavePin}
        onRemovePin={handleRemovePin}
      />

      <BadgesModal
        isOpen={isBadgesModalOpen}
        onClose={() => setIsBadgesModalOpen(false)}
        totalScore={currentScore}
        streak={streak}
      />

      {/* App Startup PIN Security Lock Screen */}
      {isAppLocked && pinEnabled && storedPinHash && (
        <PinLockScreen
          isOpen={true}
          mode="unlock"
          storedPinHash={storedPinHash}
          onSuccess={() => setIsAppLocked(false)}
        />
      )}
    </div>
  );
}
