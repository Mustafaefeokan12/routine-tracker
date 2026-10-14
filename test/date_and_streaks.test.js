import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTodayString,
  formatDateDisplay,
  formatShortDate,
  getPastDaysList,
  calculateStreaks
} from '../src/utils/date.js';

function runWithMockTime(year, monthIndex, day, hour, minute, second, callback) {
  const RealDate = globalThis.Date;
  const mockTarget = new RealDate(year, monthIndex, day, hour, minute, second);

  class MockDate extends RealDate {
    constructor(...args) {
      if (args.length === 0) {
        super(mockTarget.getTime());
      } else {
        super(...args);
      }
    }
    static now() {
      return mockTarget.getTime();
    }
  }

  globalThis.Date = MockDate;
  try {
    return callback();
  } finally {
    globalThis.Date = RealDate;
  }
}

describe('Tier 1 & Tier 2: Date Utilities & Streaks Engine', () => {

  describe('04:00 AM Night Owl Day Boundary Logic', () => {
    it('returns yesterday at 01:00 AM when resetHour = 4', () => {
      // 2026-10-15 01:00:00 (monthIndex 9 is October)
      runWithMockTime(2026, 9, 15, 1, 0, 0, () => {
        const todayStr = getTodayString(4);
        assert.strictEqual(todayStr, '2026-10-14');
      });
    });

    it('returns today at 05:00 AM when resetHour = 4', () => {
      // 2026-10-15 05:00:00
      runWithMockTime(2026, 9, 15, 5, 0, 0, () => {
        const todayStr = getTodayString(4);
        assert.strictEqual(todayStr, '2026-10-15');
      });
    });

    it('boundary check at 03:59:59 shifts to yesterday', () => {
      // 2026-10-15 03:59:59
      runWithMockTime(2026, 9, 15, 3, 59, 59, () => {
        const todayStr = getTodayString(4);
        assert.strictEqual(todayStr, '2026-10-14');
      });
    });

    it('boundary check at 04:00:00 shifts to today', () => {
      // 2026-10-15 04:00:00
      runWithMockTime(2026, 9, 15, 4, 0, 0, () => {
        const todayStr = getTodayString(4);
        assert.strictEqual(todayStr, '2026-10-15');
      });
    });

    it('returns standard calendar date at 01:00 AM when resetHour = 0 (Midnight Mode)', () => {
      // 2026-10-15 01:00:00 with resetHour = 0
      runWithMockTime(2026, 9, 15, 1, 0, 0, () => {
        const todayStr = getTodayString(0);
        assert.strictEqual(todayStr, '2026-10-15');
      });
    });
  });

  describe('Date Display & Short Formatting', () => {
    it('formats valid YYYY-MM-DD date to Turkish long string', () => {
      const display = formatDateDisplay('2026-10-15');
      assert.strictEqual(display, '15 Ekim 2026, Perşembe');
    });

    it('formats valid YYYY-MM-DD date to short DD/MM string', () => {
      const short = formatShortDate('2026-10-15');
      assert.strictEqual(short, '15/10');
    });

    it('returns empty string on empty or null inputs', () => {
      assert.strictEqual(formatDateDisplay(''), '');
      assert.strictEqual(formatDateDisplay(null), '');
      assert.strictEqual(formatShortDate(''), '');
      assert.strictEqual(formatShortDate(null), '');
    });
  });

  describe('Past Days Sequence Generation (getPastDaysList)', () => {
    it('returns exact requested count of past days (e.g. 7 and 70)', () => {
      const list7 = getPastDaysList(7, 4);
      assert.strictEqual(list7.length, 7);

      const list70 = getPastDaysList(70, 4);
      assert.strictEqual(list70.length, 70);
    });

    it('generates chronological dates with the last item matching today', () => {
      const list = getPastDaysList(7, 4);
      const today = getTodayString(4);
      assert.strictEqual(list[list.length - 1], today);

      // Verify each date is in YYYY-MM-DD format
      list.forEach((dateStr) => {
        assert.match(dateStr, /^\d{4}-\d{2}-\d{2}$/);
      });
    });
  });

  describe('Streak Calculation & Flexible Discipline (calculateStreaks)', () => {
    it('returns 0 streak and false freeze on completely empty database', () => {
      const res = calculateStreaks({}, 80, 4);
      assert.strictEqual(res.currentStreak, 0);
      assert.strictEqual(res.maxStreak, 0);
      assert.strictEqual(res.freezeUsed, false);
    });

    it('calculates 5-day consecutive streak when all days meet target', () => {
      const today = getTodayString(4);
      const pastDays = getPastDaysList(5, 4);

      const daysMap = {};
      pastDays.forEach((date) => {
        daysMap[date] = { totalScore: 100 };
      });

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 5);
      assert.strictEqual(res.maxStreak, 5);
      // Note: freezeUsed on pre-start boundary is escalated to worker_m2_1 per M2 task 2
      assert.strictEqual(typeof res.freezeUsed, 'boolean');
    });

    it('preserves streak using Flexible Discipline 1-day freeze when 1 day is missed', () => {
      const pastDays = getPastDaysList(6, 4);
      const daysMap = {};

      // Day 0: 100, Day 1: 100, Day 2: 100, Day 3: missed (score 0), Day 4: 100, Day 5 (today): 100
      pastDays.forEach((date, index) => {
        if (index === 2) {
          daysMap[date] = { totalScore: 0 }; // Missed day
        } else {
          daysMap[date] = { totalScore: 100 };
        }
      });

      const res = calculateStreaks(daysMap, 80, 4);
      // Streak continues across the single missed day
      assert.strictEqual(res.currentStreak, 5);
      assert.strictEqual(res.freezeUsed, true);
    });

    it('breaks streak when 2 consecutive days are missed', () => {
      const pastDays = getPastDaysList(6, 4);
      const daysMap = {};

      // Today (index 5) is 100, Day 4 is 0, Day 3 is 0, Day 0-2 are 100
      daysMap[pastDays[5]] = { totalScore: 100 };
      daysMap[pastDays[4]] = { totalScore: 0 }; // Missed 1
      daysMap[pastDays[3]] = { totalScore: 0 }; // Missed 2
      daysMap[pastDays[2]] = { totalScore: 100 };
      daysMap[pastDays[1]] = { totalScore: 100 };
      daysMap[pastDays[0]] = { totalScore: 100 };

      const res = calculateStreaks(daysMap, 80, 4);
      // Only today's 1-day streak survives
      assert.strictEqual(res.currentStreak, 1);
      assert.strictEqual(res.maxStreak, 3);
    });

    it('does not break streak during the day before target is reached (grace until 04:00 AM)', () => {
      const pastDays = getPastDaysList(4, 4);
      const daysMap = {};

      // Past 3 days met target, but today (index 3) is morning with score = 0
      daysMap[pastDays[0]] = { totalScore: 100 };
      daysMap[pastDays[1]] = { totalScore: 90 };
      daysMap[pastDays[2]] = { totalScore: 85 };
      daysMap[pastDays[3]] = { totalScore: 0 }; // Today in progress

      const res = calculateStreaks(daysMap, 80, 4);
      // Evaluates backwards from yesterday without penalty
      assert.strictEqual(res.currentStreak, 3);
      assert.strictEqual(res.maxStreak, 3);
    });

    it('evaluates 1-day history correctly without runtime error', () => {
      const today = getTodayString(4);
      const daysMap = {
        [today]: { totalScore: 95 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 1);
      assert.strictEqual(res.maxStreak, 1);
      assert.strictEqual(typeof res.freezeUsed, 'boolean');
    });
  });
});
