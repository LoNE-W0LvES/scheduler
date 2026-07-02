import { useState } from 'react';
import {
  DC, IMPORT_DAYS, isSameDay, fmtDateShort, getTH,
} from '../lib/constants';

function Pill({ cls, children }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-[1px] rounded font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export default function DayCard({
  week, day, date,
  routine, dayState, day30Info,
  onToggleRoutine, onToggleEditTask, onAddEditTask, onDeleteEditTask, onUpdateEditTask,
  toast,
}) {
  const dc = DC[day];
  const today = getTH();
  const isToday = isSameDay(date, today);
  const isSunday = day === 'Sunday';

  const [adding, setAdding]       = useState(false);
  const [addText, setAddText]     = useState('');
  const [addTime, setAddTime]     = useState('');
  const [editId, setEditId]       = useState(null);
  const [editText, setEditText]   = useState('');
  const [editTime, setEditTime]   = useState('');

  const s = dayState || { routineDone: {}, editTasks: [] };
  const total = routine.length + s.editTasks.length;
  const done  = routine.filter((_, i) => s.routineDone[i]).length + s.editTasks.filter(t => t.done).length;

  const borderStyle = isToday
    ? { boxShadow: `0 0 0 2.5px ${dc.c}, 0 6px 32px rgba(0,0,0,.12)`, borderColor: dc.c }
    : {};

  if (isSunday) {
    return (
      <div className="bg-white rounded-[14px] border-[1.5px] border-[#E2E0D8] shadow-sm overflow-hidden opacity-65">
        <div className="px-4 py-3 flex items-center justify-between" style={{ background: dc.bg }}>
          <div>
            <div className="font-kanit font-semibold text-sm" style={{ color: dc.hdr }}>
              Sunday <span className="opacity-60 font-normal text-xs">({dc.th})</span>
              {isToday && <span className="ml-1 text-[10px] px-2 py-[1px] rounded-full text-white font-bold" style={{ background: dc.c }}>Today</span>}
            </div>
            <div className="text-[11px] opacity-70 mt-px" style={{ color: dc.hdr }}>{fmtDateShort(date)}</div>
          </div>
          <div className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ color: dc.hdr, background: 'rgba(255,255,255,.55)' }}>หยุด</div>
        </div>
        <div className="px-4 py-5 text-center">
          <div className="text-4xl opacity-40">😴</div>
          <div className="text-xs text-[#999] mt-1">วันหยุด — Head office ปิด</div>
        </div>
      </div>
    );
  }

  function handleAddSubmit(e) {
    e.preventDefault();
    if (!addText.trim()) { setAdding(false); return; }
    onAddEditTask(week, day, addText.trim(), addTime.trim());
    setAddText(''); setAddTime(''); setAdding(false);
    toast('✓ Task added');
  }

  function handleEditSubmit(e, taskId) {
    e.preventDefault();
    if (editText.trim()) {
      onUpdateEditTask(week, day, taskId, editText.trim(), editTime.trim());
    }
    setEditId(null);
    toast('✓ Task updated');
  }

  function startEdit(task) {
    setEditId(task.id);
    setEditText(task.text);
    setEditTime(task.time || '');
  }

  return (
    <div
      className={`bg-white rounded-[14px] border-[1.5px] border-[#E2E0D8] shadow-sm overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
      style={borderStyle}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between" style={{ background: dc.bg }}>
        <div>
          <div className="font-kanit font-semibold text-sm flex items-center gap-1" style={{ color: dc.hdr }}>
            {day}
            <span className="opacity-60 font-normal text-xs">({dc.th})</span>
            {isToday && (
              <span className="text-[10px] px-2 py-[1px] rounded-full text-white font-bold" style={{ background: dc.c }}>Today</span>
            )}
          </div>
          <div className="text-[11px] opacity-70 mt-px" style={{ color: dc.hdr }}>{fmtDateShort(date)}</div>
        </div>
        <div className="text-[13px] font-bold px-2.5 py-1 rounded-full" style={{ color: dc.hdr, background: 'rgba(255,255,255,.55)' }}>
          {done}/{total}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {/* Import badge */}
        {IMPORT_DAYS.includes(day) && (
          <div className="text-[10px] font-bold text-[#085041] bg-[#D4F4E8] rounded px-2 py-[2px] inline-flex items-center gap-1 mb-2">
            ↻ Import day (every 3 days)
          </div>
        )}

        {/* Routine tasks */}
        <div className="text-[10px] font-bold tracking-widest uppercase text-[#888] flex items-center gap-1 mb-1.5">
          🔒 Repeating tasks
        </div>
        {routine.map((t, i) => {
          const isDone = !!s.routineDone[i];
          return (
            <div
              key={t.id || i}
              onClick={() => { onToggleRoutine(week, day, i); toast(s.routineDone[i] ? '↩ Unmarked' : '✓ Done!'); }}
              className="flex items-start gap-2 py-1.5 px-1.5 rounded-lg cursor-pointer hover:bg-[#F5F4F0] transition-colors group -mx-1.5"
            >
              <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 mt-[4px] transition-transform group-hover:scale-125"
                style={{ background: isDone ? '#1D9E75' : dc.c }} />
              <div className="flex-1 min-w-0">
                <div className={`text-[12.5px] leading-snug ${isDone ? 'line-through text-[#888]' : 'text-[#111]'}`}>
                  {t.text}
                </div>
                <div className="flex gap-1 mt-0.5 flex-wrap">
                  {t.time && <Pill cls={t.cls || 'tp-gen'}>⏰ {t.time}</Pill>}
                  {t.week === 'day30' && <Pill cls="bg-[#FFE0E0] text-[#C0000A]">📅 วันที่ 30</Pill>}
                  <Pill cls="bg-[#F1EFE8] text-[#888]">🔒</Pill>
                </div>
              </div>
            </div>
          );
        })}

        <hr className="border-[#F0EFEB] my-2.5" />

        {/* Editable tasks */}
        <div className="text-[10px] font-bold tracking-widest uppercase text-[#888] flex items-center gap-1 mb-1.5">
          ✏️ Editable tasks
        </div>
        {s.editTasks.map(task => {
          if (editId === task.id) {
            return (
              <form key={task.id} onSubmit={e => handleEditSubmit(e, task.id)}
                className="flex items-center gap-1.5 py-1 -mx-1">
                <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: dc.c }} />
                <input className="flex-1 text-[12px] border-b border-[#AAA] bg-transparent outline-none py-0.5 text-[#111]"
                  value={editText} onChange={e => setEditText(e.target.value)} placeholder="Task name…" autoFocus />
                <input className="w-[100px] text-[11px] border-b border-[#AAA] bg-transparent outline-none py-0.5 text-[#444]"
                  value={editTime} onChange={e => setEditTime(e.target.value)} placeholder="09:00–10:00" />
                <button type="submit" className="text-[11px] px-2 py-0.5 bg-[#1D9E75] text-white rounded cursor-pointer">✓</button>
                <button type="button" onClick={() => setEditId(null)} className="text-[11px] px-2 py-0.5 border border-[#DDD] rounded cursor-pointer">✕</button>
              </form>
            );
          }
          return (
            <div key={task.id}
              className="flex items-start gap-2 py-1.5 px-1.5 rounded-lg cursor-pointer hover:bg-[#F5F4F0] transition-colors group -mx-1.5"
              onClick={e => { if (e.target.closest('.del-btn')) return; onToggleEditTask(week, day, task.id); toast(task.done ? '↩ Unmarked' : '✓ Done!'); }}
              onDoubleClick={() => startEdit(task)}
            >
              <div className="w-[9px] h-[9px] rounded-full flex-shrink-0 mt-[4px] transition-transform group-hover:scale-125"
                style={{ background: task.done ? '#1D9E75' : dc.c }} />
              <div className="flex-1 min-w-0">
                <div className={`text-[12.5px] leading-snug ${task.done ? 'line-through text-[#888]' : 'text-[#111]'}`}>
                  {task.text}
                </div>
                {task.time && <Pill cls="tp-gen">⏰ {task.time}</Pill>}
              </div>
              <button className="del-btn opacity-0 group-hover:opacity-100 text-[#CCC] hover:text-[#E24B4A] text-xs transition-all ml-1 cursor-pointer"
                onClick={e => { e.stopPropagation(); onDeleteEditTask(week, day, task.id); toast('🗑 Deleted'); }}>
                ✕
              </button>
            </div>
          );
        })}

        {/* Add task row */}
        {adding ? (
          <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5 mt-2 -mx-1">
            <div className="w-[9px] h-[9px] rounded-full flex-shrink-0" style={{ background: dc.c }} />
            <input autoFocus className="flex-1 text-[12px] border-b border-[#AAA] bg-transparent outline-none py-0.5 text-[#111]"
              value={addText} onChange={e => setAddText(e.target.value)} placeholder="Task name… (Enter to save)" />
            <input className="w-[100px] text-[11px] border-b border-[#AAA] bg-transparent outline-none py-0.5 text-[#444]"
              value={addTime} onChange={e => setAddTime(e.target.value)} placeholder="09:00–10:00" />
            <button type="submit" className="text-[11px] px-2 py-0.5 bg-[#1D9E75] text-white rounded cursor-pointer">✓</button>
            <button type="button" onClick={() => setAdding(false)} className="text-[11px] px-2 py-0.5 border border-[#DDD] rounded cursor-pointer">✕</button>
          </form>
        ) : (
          <button onClick={() => setAdding(true)}
            className="mt-2 text-[11px] text-[#888] hover:text-[#111] flex items-center gap-1 cursor-pointer transition-colors">
            <span className="text-base leading-none" style={{ color: dc.c }}>+</span> Add task
          </button>
        )}
      </div>
    </div>
  );
}
