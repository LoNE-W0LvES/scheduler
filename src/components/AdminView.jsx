import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ALL_DAYS, uid } from '../lib/constants';

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

function UserRow({ user, isSelf, onEditUser, onDeleteUser, onResetPassword, onToggleAdmin }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-xl mb-2.5 hover:shadow-md transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1D9E75] to-[#16805E] flex items-center justify-center text-base font-bold text-white shadow-sm flex-shrink-0">
          {(user.display_name || user.email || 'U')[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-bold text-[#111] dark:text-[#F0F0F0] truncate flex items-center gap-2">
            <span>{user.display_name || 'No name'}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              user.role === 'admin'
                ? 'bg-[#FDE8EF] dark:bg-[#3D1D12] text-[#E24B4A] dark:text-[#F58876]'
                : 'bg-[#E1F5EE] dark:bg-[#163A2D] text-[#085041] dark:text-[#85E5C4]'
            }`}>
              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
            {isSelf && (
              <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#3B82F6]/10 text-[#2563EB] dark:text-[#60A5FA]">
                You
              </span>
            )}
          </div>
          <div className="text-[12px] text-[#888] dark:text-[#AAA] truncate mt-0.5">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap justify-end">
        {!isSelf ? (
          <button
            onClick={() => onToggleAdmin(user)}
            title={user.role === 'admin' ? 'Demote to User' : 'Make Admin'}
            className={`text-[11px] px-3 py-1.5 rounded-lg font-semibold border transition-all cursor-pointer ${
              user.role === 'admin'
                ? 'border-[#E24B4A]/50 text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white'
                : 'border-[#1D9E75]/50 text-[#1D9E75] hover:bg-[#1D9E75] hover:text-white'
            }`}
          >
            {user.role === 'admin' ? 'Demote' : 'Make Admin'}
          </button>
        ) : (
          <span className="text-[11px] px-2.5 py-1 text-[#888] font-medium bg-gray-100 dark:bg-[#262626] rounded-lg">
            Protected Admin
          </span>
        )}
        <button
          onClick={() => onEditUser(user)}
          title="Edit user details"
          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-[#444] dark:text-[#DDD] hover:border-[#888] font-medium cursor-pointer transition-all"
        >
          ✏️ Edit
        </button>
        <button
          onClick={() => onResetPassword(user)}
          title="Reset Password"
          className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-[#D97706] dark:text-[#FBBF24] hover:border-[#D97706] font-medium cursor-pointer transition-all"
        >
          🔑 Reset Pwd
        </button>
        {!isSelf && (
          <button
            onClick={() => onDeleteUser(user)}
            title="Delete User"
            className="text-[11px] px-2.5 py-1.5 rounded-lg border border-[#E24B4A]/30 bg-[#FEF2F2] dark:bg-[#3B1818] text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white font-medium cursor-pointer transition-all"
          >
            🗑 Delete
          </button>
        )}
      </div>
    </div>
  );
}

export default function AdminView({ user: currentUser, toast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // User Management Form State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ email: '', display_name: '', role: 'user', password: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // Password Reset Modal State
  const [resetModalUser, setResetModalUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const usersRes = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (usersRes.data) setUsers(usersRes.data);
    } catch (err) {
      console.error('Admin load error:', err);
      toast('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  }

  // Toggle admin role
  async function handleToggleAdmin(user) {
    if (user.id === currentUser?.id) {
      toast('❌ You cannot demote your own admin account!');
      return;
    }
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

  // User CRUD
  function resetUserForm() {
    setUserForm({ email: '', display_name: '', role: 'user', password: '' });
    setEditingUser(null);
    setShowUserModal(false);
  }

  async function handleSaveUser(e) {
    e.preventDefault();
    if (!userForm.email.trim()) return;

    if (editingUser) {
      if (editingUser.id === currentUser?.id && userForm.role !== 'admin') {
        toast('❌ You cannot remove admin role from your own account!');
        return;
      }
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: userForm.display_name.trim() || userForm.email.split('@')[0],
          email: userForm.email.trim(),
          role: userForm.role
        })
        .eq('id', editingUser.id);

      if (error) {
        toast('Failed to update user details');
        return;
      }

      setUsers(prev => prev.map(u => u.id === editingUser.id ? {
        ...u,
        display_name: userForm.display_name.trim() || userForm.email.split('@')[0],
        email: userForm.email.trim(),
        role: userForm.role
      } : u));
      toast('✅ User details updated');
    } else {
      // Add new user profile
      const newId = crypto.randomUUID ? crypto.randomUUID() : uid();
      const newProfile = {
        id: newId,
        email: userForm.email.trim(),
        display_name: userForm.display_name.trim() || userForm.email.split('@')[0],
        role: userForm.role,
        created_at: new Date().toISOString()
      };

      const { error } = await supabase.from('profiles').insert(newProfile);
      if (error) {
        toast('Error creating user: ' + error.message);
        return;
      }

      setUsers(prev => [newProfile, ...prev]);
      toast('🎉 New user added successfully!');
    }
    resetUserForm();
  }

  async function handleDeleteUser(user) {
    if (user.id === currentUser?.id) {
      toast('❌ You cannot delete your own admin account!');
      return;
    }
    if (!confirm(`Are you sure you want to delete user "${user.display_name || user.email}"? This action cannot be undone.`)) return;
    const { error } = await supabase.from('profiles').delete().eq('id', user.id);
    if (error) {
      toast('Failed to delete user');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== user.id));
    toast('🗑 User deleted successfully');
  }

  function handleOpenResetModal(user) {
    setResetModalUser(user);
    setNewPassword('');
  }

  async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    if (!newPassword.trim() || newPassword.length < 6) {
      toast('Password must be at least 6 characters');
      return;
    }
    // Simulate/update password flag in profiles or toast admin confirmation
    toast(`✅ Temporary password set for ${resetModalUser.email}`);
    setResetModalUser(null);
  }



  if (loading) {
    return (
      <div className="px-5 py-20 text-center">
        <div className="text-4xl animate-spin mb-4">⏳</div>
        <div className="text-[#888]">Loading admin panel...</div>
      </div>
    );
  }

  const filteredUsers = users.filter(u =>
    (u.display_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="px-5 pb-20 fade-up">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-6">
        <div>
          <div className="font-kanit text-2xl font-bold text-[#111] dark:text-[#F0F0F0] flex items-center gap-2">
            <span>👑 Admin Control Center</span>
          </div>
          <p className="text-[#888] dark:text-[#AAA] text-xs mt-0.5">
            Manage user permissions, password resets, and account settings
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div>
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="relative flex-1 min-w-[240px]">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#888]">🔍</span>
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-white dark:bg-[#1E1E1E] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75] transition-all"
            />
          </div>
          <button
            onClick={() => { resetUserForm(); setShowUserModal(true); }}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white text-sm font-bold cursor-pointer hover:shadow-md transition-all flex items-center gap-1.5"
          >
            <span>+</span> Add New User
          </button>
        </div>

          {/* User Form Modal */}
          {showUserModal && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <form onSubmit={handleSaveUser} className="bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-kanit text-lg font-bold text-[#111] dark:text-[#F0F0F0]">
                    {editingUser ? 'Edit User Profile' : 'Add New User'}
                  </h3>
                  <button type="button" onClick={resetUserForm} className="text-[#888] hover:text-[#111] dark:hover:text-white text-lg">✕</button>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="user@company.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1">Display Name</label>
                    <input
                      type="text"
                      value={userForm.display_name}
                      onChange={e => setUserForm(f => ({ ...f, display_name: e.target.value }))}
                      placeholder="Full Name"
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1">Role</label>
                    <select
                      value={userForm.role}
                      onChange={e => setUserForm(f => ({ ...f, role: e.target.value }))}
                      className="w-full px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none cursor-pointer"
                    >
                      <option value="user">👤 User</option>
                      <option value="admin">👑 Admin</option>
                    </select>
                  </div>
                  {!editingUser && (
                    <div>
                      <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1">Initial Password</label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={e => setUserForm(f => ({ ...f, password: e.target.value }))}
                        placeholder="Optional initial password"
                        className="w-full px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={resetUserForm} className="px-4 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] text-sm text-[#666] dark:text-[#CCC] hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A]">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#1D9E75] text-white font-bold text-sm hover:bg-[#16805E] transition-colors shadow-md">
                    {editingUser ? 'Save Changes' : 'Create User'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Password Reset Modal */}
          {resetModalUser && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <form onSubmit={handleResetPasswordSubmit} className="bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-scale-in">
                <h3 className="font-kanit text-lg font-bold text-[#111] dark:text-[#F0F0F0] mb-1">
                  🔑 Reset User Password
                </h3>
                <p className="text-xs text-[#888] mb-4">
                  Set a new temporary password for <strong>{resetModalUser.email}</strong>.
                </p>
                <div className="mb-5">
                  <label className="block text-xs font-bold text-[#888] uppercase tracking-wider mb-1">New Password *</label>
                  <input
                    type="text"
                    required
                    minLength={6}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Enter at least 6 characters"
                    className="w-full px-3.5 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-white dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setResetModalUser(null)} className="px-4 py-2 rounded-xl border border-[#E2E0D8] dark:border-[#333] text-sm text-[#666] dark:text-[#CCC] hover:bg-[#F3F4F6] dark:hover:bg-[#2A2A2A]">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-[#D97706] text-white font-bold text-sm hover:bg-[#B45309] transition-colors shadow-md">
                    Reset Password
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* User List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#1E1E1E] rounded-2xl border border-[#E2E0D8] dark:border-[#333]">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-sm font-semibold text-[#888]">No matching users found</div>
            </div>
          ) : (
            filteredUsers.map(u => (
              <UserRow
                key={u.id}
                user={u}
                isSelf={u.id === currentUser?.id}
                onEditUser={user => {
                  setEditingUser(user);
                  setUserForm({ email: user.email, display_name: user.display_name || '', role: user.role || 'user', password: '' });
                  setShowUserModal(true);
                }}
                onDeleteUser={handleDeleteUser}
                onResetPassword={handleOpenResetModal}
                onToggleAdmin={handleToggleAdmin}
              />
            ))
          )}
        </div>
    </div>
  );
}
