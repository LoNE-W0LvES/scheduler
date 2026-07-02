import { useState, useMemo } from 'react';
import {
  WORK_DAYS, getDay30Info, getDatesForWeek, getNumWeeksInMonth,
  getRoutinesForDay, dowToName, WEEK_EXTRA, uid,
} from '../lib/constants';

function buildEntries(viewYear, viewMonth, monthData, customRoutine, lockedRoutines) {
  const entries = [];
  const d30 = getDay30Info(viewYear, viewMonth);
  const numWeeks = getNumWeeksInMonth(viewYear, viewMonth);
  const ts = monthData?.trackerState || {};

  for (let w = 1; w <= numWeeks; w++) {
    const dates = getDatesForWeek(viewYear, viewMonth, w);
    dates.forEach(date => {
      const dayName = dowToName(date.getDay());
      if (dayName === 'Sunday') return;

      getRoutinesForDay(dayName, w, d30, customRoutine, lockedRoutines).forEach((t, i) => {
        const id = `r_${w}_${dayName}_${i}`;
        entries.push({ id, week: w, day: dayName, time: t.time, text: t.text, status: ts[id] || 'pending' });
      });

      const extras = (WEEK_EXTRA[w] && WEEK_EXTRA[w][dayName]) || [];
      extras.forEach((t, i) => {
        const id = `e_${w}_${dayName}_${i}`;
        entries.push({ id, week: w, day: dayName, time: t.time, text: t.text, status: ts[id] || 'pending' });
      });
    });
  }
  return entries;
}

export default function TrackerView({ state, monthData, onSetTrackerStatus, toast }) {
  const { viewYear, viewMonth, customRoutine, lockedRoutines } = state;
  const [filter, setFilter] = useState('all'); // all | pending | done | skip

  const entries = useMemo(
    () => buildEntries(viewYear, viewMonth, monthData, customRoutine, lockedRoutines),
    [viewYear, viewMonth, monthData, customRoutine, lockedRoutines]
  );

  const visible = filter === 'all' ? entries : entries.filter(e => {
    if (filter === 'done')    return e.status === 'done';
    if (filter === 'pending') return e.status === 'pending';
    if (filter === 'skip')    return e.status === 'skip';
    return true;
  });

  const total   = entries.length;
  const done    = entries.filter(e => e.status === 'done').length;
  const skipped = entries.filter(e => e.status === 'skip').length;

  function resetAll() {
    if (!confirm('Reset all tracker statuses to pending?')) return;
    entries.forEach(e => onSetTrackerStatus(e.id, 'pending'));
    toast('🔄 Tracker reset');
  }

  const statusClass = (st) => {
    if (st === 'done') return 'bg-[#E1F5EE] border-[#1D9E75] text-[#085041] font-bold';
    if (st === 'skip') return 'bg-[#F0EFEB] border-[#AAA] text-[#666]';
    return 'border-[#E2E0D8] text-[#888]';
  };

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="font-kanit text-xl font-bold">Task Tracker</div>
          <div className="text-xs text-[#888] mt-0.5">{done}/{total} done · {skipped} skipped</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[['all','All'], ['pending','Pending'], ['done','Done ✅'], ['skip','Skipped']].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3.5 py-1.5 rounded-full border text-[12px] font-sarabun cursor-pointer transition-all
                ${filter === v ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#444] border-[#E2E0D8] hover:border-[#AAA]'}`}>
              {l}
            </button>
          ))}
          <button onClick={resetAll}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#E24B4A] text-[#E24B4A] bg-white text-[12px] font-bold cursor-pointer hover:bg-[#E24B4A] hover:text-white transition-all">
            ↺ Reset
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[14px] overflow-hidden border border-[#E2E0D8] shadow-sm">
        <table className="tr-table w-full">
          <thead>
            <tr>
              <th>Week</th><th>Day</th><th>Time</th><th>Task</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="text-center text-[#AAA] py-8">No tasks</td></tr>
            )}
            {visible.map(e => (
              <tr key={e.id} className={e.status === 'done' ? 'row-done' : ''}>
                <td className="font-bold text-[11px] text-[#888]">W{e.week}</td>
                <td className="text-[12px]">{e.day.slice(0,3)}</td>
                <td className="text-[11px] text-[#AAA] whitespace-nowrap">{e.time || '—'}</td>
                <td className={`text-[12.5px] ${e.status === 'done' ? 'line-through text-[#888] tcell' : ''}`}>{e.text}</td>
                <td>
                  <select
                    className={`stsel border rounded-full px-2.5 py-1 text-[11px] font-sarabun bg-white outline-none cursor-pointer transition-all ${statusClass(e.status)}`}
                    value={e.status}
                    onChange={ev => { onSetTrackerStatus(e.id, ev.target.value); toast(ev.target.value === 'done' ? '✅ Done!' : ev.target.value === 'skip' ? '⏭ Skipped' : '↩ Reset'); }}
                  >
                    <option value="pending">Pending</option>
                    <option value="done">Done ✅</option>
                    <option value="skip">Skip ⏭</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
