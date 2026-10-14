# Project: 120 FPS Apple Minimalist Routine, Performance & Terea Spending Tracker PWA

## Architecture
- **Framework & Runtime**: React 19 + Vite 8 + Tailwind CSS v4 running on Node v24.19.0.
- **Storage Layer**: 100% local-first IndexedDB via Dexie.js (Version 3 schema with compound indexes `[date+routineId]` and `[category+timeOfDay]`).
- **UI & Animation**: 120 FPS compositor-only CSS spring physics (`cubic-bezier(0.2, 0.8, 0.2, 1)`), Apple Slate (`#0f1014`), OLED Black (`#000000`), and Paper Light (`#f8f9fa`) themes, tabular numerics, SF Pro typography.
- **Sensory Feedback**: Pure procedural Web Audio API synthesizers (zero external audio files) and `navigator.vibrate` tactile haptic simulation.
- **Discipline & Logic**: 04:00 AM Night Owl boundary reset, Flexible Discipline weekly streak freeze, RPG Level/EXP (1-99), Academic letter grades (AA-FF).
- **Security & Privacy**: Web Crypto SHA-256 PIN security lock, Privacy Shield (blur mode), atomic transactional JSON backup/restore.
- **Deployment & PWA**: Standalone PWA with Service Worker offline caching, GitHub Actions 7/24 CI/CD deploying to GitHub Pages.

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Stick Counter (+ / -) | Touch-optimized instant counter for daily stick consumption | M2 | ORIGINAL_REQUEST §R1 |
| 2 | Configurable Stick & Pack Price | Persistent setting for price per stick with automatic pack calculation (20 sticks/pack) | M2 | ORIGINAL_REQUEST §R1 |
| 3 | Real-Time Today Expenditure | Computes today's sticks, pack equivalent, and total TL spent | M2 | ORIGINAL_REQUEST §R1 |
| 4 | Rolling 7-Day Expenditure | Aggregate stick count, pack count, and TL spending for past 7 days | M2 | ORIGINAL_REQUEST §R1 |
| 5 | Current Calendar Month Expenditure | Total spending and packs consumed from the 1st of current month to date | M2 | ORIGINAL_REQUEST §R1 |
| 6 | All-Time Cumulative Statistics | Cumulative stick count, packs consumed, all-time TL spent, daily average, and projected monthly cost | M2 | ORIGINAL_REQUEST §R1 |
| 7 | Persistent Timestamped Audit Log | Every increment logged to IndexedDB store `tereaLogs` with timestamp and unit price | M2 | ORIGINAL_REQUEST §R1 |
| 8 | Dynamic / Retroactive Recalculation | Changing stick price in settings immediately updates all past/present spending statistics across UI | M2 | ORIGINAL_REQUEST §R1 |
| 9 | Routine Completion Toggle | Tap on routine item toggles completion state, awards points, and updates daily score | M2 | ORIGINAL_REQUEST §R2 |
| 10 | Quantity Tracker | Metric-based tracking for measurable habits (e.g., 2.5 Liters water, 20 pages book, 7500 steps) | M3 | ORIGINAL_REQUEST §R2 |
| 11 | 2-Minute Rule Tag | Visual tag (`⚡ 2-Dk`) identifying atomic habits actionable under 2 minutes | M3 | ORIGINAL_REQUEST §R2 |
| 12 | MIT (Most Important Task) Star | Designates top 1-3 critical priorities for the day with a gold star | M3 | ORIGINAL_REQUEST §R2 |
| 13 | Habit Stacking Links | Connects a trigger routine to an anchor routine ("After X, I will do Y") | M3 | ORIGINAL_REQUEST §R2 |
| 14 | Sub-Checklists | Nested sub-items within a parent routine (e.g., workout steps, study sections) | M3 | ORIGINAL_REQUEST §R2 |
| 15 | Negative Habit Tracking | Tracks habits to eliminate or resist (e.g., junk food, late screen time) | M3 | ORIGINAL_REQUEST §R2 |
| 16 | Routine Freeze | Freezes specific routine(s) during illness, exam period, or travel without streak penalty | M3 | ORIGINAL_REQUEST §R2 |
| 17 | Routine Creation & To-Do Creation | Form to add recurring daily routines or single one-time to-dos | M2 | ORIGINAL_REQUEST §R2 |
| 18 | Routine Deletion & Cascade | Delete routine and clean up associated historical logs | M2 | ORIGINAL_REQUEST §R2 |
| 19 | Default Seeded Routines | Production-ready default routines tailored to engineering & academic productivity | M2 | ORIGINAL_REQUEST §R2 |
| 20 | RPG Level & EXP Progression | Converts cumulative points into RPG Character Levels (Level 1-99) | M2 | ORIGINAL_REQUEST §R2 |
| 21 | Academic Letter Grades | Evaluates daily performance into university letter grades (AA, BA, BB, CB, CC, FF) | M2 | ORIGINAL_REQUEST §R2 |
| 22 | Badges Showcase Modal | Displays unlocked and locked achievements based on habit and Terea milestones | M3 | ORIGINAL_REQUEST §R2 |
| 23 | 100-Point Circular Progress Ring | Animated SVG circular progress indicator reflecting daily completion percentage | M2 | ORIGINAL_REQUEST §R2 |
| 24 | Micro-Confetti Overachievement Burst | Canvas confetti burst when reaching 100 points or exceeding target | M2 | ORIGINAL_REQUEST §R2 |
| 25 | 70-Day Interactive Matrix | 10-week calendar grid displaying daily performance intensity | M3 | ORIGINAL_REQUEST §R2 |
| 26 | Dual-Mode Heatmap Switcher | Toggle between Routine Performance heatmap and Terea Consumption heatmap | M3 | ORIGINAL_REQUEST §R2 |
| 27 | 7-Day Trend Bar Chart | Bar chart comparing past 7 days against target score or pack limit | M3 | ORIGINAL_REQUEST §R2 |
| 28 | Filterable Heatmap by Category | Filter heatmap matrix cells to reflect only specific category completions (Akademi, Spor, etc.) | M3 | ORIGINAL_REQUEST §R2 |
| 29 | Best Day Ever Card | Prominent card displaying all-time highest single-day score and date | M3 | ORIGINAL_REQUEST §R2 |
| 30 | Day Detail Modal with Notes | Modal opened on tapping any matrix or bar chart day with reflective notes | M3 | ORIGINAL_REQUEST §R2 |
| 31 | 120 FPS CSS Spring Physics | Custom cubic-bezier spring physics on touch/click (`cubic-bezier(0.2, 0.8, 0.2, 1)`) | M4 | ORIGINAL_REQUEST §R2 |
| 32 | 3-Theme Switcher | Switch between Apple Slate (`#0f1014`), OLED Black (`#000000`), and Paper Light (`#f8f9fa`) | M4 | ORIGINAL_REQUEST §R2 |
| 33 | SF Pro / Apple Typography | Apple system typography stack with tabular numerics for financial/counter values | M4 | ORIGINAL_REQUEST §R2 |
| 34 | Tactile Haptic Vibration Simulation | Distinct tactile vibration feedback on touch interactions via `navigator.vibrate` | M4 | ORIGINAL_REQUEST §R2 |
| 35 | Minimal Web Audio Synthesizers | Pure procedural audio synthesizers for routine check, Terea pop, chime, and level-up | M4 | ORIGINAL_REQUEST §R2 |
| 36 | Sound Enable / Mute Toggle | User setting to toggle tactile sounds on or off | M4 | ORIGINAL_REQUEST §R2 |
| 37 | iOS Safe-Area Padding | Layout respects iPhone notch, dynamic island, and home indicator bar (`env(safe-area-inset-*)`) | M4 | ORIGINAL_REQUEST §Acceptance |
| 38 | 04:00 Night Owl Day Reset | Shifts day boundary to 04:00 AM so midnight study sessions count towards yesterday | M2 | ORIGINAL_REQUEST §R2 |
| 39 | Flexible Discipline (Streak Freeze) | 1-day grace period per week allowing 1 missed day without breaking streak | M2 | ORIGINAL_REQUEST §R2 |
| 40 | Privacy Shield (Blur Mode) | Quick blur filter for sensitive routine titles, scores, and Terea spending in public | M3 | ORIGINAL_REQUEST §R2 |
| 41 | Dual Filtering (Category & Time) | Switch routine list between Time of Day blocks and Life Categories | M3 | ORIGINAL_REQUEST §R2 |
| 42 | Quick Eisenhower View | Quadrant matrix organizing tasks into Urgent/Important priorities | M3 | ORIGINAL_REQUEST §R2 |
| 43 | Configurable Daily Target Score | Custom target score threshold for a "perfect day" (80, 100, 120, 150 P) | M2 | ORIGINAL_REQUEST §R2 |
| 44 | 100% Offline-First Dexie.js DB | Zero cloud dependency, local IndexedDB storage with versioned schema | M2 | ORIGINAL_REQUEST §R2 |
| 45 | 1-Click JSON Backup Export | Download full snapshot of all routines, logs, days, tereaLogs, and settings | M2 | ORIGINAL_REQUEST §R2 |
| 46 | 1-Click JSON Backup Restore | Upload and restore complete application state with atomic transactional rollback | M2 | ORIGINAL_REQUEST §R2 |
| 47 | PIN Code Security Lock | Optional 4-digit PIN lock to prevent unauthorized viewing of habit/Terea data | M2 | ORIGINAL_REQUEST §R2 |
| 48 | 30-Day Realistic Demo Seeder | One-click button populating 30 days of realistic scores and Terea logs safely | M2 | ORIGINAL_REQUEST §R2 |
| 49 | Continuous Deployment Workflow | Automated GitHub Actions workflow on branch `main` building and deploying to GitHub Pages | M4 | ORIGINAL_REQUEST §R3 |
| 50 | Standalone iOS Safari PWA | Full-screen PWA experience without browser chrome via "Add to Home Screen" & Service Worker | M4 | ORIGINAL_REQUEST §R3 |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | E2E Testing Track & Test Infrastructure | Test harness using native `node:test`, test runners, Tiers 1-4 test suite, publish `TEST_READY.md` | none | DONE |
| M2 | Core Storage, Schema & Discipline Engine | Dexie v3 schema, compound indexes, streak calculation & freeze fix, PIN lock, atomic backup, Terea engine core | none | IN_PROGRESS |
| M3 | Productivity & 300 Modular Features UI | Quantity tracker, MIT star, 2-minute rule, habit stacking, sub-checklists, Eisenhower view, privacy shield, category heatmap | M2 | PLANNED |
| M4 | Apple Minimalist Design System & PWA / CI-CD | 3-theme switcher, procedural audio, haptics, service worker offline caching, Oxlint cleanup, deploy.yml validation | M3 | PLANNED |
| M5 | Final Milestone: 100% E2E Test Pass & Hardening | Phase 1: 100% E2E test pass across Tiers 1-4. Phase 2: Tier 5 adversarial hardening & forensic integrity audit | M1, M4 | PLANNED |

## Interface Contracts

### Storage & Database Contract (`src/db/index.js`)
- `db.version(3).stores({ routines, logs, days, tereaLogs, settings, streaks, badges })`
- `[date+routineId]` compound index on `logs`
- `[category+timeOfDay]` compound index on `routines`
- Functions: `exportBackupData(): Promise<Object>`, `restoreBackupData(data: Object): Promise<void>` (atomic with rollback).

### Date & Streak Engine Contract (`src/utils/date.js`)
- `getTodayString(resetHour = 4): string` (Returns `YYYY-MM-DD` taking into account 04:00 AM reset).
- `calculateStreaks(daysMap, targetScore, resetHour): { currentStreak: number, maxStreak: number, freezeUsed: boolean }`
- Freeze condition: Allows 1 grace day per 7-day rolling window without breaking streak; does not consume freeze on empty historical pre-start dates.

### Terea Analytics Contract (`src/components/TereaWidget.jsx` & calculation engine)
- Inputs: `todaySticks: number`, `pricePerStick: number`, `history: Map<string, DayRecord>`
- Outputs:
  - `todaySpent`: `(todaySticks * pricePerStick).toFixed(1)`
  - `todayPacks`: `(todaySticks / 20).toFixed(1)`
  - `weekSticks`, `weekSpent`, `weekPacks` (past 7 days rolling)
  - `monthSticks`, `monthSpent`, `monthPacks` (calendar month to date)
  - `allTimeSticks`, `allTimeSpent`, `allTimePacks`
  - `dailyAvgSticks`: `allTimeSticks / Math.max(trackedDays, 1)`

## Code Layout
- `src/db/`: Dexie database initialization, schemas, migrations, backup/restore.
- `src/utils/`: Pure logic functions (date calculations, streaks, sound synthesis, haptics).
- `src/components/`: Modular React components:
  - `TereaWidget.jsx`: Terea consumption counter and financial expenditure metrics.
  - `Header.jsx`: Circular progress ring, level badge, streak count, quick actions.
  - `RoutineList.jsx`, `RoutineItem.jsx`: Routine lists, quantity inputs, MIT stars, tags.
  - `TrackerHeatmap.jsx`: 70-day matrix, 7-day trend chart, category filters.
  - `BadgesModal.jsx`, `DayDetailModal.jsx`, `QuickAddModal.jsx`, `SettingsModal.jsx`.
  - `PinLockScreen.jsx`: 4-digit PIN security lock.
- `src/index.css`: Apple minimalist theme variables, 120 FPS spring physics, safe area insets.
- `test/`: Native Node.js test suites (`node --test`).
- `public/`: `manifest.json`, `sw.js` (Service Worker), icons, favicon.
- `.github/workflows/deploy.yml`: GitHub Pages CI/CD workflow.
