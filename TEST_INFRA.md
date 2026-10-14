# Test Infrastructure Specification: Routine, Performance & Terea Tracker PWA

## 1. Executive Summary & Architecture
This document specifies the automated testing architecture, methodology, and verification strategy for the **120 FPS Apple Minimalist Routine, Performance & Terea Spending Tracker PWA**.

The testing framework is built around **zero external bloat** and **maximum execution speed**:
- **Test Runner**: Node.js built-in test runner (`node:test`)
- **Assertion Library**: Native Node.js strict assertion library (`node:assert/strict`)
- **Module System**: Native ECMAScript Modules (ESM) matching Vite/React 19 configuration (`"type": "module"`)
- **Execution Performance**: Sub-100ms total runtime across the entire test suite, enabling instant feedback during local development and continuous deployment pipelines (GitHub Actions).

---

## 2. Testing Methodology & Tier Breakdown

The test suite is structured into four distinct, rigorous testing tiers based on software engineering verification principles:

```
+-------------------------------------------------------------------------------+
| Tier 4: Real-World Workloads (30-Day Simulated User Lifecycles & Journeys)     |
+-------------------------------------------------------------------------------+
| Tier 3: Combinatorial & Pairwise Testing (Cross-Feature State Transitions)    |
+-------------------------------------------------------------------------------+
| Tier 2: Boundary Value Analysis (BVA) & Edge Cases (Thresholds, Nulls, Limits)|
+-------------------------------------------------------------------------------+
| Tier 1: Category-Partition & Core Logic Units (Pure Functional Calculations)  |
+-------------------------------------------------------------------------------+
```

### Tier 1: Category-Partition (Equivalence Partitioning)
Tests baseline positive paths and standard user behaviors by partitioning inputs into equivalence classes:
- **Terea Unit Math**: Normal consumption counts (5, 10, 20 sticks), standard unit prices (5.0, 6.0, 7.5 TL).
- **Date & Calendar Normalization**: Normal day-to-day transitions, past 7-day rolling window generation.
- **Academic Grading & Gamification**: Representative scores in each grade category (AA, BA, BB, CB, CC, FF).
- **Streak Accumulation**: Consecutive qualifying days without breaks.

### Tier 2: Boundary Value Analysis (BVA) & Edge Conditions
Tests critical boundary transitions where calculation errors or off-by-one bugs most frequently manifest:
- **Terea Boundaries**: Zero consumption (0 sticks), single stick (1 stick = 0.05 packs -> rounded to 0.1), pack threshold (19 vs 20 sticks), and non-negative clamping on decrement.
- **04:00 AM Night Owl Day Boundary**: Transition verification at 03:59:59 (shifts to yesterday) vs 04:00:00 (shifts to today).
- **Flexible Discipline Streak Freeze**: 1-day grace period behavior in rolling 7-day windows, preventing premature freeze consumption on empty or single-day history.
- **Academic Grade Thresholds**: Boundary scores (95 for AA, 85 for BA, 70 for BB, 60 for CB, 50 for CC, 49 for FF).
- **RPG Level Clamping**: Max level 99 boundary (total points exceeding 9,900 points clamped to Level 99), and exact 100 EXP modulo transitions.

### Tier 3: Combinatorial & Pairwise Interaction Testing
Tests orthogonal interactions between distinct application subsystems:
- **Dynamic Price Recalculation × Active Streaks**: Verifies that altering the Terea unit price dynamically recalculates historical expenditures without altering streak counts or routine completions.
- **Night Owl Reset × Calendar Month Rollover**: Verifies that a user completing habits at 01:30 AM on the 1st of a new month attributes routines and spending to the final day of the previous calendar month.
- **JSON Backup Serialization & Deserialization Integrity**: Verifies that full application states (routines, completed logs, day summaries, terea logs, and user settings) can be exported to JSON and restored atomically without data corruption or schema discrepancies.

### Tier 4: Real-World Workload Simulations
Executes a high-fidelity 30-day realistic user journey modeling student habit formation and engineering productivity:
- Simulated Istanbul Technical University (ITU) engineering student routines (Odaklı Mühendislik, Egzersiz, Almanca Leoben hazırlığı, Kitap okuma, Su tüketimi).
- Late-night study sessions between 00:00 and 03:30 AM leveraging Night Owl 04:00 AM reset.
- Realistic Terea consumption fluctuations (8-16 sticks/day) with stick price updates mid-month.
- Strategic use of Flexible Discipline 1-day weekly streak freeze during intense exam days.
- Overachievement days (>100 points) triggering bonus flags and Level 1 -> Level 2+ character progression.

---

## 3. Test Suite Organization

| Test File | Target Subsystems | Tiers Covered |
|-----------|-------------------|---------------|
| `test/terea_calculations.test.js` | Financial calculation engine, stick/pack conversion, rolling 7-day, calendar month-to-date, all-time, daily average, price updates | Tier 1, Tier 2 |
| `test/date_and_streaks.test.js` | 04:00 AM Night Owl boundary logic, calendar date formatting, `calculateStreaks` engine, Flexible Discipline weekly freeze | Tier 1, Tier 2 |
| `test/gamification.test.js` | Academic letter grades (AA-FF), RPG Level & EXP progression, 100-Point circular progress ring, bonus overachievement flags | Tier 1, Tier 2 |
| `test/cross_feature_combinations.test.js` | Pairwise state matrix: Price update during streak, Night Owl reset during month rollover, backup serialization round-trip | Tier 3 |
| `test/real_world_scenarios.test.js` | End-to-end 30-day realistic user simulation, lifecycle continuity, cumulative statistics, milestone badges | Tier 4 |

---

## 4. Execution & CI Integration

### Local Execution (Windows / Cross-Platform)
```bash
# Run via npm test
cmd.exe /c npm.cmd test

# Or run directly with native Node.js test runner
node --test
```

### Continuous Integration (GitHub Actions)
Configured in `.github/workflows/deploy.yml` to automatically execute before any build and deployment:
```yaml
- name: Run Test Suite
  run: node --test
```
A non-zero exit code immediately halts the deployment pipeline, ensuring that zero regressions reach production.
