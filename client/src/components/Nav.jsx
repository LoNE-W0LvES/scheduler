import { getTH, MONTH_EN, DOW_TH } from '../lib/constants';

export default function Nav({ saveStatus, themeMode, onToggleTheme, onLockApp, onSignOut, profile, isAdmin }) {
  const now = getTH();
  const dateStr = `${DOW_TH[now.getDay()]} ${now.getDate()} ${MONTH_EN[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <nav className="sticky top-0 z-50 glass border-b border-[#E5E7EB] dark:border-[#374151]">
      <div className="flex items-center justify-between px-5 py-3">
        {/* Logo Section */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#1D9E75] to-[#10B981] flex items-center justify-center shadow-lg">
              <span className="text-white text-lg">📋</span>
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#10B981] border-2 border-white dark:border-[#1F2937] animate-pulse" />
          </div>
          <div>
            <div className="font-display font-bold text-lg text-[#1F2937] dark:text-[#F3F4F6] tracking-tight">
              HR Task Planner
            </div>
            <div className="text-[11px] text-[#6B7280] dark:text-[#9CA3AF] font-medium">
              {isAdmin ? '👑 Admin' : 'Workspace'}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* User Profile */}
          {profile && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#F3F4F6] dark:bg-[#374151]">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#E67E22] to-[#F39C12] flex items-center justify-center text-white text-sm font-bold shadow-sm">
                {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
              </div>
              <span className="text-sm font-medium text-[#374151] dark:text-[#D1D5DB] max-w-[100px] truncate">
                {profile.display_name || profile.email?.split('@')[0]}
              </span>
            </div>
          )}

          {/* Lock Button */}
          {onLockApp && (
            <button
              onClick={onLockApp}
              title="Lock App"
              className="p-2 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all"
            >
              🔒
            </button>
          )}

          {/* Theme Toggle */}
          <button
            onClick={onToggleTheme}
            className="p-2 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] text-[#6B7280] dark:text-[#9CA3AF] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all"
          >
            {themeMode === 'dark' ? '☀️' : '🌙'}
          </button>

          {/* Date Display */}
          <div className="hidden md:block text-[11px] text-[#9CA3AF] dark:text-[#6B7280] px-2">
            {dateStr}
          </div>

          {/* Save Status */}
          <div className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300
            ${saveStatus === 'saving' || saveStatus === 'saved'
              ? 'bg-[#D1FAE5] dark:bg-[#052E16] text-[#065F46] dark:text-[#6EE7B7]'
              : 'bg-[#F3F4F6] dark:bg-[#374151] text-[#9CA3AF]'
            }
          `}>
            {saveStatus === 'saving' ? (
              <>
                <span className="animate-spin">⏳</span>
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <span>✓</span>
                <span>Saved</span>
              </>
            ) : null}
          </div>

          {/* Sign Out */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-4 py-2 rounded-xl bg-white dark:bg-[#374151] border border-[#E5E7EB] dark:border-[#4B5563] text-[#374151] dark:text-[#D1D5DB] text-sm font-medium hover:bg-[#FEE2E2] hover:border-[#EF4444] hover:text-[#EF4444] dark:hover:bg-[#450A0A] dark:hover:border-[#EF4444] transition-all"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
