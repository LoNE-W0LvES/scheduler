import { useState } from 'react';
import { MONTH_TH, MONTH_SHORT_TH, MONTH_EN } from '../lib/constants';

function barColor(pct) {
  return pct >= 80 ? '#1D9E75' : pct >= 50 ? '#EF9F27' : '#E24B4A';
}

export default function ArchiveView({ state, monthData, getAllStats, archiveMonth, deleteArchive, toast }) {
  const { viewYear, viewMonth, monthlyArchive } = state;
  const [arcYear, setArcYear] = useState(new Date().getFullYear());
  const [selected, setSelected] = useState(null);

  const allSt = getAllStats();
  const curPct = allSt.total ? Math.round(allSt.done / allSt.total * 100) : 0;

  function handleArchive() {
    if (!confirm(`Archive ${MONTH_TH[viewMonth]} ${viewYear}?\n\nThis will save a snapshot and reset the month for a fresh start.`)) return;
    archiveMonth();
    toast('✅ Month archived!');
  }

  function handleDelete(arc) {
    if (!confirm(`Delete archive for ${arc.label}? This cannot be undone.`)) return;
    deleteArchive(arc.year, arc.month);
    if (selected && selected.year === arc.year && selected.month === arc.month) setSelected(null);
    toast('🗑 Archive deleted');
  }

  const months = Array.from({ length: 12 }, (_, m) => m);
  const arcMap = {};
  monthlyArchive.forEach(a => { if (a.year === arcYear) arcMap[a.month] = a; });

  return (
    <div className="px-5 pb-20 fade-up">
      {/* Close month banner */}
      <div className="flex items-center justify-between rounded-[14px] p-4 mb-5 flex-wrap gap-3"
        style={{ background: 'linear-gradient(135deg,#1D9E75,#2D5A27)' }}>
        <div>
          <div className="font-kanit text-base font-bold text-white">Close & Archive Month</div>
          <div className="text-[12px] text-white/80 mt-0.5">
            {MONTH_TH[viewMonth]} {viewYear} — {allSt.done}/{allSt.total} done ({curPct}%)
          </div>
        </div>
        <button onClick={handleArchive}
          className="px-5 py-2.5 rounded-full border-2 border-white/60 bg-white/15 text-white text-[13px] font-bold font-sarabun cursor-pointer hover:bg-white/30 hover:border-white transition-all backdrop-blur-sm">
          📦 Archive This Month
        </button>
      </div>

      {/* Year nav */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => setArcYear(y => y - 1)}
          className="bg-white border border-[#E2E0D8] rounded-lg px-3.5 py-1.5 text-lg text-[#444] cursor-pointer hover:bg-[#EEE] transition-colors">‹</button>
        <div className="font-kanit text-2xl font-bold text-[#111]">{arcYear}</div>
        <button onClick={() => setArcYear(y => y + 1)}
          className="bg-white border border-[#E2E0D8] rounded-lg px-3.5 py-1.5 text-lg text-[#444] cursor-pointer hover:bg-[#EEE] transition-colors">›</button>
      </div>

      {/* Month grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mb-6">
        {months.map(m => {
          const arc = arcMap[m];
          const isCurrent = m === viewMonth && arcYear === viewYear;
          const isSel     = selected && selected.year === arcYear && selected.month === m;
          const bc = arc ? barColor(arc.pct) : '#378ADD';

          if (!arc && !isCurrent) {
            return (
              <div key={m} className="bg-white rounded-xl p-3 border border-[#E2E0D8] opacity-40">
                <div className="font-kanit text-sm font-bold text-[#AAA]">{MONTH_SHORT_TH[m]}</div>
                <div className="text-[#CCC] text-lg font-bold mt-1">—</div>
                <div className="text-[10px] text-[#CCC] mt-0.5">ยังไม่มีข้อมูล</div>
              </div>
            );
          }

          const pct  = arc ? arc.pct  : curPct;
          const done = arc ? arc.done  : allSt.done;
          const tot  = arc ? arc.total : allSt.total;

          return (
            <div key={m}
              onClick={() => setSelected(isSel ? null : (arc || { year: arcYear, month: m, isCurrent: true }))}
              className={`bg-white rounded-xl p-3 border cursor-pointer transition-all hover:shadow-md
                ${isSel ? 'border-[2px] shadow-md' : 'border-[#E2E0D8]'}`}
              style={{ borderColor: isSel ? bc : undefined }}>
              <div className="font-kanit text-sm font-bold text-[#111]">{MONTH_SHORT_TH[m]}</div>
              <div className="font-kanit text-xl font-bold mt-1" style={{ color: bc }}>{pct}%</div>
              <div className="text-[10px] text-[#888] mt-0.5">{done}/{tot} tasks</div>
              <div className="h-1 bg-[#EEE] rounded-full mt-2 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: bc }} />
              </div>
              <div className="mt-1.5">
                {arc
                  ? <span className="text-[9px] font-bold px-1.5 py-[1px] rounded" style={{ background:'#E1F5EE', color:'#085041' }}>✓ Archived</span>
                  : <span className="text-[9px] font-bold px-1.5 py-[1px] rounded" style={{ background:'#E3EFF9', color:'#0C447C' }}>● กำลังทำ</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail panel */}
      {selected && !selected.isCurrent && (
        <div className="bg-white rounded-[14px] p-5 border border-[#E2E0D8] shadow-sm fade-up">
          <div className="font-kanit text-lg font-bold mb-1" style={{ color: barColor(selected.pct) }}>
            {selected.label}
          </div>
          <div className="text-[12px] text-[#888] mb-4">
            Closed: {new Date(selected.closedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
          </div>
          <div className="grid grid-cols-4 gap-3 mb-4">
            {[
              { n: selected.total, l: 'Total',   c: '#111' },
              { n: selected.done,  l: 'Done ✅', c: '#1D9E75' },
              { n: selected.total - selected.done - (selected.skipped||0), l: 'Remaining', c: '#EF9F27' },
              { n: `${selected.pct}%`, l: 'Complete', c: barColor(selected.pct) },
            ].map(({ n, l, c }) => (
              <div key={l} className="text-center">
                <div className="font-kanit text-2xl font-bold" style={{ color: c }}>{n}</div>
                <div className="text-[11px] text-[#888]">{l}</div>
              </div>
            ))}
          </div>

          {/* Week breakdown */}
          {[1,2,3,4,5].map(w => {
            const tasks = selected.taskLog?.filter(t => t.week === w) || [];
            if (!tasks.length) return null;
            const wDone = tasks.filter(t => t.status === 'done').length;
            const WBGS  = ['#FDF3E3','#FDE8EF','#E8F5DC','#EDEAFC','#FFF0F0'];
            const WHDRS = ['#B8660E','#C0365A','#3A7D0A','#5B4EC8','#E24B4A'];
            return (
              <div key={w} className="mb-3">
                <div className="text-[12px] font-bold px-3 py-1.5 rounded-lg mb-1.5"
                  style={{ background: WBGS[w-1], color: WHDRS[w-1] }}>
                  Week {w} — {wDone}/{tasks.length} done
                </div>
                {tasks.map((t, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[#F0EFEB] last:border-none">
                    <div className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: t.status==='done' ? '#1D9E75' : t.status==='skip' ? '#888' : '#DDD' }} />
                    <span className={`flex-1 text-[12px] ${t.status==='done' ? 'line-through text-[#AAA]' : 'text-[#111]'}`}>{t.text}</span>
                    <span className="text-[10px] text-[#AAA]">{t.time || ''}</span>
                    <span>{t.status==='done' ? '✅' : t.status==='skip' ? '⏭' : '☐'}</span>
                  </div>
                ))}
              </div>
            );
          })}

          <button onClick={() => handleDelete(selected)}
            className="mt-3 px-3.5 py-1.5 rounded-full border border-[#E24B4A] text-[#E24B4A] bg-white text-[12px] font-sarabun cursor-pointer hover:bg-[#E24B4A] hover:text-white transition-all">
            🗑 Delete this archive
          </button>
        </div>
      )}

      {selected && selected.isCurrent && (
        <div className="bg-white rounded-[14px] p-5 border border-[#E2E0D8] shadow-sm fade-up">
          <div className="font-kanit text-base font-bold mb-1">{MONTH_TH[viewMonth]} {viewYear} — เดือนปัจจุบัน</div>
          <div className="text-[12px] text-[#888] mb-4">ยังไม่ได้ปิดเดือน</div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { n: allSt.total, l:'Total', c:'#111' },
              { n: allSt.done,  l:'Done',  c:'#1D9E75' },
              { n: allSt.total - allSt.done, l:'Remaining', c:'#EF9F27' },
              { n: `${curPct}%`, l:'Progress', c:'#5B4EC8' },
            ].map(({ n, l, c }) => (
              <div key={l} className="text-center">
                <div className="font-kanit text-2xl font-bold" style={{ color: c }}>{n}</div>
                <div className="text-[11px] text-[#888]">{l}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
