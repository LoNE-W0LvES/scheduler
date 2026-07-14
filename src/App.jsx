import { useState } from 'react';
import './index.css';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { LanguageProvider, useLanguage } from './hooks/useLanguage.jsx';
import { useAppState } from './hooks/useAppState';
import Nav           from './components/Nav';
import MonthBar      from './components/MonthBar';
import WeeklyView    from './components/WeeklyView';
import CalendarView  from './components/CalendarView';
import TrackerView   from './components/TrackerView';
import NotesView     from './components/NotesView';
import ManageView    from './components/ManageView';
import ArchiveView   from './components/ArchiveView';
import SettingsView  from './components/SettingsView';
import AdminView     from './components/AdminView';
import AuthPage      from './components/AuthPage';
import SidePanel     from './components/SidePanel';
import TicTacToeGate from './components/TicTacToeGate';
import ProfileModal  from './components/ProfileModal';
import Toast, { useToast } from './components/Toast';

function AppContent() {
  const { user, profile, loading: authLoading, signOut, isAdmin, updateProfile } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('weekly');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [useLock, setUseLock] = useState(() => {
    return sessionStorage.getItem('khim_ttt_unlocked') === 'true';
  });
  const { msg, visible, toast } = useToast();

  const {
    state, saveStatus, loading: dataLoading, update, toggleTheme,
    navMonth, goToToday,
    getMonthData,
    toggleRoutine, toggleEditTask, addEditTask, deleteEditTask, updateEditTask,
    setTrackerStatus,
    addNote, deleteNote, updateNote,
    addCustomRoutine, deleteCustomRoutine, updateCustomRoutine,
    archiveMonth, deleteArchive,
    getDayStats, getAllStats,
    exportSettings, importSettings, resetUserData,
  } = useAppState();

  const monthData = getMonthData();

  const offDays = profile?.off_days !== undefined && profile?.off_days !== null
    ? (profile.off_days === '' ? [] : profile.off_days.split(',').map(s => s.trim()))
    : ['Sunday'];

  // Tab configuration with translations
  const TABS = [
    { id: 'weekly',   label: `📅 ${t('weekly')}`,    activeClass: 'bg-[#111] text-white border-[#111] dark:bg-[#E0E0E0] dark:text-[#111] dark:border-[#E0E0E0]' },
    { id: 'calendar', label: `🗓 ${t('calendar')}`,   activeClass: 'bg-[#1D9E75] text-white border-[#1D9E75]' },
    { id: 'tracker',  label: `📊 ${t('tracker')}`,   activeClass: 'bg-[#C0365A] text-white border-[#C0365A]' },
    { id: 'notes',    label: `📝 ${t('notes')}`,     activeClass: 'bg-[#5B4EC8] text-white border-[#5B4EC8]' },
    { id: 'manage',   label: `📋 ${t('routines')}`,  activeClass: 'bg-[#1A5FA8] text-white border-[#1A5FA8]' },
    { id: 'archive',  label: `🗂 ${t('archive')}`,   activeClass: 'bg-[#2D5A27] text-white border-[#2D5A27]' },
    { id: 'settings', label: `⚙️ ${t('settings')}`,  activeClass: 'bg-[#4B5563] text-white border-[#4B5563]' },
    { id: 'admin',    label: `👑 ${t('admin')}`,    activeClass: 'bg-[#E24B4A] text-white border-[#E24B4A]', adminOnly: true },
  ];

  // Show lock screen if enabled
  if (useLock && user) {
    const unlock = () => {
      sessionStorage.setItem('khim_ttt_unlocked', 'true');
      setUseLock(true);
      toast('🎉 Welcome back!');
    };
    const bypass = () => {
      setUseLock(false);
      sessionStorage.setItem('khim_ttt_unlocked', 'true');
    };
    return (
      <>
        <TicTacToeGate
          onUnlock={bypass}
          themeMode={state.themeMode}
          onToggleTheme={toggleTheme}
        />
        <Toast msg={msg} visible={visible} />
      </>
    );
  }

  // Loading state
  if (authLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#121212] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl animate-spin mb-4">⏳</div>
          <div className="text-gray-600 dark:text-gray-400 font-sarabun">{t('loading')}...</div>
        </div>
      </div>
    );
  }

  // Not signed in - show auth page
  if (!user) {
    return <AuthPage themeMode={state.themeMode} onToggleTheme={toggleTheme} />;
  }

  const handleLock = () => {
    sessionStorage.removeItem('khim_ttt_unlocked');
    setUseLock(true);
  };

  const handleSignOut = async () => {
    await signOut();
    toast('👋 Signed out successfully');
  };

  // Filter tabs based on admin status
  const visibleTabs = TABS.filter(tab => !tab.adminOnly || isAdmin);

  return (
    <div className="min-h-screen bg-[#F7F6F2] dark:bg-[#121212] flex flex-col md:flex-row">
      {/* Collapsible Left Side Panel (Desktop / Tablet) */}
      <SidePanel
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfile={() => setShowProfileModal(true)}
        isAdmin={isAdmin}
        profile={profile}
        themeMode={state.themeMode}
        onToggleTheme={toggleTheme}
        onLockApp={handleLock}
        onSignOut={handleSignOut}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Nav for mobile & secondary header */}
        <div className="md:hidden">
          <Nav
            saveStatus={saveStatus}
            themeMode={state.themeMode}
            onToggleTheme={toggleTheme}
            onLockApp={handleLock}
            onSignOut={handleSignOut}
            profile={profile}
            isAdmin={isAdmin}
            onOpenProfile={() => setShowProfileModal(true)}
          />
        </div>

        {['weekly', 'calendar', 'tracker'].includes(activeTab) && (
          <MonthBar
            viewYear={state.viewYear}
            viewMonth={state.viewMonth}
            currentWeek={state.currentWeek}
            onPrev={() => navMonth(-1)}
            onNext={() => navMonth(1)}
            onToday={() => { goToToday(); toast('Jumped to today'); }}
            saveStatus={saveStatus}
            profile={profile}
            updateProfile={updateProfile}
            toast={toast}
          />
        )}

        {/* Tabs for mobile screens where SidePanel is hidden */}
        <div className="flex md:hidden gap-2 px-5 py-3 overflow-x-auto scrollbar-none border-b border-[#E5E7EB] dark:border-[#374151] bg-white dark:bg-[#1F2937]">
          {visibleTabs.map(({ id, label, activeClass }) => (
            <button key={id}
              onClick={() => setActiveTab(id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer transition-all whitespace-nowrap
                ${activeTab === id
                  ? activeClass + ' text-white shadow-md'
                  : 'bg-[#F3F4F6] dark:bg-[#374151] text-[#374151] dark:text-[#D1D5DB] hover:bg-[#E5E7EB] dark:hover:bg-[#4B5563]'
                }`}>
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
            offDays={offDays}
          />
        )}
        {activeTab === 'calendar' && (
          <CalendarView
            state={state}
            monthData={monthData}
            getDayStats={getDayStats}
            toast={toast}
            offDays={offDays}
          />
        )}
        {activeTab === 'tracker' && (
          <TrackerView
            state={state}
            monthData={monthData}
            onSetTrackerStatus={setTrackerStatus}
            toast={toast}
            offDays={offDays}
          />
        )}
        {activeTab === 'notes' && (
          <NotesView
            notes={state.notes}
            onAdd={addNote}
            onDelete={deleteNote}
            onUpdate={updateNote}
            exportSettings={exportSettings}
            importSettings={importSettings}
            toast={toast}
          />
        )}
        {(activeTab === 'manage' || activeTab === 'routines') && (
          <ManageView
            customRoutine={state.customRoutine}
            lockedRoutines={state.lockedRoutines}
            onAdd={addCustomRoutine}
            onDelete={deleteCustomRoutine}
            onUpdate={updateCustomRoutine}
            toast={toast}
          />
        )}
        {activeTab === 'settings' && (
          <SettingsView
            exportSettings={exportSettings}
            importSettings={importSettings}
            resetUserData={resetUserData}
            toast={toast}
            profile={profile}
            onOpenProfile={() => setShowProfileModal(true)}
            themeMode={state.themeMode}
            onToggleTheme={toggleTheme}
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
        {activeTab === 'admin' && isAdmin && (
          <AdminView user={user} toast={toast} />
        )}
      </div>
      </div>

      {showProfileModal && (
        <ProfileModal
          profile={profile}
          updateProfile={updateProfile}
          onClose={() => setShowProfileModal(false)}
          toast={toast}
          themeMode={state.themeMode}
          onToggleTheme={toggleTheme}
        />
      )}

      <Toast msg={msg} visible={visible} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
