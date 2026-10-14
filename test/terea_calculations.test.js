import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateTodayTerea,
  calculateTereaStats,
  decrementSticks,
  incrementSticks,
  validateStickPrice
} from './helpers/calculations.js';
import { getPastDaysList } from '../src/utils/date.js';

describe('Tier 1 & Tier 2: Terea Consumption & Financial Calculations', () => {

  describe('Single Day & Stick-to-Pack Conversions', () => {
    it('handles zero sticks: displays 0.0 TL and 0.0 packs cleanly', () => {
      const res = calculateTodayTerea(0, 6.0);
      assert.strictEqual(res.todaySticks, 0);
      assert.strictEqual(res.todaySpent, '0.0');
      assert.strictEqual(res.todayPacks, '0.0');
      assert.strictEqual(res.packPrice, 120.0);
    });

    it('handles 1 stick boundary: 1/20 = 0.05 packs formats to 0.1 packs', () => {
      const res = calculateTodayTerea(1, 6.0);
      assert.strictEqual(res.todaySticks, 1);
      assert.strictEqual(res.todaySpent, '6.0');
      assert.strictEqual(res.todayPacks, '0.1');
    });

    it('handles 10 sticks (half pack): 10/20 = 0.5 packs and 60.0 TL at 6.0 TL/stick', () => {
      const res = calculateTodayTerea(10, 6.0);
      assert.strictEqual(res.todaySticks, 10);
      assert.strictEqual(res.todaySpent, '60.0');
      assert.strictEqual(res.todayPacks, '0.5');
    });

    it('handles 19 sticks (just under 1 pack): 19/20 = 0.95 packs formats to 0.9 packs via JS toFixed(1) IEEE-754 rounding', () => {
      const res = calculateTodayTerea(19, 6.0);
      assert.strictEqual(res.todaySticks, 19);
      assert.strictEqual(res.todaySpent, '114.0');
      assert.strictEqual(res.todayPacks, '0.9');
    });

    it('handles exact 1 pack (20 sticks): 20/20 = 1.0 packs and 120.0 TL at 6.0 TL/stick', () => {
      const res = calculateTodayTerea(20, 6.0);
      assert.strictEqual(res.todaySticks, 20);
      assert.strictEqual(res.todaySpent, '120.0');
      assert.strictEqual(res.todayPacks, '1.0');
    });

    it('handles fractional unit prices (e.g. 5.75 TL / stick)', () => {
      const res = calculateTodayTerea(12, 5.75);
      assert.strictEqual(res.todaySticks, 12);
      assert.strictEqual(res.todaySpent, (12 * 5.75).toFixed(1)); // 69.0
      assert.strictEqual(res.todayPacks, (12 / 20).toFixed(1)); // 0.6
      assert.strictEqual(res.packPrice, 115);
    });
  });

  describe('Counter Actions & Negative Value Prevention', () => {
    it('increments sticks normally from 0 to 1 to 2', () => {
      let count = 0;
      count = incrementSticks(count);
      assert.strictEqual(count, 1);
      count = incrementSticks(count);
      assert.strictEqual(count, 2);
    });

    it('decrements sticks from 2 to 1', () => {
      let count = 2;
      count = decrementSticks(count);
      assert.strictEqual(count, 1);
    });

    it('prevents negative counts when decrementing at 0 (clamped to 0)', () => {
      let count = 0;
      count = decrementSticks(count);
      assert.strictEqual(count, 0);
      count = decrementSticks(count);
      assert.strictEqual(count, 0);
    });

    it('clamps negative inputs in calculateTodayTerea to 0', () => {
      const res = calculateTodayTerea(-5, 6.0);
      assert.strictEqual(res.todaySticks, 0);
      assert.strictEqual(res.todaySpent, '0.0');
      assert.strictEqual(res.todayPacks, '0.0');
    });
  });

  describe('Configurable Price Validation & Fallback', () => {
    it('accepts valid positive decimal price', () => {
      const validation = validateStickPrice('7.50');
      assert.strictEqual(validation.valid, true);
      assert.strictEqual(validation.price, 7.5);
    });

    it('rejects 0 TL and falls back to default 6.0 TL', () => {
      const validation = validateStickPrice('0');
      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.price, 6.0);
    });

    it('rejects negative prices and falls back to default 6.0 TL', () => {
      const validation = validateStickPrice('-3.5');
      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.price, 6.0);
    });

    it('rejects non-numeric string and falls back to default 6.0 TL', () => {
      const validation = validateStickPrice('abc');
      assert.strictEqual(validation.valid, false);
      assert.strictEqual(validation.price, 6.0);
    });
  });

  describe('Rolling 7-Day, Month-to-Date, and All-Time Multi-Day Aggregations', () => {
    const fixedToday = '2026-10-15';
    const past7 = getPastDaysList(7, 4);

    it('calculates 7-day rolling statistics accurately with complete data', () => {
      const daysMap = {};
      // Fill past 7 days with 10 sticks each
      past7.forEach((date) => {
        daysMap[date] = { tereaCount: 10, totalScore: 85 };
      });

      const stats = calculateTereaStats({
        todaySticks: 10,
        stickPrice: 6.0,
        daysMap,
        todayStr: fixedToday
      });

      assert.strictEqual(stats.weekSticks, 70);
      assert.strictEqual(stats.weekSpent, 420.0);
      assert.strictEqual(stats.weekPacks, '3.5');
    });

    it('treats missing past days as 0 sticks without runtime error', () => {
      const daysMap = {
        // Only 2 of the past 7 days have logs
        [past7[0]]: { tereaCount: 8 },
        [past7[1]]: { tereaCount: 12 }
      };

      const stats = calculateTereaStats({
        todaySticks: 0,
        stickPrice: 6.0,
        daysMap,
        todayStr: fixedToday
      });

      assert.strictEqual(stats.weekSticks, 20);
      assert.strictEqual(stats.weekSpent, 120.0);
      assert.strictEqual(stats.weekPacks, '1.0');
    });

    it('calculates month-to-date sticks strictly within current calendar month', () => {
      const daysMap = {
        '2026-09-30': { tereaCount: 20 }, // Previous month, must NOT be counted in month-to-date
        '2026-10-01': { tereaCount: 10 },
        '2026-10-02': { tereaCount: 15 },
        '2026-10-15': { tereaCount: 5 }
      };

      const stats = calculateTereaStats({
        todaySticks: 5,
        stickPrice: 6.0,
        daysMap,
        todayStr: fixedToday
      });

      assert.strictEqual(stats.monthSticks, 30); // 10 + 15 + 5
      assert.strictEqual(stats.monthSpent, 180.0);
      assert.strictEqual(stats.monthPacks, '1.5');
      // All-time includes September 30
      assert.strictEqual(stats.allTimeSticks, 50);
      assert.strictEqual(stats.allTimeSpent, 300.0);
      assert.strictEqual(stats.allTimePacks, '2.5');
    });

    it('calculates daily average consumption across active tracked days', () => {
      const daysMap = {
        '2026-10-01': { tereaCount: 10 },
        '2026-10-02': { tereaCount: 20 },
        '2026-10-03': { tereaCount: 0 }, // 0 consumption day
        '2026-10-04': { tereaCount: 30 }
      };

      const stats = calculateTereaStats({
        todaySticks: 10,
        stickPrice: 6.0,
        daysMap,
        todayStr: fixedToday
      });

      // Total active days with terea = 3 (10, 20, 30). Total sticks = 60.
      // Average = 60 / 3 = 20.0
      assert.strictEqual(stats.dailyAvgSticks, '20.0');
      // Projected monthly = 20.0 * 30 * 6.0 = 3600 TL
      assert.strictEqual(stats.projectedMonthSpent, '3600');
    });

    it('handles 0 tracked days without divide-by-zero errors', () => {
      const stats = calculateTereaStats({
        todaySticks: 0,
        stickPrice: 6.0,
        daysMap: {},
        todayStr: fixedToday
      });

      assert.strictEqual(stats.allTimeSticks, 0);
      assert.strictEqual(stats.dailyAvgSticks, '0.0');
      assert.strictEqual(stats.projectedMonthSpent, '0');
    });
  });

  describe('Dynamic & Retroactive Price Recalculation', () => {
    it('immediately updates all financial metrics when stick price increases from 6.0 to 7.5 TL', () => {
      const daysMap = {
        '2026-10-10': { tereaCount: 10 },
        '2026-10-11': { tereaCount: 20 }
      };

      // Initial stats at 6.0 TL
      const statsAt6 = calculateTereaStats({
        todaySticks: 10,
        stickPrice: 6.0,
        daysMap,
        todayStr: '2026-10-15'
      });
      assert.strictEqual(statsAt6.allTimeSpent, 180.0); // 30 * 6.0
      assert.strictEqual(statsAt6.packPrice, 120.0);

      // Price updated to 7.5 TL
      const statsAt75 = calculateTereaStats({
        todaySticks: 10,
        stickPrice: 7.5,
        daysMap,
        todayStr: '2026-10-15'
      });
      assert.strictEqual(statsAt75.allTimeSpent, 225.0); // 30 * 7.5
      assert.strictEqual(statsAt75.packPrice, 150.0);
      assert.strictEqual(statsAt75.todaySpent, '75.0');
      // Sticks count remains strictly unchanged
      assert.strictEqual(statsAt75.allTimeSticks, statsAt6.allTimeSticks);
    });
  });
});
