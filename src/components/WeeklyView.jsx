import { useState } from 'react';
import DayCard from './DayCard';
import {
  getTH, getCycleInfoForDate, getDay30Info, getDatesForWeek,
  getNumWeeksInMonth, getRoutinesForDay, dowToName, WEEK_CTX, WEEK_COLORS,
} from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function WeeklyView({
  state, currentWeek, onWeekChange, monthData,
  onToggleRoutine, onToggleEditTask, onAddEditTask, onDeleteEditTask, onUpdateEditTask,
  getAllStats, getDayStats,
  toast,
  offDays = ['Sunday']
}) {
  const { viewYear, viewMonth, customRoutine, lockedRoutines } = state;
  const { t } = useLanguage();
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
    if (!offDays.includes(dayName)) {
      const r = getRoutinesForDay(dayName, todayCycle.week, day30Info, customRoutine, lockedRoutines, today.getDate());
      const s = getDayStats(todayCycle.week, dayName, r);
      todayTotal = s.total;
      todayDone = s.done;
    }
  }
  const todayPct = todayTotal ? Math.round((todayDone / todayTotal) * 100) : 0;

  const weekDates = getDatesForWeek(viewYear, viewMonth, currentWeek);

  // Weekly stats
  let weekTotal = 0, weekDone = 0;
  weekDates.forEach((date) => {
    const dayName = dowToName(date.getDay());
    const dayOfMonth = date.getDate();
    if (!offDays.includes(dayName)) {
      const routine = getRoutinesForDay(dayName, currentWeek, day30Info, customRoutine, lockedRoutines, dayOfMonth);
      const s = getDayStats(currentWeek, dayName, routine);
      weekTotal += s.total;
      weekDone += s.done;
    }
  });
  const weekPct = weekTotal ? Math.round((weekDone / weekTotal) * 100) : 0;

  return (
    <div className="px-5 pb-20 animate-slide-up">
      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 my-4">
        <div className="card-static p-4 text-center bg-white dark:bg-gray-800">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-100 font-display">{todayTotal}</div>
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">{t('todayTasks')}</div>
        </div>
        <div className="p-4 text-center rounded-2xl border border-green-200 dark:border-green-800" style={{ background: 'linear-gradient(135deg, #D1FAE5, #A7F3D0)' }}>
          <div className="text-3xl font-bold text-green-800 font-display">{todayDone}</div>
          <div className="text-xs text-green-700 mt-1">{t('completed')}</div>
        </div>
        <div className="p-4 text-center rounded-2xl border border-purple-200 dark:border-purple-800" style={{ background: 'linear-gradient(135deg, #EDE9FE, #DDD6FE)' }}>
          <div className="text-3xl font-bold text-purple-800 font-display">{pct}%</div>
          <div className="text-xs text-purple-700 mt-1">{t('progress')}</div>
        </div>
      </div>

      {/* Progress Bars */}
      <div className="mb-6 space-y-3">
        {/* Daily Progress */}
        <div>
          <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
            <span>{t('dailyProgress')}</span>
            <span>{todayDone}/{todayTotal} {t('tasks')}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${todayPct}%`, background: '#10B981' }} />
          </div>
        </div>

        {/* Weekly Progress */}
        <div>
          <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
            <span>{t('weeklyProgress')}</span>
            <span>{weekDone}/{weekTotal} {t('tasks')}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${weekPct}%`, background: '#3B82F6' }} />
          </div>
        </div>

        {/* Monthly Progress */}
        <div>
          <div className="flex justify-between text-xs text-[#6B7280] dark:text-[#9CA3AF] mb-1.5">
            <span>{t('monthlyProgress')}</span>
            <span>{allSt.done}/{allSt.total} {t('tasks')}</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${pct}%` }} />
          </div>
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
                {d1.getDate()}–{d7.getDate()} {t('month_short_' + d7.getMonth())}
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
              offDays={offDays}
            />
          );
        })}
      </div>
    </div>
  );
}
