import Dexie from 'dexie';

export const db = new Dexie('RoutineTrackerDB');

db.version(2).stores({
  routines: '++id, title, category, weight, difficulty, timeOfDay, isRoutine, archived, order',
  logs: 'id, date, routineId, completedAt',
  days: 'date, totalScore, targetScore, completedCount, tereaCount',
  tereaLogs: '++id, date, timestamp, pricePerStick',
  settings: 'key'
});

db.version(3).stores({
  routines: '++id, title, category, weight, difficulty, timeOfDay, isRoutine, archived, order, [category+timeOfDay], isMit, isTwoMinuteRule, targetQuantity, unit, type',
  logs: 'id, date, routineId, completedAt, [date+routineId]',
  days: 'date, totalScore, targetScore, completedCount, tereaCount',
  tereaLogs: '++id, date, timestamp, pricePerStick',
  settings: 'key',
  streaks: 'id, currentStreak, maxStreak, lastCompletedDate, freezeUsedDate',
  badges: 'id, title, category, unlockedAt, icon'
});

export async function exportBackupData() {
  const routines = await db.routines.toArray();
  const logs = await db.logs.toArray();
  const days = await db.days.toArray();
  const tereaLogs = await db.tereaLogs.toArray();
  const settings = await db.settings.toArray();
  const streaks = await db.streaks.toArray();
  const badges = await db.badges.toArray();

  return {
    version: 3,
    exportedAt: new Date().toISOString(),
    routines,
    logs,
    days,
    tereaLogs,
    settings,
    streaks,
    badges
  };
}

export async function restoreBackupData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Geçersiz yedek dosyası formatı.');
  }

  // Atomic transactional restore: any error rolls back all stores cleanly
  await db.transaction('rw', [db.routines, db.logs, db.days, db.tereaLogs, db.settings, db.streaks, db.badges], async () => {
    if (data.routines && Array.isArray(data.routines)) {
      await db.routines.clear();
      if (data.routines.length > 0) {
        await db.routines.bulkAdd(data.routines);
      }
    }

    if (data.logs && Array.isArray(data.logs)) {
      await db.logs.clear();
      if (data.logs.length > 0) {
        await db.logs.bulkAdd(data.logs);
      }
    }

    if (data.days && Array.isArray(data.days)) {
      await db.days.clear();
      if (data.days.length > 0) {
        await db.days.bulkAdd(data.days);
      }
    }

    if (data.tereaLogs && Array.isArray(data.tereaLogs)) {
      await db.tereaLogs.clear();
      if (data.tereaLogs.length > 0) {
        await db.tereaLogs.bulkAdd(data.tereaLogs);
      }
    }

    if (data.settings && Array.isArray(data.settings)) {
      await db.settings.clear();
      if (data.settings.length > 0) {
        await db.settings.bulkAdd(data.settings);
      }
    }

    if (data.streaks && Array.isArray(data.streaks)) {
      await db.streaks.clear();
      if (data.streaks.length > 0) {
        await db.streaks.bulkAdd(data.streaks);
      }
    }

    if (data.badges && Array.isArray(data.badges)) {
      await db.badges.clear();
      if (data.badges.length > 0) {
        await db.badges.bulkAdd(data.badges);
      }
    }
  });
}

export const DEFAULT_ROUTINES = [
  {
    title: '📚 Odaklı Mühendislik / Ders Çalışması (45 dk)',
    category: 'study',
    weight: 25,
    difficulty: 4,
    timeOfDay: 'morning',
    isRoutine: true,
    isMit: true,
    isTwoMinuteRule: false,
    targetQuantity: 45,
    unit: 'dk',
    type: 'boolean',
    archived: false,
    order: 1
  },
  {
    title: '🏃‍♂️ Günlük Egzersiz veya 7.500 Adım',
    category: 'fitness',
    weight: 20,
    difficulty: 3,
    timeOfDay: 'afternoon',
    isRoutine: true,
    isMit: false,
    isTwoMinuteRule: false,
    targetQuantity: 7500,
    unit: 'adım',
    type: 'boolean',
    archived: false,
    order: 2
  },
  {
    title: '🇩🇪 15 Dk Dil Pratiği (Almanca / Leoben)',
    category: 'study',
    weight: 15,
    difficulty: 3,
    timeOfDay: 'afternoon',
    isRoutine: true,
    isMit: false,
    isTwoMinuteRule: false,
    targetQuantity: 15,
    unit: 'dk',
    type: 'boolean',
    archived: false,
    order: 3
  },
  {
    title: '📖 20 Sayfa Kitap / Makale Okuma',
    category: 'mind',
    weight: 15,
    difficulty: 2,
    timeOfDay: 'evening',
    isRoutine: true,
    isMit: false,
    isTwoMinuteRule: false,
    targetQuantity: 20,
    unit: 'sayfa',
    type: 'boolean',
    archived: false,
    order: 4
  },
  {
    title: '💧 2.5 Litre Su Tüketimi',
    category: 'health',
    weight: 10,
    difficulty: 1,
    timeOfDay: 'anytime',
    isRoutine: true,
    isMit: false,
    isTwoMinuteRule: true,
    targetQuantity: 2.5,
    unit: 'L',
    type: 'boolean',
    archived: false,
    order: 5
  },
  {
    title: '🧘 Gün Sonu Değerlendirmesi & Yarının Planı',
    category: 'life',
    weight: 15,
    difficulty: 2,
    timeOfDay: 'evening',
    isRoutine: true,
    isMit: false,
    isTwoMinuteRule: true,
    targetQuantity: 1,
    unit: 'kez',
    type: 'boolean',
    archived: false,
    order: 6
  }
];

export async function initDatabase() {
  const isInitialized = await db.settings.get('hasInitializedRoutines');
  if (!isInitialized) {
    const count = await db.routines.count();
    if (count === 0) {
      await db.routines.bulkAdd(DEFAULT_ROUTINES);
    }
    await db.settings.put({ key: 'hasInitializedRoutines', value: true });
  }

  // Seed default settings if not exists
  const targetScore = await db.settings.get('dailyTarget');
  if (!targetScore) {
    await db.settings.put({ key: 'dailyTarget', value: 100 });
  }

  const resetHour = await db.settings.get('resetHour');
  if (!resetHour) {
    await db.settings.put({ key: 'resetHour', value: 4 }); // 04:00 Night Owl
  }

  const tereaPrice = await db.settings.get('tereaStickPrice');
  if (!tereaPrice) {
    // Default: 6.00 TL per stick (120 TL / 20 sticks pack)
    await db.settings.put({ key: 'tereaStickPrice', value: 6.0 });
  }

  const soundEnabled = await db.settings.get('soundEnabled');
  if (!soundEnabled) {
    await db.settings.put({ key: 'soundEnabled', value: true });
  }
}
