import { useState } from 'react';
import { getTH } from '../lib/constants';
import { useLanguage } from '../hooks/useLanguage.jsx';

export default function Nav({ saveStatus, themeMode, onToggleTheme, onLockApp, onSignOut, profile, isAdmin, setActiveTab, onOpenProfile }) {
  const { language, setLanguage, languages, t } = useLanguage();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const now = getTH();
  const dateStr = `${t('dow_' + now.getDay())} ${now.getDate()} ${t('month_short_' + now.getMonth())} ${now.getFullYear()}`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#10B981] flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">📋</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white dark:border-gray-800 animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-lg text-gray-800 dark:text-gray-100 tracking-tight">
              {t('appTitle')}
            </div>
            <div className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
              {isAdmin ? `👑 ${t('admin')}` : t('workspace')}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* User Profile */}
          {profile && (
            <div
              onClick={() => onOpenProfile ? onOpenProfile() : setActiveTab?.('settings')}
              title="Click to edit profile & preferences"
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E67E22] to-[#F39C12] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300 max-w-[100px] truncate">
                {profile.display_name || profile.email?.split('@')[0]}
              </span>
            </div>
          )}

          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              title={t('language')}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all flex items-center gap-1"
            >
              <span className="text-lg">{languages[language]?.flag}</span>
              <span className="text-xs hidden sm:inline">{languages[language]?.code.toUpperCase()}</span>
            </button>
            {showLangMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg overflow-hidden z-50">
                {Object.values(languages).map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                    className={`w-full px-4 py-2.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                      language === lang.code ? 'font-bold text-[#1D9E75] dark:text-[#26D09A]' : 'text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Lock Button */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              title={t('lockApp')}
              className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
            >
              🔒
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Date Display */}
          <div className="hidden md:block text-[11px] text-gray-400 dark:text-gray-500 px-2">
            {dateStr}
          </div>

          {/* Save Status */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
            ${saveStatus === 'saving' || saveStatus === 'saved'
              ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
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

          {/* Sign Out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium hover:bg-red-50 hover:border-red-300 hover:text-red-600 dark:hover:bg-red-900 dark:hover:border-red-700 transition-all"
            >
              {t('signOut')}
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
