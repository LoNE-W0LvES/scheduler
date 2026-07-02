import { MONTH_TH, WEEK_COLORS, WEEK_CTX } from '../lib/constants';

export default function MonthBar({ viewYear, viewMonth, currentWeek = 1, onPrev, onNext, onToday }) {
  const weekInfo = WEEK_CTX[currentWeek] || WEEK_CTX[1];
  const weekColor = WEEK_COLORS[currentWeek] || WEEK_COLORS[1];

  return (
    <div className="px-5 py-4 bg-white dark:bg-[#1F2937] border-b border-[#E5E7EB] dark:border-[#374151]">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onPrev}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all shadow-sm"
          >
            ‹
          </button>

          <div className="text-center min-w-[200px]">
            <div className="font-display text-2xl font-bold text-[#1F2937] dark:text-[#F3F4F6]">
              {MONTH_TH[viewMonth]}
            </div>
            <div className="text-sm text-[#6B7280] dark:text-[#9CA3AF]">
              {viewYear}
            </div>
          </div>

          <button
            onClick={onNext}
            className="w-10 h-10 rounded-xl bg-[#F3F4F6] dark:bg-[#374151] flex items-center justify-center text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563] transition-all shadow-sm"
          >
            ›
          </button>
        </div>

        <button
          onClick={onToday}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#1D9E75] to-[#10B981] text-white text-sm font-semibold hover:shadow-lg hover:scale-105 transition-all shadow-md"
        >
          Target Today
        </button>
      </div>

      {/* Week Info Banner */}
      <div
        className="rounded-xl px-4 py-3 flex items-center gap-3 transition-all duration-300"
        style={{ background: weekColor.bg, borderLeft: `4px solid ${weekColor.c}` }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-md"
          style={{ background: weekColor.gradient || weekColor.c }}
        >
          {currentWeek}
        </div>
        <div className="flex-1">
          <div className="font-semibold text-[#1F2937] dark:text-[#F3F4F6]" style={{ color: weekColor.c }}>
            {weekInfo.icon} {weekInfo.t}
          </div>
          <div className="text-xs text-[#6B7280] dark:text-[#9CA3AF] mt-0.5">
            {weekInfo.sub}
          </div>
        </div>
      </div>
    </div>
  );
}
