import { useState } from 'react';
import { LOCKED_ROUTINES, ALL_DAYS } from '../lib/constants';

const WEEKS  = ['all','1','2','3','4','5','day30'];
const CLS    = ['tp-mtg','tp-imp','tp-am','tp-pm','tp-gen','tp-dead'];
const CLS_LABELS = { 'tp-mtg':'🤝 Meeting','tp-imp':'✅ Import','tp-am':'🌅 AM','tp-pm':'🌇 PM','tp-gen':'📋 General','tp-dead':'⚠️ Deadline' };

function RoutineRow({ r, onDelete, onEdit }) {
  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#E2E0D8] rounded-xl mb-1.5 hover:shadow-sm transition-all group">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-[#111] leading-snug">{r.text}</div>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-[#888]">⏰ {r.time || '—'}</span>
          <span className="text-[10px] text-[#888]">Week: {r.week}</span>
          <span className="text-[10px] text-[#888]">Day: {r.day}</span>
          <span className={`text-[10px] px-1.5 py-[1px] rounded font-semibold ${r.cls || 'tp-gen'}`}>{CLS_LABELS[r.cls] || r.cls}</span>
        </div>
      </div>
      {onEdit  && <button onClick={() => onEdit(r)}  className="text-[11px] px-2.5 py-1 border border-[#E2E0D8] rounded-lg text-[#444] hover:border-[#888] hover:bg-[#F5F5F0] cursor-pointer transition-all opacity-0 group-hover:opacity-100">Edit</button>}
      {onDelete && <button onClick={() => onDelete(r.id)} className="text-[#CCC] hover:text-[#E24B4A] text-sm cursor-pointer transition-colors opacity-0 group-hover:opacity-100">✕</button>}
      {!onDelete && <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0EFEB] text-[#888] font-semibold">🔒 Locked</span>}
    </div>
  );
}

const EMPTY = { text:'', time:'', week:'all', day:'all', cls:'tp-gen' };

export default function ManageView({ customRoutine, onAdd, onDelete, onUpdate, toast }) {
  const [dayFilter, setDayFilter] = useState('All');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);

  function handleSave(e) {
    e.preventDefault();
    if (!form.text.trim()) return;
    if (editId) {
      onUpdate(editId, { ...form, text: form.text.trim() });
      toast('✓ Routine updated');
    } else {
      onAdd({ ...form, text: form.text.trim() });
      toast('✓ Routine added');
    }
    setForm(EMPTY); setShowForm(false); setEditId(null);
  }

  function startEdit(r) {
    setForm({ text: r.text, time: r.time || '', week: r.week, day: r.day, cls: r.cls || 'tp-gen' });
    setEditId(r.id); setShowForm(true);
  }

  const filteredLocked = dayFilter === 'All' ? LOCKED_ROUTINES
    : LOCKED_ROUTINES.filter(r => r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(dayFilter) || dayFilter === 'day30' && r.week === 'day30');

  const filteredCustom = dayFilter === 'All' ? customRoutine
    : customRoutine.filter(r => r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(dayFilter));

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="font-kanit text-xl font-bold">Manage Routines</div>
          <div className="text-[12px] text-[#888] mt-1 max-w-md leading-relaxed">
            Locked routines always appear. Add custom routines for specific days/weeks.
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
          className="px-5 py-2 rounded-full bg-[#1A5FA8] text-white text-[13px] font-semibold font-sarabun cursor-pointer hover:bg-[#0F4A8A] transition-colors whitespace-nowrap">
          + Add Routine
        </button>
      </div>

      {/* Day filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {['All', ...ALL_DAYS.filter(d => d !== 'Sunday')].map(d => (
          <button key={d} onClick={() => setDayFilter(d)}
            className={`px-3.5 py-1 rounded-full border text-[12px] font-sarabun cursor-pointer transition-all
              ${dayFilter === d ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#444] border-[#E2E0D8] hover:border-[#AAA]'}`}>
            {d}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSave} className="bg-white border border-[#E2E0D8] rounded-[14px] p-5 mb-5 shadow-lg fade-up">
          <div className="font-kanit text-[15px] font-bold mb-4">{editId ? 'Edit Routine' : 'New Routine'}</div>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[
              { label: 'Task name *', key: 'text', type: 'text', placeholder: 'e.g. Print salary slips' },
              { label: 'Time',        key: 'time', type: 'text', placeholder: '09:00–10:00' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{label}</label>
                <input type={type} placeholder={placeholder}
                  className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] transition-colors"
                  value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Week</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value }))}>
                {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Day</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                <option value="all">All days</option>
                {ALL_DAYS.filter(d => d !== 'Sunday').map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Tag colour</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.cls} onChange={e => setForm(f => ({ ...f, cls: e.target.value }))}>
                {CLS.map(c => <option key={c} value={c}>{CLS_LABELS[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-5 py-2 rounded-full bg-[#1A5FA8] text-white text-[13px] font-semibold font-sarabun cursor-pointer hover:bg-[#0F4A8A] transition-colors">
              {editId ? 'Update' : 'Save Routine'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}
              className="px-4 py-2 rounded-full border border-[#E2E0D8] bg-white text-[#444] text-[13px] font-sarabun cursor-pointer hover:border-[#888] transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Locked routines */}
      <div className="mb-5">
        <div className="font-kanit text-[14px] font-semibold px-3 py-2 rounded-lg mb-2"
          style={{ background: '#F0EFEB', color: '#444' }}>🔒 Locked Routines ({filteredLocked.length})</div>
        {filteredLocked.map(r => <RoutineRow key={r.id} r={r} />)}
      </div>

      {/* Custom routines */}
      <div>
        <div className="font-kanit text-[14px] font-semibold px-3 py-2 rounded-lg mb-2"
          style={{ background: '#E3EFF9', color: '#0C3A6E' }}>✏️ Custom Routines ({filteredCustom.length})</div>
        {filteredCustom.length === 0 && (
          <div className="text-[#AAA] text-sm py-4 text-center">No custom routines yet</div>
        )}
        {filteredCustom.map(r => (
          <RoutineRow key={r.id} r={r}
            onDelete={id => { onDelete(id); toast('🗑 Deleted'); }}
            onEdit={startEdit} />
        ))}
      </div>
    </div>
  );
}
