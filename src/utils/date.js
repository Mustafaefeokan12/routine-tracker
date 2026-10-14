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
 * Returns past N days dates in YYYY-MM-DD format up to today
 */
export function getPastDaysList(count = 70, resetHour = 4) {
  const result = [];
  const base = new Date();
  if (base.getHours() < resetHour) {
    base.setDate(base.getDate() - 1);
  }

  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(base);
    d.setDate(base.getDate() - i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    result.push(`${y}-${m}-${day}`);
  }
  return result;
}

/**
 * Calculate streak with Flexible Discipline (1 Streak Freeze allowed per week)
 */
export function calculateStreaks(daysMap, target = 80, resetHour = 4) {
  const today = getTodayString(resetHour);
  let currentStreak = 0;
  let maxStreak = 0;
  let tempStreak = 0;
  let freezeUsed = false;

  const sortedDates = Object.keys(daysMap).sort();

  for (let i = 0; i < sortedDates.length; i++) {
    const d = sortedDates[i];
    const score = daysMap[d]?.totalScore || 0;
    if (score >= target) {
      tempStreak++;
      if (tempStreak > maxStreak) maxStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Calculate current streak backwards from today
  const curr = new Date();
  if (curr.getHours() < resetHour) {
    curr.setDate(curr.getDate() - 1);
  }

  let checkDate = new Date(curr);
  const todayScore = daysMap[today]?.totalScore || 0;
  
  // If today hasn't hit target yet, check from yesterday so user has until 04:00
  if (todayScore < target) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let freezesLeft = 1; // 1 freeze grace day

  while (true) {
    const y = checkDate.getFullYear();
    const m = String(checkDate.getMonth() + 1).padStart(2, '0');
    const d = String(checkDate.getDate()).padStart(2, '0');
    const key = `${y}-${m}-${d}`;

    const score = daysMap[key]?.totalScore || 0;
    if (score >= target) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else if (freezesLeft > 0 && currentStreak > 0) {
      // Use streak freeze
      freezesLeft--;
      freezeUsed = true;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return { currentStreak, maxStreak, freezeUsed };
}
