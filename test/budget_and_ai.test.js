import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getSalaryCycle, computeBudgetMetrics, getTodayString, computeDailyHistory, formatCurrency } from '../src/utils/budget.js';
import { classifyExpense } from '../src/utils/categorizer.js';

describe('Budget Financial Engine & Date Calculations', () => {
  test('Calculates current cycle for mid-cycle date (Nov 4, salaryDay 20)', () => {
    // Current date: 4 Nov 2026 12:00, salary day: 20
    const targetDate = new Date(2026, 10, 4, 12, 0); // Month 10 is November
    const cycle = getSalaryCycle(20, targetDate);

    // Cycle starts 20 Oct, ends 19 Nov
    assert.equal(cycle.startDate.getMonth(), 9); // October
    assert.equal(cycle.startDate.getDate(), 20);
    assert.equal(cycle.endDate.getMonth(), 10); // November
    assert.equal(cycle.endDate.getDate(), 19);

    // October has 31 days (20-31 = 12 days). November 1-19 = 19 days. Total = 31 days.
    assert.equal(cycle.totalDays, 31);
  });

  test('Calculates current cycle for salary day itself (Nov 20, salaryDay 20)', () => {
    // Exactly on the 20th 12:00: new cycle begins!
    const targetDate = new Date(2026, 10, 20, 12, 0);
    const cycle = getSalaryCycle(20, targetDate);

    // Starts 20 Nov, ends 19 Dec
    assert.equal(cycle.startDate.getMonth(), 10); // November
    assert.equal(cycle.startDate.getDate(), 20);
    assert.equal(cycle.endDate.getMonth(), 11); // December
    assert.equal(cycle.endDate.getDate(), 19);

    // November has 30 days (20-30 = 11 days). December 1-19 = 19 days. Total = 30 days.
    assert.equal(cycle.totalDays, 30);
  });

  test('Calculates daily allowance correctly on cycle start (28.000 TL / cycle days)', () => {
    // 31 day cycle start (Oct 20): 28000 / 31 = 903.2258...
    const metrics31 = computeBudgetMetrics({
      expenses: [],
      monthlyIncome: 28000,
      salaryDay: 20,
      targetDate: new Date(2026, 9, 20, 12, 0)
    });
    assert.equal(Math.round(metrics31.dailyAllowance), 903);
    assert.equal(metrics31.todayNet, metrics31.dailyAllowance);
    assert.equal(metrics31.isTodaySurplus, true);

    // 30 day cycle start (Nov 20): 28000 / 30 = 933.33...
    const metrics30 = computeBudgetMetrics({
      expenses: [],
      monthlyIncome: 28000,
      salaryDay: 20,
      targetDate: new Date(2026, 10, 20, 12, 0)
    });
    assert.equal(Math.round(metrics30.dailyAllowance), 933);
  });

  test('Mid-cycle balance override (7.500 TL from Nov 4 to Nov 19 -> 16 days, 468.75 TL/day)', () => {
    const targetDate = new Date(2026, 10, 4, 12, 0); // 4 Kasım
    const metrics = computeBudgetMetrics({
      expenses: [],
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 7500,
      balanceSetDate: '2026-11-04',
      targetDate
    });

    assert.equal(metrics.isBalanceActive, true);
    assert.equal(metrics.daysLeftInPeriod, 16);
    assert.equal(metrics.dailyAllowance, 468.75);
    assert.equal(metrics.cycleRemaining, 7500);
    assert.equal(metrics.todayNet, 468.75);
    assert.equal(metrics.isTodaySurplus, true);
  });

  test('Mid-cycle balance override automatically resets when Nov 20 arrives', () => {
    const targetDate = new Date(2026, 10, 20, 12, 0); // 20 Kasım 12:00 (yeni döngü)
    const metrics = computeBudgetMetrics({
      expenses: [],
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 7500,
      balanceSetDate: '2026-11-04',
      targetDate
    });

    assert.equal(metrics.isBalanceActive, false);
    assert.equal(metrics.monthlyIncome, 28000);
    assert.equal(Math.round(metrics.dailyAllowance), 933);
  });

  test('Dynamic daily rebalancing: spending on Day 1 updates Day 2 daily allowance', () => {
    // Day 1: Nov 4. User has 7500 TL with 16 days remaining.
    // Daily allowance = 7500 / 16 = 468.75 TL.
    // User spends 1000 TL on Nov 4.
    const expenses = [
      { id: 1, title: 'Alışveriş', amount: 1000, category: 'Alışveriş', date: '2026-11-04', timestamp: new Date(2026, 10, 4, 14, 0).getTime() }
    ];

    // During Nov 4:
    const metricsDay1 = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 7500,
      balanceSetDate: '2026-11-04',
      targetDate: new Date(2026, 10, 4, 18, 0), // 4 Nov evening
      resetHour: 6
    });

    // On Day 1: daily allowance is FIXED at 468.75 TL; spending 1000 TL puts today at -531.25 TL
    assert.equal(metricsDay1.dailyAllowance, 468.75);
    assert.equal(metricsDay1.todayTotalSpent, 1000);
    assert.equal(metricsDay1.todayNet, 468.75 - 1000);
    assert.equal(metricsDay1.isTodaySurplus, false);
    assert.equal(metricsDay1.cycleRemaining, 6500);

    // Day 2 arrives: Nov 5 at 07:00 AM.
    // Days remaining = 15 (Nov 5 to Nov 19 inclusive).
    // Remaining money at start of Nov 5 = 7500 - 1000 = 6500 TL.
    // New rebalanced daily allowance = 6500 / 15 = 433.333... TL!
    const metricsDay2 = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 7500,
      balanceSetDate: '2026-11-04',
      targetDate: new Date(2026, 10, 5, 7, 0), // 5 Nov morning
      resetHour: 6
    });

    assert.equal(metricsDay2.daysLeftInPeriod, 15);
    assert.equal(metricsDay2.remainingAtStartOfToday, 6500);
    assert.equal(Math.round(metricsDay2.dailyAllowance * 100) / 100, 433.33);
    assert.equal(metricsDay2.todayTotalSpent, 0); // No expenses yet on Nov 5
    assert.equal(Math.round(metricsDay2.todayNet * 100) / 100, 433.33);
    assert.equal(metricsDay2.isTodaySurplus, true);
    assert.equal(metricsDay2.cycleRemaining, 6500);
  });

  test('Dynamic daily rebalancing: saving on Day 1 increases Day 2 daily allowance', () => {
    // Day 1: Nov 4. User spends only 100 TL out of 468.75 TL allowance.
    const expenses = [
      { id: 1, title: 'Kahve', amount: 100, category: 'Kahve & Kafe', date: '2026-11-04', timestamp: new Date(2026, 10, 4, 10, 0).getTime() }
    ];

    // Day 2 arrives: Nov 5. Remaining = 7500 - 100 = 7400 TL.
    // Days remaining = 15. New allowance = 7400 / 15 = 493.33 TL (increased from 468.75 TL!)
    const metricsDay2 = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 7500,
      balanceSetDate: '2026-11-04',
      targetDate: new Date(2026, 10, 5, 8, 0),
      resetHour: 6
    });

    assert.equal(metricsDay2.remainingAtStartOfToday, 7400);
    assert.equal(Math.round(metricsDay2.dailyAllowance * 100) / 100, 493.33);
  });

  test('Bank balance manual sync: preserves all past expenses while instantly recalibrating remaining cash & allowance', () => {
    // User made expenses on Nov 4 & Nov 5:
    const expenses = [
      { id: 1, title: 'IQOS', amount: 220, category: 'Tütün / IQOS', date: '2026-11-04', timestamp: new Date(2026, 10, 4, 12, 0).getTime() },
      { id: 2, title: 'Yemek', amount: 150, category: 'Yemek & Restoran', date: '2026-11-05', timestamp: new Date(2026, 10, 5, 13, 0).getTime() }
    ];

    // On Nov 6 15:00: User checks their bank account, sees 8.000 TL (maybe extra money entered), and syncs it.
    const syncTime = new Date(2026, 10, 6, 15, 0).getTime();
    const metricsSynced = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 8000,
      balanceSetDate: '2026-11-06',
      balanceSetTimestamp: syncTime,
      targetDate: new Date(2026, 10, 6, 15, 1),
      resetHour: 6
    });

    // 14 days remaining (Nov 6 to Nov 19 inclusive)
    assert.equal(metricsSynced.daysLeftInPeriod, 14);
    assert.equal(metricsSynced.cycleRemaining, 8000); // Instantly matches bank!
    assert.equal(Math.round(metricsSynced.dailyAllowance * 100) / 100, Math.round((8000 / 14) * 100) / 100);
    assert.equal(metricsSynced.isTodaySurplus, true);

    // If a new expense is made AFTER the sync on Nov 6 16:30:
    const updatedExpenses = [
      ...expenses,
      { id: 3, title: 'Kahve', amount: 100, category: 'Kahve & Kafe', date: '2026-11-06', timestamp: new Date(2026, 10, 6, 16, 30).getTime() }
    ];

    const metricsAfterExpense = computeBudgetMetrics({
      expenses: updatedExpenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 8000,
      balanceSetDate: '2026-11-06',
      balanceSetTimestamp: syncTime,
      targetDate: new Date(2026, 10, 6, 17, 0),
      resetHour: 6
    });

    assert.equal(metricsAfterExpense.cycleRemaining, 7900); // 8000 - 100
    assert.equal(metricsAfterExpense.todayTotalSpent, 100);
    assert.equal(metricsAfterExpense.todayNet, metricsAfterExpense.dailyAllowance - 100);

    // All past expenses (id 1, 2, 3) are still preserved intact in the array!
    assert.equal(updatedExpenses.length, 3);
  });

  test('Updating balance on Nov 10 preserves accurate historical days in calendar (prevents +1000 TL bug)', () => {
    const expenses = [
      { id: 1, title: 'IQOS', amount: 220, category: 'Tütün / IQOS', date: '2026-11-04', timestamp: new Date(2026, 10, 4, 12, 0).getTime() },
      { id: 2, title: 'Yemek', amount: 150, category: 'Yemek & Restoran', date: '2026-11-05', timestamp: new Date(2026, 10, 5, 13, 0).getTime() }
    ];

    // Checkpoints representing user setting 7500 on Nov 4, and now updating to 5000 on Nov 10:
    const balanceCheckpoints = [
      { date: '2026-11-04', balance: 7500 },
      { date: '2026-11-10', balance: 5000 }
    ];

    const history = computeDailyHistory({
      expenses,
      salaryDay: 20,
      currentBalance: 5000,
      balanceSetDate: '2026-11-10',
      balanceCheckpoints,
      targetDate: new Date(2026, 10, 10, 12, 0),
      resetHour: 6,
      daysCount: 7,
      minDate: '2026-11-04'
    });

    // Find Nov 4 & Nov 5 entries in history:
    const dayNov4 = history.find(h => h.dateStr === '2026-11-04');
    const dayNov5 = history.find(h => h.dateStr === '2026-11-05');
    const dayNov10 = history.find(h => h.dateStr === '2026-11-10');

    assert.ok(dayNov4);
    assert.ok(dayNov5);
    assert.ok(dayNov10);

    // Nov 4 daily allowance must be 468.75 TL, NOT 1750 TL!
    assert.equal(dayNov4.dailyAllowance, 468.75);
    assert.equal(dayNov4.totalSpent, 220);
    assert.equal(dayNov4.net, 468.75 - 220); // +248.75 TL

    // Nov 5 daily allowance must be ~485.33 TL, NOT 1866 TL!
    assert.equal(Math.round(dayNov5.dailyAllowance * 100) / 100, 485.33);
    assert.equal(dayNov5.totalSpent, 150);
    assert.equal(Math.round(dayNov5.net * 100) / 100, 335.33);

    // Nov 10 daily allowance must be 500 TL (5000 / 10 days)
    assert.equal(dayNov10.dailyAllowance, 500);

    // Also verify computeBudgetMetrics reports the TRUE total spent (not 0):
    const metrics = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 5000,
      balanceSetDate: '2026-11-10',
      balanceCheckpoints,
      targetDate: new Date(2026, 10, 10, 12, 0),
      resetHour: 6
    });

    assert.equal(metrics.cycleTotalSpent, 370); // 220 + 150 = 370 TL (accurate total!)
    assert.equal(metrics.dailyAllowance, 500);
    assert.equal(metrics.cycleRemaining, 5000);
  });

  test('Calendar history minDate excludes all days prior to Nov 4', () => {
    const expenses = [
      { id: 1, title: 'IQOS', amount: 220, category: 'Tütün / IQOS', date: '2026-11-04', timestamp: Date.now() }
    ];

    // Today is Nov 6, user requests up to 14 days back, but minDate is 2026-11-04
    const history = computeDailyHistory({
      expenses,
      dailyAllowance: 468.75,
      targetDate: new Date(2026, 10, 6, 12, 0),
      resetHour: 6,
      daysCount: 14,
      minDate: '2026-11-04'
    });

    // Should ONLY return Nov 6, Nov 5, Nov 4 (exactly 3 days, no Nov 3 or earlier!)
    assert.equal(history.length, 3);
    assert.equal(history[0].dateStr, '2026-11-06');
    assert.equal(history[1].dateStr, '2026-11-05');
    assert.equal(history[2].dateStr, '2026-11-04');
    assert.ok(history.every(day => day.dateStr >= '2026-11-04'));
  });

  test('Computes today net balance (+ when under allowance, - when overspent)', () => {
    const today = new Date();
    const todayStr = getTodayString(today);

    // Case 1: Under allowance
    const expensesUnder = [
      { id: 1, title: 'Yemek', amount: 120, category: 'Yemek & Restoran', date: todayStr, timestamp: today.getTime() },
      { id: 2, title: 'Kahve', amount: 90, category: 'Kahve & Kafe', date: todayStr, timestamp: today.getTime() }
    ];

    const metricsUnder = computeBudgetMetrics({
      expenses: expensesUnder,
      monthlyIncome: 28000,
      salaryDay: 20,
      targetDate: today
    });

    assert.equal(metricsUnder.todayTotalSpent, 210);
    assert.ok(metricsUnder.todayNet > 0);
    assert.equal(metricsUnder.isTodaySurplus, true);

    // Case 2: Overspent
    const expensesOver = [
      { id: 1, title: 'Alışveriş', amount: 3000, category: 'Alışveriş', date: todayStr, timestamp: today.getTime() }
    ];

    const metricsOver = computeBudgetMetrics({
      expenses: expensesOver,
      monthlyIncome: 28000,
      salaryDay: 20,
      targetDate: today
    });

    assert.equal(metricsOver.todayTotalSpent, 3000);
    assert.ok(metricsOver.todayNet < 0);
    assert.equal(metricsOver.isTodaySurplus, false);
  });

  test('06:00 AM reset boundary keeps late night expenses in previous day', () => {
    // 00:40 AM on 5 Nov belongs to 4 Nov
    const lateNight = new Date(2026, 10, 5, 0, 40);
    assert.equal(getTodayString(lateNight, 6), '2026-11-04');

    // 05:59 AM on 5 Nov still belongs to 4 Nov
    const earlyMorning = new Date(2026, 10, 5, 5, 59);
    assert.equal(getTodayString(earlyMorning, 6), '2026-11-04');

    // 06:01 AM on 5 Nov rolls over to 5 Nov
    const morningRollOver = new Date(2026, 10, 5, 6, 1);
    assert.equal(getTodayString(morningRollOver, 6), '2026-11-05');
  });

  test('Computes daily spending history correctly', () => {
    const expenses = [
      { id: 1, title: 'IQOS', amount: 220, category: 'Tütün / IQOS', date: '2026-11-04', timestamp: Date.now() },
      { id: 2, title: 'Kahve', amount: 90, category: 'Kahve & Kafe', date: '2026-11-04', timestamp: Date.now() }
    ];

    const history = computeDailyHistory({
      expenses,
      dailyAllowance: 468.75,
      targetDate: new Date(2026, 10, 4, 12, 0),
      resetHour: 6,
      daysCount: 3
    });

    assert.equal(history.length, 3);
    assert.equal(history[0].dateStr, '2026-11-04');
    assert.equal(history[0].totalSpent, 310);
    assert.equal(history[0].net, 468.75 - 310);
    assert.equal(history[0].isSurplus, true);
    assert.equal(history[0].items.length, 2);
  });

  test('Currency formatting handles integers and decimals cleanly', () => {
    assert.equal(formatCurrency(28000, true), '28.000 ₺');
    assert.equal(formatCurrency(220, true), '220 ₺');
    assert.equal(formatCurrency(60, true), '60 ₺');
  });

  test('Today net deduction: user spent 450 TL today, updates remaining balance to 10.000 TL with 10 days left -> dailyAllowance 1000 TL, todayNet 550 TL', () => {
    // Target date: Nov 10, 10 days left until Nov 20
    const targetDate = new Date(2026, 10, 10, 14, 0);
    const todayStr = getTodayString(targetDate, 6);

    // User already spent 450 TL today:
    const expenses = [
      { id: 1, title: 'Öğle Yemeği', amount: 350, category: 'Yemek & Restoran', date: todayStr, timestamp: new Date(2026, 10, 10, 12, 0).getTime() },
      { id: 2, title: 'Kahve', amount: 100, category: 'Kahve & Kafe', date: todayStr, timestamp: new Date(2026, 10, 10, 13, 0).getTime() }
    ];

    // User adjusts remaining balance in bank to 10.000 TL:
    const metrics = computeBudgetMetrics({
      expenses,
      monthlyIncome: 28000,
      salaryDay: 20,
      currentBalance: 10000,
      balanceSetDate: todayStr,
      balanceCheckpoints: [
        { date: '2026-11-04', balance: 7500 },
        { date: todayStr, balance: 10000 }
      ],
      targetDate,
      resetHour: 6
    });

    // 10 days remaining (Nov 10 to Nov 19 inclusive)
    assert.equal(metrics.daysLeftInPeriod, 10);
    assert.equal(metrics.dailyAllowance, 1000); // 10.000 / 10
    assert.equal(metrics.todayTotalSpent, 450); // 350 + 100
    assert.equal(metrics.todayNet, 550); // 1000 - 450 = +550 TL left today!
    assert.equal(metrics.isTodaySurplus, true);
  });

  test('Historical calendar stability across cycles: setting new balance in new cycle preserves Nov 4-19 historical allowances', () => {
    const expenses = [
      { id: 1, title: 'Harcama Nov 4', amount: 200, category: 'Diğer', date: '2026-11-04', timestamp: new Date(2026, 10, 4, 12, 0).getTime() },
      { id: 2, title: 'Harcama Nov 21', amount: 500, category: 'Diğer', date: '2026-11-21', timestamp: new Date(2026, 10, 21, 12, 0).getTime() }
    ];

    const checkpoints = [
      { date: '2026-11-04', balance: 7500 },
      { date: '2026-11-25', balance: 15000 }
    ];

    const history = computeDailyHistory({
      expenses,
      salaryDay: 20,
      currentBalance: 15000,
      balanceSetDate: '2026-11-25',
      balanceCheckpoints: checkpoints,
      targetDate: new Date(2026, 10, 25, 12, 0),
      resetHour: 6,
      daysCount: 25,
      minDate: '2026-11-04'
    });

    const dayNov4 = history.find(h => h.dateStr === '2026-11-04');
    assert.ok(dayNov4);
    // Nov 4 MUST still be 468.75 TL, completely unaffected by Nov 25 balance update:
    assert.equal(dayNov4.dailyAllowance, 468.75);
    assert.equal(dayNov4.totalSpent, 200);
    assert.equal(dayNov4.net, 268.75);
  });
});

describe('Smart Client-Side AI Categorization Engine', () => {
  test('Classifies tobacco / IQOS products', () => {
    assert.equal(classifyExpense('IQOS').id, 'tobacco');
    assert.equal(classifyExpense('terea sienna').id, 'tobacco');
    assert.equal(classifyExpense('heets sarı').id, 'tobacco');
    assert.equal(classifyExpense('1 paket sigara').id, 'tobacco');
  });

  test('Classifies cafeteria & school card loads', () => {
    assert.equal(classifyExpense('Yemek Kartı Yükleme').id, 'cafeteria');
    assert.equal(classifyExpense('okul kartı').id, 'cafeteria');
    assert.equal(classifyExpense('itü yemekhane').id, 'cafeteria');
  });

  test('Classifies food & restaurants', () => {
    assert.equal(classifyExpense('Tavuk Döner Dürüm').id, 'food');
    assert.equal(classifyExpense('Burger King menü').id, 'food');
    assert.equal(classifyExpense('Yemeksepeti sipariş').id, 'food');
  });

  test('Classifies coffee & cafes', () => {
    assert.equal(classifyExpense('Starbucks buzlu latte').id, 'coffee');
    assert.equal(classifyExpense('Filtre kahve').id, 'coffee');
    assert.equal(classifyExpense('Kahve Dünyası çikolata').id, 'coffee');
  });

  test('Classifies groceries & markets', () => {
    assert.equal(classifyExpense('Migros abur cubur').id, 'market');
    assert.equal(classifyExpense('Bim alışverişi').id, 'market');
    assert.equal(classifyExpense('A101 süt yumurta').id, 'market');
  });

  test('Classifies transportation & commuting', () => {
    assert.equal(classifyExpense('Metro akbil yükleme').id, 'transport');
    assert.equal(classifyExpense('Taksi Kadıköy').id, 'transport');
    assert.equal(classifyExpense('Marmaray geçiş').id, 'transport');
    assert.equal(classifyExpense('Martı scooter').id, 'transport');
  });

  test('Classifies health & personal care', () => {
    assert.equal(classifyExpense('Berber saç sakal').id, 'health');
    assert.equal(classifyExpense('Eczane ağrı kesici').id, 'health');
  });

  test('Classifies bills & digital subscriptions', () => {
    assert.equal(classifyExpense('Netflix faturası').id, 'bills');
    assert.equal(classifyExpense('Spotify aile').id, 'bills');
    assert.equal(classifyExpense('Turkcell hat faturası').id, 'bills');
  });

  test('Handles empty and unknown strings gracefully with Diğer (Other)', () => {
    assert.equal(classifyExpense('').id, 'other');
    assert.equal(classifyExpense(null).id, 'other');
    assert.equal(classifyExpense('xyz123abc').id, 'other');
  });
});
