import { useState } from 'react';
import DayCard from './DayCard';
import {
  getTH, getCycleInfoForDate, getDay30Info, getDatesForWeek,
  getNumWeeksInMonth, getRoutinesForDay, dowToName, MONTH_EN, WEEK_CTX, WEEK_COLORS,
} from '../lib/constants';

export default function WeeklyView({
  state, currentWeek, onWeekChange, monthData,
  onToggleRoutine, onToggleEditTask, onAddEditTask, onDeleteEditTask, onUpdateEditTask,
  getAllStats, getDayStats,
  toast,
}) {
  const { viewYear, viewMonth, customRoutine, lockedRoutines } = state;
  const numWeeks = getNumWeeksInMonth(viewYear, viewMonth);
  const day30Info = getDay30Info(viewYear, viewMonth);
  const today = getTH();
  const todayCycle = getCycleInfoForDate(today);

  // Stats
  const allSt = getAllStats();
  const pct = allSt.total ? Math.round(allSt.done / allSt.total * 100) : 0;

  // Today stats
  let todayTotal = 0, todayDone = 0;
  if (todayCycle.year === viewYear && todayCycle.month === viewMonth) {
    const dayName = dowToName(today.getDay());
    if (dayName !== 'Sunday') {
      const r = getRoutinesForDay(dayName, todayCycle.week, day30Info, customRoutine, lockedRoutines);
      const s = getDayStats(todayCycle.week, dayName, r);
      todayTotal = s.total;
      todayDone = s.done;
    }
  }

  const weekDates = getDatesForWeek(viewYear, viewMonth, currentWeek);

  return (
    <div className="px-5 pb-20 animate-slide-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="card-static p-4 text-center">
          <div className="text-3xl font-bold text-[#1F2937] dark:text-[#F3F4F6] font-display">{todayTotal}</div>
          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-1">Today's Tasks</div>
        </div>
        <div className="card-static p-4 text-center" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}>
          <div className="text-3xl font-bold text-[#065F46] font-display">{todayDone}</div>
          <div className="text-xs text-[#047857] mt-1">Completed</div>
        </div>
        <div className="card-static p-4 text-center" style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)' }}>
          <div className="text-3xl font-bold text-[#5B21B6] font-display">{pct}%</div>
          <div className="text-xs text-[#6D28D9] mt-1">Progress</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-2">
          <span>Monthly Progress</span>
          <span>{allSt.done}/{allSt.total} tasks</span>
        </div>
        <div className="progress-bar">
          <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Week Selector */}
      <div className="flex gap-2 flex-wrap mb-4">
        {[1, 2, 3, 4].map(w => {
          const wDates = getDatesForWeek(viewYear, viewMonth, w);
          const d1 = wDates[0];
          const d7 = wDates[6];
          const wc = WEEK_COLORS[w];
          const active = w === currentWeek;

          return (
            <button
              key={w}
              onClick={() => onWeekChange(w)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all"
              style={{
                background: active ? (wc.gradient || wc.c) : wc.bg,
                color: active ? 'white' : wc.c,
                boxShadow: active ? '0 4px 12px rgba(0,0,0,0.15)' : 'none',
              }}
            >
              <span className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                style={{ background: active ? 'rgba(255,255,255,0.2)' : wc.c, color: active ? 'white' : 'white' }}>
                {w}
              </span>
              <span>
                {d1.getDate()}–{d7.getDate()} {MONTH_EN[d7.getMonth()]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Day Cards Grid */}
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))' }}>
        {weekDates.map((date) => {
          const dayName = dowToName(date.getDay());
          const dayOfMonth = date.getDate();
          const week = currentWeek;
          const routine = getRoutinesForDay(dayName, week, day30Info, customRoutine, lockedRoutines, dayOfMonth);
          const ws = monthData?.weekState;
          const dayState = ws?.[week]?.[dayName] || { routineDone: {}, editTasks: [] };

          // Check if this is an overflow day
          const isInCurrentMonth = date.getMonth() === viewMonth;

          return (
            <DayCard
              key={`${dayName}-${dayOfMonth}`}
              week={week}
              day={dayName}
              date={date}
              dayOfMonth={dayOfMonth}
              routine={routine}
              dayState={dayState}
              day30Info={day30Info}
              onToggleRoutine={onToggleRoutine}
              onToggleEditTask={onToggleEditTask}
              onAddEditTask={onAddEditTask}
              onDeleteEditTask={onDeleteEditTask}
              onUpdateEditTask={onUpdateEditTask}
              toast={toast}
              isCurrentMonth={isInCurrentMonth}
            />
          );
        })}
      </div>
    </div>
  );
}
