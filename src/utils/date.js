/**
 * Date utilities for Routine Tracker with 04:00 reset hour and Streak Freeze support
 */

export function getTodayString(resetHour = 4) {
  const now = new Date();
  // If current hour is less than reset hour (e.g. 02:00 < 04:00), shift date to yesterday
  if (now.getHours() < resetHour) {
    now.setDate(now.getDate() - 1);
  }
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateDisplay(dateStr) {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  
  const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  const months = [
    'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
    'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
  ];

  const dayName = days[date.getDay()];
  const monthName = months[date.getMonth()];
  return `${day} ${monthName} ${year}, ${dayName}`;
}

export function formatShortDate(dateStr) {
  if (!dateStr) return '';
  const [, month, day] = dateStr.split('-');
  return `${day}/${month}`;
}

/**
 * Returns shifted date string in YYYY-MM-DD format with timezone/DST safety
 */
export function getShiftedDateStr(dateStr, dayOffset) {
  const [year, month, day] = dateStr.split('-').map(Number);
  // Noon anchor prevents DST boundary crossing anomalies
  const date = new Date(year, month - 1, day, 12, 0, 0);
  date.setDate(date.getDate() + dayOffset);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns past N days dates in YYYY-MM-DD format up to today
 */
export function getPastDaysList(count = 70, resetHour = 4) {
  const today = getTodayString(resetHour);
  const result = [];
  for (let i = count - 1; i >= 0; i--) {
    result.push(getShiftedDateStr(today, -i));
  }
  return result;
}

/**
 * Calculate streak with Flexible Discipline (1 Streak Freeze allowed per 7-day rolling window)
 * Freeze is only consumed between active streak dates and not on historical days before streak inception.
 */
export function calculateStreaks(daysMap, target = 80, resetHour = 4) {
  if (!daysMap || typeof daysMap !== 'object') {
    return { currentStreak: 0, maxStreak: 0, freezeUsed: false };
  }

  const today = getTodayString(resetHour);
  const todayScore = daysMap[today]?.totalScore || 0;

  let currentStreak = 0;
  let freezeUsed = false;
  const freezeDates = new Set();

  // If today hasn't hit target yet, check from yesterday so user has until 04:00 resetHour
  let checkDateStr = (todayScore >= target) ? today : getShiftedDateStr(today, -1);

  while (true) {
    const score = daysMap[checkDateStr]?.totalScore || 0;
    if (score >= target) {
      currentStreak++;
      checkDateStr = getShiftedDateStr(checkDateStr, -1);
    } else {
      // score < target: check if this day is eligible for streak freeze protection
      const prevDateStr = getShiftedDateStr(checkDateStr, -1);
      const prevScore = daysMap[prevDateStr]?.totalScore || 0;

      // Rolling 7-day window verification for freezes
      let isWithin7DaysOfAnotherFreeze = false;
      const checkTimestamp = new Date(checkDateStr + 'T12:00:00Z').getTime();
      for (const fDate of freezeDates) {
        const fTimestamp = new Date(fDate + 'T12:00:00Z').getTime();
        const diffDays = Math.abs(checkTimestamp - fTimestamp) / (1000 * 60 * 60 * 24);
        if (diffDays < 7) {
          isWithin7DaysOfAnotherFreeze = true;
          break;
        }
      }

      // Freeze is ONLY valid if:
      // 1. Streak is active forward (currentStreak > 0) OR today is in progress and yesterday missed
      // 2. The day before (prevDateStr) has score >= target (genuine bridge between active streak days)
      // 3. No conflict with another freeze within 7 rolling calendar days
      const canFreeze = (currentStreak > 0 || checkDateStr === getShiftedDateStr(today, -1))
        && prevScore >= target
        && !isWithin7DaysOfAnotherFreeze;

      if (canFreeze) {
        freezeDates.add(checkDateStr);
        freezeUsed = true;
        // Continue walking backward across the frozen bridge
        checkDateStr = prevDateStr;
      } else {
        // Streak broken or pre-inception boundary reached
        break;
      }
    }
  }

  // Calculate maxStreak across all historical dates with consecutive calendar day checks
  let maxStreak = 0;
  const recordedDates = Object.keys(daysMap)
    .filter((k) => /^\d{4}-\d{2}-\d{2}$/.test(k) && (daysMap[k]?.totalScore || 0) > 0)
    .sort();

  if (recordedDates.length > 0) {
    const earliestDate = recordedDates[0];
    const latestDate = today;

    let tempStreak = 0;
    const histFreezeDates = new Set();
    let walkDate = earliestDate;

    while (walkDate <= latestDate) {
      const score = daysMap[walkDate]?.totalScore || 0;
      if (score >= target) {
        tempStreak++;
        if (tempStreak > maxStreak) {
          maxStreak = tempStreak;
        }
        walkDate = getShiftedDateStr(walkDate, 1);
      } else {
        const nextDate = getShiftedDateStr(walkDate, 1);
        const nextScore = daysMap[nextDate]?.totalScore || 0;

        let hasConflict = false;
        const walkTimestamp = new Date(walkDate + 'T12:00:00Z').getTime();
        for (const fDate of histFreezeDates) {
          const fTimestamp = new Date(fDate + 'T12:00:00Z').getTime();
          const diffDays = Math.abs(walkTimestamp - fTimestamp) / (1000 * 60 * 60 * 24);
          if (diffDays < 7) {
            hasConflict = true;
            break;
          }
        }

        // Bridge between active streak days historically
        if (tempStreak > 0 && nextScore >= target && !hasConflict) {
          histFreezeDates.add(walkDate);
          walkDate = nextDate;
        } else {
          tempStreak = 0;
          walkDate = getShiftedDateStr(walkDate, 1);
        }
      }
    }
  }

  maxStreak = Math.max(maxStreak, currentStreak);
  return { currentStreak, maxStreak, freezeUsed };
}

