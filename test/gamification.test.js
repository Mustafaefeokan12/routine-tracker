import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { calculateGamification } from './helpers/calculations.js';

describe('Tier 1 & Tier 2: Gamification, RPG Levels & Academic Grading', () => {

  describe('RPG Level 1-99 Progression & EXP Modulo', () => {
    it('initializes at Level 1 with 0 EXP for 0 cumulative points', () => {
      const res = calculateGamification(0, 0, 100);
      assert.strictEqual(res.currentLevel, 1);
      assert.strictEqual(res.currentExp, 0);
      assert.strictEqual(res.nextLevelExp, 100);
    });

    it('remains Level 1 with 99 EXP at 99 points (pre-level up threshold)', () => {
      const res = calculateGamification(99, 0, 100);
      assert.strictEqual(res.currentLevel, 1);
      assert.strictEqual(res.currentExp, 99);
    });

    it('levels up to Level 2 with 0 EXP at exactly 100 points (exact modulo transition)', () => {
      const res = calculateGamification(100, 0, 100);
      assert.strictEqual(res.currentLevel, 2);
      assert.strictEqual(res.currentExp, 0);
    });

    it('carries over surplus EXP into Level 2 at 125 points (25 EXP)', () => {
      const res = calculateGamification(125, 0, 100);
      assert.strictEqual(res.currentLevel, 2);
      assert.strictEqual(res.currentExp, 25);
    });

    it('calculates mid-game level progression accurately (e.g. Level 6 at 550 points)', () => {
      const res = calculateGamification(550, 0, 100);
      assert.strictEqual(res.currentLevel, 6);
      assert.strictEqual(res.currentExp, 50);
    });

    it('clamps character level to maximum Level 99 at high score thresholds', () => {
      // 9,800 points -> Level 99, 0 EXP
      const resAt9800 = calculateGamification(9800, 0, 100);
      assert.strictEqual(resAt9800.currentLevel, 99);
      assert.strictEqual(resAt9800.currentExp, 0);

      // 10,500 points -> Clamped to Level 99 (never exceeds 99)
      const resAt10500 = calculateGamification(10500, 0, 100);
      assert.strictEqual(resAt10500.currentLevel, 99);
      assert.strictEqual(resAt10500.currentExp, 0);

      // 50,000 points -> Level 99
      const resAt50000 = calculateGamification(50000, 0, 100);
      assert.strictEqual(resAt50000.currentLevel, 99);
    });

    it('safely handles negative totalScore by clamping to Level 1 with 0 EXP', () => {
      const res = calculateGamification(-50, 0, 100);
      assert.strictEqual(res.currentLevel, 1);
      assert.strictEqual(res.currentExp, 0);
    });
  });

  describe('Academic Letter Grade Thresholds (AA to FF)', () => {
    it('awards AA for scores >= 95', () => {
      const res95 = calculateGamification(0, 95, 100);
      assert.strictEqual(res95.letterGrade, 'AA');
      assert.strictEqual(res95.gradeColor, 'text-emerald-400');

      const res120 = calculateGamification(0, 120, 100);
      assert.strictEqual(res120.letterGrade, 'AA');
    });

    it('awards BA for scores 85 to 94', () => {
      const res85 = calculateGamification(0, 85, 100);
      assert.strictEqual(res85.letterGrade, 'BA');
      assert.strictEqual(res85.gradeColor, 'text-emerald-300');

      const res94 = calculateGamification(0, 94, 100);
      assert.strictEqual(res94.letterGrade, 'BA');
    });

    it('awards BB for scores 70 to 84', () => {
      const res70 = calculateGamification(0, 70, 100);
      assert.strictEqual(res70.letterGrade, 'BB');
      assert.strictEqual(res70.gradeColor, 'text-cyan-400');

      const res84 = calculateGamification(0, 84, 100);
      assert.strictEqual(res84.letterGrade, 'BB');
    });

    it('awards CB for scores 60 to 69', () => {
      const res60 = calculateGamification(0, 60, 100);
      assert.strictEqual(res60.letterGrade, 'CB');
      assert.strictEqual(res60.gradeColor, 'text-amber-400');

      const res69 = calculateGamification(0, 69, 100);
      assert.strictEqual(res69.letterGrade, 'CB');
    });

    it('awards CC for scores 50 to 59', () => {
      const res50 = calculateGamification(0, 50, 100);
      assert.strictEqual(res50.letterGrade, 'CC');
      assert.strictEqual(res50.gradeColor, 'text-amber-500');

      const res59 = calculateGamification(0, 59, 100);
      assert.strictEqual(res59.letterGrade, 'CC');
    });

    it('awards FF for scores < 50', () => {
      const res49 = calculateGamification(0, 49, 100);
      assert.strictEqual(res49.letterGrade, 'FF');
      assert.strictEqual(res49.gradeColor, 'text-rose-400');

      const res0 = calculateGamification(0, 0, 100);
      assert.strictEqual(res0.letterGrade, 'FF');
      assert.strictEqual(res0.gradeColor, 'text-rose-400');
    });
  });

  describe('Circular Progress Ring & Overachievement (+Bonus)', () => {
    it('computes percentage 0% for 0 daily score', () => {
      const res = calculateGamification(0, 0, 100);
      assert.strictEqual(res.percentage, 0);
      assert.strictEqual(res.isOverachieved, false);
      assert.strictEqual(res.bonusPoints, 0);
    });

    it('computes percentage 50% for 50/100 score', () => {
      const res = calculateGamification(0, 50, 100);
      assert.strictEqual(res.percentage, 50);
      assert.strictEqual(res.isOverachieved, false);
    });

    it('computes percentage 100% at exact target threshold', () => {
      const res = calculateGamification(0, 100, 100);
      assert.strictEqual(res.percentage, 100);
      assert.strictEqual(res.isOverachieved, false);
      assert.strictEqual(res.bonusPoints, 0);
    });

    it('clamps percentage to 100% on overachievement and sets bonus flag and points', () => {
      const res = calculateGamification(0, 125, 100);
      assert.strictEqual(res.percentage, 100); // SVG ring clamped to 100%
      assert.strictEqual(res.isOverachieved, true);
      assert.strictEqual(res.bonusPoints, 25);
    });

    it('supports custom target scores (e.g. 80P and 120P)', () => {
      // 60 / 80 = 75%
      const res80 = calculateGamification(0, 60, 80);
      assert.strictEqual(res80.percentage, 75);
      assert.strictEqual(res80.isOverachieved, false);

      // 100 / 80 = 125% -> clamped to 100%, +20 bonus
      const res80Over = calculateGamification(0, 100, 80);
      assert.strictEqual(res80Over.percentage, 100);
      assert.strictEqual(res80Over.isOverachieved, true);
      assert.strictEqual(res80Over.bonusPoints, 20);

      // 90 / 120 = 75%
      const res120 = calculateGamification(0, 90, 120);
      assert.strictEqual(res120.percentage, 75);
      assert.strictEqual(res120.isOverachieved, false);
    });
  });
});
