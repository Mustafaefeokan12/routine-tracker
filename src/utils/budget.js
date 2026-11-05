/**
 * Financial & Date Calculation Engine for Budget App
 * Designed for Mustafa Efe Okan's Salary Cycle & Daily Allowance Model
 * Day boundary reset: 06:00 AM (Night Owl boundary)
 */

/**
 * Returns adjusted Date object reflecting the 06:00 AM day boundary.
 * If current time is between 00:00 and 05:59, it still belongs to yesterday.
 */
export function getLogicalDate(d = new Date(), resetHour = 6) {
  const adjusted = new Date(d);
  if (adjusted.getHours() < resetHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }
  return adjusted;
}

/**
 * Returns formatted YYYY-MM-DD string according to 06:00 AM reset boundary.
 */
export function getTodayString(d = new Date(), resetHour = 6) {
  const adjusted = getLogicalDate(d, resetHour);
  const year = adjusted.getFullYear();
  const month = String(adjusted.getMonth() + 1).padStart(2, '0');
  const day = String(adjusted.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the current salary cycle based on salaryDay (default 20).
 * e.g., if salaryDay is 20 and today is Nov 4:
 * cycle is Oct 20 to Nov 19 (inclusive).
 */
export function getSalaryCycle(salaryDay = 20, targetDate = new Date(), resetHour = 6) {
  const logicalNow = getLogicalDate(targetDate, resetHour);
  const currentDay = logicalNow.getDate();
  const currentMonth = logicalNow.getMonth();
  const currentYear = logicalNow.getFullYear();

  let startYear = currentYear;
  let startMonth = currentMonth;

  if (currentDay < salaryDay) {
    // Current cycle started in previous month
    startMonth = currentMonth - 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear = currentYear - 1;
    }
  }

  // Cycle start: salaryDay of startMonth at 00:00:00.000
  const startDate = new Date(startYear, startMonth, salaryDay, 0, 0, 0, 0);

  // Cycle end: day before salaryDay in following month at 23:59:59.999
  let endYear = startYear;
  let endMonth = startMonth + 1;
  if (endMonth > 11) {
    endMonth = 0;
    endYear = startYear + 1;
  }

  const endDate = new Date(endYear, endMonth, salaryDay - 1, 23, 59, 59, 999);

  // Total days in this specific cycle
  const diffTime = endDate.getTime() - startDate.getTime();
  const totalDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  // Days elapsed from startDate to logicalNow (1-based)
  const elapsedDays = Math.min(
    totalDays,
    Math.max(1, Math.ceil((logicalNow.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
  );

  const remainingDays = Math.max(0, totalDays - elapsedDays);

  return {
    startDate,
    endDate,
    totalDays,
    elapsedDays,
    remainingDays,
    startLabel: formatDateShort(startDate),
    endLabel: formatDateShort(endDate)
  };
}

/**
 * Computes all financial metrics for the active cycle and today.
 * Supports mid-cycle balance override (e.g. 7.500 TL remaining until Nov 20).
 */
export function computeBudgetMetrics({
  expenses = [],
  monthlyIncome = 28000,
  salaryDay = 20,
  currentBalance = 0,
  balanceSetDate = null,
  balanceSetTimestamp = null,
  resetHour = 6,
  targetDate = new Date()
}) {
  const logicalDate = getLogicalDate(targetDate, resetHour);
  const cycle = getSalaryCycle(salaryDay, targetDate, resetHour);
  const cycleStartTs = cycle.startDate.getTime();
  const cycleEndTs = cycle.endDate.getTime();

  const todayStr = getTodayString(targetDate, resetHour);

  const balanceSetDateObj = balanceSetDate ? new Date(balanceSetDate + 'T00:00:00') : null;
  const balanceSetTs = balanceSetTimestamp || (balanceSetDateObj ? balanceSetDateObj.getTime() : 0);

  // Determine if mid-cycle balance override is active:
  const isBalanceActive = Boolean(
    currentBalance > 0 &&
    balanceSetDateObj &&
    balanceSetDateObj >= cycle.startDate &&
    logicalDate >= balanceSetDateObj &&
    logicalDate <= cycle.endDate
  );

  // Relevant starting budget & reference date
  const effectiveStartingBudget = isBalanceActive ? currentBalance : monthlyIncome;
  const effectiveStartDateStr = isBalanceActive ? balanceSetDate : getTodayString(cycle.startDate, 0);

  // Days left from today (inclusive) until next salary day
  const todayMidnight = new Date(logicalDate.getFullYear(), logicalDate.getMonth(), logicalDate.getDate(), 0, 0, 0, 0);
  const nextSalaryMidnight = new Date(cycle.endDate.getFullYear(), cycle.endDate.getMonth(), cycle.endDate.getDate() + 1, 0, 0, 0, 0);
  const daysLeftInPeriod = Math.max(1, Math.round((nextSalaryMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)));

  let cycleTotalSpent = 0;
  let todayTotalSpent = 0;
  let todayActiveSpent = 0;
  let periodSpentSinceBalanceSet = 0;
  let pastExpensesBeforeToday = 0;
  const categoryTotals = {};

  for (const exp of expenses) {
    const expTs = exp.timestamp || new Date(exp.date).getTime();
    const amount = Number(exp.amount) || 0;
    const expDateStr = exp.date || getTodayString(new Date(expTs), resetHour);

    // Check if within current salary cycle
    if (expTs >= cycleStartTs && expTs <= cycleEndTs) {
      cycleTotalSpent += amount;

      const catName = exp.category || 'Diğer';
      const catIcon = exp.categoryIcon || '📦';
      if (!categoryTotals[catName]) {
        categoryTotals[catName] = { name: catName, icon: catIcon, total: 0, count: 0 };
      }
      categoryTotals[catName].total += amount;
      categoryTotals[catName].count += 1;

      // Track spending specifically since balance was set
      if (balanceSetTs > 0 && expTs >= balanceSetTs) {
        periodSpentSinceBalanceSet += amount;
      }
    }

    // Past expenses in the active cycle made before today
    if (isBalanceActive) {
      if (expTs >= balanceSetTs && expDateStr < todayStr && expTs <= cycleEndTs) {
        pastExpensesBeforeToday += amount;
      }
    } else {
      if (expDateStr >= effectiveStartDateStr && expDateStr < todayStr && expTs <= cycleEndTs) {
        pastExpensesBeforeToday += amount;
      }
    }

    // Check if spent today (based on logical date)
    if (expDateStr === todayStr) {
      todayTotalSpent += amount;
      if (isBalanceActive) {
        if (expTs >= balanceSetTs) {
          todayActiveSpent += amount;
        }
      } else {
        todayActiveSpent += amount;
      }
    }
  }

  // 1. Money remaining at the START of today (before today's expenses)
  const remainingAtStartOfToday = Math.max(0, effectiveStartingBudget - pastExpensesBeforeToday);

  // 2. Dynamic daily allowance:
  // Calculated at start of day: total remaining divided by remaining days
  // Stays FIXED during today so today's expenses are deducted from it!
  const dailyAllowance = daysLeftInPeriod > 0 ? (remainingAtStartOfToday / daysLeftInPeriod) : 0;

  // 3. Today's net status (+ is under budget/karda, - is over budget/aşma)
  const todayNet = dailyAllowance - todayActiveSpent;
  const isTodaySurplus = todayNet >= 0;

  // 4. Overall remaining budget across the period
  const totalSpentInPeriod = pastExpensesBeforeToday + todayActiveSpent;
  const cycleRemaining = Math.max(0, effectiveStartingBudget - totalSpentInPeriod);
  const cyclePercentSpent = effectiveStartingBudget > 0
    ? Math.min(100, Math.max(0, (totalSpentInPeriod / effectiveStartingBudget) * 100))
    : 0;

  // Average spent per day elapsed in cycle
  const avgDailySpent = cycle.elapsedDays > 0 ? (cycleTotalSpent / cycle.elapsedDays) : 0;

  // Sorted categories by total spending
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

  return {
    cycle,
    isBalanceActive,
    daysLeftInPeriod,
    monthlyIncome: isBalanceActive ? currentBalance : monthlyIncome,
    baseIncome: monthlyIncome,
    remainingAtStartOfToday,
    dailyAllowance,
    todayTotalSpent,
    todayActiveSpent,
    todayNet,
    isTodaySurplus,
    cycleTotalSpent: isBalanceActive ? periodSpentSinceBalanceSet : cycleTotalSpent,
    allCycleSpent: cycleTotalSpent,
    cycleRemaining,
    cyclePercentSpent,
    avgDailySpent,
    categories: sortedCategories,
    todayStr
  };
}

/**
 * Computes daily spending history for the calendar modal.
 * Dynamically computes the historical daily allowance for each past day.
 */
export function computeDailyHistory({
  expenses = [],
  dailyAllowance = 0,
  monthlyIncome = null,
  salaryDay = null,
  currentBalance = 0,
  balanceSetDate = null,
  targetDate = new Date(),
  resetHour = 6,
  daysCount = 14,
  minDate = null
}) {
  const logicalNow = getLogicalDate(targetDate, resetHour);
  const todayStr = getTodayString(targetDate, resetHour);

  // Group all expenses by date string
  const expensesByDate = {};
  for (const exp of expenses) {
    if (!exp.date) continue;
    if (!expensesByDate[exp.date]) {
      expensesByDate[exp.date] = [];
    }
    expensesByDate[exp.date].push(exp);
  }

  const history = [];

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(logicalNow);
    d.setDate(d.getDate() - i);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Never show days before minDate (e.g. 4 Kasım 2026)
    if (minDate && dateStr < minDate) {
      break;
    }

    // Dynamic historical allowance for this specific day
    let dayAllowance = dailyAllowance;

    if (salaryDay && (currentBalance > 0 || (monthlyIncome !== null && monthlyIncome > 0))) {
      const cycleOnDay = getSalaryCycle(salaryDay, d, resetHour);
      const isBalanceActiveOnDay = Boolean(
        currentBalance > 0 &&
        balanceSetDate &&
        dateStr >= balanceSetDate &&
        d <= cycleOnDay.endDate
      );

      const effectiveBudget = isBalanceActiveOnDay ? currentBalance : monthlyIncome;
      const effectiveStartStr = isBalanceActiveOnDay ? balanceSetDate : getTodayString(cycleOnDay.startDate, 0);

      const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      const nextSalaryMidnight = new Date(cycleOnDay.endDate.getFullYear(), cycleOnDay.endDate.getMonth(), cycleOnDay.endDate.getDate() + 1, 0, 0, 0, 0);
      const daysLeftOnDay = Math.max(1, Math.round((nextSalaryMidnight.getTime() - dMidnight.getTime()) / (1000 * 60 * 60 * 24)));

      let pastExpBeforeDay = 0;
      for (const exp of expenses) {
        const expDate = exp.date;
        if (expDate && expDate >= effectiveStartStr && expDate < dateStr) {
          pastExpBeforeDay += (Number(exp.amount) || 0);
        }
      }

      const remainingStartOfDay = Math.max(0, effectiveBudget - pastExpBeforeDay);
      dayAllowance = daysLeftOnDay > 0 ? (remainingStartOfDay / daysLeftOnDay) : 0;
    }

    const dayItems = expensesByDate[dateStr] || [];
    const totalSpent = dayItems.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const net = dayAllowance - totalSpent;
    const isSurplus = net >= 0;

    let relativeLabel = '';
    if (i === 0) {
      relativeLabel = 'Bugün';
    } else if (i === 1) {
      relativeLabel = 'Dün';
    } else {
      relativeLabel = d.toLocaleDateString('tr-TR', { weekday: 'short' });
    }

    const fullDateLabel = d.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'long'
    });

    history.push({
      dateStr,
      relativeLabel,
      fullDateLabel,
      totalSpent,
      dailyAllowance: dayAllowance,
      net,
      isSurplus,
      items: dayItems,
      hasExpenses: dayItems.length > 0
    });
  }

  return history;
}

export function formatDateShort(d) {
  const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatCurrency(amount, hideDecimals = false) {
  const val = Number(amount) || 0;
  if (hideDecimals || Number.isInteger(val)) {
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(val) + ' ₺';
  }
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val) + ' ₺';
}

export function formatTime(ts) {
  const date = new Date(ts);
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}
