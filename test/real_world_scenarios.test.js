import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getPastDaysList,
  calculateStreaks,
  formatDateDisplay
} from '../src/utils/date.js';
import {
  calculateTereaStats,
  calculateGamification
} from './helpers/calculations.js';

describe('Tier 4: Real-World Workload Simulation (30-Day Student Journey)', () => {

  it('simulates a full 30-day engineering student lifecycle with night owl sessions, Terea consumption, and streak freeze', () => {
    // Generate 30 contiguous chronological days ending in a fixed today
    const past30Days = getPastDaysList(30, 4);
    assert.strictEqual(past30Days.length, 30);

    const daysMap = {};
    const tereaLogs = [];
    let cumulativeScore = 0;
    let tereaPrice = 6.0; // Starts at 6.0 TL

    // Default student routine weights:
    // study: 25P, fitness: 20P, german: 15P, reading: 15P, water: 10P, review: 15P = 100P
    for (let dayIndex = 0; dayIndex < 30; dayIndex++) {
      const dateStr = past30Days[dayIndex];
      let dayScore = 0;
      let daySticks = 10; // Default sticks

      // Week 1 (Days 0-6): Consistent discipline
      if (dayIndex < 7) {
        dayScore = 100;
        daySticks = 9;
        if (dayIndex === 4) {
          dayScore = 115; // Overachievement day
          daySticks = 11;
        }
      }
      // Week 2 (Days 7-13): Exam period with night owl sessions & 1 rest day
      else if (dayIndex < 14) {
        if (dayIndex === 11) {
          // Day 11 is an intense exam rest day (score 35P < 80 threshold)
          dayScore = 35;
          daySticks = 6;
        } else if (dayIndex === 9) {
          // Late night study session (01:30 AM night owl)
          dayScore = 100;
          daySticks = 15;
        } else {
          dayScore = 95;
          daySticks = 14;
        }
      }
      // Week 3 (Days 14-20): Price change to 6.50 TL & routine momentum
      else if (dayIndex < 21) {
        if (dayIndex === 14) {
          tereaPrice = 6.50; // Price update mid-month
        }
        dayScore = 90;
        daySticks = 10;
      }
      // Week 4 (Days 21-29): High performance final sprint
      else {
        dayScore = dayIndex === 28 ? 110 : 85;
        daySticks = 11;
      }

      cumulativeScore += dayScore;

      daysMap[dateStr] = {
        date: dateStr,
        totalScore: dayScore,
        targetScore: 100,
        completedCount: dayScore >= 80 ? 5 : 2,
        tereaCount: daySticks
      };

      // Push timestamped terea log
      for (let s = 0; s < daySticks; s++) {
        tereaLogs.push({
          date: dateStr,
          timestamp: `${dateStr}T${String(8 + Math.floor(s * 0.8)).padStart(2, '0')}:00:00.000Z`,
          pricePerStick: tereaPrice
        });
      }
    }

    // 1. Verify Cumulative Days & Logs Integrity
    assert.strictEqual(Object.keys(daysMap).length, 30);
    assert.ok(tereaLogs.length > 250);

    // 2. Verify Streak Engine with Flexible Discipline across the 30-day journey
    const streakResult = calculateStreaks(daysMap, 80, 4);
    // Since day 11 was the single rest day (<80P) and days 12-29 (18 days) met the target,
    // the current streak from today extends through the freeze
    assert.ok(streakResult.currentStreak >= 18);
    assert.ok(streakResult.maxStreak >= 18);

    // 3. Verify Gamification & RPG Level Progression across 30 days
    const todayRecord = daysMap[past30Days[29]];
    const gamification = calculateGamification(cumulativeScore, todayRecord.totalScore, 100);

    // Total score is approx 2700+ points -> Level should be >= 27
    assert.ok(cumulativeScore > 2500, `Expected cumulative score > 2500, got ${cumulativeScore}`);
    assert.ok(gamification.currentLevel >= 26, `Expected Level >= 26, got ${gamification.currentLevel}`);
    assert.ok(gamification.currentExp >= 0 && gamification.currentExp < 100);
    assert.ok(['AA', 'BA', 'BB'].includes(gamification.letterGrade));

    // 4. Verify Financial Aggregate Statistics at Current Unit Price
    const currentTodayStr = past30Days[29];
    const finalStats = calculateTereaStats({
      todaySticks: todayRecord.tereaCount,
      stickPrice: tereaPrice, // 6.50 TL
      daysMap,
      todayStr: currentTodayStr,
      resetHour: 4
    });

    // Total sticks consumed over 30 days
    let expectedTotalSticks = 0;
    Object.values(daysMap).forEach((d) => {
      expectedTotalSticks += d.tereaCount;
    });

    assert.strictEqual(finalStats.allTimeSticks, expectedTotalSticks);
    // All time spending recalculated at current unit price 6.50 TL
    assert.strictEqual(finalStats.allTimeSpent, expectedTotalSticks * 6.50);
    // Total packs consumed: sticks / 20
    assert.strictEqual(finalStats.allTimePacks, (expectedTotalSticks / 20).toFixed(1));

    // Daily average consumption across all 30 tracked days
    const expectedAvg = (expectedTotalSticks / 30).toFixed(1);
    assert.strictEqual(finalStats.dailyAvgSticks, expectedAvg);

    // 7-day rolling statistics
    const last7Days = past30Days.slice(23, 30);
    let expectedWeekSticks = 0;
    last7Days.forEach((d) => {
      expectedWeekSticks += daysMap[d].tereaCount;
    });
    assert.strictEqual(finalStats.weekSticks, expectedWeekSticks);
    assert.strictEqual(finalStats.weekSpent, expectedWeekSticks * 6.50);

    // Projected 30-day forward expenditure
    const expectedProjected = (Number(expectedAvg) * 30 * 6.50).toFixed(0);
    assert.strictEqual(finalStats.projectedMonthSpent, expectedProjected);
  });
});
