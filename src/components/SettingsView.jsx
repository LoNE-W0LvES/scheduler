import { useState, useRef } from 'react';
import { useLanguage } from '../hooks/useLanguage';

export default function SettingsView({
  exportSettings,
  importSettings,
  resetUserData,
  toast,
  profile,
  onOpenProfile,
  themeMode,
  onToggleTheme,
}) {
  const { t, language, languages = {} } = useLanguage();
  const [importMode, setImportMode] = useState('merge');
  const [importing, setImporting] = useState(false);
  const [resetting, setResetting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target.result);
        const success = await importSettings(json, importMode);
        if (success) {
          toast && toast('🎉 Settings successfully imported!');
        } else {
          toast && toast('❌ Failed to import settings.');
        }
      } catch (err) {
        toast && toast('❌ Invalid JSON format.');
      } finally {
        setImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  const currentLang = languages[language] || { name: 'English', flag: '🇺🇸' };

  return (
    <div className="px-5 pb-20 fade-up max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-kanit text-2xl font-bold text-[#1F2937] dark:text-[#F3F4F6]">
          ⚙️ {t('settings')}
        </h1>
        <p className="text-sm text-[#6B7280] dark:text-[#9CA3AF] mt-1">
          {t('settingsSub')}
        </p>
      </div>

      {/* Backup & Restore Card */}
      <div className="bg-gradient-to-r from-[#F0FDF4] to-[#EFF6FF] dark:from-[#1E293B] dark:to-[#111827] border border-[#BBF7D0] dark:border-[#334155] rounded-2xl p-6 shadow-sm space-y-4">
        <div>
          <h2 className="font-kanit text-lg font-bold text-[#111] dark:text-[#F3F4F6] flex items-center gap-2">
            <span>💾 {t('backupRestore')}</span>
          </h2>
          <p className="text-xs text-[#555] dark:text-[#9CA3AF] mt-1 leading-relaxed">
            {t('backupSub')}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap pt-2 border-t border-[#BBF7D0]/50 dark:border-[#334155]">
          {exportSettings && (
            <button
              type="button"
              onClick={() => { exportSettings(); toast && toast('📥 Settings exported to JSON!'); }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#10B981] text-white text-xs font-bold hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 shadow-md"
            >
              <span>📥 {t('exportBackup')}</span>
            </button>
          )}

          {importSettings && (
            <div className="flex items-center gap-2 flex-wrap">
              <select
                value={importMode}
                onChange={e => setImportMode(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-[#CBD5E1] dark:border-[#4B5563] bg-white dark:bg-[#1F2937] text-xs font-semibold text-[#334155] dark:text-[#D1D5DB] outline-none cursor-pointer shadow-sm focus:border-[#1A5FA8]"
                title="Import mode"
              >
                <option value="merge">Merge with existing data</option>
                <option value="replace">Replace existing data</option>
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
                className="px-5 py-2.5 rounded-xl bg-[#1A5FA8] hover:bg-[#0F4A8A] text-white text-xs font-bold hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <span>{importing ? `⏳ ${t('loading')}...` : `📤 ${t('restoreBackup')}`}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Account & Profile Quick Settings */}
      <div className="bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="font-kanit text-lg font-bold text-[#111] dark:text-[#F3F4F6]">
          👤 {t('accountPrefs')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">{t('displayName')}</div>
              <div className="font-semibold text-sm text-[#1F2937] dark:text-[#F3F4F6] mt-0.5 truncate">
                {profile?.display_name || profile?.email || 'User Account'}
              </div>
            </div>
            {onOpenProfile && (
              <button
                onClick={onOpenProfile}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#333] border border-[#D1D5DB] dark:border-[#444] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#3A3A3A] transition-all cursor-pointer shadow-sm"
              >
                {t('edit')}
              </button>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#F9FAFB] dark:bg-[#262626] border border-[#E5E7EB] dark:border-[#374151] flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-[#6B7280] dark:text-[#9CA3AF]">{t('themePreference')}</div>
              <div className="font-semibold text-sm text-[#1F2937] dark:text-[#F3F4F6] mt-0.5 capitalize">
                {themeMode === 'dark' ? `🌙 ${t('darkMode')}` : `☀️ ${t('lightMode')}`}
              </div>
            </div>
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="px-3 py-1.5 rounded-lg bg-white dark:bg-[#333] border border-[#D1D5DB] dark:border-[#444] text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#3A3A3A] transition-all cursor-pointer shadow-sm"
              >
                {t('update')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Danger Zone / Reset Data */}
      {resetUserData && (
        <div className="bg-gradient-to-r from-[#FEF2F2] to-[#FFF1F2] dark:from-[#2C1517] dark:to-[#1E1112] border border-[#FECACA] dark:border-[#5C2B2E] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h2 className="font-kanit text-lg font-bold text-[#991B1B] dark:text-[#F87171] flex items-center gap-2">
                <span>⚠️ {t('resetUserDataTitle')}</span>
              </h2>
              <p className="text-xs text-[#7F1D1D] dark:text-[#FCA5A5] mt-1 leading-relaxed max-w-xl">
                {t('resetUserDataSub')}
              </p>
            </div>

            <button
              type="button"
              disabled={resetting}
              onClick={async () => {
                if (!confirm('⚠️ Are you sure you want to empty all your account data? This will clear all routines, notes, and progress logs. This action cannot be undone.')) return;
                setResetting(true);
                try {
                  const success = await resetUserData();
                  if (success) {
                    toast && toast('✨ Account reset to clean state!');
                  } else {
                    toast && toast('❌ Failed to reset data.');
                  }
                } catch (e) {
                  toast && toast('❌ Error resetting data.');
                } finally {
                  setResetting(false);
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#DC2626] to-[#B91C1C] hover:from-[#B91C1C] hover:to-[#991B1B] text-white text-xs font-bold hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer flex items-center gap-2 shadow-md disabled:opacity-50"
            >
              <span>{resetting ? `⏳ ${t('loading')}...` : `🗑️ ${t('resetDataBtn')}`}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
