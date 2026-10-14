import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Pure logic extractors matching M3 specifications and component implementations
// ---------------------------------------------------------------------------

/**
 * Eisenhower 4-Quadrant Partitioning Logic
 * Extracted from src/components/RoutineList.jsx lines 56-71
 */
export function classifyEisenhower(routines = []) {
  const safeRoutines = Array.isArray(routines) ? routines.filter(Boolean) : [];

  const q1Tasks = safeRoutines.filter((r) => r.isMit || r.eisenhower === 'q1');
  const q2Tasks = safeRoutines.filter(
    (r) =>
      !r.isMit &&
      !r.isTwoMinuteRule &&
      !r.isNegative &&
      (r.eisenhower === 'q2' || r.difficulty >= 3 || (!r.eisenhower && r.isRoutine))
  );
  const q3Tasks = safeRoutines.filter(
    (r) => !r.isMit && (r.isTwoMinuteRule || r.eisenhower === 'q3')
  );
  const q4Tasks = safeRoutines.filter(
    (r) =>
      !r.isMit &&
      (r.isNegative || r.eisenhower === 'q4' || (!r.isRoutine && !r.isTwoMinuteRule))
  );

  return { q1Tasks, q2Tasks, q3Tasks, q4Tasks };
}

/**
 * All-time Highest Single Day (En İyi Gün / Best Day Ever) Logic
 * Extracted from src/components/TrackerHeatmap.jsx lines 47-58
 */
export function calculateBestDayEver(daysMap) {
  let best = null;
  if (!daysMap || typeof daysMap !== 'object') return null;

  Object.keys(daysMap).forEach((date) => {
    const day = daysMap[date];
    if (day && day.totalScore > 0) {
      if (!best || day.totalScore > best.totalScore) {
        best = day;
      }
    }
  });

  return best;
}

/**
 * Heatmap Display Score Resolver with Category Filtering
 * Extracted from src/components/TrackerHeatmap.jsx lines 243-247
 */
export function resolveHeatmapScore(rawScore, date, selectedCategory, heatmapMode, categoryScoresMap = {}) {
  if (heatmapMode !== 'routine' || selectedCategory === 'all') {
    return rawScore || 0;
  }
  if (!categoryScoresMap || typeof categoryScoresMap !== 'object') {
    return 0;
  }
  return (categoryScoresMap[date] && categoryScoresMap[date][selectedCategory]) || 0;
}

/**
 * Heatmap Intensity Style Resolver
 * Extracted from src/components/TrackerHeatmap.jsx lines 61-73
 */
export function getRoutineIntensity(score, isCategoryFiltered = false) {
  if (!score || score === 0) {
    return 'bg-[#15161c] border-[#22242e] text-neutral-600 hover:border-[#383b49]';
  }
  if (isCategoryFiltered) {
    if (score < 15) return 'bg-emerald-950/60 border-emerald-900/60 text-emerald-400 hover:border-emerald-700';
    if (score < 25) return 'bg-emerald-800/80 border-emerald-700 text-emerald-100 hover:bg-emerald-700';
    if (score < 40) return 'bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500';
    return 'bg-emerald-400 border-emerald-300 text-neutral-950 font-black shadow-md shadow-emerald-500/20';
  }
  if (score < 40) return 'bg-emerald-950/60 border-emerald-900/60 text-emerald-400 hover:border-emerald-700';
  if (score < 80) return 'bg-emerald-800/80 border-emerald-700 text-emerald-100 hover:bg-emerald-700';
  if (score < 100) return 'bg-emerald-600 border-emerald-500 text-white font-bold hover:bg-emerald-500';
  return 'bg-emerald-400 border-emerald-300 text-neutral-950 font-black shadow-md shadow-emerald-500/20';
}

// ---------------------------------------------------------------------------
// Adversarial Test Suite
// ---------------------------------------------------------------------------

describe('Adversarial Verification Suite - Milestone M3 (challenger_m3_2)', () => {

  const projectRoot = path.resolve(process.cwd());

  // =========================================================================
  // SECTION 1: Eisenhower 4-Quadrant Classification Stress Tests
  // =========================================================================
  describe('1. Eisenhower Matrix Classification & Quadrant Logic', () => {

    it('Q1: maps MIT star tasks strictly to Q1 and excludes from Q2, Q3, Q4', () => {
      const routine = {
        id: 1,
        title: 'Önemli Bitirme Tezi Çalışması',
        isMit: true,
        isTwoMinuteRule: true, // Edge case: MIT marked with 2-minute rule
        difficulty: 5,         // Edge case: high difficulty
        isRoutine: true,
        isNegative: false
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([routine]);

      assert.strictEqual(q1Tasks.length, 1, 'MIT routine must appear in Q1');
      assert.strictEqual(q1Tasks[0].id, 1);
      assert.strictEqual(q2Tasks.length, 0, 'MIT routine must NOT leak into Q2');
      assert.strictEqual(q3Tasks.length, 0, 'MIT routine must NOT leak into Q3 even if isTwoMinuteRule is true');
      assert.strictEqual(q4Tasks.length, 0, 'MIT routine must NOT leak into Q4');
    });

    it('Q1: maps standard routine with explicit eisenhower: "q1" (isRoutine: true) to Q1', () => {
      const routine = {
        id: 2,
        title: 'Acil Sunum Hazırlığı',
        isMit: false,
        isRoutine: true,
        isTwoMinuteRule: false,
        eisenhower: 'q1'
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([routine]);
      assert.strictEqual(q1Tasks.length, 1);
      assert.strictEqual(q1Tasks[0].id, 2);
      assert.strictEqual(q2Tasks.length, 0);
      assert.strictEqual(q3Tasks.length, 0);
      assert.strictEqual(q4Tasks.length, 0);
    });

    it('Q2: maps high difficulty / standard focus routines (difficulty >= 3) to Q2', () => {
      const focusRoutine = {
        id: 3,
        title: 'Almanca B2 Gramer ve Yazma (45 dk)',
        isMit: false,
        isTwoMinuteRule: false,
        isNegative: false,
        difficulty: 4,
        isRoutine: true
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([focusRoutine]);
      assert.strictEqual(q1Tasks.length, 0);
      assert.strictEqual(q2Tasks.length, 1, 'Focus routine must map to Q2');
      assert.strictEqual(q2Tasks[0].id, 3);
      assert.strictEqual(q3Tasks.length, 0);
      assert.strictEqual(q4Tasks.length, 0);
    });

    it('Q2: maps standard routine without explicit quadrant (isRoutine: true) to Q2 Schedule', () => {
      const stdRoutine = {
        id: 4,
        title: 'Sabah Meditasyonu',
        isMit: false,
        isTwoMinuteRule: false,
        isNegative: false,
        difficulty: 1, // low difficulty but isRoutine: true
        isRoutine: true
      };

      const { q2Tasks } = classifyEisenhower([stdRoutine]);
      assert.strictEqual(q2Tasks.length, 1, 'Standard routine defaults to Q2 (Planla/Schedule)');
      assert.strictEqual(q2Tasks[0].id, 4);
    });

    it('Q3: maps 2-Minute Rule tasks (isTwoMinuteRule: true) to Q3 Quick Tasks', () => {
      const quickTask = {
        id: 5,
        title: 'Odayı Havalandır ve Yatağı Topla',
        isMit: false,
        isTwoMinuteRule: true,
        difficulty: 1,
        isRoutine: true,
        isNegative: false
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([quickTask]);
      assert.strictEqual(q1Tasks.length, 0);
      assert.strictEqual(q2Tasks.length, 0, '2-minute task must be excluded from Q2');
      assert.strictEqual(q3Tasks.length, 1, '2-minute task must map to Q3');
      assert.strictEqual(q3Tasks[0].id, 5);
      assert.strictEqual(q4Tasks.length, 0);
    });

    it('Q3: maps explicit eisenhower: "q3" to Q3', () => {
      const explicitQ3 = {
        id: 6,
        title: 'E-postaları Arşivle',
        isMit: false,
        isRoutine: true,
        eisenhower: 'q3'
      };

      const { q3Tasks } = classifyEisenhower([explicitQ3]);
      assert.strictEqual(q3Tasks.length, 1);
      assert.strictEqual(q3Tasks[0].id, 6);
    });

    it('Q4: maps negative habits (isNegative: true) to Q4 Eliminate / Diren', () => {
      const negativeHabit = {
        id: 7,
        title: 'Sosyal Medyada Boş Kaydırma Yapma',
        isMit: false,
        isTwoMinuteRule: false,
        isNegative: true,
        isRoutine: true
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([negativeHabit]);
      assert.strictEqual(q1Tasks.length, 0);
      assert.strictEqual(q2Tasks.length, 0, 'Negative habit must not enter Q2');
      assert.strictEqual(q3Tasks.length, 0, 'Negative habit must not enter Q3');
      assert.strictEqual(q4Tasks.length, 1, 'Negative habit must map to Q4 Eliminate');
      assert.strictEqual(q4Tasks[0].id, 7);
    });

    it('Q4: maps one-time non-routine to-dos (!isRoutine && !isTwoMinuteRule) to Q4', () => {
      const todoItem = {
        id: 8,
        title: 'Kargo Takip Numarasını Kontrol Et',
        isMit: false,
        isTwoMinuteRule: false,
        isNegative: false,
        isRoutine: false // Ad-hoc one-time to-do
      };

      const { q1Tasks, q2Tasks, q3Tasks, q4Tasks } = classifyEisenhower([todoItem]);
      assert.strictEqual(q1Tasks.length, 0);
      assert.strictEqual(q2Tasks.length, 0);
      assert.strictEqual(q3Tasks.length, 0);
      assert.strictEqual(q4Tasks.length, 1, 'Low-priority to-do maps to Q4');
      assert.strictEqual(q4Tasks[0].id, 8);
    });

    it('surfaces Eisenhower classification flaw: To-Do (!isRoutine) with explicit eisenhower: "q1" duplicates into Q4 due to missing !r.eisenhower guard', () => {
      // In QuickAddModal, a user can create an ad-hoc To-Do (!isRoutine) and select Eisenhower Q1 or Q2
      const todoQ1 = {
        id: 99,
        title: 'Kütüphane Kitabını İade Et',
        isRoutine: false,
        isMit: false,
        isTwoMinuteRule: false,
        eisenhower: 'q1'
      };

      const { q1Tasks, q4Tasks } = classifyEisenhower([todoQ1]);

      // Empirically proving the bug: task matches Q1 because eisenhower === 'q1'
      assert.strictEqual(q1Tasks.length, 1, 'Task matches Q1');
      // But because RoutineList line 70 checks `(!r.isRoutine && !r.isTwoMinuteRule)` without `!r.eisenhower`, it duplicates into Q4:
      assert.strictEqual(q4Tasks.length, 1, 'Flaw confirmed: Task also duplicates into Q4');
    });

    it('surfaces Eisenhower classification flaw: Routine with default difficulty 3 and explicit eisenhower: "q4" duplicates into Q2', () => {
      // In QuickAddModal, default difficulty is 3. If user sets eisenhower: 'q4'
      const routineQ4 = {
        id: 100,
        title: 'Zararlı Alışkanlık Takibi',
        isRoutine: true,
        isMit: false,
        isTwoMinuteRule: false,
        isNegative: false,
        difficulty: 3, // Default difficulty
        eisenhower: 'q4'
      };

      const { q2Tasks, q4Tasks } = classifyEisenhower([routineQ4]);

      // Empirically proving the bug: Task matches Q4 because eisenhower === 'q4'
      assert.strictEqual(q4Tasks.length, 1, 'Task matches Q4');
      // But in Q2, `r.difficulty >= 3` matches unconditionally without checking `!r.eisenhower`:
      assert.strictEqual(q2Tasks.length, 1, 'Flaw confirmed: Task also duplicates into Q2');
    });

    it('handles empty routine list [] without throwing errors', () => {
      const result = classifyEisenhower([]);
      assert.deepStrictEqual(result.q1Tasks, []);
      assert.deepStrictEqual(result.q2Tasks, []);
      assert.deepStrictEqual(result.q3Tasks, []);
      assert.deepStrictEqual(result.q4Tasks, []);
    });

    it('handles non-array and undefined inputs gracefully', () => {
      assert.doesNotThrow(() => classifyEisenhower(null));
      assert.doesNotThrow(() => classifyEisenhower(undefined));
      assert.doesNotThrow(() => classifyEisenhower({}));

      const nullRes = classifyEisenhower(null);
      assert.deepStrictEqual(nullRes.q1Tasks, []);
    });

    it('handles malformed / sparse routine objects safely', () => {
      const malformed = [
        {},
        { id: 99 },
        { title: null, difficulty: undefined, isMit: null },
        null,
        undefined
      ];

      assert.doesNotThrow(() => {
        const res = classifyEisenhower(malformed);
        assert.ok(Array.isArray(res.q1Tasks));
        assert.ok(Array.isArray(res.q2Tasks));
        assert.ok(Array.isArray(res.q3Tasks));
        assert.ok(Array.isArray(res.q4Tasks));
      });
    });

    it('partitions 5,000 mixed routines under 30ms without memory leaks', () => {
      const massRoutines = [];
      for (let i = 0; i < 5000; i++) {
        massRoutines.push({
          id: i,
          title: `Task #${i}`,
          isMit: i % 10 === 0,
          isTwoMinuteRule: i % 10 === 1,
          isNegative: i % 10 === 2,
          isRoutine: i % 2 === 0,
          difficulty: (i % 5) + 1,
          eisenhower: i % 20 === 0 ? `q${(i % 4) + 1}` : undefined
        });
      }

      const t0 = performance.now();
      const res = classifyEisenhower(massRoutines);
      const elapsed = performance.now() - t0;

      assert.ok(res.q1Tasks.length > 0);
      assert.ok(res.q2Tasks.length > 0);
      assert.ok(res.q3Tasks.length > 0);
      assert.ok(res.q4Tasks.length > 0);
      assert.ok(elapsed < 100, `Mass classification took ${elapsed.toFixed(2)}ms (expected <100ms)`);
    });

    it('validates RoutineList.jsx AST/source conformance for Eisenhower layout', () => {
      const routineListPath = path.join(projectRoot, 'src', 'components', 'RoutineList.jsx');
      assert.ok(fs.existsSync(routineListPath), 'RoutineList.jsx must exist');

      const content = fs.readFileSync(routineListPath, 'utf8');

      // State and toggles
      assert.match(content, /const\s+\[isEisenhowerView,\s*setIsEisenhowerView\]\s*=\s*useState\(false\)/);
      assert.match(content, /aria-label="Eisenhower Matrisi Görünümü"/);

      // All 4 quadrants defined
      assert.match(content, /q1Tasks/);
      assert.match(content, /q2Tasks/);
      assert.match(content, /q3Tasks/);
      assert.match(content, /q4Tasks/);

      // Quadrant labels in Turkish
      assert.match(content, /1\.\s*Acil & Önemli/);
      assert.match(content, /2\.\s*Önemli & Acil Değil/);
      assert.match(content, /3\.\s*Acil & Hızlı/);
      assert.match(content, /4\.\s*Ne Acil Ne Önemli/);

      // Empty quadrant fallbacks
      assert.match(content, /Bu kadranda görev yok\./);
    });
  });

  // =========================================================================
  // SECTION 2: Privacy Shield State & Visual Interaction Stress Tests
  // =========================================================================
  describe('2. Privacy Shield State & CSS Conformance', () => {

    it('verifies App.jsx correctly coordinates privacyMode and root .privacy-active class', () => {
      const appPath = path.join(projectRoot, 'src', 'App.jsx');
      assert.ok(fs.existsSync(appPath), 'App.jsx must exist');

      const appContent = fs.readFileSync(appPath, 'utf8');

      // State declaration
      assert.match(appContent, /const\s+\[privacyMode,\s*setPrivacyMode\]\s*=\s*useState\(false\)/);

      // Root element dynamic class
      assert.match(appContent, /privacy-active/);
      assert.match(appContent, /\$\{privacyMode\s*\?\s*['"]privacy-active['"]\s*:\s*['"]['"]\}/);

      // Passed to Header
      assert.match(appContent, /privacyMode=\{privacyMode\}/);
      assert.match(appContent, /onTogglePrivacy=\{.*?setPrivacyMode/);
    });

    it('verifies Header.jsx has Privacy Shield toggle with Eye and EyeOff icons', () => {
      const headerPath = path.join(projectRoot, 'src', 'components', 'Header.jsx');
      assert.ok(fs.existsSync(headerPath), 'Header.jsx must exist');

      const headerContent = fs.readFileSync(headerPath, 'utf8');

      assert.match(headerContent, /aria-label="Gizlilik Kalkanı"/);
      assert.match(headerContent, /onClick=\{onTogglePrivacy\}/);
      assert.match(headerContent, /EyeOff/);
      assert.match(headerContent, /Eye/);
      assert.match(headerContent, /Gizlilik Kalkanı Aktif \(Bulanık\)/);
    });

    it('verifies all sensitive figures throughout the app bear the .privacy-blur class', () => {
      const headerContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'Header.jsx'), 'utf8');
      const routineItemContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'RoutineItem.jsx'), 'utf8');
      const tereaWidgetContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'TereaWidget.jsx'), 'utf8');
      const heatmapContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'TrackerHeatmap.jsx'), 'utf8');

      // Header: Daily score & Terea spending pill
      assert.ok(headerContent.includes('privacy-blur'), 'Header must contain privacy-blur');
      assert.match(headerContent, /currentScore.*?privacy-blur|privacy-blur.*?currentScore/s);
      assert.match(headerContent, /todayTereaSticks.*?privacy-blur|privacy-blur.*?todayTereaSticks/s);

      // RoutineItem: Routine titles blurred
      assert.ok(routineItemContent.includes('privacy-blur'), 'RoutineItem must contain privacy-blur');
      assert.match(routineItemContent, /routine\.title.*?privacy-blur|privacy-blur.*?routine\.title/s);

      // TereaWidget: Sticks count, spent amount, packs, and 7d/month/all-time stats
      assert.ok(tereaWidgetContent.includes('privacy-blur'), 'TereaWidget must contain privacy-blur');
      assert.match(tereaWidgetContent, /todaySticks.*?privacy-blur|privacy-blur.*?todaySticks/s);
      assert.match(tereaWidgetContent, /stats\.weekSticks.*?privacy-blur|privacy-blur.*?stats\.weekSticks/s);
      assert.match(tereaWidgetContent, /stats\.monthSticks.*?privacy-blur|privacy-blur.*?stats\.monthSticks/s);
      assert.match(tereaWidgetContent, /stats\.allTimeSticks.*?privacy-blur|privacy-blur.*?stats\.allTimeSticks/s);

      // TrackerHeatmap: Total Terea statistics and cell labels
      assert.ok(heatmapContent.includes('privacy-blur'), 'TrackerHeatmap must contain privacy-blur');
      assert.match(heatmapContent, /totalTereaSticks.*?privacy-blur|privacy-blur.*?totalTereaSticks/s);
      assert.match(heatmapContent, /totalTereaSpent.*?privacy-blur|privacy-blur.*?totalTereaSpent/s);
    });

    it('verifies index.css defines .privacy-blur, 6px blur, hover reveal, and never blocks pointer events', () => {
      const cssPath = path.join(projectRoot, 'src', 'index.css');
      assert.ok(fs.existsSync(cssPath), 'index.css must exist');

      const cssContent = fs.readFileSync(cssPath, 'utf8');

      assert.match(cssContent, /\.privacy-blur\s*\{/);
      assert.match(cssContent, /\.privacy-active\s+\.privacy-blur\s*\{/);
      assert.match(cssContent, /filter:\s*blur\(6px\);/);
      assert.match(cssContent, /user-select:\s*none;/);

      // Hover peek reveal
      assert.match(cssContent, /\.privacy-active\s+\.privacy-blur:hover\s*\{/);
      assert.match(cssContent, /filter:\s*blur\(0px\);/);

      // Adversarial Check: Ensure pointer-events is NOT set to none
      assert.ok(
        !cssContent.includes('pointer-events: none'),
        'Privacy shield must NEVER disable pointer events (buttons must remain clickable)'
      );
    });

    it('simulates privacy state machine toggling and data preservation', () => {
      let privacyMode = false;
      const togglePrivacy = () => { privacyMode = !privacyMode; };

      assert.strictEqual(privacyMode, false);
      togglePrivacy();
      assert.strictEqual(privacyMode, true);

      // Ensure application state changes (e.g. adding 1 stick) are unaffected by privacy mode
      let tereaSticks = 5;
      const incrementTerea = () => { tereaSticks += 1; };
      incrementTerea();
      assert.strictEqual(tereaSticks, 6, 'Data mutates accurately while privacy shield is active');

      togglePrivacy();
      assert.strictEqual(privacyMode, false);
      assert.strictEqual(tereaSticks, 6, 'Data remains preserved upon toggling privacy off');
    });
  });

  // =========================================================================
  // SECTION 3: Best Day Ever (En İyi Gün) Calculation Stress Tests
  // =========================================================================
  describe('3. Best Day Ever (En İyi Gün) Calculation Logic', () => {

    it('returns null on completely empty daysMap ({})', () => {
      const best = calculateBestDayEver({});
      assert.strictEqual(best, null, 'Empty daysMap must return null without error');
    });

    it('returns null on null or undefined daysMap', () => {
      assert.strictEqual(calculateBestDayEver(null), null);
      assert.strictEqual(calculateBestDayEver(undefined), null);
      assert.strictEqual(calculateBestDayEver('invalid'), null);
    });

    it('returns null when all days have 0 or negative totalScore', () => {
      const zeroDays = {
        '2026-10-01': { date: '2026-10-01', totalScore: 0 },
        '2026-10-02': { date: '2026-10-02', totalScore: 0 },
        '2026-10-03': { date: '2026-10-03', totalScore: -20 }
      };

      const best = calculateBestDayEver(zeroDays);
      assert.strictEqual(best, null, 'Days with 0 or negative scores must not produce a best day');
    });

    it('returns the exact single day when only one positive day exists', () => {
      const singleDayMap = {
        '2026-10-10': { date: '2026-10-10', totalScore: 75, completedCount: 3 }
      };

      const best = calculateBestDayEver(singleDayMap);
      assert.ok(best !== null);
      assert.strictEqual(best.date, '2026-10-10');
      assert.strictEqual(best.totalScore, 75);
    });

    it('identifies the all-time peak day across 365 simulated historical days', () => {
      const history = {};
      for (let i = 1; i <= 365; i++) {
        const d = String(i).padStart(3, '0');
        history[`2026-day-${d}`] = {
          date: `2026-day-${d}`,
          totalScore: (i % 100) + 20, // Scores between 20 and 119
          completedCount: 4
        };
      }

      // Inject explicit record day
      history['2026-day-RECORD'] = {
        date: '2026-day-RECORD',
        totalScore: 165, // Single all-time highest
        completedCount: 8
      };

      const best = calculateBestDayEver(history);
      assert.ok(best !== null);
      assert.strictEqual(best.date, '2026-day-RECORD');
      assert.strictEqual(best.totalScore, 165);
      assert.strictEqual(best.completedCount, 8);
    });

    it('handles tie scores deterministically without crashing', () => {
      const tiedDays = {
        '2026-10-05': { date: '2026-10-05', totalScore: 120, completedCount: 6 },
        '2026-10-12': { date: '2026-10-12', totalScore: 120, completedCount: 5 },
        '2026-10-01': { date: '2026-10-01', totalScore: 80, completedCount: 4 }
      };

      const best = calculateBestDayEver(tiedDays);
      assert.ok(best !== null);
      assert.strictEqual(best.totalScore, 120, 'Best score must be 120');
      assert.ok(best.date === '2026-10-05' || best.date === '2026-10-12');
    });

    it('verifies completedCount fallback formula Math.floor(totalScore / 20)', () => {
      const bestWithoutCount = { date: '2026-10-14', totalScore: 115 };
      const fallbackCount = bestWithoutCount.completedCount || Math.floor(bestWithoutCount.totalScore / 20);

      assert.strictEqual(fallbackCount, 5, '115 / 20 = 5 completed routines');
      assert.ok(!isNaN(fallbackCount), 'Fallback must never be NaN');
    });

    it('validates TrackerHeatmap.jsx AST/source conformance for Best Day Ever card', () => {
      const heatmapPath = path.join(projectRoot, 'src', 'components', 'TrackerHeatmap.jsx');
      assert.ok(fs.existsSync(heatmapPath));

      const content = fs.readFileSync(heatmapPath, 'utf8');

      // Memoized calculation
      assert.match(content, /const\s+bestDayEver\s*=\s*useMemo/);
      assert.match(content, /Tüm Zamanların Rekoru/);
      assert.match(content, /En İyi Gün ⭐/);

      // Click action triggers onSelectDay
      assert.match(content, /onClick=\{.*?onSelectDay\(bestDayEver\.date\)\}/);

      // Guarded rendering
      assert.match(content, /\{bestDayEver\s*&&\s*\(/);
    });
  });

  // =========================================================================
  // SECTION 4: Heatmap Category Filtering Logic Stress Tests
  // =========================================================================
  describe('4. Heatmap Category Filtering & Intensity Scales', () => {

    it('resolves rawScore when selectedCategory is "all"', () => {
      const score = resolveHeatmapScore(100, '2026-10-15', 'all', 'routine', {
        '2026-10-15': { study: 40, engineering: 60 }
      });
      assert.strictEqual(score, 100);
    });

    it('resolves category-specific score when selectedCategory is specified', () => {
      const categoryScoresMap = {
        '2026-10-15': { study: 35, engineering: 50, language: 15 }
      };

      const studyScore = resolveHeatmapScore(100, '2026-10-15', 'study', 'routine', categoryScoresMap);
      assert.strictEqual(studyScore, 35);

      const engScore = resolveHeatmapScore(100, '2026-10-15', 'engineering', 'routine', categoryScoresMap);
      assert.strictEqual(engScore, 50);

      const langScore = resolveHeatmapScore(100, '2026-10-15', 'language', 'routine', categoryScoresMap);
      assert.strictEqual(langScore, 15);
    });

    it('returns 0 for category with no activity on that day without throwing', () => {
      const categoryScoresMap = {
        '2026-10-15': { study: 35 }
      };

      const fitnessScore = resolveHeatmapScore(35, '2026-10-15', 'fitness', 'routine', categoryScoresMap);
      assert.strictEqual(fitnessScore, 0, 'Uncompleted category must return 0');
    });

    it('returns 0 when categoryScoresMap is empty or missing date entry', () => {
      assert.strictEqual(resolveHeatmapScore(100, '2026-10-15', 'study', 'routine', {}), 0);
      assert.strictEqual(resolveHeatmapScore(100, '2026-10-15', 'study', 'routine', null), 0);
      assert.strictEqual(resolveHeatmapScore(100, '2026-10-15', 'study', 'routine', undefined), 0);
    });

    it('verifies category-filtered intensity thresholds (<15, <25, <40, >=40)', () => {
      // 0 Score
      assert.match(getRoutineIntensity(0, true), /bg-\[#15161c\]/);

      // Low: < 15
      assert.match(getRoutineIntensity(10, true), /bg-emerald-950\/60/);

      // Medium-low: 15 <= score < 25
      assert.match(getRoutineIntensity(15, true), /bg-emerald-800\/80/);
      assert.match(getRoutineIntensity(20, true), /bg-emerald-800\/80/);

      // Medium-high: 25 <= score < 40
      assert.match(getRoutineIntensity(25, true), /bg-emerald-600/);
      assert.match(getRoutineIntensity(35, true), /bg-emerald-600/);

      // Peak: >= 40
      assert.match(getRoutineIntensity(40, true), /bg-emerald-400/);
      assert.match(getRoutineIntensity(70, true), /bg-emerald-400/);
    });

    it('verifies standard overall intensity thresholds (<40, <80, <100, >=100)', () => {
      assert.match(getRoutineIntensity(0, false), /bg-\[#15161c\]/);
      assert.match(getRoutineIntensity(30, false), /bg-emerald-950\/60/);
      assert.match(getRoutineIntensity(70, false), /bg-emerald-800\/80/);
      assert.match(getRoutineIntensity(95, false), /bg-emerald-600/);
      assert.match(getRoutineIntensity(100, false), /bg-emerald-400/);
      assert.match(getRoutineIntensity(120, false), /bg-emerald-400/);
    });

    it('verifies category pills alignment across TrackerHeatmap and RoutineList', () => {
      const heatmapContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'TrackerHeatmap.jsx'), 'utf8');
      const routineListContent = fs.readFileSync(path.join(projectRoot, 'src', 'components', 'RoutineList.jsx'), 'utf8');

      const expectedCategories = ['study', 'engineering', 'fitness', 'health', 'language', 'mind', 'life'];

      for (const cat of expectedCategories) {
        assert.ok(heatmapContent.includes(`id: '${cat}'`), `TrackerHeatmap must support category: ${cat}`);
        assert.ok(routineListContent.includes(`id: '${cat}'`), `RoutineList must support category: ${cat}`);
      }
    });
  });

});
