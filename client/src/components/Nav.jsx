import { getTH, MONTH_EN, DOW_TH } from '../lib/constants';

export default function Nav({ saveStatus, themeMode, onToggleTheme, onLockApp }) {
  const now = getTH();
  const dateStr = `${DOW_TH[now.getDay()]} ${now.getDate()} ${MONTH_EN[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <nav className="sticky top-0 z-50 bg-[#111] h-[54px] flex items-center justify-between px-5 shadow-xl">
      <div className="flex items-center gap-2.5 font-kanit font-bold text-[16px] text-white tracking-wide">
        <div className="w-2 h-2 rounded-full bg-gradient-to-br from-yellow-300 via-pink-300 to-purple-400" />
        HR Task Planner
      </div>
      <div className="flex items-center gap-2.5">
        {onLockApp && (
          <button
            onClick={onLockApp}
            title="Lock App with Tic-Tac-Toe Security Gate"
            className="px-2.5 py-1 rounded-full bg-[#262626] border border-[#444] text-[#AAA] hover:text-white text-[12px] font-sarabun font-semibold hover:bg-[#333] transition-all cursor-pointer flex items-center gap-1 shadow-sm"
          >
            🔒 <span className="hidden md:inline">Lock</span>
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
      </div>
    </nav>
  );
}
