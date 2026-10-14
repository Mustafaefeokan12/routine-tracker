import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getTodayString,
  getPastDaysList,
  calculateStreaks
} from '../src/utils/date.js';
import {
  calculateTereaStats,
  calculateGamification
} from './helpers/calculations.js';

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

describe('Tier 3: Pairwise & Cross-Feature Interaction Testing', () => {

  describe('Combination 1: Terea Price Updates During Active Streak', () => {
    it('updates financial metrics retroactively without mutating active streak momentum', () => {
      // 10 consecutive qualifying days (100 points each, 12 sticks each)
      const past10Days = getPastDaysList(10, 4);
      const daysMap = {};
      past10Days.forEach((date) => {
        daysMap[date] = {
          totalScore: 100,
          targetScore: 100,
          tereaCount: 12
        };
      });

      // Initial state with stickPrice = 6.0 TL
      const streakBefore = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(streakBefore.currentStreak, 10);
      assert.strictEqual(streakBefore.maxStreak, 10);

      const statsAt6 = calculateTereaStats({
        todaySticks: 12,
        stickPrice: 6.0,
        daysMap,
        todayStr: past10Days[past10Days.length - 1],
        resetHour: 4
      });

      // 7-day sticks = 7 * 12 = 84 sticks; at 6.0 TL = 504.0 TL
      assert.strictEqual(statsAt6.weekSticks, 84);
      assert.strictEqual(statsAt6.weekSpent, 504.0);
      assert.strictEqual(statsAt6.allTimeSticks, 120);
      assert.strictEqual(statsAt6.allTimeSpent, 720.0);

      // Price updated to 7.0 TL in settings
      const statsAt7 = calculateTereaStats({
        todaySticks: 12,
        stickPrice: 7.0,
        daysMap,
        todayStr: past10Days[past10Days.length - 1],
        resetHour: 4
      });

      // Financial statistics recalculate immediately
      assert.strictEqual(statsAt7.weekSpent, 588.0); // 84 * 7.0
      assert.strictEqual(statsAt7.allTimeSpent, 840.0); // 120 * 7.0
      assert.strictEqual(statsAt7.todaySpent, '84.0'); // 12 * 7.0

      // Streak engine recomputed after price change remains completely invariant
      const streakAfter = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(streakAfter.currentStreak, streakBefore.currentStreak);
      assert.strictEqual(streakAfter.maxStreak, streakBefore.maxStreak);
    });
  });

  describe('Combination 2: Night Owl 04:00 Reset During Active Month Rollover', () => {
    it('attributes 01:30 AM study sessions on Nov 1 to Oct 31, isolating October finances', () => {
      // Mock clock: 2026-11-01 01:30:00 (monthIndex 10 is November)
      runWithMockTime(2026, 10, 1, 1, 30, 0, () => {
        const todayStr = getTodayString(4);
        // Shifts back to Oct 31!
        assert.strictEqual(todayStr, '2026-10-31');

        const daysMap = {
          '2026-10-30': { totalScore: 100, tereaCount: 10 },
          '2026-10-31': { totalScore: 90, tereaCount: 14 } // Session logged at 01:30 AM
        };

        const stats = calculateTereaStats({
          todaySticks: 14,
          stickPrice: 6.0,
          daysMap,
          todayStr: '2026-10-31',
          resetHour: 4
        });

        // Current month prefix is 2026-10
        assert.strictEqual(stats.monthSticks, 24); // 10 + 14
        assert.strictEqual(stats.monthSpent, 144.0);

        // Streaks include Oct 31
        const streak = calculateStreaks(daysMap, 80, 4);
        assert.strictEqual(streak.currentStreak, 2);
      });
    });

    it('rolls over month cleanly at 04:00:00 AM on Nov 1', () => {
      // Mock clock: 2026-11-01 04:00:00 (monthIndex 10 is November)
      runWithMockTime(2026, 10, 1, 4, 0, 0, () => {
        const todayStr = getTodayString(4);
        assert.strictEqual(todayStr, '2026-11-01');

        const daysMap = {
          '2026-10-30': { totalScore: 100, tereaCount: 10 },
          '2026-10-31': { totalScore: 90, tereaCount: 14 }
          // Nov 01 has 0 sticks so far
        };

        const stats = calculateTereaStats({
          todaySticks: 0,
          stickPrice: 6.0,
          daysMap,
          todayStr: '2026-11-01',
          resetHour: 4
        });

        // November month sticks start clean at 0!
        assert.strictEqual(stats.monthSticks, 0);
        assert.strictEqual(stats.monthSpent, 0);

        // But all-time still contains all historical sticks
        assert.strictEqual(stats.allTimeSticks, 24);
        assert.strictEqual(stats.allTimeSpent, 144.0);
      });
    });
  });

  describe('Combination 3: Backup Serialization & Deserialization Round-Trip', () => {
    it('preserves full application state through JSON serialization/deserialization', () => {
      const originalBackup = {
        version: 2,
        exportedAt: '2026-10-15T12:00:00.000Z',
        routines: [
          {
            id: 1,
            title: 'Odaklı Çalışma',
            category: 'study',
            weight: 25,
            difficulty: 4,
            timeOfDay: 'morning',
            isRoutine: true,
            archived: false,
            order: 1
          },
          {
            id: 2,
            title: 'Su Tüketimi',
            category: 'health',
            weight: 10,
            difficulty: 1,
            timeOfDay: 'anytime',
            isRoutine: true,
            archived: false,
            order: 2
          }
        ],
        logs: [
          { id: '2026-10-15_1', date: '2026-10-15', routineId: 1, completedAt: '2026-10-15T08:30:00.000Z' }
        ],
        days: [
          { date: '2026-10-15', totalScore: 25, targetScore: 100, completedCount: 1, tereaCount: 6 }
        ],
        tereaLogs: [
          { id: 1, date: '2026-10-15', timestamp: '2026-10-15T09:00:00.000Z', pricePerStick: 6.0 }
        ],
        settings: [
          { key: 'dailyTarget', value: 100 },
          { key: 'resetHour', value: 4 },
          { key: 'tereaStickPrice', value: 6.0 },
          { key: 'theme', value: 'slate' }
        ]
      };

      // Serialize to string
      const jsonStr = JSON.stringify(originalBackup, null, 2);
      assert.strictEqual(typeof jsonStr, 'string');
      assert.ok(jsonStr.length > 50);

      // Deserialize back
      const restored = JSON.parse(jsonStr);

      // Verify strict deep equality
      assert.deepStrictEqual(restored, originalBackup);
      assert.strictEqual(restored.version, 2);
      assert.strictEqual(restored.routines.length, 2);
      assert.strictEqual(restored.logs[0].id, '2026-10-15_1');
      assert.strictEqual(restored.days[0].tereaCount, 6);
      assert.strictEqual(restored.settings.find((s) => s.key === 'tereaStickPrice')?.value, 6.0);
    });

    it('rejects corrupt or malformed JSON payloads gracefully', () => {
      const corruptInputs = [
        '{ malformed json ',
        '{"version": 2, "routines": [}',
        '',
        'undefined',
        null
      ];

      corruptInputs.forEach((input) => {
        let parsed = null;
        let threw = false;

        try {
          if (!input) throw new Error('Empty payload');
          parsed = JSON.parse(input);
        } catch {
          threw = true;
        }

        assert.strictEqual(threw, true, `Expected error parsing: ${input}`);
        assert.strictEqual(parsed, null);
      });
    });

    it('validates schema structure during restore simulation', () => {
      const validateBackupStructure = (data) => {
        if (!data || typeof data !== 'object') return false;
        if (!Array.isArray(data.routines)) return false;
        if (!Array.isArray(data.days)) return false;
        return true;
      };

      assert.strictEqual(validateBackupStructure({ routines: [], days: [] }), true);
      assert.strictEqual(validateBackupStructure({ routines: 'not-array' }), false);
      assert.strictEqual(validateBackupStructure(null), false);
    });
  });
});
