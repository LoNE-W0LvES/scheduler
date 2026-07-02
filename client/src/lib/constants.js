// ── uid ─────────────────────────────────────────────────────────────────────
export function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// ── day color map ────────────────────────────────────────────────────────────
export const DC = {
  Monday:    { c:'#B8660E', bg:'#FDF3E3', hdr:'#6B3A04', th:'จันทร์',   dow:1 },
  Tuesday:   { c:'#C0365A', bg:'#FDE8EF', hdr:'#7A1436', th:'อังคาร',   dow:2 },
  Wednesday: { c:'#3A7D0A', bg:'#E8F5DC', hdr:'#1D4A02', th:'พุธ',      dow:3 },
  Thursday:  { c:'#C07208', bg:'#FEF4E2', hdr:'#7A4202', th:'พฤหัสบดี', dow:4 },
  Friday:    { c:'#1A5FA8', bg:'#E3EFF9', hdr:'#0C3A6E', th:'ศุกร์',    dow:5 },
  Saturday:  { c:'#5B4EC8', bg:'#EDEAFC', hdr:'#342D85', th:'เสาร์',    dow:6 },
  Sunday:    { c:'#999999', bg:'#F2F1EE', hdr:'#555555', th:'อาทิตย์',  dow:0 },
};

export const ALL_DAYS   = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
export const WORK_DAYS  = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const IMPORT_DAYS = ['Monday','Thursday','Saturday'];

export const MONTH_TH = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'];
export const MONTH_SHORT_TH = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];
export const MONTH_EN   = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const DOW_TH     = ['อาทิตย์','จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์'];

export const WEEK_CTX = {
  1:{ t:'Week 1 — Kickoff & planning: review pending items, branch visits, daily routine.', c:'#B8660E' },
  2:{ t:'Week 2 — People focus: branch visits, onboarding coordination, daily admin.',      c:'#C0365A' },
  3:{ t:'Week 3 — Admin & deadline prep: work schedules, attendance check, arrive late report (due before day 25).', c:'#3A7D0A' },
  4:{ t:'Week 4 — Close & reset prep: clear resign folders, check uniforms returned, archive documents.', c:'#5B4EC8' },
  5:{ t:'Week 5 — End of Month Wrap-up: final document filing, verify month-end reports, prepare next month planner.', c:'#E24B4A' },
};

export const WEEK_EXTRA = {
  1:{ Monday:[{ text:'Review last month pending items', time:'09:30–10:00' }] },
  2:{}, 3:{},
  4:{ Friday:[{ text:'Archive month documents & files', time:'14:00–15:00' }], Saturday:[] },
  5:{},
};

// Default notes are now seeded in the database for new users
// See useAppState.js for the DEFAULT_NOTES array

// ── date helpers ─────────────────────────────────────────────────────────────
export function getTH() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
}

export function isSameDay(a, b) {
  return a.getFullYear()===b.getFullYear() && a.getMonth()===b.getMonth() && a.getDate()===b.getDate();
}

export function fmtDateShort(d) {
  return `${d.getDate()} ${MONTH_EN[d.getMonth()]}`;
}

export function dowToName(dow) {
  return ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][dow];
}

export function getStartMondayOfMonth(year, month) {
  const d = new Date(year, month, 1);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  return new Date(year, month, 1 + offset);
}

export function getNumWeeksInMonth(year, month) {
  const thisStart = getStartMondayOfMonth(year, month);
  const nextStart = getStartMondayOfMonth(year, month + 1);
  return Math.round((nextStart - thisStart) / (7 * 24 * 3600 * 1000));
}

export function getDatesForWeek(year, month, week) {
  const startMon = getStartMondayOfMonth(year, month);
  const weekStart = new Date(startMon);
  weekStart.setDate(startMon.getDate() + (week - 1) * 7);
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    dates.push(d);
  }
  return dates;
}

export function getCycleInfoForDate(date) {
  for (let mOffset = -1; mOffset <= 1; mOffset++) {
    const testMonth = new Date(date.getFullYear(), date.getMonth() + mOffset, 1);
    const startMon  = getStartMondayOfMonth(testMonth.getFullYear(), testMonth.getMonth());
    const nextMon   = getStartMondayOfMonth(testMonth.getFullYear(), testMonth.getMonth() + 1);
    if (date >= startMon && date < nextMon) {
      const diffDays = Math.floor((date - startMon) / (24 * 3600 * 1000));
      const weekNum  = Math.floor(diffDays / 7) + 1;
      return { year: testMonth.getFullYear(), month: testMonth.getMonth(), week: weekNum };
    }
  }
  return { year: date.getFullYear(), month: date.getMonth(), week: 1 };
}

export function getDay30Date(year, month) {
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day30 = Math.min(30, lastDay);
  const d = new Date(year, month, day30);
  if (d.getDay() === 0) d.setDate(d.getDate() - 1);
  return d;
}

export function getDay30Info(year, month) {
  const day30Date = getDay30Date(year, month);
  const cycleInfo = getCycleInfoForDate(day30Date);
  return {
    date:    day30Date,
    week:    cycleInfo.week,
    dayName: dowToName(day30Date.getDay()),
    dayNum:  day30Date.getDate(),
  };
}

export function routineMatchesDay(r, day, week, day30Info) {
  if (r.week === 'day30') {
    if (!day30Info) return false;
    return week === day30Info.week && day === day30Info.dayName;
  }
  const weekOk = r.week === 'all' || r.week === String(week);
  const dayOk  = r.day  === 'all' || r.day.split(',').map(s => s.trim()).includes(day);
  return weekOk && dayOk;
}

export function getRoutinesForDay(day, week, day30Info, customRoutine = [], lockedRoutines = []) {
  const all = [...lockedRoutines, ...customRoutine];
  return all.filter(r => routineMatchesDay(r, day, week, day30Info));
}

export function buildDefaultWeekState() {
  const ws = {};
  for (let w = 1; w <= 5; w++) {
    ws[w] = {};
    ALL_DAYS.forEach(day => {
      const extras = (WEEK_EXTRA[w] && WEEK_EXTRA[w][day]) || [];
      ws[w][day] = {
        routineDone: {},
        editTasks: extras.map(t => ({ id: uid(), text: t.text, time: t.time, done: false })),
      };
    });
  }
  return ws;
}

export function getYearMonthKey(year, month) {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
