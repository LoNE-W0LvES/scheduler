import { useState } from 'react';
import { DC, isSameDay, getTH } from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

function Pill({ cls, children }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default function DayCard({
  week, day, date, dayOfMonth,
  routine, dayState, day30Info,
  onToggleRoutine, onToggleEditTask, onAddEditTask, onDeleteEditTask, onUpdateEditTask,
  toast,
  isCurrentMonth = true,
  offDays = ['Sunday'],
}) {
  const { t } = useLanguage();
  const dc = DC[day] || DC.Sunday;
  const today = getTH();
  const isToday = isSameDay(date, today);
  const isOffDay = offDays.includes(day);

  const [adding, setAdding] = useState(false);
  const [addText, setAddText] = useState('');
  const [addTime, setAddTime] = useState('');
  const [editId, setEditId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editTime, setEditTime] = useState('');

  const s = dayState || { routineDone: {}, editTasks: [] };
  const total = routine.length + s.editTasks.length;
  const done = routine.filter((_, i) => s.routineDone[i]).length + s.editTasks.filter(t => t.done).length;
  const progressPct = total ? Math.round((done / total) * 100) : 0;

  // Off day card
  if (isOffDay) {
    return (
      <div className="card-static overflow-hidden opacity-60">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: dc.bg }}>
          <div>
            <div className="font-display font-semibold text-base flex items-center gap-2" style={{ color: dc.hdr }}>
              <span>{t(day)}</span>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#95A5A6] text-white font-semibold">{t('today')}</span>
              )}
            </div>
            <div className="opacity-65 font-normal text-[11px] leading-tight mt-0.5" style={{ color: dc.hdr }}>
              ({t(day + '_short')})
            </div>
            <div className="text-xs opacity-60 mt-1" style={{ color: dc.hdr }}>{date.getDate()} {t('month_short_' + date.getMonth())}</div>
          </div>
          <div className="text-xl opacity-40">😴</div>
        </div>
        <div className="px-4 py-6 text-center">
          <div className="text-3xl mb-2">🏖️</div>
          <div className="text-xs text-[#6B7280]">{t('dayOff')}</div>
        </div>
      </div>
    );
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!addText.trim()) {
      setAdding(false);
      return;
    }
    onAddEditTask(week, day, addText.trim(), addTime.trim());
    setAddText('');
    setAddTime('');
    setAdding(false);
    toast(t('taskAdded'));
  }

  function handleEditSubmit(e, taskId) {
    e.preventDefault();
    if (editText.trim()) {
      onUpdateEditTask(week, day, taskId, editText.trim(), editTime.trim());
    }
    setEditId(null);
    toast(t('taskUpdated'));
  }

  function startEdit(task) {
    setEditId(task.id);
    setEditText(task.text);
    setEditTime(task.time || '');
  }

  return (
    <div
      className={`card overflow-hidden transition-all duration-300 ${!isCurrentMonth ? 'opacity-70' : ''}`}
      style={isToday ? { boxShadow: `0 0 0 3px ${dc.c}, var(--shadow-lg)` } : {}}
    >
      {/* Header with gradient */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ background: `linear-gradient(135deg, ${dc.bg}, ${dc.bg}ee)` }}
      >
        <div className="flex items-start gap-2.5">
          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-bold shadow-sm flex-shrink-0 mt-0.5"
            style={{ background: dc.gradient || dc.c }}>
            {dayOfMonth || date.getDate()}
          </span>
          <div className="flex flex-col">
            <div className="font-display font-semibold text-base leading-tight flex items-center gap-1.5" style={{ color: dc.hdr }}>
              <span>{t(day)}</span>
              {isToday && (
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white font-semibold"
                  style={{ background: dc.c }}>{t('today')}</span>
              )}
            </div>
            <div className="opacity-65 font-normal text-[11px] leading-tight mt-0.5" style={{ color: dc.hdr }}>
              ({t(day + '_short')})
            </div>
            <div className="text-xs opacity-60 mt-1" style={{ color: dc.hdr }}>{date.getDate()} {t('month_short_' + date.getMonth())}</div>
          </div>
        </div>
        {/* Progress badge */}
        <div className="flex items-center gap-2">
          <div className="w-12 h-1.5 rounded-full bg-white/30 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: dc.gradient || dc.c }} />
          </div>
          <span className="text-sm font-bold px-2.5 py-1 rounded-lg bg-white/60"
            style={{ color: dc.c }}>{done}/{total}</span>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Locked routines */}
        <div className="text-[11px] font-bold tracking-wide uppercase text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5 mb-2">
          <span>{t('recurring')}</span>
        </div>

        {routine.map((tItem, i) => {
          const isDone = !!s.routineDone[i];
          return (
            <div
              key={tItem.id || i}
              onClick={() => {
                onToggleRoutine(week, day, i);
                toast(s.routineDone[i] ? t('unmarked') : t('done') + '!');
              }}
              className="flex items-start gap-3 py-2 px-2 rounded-xl cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-all group -mx-2"
            >
              {/* Checkbox dot */}
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  background: isDone ? 'linear-gradient(135deg, #10B981, #059669)' : (dc.gradient || dc.c),
                  boxShadow: isDone ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {isDone && <span className="text-white text-xs">✓</span>}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${isDone ? 'line-through text-[#9CA3AF]' : 'text-[#1F2937] dark:text-[#F3F4F6]'}`}>
                  {tItem.text}
                </div>
                <div className="flex gap-1.5 mt-1 flex-wrap">
                  {tItem.time && <Pill cls={tItem.cls || 'tp-gen'}>{tItem.time}</Pill>}
                  {tItem.week === 'day30' && <Pill cls="badge-error">{t('day30')}</Pill>}
                </div>
              </div>
            </div>
          );
        })}

        <hr className="border-[#E5E7EB] dark:border-[#374151] my-3" />

        {/* Custom tasks */}
        <div className="text-[11px] font-bold tracking-wide uppercase text-[#6B7280] dark:text-[#9CA3AF] flex items-center gap-1.5 mb-2">
          <span>{t('customTasks')}</span>
        </div>

        {s.editTasks.map(task => {
          if (editId === task.id) {
            return (
              <form key={task.id} onSubmit={e => handleEditSubmit(e, task.id)}
                className="flex items-center gap-2 py-2 -mx-2">
                <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: dc.c }} />
                <input
                  className="flex-1 text-sm border-b-2 border-[#1D9E75] bg-transparent outline-none py-1 text-[#1F2937] dark:text-[#F3F4F6]"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  placeholder={t('taskName')}
                  autoFocus
                />
                <input
                  className="w-[100px] text-xs border-b border-[#D1D5DB] dark:border-[#4B5563] bg-transparent outline-none py-1 text-[#6B7280] dark:text-[#9CA3AF]"
                  value={editTime}
                  onChange={e => setEditTime(e.target.value)}
                  placeholder={t('time')}
                />
                <button type="submit" className="text-xs px-2.5 py-1 rounded-lg bg-[#1D9E75] text-white font-semibold hover:bg-[#059669] transition-colors">
                  {t('save')}
                </button>
                <button type="button" onClick={() => setEditId(null)} className="text-xs px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-colors">
                  {t('cancel')}
                </button>
              </form>
            );
          }

          return (
            <div
              key={task.id}
              className="flex items-start gap-3 py-2 px-2 rounded-xl cursor-pointer hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-all group -mx-2"
              onClick={e => {
                if (e.target.closest('.del-btn') || e.target.closest('.edit-btn')) return;
                onToggleEditTask(week, day, task.id);
                toast(task.done ? t('unmarked') : t('done') + '!');
              }}
              onDoubleClick={() => startEdit(task)}
            >
              <div
                className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center transition-all group-hover:scale-110"
                style={{
                  background: task.done ? 'linear-gradient(135deg, #10B981, #059669)' : (dc.gradient || dc.c),
                  boxShadow: task.done ? '0 2px 8px rgba(16, 185, 129, 0.4)' : 'none'
                }}
              >
                {task.done && <span className="text-white text-xs">✓</span>}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm leading-snug ${task.done ? 'line-through text-[#9CA3AF]' : 'text-[#1F2937] dark:text-[#F3F4F6]'}`}>
                  {task.text}
                </div>
                {task.time && <Pill cls="tp-gen">{task.time}</Pill>}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={e => { e.stopPropagation(); startEdit(task); }}
                  className="edit-btn text-xs px-2 py-1 rounded-lg text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-colors"
                >
                  {t('edit')}
                </button>
                <button
                  onClick={e => { e.stopPropagation(); onDeleteEditTask(week, day, task.id); toast(t('deleted')); }}
                  className="del-btn text-xs px-2 py-1 rounded-lg text-[#EF4444] hover:bg-[#FEE2E2] dark:hover:bg-[#450A0A] transition-colors"
                >
                  {t('delete')}
                </button>
              </div>
            </div>
          );
        })}

        {/* Add task */}
        {adding ? (
          <form onSubmit={handleAddSubmit} className="flex items-center gap-2 mt-3 -mx-2">
            <div className="w-5 h-5 rounded-full flex-shrink-0" style={{ background: dc.c }} />
            <input
              autoFocus
              className="flex-1 text-sm border-b-2 border-[#1D9E75] bg-transparent outline-none py-1 text-[#1F2937] dark:text-[#F3F4F6]"
              value={addText}
              onChange={e => setAddText(e.target.value)}
              placeholder={t('taskName')}
            />
            <input
              className="w-[80px] text-xs border-b border-[#D1D5DB] dark:border-[#4B5563] bg-transparent outline-none py-1 text-[#6B7280] dark:text-[#9CA3AF]"
              value={addTime}
              onChange={e => setAddTime(e.target.value)}
              placeholder={t('time')}
            />
            <button type="submit" className="text-xs px-2.5 py-1 rounded-lg bg-[#1D9E75] text-white font-semibold hover:bg-[#059669] transition-colors">
              {t('add')}
            </button>
            <button type="button" onClick={() => setAdding(false)} className="text-xs px-2.5 py-1 rounded-lg border border-[#E5E7EB] dark:border-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#F3F4F6] dark:hover:bg-[#374151] transition-colors">
              {t('cancel')}
            </button>
          </form>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="mt-3 text-xs text-[#6B7280] dark:text-[#9CA3AF] hover:text-[#1D9E75] dark:hover:text-[#10B981] flex items-center gap-1.5 transition-colors font-medium cursor-pointer"
          >
            <span className="w-5 h-5 rounded-lg flex items-center justify-center text-white text-base leading-none"
              style={{ background: dc.gradient || dc.c }}>+</span>
            {t('addCustomTask')}
          </button>
        )}
      </div>
    </div>
  );
}
