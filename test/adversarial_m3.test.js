import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// --- Pure helper models extracted from RoutineItem & RoutineList contracts ---

export function getQuantityStep(unit, target) {
  if (!unit) return 1;
  const u = unit.toLowerCase();
  if (u === 'l' || u === 'litre' || u === 'lt') return 0.5;
  if (u === 'sayfa' || u === 'p') return 5;
  if (u === 'adım' || u === 'adim') return 500;
  if (u === 'dk' || u === 'dakika') return 5;
  if (target >= 100) return 10;
  return 1;
}

export function calculateNextQuantity(currentQuantity, delta) {
  const curr = Number(currentQuantity) || 0;
  return Math.max(0, Math.round((curr + delta) * 100) / 100);
}

export function sortRoutinesByMitAndOrder(routines, completedMap = {}) {
  const uncompleted = routines
    .filter((r) => !completedMap[r.id])
    .sort((a, b) => {
      if (a.isMit && !b.isMit) return -1;
      if (!a.isMit && b.isMit) return 1;
      return (a.order || 0) - (b.order || 0);
    });

  const completed = routines.filter((r) => !!completedMap[r.id]);
  return { uncompleted, completed };
}

describe('Adversarial Verification Suite - Milestone M3 (challenger_m3_1)', () => {

  describe('1. Quantity Tracking: Steps, Clamping, Float Precision & Auto-Completion', () => {

    it('determines correct step sizes across various units and target thresholds', () => {
      assert.strictEqual(getQuantityStep('L', 2.5), 0.5, 'Liters must step by 0.5');
      assert.strictEqual(getQuantityStep('litre', 3), 0.5, 'Litre must step by 0.5');
      assert.strictEqual(getQuantityStep('LT', 1), 0.5, 'LT (case-insensitive) must step by 0.5');
      assert.strictEqual(getQuantityStep('sayfa', 20), 5, 'Pages must step by 5');
      assert.strictEqual(getQuantityStep('p', 50), 5, 'p must step by 5');
      assert.strictEqual(getQuantityStep('adım', 7500), 500, 'Steps must step by 500');
      assert.strictEqual(getQuantityStep('adim', 10000), 500, 'Adim must step by 500');
      assert.strictEqual(getQuantityStep('dk', 45), 5, 'Minutes must step by 5');
      assert.strictEqual(getQuantityStep('dakika', 60), 5, 'Dakika must step by 5');
      assert.strictEqual(getQuantityStep('bardak', 150), 10, 'Large targets >= 100 without known unit step by 10');
      assert.strictEqual(getQuantityStep('kez', 5), 1, 'Small targets default to step 1');
      assert.strictEqual(getQuantityStep(null, 5), 1, 'Null unit defaults to step 1');
      assert.strictEqual(getQuantityStep(undefined, 5), 1, 'Undefined unit defaults to step 1');
    });

    it('clamps quantity to >= 0 on decrements below zero', () => {
      assert.strictEqual(calculateNextQuantity(0, -1), 0, '0 - 1 must clamp to 0');
      assert.strictEqual(calculateNextQuantity(0, -0.5), 0, '0 - 0.5 must clamp to 0');
      assert.strictEqual(calculateNextQuantity(0.2, -0.5), 0, '0.2 - 0.5 must clamp to 0');
      assert.strictEqual(calculateNextQuantity(-5, -1), 0, 'Negative values must clamp to 0');
      assert.strictEqual(calculateNextQuantity(null, -1), 0, 'Null current quantity must clamp to 0');
    });

    it('eliminates IEEE-754 floating point drift during decimal increments', () => {
      // 0.1 + 0.2 in standard JS is 0.30000000000000004
      const next1 = calculateNextQuantity(0.1, 0.2);
      assert.strictEqual(next1, 0.3, '0.1 + 0.2 must round cleanly to 0.3');

      // Iterative 0.5 increments to 2.5 L
      let val = 0;
      const expectedSteps = [0.5, 1.0, 1.5, 2.0, 2.5];
      for (const expected of expectedSteps) {
        val = calculateNextQuantity(val, 0.5);
        assert.strictEqual(val, expected, `Step should exactly equal ${expected}`);
      }
    });

    it('simulates quantity auto-completion state transition when reaching target', () => {
      const routine = { id: 101, title: 'Water', targetQuantity: 2.5, unit: 'L', weight: 10 };
      const targetQty = Number(routine.targetQuantity);

      // State machine simulation matching App.jsx handleUpdateQuantity
      let completedMap = {};
      let quantityMap = {};
      let currentScore = 0;

      function updateQuantity(newQty) {
        quantityMap[routine.id] = newQty;
        const isCompleted = !!completedMap[routine.id];

        if (newQty >= targetQty && !isCompleted) {
          completedMap[routine.id] = true;
          currentScore += routine.weight;
        } else if (newQty < targetQty && isCompleted) {
          delete completedMap[routine.id];
          currentScore = Math.max(0, currentScore - routine.weight);
        }
      }

      // 1. Partial progress: 1.5 / 2.5 -> not completed
      updateQuantity(1.5);
      assert.strictEqual(quantityMap[routine.id], 1.5);
      assert.strictEqual(completedMap[routine.id], undefined, '1.5 / 2.5 must not be completed');
      assert.strictEqual(currentScore, 0);

      // 2. Reaching target: 2.5 / 2.5 -> auto-completed
      updateQuantity(2.5);
      assert.strictEqual(quantityMap[routine.id], 2.5);
      assert.strictEqual(completedMap[routine.id], true, '2.5 / 2.5 must auto-complete routine');
      assert.strictEqual(currentScore, 10, 'Score must increase by weight (10)');

      // 3. Overachievement: 3.0 / 2.5 -> remains completed, score not duplicated
      updateQuantity(3.0);
      assert.strictEqual(quantityMap[routine.id], 3.0);
      assert.strictEqual(completedMap[routine.id], true);
      assert.strictEqual(currentScore, 10, 'Overachievement must maintain score at 10');

      // 4. Decrement below target: 2.0 / 2.5 -> un-completed
      updateQuantity(2.0);
      assert.strictEqual(quantityMap[routine.id], 2.0);
      assert.strictEqual(completedMap[routine.id], undefined, '2.0 / 2.5 must un-complete routine');
      assert.strictEqual(currentScore, 0, 'Score must decrease back to 0');
    });
  });

  describe('2. Subtask Completion Cascade & Inversion Verification', () => {

    it('completing all subtasks completes parent routine', () => {
      const routine = {
        id: 201,
        title: 'Workout Session',
        weight: 20,
        subtasks: [
          { id: 's1', text: 'Isınma (Warmup)', done: false },
          { id: 's2', text: 'Ana Set (Bench & Squat)', done: false },
          { id: 's3', text: 'Soğuma (Stretching)', done: false }
        ]
      };

      let completedMap = {};
      let routines = [routine];

      function toggleSubtask(subtaskId) {
        const updatedSubtasks = (routine.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        routine.subtasks = updatedSubtasks;

        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
        if (allDone && !completedMap[routine.id]) {
          completedMap[routine.id] = true;
        } else if (!allDone && completedMap[routine.id]) {
          delete completedMap[routine.id];
        }
      }

      // Step 1: toggle s1 -> not all done
      toggleSubtask('s1');
      assert.strictEqual(completedMap[routine.id], undefined);

      // Step 2: toggle s2 -> not all done
      toggleSubtask('s2');
      assert.strictEqual(completedMap[routine.id], undefined);

      // Step 3: toggle s3 -> ALL done! Parent must complete
      toggleSubtask('s3');
      assert.strictEqual(completedMap[routine.id], true, 'Parent routine must be completed when all subtasks are done');

      // Step 4: UNCHECK s3 -> Expected: Parent routine must un-complete!
      toggleSubtask('s3');
      assert.strictEqual(completedMap[routine.id], undefined, 'Unchecking a subtask must un-complete the parent routine');
    });

    it('FAILING PROOF: detects actual bug in App.jsx handleToggleSubtask missing un-completion cascade', () => {
      const appPath = path.resolve('src/App.jsx');
      const appSource = fs.readFileSync(appPath, 'utf-8');

      // Extract handleToggleSubtask method body
      const methodMatch = appSource.match(/handleToggleSubtask\s*=\s*async\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
      assert.ok(methodMatch, 'handleToggleSubtask must be present in App.jsx');

      const methodBody = methodMatch[1];

      // Check if unchecking subtask logic exists in App.jsx
      const hasUncompleteBranch = /if\s*\(\s*!allDone\s*&&\s*completedMap\[routine\.id\]\s*\)/.test(methodBody) ||
                                  (/else\s+if\s*\(!allDone/.test(methodBody)) ||
                                  (/else\s*\{\s*handleToggleRoutine/.test(methodBody));

      // This documents the exact architectural defect in App.jsx line 440-444:
      // const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
      // if (allDone && !completedMap[routine.id]) {
      //   handleToggleRoutine(routine);
      // }
      // BUG: There is no branch to uncomplete the parent routine if (!allDone && completedMap[routine.id])!
      assert.strictEqual(
        hasUncompleteBranch,
        false,
        'EMPIRICAL FINDING: App.jsx handleToggleSubtask lacks un-completion cascade when a subtask is unchecked'
      );
    });
  });

  describe('3. MIT Sorting: Uncompleted MIT Routines Always Sort First', () => {

    it('sorts uncompleted MIT routines above non-MIT routines regardless of default order', () => {
      const testRoutines = [
        { id: 1, title: 'Routine 1 (Non-MIT, Order 1)', isMit: false, order: 1 },
        { id: 2, title: 'Routine 2 (MIT, Order 2)', isMit: true, order: 2 },
        { id: 3, title: 'Routine 3 (Non-MIT, Order 3)', isMit: false, order: 3 },
        { id: 4, title: 'Routine 4 (MIT, Order 4)', isMit: true, order: 4 },
        { id: 5, title: 'Routine 5 (Non-MIT, Order 5)', isMit: false, order: 5 }
      ];

      const { uncompleted, completed } = sortRoutinesByMitAndOrder(testRoutines, {});

      assert.strictEqual(completed.length, 0);
      assert.strictEqual(uncompleted.length, 5);

      // First two items MUST be the MIT routines (ordered by order: 2, then 4)
      assert.strictEqual(uncompleted[0].id, 2, 'First item must be MIT Routine 2');
      assert.strictEqual(uncompleted[0].isMit, true);

      assert.strictEqual(uncompleted[1].id, 4, 'Second item must be MIT Routine 4');
      assert.strictEqual(uncompleted[1].isMit, true);

      // Remaining items must be non-MIT routines sorted by order
      assert.strictEqual(uncompleted[2].id, 1, 'Third item must be Non-MIT Routine 1');
      assert.strictEqual(uncompleted[3].id, 3, 'Fourth item must be Non-MIT Routine 3');
      assert.strictEqual(uncompleted[4].id, 5, 'Fifth item must be Non-MIT Routine 5');
    });

    it('correctly partitions completed routines to the bottom while maintaining MIT priority on remaining uncompleted items', () => {
      const testRoutines = [
        { id: 1, title: 'Routine 1', isMit: false, order: 1 },
        { id: 2, title: 'Routine 2 (MIT)', isMit: true, order: 2 },
        { id: 3, title: 'Routine 3', isMit: false, order: 3 },
        { id: 4, title: 'Routine 4 (MIT)', isMit: true, order: 4 }
      ];

      // Routine 2 (MIT) is completed
      const completedMap = { 2: true };

      const { uncompleted, completed } = sortRoutinesByMitAndOrder(testRoutines, completedMap);

      assert.strictEqual(completed.length, 1);
      assert.strictEqual(completed[0].id, 2);

      // Uncompleted must have remaining MIT (Routine 4) first!
      assert.strictEqual(uncompleted.length, 3);
      assert.strictEqual(uncompleted[0].id, 4, 'Remaining uncompleted MIT Routine 4 must be at the top');
      assert.strictEqual(uncompleted[1].id, 1);
      assert.strictEqual(uncompleted[2].id, 3);
    });

    it('handles undefined or missing isMit, order, or negative orders robustly without NaN', () => {
      const edgeRoutines = [
        { id: 1, title: 'No MIT, no order' },
        { id: 2, title: 'MIT true, no order', isMit: true },
        { id: 3, title: 'MIT false, negative order', isMit: false, order: -5 },
        { id: 4, title: 'MIT true, high order', isMit: true, order: 100 }
      ];

      const { uncompleted } = sortRoutinesByMitAndOrder(edgeRoutines, {});

      // All MIT tasks must come first
      assert.strictEqual(uncompleted[0].isMit, true);
      assert.strictEqual(uncompleted[1].isMit, true);
      assert.strictEqual(uncompleted[2].isMit ? true : false, false);
      assert.strictEqual(uncompleted[3].isMit ? true : false, false);
    });
  });

  describe('4. Component Source Code & Implementation Contract Audit', () => {

    it('validates RoutineItem.jsx quantity controls and subtask rendering', () => {
      const itemPath = path.resolve('src/components/RoutineItem.jsx');
      const itemSource = fs.readFileSync(itemPath, 'utf-8');

      assert.match(itemSource, /handleQuantityDelta/, 'RoutineItem must implement handleQuantityDelta');
      assert.match(itemSource, /Math\.max\(\s*0\s*,/, 'RoutineItem must clamp quantity >= 0');
      assert.match(itemSource, /onToggleMit/, 'RoutineItem must support MIT star toggle');
      assert.match(itemSource, /onToggleFreeze/, 'RoutineItem must support Routine Freeze toggle');
      assert.match(itemSource, /onToggleSubtask/, 'RoutineItem must support subtask checkboxes');
      assert.match(itemSource, /subtasksOpen/, 'RoutineItem must support collapsible subtask checklist');
    });

    it('FAILING PROOF: detects double-invocation bug in RoutineItem.jsx handleQuantityDelta', () => {
      const itemPath = path.resolve('src/components/RoutineItem.jsx');
      const itemSource = fs.readFileSync(itemPath, 'utf-8');

      // In RoutineItem.jsx lines 78-93:
      // onUpdateQuantity(routine, nextVal) already auto-completes/un-completes in App.jsx!
      // But handleQuantityDelta ALSO calls handleToggle():
      // if (nextVal >= targetQty && !isCompleted) { handleToggle(); }
      // This calls handleToggleRoutine, causing concurrent conflicting mutations.
      const hasDoubleToggleCall = /if\s*\(\s*nextVal\s*>=\s*targetQty\s*&&\s*!isCompleted\s*\)\s*\{\s*handleToggle\(\);?\s*\}/.test(itemSource);
      assert.strictEqual(
        hasDoubleToggleCall,
        true,
        'EMPIRICAL FINDING: RoutineItem.jsx calls handleToggle() in addition to onUpdateQuantity, triggering redundant/conflicting state transitions'
      );
    });

    it('validates RoutineList.jsx dual filter and Eisenhower matrix view', () => {
      const listPath = path.resolve('src/components/RoutineList.jsx');
      const listSource = fs.readFileSync(listPath, 'utf-8');

      assert.match(listSource, /filterMode\s*===\s*['"]time['"]/, 'RoutineList must support time filtering');
      assert.match(listSource, /filterMode\s*===\s*['"]category['"]/, 'RoutineList must support category filtering');
      assert.match(listSource, /isEisenhowerView/, 'RoutineList must support Eisenhower 4-quadrant view');
      assert.match(listSource, /q1Tasks/, 'RoutineList must group Q1 tasks');
      assert.match(listSource, /q2Tasks/, 'RoutineList must group Q2 tasks');
      assert.match(listSource, /q3Tasks/, 'RoutineList must group Q3 tasks');
      assert.match(listSource, /q4Tasks/, 'RoutineList must group Q4 tasks');
    });

    it('validates QuickAddModal.jsx M3 input fields', () => {
      const modalPath = path.resolve('src/components/QuickAddModal.jsx');
      const modalSource = fs.readFileSync(modalPath, 'utf-8');

      assert.match(modalSource, /isMit/, 'QuickAddModal must include MIT star toggle');
      assert.match(modalSource, /isTwoMinuteRule/, 'QuickAddModal must include 2-Minute rule toggle');
      assert.match(modalSource, /targetQuantity/, 'QuickAddModal must include target quantity input');
      assert.match(modalSource, /unit/, 'QuickAddModal must include unit selection');
      assert.match(modalSource, /subtasks/, 'QuickAddModal must support subtask creation');
    });
  });
});
