/**
 * Pure calculation helpers matching PROJECT.md and survey_spec_miner_1/analysis.md
 */

import { getPastDaysList } from '../../src/utils/date.js';

export function calculateTodayTerea(todaySticks, stickPrice) {
  const safeSticks = Math.max(0, Math.floor(todaySticks || 0));
  const safePrice = Number(stickPrice) > 0 ? Number(stickPrice) : 6.0;
  
  return {
    todaySticks: safeSticks,
    stickPrice: safePrice,
    packPrice: safePrice * 20,
    todaySpent: (safeSticks * safePrice).toFixed(1),
    todayPacks: (safeSticks / 20).toFixed(1)
  };
}

export function decrementSticks(currentSticks) {
  return Math.max(0, (currentSticks || 0) - 1);
}

export function incrementSticks(currentSticks) {
  return Math.max(0, (currentSticks || 0) + 1);
}

export function validateStickPrice(input) {
  const num = Number(input);
  if (isNaN(num) || num <= 0) {
    return { valid: false, price: 6.0 };
  }
  return { valid: true, price: num };
}

export function calculateTereaStats({
  todaySticks = 0,
  stickPrice = 6.0,
  daysMap = {},
  todayStr,
  resetHour = 4
}) {
  const safeTodaySticks = Math.max(0, Math.floor(todaySticks));
  const safePrice = Number(stickPrice) > 0 ? Number(stickPrice) : 6.0;

  // Derive todayStr if not passed
  let resolvedTodayStr = todayStr;
  if (!resolvedTodayStr) {
    const d = new Date();
    if (d.getHours() < resetHour) d.setDate(d.getDate() - 1);
    resolvedTodayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  const past7Days = getPastDaysList(7, resetHour);
  const [year, month] = resolvedTodayStr.split('-');
  const currentMonthPrefix = `${year}-${month}`;

  let weekSticks = 0;
  let monthSticks = 0;
  let allTimeSticks = 0;
  let trackedDaysWithTerea = 0;

  Object.keys(daysMap).forEach((date) => {
    const count = Math.max(0, daysMap[date]?.tereaCount || 0);
    allTimeSticks += count;
    if (count > 0) trackedDaysWithTerea++;

    if (past7Days.includes(date)) {
      weekSticks += count;
    }
    if (date.startsWith(currentMonthPrefix)) {
      monthSticks += count;
    }
  });

  const weekSpent = weekSticks * safePrice;
  const weekPacks = (weekSticks / 20).toFixed(1);

  const monthSpent = monthSticks * safePrice;
  const monthPacks = (monthSticks / 20).toFixed(1);

  const allTimeSpent = allTimeSticks * safePrice;
  const allTimePacks = (allTimeSticks / 20).toFixed(1);

  const dailyAvgSticks = trackedDaysWithTerea > 0
    ? (allTimeSticks / Math.max(trackedDaysWithTerea, 1)).toFixed(1)
    : safeTodaySticks.toFixed(1);

  const projectedMonthSpent = (Number(dailyAvgSticks) * 30 * safePrice).toFixed(0);

  return {
    todaySticks: safeTodaySticks,
    stickPrice: safePrice,
    packPrice: safePrice * 20,
    todaySpent: (safeTodaySticks * safePrice).toFixed(1),
    todayPacks: (safeTodaySticks / 20).toFixed(1),
    weekSticks,
    weekSpent,
    weekPacks,
    monthSticks,
    monthSpent,
    monthPacks,
    allTimeSticks,
    allTimeSpent,
    allTimePacks,
    dailyAvgSticks,
    projectedMonthSpent
  };
}

export function calculateGamification(totalScore = 0, dailyScore = 0, targetScore = 100) {
  const safeTotal = Math.max(0, Math.floor(totalScore || 0));
  const safeDaily = Math.max(0, Math.floor(dailyScore || 0));
  const safeTarget = targetScore > 0 ? targetScore : 100;

  const currentLevel = Math.min(Math.floor(safeTotal / 100) + 1, 99);
  const currentExp = safeTotal % 100;
  const nextLevelExp = 100;

  let letterGrade = 'FF';
  let gradeColor = 'text-rose-400';
  if (safeDaily >= 95) {
    letterGrade = 'AA';
    gradeColor = 'text-emerald-400';
  } else if (safeDaily >= 85) {
    letterGrade = 'BA';
    gradeColor = 'text-emerald-300';
  } else if (safeDaily >= 70) {
    letterGrade = 'BB';
    gradeColor = 'text-cyan-400';
  } else if (safeDaily >= 60) {
    letterGrade = 'CB';
    gradeColor = 'text-amber-400';
  } else if (safeDaily >= 50) {
    letterGrade = 'CC';
    gradeColor = 'text-amber-500';
  }

  const percentage = Math.min(Math.round((safeDaily / safeTarget) * 100), 100);
  const isOverachieved = safeDaily > safeTarget;

  return {
    currentLevel,
    currentExp,
    nextLevelExp,
    letterGrade,
    gradeColor,
    percentage,
    isOverachieved,
    bonusPoints: isOverachieved ? safeDaily - safeTarget : 0
  };
}
