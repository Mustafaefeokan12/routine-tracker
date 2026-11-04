/**
 * Financial & Date Calculation Engine for Budget App
 * Designed for Mustafa Efe Okan's Salary Cycle & Daily Allowance Model
 */

/**
 * Returns the current salary cycle based on salaryDay (default 20).
 * e.g., if salaryDay is 20 and today is Nov 4:
 * cycle is Oct 20 to Nov 19 (inclusive).
 */
export function getSalaryCycle(salaryDay = 20, targetDate = new Date()) {
  const currentDay = targetDate.getDate();
  const currentMonth = targetDate.getMonth();
  const currentYear = targetDate.getFullYear();

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

  // Days elapsed from startDate to targetDate (1-based)
  const elapsedDays = Math.min(
    totalDays,
    Math.max(1, Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
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
 */
export function computeBudgetMetrics({
  expenses = [],
  monthlyIncome = 28000,
  salaryDay = 20,
  targetDate = new Date()
}) {
  const cycle = getSalaryCycle(salaryDay, targetDate);
  const cycleStartTs = cycle.startDate.getTime();
  const cycleEndTs = cycle.endDate.getTime();

  const todayStr = getTodayString(targetDate);

  let cycleTotalSpent = 0;
  let todayTotalSpent = 0;
  const categoryTotals = {};

  for (const exp of expenses) {
    const expTs = exp.timestamp || new Date(exp.date).getTime();
    const amount = Number(exp.amount) || 0;

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
    }

    // Check if spent today
    if (exp.date === todayStr) {
      todayTotalSpent += amount;
    }
  }

  // Daily Allowance Formula: Monthly Income / Total Days in Cycle
  const dailyAllowance = cycle.totalDays > 0 ? (monthlyIncome / cycle.totalDays) : 0;

  // Today's Balance (+ is positive/karda, - is overspent/aşma)
  const todayNet = dailyAllowance - todayTotalSpent;
  const isTodaySurplus = todayNet >= 0;

  // Monthly Remaining Balance
  const cycleRemaining = monthlyIncome - cycleTotalSpent;
  const cyclePercentSpent = monthlyIncome > 0 ? Math.min(100, Math.max(0, (cycleTotalSpent / monthlyIncome) * 100)) : 0;

  // Average spent per day elapsed in cycle
  const avgDailySpent = cycle.elapsedDays > 0 ? (cycleTotalSpent / cycle.elapsedDays) : 0;

  // Sorted categories by total spending
  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.total - a.total);

  return {
    cycle,
    monthlyIncome,
    dailyAllowance,
    todayTotalSpent,
    todayNet,
    isTodaySurplus,
    cycleTotalSpent,
    cycleRemaining,
    cyclePercentSpent,
    avgDailySpent,
    categories: sortedCategories,
    todayStr
  };
}

export function getTodayString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
