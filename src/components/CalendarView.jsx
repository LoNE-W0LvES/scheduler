import { useState } from 'react';
import {
  DC, getTH, isSameDay,
  getDay30Info, getDatesForWeek, getNumWeeksInMonth, dowToName, getRoutinesForDay,
} from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function CalendarView({ state, monthData, getDayStats, toast, offDays = ['Sunday'] }) {
  const { viewYear, viewMonth, customRoutine, lockedRoutines } = state;
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);

  const today = getTH();
  const day30Info = getDay30Info(viewYear, viewMonth);
  const numWeeks = getNumWeeksInMonth(viewYear, viewMonth);

  // Build all days in the calendar grid (Mon-Sun order)
  const allDays = [];
  for (let w = 1; w <= numWeeks; w++) {
    const dates = getDatesForWeek(viewYear, viewMonth, w);
    dates.forEach(d => allDays.push({ date: d, week: w }));
  }

  // Get tasks for selected day
  let selTasks = [];
  if (selected) {
    const dayName = dowToName(selected.date.getDay());
    const routine = getRoutinesForDay(dayName, selected.week, day30Info, customRoutine, lockedRoutines);
    const ws = monthData?.weekState;
    const s  = ws?.[selected.week]?.[dayName] || { routineDone: {}, editTasks: [] };
    const dc = DC[dayName];
    routine.forEach((t, i) => selTasks.push({ text: t.text, time: t.time, cls: t.cls, done: !!s.routineDone[i], locked: true, color: dc?.c }));
    s.editTasks.forEach(t => selTasks.push({ text: t.text, time: t.time, cls: 'tp-gen', done: t.done, locked: false, color: dc?.c }));
  }

  const selDc = selected ? DC[dowToName(selected.date.getDay())] : null;

  return (
    <div className="px-5 pb-20 fade-up">
      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {[1, 2, 3, 4, 5, 6, 0].map(d => (
          <div key={d} className="text-center text-[11px] font-bold py-1.5 rounded-md" style={{ background: '#F0EFEB', color: '#888' }}>{t('dow_' + d)}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1 mb-3">
        {allDays.map(({ date, week }, i) => {
          const dayName = dowToName(date.getDay());
          const inMonth = date.getMonth() === viewMonth;
          const isToday = isSameDay(date, today);
          const isSel   = selected && isSameDay(date, selected.date);
          const dc = DC[dayName];

          const routine = getRoutinesForDay(dayName, week, day30Info, customRoutine, lockedRoutines);
          const ws = monthData?.weekState;
          const s  = ws?.[week]?.[dayName] || { routineDone: {}, editTasks: [] };
          const stats = getDayStats(week, dayName, routine);
          const pct = stats.total ? stats.done / stats.total : 0;

          return (
            <div key={i}
              onClick={() => inMonth && !offDays.includes(dayName) && setSelected(isSel ? null : { date, week })}
              className={`rounded-xl p-1.5 min-h-[58px] border transition-all relative overflow-hidden
                ${!inMonth ? 'opacity-30 pointer-events-none' : 'cursor-pointer'}
                ${isToday ? 'border-[2.5px]' : 'border-[1.5px]'}
                ${isSel ? 'border-[2px]' : 'border-[#E2E0D8]'}
                ${inMonth ? 'hover:shadow-sm hover:-translate-y-px' : ''}
              `}
              style={{
                background: isSel ? (dc?.bg || '#fff') : '#fff',
                borderColor: isToday ? dc?.c : isSel ? dc?.c : undefined,
              }}
            >
              <div className="font-kanit text-[13px] font-semibold mb-0.5" style={{ color: isToday ? dc?.c : '#111' }}>
                {date.getDate()}
              </div>
              {/* progress pips */}
              {inMonth && !offDays.includes(dayName) && stats.total > 0 && (
                <div className="flex flex-wrap gap-[2px] mt-0.5">
                  {Array.from({ length: Math.min(stats.total, 6) }).map((_, pi) => (
                    <div key={pi} className="w-1.5 h-1.5 rounded-full"
                      style={{ background: pi < stats.done ? (dc?.c || '#1D9E75') : '#DDD' }} />
                  ))}
                </div>
              )}
              {offDays.includes(dayName) && inMonth && (
                <div className="text-[9px] text-[#BBB] mt-0.5">{t('dayOff')}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && selDc && (
        <div className="bg-white rounded-[14px] p-4 border-[1.5px] shadow-sm fade-up"
          style={{ borderColor: selDc.c, borderLeftWidth: 4 }}>
          <div className="font-kanit text-base font-bold mb-3" style={{ color: selDc.hdr }}>
            {t(dowToName(selected.date.getDay()))} — {selected.date.getDate()} {t('month_short_' + selected.date.getMonth())}
          </div>
          {selTasks.length === 0 ? (
            <div className="text-[#888] text-sm">{t('noTasksToday')}</div>
          ) : selTasks.map((tItem, i) => (
            <div key={i} className="flex items-center gap-2.5 py-2 border-b border-[#F0EFEB] last:border-none text-[13px]">
              <div className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: tItem.done ? '#1D9E75' : (tItem.color || '#888') }} />
              <span className={tItem.done ? 'line-through text-[#888] flex-1' : 'flex-1'}>{tItem.text}</span>
              {tItem.time && <span className="text-[10px] text-[#AAA]">⏰ {tItem.time}</span>}
              {tItem.done && <span className="text-[#1D9E75] text-[13px]">✅</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
