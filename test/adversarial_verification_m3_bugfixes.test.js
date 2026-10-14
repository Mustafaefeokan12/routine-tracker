import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Empirical Challenger M3 Iteration 2 Bugfix Verification', () => {

  // =========================================================================
  // 1. Subtask Un-completion Cascade (src/App.jsx:439-447)
  // =========================================================================
  describe('1. Subtask Cascade Verification', () => {
    it('verifies App.jsx source contains the un-completion branch', () => {
      const appSource = fs.readFileSync(path.resolve('src/App.jsx'), 'utf-8');
      
      // Check exact presence of un-completion branch in handleToggleSubtask
      assert.match(
        appSource,
        /else\s+if\s*\(\s*isCompleted\s*&&\s*!allDone\s*\)\s*\{\s*handleToggleRoutine\(routine\);\s*\}/,
        'App.jsx must contain "else if (isCompleted && !allDone) handleToggleRoutine(routine)"'
      );
    });

    it('simulates full subtask state machine: check all -> complete, uncheck one -> un-complete', () => {
      const routine = {
        id: 'routine-subtask-1',
        title: 'Complete Project Report',
        weight: 15,
        subtasks: [
          { id: 'st-1', text: 'Draft Introduction', done: false },
          { id: 'st-2', text: 'Perform Data Analysis', done: false },
          { id: 'st-3', text: 'Write Conclusion', done: false }
        ]
      };

      let completedMap = {};
      let currentScore = 0;
      let logs = {};

      function handleToggleRoutine(r) {
        const isDone = !!completedMap[r.id];
        if (!isDone) {
          completedMap[r.id] = true;
          currentScore += r.weight;
          logs[r.id] = { completedAt: new Date().toISOString() };
        } else {
          delete completedMap[r.id];
          currentScore = Math.max(0, currentScore - r.weight);
          delete logs[r.id];
        }
      }

      function handleToggleSubtask(r, subtaskId) {
        const updatedSubtasks = (r.subtasks || []).map((st) =>
          st.id === subtaskId ? { ...st, done: !st.done } : st
        );
        r.subtasks = updatedSubtasks;

        const allDone = updatedSubtasks.length > 0 && updatedSubtasks.every((st) => st.done);
        const isCompleted = !!completedMap[r.id];

        if (allDone && !isCompleted) {
          handleToggleRoutine(r);
        } else if (isCompleted && !allDone) {
          handleToggleRoutine(r);
        }
      }

      // Initial state: not completed, score 0
      assert.strictEqual(completedMap[routine.id], undefined);
      assert.strictEqual(currentScore, 0);

      // 1. Check st-1 -> not all done -> parent remains incomplete
      handleToggleSubtask(routine, 'st-1');
      assert.strictEqual(completedMap[routine.id], undefined);
      assert.strictEqual(currentScore, 0);

      // 2. Check st-2 -> not all done -> parent remains incomplete
      handleToggleSubtask(routine, 'st-2');
      assert.strictEqual(completedMap[routine.id], undefined);
      assert.strictEqual(currentScore, 0);

      // 3. Check st-3 -> ALL DONE -> parent auto-completes, score += 15
      handleToggleSubtask(routine, 'st-3');
      assert.strictEqual(completedMap[routine.id], true, 'Parent routine must be completed when all subtasks done');
      assert.strictEqual(currentScore, 15, 'Score must increase by 15');
      assert.ok(logs[routine.id]);

      // 4. UNCHECK st-2 -> 2/3 done -> Parent MUST un-complete!
      handleToggleSubtask(routine, 'st-2');
      assert.strictEqual(completedMap[routine.id], undefined, 'Parent routine must un-complete when a subtask is unchecked');
      assert.strictEqual(currentScore, 0, 'Score must decrease back by 15 to 0');
      assert.strictEqual(logs[routine.id], undefined, 'Log must be deleted');

      // 5. UNCHECK st-1 -> 1/3 done -> Parent remains uncompleted, no redundant toggle
      handleToggleSubtask(routine, 'st-1');
      assert.strictEqual(completedMap[routine.id], undefined);
      assert.strictEqual(currentScore, 0);

      // 6. RE-CHECK st-1 and st-2 -> ALL DONE again -> Parent re-completes
      handleToggleSubtask(routine, 'st-1');
      assert.strictEqual(completedMap[routine.id], undefined);
      handleToggleSubtask(routine, 'st-2');
      assert.strictEqual(completedMap[routine.id], true, 'Parent must re-complete when all subtasks are checked again');
      assert.strictEqual(currentScore, 15);
    });
  });

  // =========================================================================
  // 2. Quantity Decrement & Checkbox Isolation (src/components/RoutineItem.jsx)
  // =========================================================================
  describe('2. Quantity Decrement & Checkbox Isolation', () => {
    it('verifies RoutineItem.jsx source removes redundant handleToggle in handleQuantityDelta', () => {
      const itemSource = fs.readFileSync(path.resolve('src/components/RoutineItem.jsx'), 'utf-8');

      // Extract handleQuantityDelta function body
      const deltaMatch = itemSource.match(/const\s+handleQuantityDelta\s*=\s*\([^)]*\)\s*=>\s*\{([\s\S]*?)\n\s*\};/);
      assert.ok(deltaMatch, 'handleQuantityDelta must exist in RoutineItem.jsx');
      const deltaBody = deltaMatch[1];

      // Must NOT contain an active handleToggle() call
      const lines = deltaBody.split('\n').filter(l => !l.trim().startsWith('//'));
      const activeCode = lines.join('\n');
      assert.doesNotMatch(
        activeCode,
        /handleToggle\s*\(/,
        'handleQuantityDelta must NOT call handleToggle() (auto-completion is handled in onUpdateQuantity)'
      );
    });

    it('verifies RoutineItem.jsx checkbox button does not trigger double mutation', () => {
      const itemSource = fs.readFileSync(path.resolve('src/components/RoutineItem.jsx'), 'utf-8');

      // Find the checkbox button onClick handler
      const buttonMatch = itemSource.match(/aria-label=\{routine\.isNegative\s*\?[^}]*\}\s*onClick=\{([\s\S]*?)\}\s*className=/);
      assert.ok(buttonMatch, 'Checkbox button onClick must exist');
      const buttonHandler = buttonMatch[1];

      // Verifies proper branching: if (isQuantity && onUpdateQuantity) ... else handleToggle()
      assert.match(
        buttonHandler,
        /if\s*\(\s*isQuantity\s*&&\s*onUpdateQuantity\s*\)\s*\{[\s\S]*?\}\s*else\s*\{\s*handleToggle\(\);?\s*\}/,
        'Checkbox click must mutually branch between onUpdateQuantity and handleToggle to avoid duplicate mutations'
      );
    });

    it('simulates quantity decrement: completed 2.5 L decremented by 0.5 L stays at 2.0 L, uncompletes, does NOT wipe to 0', () => {
      const routine = {
        id: 'routine-qty-1',
        title: 'Drink Water',
        targetQuantity: 2.5,
        unit: 'L',
        weight: 10
      };

      let completedMap = {};
      let quantityMap = {};
      let currentScore = 0;
      let logs = {};

      function handleUpdateQuantity(r, newQty) {
        quantityMap[r.id] = newQty;
        const targetQ = Number(r.targetQuantity) || 1;
        const isCompleted = !!completedMap[r.id];

        if (newQty >= targetQ && !isCompleted) {
          completedMap[r.id] = true;
          currentScore += r.weight;
          logs[r.id] = { currentQuantity: newQty };
        } else if (newQty < targetQ && isCompleted) {
          delete completedMap[r.id];
          currentScore = Math.max(0, currentScore - r.weight);
          delete logs[r.id];
        }
      }

      function handleQuantityDelta(r, delta) {
        const curr = Number(quantityMap[r.id]) || 0;
        const nextVal = Math.max(0, Math.round((curr + delta) * 100) / 100);
        handleUpdateQuantity(r, nextVal);
      }

      // 1. Advance to completion (2.5 L)
      handleQuantityDelta(routine, 2.5);
      assert.strictEqual(quantityMap[routine.id], 2.5);
      assert.strictEqual(completedMap[routine.id], true);
      assert.strictEqual(currentScore, 10);

      // 2. Decrement by 0.5 L (to 2.0 L)
      handleQuantityDelta(routine, -0.5);
      assert.strictEqual(
        quantityMap[routine.id],
        2.0,
        'Progress must remain at 2.0 L and NOT be wiped to 0'
      );
      assert.strictEqual(
        completedMap[routine.id],
        undefined,
        'Routine must be uncompleted because 2.0 < 2.5 target'
      );
      assert.strictEqual(
        currentScore,
        0,
        'Score must be decremented by weight'
      );

      // 3. Decrement again by 0.5 L (to 1.5 L)
      handleQuantityDelta(routine, -0.5);
      assert.strictEqual(quantityMap[routine.id], 1.5);
      assert.strictEqual(completedMap[routine.id], undefined);
      assert.strictEqual(currentScore, 0);

      // 4. Increment back to target (to 2.5 L)
      handleQuantityDelta(routine, 1.0);
      assert.strictEqual(quantityMap[routine.id], 2.5);
      assert.strictEqual(completedMap[routine.id], true, 'Routine must re-complete upon reaching 2.5 L');
      assert.strictEqual(currentScore, 10);
    });
  });

  // =========================================================================
  // 3. Eisenhower Quadrant Exclusivity (src/components/RoutineList.jsx:56-74)
  // =========================================================================
  describe('3. Eisenhower Quadrant Exclusivity & Partition Proof', () => {
    it('verifies RoutineList.jsx partition code conforms to mutually exclusive specification', () => {
      const listSource = fs.readFileSync(path.resolve('src/components/RoutineList.jsx'), 'utf-8');

      assert.match(
        listSource,
        /const\s+q1Tasks\s*=\s*routines\.filter\(\s*\(r\)\s*=>\s*r\.eisenhower\s*===\s*['"]q1['"]\s*\|\|\s*\(r\.isMit\s*&&\s*!r\.eisenhower\)\s*\);/,
        'q1Tasks must match specification'
      );
      assert.match(
        listSource,
        /const\s+q2Tasks\s*=\s*routines\.filter\(\s*\(r\)\s*=>[\s\S]*?r\.eisenhower\s*===\s*['"]q2['"]\s*\|\|\s*\(!r\.eisenhower\s*&&\s*!r\.isMit\s*&&\s*!r\.isTwoMinuteRule\s*&&\s*!r\.isNegative\)/,
        'q2Tasks must match specification'
      );
      assert.match(
        listSource,
        /const\s+q3Tasks\s*=\s*routines\.filter\(\s*\(r\)\s*=>[\s\S]*?r\.eisenhower\s*===\s*['"]q3['"]\s*\|\|\s*\(r\.isTwoMinuteRule\s*&&\s*!r\.eisenhower\s*&&\s*!r\.isMit\)/,
        'q3Tasks must match specification'
      );
      assert.match(
        listSource,
        /const\s+q4Tasks\s*=\s*routines\.filter\(\s*\(r\)\s*=>[\s\S]*?r\.eisenhower\s*===\s*['"]q4['"]\s*\|\|\s*\(r\.isNegative\s*&&\s*!r\.eisenhower\s*&&\s*!r\.isMit\s*&&\s*!r\.isTwoMinuteRule\)/,
        'q4Tasks must match specification'
      );
    });

    it('property test: 3,402 combinatorial routine variations map to EXACTLY ONE quadrant with 0 duplicates', () => {
      const q1Filter = (r) => Boolean(r.eisenhower === 'q1' || (r.isMit && !r.eisenhower));
      const q2Filter = (r) =>
        Boolean(
          r.eisenhower === 'q2' ||
          (!r.eisenhower && !r.isMit && !r.isTwoMinuteRule && !r.isNegative)
        );
      const q3Filter = (r) =>
        Boolean(
          r.eisenhower === 'q3' ||
          (r.isTwoMinuteRule && !r.eisenhower && !r.isMit)
        );
      const q4Filter = (r) =>
        Boolean(
          r.eisenhower === 'q4' ||
          (r.isNegative && !r.eisenhower && !r.isMit && !r.isTwoMinuteRule)
        );

      const eisenhowerValues = [undefined, null, '', 'q1', 'q2', 'q3', 'q4'];
      const booleanValues = [true, false, undefined];
      const difficultyValues = [0, 1, 2, 3, 4, 5];

      let totalTested = 0;

      for (const e of eisenhowerValues) {
        for (const isMit of booleanValues) {
          for (const isTwoMin of booleanValues) {
            for (const isNeg of booleanValues) {
              for (const isRoutine of booleanValues) {
                for (const diff of difficultyValues) {
                  const task = {
                    id: `task-${++totalTested}`,
                    eisenhower: e,
                    isMit,
                    isTwoMinuteRule: isTwoMin,
                    isNegative: isNeg,
                    isRoutine,
                    difficulty: diff
                  };

                  const inQ1 = q1Filter(task) ? 1 : 0;
                  const inQ2 = q2Filter(task) ? 1 : 0;
                  const inQ3 = q3Filter(task) ? 1 : 0;
                  const inQ4 = q4Filter(task) ? 1 : 0;

                  const sum = inQ1 + inQ2 + inQ3 + inQ4;

                  assert.strictEqual(
                    sum,
                    1,
                    `Task ${JSON.stringify(task)} must belong to exactly 1 quadrant, but belonged to ${sum}`
                  );
                }
              }
            }
          }
        }
      }

      assert.strictEqual(totalTested, 3402, 'All 3,402 permutations tested');
    });

    it('specifically verifies previous bug scenarios from iteration 1 are resolved', () => {
      const q1Filter = (r) => Boolean(r.eisenhower === 'q1' || (r.isMit && !r.eisenhower));
      const q2Filter = (r) =>
        Boolean(
          r.eisenhower === 'q2' ||
          (!r.eisenhower && !r.isMit && !r.isTwoMinuteRule && !r.isNegative)
        );
      const q3Filter = (r) =>
        Boolean(
          r.eisenhower === 'q3' ||
          (r.isTwoMinuteRule && !r.eisenhower && !r.isMit)
        );
      const q4Filter = (r) =>
        Boolean(
          r.eisenhower === 'q4' ||
          (r.isNegative && !r.eisenhower && !r.isMit && !r.isTwoMinuteRule)
        );

      // Scenario 1: One-time To-Do with explicit Q1
      const todoQ1 = {
        id: 'todo-q1',
        title: 'Urgent Client Call',
        isRoutine: false,
        isMit: false,
        isTwoMinuteRule: false,
        eisenhower: 'q1'
      };
      assert.strictEqual(q1Filter(todoQ1), true, 'Must map to Q1');
      assert.strictEqual(q2Filter(todoQ1), false, 'Must not duplicate in Q2');
      assert.strictEqual(q3Filter(todoQ1), false, 'Must not duplicate in Q3');
      assert.strictEqual(q4Filter(todoQ1), false, 'Must not duplicate in Q4 (Bug 1 resolved)');

      // Scenario 2: Routine with difficulty 3 and explicit Q4
      const routineQ4 = {
        id: 'routine-q4',
        title: 'Social Media Browsing',
        isRoutine: true,
        difficulty: 3,
        eisenhower: 'q4'
      };
      assert.strictEqual(q4Filter(routineQ4), true, 'Must map to Q4');
      assert.strictEqual(q1Filter(routineQ4), false, 'Must not duplicate in Q1');
      assert.strictEqual(q2Filter(routineQ4), false, 'Must not duplicate in Q2 (Bug 2 resolved)');
      assert.strictEqual(q3Filter(routineQ4), false, 'Must not duplicate in Q3');

      // Scenario 3: To-Do with explicit Q2
      const todoQ2 = {
        id: 'todo-q2',
        title: 'Quarterly Planning',
        isRoutine: false,
        isMit: false,
        isTwoMinuteRule: false,
        eisenhower: 'q2'
      };
      assert.strictEqual(q2Filter(todoQ2), true, 'Must map to Q2');
      assert.strictEqual(q4Filter(todoQ2), false, 'Must not duplicate in Q4');

      // Scenario 4: 2-Minute task with explicit Q1
      const quickQ1 = {
        id: 'quick-q1',
        title: 'Emergency server reboot',
        isTwoMinuteRule: true,
        eisenhower: 'q1'
      };
      assert.strictEqual(q1Filter(quickQ1), true, 'Must map to Q1');
      assert.strictEqual(q3Filter(quickQ1), false, 'Must not duplicate in Q3');
    });
  });
});
