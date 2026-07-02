// ── uid ─────────────────────────────────────────────────────────────────────
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── Modern Color Palette ─────────────────────────────────────────────────────
export const COLORS = {
  // Primary brand colors
  primary: {
    50: '#E8F5F0',
    100: '#C2E6D8',
    200: '#8FD4BA',
    300: '#4DBF96',
    400: '#2AA87C',
    500: '#1D9E75',
    600: '#16805E',
    700: '#11634A',
    800: '#0D4A38',
    900: '#093528',
  },
  // Accent colors
  accent: {
    amber: { light: '#FEF3C7', main: '#F59E0B', dark: '#B45309' },
    rose: { light: '#FCE7F3', main: '#EC4899', dark: '#BE185D' },
    violet: { light: '#EDE9FE', main: '#8B5CF6', dark: '#6D28D9' },
    sky: { light: '#E0F2FE', main: '#0EA5E9', dark: '#0369A1' },
    emerald: { light: '#D1FAE5', main: '#10B981', dark: '#047857' },
  },
  // Neutral
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },
  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
};

// ── day color map (Modern gradients) ────────────────────────────────────────
export const DC = {
  Monday:    { c: '#E67E22', bg: '#FEF5E7', hdr: '#D35400', th: 'จันทร์', dow: 1, gradient: 'linear-gradient(135deg, #E67E22, #F39C12)' },
  Tuesday:   { c: '#E74C3C', bg: '#FDEDEC', hdr: '#C0392B', th: 'อังคาร', dow: 2, gradient: 'linear-gradient(135deg, #E74C3C, #EC7063)' },
  Wednesday: { c: '#27AE60', bg: '#E9F7EF', hdr: '#1E8449', th: 'พุธ', dow: 3, gradient: 'linear-gradient(135deg, #27AE60, #2ECC71)' },
  Thursday:  { c: '#E67E22', bg: '#FEF9E7', hdr: '#D35400', th: 'พฤหัสบดี', dow: 4, gradient: 'linear-gradient(135deg, #F39C12, #F1C40F)' },
  Friday:    { c: '#3498DB', bg: '#EBF5FB', hdr: '#2980B9', th: 'ศุกร์', dow: 5, gradient: 'linear-gradient(135deg, #3498DB, #5DADE2)' },
  Saturday:  { c: '#9B59B6', bg: '#F5EEF8', hdr: '#8E44AD', th: 'เสาร์', dow: 6, gradient: 'linear-gradient(135deg, #9B59B6, #A569BD)' },
  Sunday:    { c: '#7F8C8D', bg: '#F4F6F6', hdr: '#5D6D7E', th: 'อาทิตย์', dow: 0, gradient: 'linear-gradient(135deg, #95A5A6, #BDC3C7)' },
};

// Week colors (for the 4-week cycle)
export const WEEK_COLORS = {
  1: { c: '#E67E22', bg: '#FEF5E7', gradient: 'linear-gradient(135deg, #E67E22, #F39C12)' },
  2: { c: '#E74C3C', bg: '#FDEDEC', gradient: 'linear-gradient(135deg, #E74C3C, #EC7063)' },
  3: { c: '#27AE60', bg: '#E9F7EF', gradient: 'linear-gradient(135deg, #27AE60, #2ECC71)' },
  4: { c: '#9B59B6', bg: '#F5EEF8', gradient: 'linear-gradient(135deg, #9B59B6, #A569BD)' },
};

export const ALL_DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const WORK_DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const IMPORT_DAYS = ['Monday', 'Thursday', 'Saturday'];

export const MONTH_TH = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
export const MONTH_SHORT_TH = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTH_EN_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const DOW_TH = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];

// ── New 4-Week Cycle Context ────────────────────────────────────────────────
export const WEEK_CTX = {
  1: { t: 'Week 1 — Kickoff & Planning', sub: 'Review pending items, branch visits, daily routine setup', c: '#E67E22', icon: '🚀' },
  2: { t: 'Week 2 — People Focus', sub: 'Branch visits, onboarding coordination, daily admin tasks', c: '#E74C3C', icon: '👥' },
  3: { t: 'Week 3 — Admin & Deadlines', sub: 'Work schedules, attendance check, arrive late report (due before day 25)', c: '#27AE60', icon: '📋' },
  4: { t: 'Week 4 — Month Close', sub: 'Clear resign folders, check uniforms, archive documents, prepare next month', c: '#9B59B6', icon: '🎯' },
};

// Extra tasks are now day-based, not week-based
export const DAY_EXTRA_TASKS = {
  1: [{ text: 'Review last month pending items', time: '09:30–10:00' }],
  25: [{ text: 'Archive month documents & files', time: '14:00–15:00' }],
};

// ── Date Helpers: Fixed 4-Week Cycle ──────────────────────────────────────────

/**
 * Get Thailand timezone date
 */
export function getTH() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/**
 * Format date short: "15 Jan"
 */
export function fmtDateShort(d) {
  return `${d.getDate()} ${MONTH_EN[d.getMonth()]}`;
}

/**
 * Format date long: "Monday, 15 January 2024"
 */
export function fmtDateLong(d) {
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${d.getDate()} ${MONTH_EN_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Convert day of week (0-6) to day name
 */
export function dowToName(dow) {
  return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dow];
}

/**
 * Get week number from day of month (FIXED 4-WEEK CYCLE)
 * Days 1-7:   Week 1
 * Days 8-14:  Week 2
 * Days 15-21: Week 3
 * Days 22-28: Week 4
 * Days 29-31: Still Week 4 (overflow)
 */
export function getWeekFromDay(dayOfMonth) {
  if (dayOfMonth <= 7) return 1;
  if (dayOfMonth <= 14) return 2;
  if (dayOfMonth <= 21) return 3;
  return 4;
}

/**
 * Get the day number within the week (1-7)
 */
export function getDayInWeek(dayOfMonth) {
  const week = getWeekFromDay(dayOfMonth);
  const startDay = (week - 1) * 7 + 1;
  return dayOfMonth - startDay + 1;
}

/**
 * Check if a day is in overflow (days 29-31)
 */
export function isOverflowDay(dayOfMonth) {
  return dayOfMonth > 28;
}

/**
 * Get cycle info for any date (FIXED 4-WEEK SYSTEM)
 */
export function getCycleInfoForDate(date) {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    dayOfMonth: date.getDate(),
    week: getWeekFromDay(date.getDate()),
    dayName: dowToName(date.getDay()),
    isOverflow: date.getDate() > 28,
  };
}

/**
 * Get all dates for a specific week in a month (FIXED 4-WEEK)
 * Week 1: Days 1-7
 * Week 2: Days 8-14
 * Week 3: Days 15-21
 * Week 4: Days 22-28 (+ overflow days 29-31)
 */
export function getDatesForWeek(year, month, week) {
  const dates = [];
  const startDay = (week - 1) * 7 + 1;
  const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

  // Week 4 includes overflow days
  const endDay = week === 4 ? lastDayOfMonth : Math.min(startDay + 6, 28);

  for (let d = startDay; d <= endDay; d++) {
    dates.push(new Date(year, month, d));
  }

  // Fill missing days with next month dates if needed
  const daysInWeek = dates.length;
  if (daysInWeek < 7) {
    for (let i = 0; i < 7 - daysInWeek; i++) {
      dates.push(new Date(year, month + 1, i + 1));
    }
  }

  return dates;
}

/**
 * Get number of weeks (always 4 in fixed system)
 */
export function getNumWeeksInMonth(year, month) {
  return 4; // Fixed 4-week system
}

/**
 * Get Day 30 info (for deadline routines)
 */
export function getDay30Info(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day30 = Math.min(30, lastDay);
  const d = new Date(year, month, day30);
  return {
    date: d,
    week: getWeekFromDay(day30),
    dayName: dowToName(d.getDay()),
    dayNum: day30,
  };
}

/**
 * Check if routine matches a specific day
 */
export function routineMatchesDay(r, day, week, day30Info, dayOfMonth) {
  // Day30 special handling
  if (r.week === 'day30') {
    if (!day30Info) return false;
    return week === day30Info.week && day === day30Info.dayName;
  }

  const weekOk = r.week === 'all' || r.week === String(week);
  const dayOk = r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(day);
  return weekOk && dayOk;
}

/**
 * Get all routines for a specific day
 */
export function getRoutinesForDay(day, week, day30Info, customRoutine = [], lockedRoutines = [], dayOfMonth = 1) {
  const all = [...lockedRoutines, ...customRoutine];
  return all.filter(r => routineMatchesDay(r, day, week, day30Info, dayOfMonth));
}

/**
 * Build default week state for a month
 */
export function buildDefaultWeekState() {
  const ws = {};
  for (let w = 1; w <= 4; w++) {
    ws[w] = {};
    ALL_DAYS.forEach(day => {
      ws[w][day] = {
        routineDone: {},
        editTasks: [],
      };
    });
  }
  return ws;
}

/**
 * Get year-month key for data storage
 */
export function getYearMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * Escape HTML
 */
export function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Get progress percentage
 */
export function getProgressPct(done, total) {
  if (total === 0) return 0;
  return Math.round((done / total) * 100);
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(pct) {
  if (pct >= 80) return '#10B981'; // Green
  if (pct >= 50) return '#F59E0B'; // Amber
  return '#EF4444'; // Red
}
