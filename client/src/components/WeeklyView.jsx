import DayCard from './DayCard';
import {
  getTH, getCycleInfoForDate, getDay30Info, getDatesForWeek,
  getNumWeeksInMonth, getRoutinesForDay, dowToName, MONTH_EN, WEEK_CTX,
} from '../lib/constants';
3
export default function WeeklyView({
  state, currentWeek, onWeekChange, monthData,
  onToggleRoutine, onToggleEditTask, onAddEditTask, onDeleteEditTask, onUpdateEditTask,
  getAllStats, getDayStats,
  toast,
}) {
  const { viewYear, viewMonth, customRoutine } = state;
  const numWeeks  = getNumWeeksInMonth(viewYear, viewMonth);
  const day30Info = getDay30Info(viewYear, viewMonth);
  const today     = getTH();
  const todayCycle = getCycleInfoForDate(today);

  // Stats
  const allSt = getAllStats();
  const pct = allSt.total ? Math.round(allSt.done / allSt.total * 100) : 0;

  // Today stats
  let todayTotal = 0, todayDone = 0;
  if (todayCycle.year === viewYear && todayCycle.month === viewMonth) {
    const dayName = dowToName(today.getDay());
    if (dayName !== 'Sunday') {
      const r = getRoutinesForDay(dayName, todayCycle.week, day30Info, customRoutine);
      const s = getDayStats(todayCycle.week, dayName, r);
      todayTotal = s.total; todayDone = s.done;
    }
  }

  const ctx = WEEK_CTX[currentWeek] || WEEK_CTX[4];
  const weekDates = getDatesForWeek(viewYear, viewMonth, currentWeek);

  return (
    <div className="px-5 pb-20 fade-up">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-2.5 my-3">
        {[
          { num: todayTotal, label: "Today's tasks", cls: 'text-[#111] dark:text-[#F0F0F0]' },
          { num: todayDone,  label: 'Done today',    cls: 'text-[#1D9E75] dark:text-[#26D09A]' },
          { num: `${pct}%`, label: 'Month progress', cls: 'text-[#5B4EC8] dark:text-[#9E92F8]' },
        ].map(({ num, label, cls }) => (
          <div key={label} className="bg-white dark:bg-[#1E1E1E] rounded-xl p-3 text-center border border-[#E2E0D8] dark:border-[#333] shadow-sm">
            <div className={`font-kanit text-2xl font-bold leading-none ${cls}`}>{num}</div>
            <div className="text-[11px] text-[#888] dark:text-[#AAA] mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-[#E2E0D8] dark:bg-[#333] rounded-full mb-4 overflow-hidden">
        <div className="h-full rounded-full bg-gradient-to-r from-[#1D9E75] to-[#52C4A0] transition-all duration-500"
          style={{ width: `${pct}%` }} />
      </div>

      {/* Week selector */}
      <div className="flex gap-2 flex-wrap mb-3">
        {Array.from({ length: numWeeks }, (_, i) => i + 1).map(w => {
          const wDates = getDatesForWeek(viewYear, viewMonth, w);
          const d1 = wDates[0], d7 = wDates[6];
          const is30week = day30Info.week === w;
          const active = w === currentWeek;
          return (
            <button key={w} onClick={() => onWeekChange(w)}
              className={`px-4 py-1.5 rounded-full border text-[13px] font-sarabun cursor-pointer transition-all ${
                active
                  ? 'bg-[#111] text-white border-[#111] dark:bg-[#E0E0E0] dark:text-[#111] dark:border-[#E0E0E0]'
                  : is30week
                    ? 'bg-white text-[#E24B4A] border-[#E24B4A] dark:bg-[#1E1E1E] dark:border-[#E24B4A]'
                    : 'bg-white text-[#444] border-[#E2E0D8] dark:bg-[#1E1E1E] dark:text-[#CCC] dark:border-[#333]'
              }`}>
              Week {w} ({d1.getDate()} {MONTH_EN[d1.getMonth()]} – {d7.getDate()} {MONTH_EN[d7.getMonth()]})
              {is30week && ` [Day ${day30Info.dayNum}]`}
            </button>
          );
        })}
      </div>

      {/* Context bar */}
      <div className="text-[12px] px-3.5 py-2 rounded-lg border-l-[3px] mb-4 bg-white"
        style={{ borderLeftColor: ctx.c, color: ctx.c }}>
        {ctx.t}
      </div>

      {/* Day cards */}
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
        {weekDates.map((date, idx) => {
          const dayName = dowToName(date.getDay());
          const routine = getRoutinesForDay(dayName, currentWeek, day30Info, customRoutine);
          const ws = monthData?.weekState;
          const dayState = ws?.[currentWeek]?.[dayName] || { routineDone: {}, editTasks: [] };
          return (
            <DayCard
              key={dayName}
              week={currentWeek} day={dayName} date={date}
              routine={routine} dayState={dayState} day30Info={day30Info}
              onToggleRoutine={onToggleRoutine}
              onToggleEditTask={onToggleEditTask}
              onAddEditTask={onAddEditTask}
              onDeleteEditTask={onDeleteEditTask}
              onUpdateEditTask={onUpdateEditTask}
              toast={toast}
            />
          );
        })}
      </div>
    </div>
  );
}
