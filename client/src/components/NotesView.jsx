import { useState } from 'react';

const ICONS = ['📌','⏰','🚗','📋','📢','📅','⚠️','🗂️','🏨','🔄','↻','💡','📝','✅','🔔'];

export default function NotesView({ notes, onAdd, onDelete, onUpdate, toast }) {
  const [newText, setNewText] = useState('');
  const [newIcon, setNewIcon] = useState('📌');
  const [editId, setEditId]   = useState(null);
  const [editText, setEditText] = useState('');

  function handleAdd(e) {
    e.preventDefault();
    if (!newText.trim()) return;
    onAdd(newIcon, newText.trim());
    setNewText(''); setNewIcon('📌');
    toast('📌 Note added');
  }

  function saveEdit(id) {
    if (editText.trim()) onUpdate(id, editText.trim());
    setEditId(null); toast('✓ Note updated');
  }

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="font-kanit text-xl font-bold mb-4">Notes & Reminders</div>

      <div className="flex flex-col gap-2 mb-4">
        {notes.map(n => (
          <div key={n.id}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border border-[#E2E0D8] bg-white shadow-sm hover:translate-x-1 hover:shadow-md transition-all group cursor-default">
            <span className="text-lg flex-shrink-0 mt-0.5">{n.icon}</span>
            {editId === n.id ? (
              <div className="flex-1 flex gap-2 items-start">
                <textarea
                  className="flex-1 text-[13px] leading-relaxed border-b border-[#1A5FA8] bg-transparent outline-none resize-none text-[#111]"
                  value={editText}
                  onChange={e => setEditText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(n.id); } }}
                  autoFocus rows={2}
                />
                <button onClick={() => saveEdit(n.id)} className="text-[11px] px-2 py-0.5 bg-[#1D9E75] text-white rounded cursor-pointer">✓</button>
                <button onClick={() => setEditId(null)} className="text-[11px] px-2 py-0.5 border border-[#DDD] rounded cursor-pointer">✕</button>
              </div>
            ) : (
              <span
                className="flex-1 text-[13px] leading-relaxed text-[#111]"
                onDoubleClick={() => { setEditId(n.id); setEditText(n.text); }}
              >
                {n.text}
              </span>
            )}
            <button
              className="opacity-0 group-hover:opacity-100 text-[#CCC] hover:text-[#E24B4A] text-sm transition-all cursor-pointer"
              onClick={() => { onDelete(n.id); toast('🗑 Deleted'); }}>✕</button>
          </div>
        ))}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 items-center">
        <select
          className="border border-[#E2E0D8] rounded-lg px-2 py-2.5 bg-white text-sm outline-none cursor-pointer"
          value={newIcon} onChange={e => setNewIcon(e.target.value)}>
          {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
        </select>
        <input
          className="flex-1 px-3.5 py-2.5 border border-[#E2E0D8] rounded-xl text-[13px] font-sarabun bg-white text-[#111] outline-none focus:border-[#5B4EC8] transition-colors"
          value={newText}
          onChange={e => setNewText(e.target.value)}
          placeholder="Add a note or reminder…"
        />
        <button type="submit"
          className="px-4 py-2.5 rounded-xl bg-[#5B4EC8] text-white text-[13px] font-semibold font-sarabun cursor-pointer hover:bg-[#4A43B5] transition-colors">
          + Add
        </button>
      </form>
    </div>
  );
}
