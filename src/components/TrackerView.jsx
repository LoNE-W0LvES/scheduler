import { useState, useMemo } from 'react';
import {
  WORK_DAYS, getDay30Info, getDatesForWeek, getNumWeeksInMonth,
  getRoutinesForDay, dowToName,
} from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

function buildEntries(viewYear, viewMonth, monthData, customRoutine, lockedRoutines, offDays = ['Sunday']) {
  const entries = [];
  const d30 = getDay30Info(viewYear, viewMonth);
  const numWeeks = getNumWeeksInMonth(viewYear, viewMonth);
  const ts = monthData?.trackerState || {};

  for (let w = 1; w <= numWeeks; w++) {
    const dates = getDatesForWeek(viewYear, viewMonth, w);
    dates.forEach(date => {
      const dayName = dowToName(date.getDay());
      if (offDays.includes(dayName)) return;

      const dayOfMonth = date.getDate();
      getRoutinesForDay(dayName, w, d30, customRoutine, lockedRoutines, dayOfMonth).forEach((t, i) => {
        const id = `r_${w}_${dayName}_${i}`;
        entries.push({ id, week: w, day: dayName, time: t.time, text: t.text, status: ts[id] || 'pending' });
      });
    });
  }
  return entries;
}

export default function TrackerView({ state, monthData, onSetTrackerStatus, toast, offDays = ['Sunday'] }) {
  const { viewYear, viewMonth, customRoutine, lockedRoutines } = state;
  const { t } = useLanguage();
  const [filter, setFilter] = useState('all'); // all | pending | done | skip

  const entries = useMemo(
    () => buildEntries(viewYear, viewMonth, monthData, customRoutine, lockedRoutines, offDays),
    [viewYear, viewMonth, monthData, customRoutine, lockedRoutines, offDays]
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
    if (!confirm(t('reset') + '?')) return;
    entries.forEach(e => onSetTrackerStatus(e.id, 'pending'));
    toast('🔄 ' + t('reset'));
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
          <div className="font-kanit text-xl font-bold">{t('taskTracker')}</div>
          <div className="text-xs text-[#888] mt-0.5">{done}/{total} {t('done')} · {skipped} {t('skipped')}</div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            ['all', t('all')],
            ['pending', t('pending')],
            ['done', t('done') + ' ✅'],
            ['skip', t('skipped')]
          ].map(([v, l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`px-3.5 py-1.5 rounded-full border text-[12px] font-sarabun cursor-pointer transition-all
                ${filter === v ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#444] border-[#E2E0D8] hover:border-[#AAA]'}`}>
              {l}
            </button>
          ))}
          <button onClick={resetAll}
            className="flex items-center gap-1 px-3.5 py-1.5 rounded-full border border-[#E24B4A] text-[#E24B4A] bg-white text-[12px] font-bold cursor-pointer hover:bg-[#E24B4A] hover:text-white transition-all">
            ↺ {t('reset')}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[14px] overflow-hidden border border-[#E2E0D8] shadow-sm">
        <table className="tr-table w-full">
          <thead>
            <tr>
              <th>{t('week')}</th><th>{t('day')}</th><th>{t('time')}</th><th>{t('taskName')}</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && (
              <tr><td colSpan={5} className="text-center text-[#AAA] py-8">{t('noTasksToday')}</td></tr>
            )}
            {visible.map(e => (
              <tr key={e.id} className={e.status === 'done' ? 'row-done' : ''}>
                <td className="font-bold text-[11px] text-[#888]">W{e.week}</td>
                <td className="text-[12px]">{t(e.day + '_short') || e.day.slice(0,3)}</td>
                <td className="text-[11px] text-[#AAA] whitespace-nowrap">{e.time || '—'}</td>
                <td className={`text-[12.5px] ${e.status === 'done' ? 'line-through text-[#888] tcell' : ''}`}>{e.text}</td>
                <td>
                  <select
                    className={`stsel border rounded-full px-2.5 py-1 text-[11px] font-sarabun bg-white outline-none cursor-pointer transition-all ${statusClass(e.status)}`}
                    value={e.status}
                    onChange={ev => { onSetTrackerStatus(e.id, ev.target.value); toast(ev.target.value === 'done' ? '✅ ' + t('done') + '!' : ev.target.value === 'skip' ? '⏭ ' + t('skipped') : '↩ ' + t('reset')); }}
                  >
                    <option value="pending">{t('pending')}</option>
                    <option value="done">{t('done')} ✅</option>
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
