import { MONTH_TH } from '../lib/constants';

export default function MonthBar({ viewYear, viewMonth, onPrev, onNext, onToday }) {
  return (
    <div className="flex items-center justify-between px-5 py-3 bg-[#F7F6F2] flex-wrap gap-2">
      <div className="flex items-center gap-2">
        <button onClick={onPrev}
          className="w-[34px] h-[34px] rounded-full border border-[#E2E0D8] bg-white text-[#444] flex items-center justify-center text-lg cursor-pointer hover:bg-[#111] hover:text-white hover:border-[#111] transition-all shadow-sm">
          ‹
        </button>
        <div className="font-kanit font-bold text-xl min-w-[180px] text-center text-[#111]">
          {MONTH_TH[viewMonth]} {viewYear}
        </div>
        <button onClick={onNext}
          className="w-[34px] h-[34px] rounded-full border border-[#E2E0D8] bg-white text-[#444] flex items-center justify-center text-lg cursor-pointer hover:bg-[#111] hover:text-white hover:border-[#111] transition-all shadow-sm">
          ›
        </button>
      </div>
      <button onClick={onToday}
        className="px-4 py-1.5 rounded-full border border-[#1D9E75] bg-[#E1F5EE] text-[#085041] text-xs font-bold font-sarabun cursor-pointer hover:bg-[#1D9E75] hover:text-white transition-all shadow-sm">
        🎯 Today
      </button>
    </div>
  );
}
