import Dexie from 'dexie';

export const db = new Dexie('BudgetAppDB');

db.version(1).stores({
  expenses: '++id, date, timestamp, title, amount, category, categoryIcon, isQuick, type',
  settings: 'key',
  suggestions: '++id, title, useCount, lastUsed'
});

export const DEFAULT_SETTINGS = {
  monthlyIncome: 28000,
  salaryDay: 20,
  iqosPrice: 220,
  currentBalance: 7500, // 4 Kasım itibarıyla hesapta kalan nakit
  balanceSetDate: '2026-11-04',
  theme: 'dark', // 'dark' | 'light' | 'system'
  dailyNotification: false,
  notificationTime: '22:00'
};

export async function initDatabase() {
  // Ensure default settings exist or update missing keys
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await db.settings.get(key);
    if (!existing) {
      await db.settings.put({ key, value });
    }
  }

  // Pre-seed initial suggestions for quick chips
  const suggestionCount = await db.suggestions.count();
  if (suggestionCount === 0) {
    await db.suggestions.bulkAdd([
      { title: 'Kahve', useCount: 10, lastUsed: Date.now() },
      { title: 'Taksi', useCount: 5, lastUsed: Date.now() - 3600000 },
      { title: 'Market', useCount: 8, lastUsed: Date.now() - 7200000 }
    ]);
  }
}

export async function getSetting(key, fallback = null) {
  const item = await db.settings.get(key);
  return item ? item.value : (DEFAULT_SETTINGS[key] ?? fallback);
}

export async function setSetting(key, value) {
  await db.settings.put({ key, value });
}

export async function exportAllData() {
  const expenses = await db.expenses.toArray();
  const settings = await db.settings.toArray();
  const suggestions = await db.suggestions.toArray();

  return {
    appName: 'Budget',
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses,
    settings,
    suggestions
  };
}

export async function importAllData(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Geçersiz veri paketi.');
  }

  await db.transaction('rw', [db.expenses, db.settings, db.suggestions], async () => {
    if (data.expenses && Array.isArray(data.expenses)) {
      await db.expenses.clear();
      if (data.expenses.length > 0) {
        await db.expenses.bulkAdd(data.expenses);
      }
    }
    if (data.settings && Array.isArray(data.settings)) {
      await db.settings.clear();
      if (data.settings.length > 0) {
        await db.settings.bulkAdd(data.settings);
      }
    }
    if (data.suggestions && Array.isArray(data.suggestions)) {
      await db.suggestions.clear();
      if (data.suggestions.length > 0) {
        await db.suggestions.bulkAdd(data.suggestions);
      }
    }
  });
}

export async function clearAllExpenses() {
  await db.expenses.clear();
}
