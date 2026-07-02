import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_DAYS } from '../lib/constants';

const WEEKS = ['all', '1', '2', '3', '4', '5', 'day30'];
const CLS = ['tp-mtg', 'tp-imp', 'tp-am', 'tp-pm', 'tp-gen', 'tp-dead'];
const CLS_LABELS = {
  'tp-mtg': '🤝 Meeting',
  'tp-imp': '✅ Import',
  'tp-am': '🌅 AM',
  'tp-pm': '🌇 PM',
  'tp-gen': '📋 General',
  'tp-dead': '⚠️ Deadline'
};

function UserRow({ user, onToggleAdmin }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-xl mb-2 hover:shadow-sm transition-all">
      <div className="w-10 h-10 rounded-full bg-[#E3EFF9] dark:bg-[#17324D] flex items-center justify-center text-lg font-bold text-[#1A5FA8] dark:text-[#9ACCF8]">
        {(user.display_name || user.email || 'U')[0].toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-medium text-[#111] dark:text-[#F0F0F0] truncate">
          {user.display_name || 'No name'}
        </div>
        <div className="text-[12px] text-[#888] dark:text-[#AAA] truncate">{user.email}</div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] px-2.5 py-1 rounded-full font-semibold ${
          user.role === 'admin'
            ? 'bg-[#FDE8EF] dark:bg-[#3D1D12] text-[#E24B4A] dark:text-[#F58876]'
            : 'bg-[#E1F5EE] dark:bg-[#163A2D] text-[#085041] dark:text-[#85E5C4]'
        }`}>
          {user.role === 'admin' ? '👑 Admin' : '👤 User'}
        </span>
        <button
          onClick={() => onToggleAdmin(user)}
          className={`text-[11px] px-3 py-1 rounded-full border cursor-pointer transition-all ${
            user.role === 'admin'
              ? 'border-[#E24B4A] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white'
              : 'border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white'
          }`}
        >
          {user.role === 'admin' ? 'Demote' : 'Make Admin'}
        </button>
      </div>
    </div>
  );
}

export default function AdminView({ toast }) {
  const [tab, setTab] = useState('routines'); // routines | users
  const [users, setUsers] = useState([]);
  const [lockedRoutines, setLockedRoutines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState(null);
  const [form, setForm] = useState({ text: '', time: '', week: 'all', day: 'all', cls: 'tp-gen', is_active: true });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [usersRes, routinesRes] = await Promise.all([
        supabase.from('profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('locked_routines').select('*').order('sort_order')
      ]);

      if (usersRes.data) setUsers(usersRes.data);
      if (routinesRes.data) setLockedRoutines(routinesRes.data);
    } catch (err) {
      console.error('Admin load error:', err);
      toast('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  // Toggle admin role
  async function handleToggleAdmin(user) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', user.id);

    if (error) {
      toast('Failed to update user role');
      return;
    }

    setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    toast(`User is now ${newRole === 'admin' ? 'an admin' : 'a regular user'}`);
  }

  // Routine CRUD
  function resetForm() {
    setForm({ text: '', time: '', week: 'all', day: 'all', cls: 'tp-gen', is_active: true });
    setEditingRoutine(null);
    setShowForm(false);
  }

  async function handleSaveRoutine(e) {
    e.preventDefault();
    if (!form.text.trim()) return;

    if (editingRoutine) {
      const { error } = await supabase
        .from('locked_routines')
        .update({
          text: form.text.trim(),
          time: form.time,
          week: form.week,
          day: form.day,
          cls: form.cls,
          is_active: form.is_active
        })
        .eq('id', editingRoutine.id);

      if (error) {
        toast('Failed to update routine');
        return;
      }

      setLockedRoutines(prev => prev.map(r => r.id === editingRoutine.id ? { ...r, ...form, text: form.text.trim() } : r));
      toast('Routine updated');
    } else {
      const maxOrder = Math.max(0, ...lockedRoutines.map(r => r.sort_order || 0));
      const { data, error } = await supabase
        .from('locked_routines')
        .insert({
          text: form.text.trim(),
          time: form.time,
          week: form.week,
          day: form.day,
          cls: form.cls,
          is_active: form.is_active,
          sort_order: maxOrder + 1
        })
        .select()
        .maybeSingle();

      if (error || !data) {
        toast('Failed to add routine');
        return;
      }

      setLockedRoutines(prev => [...prev, data]);
      toast('Routine added');
    }

    resetForm();
  }

  async function handleDeleteRoutine(id) {
    if (!confirm('Delete this routine?')) return;

    const { error } = await supabase.from('locked_routines').delete().eq('id', id);
    if (error) {
      toast('Failed to delete routine');
      return;
    }

    setLockedRoutines(prev => prev.filter(r => r.id !== id));
    toast('Routine deleted');
  }

  async function handleToggleActive(routine) {
    const { error } = await supabase
      .from('locked_routines')
      .update({ is_active: !routine.is_active })
      .eq('id', routine.id);

    if (error) {
      toast('Failed to update');
      return;
    }

    setLockedRoutines(prev => prev.map(r => r.id === routine.id ? { ...r, is_active: !r.is_active } : r));
    toast(routine.is_active ? 'Routine disabled' : 'Routine enabled');
  }

  function startEdit(routine) {
    setForm({
      text: routine.text,
      time: routine.time || '',
      week: routine.week,
      day: routine.day,
      cls: routine.cls || 'tp-gen',
      is_active: routine.is_active
    });
    setEditingRoutine(routine);
    setShowForm(true);
  }

  if (loading) {
    return (
      <div className="px-5 py-20 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <div className="text-[#888]">Loading admin panel...</div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="font-kanit text-2xl font-bold mb-2">👑 Admin Panel</div>
      <p className="text-[#888] dark:text-[#AAA] text-sm mb-6">
        Manage locked routines and user permissions
      </p>

      {/* Tab Switcher */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'routines', label: '🔒 Locked Routines' },
          { id: 'users', label: '👥 User Management' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-xl text-[13px] font-semibold cursor-pointer transition-all ${
              tab === t.id
                ? 'bg-[#111] dark:bg-[#E0E0E0] text-white dark:text-[#111]'
                : 'bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] text-[#444] dark:text-[#CCC] hover:border-[#AAA]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Routines Tab */}
      {tab === 'routines' && (
        <div>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-5 py-2.5 rounded-xl bg-[#1D9E75] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#16805E] transition-colors mb-4"
          >
            + Add Locked Routine
          </button>

          {/* Form */}
          {showForm && (
            <form onSubmit={handleSaveRoutine} className="bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl p-5 mb-5 shadow-lg">
              <div className="font-kanit text-base font-bold mb-4">
                {editingRoutine ? 'Edit Routine' : 'New Locked Routine'}
              </div>
              <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
                <div className="col-span-full flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Task Name *</label>
                  <input
                    type="text"
                    value={form.text}
                    onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                    placeholder="e.g. Daily team meeting"
                    className="px-3 py-2 border border-[#E2E0D8] dark:border-[#444] rounded-lg text-[13px] bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Time</label>
                  <input
                    type="text"
                    value={form.time}
                    onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                    placeholder="09:00–09:15"
                    className="px-3 py-2 border border-[#E2E0D8] dark:border-[#444] rounded-lg text-[13px] bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Week</label>
                  <select
                    value={form.week}
                    onChange={e => setForm(f => ({ ...f, week: e.target.value }))}
                    className="px-3 py-2 border border-[#E2E0D8] dark:border-[#444] rounded-lg text-[13px] bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none cursor-pointer"
                  >
                    {WEEKS.map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Day</label>
                  <select
                    value={form.day}
                    onChange={e => setForm(f => ({ ...f, day: e.target.value }))}
                    className="px-3 py-2 border border-[#E2E0D8] dark:border-[#444] rounded-lg text-[13px] bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none cursor-pointer"
                  >
                    <option value="all">All days</option>
                    {ALL_DAYS.filter(d => d !== 'Sunday').map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-bold text-[#888] uppercase tracking-wider">Tag</label>
                  <select
                    value={form.cls}
                    onChange={e => setForm(f => ({ ...f, cls: e.target.value }))}
                    className="px-3 py-2 border border-[#E2E0D8] dark:border-[#444] rounded-lg text-[13px] bg-white dark:bg-[#262626] text-[#111] dark:text-[#F0F0F0] outline-none cursor-pointer"
                  >
                    {CLS.map(c => <option key={c} value={c}>{CLS_LABELS[c]}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="active"
                    checked={form.is_active}
                    onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="active" className="text-[13px] text-[#444] dark:text-[#CCC] cursor-pointer">Active</label>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="px-5 py-2 rounded-xl bg-[#1D9E75] text-white text-[13px] font-semibold cursor-pointer hover:bg-[#16805E] transition-colors">
                  {editingRoutine ? 'Update' : 'Save Routine'}
                </button>
                <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-white dark:bg-[#262626] text-[#444] dark:text-[#CCC] text-[13px] cursor-pointer hover:border-[#888]">
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Routine List */}
          <div className="space-y-2">
            {lockedRoutines.map(r => (
              <div
                key={r.id}
                className={`flex items-center gap-3 px-4 py-3 bg-white dark:bg-[#1E1E1E] border rounded-xl transition-all ${
                  r.is_active ? 'border-[#E2E0D8] dark:border-[#333]' : 'border-[#DDD] dark:border-[#444] opacity-60'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className={`text-[14px] font-medium ${r.is_active ? 'text-[#111] dark:text-[#F0F0F0]' : 'text-[#888] line-through'}`}>
                    {r.text}
                  </div>
                  <div className="flex gap-2 mt-1 text-[11px] text-[#888]">
                    {r.time && <span>⏰ {r.time}</span>}
                    <span>Week: {r.week}</span>
                    <span>Day: {r.day}</span>
                    <span className={`px-1.5 py-0.5 rounded ${r.cls || 'tp-gen'}`}>{CLS_LABELS[r.cls] || r.cls}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleActive(r)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border cursor-pointer transition-all ${
                      r.is_active
                        ? 'border-[#1D9E75] text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white'
                        : 'border-[#888] text-[#888] hover:bg-[#888] hover:text-white'
                    }`}
                  >
                    {r.is_active ? '✓ Active' : 'Disabled'}
                  </button>
                  <button
                    onClick={() => startEdit(r)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-[#E2E0D8] dark:border-[#444] text-[#444] dark:text-[#CCC] hover:border-[#888] cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(r.id)}
                    className="text-[#CCC] hover:text-[#E24B4A] text-sm cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Tab */}
      {tab === 'users' && (
        <div>
          <div className="text-sm text-[#888] dark:text-[#AAA] mb-4">
            {users.length} registered users
          </div>
          <div>
            {users.map(u => (
              <UserRow key={u.id} user={u} onToggleAdmin={handleToggleAdmin} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
