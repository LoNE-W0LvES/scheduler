import { useState } from 'react';
import { useLanguage } from '../hooks/useLanguage';

const TABS = [
  { id: 'weekly', labelKey: 'weekly', icon: '📅' },
  { id: 'calendar', labelKey: 'calendar', icon: '🗓' },
  { id: 'tracker', labelKey: 'tracker', icon: '📊' },
  { id: 'notes', labelKey: 'notes', icon: '📝' },
  { id: 'manage', labelKey: 'routines', icon: '📋' },
  { id: 'archive', labelKey: 'archive', icon: '🗂' },
  { id: 'settings', labelKey: 'settings', icon: '⚙️' },
  { id: 'admin', labelKey: 'admin', icon: '👑', adminOnly: true }
];

export default function SidePanel({
  activeTab,
  setActiveTab,
  isAdmin,
  profile,
  themeMode,
  onToggleTheme,
  onLockApp,
  onSignOut,
  onOpenProfile
}) {
  const { language, setLanguage, languages = {}, t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(true);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);
  const currentLang = languages[language] || { code: 'en', name: 'English', flag: '🇺🇸' };

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 z-40 bg-white dark:bg-[#181818] border-r border-[#E2E0D8] dark:border-[#333] transition-all duration-300 ease-in-out select-none flex-shrink-0 ${
        isExpanded ? 'w-64' : 'w-20'
      }`}
    >
      {/* Top Brand & Toggle Button */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Click to collapse sidebar' : 'Click to expand sidebar'}
        className={`p-4 border-b border-[#E2E0D8] dark:border-[#333] flex items-center gap-3 min-h-[68px] cursor-pointer hover:bg-[#F9FAFB] dark:hover:bg-[#222] transition-colors select-none group ${
          !isExpanded ? 'justify-center' : ''
        }`}
      >
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1D9E75] to-[#16805E] flex items-center justify-center text-xl text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
          📋
        </div>
        {isExpanded && (
          <div className="min-w-0 animate-fade-in flex-1">
            <div className="min-w-0">
              <div className="font-kanit font-bold text-base leading-tight text-[#111] dark:text-[#F0F0F0] truncate group-hover:text-[#1D9E75] transition-colors">
                {t('appTitle') || 'Schaduler'}
              </div>
              <div className="text-[10px] uppercase font-semibold text-[#1D9E75] dark:text-[#26D09A]">
                Enterprise
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Profile Card */}
      <div className="p-3 border-b border-[#E2E0D8] dark:border-[#333]">
        <div
          onClick={() => onOpenProfile ? onOpenProfile() : setActiveTab('settings')}
          title="Click to edit profile & preferences"
          className={`flex items-center gap-3 p-2 rounded-xl bg-[#F9FAFB] dark:bg-[#222] border border-[#E2E0D8] dark:border-[#333] hover:border-[#1D9E75] dark:hover:border-[#1D9E75] cursor-pointer transition-all ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#3B82F6] to-[#1D9E75] flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-sm">
            {(profile?.display_name || profile?.email || 'U')[0].toUpperCase()}
          </div>
          {isExpanded && (
            <div className="min-w-0 flex-1 animate-fade-in">
              <div className="text-xs font-bold text-[#111] dark:text-[#F0F0F0] truncate">
                {profile?.display_name || profile?.email || 'User'}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                  isAdmin
                    ? 'bg-[#FDE8EF] dark:bg-[#3D1D12] text-[#E24B4A] dark:text-[#F58876]'
                    : 'bg-[#E1F5EE] dark:bg-[#163A2D] text-[#085041] dark:text-[#85E5C4]'
                }`}>
                  {isAdmin ? '👑 Admin' : '👤 User'}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-none">
        {isExpanded && (
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#888] dark:text-[#777] px-3 py-1 animate-fade-in">
            {t('navigation')}
          </div>
        )}
        {visibleTabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={!isExpanded ? t(tab.labelKey) : ''}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer group relative ${
                isActive
                  ? 'bg-gradient-to-r from-[#1D9E75] to-[#16805E] text-white shadow-md'
                  : 'text-[#555] dark:text-[#BBB] hover:bg-[#F3F4F6] dark:hover:bg-[#262626] hover:text-[#111] dark:hover:text-white'
              }`}
            >
              <span className="text-lg flex-shrink-0">{tab.icon}</span>
              {isExpanded && (
                <span className="truncate animate-fade-in">{t(tab.labelKey)}</span>
              )}
              {/* Active Indicator bar when shrunk */}
              {!isExpanded && isActive && (
                <span className="absolute right-1 top-1/2 -translate-y-1/2 w-1.5 h-6 rounded-full bg-[#1D9E75]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Controls */}
      <div className="p-3 border-t border-[#E2E0D8] dark:border-[#333] space-y-2">
        {/* Language selector menu */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            title="Change Language"
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-[#F9FAFB] dark:bg-[#222] text-xs font-semibold text-[#444] dark:text-[#CCC] hover:border-[#1D9E75] transition-all cursor-pointer ${
              !isExpanded ? 'justify-center' : ''
            }`}
          >
            <span className="text-base flex-shrink-0">{currentLang.flag}</span>
            {isExpanded && (
              <div className="flex items-center justify-between flex-1 min-w-0 animate-fade-in">
                <span className="truncate">{currentLang.name}</span>
                <span className="text-[#888] text-[10px]">▼</span>
              </div>
            )}
          </button>

          {showLangMenu && (
            <div className="absolute bottom-12 left-0 w-56 bg-white dark:bg-[#1E1E1E] border border-[#E2E0D8] dark:border-[#333] rounded-2xl shadow-2xl p-2 z-50 max-h-64 overflow-y-auto">
              <div className="text-[10px] font-bold text-[#888] px-2 py-1 uppercase">Select Language</div>
              {Object.values(languages).map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium cursor-pointer transition-colors text-left ${
                    language === lang.code
                      ? 'bg-[#1D9E75] text-white font-bold'
                      : 'text-[#111] dark:text-[#DDD] hover:bg-[#F3F4F6] dark:hover:bg-[#262626]'
                  }`}
                >
                  <span>{lang.flag}</span>
                  <span className="truncate">{lang.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          title={themeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-[#F9FAFB] dark:bg-[#222] text-xs font-semibold text-[#444] dark:text-[#CCC] hover:border-[#888] transition-all cursor-pointer ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          <span className="text-base flex-shrink-0">{themeMode === 'dark' ? '☀️' : '🌙'}</span>
          {isExpanded && (
            <span className="truncate animate-fade-in">{themeMode === 'dark' ? t('lightMode') : t('darkMode')}</span>
          )}
        </button>

        {/* Lock App Button */}
        <button
          onClick={onLockApp}
          title={t('lockApp')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E2E0D8] dark:border-[#333] bg-[#F9FAFB] dark:bg-[#222] text-xs font-semibold text-[#666] dark:text-[#BBB] hover:border-[#1D9E75] hover:text-[#1D9E75] transition-all cursor-pointer ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          <span className="text-base flex-shrink-0">🔒</span>
          {isExpanded && <span className="truncate animate-fade-in">{t('lockApp')}</span>}
        </button>

        {/* Sign Out Button */}
        <button
          onClick={onSignOut}
          title={t('signOut')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-[#E24B4A]/30 bg-[#FEF2F2] dark:bg-[#3B1818] text-xs font-bold text-[#E24B4A] hover:bg-[#E24B4A] hover:text-white transition-all cursor-pointer ${
            !isExpanded ? 'justify-center' : ''
          }`}
        >
          <span className="text-base flex-shrink-0">🚪</span>
          {isExpanded && <span className="truncate animate-fade-in">{t('signOut')}</span>}
        </button>
      </div>
    </aside>
  );
}
