import { useState } from 'react';
import { WEEK_COLORS, WEEK_CTX } from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function MonthBar({ viewYear, viewMonth, currentWeek = 1, onPrev, onNext, onToday, saveStatus, profile, updateProfile, toast }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Parse user's custom week settings
  let userWeekSettings = {};
  try {
    if (profile?.week_settings) {
      userWeekSettings = typeof profile.week_settings === 'string'
        ? JSON.parse(profile.week_settings)
        : profile.week_settings;
    }
  } catch (e) {
    console.error('Failed to parse week_settings', e);
  }

  const defaultInfo = WEEK_CTX[currentWeek] || WEEK_CTX[1];
  const translatedTitle = t('week' + currentWeek + 'Title') || defaultInfo.t;
  const translatedSub = t('week' + currentWeek + 'Sub') || defaultInfo.sub;

  const currentCustom = userWeekSettings[currentWeek] || {};
  const activeTitle = currentCustom.t !== undefined ? currentCustom.t : '';
  const activeSub = currentCustom.sub !== undefined ? currentCustom.sub : '';

  const weekColor = WEEK_COLORS[currentWeek] || WEEK_COLORS[1];

  const [editTitle, setEditTitle] = useState(activeTitle);
  const [editSub, setEditSub] = useState(activeSub);

  const handleStartEdit = () => {
    setEditTitle(activeTitle);
    setEditSub(activeSub);
    setEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e?.preventDefault();
    if (!updateProfile) {
      setEditing(false);
      return;
    }
    setSaving(true);
    try {
      const nextSettings = {
        ...userWeekSettings,
        [currentWeek]: {
          t: editTitle.trim(),
          sub: editSub.trim(),
        }
      };
      await updateProfile({ week_settings: JSON.stringify(nextSettings) });
      toast && toast('✅ Week description updated!');
      setEditing(false);
    } catch (err) {
      console.error(err);
      toast && toast('❌ Failed to update week description');
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefault = async () => {
    if (!updateProfile) return;
    setSaving(true);
    try {
      const nextSettings = { ...userWeekSettings };
      delete nextSettings[currentWeek];
      await updateProfile({ week_settings: JSON.stringify(nextSettings) });
      toast && toast('🔄 Cleared week description');
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-5 py-4 bg-white dark:bg-[#1F2937] border-b border-[#E5E7EB] dark:border-[#374151]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all shadow-sm cursor-pointer"
          >
            ‹
          </button>

          <div className="text-center min-w-[180px]">
            <div className="font-display text-2xl font-bold text-[#1F2937] dark:text-[#F3F4F6]">
              {t('month_' + viewMonth)}
            </div>
            <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              {viewYear}
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all shadow-sm cursor-pointer"
          >
            ›
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* Save Status Badge */}
          {saveStatus && (
            <div className={`
              hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
              ${saveStatus === 'saving' || saveStatus === 'saved'
                ? 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
              }
            `}>
              {saveStatus === 'saving' ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>{t('saving')}</span>
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <span>✓</span>
                  <span>{t('saved')}</span>
                </>
              ) : null}
            </div>
          )}

          <button
            onClick={onToday}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#10B981] text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-md cursor-pointer"
          >
            {t('targetToday')}
          </button>
        </div>
      </div>

      {/* Week Info Banner */}
      {!editing ? (
        <div
          className="rounded-xl px-4 py-3 flex items-center justify-between gap-3 transition-all duration-300 shadow-sm"
          style={{ background: weekColor.bg, borderLeft: `4px solid ${weekColor.c}` }}
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md shrink-0"
              style={{ background: weekColor.gradient || weekColor.c }}
            >
              {currentWeek}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-[#1F2937] dark:text-[#F3F4F6] truncate" style={{ color: weekColor.c }}>
                {activeTitle || `${t('week')} ${currentWeek}`}
              </div>
              {activeSub && (
                <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5 truncate">
                  {activeSub}
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleStartEdit}
            title="Edit Week Title & Description"
            className="w-8 h-8 rounded-lg bg-black/5 dark:bg-white/10 hover:bg-black/15 dark:hover:bg-white/20 flex items-center justify-center text-[#4B5563] dark:text-[#D1D5DB] transition-all shrink-0 cursor-pointer text-sm"
          >
            ✏️
          </button>
        </div>
      ) : (
        <div
          className="rounded-xl p-4 transition-all duration-300 shadow-md border border-[#1D9E75]/30 bg-white dark:bg-[#1E1E1E]"
          style={{ borderLeft: `4px solid ${weekColor.c}` }}
        >
          <form onSubmit={(e) => { e.preventDefault(); handleSaveEdit(e); }} className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: weekColor.c }}>
                Editing Week {currentWeek} Description
              </span>
              <button
                type="button"
                onClick={handleResetDefault}
                disabled={saving}
                className="text-[11px] text-[#E67E22] hover:underline cursor-pointer font-semibold"
              >
                Clear
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder="Week Title"
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-sm font-semibold text-[#111] dark:text-[#F0F0F0] outline-none focus:border-[#1D9E75]"
              />
              <input
                type="text"
                value={editSub}
                onChange={(e) => setEditSub(e.target.value)}
                placeholder="Subtitle / Goals"
                className="w-full px-3 py-1.5 rounded-lg border border-[#E2E0D8] dark:border-[#444] bg-[#F9FAFB] dark:bg-[#262626] text-xs text-[#555] dark:text-[#CCC] outline-none focus:border-[#1D9E75]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditing(false)}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); handleSaveEdit(e); }}
                disabled={saving}
                className="px-4 py-1.5 rounded-lg bg-[#1D9E75] hover:bg-[#16805E] text-xs font-semibold text-white cursor-pointer transition-all shadow-sm"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
