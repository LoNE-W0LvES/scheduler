import { useState } from 'react';
import './index.css';
import { useAppState } from './hooks/useAppState';
import Nav           from './components/Nav';
import MonthBar      from './components/MonthBar';
import WeeklyView    from './components/WeeklyView';
import CalendarView  from './components/CalendarView';
import TrackerView   from './components/TrackerView';
import NotesView     from './components/NotesView';
import ManageView    from './components/ManageView';
import ArchiveView   from './components/ArchiveView';
import TicTacToeGate from './components/TicTacToeGate';
import Toast, { useToast } from './components/Toast';

const TABS = [
  { id: 'weekly',   label: '📅 Weekly',    activeClass: 'bg-[#111] text-white border-[#111] dark:bg-[#E0E0E0] dark:text-[#111] dark:border-[#E0E0E0]' },
  { id: 'calendar', label: '🗓 Calendar',   activeClass: 'bg-[#1D9E75] text-white border-[#1D9E75]' },
  { id: 'tracker',  label: '📊 Tracker',   activeClass: 'bg-[#C0365A] text-white border-[#C0365A]' },
  { id: 'notes',    label: '📝 Notes',     activeClass: 'bg-[#5B4EC8] text-white border-[#5B4EC8]' },
  { id: 'manage',   label: '⚙️ Manage',    activeClass: 'bg-[#1A5FA8] text-white border-[#1A5FA8]' },
  { id: 'archive',  label: '🗂 Archive',   activeClass: 'bg-[#2D5A27] text-white border-[#2D5A27]' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('weekly');
  const [unlocked, setUnlocked] = useState(() => {
    return sessionStorage.getItem('khim_ttt_unlocked') === 'true';
  });
  const { msg, visible, toast }   = useToast();

  const {
    state, saveStatus, update, toggleTheme,
    navMonth, goToToday,
    getMonthData,
    toggleRoutine, toggleEditTask, addEditTask, deleteEditTask, updateEditTask,
    setTrackerStatus,
    addNote, deleteNote, updateNote,
    addCustomRoutine, deleteCustomRoutine, updateCustomRoutine,
    archiveMonth, deleteArchive,
    getDayStats, getAllStats,
  } = useAppState();

  const monthData = getMonthData();

  const handleUnlock = () => {
    sessionStorage.setItem('khim_ttt_unlocked', 'true');
    setUnlocked(true);
    toast('🎉 Security Challenge passed! Welcome!');
  };

  const handleLock = () => {
    sessionStorage.removeItem('khim_ttt_unlocked');
    setUnlocked(false);
  };

  if (!unlocked) {
    return (
      <>
        <TicTacToeGate onUnlock={handleUnlock} themeMode={state.themeMode} onToggleTheme={toggleTheme} />
        <Toast msg={msg} visible={visible} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F2]">
      <Nav saveStatus={saveStatus} themeMode={state.themeMode} onToggleTheme={toggleTheme} onLockApp={handleLock} />

      <MonthBar
        viewYear={state.viewYear}
        viewMonth={state.viewMonth}
        onPrev={() => navMonth(-1)}
        onNext={() => navMonth(1)}
        onToday={() => { goToToday(); toast('🎯 Jumped to today'); }}
      />

      {/* Tabs */}
      <div className="flex gap-1.5 px-5 pt-3 pb-0 overflow-x-auto scrollbar-none" style={{ scrollbarWidth:'none' }}>
        {TABS.map(({ id, label, activeClass }) => (
          <button key={id}
            onClick={() => setActiveTab(id)}
            className={`px-4 py-1.5 rounded-full border text-[13px] font-sarabun font-medium whitespace-nowrap cursor-pointer transition-all
              ${activeTab === id ? activeClass : 'bg-white border-[#E2E0D8] text-[#444] hover:border-[#AAA]'}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Views */}
      <div className="mt-3">
        {activeTab === 'weekly' && (
          <WeeklyView
            state={state}
            currentWeek={state.currentWeek}
            onWeekChange={w => update({ currentWeek: w }, true)}
            monthData={monthData}
            onToggleRoutine={toggleRoutine}
            onToggleEditTask={toggleEditTask}
            onAddEditTask={addEditTask}
            onDeleteEditTask={deleteEditTask}
            onUpdateEditTask={updateEditTask}
            getAllStats={getAllStats}
            getDayStats={getDayStats}
            toast={toast}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView
            state={state}
            monthData={monthData}
            getDayStats={getDayStats}
            toast={toast}
          />
        )}
        {activeTab === 'tracker' && (
          <TrackerView
            state={state}
            monthData={monthData}
            onSetTrackerStatus={setTrackerStatus}
            toast={toast}
          />
        )}
        {activeTab === 'notes' && (
          <NotesView
            notes={state.notes}
            onAdd={addNote}
            onDelete={deleteNote}
            onUpdate={updateNote}
            toast={toast}
          />
        )}
        {activeTab === 'manage' && (
          <ManageView
            customRoutine={state.customRoutine}
            onAdd={addCustomRoutine}
            onDelete={deleteCustomRoutine}
            onUpdate={updateCustomRoutine}
            toast={toast}
          />
        )}
        {activeTab === 'archive' && (
          <ArchiveView
            state={state}
            monthData={monthData}
            getAllStats={getAllStats}
            archiveMonth={() => { archiveMonth(); toast('✅ Month archived!'); }}
            deleteArchive={deleteArchive}
            toast={toast}
          />
        )}
      </div>

      <Toast msg={msg} visible={visible} />
    </div>
  );
}
