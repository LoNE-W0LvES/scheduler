import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';
import { supabase } from '../lib/supabase';

export default function ProfileModal({ profile, updateProfile, onClose, toast, themeMode, onToggleTheme }) {
  const { language, setLanguage, languages = {}, t } = useLanguage();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const ALL_WEEK_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const initialOffDays = profile?.off_days !== undefined && profile?.off_days !== null
    ? (profile.off_days === '' ? [] : profile.off_days.split(',').map(s => s.trim()))
    : ['Sunday'];
  const [selectedOffDays, setSelectedOffDays] = useState(initialOffDays);
  const [offDaysSaving, setOffDaysSaving] = useState(false);

  const toggleOffDay = (day) => {
    if (selectedOffDays.includes(day)) {
      setSelectedOffDays(selectedOffDays.filter(d => d !== day));
    } else {
      setSelectedOffDays([...selectedOffDays, day]);
    }
  };

  const handleSaveOffDays = async () => {
    setOffDaysSaving(true);
    try {
      await updateProfile({ off_days: selectedOffDays.join(',') });
      toast('✅ Weekly off days updated successfully!');
    } catch (err) {
      console.error(err);
      toast('❌ Failed to update off days');
    } finally {
      setOffDaysSaving(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSaving(true);
    try {
      await updateProfile({ display_name: displayName.trim() });
      toast('✅ Profile updated successfully!');
    } catch (err) {
      console.error(err);
      toast('❌ Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast('⚠️ Password must be at least 6 characters');
      return;
    }
    setPasswordSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast('🔐 Password changed successfully!');
      setNewPassword('');
    } catch (err) {
      console.error(err);
      toast(err.message || '❌ Failed to change password');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-[#1D9E75] to-[#16805E] p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            ✕
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 border-2 border-white/40 flex items-center justify-center text-2xl font-bold shadow-inner">
              {(profile?.display_name || profile?.email || 'U')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-kanit text-xl font-bold leading-tight truncate max-w-[220px]">
                {profile?.display_name || 'User Profile'}
              </h2>
              <p className="text-xs opacity-80 mt-0.5 truncate max-w-[220px]">{profile?.email}</p>
              <div className="mt-2 inline-block">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/20 text-white uppercase tracking-wider">
                  {profile?.role === 'admin' ? '👑 Administrator' : '👤 Standard User'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Edit Display Name */}
          <form onSubmit={(e) => { e.preventDefault(); handleSaveProfile(e); }} className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] dark:text-[#AAA]">
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter your name"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSaveProfile(e); }}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#1D9E75] hover:bg-[#16805E] text-white text-sm font-semibold cursor-pointer transition-all disabled:opacity-50"
              >
                {saving ? '...' : 'Save'}
              </button>
            </div>
          </form>

          {/* Weekly Off Days Multi-Select */}
          <div className="space-y-3 pt-3 border-t border-[#E2E0D8] dark:border-[#333]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#888] dark:text-[#AAA]">
                Weekly Off Days (Multi-Select)
              </label>
              <button
                type="button"
                onClick={handleSaveOffDays}
                disabled={offDaysSaving}
                className="px-3 py-1 rounded-lg bg-[#1D9E75] hover:bg-[#16805E] text-white text-xs font-semibold cursor-pointer transition-all disabled:opacity-50"
              >
                {offDaysSaving ? '...' : 'Save Off Days'}
              </button>
            </div>
            <p className="text-[11px] text-[#666] dark:text-[#AAA]">
              Select which day(s) of the week are treated as weekend / off days. Click to toggle.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ALL_WEEK_DAYS.map((day) => {
                const isSelected = selectedOffDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleOffDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[#1D9E75] border-[#1D9E75] text-white shadow-sm'
                        : 'bg-[#F9FAFB] dark:bg-[#262626] border-[#E2E0D8] dark:border-[#444] text-[#555] dark:text-[#CCC] hover:border-[#888]'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '}{day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Preferences */}
          <div className="space-y-3 pt-3 border-t border-[#E2E0D8] dark:border-[#333]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] dark:text-[#AAA]">
              Preferences
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Theme Selector */}
              <button
                type="button"
                onClick={onToggleTheme}
                className="flex items-center justify-between p-3 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-left hover:border-[#1D9E75] transition-all cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-[#111] dark:text-[#F0F0F0]">Appearance</div>
                  <div className="text-[11px] text-[#888] capitalize">{themeMode || 'light'} Mode</div>
                </div>
                <span className="text-lg">{themeMode === 'dark' ? '🌙' : '☀️'}</span>
              </button>

              {/* Language Switcher */}
              <div className="flex flex-col justify-between p-3 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626]">
                <div className="text-xs font-bold text-[#111] dark:text-[#F0F0F0] mb-1">Language</div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-white dark:bg-[#333] border border-[#E2E0D8] dark:border-[#555] rounded-lg px-2.5 py-1 text-xs font-semibold text-[#111] dark:text-[#F0F0F0] outline-none cursor-pointer focus:border-[#1D9E75]"
                >
                  {Object.values(languages).map((lang) => (
                    <option key={lang.code} value={lang.code} className="bg-white dark:bg-[#222] text-[#111] dark:text-white">
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Change Password */}
          <form onSubmit={(e) => { e.preventDefault(); handleUpdatePassword(e); }} className="space-y-3 pt-3 border-t border-[#E2E0D8] dark:border-[#333]">
            <label className="block text-xs font-bold uppercase tracking-wider text-[#888] dark:text-[#AAA]">
              Change Password
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-sm text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
              />
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleUpdatePassword(e); }}
                disabled={passwordSaving}
                className="px-4 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#444] hover:bg-[#F0EFEB] dark:hover:bg-[#333] text-[#444] dark:text-[#DDD] text-sm font-semibold cursor-pointer transition-all disabled:opacity-50"
              >
                {passwordSaving ? '...' : 'Update'}
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-[#F9FAFB] dark:bg-[#181818] border-t border-[#E2E0D8] dark:border-[#333] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#E2E0D8] dark:bg-[#333] text-[#111] dark:text-[#F0F0F0] text-sm font-bold hover:bg-[#D1CFC7] dark:hover:bg-[#444] transition-all cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
