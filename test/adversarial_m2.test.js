import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { db, DEFAULT_ROUTINES, restoreBackupData } from '../src/db/index.js';
import {
  getTodayString,
  getShiftedDateStr,
  calculateStreaks
} from '../src/utils/date.js';

describe('Adversarial Verification Suite - Milestone M2 (challenger_m2_1)', () => {

  describe('1. Dexie v3 Schema & Compound Index Verification', () => {
    it('verifies database version is upgraded to version 3', () => {
      assert.strictEqual(db.verno, 3, 'Dexie database version must be exactly 3');
    });

    it('verifies all 7 required stores exist in schema', () => {
      const tableNames = db.tables.map((t) => t.name).sort();
      const expectedTables = ['badges', 'days', 'logs', 'routines', 'settings', 'streaks', 'tereaLogs'].sort();
      assert.deepStrictEqual(tableNames, expectedTables, 'All 7 stores must be present in db.tables');
    });

    it('verifies [category+timeOfDay] compound index on routines store', () => {
      const routinesTable = db.routines;
      assert.ok(routinesTable, 'routines table must exist');
      
      const compoundIdx = routinesTable.schema.indexes.find(
        (idx) => idx.name === '[category+timeOfDay]'
      );
      assert.ok(compoundIdx, 'Compound index [category+timeOfDay] must exist on routines');
      assert.strictEqual(compoundIdx.compound, true, 'Compound flag must be true');
      assert.deepStrictEqual(compoundIdx.keyPath, ['category', 'timeOfDay'], 'KeyPath must be [category, timeOfDay]');
    });

    it('verifies [date+routineId] compound index on logs store', () => {
      const logsTable = db.logs;
      assert.ok(logsTable, 'logs table must exist');

      const compoundIdx = logsTable.schema.indexes.find(
        (idx) => idx.name === '[date+routineId]'
      );
      assert.ok(compoundIdx, 'Compound index [date+routineId] must exist on logs');
      assert.strictEqual(compoundIdx.compound, true, 'Compound flag must be true');
      assert.deepStrictEqual(compoundIdx.keyPath, ['date', 'routineId'], 'KeyPath must be [date, routineId]');
    });

    it('verifies routines primary key is auto-increment ++id and includes M2/M3 attributes', () => {
      const routinesSchema = db.routines.schema;
      assert.strictEqual(routinesSchema.primKey.name, 'id');
      assert.strictEqual(routinesSchema.primKey.auto, true);
      assert.strictEqual(routinesSchema.primKey.src, '++id');

      const indexNames = routinesSchema.indexes.map((i) => i.name);
      const requiredFields = ['isMit', 'isTwoMinuteRule', 'targetQuantity', 'unit', 'type', 'archived', 'order'];
      for (const field of requiredFields) {
        assert.ok(indexNames.includes(field), `routines schema must index field: ${field}`);
      }
    });

    it('verifies streaks and badges stores schemas match specification', () => {
      const streaksSchema = db.streaks.schema;
      assert.strictEqual(streaksSchema.primKey.name, 'id');
      const streakIndexes = streaksSchema.indexes.map((i) => i.name);
      assert.ok(streakIndexes.includes('currentStreak'));
      assert.ok(streakIndexes.includes('maxStreak'));
      assert.ok(streakIndexes.includes('lastCompletedDate'));
      assert.ok(streakIndexes.includes('freezeUsedDate'));

      const badgesSchema = db.badges.schema;
      assert.strictEqual(badgesSchema.primKey.name, 'id');
      const badgeIndexes = badgesSchema.indexes.map((i) => i.name);
      assert.ok(badgeIndexes.includes('title'));
      assert.ok(badgeIndexes.includes('category'));
      assert.ok(badgeIndexes.includes('unlockedAt'));
      assert.ok(badgeIndexes.includes('icon'));
    });

    it('verifies DEFAULT_ROUTINES seed array conforms to Dexie v3 schema attributes', () => {
      assert.ok(Array.isArray(DEFAULT_ROUTINES));
      assert.ok(DEFAULT_ROUTINES.length >= 6);

      for (const routine of DEFAULT_ROUTINES) {
        assert.strictEqual(typeof routine.title, 'string');
        assert.strictEqual(typeof routine.category, 'string');
        assert.strictEqual(typeof routine.timeOfDay, 'string');
        assert.strictEqual(typeof routine.weight, 'number');
        assert.strictEqual(typeof routine.difficulty, 'number');
        assert.strictEqual(typeof routine.isRoutine, 'boolean');
        assert.strictEqual(typeof routine.isMit, 'boolean');
        assert.strictEqual(typeof routine.isTwoMinuteRule, 'boolean');
        assert.strictEqual(typeof routine.targetQuantity, 'number');
        assert.strictEqual(typeof routine.unit, 'string');
        assert.strictEqual(typeof routine.type, 'string');
        assert.strictEqual(typeof routine.archived, 'boolean');
        assert.strictEqual(typeof routine.order, 'number');
      }
    });
  });

  describe('2. Atomic Transactional Rollback of restoreBackupData', () => {
    it('rejects corrupt, null, or invalid input payloads before initiating transaction', async () => {
      const invalidInputs = [null, undefined, '', 'corrupt string', 12345, true];
      for (const input of invalidInputs) {
        await assert.rejects(
          async () => {
            await restoreBackupData(input);
          },
          {
            message: 'Geçersiz yedek dosyası formatı.'
          },
          `Expected rejection for invalid input: ${input}`
        );
      }
    });

    it('verifies db.transaction encompasses all 7 stores in readwrite (rw) mode', async () => {
      let transactionCalled = false;
      let transactionMode = null;
      let transactionTables = null;

      const originalTransaction = db.transaction;
      try {
        db.transaction = async (mode, tables, _callback) => {
          transactionCalled = true;
          transactionMode = mode;
          transactionTables = tables;
          // Return simulated success
          return Promise.resolve();
        };

        const testBackup = {
          version: 3,
          routines: [],
          logs: [],
          days: [],
          tereaLogs: [],
          settings: [],
          streaks: [],
          badges: []
        };

        await restoreBackupData(testBackup);

        assert.strictEqual(transactionCalled, true, 'db.transaction must be called');
        assert.strictEqual(transactionMode, 'rw', 'Transaction mode must be rw');
        assert.strictEqual(transactionTables.length, 7, 'Transaction must scope exactly 7 stores');

        const scopedTableNames = transactionTables.map((t) => t.name).sort();
        const expectedTableNames = ['badges', 'days', 'logs', 'routines', 'settings', 'streaks', 'tereaLogs'].sort();
        assert.deepStrictEqual(scopedTableNames, expectedTableNames);
      } finally {
        db.transaction = originalTransaction;
      }
    });

    it('empirically verifies atomic rollback semantics when intermediate store restore fails', async () => {
      // Create an in-memory transactional simulator with snapshotting to test rollback
      const storeState = {
        routines: [{ id: 1, title: 'Preserved Routine' }],
        logs: [{ id: '2026-10-15_1', routineId: 1 }],
        days: [{ date: '2026-10-15', totalScore: 100 }],
        tereaLogs: [{ id: 1, count: 5 }],
        settings: [{ key: 'theme', value: 'slate' }],
        streaks: [{ id: 'main', currentStreak: 5 }],
        badges: [{ id: 'b1', title: 'Start' }]
      };

      const originalTransaction = db.transaction;
      const originalStores = {
        routines: { clear: db.routines.clear, bulkAdd: db.routines.bulkAdd },
        logs: { clear: db.logs.clear, bulkAdd: db.logs.bulkAdd },
        days: { clear: db.days.clear, bulkAdd: db.days.bulkAdd }
      };

      try {
        // Mock table operations bound to storeState
        db.routines.clear = async () => { storeState.routines = []; };
        db.routines.bulkAdd = async (items) => { storeState.routines.push(...items); };

        db.logs.clear = async () => { storeState.logs = []; };
        db.logs.bulkAdd = async (items) => { storeState.logs.push(...items); };

        // Simulate failure on days table
        db.days.clear = async () => { storeState.days = []; };
        db.days.bulkAdd = async () => {
          throw new Error('IndexedDB ConstraintError: simulated days store corrupt insert');
        };

        // Transaction implementation with rollback semantics
        db.transaction = async (mode, tables, callback) => {
          // Take snapshot of state before transaction executes
          const snapshot = JSON.parse(JSON.stringify(storeState));
          try {
            await callback();
          } catch (err) {
            // Rollback on abort
            Object.assign(storeState, snapshot);
            throw err;
          }
        };

        const corruptPayload = {
          version: 3,
          routines: [{ id: 99, title: 'Corrupt Candidate' }],
          logs: [{ id: 'corrupt_log' }],
          days: [{ date: 'corrupt_date' }]
        };

        // Attempt restore which is expected to fail on days
        await assert.rejects(
          async () => {
            await restoreBackupData(corruptPayload);
          },
          /ConstraintError/,
          'restoreBackupData must reject when transaction callback throws'
        );

        // Verify that rollback preserved all tables intact
        assert.strictEqual(storeState.routines.length, 1);
        assert.strictEqual(storeState.routines[0].title, 'Preserved Routine', 'Routines store was rolled back');
        assert.strictEqual(storeState.logs.length, 1, 'Logs store was rolled back');
        assert.strictEqual(storeState.days.length, 1, 'Days store was rolled back');
      } finally {
        db.transaction = originalTransaction;
        db.routines.clear = originalStores.routines.clear;
        db.routines.bulkAdd = originalStores.routines.bulkAdd;
        db.logs.clear = originalStores.logs.clear;
        db.logs.bulkAdd = originalStores.logs.bulkAdd;
        db.days.clear = originalStores.days.clear;
        db.days.bulkAdd = originalStores.days.bulkAdd;
      }
    });
  });

  describe('3. calculateStreaks Adversarial Scenarios & Boundary Stress-Testing', () => {

    it('Scenario 1A: 1-day streak with empty prior history must NOT use freeze (today met target)', () => {
      const today = getTodayString(4);
      const daysMap = {
        [today]: { totalScore: 100 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 1, 'Current streak should be 1');
      assert.strictEqual(res.maxStreak, 1, 'Max streak should be 1');
      assert.strictEqual(res.freezeUsed, false, 'Freeze must NOT be used for pre-inception history');
    });

    it('Scenario 1B: 1-day streak with empty prior history must NOT use freeze (today in progress, yesterday met)', () => {
      const today = getTodayString(4);
      const yesterday = getShiftedDateStr(today, -1);
      const daysMap = {
        [today]: { totalScore: 0 },
        [yesterday]: { totalScore: 90 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 1, 'Yesterday met target so current streak should be 1');
      assert.strictEqual(res.maxStreak, 1, 'Max streak should be 1');
      assert.strictEqual(res.freezeUsed, false, 'Freeze must NOT be used for pre-yesterday non-existent days');
    });

    it('Scenario 2A: Multiple missed days in succession must completely break active streak (today met)', () => {
      const today = getTodayString(4);
      const dayMinus1 = getShiftedDateStr(today, -1);
      const dayMinus2 = getShiftedDateStr(today, -2);
      const dayMinus3 = getShiftedDateStr(today, -3);
      const dayMinus4 = getShiftedDateStr(today, -4);

      const daysMap = {
        [today]: { totalScore: 100 },
        [dayMinus1]: { totalScore: 0 }, // Missed 1
        [dayMinus2]: { totalScore: 0 }, // Missed 2
        [dayMinus3]: { totalScore: 100 }, // Prior streak
        [dayMinus4]: { totalScore: 100 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 1, 'Streak must break across 2 successive missed days; only today survives');
      assert.strictEqual(res.maxStreak, 2, 'Prior streak of 2 days is preserved in maxStreak');
      assert.strictEqual(res.freezeUsed, false, 'Freeze is not applicable to 2 successive missed days');
    });

    it('Scenario 2B: Multiple missed days in succession must yield 0 current streak when today is in progress', () => {
      const today = getTodayString(4);
      const dayMinus1 = getShiftedDateStr(today, -1);
      const dayMinus2 = getShiftedDateStr(today, -2);
      const dayMinus3 = getShiftedDateStr(today, -3);

      const daysMap = {
        [today]: { totalScore: 20 }, // Today in progress (< 80)
        [dayMinus1]: { totalScore: 0 }, // Yesterday missed
        [dayMinus2]: { totalScore: 0 }, // Day before yesterday missed
        [dayMinus3]: { totalScore: 100 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 0, 'Current streak is completely 0');
      assert.strictEqual(res.maxStreak, 1);
      assert.strictEqual(res.freezeUsed, false);
    });

    it('Scenario 3A: Missed day 10 days ago allows freeze again because >7 days elapsed', () => {
      const today = getTodayString(4);
      const daysMap = {};
      
      // Day 0 (today): 100
      daysMap[today] = { totalScore: 100 };
      // Day -1: missed (consumed Freeze 1)
      daysMap[getShiftedDateStr(today, -1)] = { totalScore: 0 };
      // Days -2 to -9 (8 days): all 100
      for (let i = 2; i <= 9; i++) {
        daysMap[getShiftedDateStr(today, -i)] = { totalScore: 100 };
      }
      // Day -10: missed (9 days between Day -10 and Day -1 > 7 days, so Freeze 2 is granted)
      daysMap[getShiftedDateStr(today, -10)] = { totalScore: 0 };
      // Days -11 to -13 (3 days): all 100
      for (let i = 11; i <= 13; i++) {
        daysMap[getShiftedDateStr(today, -i)] = { totalScore: 100 };
      }

      const res = calculateStreaks(daysMap, 80, 4);
      // Total completed days = 1 (today) + 8 (days -2..-9) + 3 (days -11..-13) = 12 days
      assert.strictEqual(res.currentStreak, 12, 'Both freezes bridge successfully when >7 days apart');
      assert.strictEqual(res.maxStreak, 12);
      assert.strictEqual(res.freezeUsed, true);
    });

    it('Scenario 3B: Freeze collision within 7 rolling calendar days is rejected', () => {
      const today = getTodayString(4);
      const daysMap = {};

      // Day 0: 100
      daysMap[today] = { totalScore: 100 };
      // Day -1: 0 (Freeze 1)
      daysMap[getShiftedDateStr(today, -1)] = { totalScore: 0 };
      // Day -2, -3: 100
      daysMap[getShiftedDateStr(today, -2)] = { totalScore: 100 };
      daysMap[getShiftedDateStr(today, -3)] = { totalScore: 100 };
      // Day -4: 0 (Only 3 days since Freeze 1! Within 7 days window!)
      daysMap[getShiftedDateStr(today, -4)] = { totalScore: 0 };
      // Day -5, -6: 100
      daysMap[getShiftedDateStr(today, -5)] = { totalScore: 100 };
      daysMap[getShiftedDateStr(today, -6)] = { totalScore: 100 };

      const res = calculateStreaks(daysMap, 80, 4);
      // Backward walk from Day 0: Day -1 consumes freeze; Day -4 collides (< 7 days) and is blocked -> currentStreak = 3
      assert.strictEqual(res.currentStreak, 3, 'Streak must stop at Day -4 because Freeze 2 collides within 7 days');
      // Chronological forward walk: Day -4 consumed freeze first; Day -1 collided and broke -> maxStreak was Day -6..-2 = 4 days
      assert.strictEqual(res.maxStreak, 4, 'Chronological maxStreak attained was 4 days (Days -6,-5,freeze,-3,-2)');
      assert.strictEqual(res.freezeUsed, true);
    });

    it('Scenario 4A: Sparse non-consecutive dates in daysMap must NOT falsely count as consecutive maxStreak', () => {
      const daysMap = {
        '2026-08-01': { totalScore: 100 },
        '2026-08-15': { totalScore: 100 },
        '2026-09-01': { totalScore: 100 },
        '2026-09-20': { totalScore: 100 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.currentStreak, 0, 'No streak for today');
      assert.strictEqual(res.maxStreak, 1, 'Max streak must be 1, NOT 4 for sparse dates');
    });

    it('Scenario 4B: Sparse clusters with large gaps evaluate consecutive segments accurately', () => {
      // 3 consecutive days in August, 2 consecutive days in September
      const daysMap = {
        '2026-08-10': { totalScore: 100 },
        '2026-08-11': { totalScore: 100 },
        '2026-08-12': { totalScore: 100 },
        '2026-09-05': { totalScore: 100 },
        '2026-09-06': { totalScore: 100 }
      };

      const res = calculateStreaks(daysMap, 80, 4);
      assert.strictEqual(res.maxStreak, 3, 'Max streak must equal the largest consecutive segment (3 days)');
    });

    it('Stress: calculateStreaks safely handles null, undefined, and malformed inputs', () => {
      const malformedCases = [null, undefined, 12345, '2026-10-15', [], () => {}];
      for (const input of malformedCases) {
        const res = calculateStreaks(input, 80, 4);
        assert.deepStrictEqual(res, { currentStreak: 0, maxStreak: 0, freezeUsed: false });
      }
    });

    it('Stress: getShiftedDateStr operates safely across year boundaries and leap years', () => {
      // Year rollover
      assert.strictEqual(getShiftedDateStr('2026-12-31', 1), '2027-01-01');
      assert.strictEqual(getShiftedDateStr('2027-01-01', -1), '2026-12-31');

      // Leap year 2028 (Feb has 29 days)
      assert.strictEqual(getShiftedDateStr('2028-02-28', 1), '2028-02-29');
      assert.strictEqual(getShiftedDateStr('2028-02-29', 1), '2028-03-01');
      assert.strictEqual(getShiftedDateStr('2028-03-01', -1), '2028-02-29');

      // Non-leap year 2026 (Feb has 28 days)
      assert.strictEqual(getShiftedDateStr('2026-02-28', 1), '2026-03-01');
      assert.strictEqual(getShiftedDateStr('2026-03-01', -1), '2026-02-28');
    });

    it('Stress: 1-year (365 days) calculation completes within sub-50ms performance envelope', () => {
      const today = getTodayString(4);
      const daysMap = {};
      for (let i = 0; i < 365; i++) {
        const d = getShiftedDateStr(today, -i);
        daysMap[d] = { totalScore: (i % 8 === 0) ? 0 : 100 };
      }

      const start = performance.now();
      const res = calculateStreaks(daysMap, 80, 4);
      const duration = performance.now() - start;

      assert.ok(duration < 50, `365-day calculation took ${duration.toFixed(2)}ms, exceeding 50ms threshold`);
      assert.ok(res.maxStreak > 300);
      assert.strictEqual(res.freezeUsed, true);
    });
  });
});
