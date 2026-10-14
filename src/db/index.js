import Dexie from 'dexie';

export const db = new Dexie('RoutineTrackerDB');

db.version(2).stores({
  routines: '++id, title, category, weight, difficulty, timeOfDay, isRoutine, archived, order',
  logs: 'id, date, routineId, completedAt',
  days: 'date, totalScore, targetScore, completedCount, tereaCount',
  tereaLogs: '++id, date, timestamp, pricePerStick',
  settings: 'key'
});

export const DEFAULT_ROUTINES = [
  {
    title: '📚 Odaklı Mühendislik / Ders Çalışması (45 dk)',
    category: 'study',
    weight: 25,
    difficulty: 4,
    timeOfDay: 'morning',
    isRoutine: true,
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
    archived: false,
    order: 6
  }
];

export async function initDatabase() {
  const count = await db.routines.count();
  if (count === 0) {
    await db.routines.bulkAdd(DEFAULT_ROUTINES);
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
