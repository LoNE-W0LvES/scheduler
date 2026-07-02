import { getTH, MONTH_EN, DOW_TH } from '../lib/constants';

export default function Nav({ saveStatus, themeMode, onToggleTheme, onLockApp, onSignOut, profile, isAdmin }) {
  const now = getTH();
  const dateStr = `${DOW_TH[now.getDay()]} ${now.getDate()} ${MONTH_EN[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <nav className="sticky top-0 z-50 bg-[#111] h-[54px] flex items-center justify-between px-5 shadow-xl">
      <div className="flex items-center gap-2.5 font-kanit font-bold text-[16px] text-white tracking-wide">
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400" />
        HR Task Planner
        {isAdmin && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E24B4A] text-white font-semibold">ADMIN</span>
        )}
      </div>
      <div className="flex items-center gap-2.5">
        {/* User info */}
        {profile && (
          <div className="hidden md:flex items-center gap-2 text-[#AAA] text-xs font-sarabun">
            <span className="w-6 h-6 rounded-full bg-[#333] flex items-center justify-center text-white text-sm">
              {(profile.display_name || profile.email || 'U')[0].toUpperCase()}
            </span>
            <span className="max-w-[120px] truncate">{profile.display_name || profile.email}</span>
          </div>
        )}

        {onLockApp && (
          <button
            onClick={onLockApp}
            title="Lock App with Tic-Tac-Toe Security Gate"
            className="px-2.5 py-1 rounded-full bg-[#262626] border border-[#444] text-[#AAA] hover:text-white text-[12px] font-sarabun font-semibold hover:bg-[#333] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            🔒 <span className="hidden lg:inline">Lock</span>
          </button>
        )}
        <button
          onClick={onToggleTheme}
          className="px-3 py-1 rounded-full bg-[#262626] border border-[#444] text-white text-[12px] font-sarabun font-semibold hover:bg-[#333] transition-all cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          {themeMode === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
        <span className="text-[#AAA] text-xs font-sarabun hidden sm:inline">{dateStr}</span>
        <span
          className={`text-[11px] px-2.5 py-1 rounded-full bg-[#1D9E75] text-white font-semibold
            transition-opacity duration-400 ${saveStatus === 'saving' || saveStatus === 'saved' ? 'opacity-100' : 'opacity-0'}`}
        >
          {saveStatus === 'saving' ? '💾 Saving…' : '✓ Saved'}
        </span>
        {onSignOut && (
          <button
            onClick={onSignOut}
            className="px-3 py-1 rounded-full border border-[#E24B4A] text-[#E24B4A] text-[12px] font-sarabun font-semibold hover:bg-[#E24B4A] hover:text-white transition-all cursor-pointer"
          >
            Sign Out
          </button>
        )}
      </div>
    </nav>
  );
}
