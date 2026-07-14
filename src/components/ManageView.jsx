import { useState, useRef } from 'react';
import { ALL_DAYS } from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

const WEEKS  = ['all','1','2','3','4','5','day30'];
const CLS    = ['tp-mtg','tp-imp','tp-am','tp-pm','tp-gen','tp-dead'];

function RoutineRow({ r, onDelete, onEdit, t }) {
  const clsLabels = {
    'tp-mtg': '🤝 ' + t('meeting'),
    'tp-imp': '✅ ' + t('import'),
    'tp-am': '🌅 ' + t('am'),
    'tp-pm': '🌇 ' + t('pm'),
    'tp-gen': '📋 ' + t('general'),
    'tp-dead': '⚠️ ' + t('deadline'),
  };

  return (
    <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-[#E2E0D8] rounded-xl mb-1.5 hover:shadow-sm transition-all group">
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-[#111] leading-snug">{r.text}</div>
        <div className="flex gap-2 mt-1 flex-wrap">
          <span className="text-[10px] text-[#888]">⏰ {r.time || '—'}</span>
          <span className="text-[10px] text-[#888]">{t('week')}: {r.week === 'all' ? t('all') : r.week}</span>
          <span className="text-[10px] text-[#888]">{t('day')}: {r.day === 'all' ? t('allDays') : (t(r.day) || r.day)}</span>
          <span className={`text-[10px] px-1.5 py-[1px] rounded font-semibold ${r.cls || 'tp-gen'}`}>{clsLabels[r.cls] || r.cls}</span>
        </div>
      </div>
      {onEdit  && <button onClick={() => onEdit(r)}  className="text-[11px] px-2.5 py-1 border border-[#E2E0D8] rounded-lg text-[#444] hover:border-[#888] hover:bg-[#F5F5F0] cursor-pointer transition-all opacity-0 group-hover:opacity-100">{t('edit')}</button>}
      {onDelete && <button onClick={() => onDelete(r.id)} className="text-[#CCC] hover:text-[#E24B4A] text-sm cursor-pointer transition-colors opacity-0 group-hover:opacity-100">✕</button>}
      {!onDelete && <span className="text-[10px] px-2 py-0.5 rounded bg-[#F0EFEB] text-[#888] font-semibold">🔒 {t('locked')}</span>}
    </div>
  );
}

const EMPTY = { text:'', time:'', week:'all', day:'all', cls:'tp-gen' };

export default function ManageView({ customRoutine, lockedRoutines = [], onAdd, onDelete, onUpdate, exportSettings, importSettings, toast }) {
  const { t } = useLanguage();
  const [dayFilter, setDayFilter] = useState('All');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [editId, setEditId]       = useState(null);

  const clsLabels = {
    'tp-mtg': '🤝 ' + t('meeting'),
    'tp-imp': '✅ ' + t('import'),
    'tp-am': '🌅 ' + t('am'),
    'tp-pm': '🌇 ' + t('pm'),
    'tp-gen': '📋 ' + t('general'),
    'tp-dead': '⚠️ ' + t('deadline'),
  };

  function handleSave(e) {
    e.preventDefault();
    if (!form.text.trim()) return;
    if (editId) {
      onUpdate(editId, { ...form, text: form.text.trim() });
      toast('✓ ' + t('taskUpdated'));
    } else {
      onAdd({ ...form, text: form.text.trim() });
      toast('✓ ' + t('taskAdded'));
    }
    setForm(EMPTY); setShowForm(false); setEditId(null);
  }

  function startEdit(r) {
    setForm({ text: r.text, time: r.time || '', week: r.week, day: r.day, cls: r.cls || 'tp-gen' });
    setEditId(r.id); setShowForm(true);
  }

  const filteredCustom = dayFilter === 'All' ? customRoutine
    : customRoutine.filter(r => r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(dayFilter));

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <div className="font-kanit text-xl font-bold">{t('manageRoutines')}</div>
          <div className="text-[12px] text-[#888] mt-1 max-w-md leading-relaxed">
            {t('manageSub')}
          </div>
        </div>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY); }}
          className="px-5 py-2 rounded-full bg-[#1A5FA8] text-white text-[13px] font-semibold font-sarabun cursor-pointer hover:bg-[#0F4A8A] transition-colors whitespace-nowrap">
          + {t('addRoutine')}
        </button>
      </div>


      {/* Day filter */}
      <div className="flex gap-1.5 flex-wrap mb-4">
        {['All', ...ALL_DAYS.filter(d => d !== 'Sunday')].map(d => (
          <button key={d} onClick={() => setDayFilter(d)}
            className={`px-3.5 py-1 rounded-full border text-[12px] font-sarabun cursor-pointer transition-all
              ${dayFilter === d ? 'bg-[#111] text-white border-[#111]' : 'bg-white text-[#444] border-[#E2E0D8] hover:border-[#AAA]'}`}>
            {d === 'All' ? t('all') : t(d)}
          </button>
        ))}
      </div>

      {/* Form */}
      {showForm && (
        <form onSubmit={(e) => { e.preventDefault(); handleSave(e); }} className="bg-white border border-[#E2E0D8] rounded-[14px] p-5 mb-5 shadow-lg fade-up">
          <div className="font-kanit text-[15px] font-bold mb-4">{editId ? t('edit') : t('newRoutine')}</div>
          <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
            {[
              { label: t('taskName') + ' *', key: 'text', type: 'text', placeholder: 'e.g. Print salary slips' },
              { label: t('time'),        key: 'time', type: 'text', placeholder: '09:00–10:00' },
            ].map(({ label, key, type, placeholder }) => (
              <div key={key} className="flex flex-col gap-1">
                <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{label}</label>
                <input type={type} placeholder={placeholder}
                  className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] transition-colors"
                  value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{t('week')}</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.week} onChange={e => setForm(f => ({ ...f, week: e.target.value }))}>
                {WEEKS.map(w => <option key={w} value={w}>{w === 'all' ? t('all') : w}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{t('day')}</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.day} onChange={e => setForm(f => ({ ...f, day: e.target.value }))}>
                <option value="all">{t('allDays')}</option>
                {ALL_DAYS.filter(d => d !== 'Sunday').map(d => <option key={d} value={d}>{t(d)}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">{t('tagColor')}</label>
              <select className="px-3 py-2 border border-[#E2E0D8] rounded-lg text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#1A5FA8] cursor-pointer"
                value={form.cls} onChange={e => setForm(f => ({ ...f, cls: e.target.value }))}>
                {CLS.map(c => <option key={c} value={c}>{clsLabels[c]}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={(e) => { e.preventDefault(); handleSave(e); }} className="px-5 py-2 rounded-full bg-[#1A5FA8] text-white text-[13px] font-semibold font-sarabun cursor-pointer hover:bg-[#0F4A8A] transition-colors">
              {editId ? t('update') : t('save')}
            </button>
            <button type="button" onClick={() => { setShowForm(false); setEditId(null); setForm(EMPTY); }}
              className="px-4 py-2 rounded-full border border-[#E2E0D8] bg-white text-[#444] text-[13px] font-sarabun cursor-pointer hover:border-[#888] transition-colors">
              {t('cancel')}
            </button>
          </div>
        </form>
      )}

      {/* Routines */}
      <div>
        <div className="font-kanit text-[14px] font-semibold px-3 py-2 rounded-lg mb-2"
          style={{ background: '#E3EFF9', color: '#0C3A6E' }}>📋 {t('customRoutines')} ({filteredCustom.length})</div>
        {filteredCustom.length === 0 && (
          <div className="text-[#AAA] text-sm py-4 text-center">{t('noCustomRoutines')}</div>
        )}
        {filteredCustom.map(r => (
          <RoutineRow key={r.id} r={r} t={t}
            onDelete={id => { onDelete(id); toast('🗑 ' + t('deleted')); }}
            onEdit={startEdit} />
        ))}
      </div>
    </div>
  );
}
