import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.jsx';
import {
  uid, getTH, getCycleInfoForDate, getYearMonthKey,
  buildDefaultWeekState, ALL_DAYS,
  getDay30Info, getDatesForWeek, getNumWeeksInMonth, dowToName,
} from '../lib/constants';

// Ensure all week/day slots exist (4-week system)
function ensureWeekState(ws) {
  const out = { ...ws };
  for (let w = 1; w <= 4; w++) {
    if (!out[w]) out[w] = {};
    ALL_DAYS.forEach(day => {
      if (!out[w][day]) {
        out[w][day] = {
          routineDone: {},
          editTasks: [],
        };
      }
    });
  }
  return out;
}

function freshMonthData() {
  return { weekState: buildDefaultWeekState(), trackerState: {} };
}

const DEFAULT_NOTES = [
  { icon: '⏰', text: 'Daily team meeting every morning 09:00–09:15 — attend before starting any HR tasks' },
  { icon: '↻', text: 'Import work time every 3 days: Monday, Thursday, Saturday — 09:15 after meeting (15 mins)' },
  { icon: '🚗', text: 'Collect leave letters: Wednesday & Saturday 10:00–11:30 — travel to Resort, Boutique, Manee Inn (1.5 hrs)' },
  { icon: '📋', text: 'Entry leave letters into HR program every afternoon 15:00–17:00 — NOT in the morning' },
  { icon: '📢', text: 'Update & announce QT every Saturday at 16:30 before end of day' },
  { icon: '📅', text: 'Work schedule for all 4 branches must be ready before day 25 (30 mins per branch = 2 hrs)' },
  { icon: '⚠️', text: 'Arrive late report must be submitted before day 25' },
  { icon: '🗂️', text: 'After day 25: clear resign letters & folders, check resigned employees returned uniforms' },
  { icon: '🏨', text: 'Head office closed Sunday — Resort, Boutique, Manee Inn open 24/7' },
  { icon: '🔄', text: 'This routine repeats every month — reset Tracker at start of each new month' },
];

export function useAppState() {
  const { user, profile, updateProfile } = useAuth();
  const [state, setState] = useState({
    notes: [],
    customRoutine: [],
    lockedRoutines: [],
    monthlyArchive: [],
    themeMode: localStorage.getItem('hr_planner_theme') || 'light',
    monthsData: {},
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    currentWeek: 1,
  });
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Theme sync from profile or localStorage
  useEffect(() => {
    if (user && profile?.theme_mode) {
      setState(prev => ({ ...prev, themeMode: profile.theme_mode }));
      localStorage.setItem('hr_planner_theme', profile.theme_mode);
    } else if (!user) {
      const saved = localStorage.getItem('hr_planner_theme') || 'light';
      setState(prev => ({ ...prev, themeMode: saved }));
    }
  }, [user, profile]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.themeMode === 'dark');
  }, [state.themeMode]);

  // Load all data from Supabase
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    async function loadData() {
      setLoading(true);
      try {
        const today = getTH();
        const cycleInfo = getCycleInfoForDate(today);

        // Parallel fetch scoped strictly to user_id
        const [notesRes, routinesRes, archivesRes, monthRes] = await Promise.all([
          supabase.from('notes').select('*').eq('user_id', user.id).order('sort_order'),
          supabase.from('routines').select('*').eq('user_id', user.id).order('sort_order'),
          supabase.from('monthly_archives').select('*').eq('user_id', user.id).order('closed_at', { ascending: false }),
          supabase.from('months_data').select('*').eq('user_id', user.id),
        ]);

        // Build monthsData map
        const monthsData = {};
        (monthRes.data || []).forEach(m => {
          const key = `${m.year}-${String(m.month).padStart(2, '0')}`;
          monthsData[key] = {
            weekState: ensureWeekState(m.week_state || {}),
            trackerState: m.tracker_state || {}
          };
        });

        // Ensure current month exists
        const curKey = getYearMonthKey(cycleInfo.year, cycleInfo.month);
        if (!monthsData[curKey]) {
          monthsData[curKey] = freshMonthData();
        }

        // Accounts start clean without auto-seeding hardcoded notes
        const notes = notesRes.data || [];

        setState(prev => ({
          ...prev,
          notes: notes.map(n => ({ id: n.id, icon: n.icon, text: n.text })),
          customRoutine: (routinesRes.data || []).map(r => ({
            id: r.id,
            text: r.text,
            time: r.time,
            cls: r.cls,
            week: r.week,
            day: r.day
          })),
          lockedRoutines: [],
          monthlyArchive: (archivesRes.data || []).map(a => ({
            id: a.id,
            year: a.year,
            month: a.month,
            label: a.label,
            total: a.total_tasks,
            done: a.done_tasks,
            skipped: a.skipped_tasks,
            pct: a.percentage,
            taskLog: a.task_log || [],
            closedAt: a.closed_at
          })),
          monthsData,
          viewYear: cycleInfo.year,
          viewMonth: cycleInfo.month,
          currentWeek: cycleInfo.week,
          themeMode: profile?.theme_mode || localStorage.getItem('hr_planner_theme') || 'light'
        }));

        if (!profile?.theme_mode) {
          const savedTheme = localStorage.getItem('hr_planner_theme') || 'light';
          updateProfile({ theme_mode: savedTheme });
        }
      } catch (err) {
        console.error('Load error:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [user, profile]);

  // Save month data to Supabase
  const saveMonthData = useCallback(async (year, month, weekState, trackerState) => {
    if (!user) return;
    setSaveStatus('saving');
    try {
      const { error } = await supabase
        .from('months_data')
        .upsert({
          user_id: user.id,
          year,
          month,
          week_state: weekState,
          tracker_state: trackerState,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,year,month' });

      if (error) throw error;
      setSaveStatus('saved');
      clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Save error:', e);
      setSaveStatus('error');
    }
  }, [user]);

  // Toggle theme
  const toggleTheme = useCallback(async () => {
    const newMode = state.themeMode === 'dark' ? 'light' : 'dark';
    setState(prev => ({ ...prev, themeMode: newMode }));
    localStorage.setItem('hr_planner_theme', newMode);
    document.documentElement.classList.toggle('dark', newMode === 'dark');
    if (user) {
      await updateProfile({ theme_mode: newMode });
    }
  }, [state.themeMode, user, updateProfile]);

  // Navigate month
  const navMonth = useCallback((dir) => {
    setState(prev => {
      let m = prev.viewMonth + dir;
      let y = prev.viewYear;
      if (m < 0) { m = 11; y--; }
      if (m > 11) { m = 0; y++; }

      const key = getYearMonthKey(y, m);
      const monthsData = { ...prev.monthsData };
      if (!monthsData[key]) monthsData[key] = freshMonthData();
      monthsData[key] = { ...monthsData[key], weekState: ensureWeekState(monthsData[key].weekState || {}) };

      const today = getTH();
      const cycleInfo = getCycleInfoForDate(today);
      const currentWeek = (y === cycleInfo.year && m === cycleInfo.month) ? cycleInfo.week : 1;

      return { ...prev, viewYear: y, viewMonth: m, monthsData, currentWeek };
    });
  }, []);

  const goToToday = useCallback(() => {
    const today = getTH();
    const cycleInfo = getCycleInfoForDate(today);
    setState(prev => ({
      ...prev,
      viewYear: cycleInfo.year,
      viewMonth: cycleInfo.month,
      currentWeek: cycleInfo.week,
    }));
  }, []);

  // Generic update (for week changes, etc.)
  const update = useCallback((updater, skipSave = false) => {
    setState(prev => {
      const updates = typeof updater === 'function' ? updater(prev) : updater;
      return { ...prev, ...updates };
    });
  }, []);

  // Toggle routine
  const toggleRoutine = useCallback((week, day, routineIdx) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ws = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day], routineDone: { ...ws[week][day].routineDone } };
      dayState.routineDone[routineIdx] = !dayState.routineDone[routineIdx];
      ws[week] = { ...ws[week], [day]: dayState };

      const newState = {
        ...prev,
        monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } },
      };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, ws, md.trackerState);
      return newState;
    });
  }, [saveMonthData]);

  // Edit tasks
  const toggleEditTask = useCallback((week, day, taskId) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ws = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      ws[week] = { ...ws[week], [day]: dayState };

      const newState = { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, ws, md.trackerState);
      return newState;
    });
  }, [saveMonthData]);

  const addEditTask = useCallback((week, day, text, time) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ws = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = [...dayState.editTasks, { id: uid(), text, time, done: false }];
      ws[week] = { ...ws[week], [day]: dayState };

      const newState = { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, ws, md.trackerState);
      return newState;
    });
  }, [saveMonthData]);

  const deleteEditTask = useCallback((week, day, taskId) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ws = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.filter(t => t.id !== taskId);
      ws[week] = { ...ws[week], [day]: dayState };

      const newState = { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, ws, md.trackerState);
      return newState;
    });
  }, [saveMonthData]);

  const updateEditTask = useCallback((week, day, taskId, text, time) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ws = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.map(t =>
        t.id === taskId ? { ...t, text, time } : t
      );
      ws[week] = { ...ws[week], [day]: dayState };

      const newState = { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, ws, md.trackerState);
      return newState;
    });
  }, [saveMonthData]);

  // Tracker status
  const setTrackerStatus = useCallback((id, status) => {
    setState(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md = prev.monthsData[key] || freshMonthData();
      const ts = { ...md.trackerState, [id]: status };

      const newState = { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, trackerState: ts } } };
      saveMonthData(prev.viewYear, prev.viewMonth + 1, md.weekState, ts);
      return newState;
    });
  }, [saveMonthData]);

  // Notes
  const addNote = useCallback(async (icon, text) => {
    const { data, error } = await supabase
      .from('notes')
      .insert({ user_id: user.id, icon, text })
      .select()
      .maybeSingle();

    if (!error && data) {
      setState(prev => ({ ...prev, notes: [...prev.notes, { id: data.id, icon, text }] }));
    }
  }, [user]);

  const deleteNote = useCallback(async (id) => {
    await supabase.from('notes').delete().eq('id', id);
    setState(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  }, []);

  const updateNote = useCallback(async (id, text) => {
    await supabase.from('notes').update({ text }).eq('id', id);
    setState(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? { ...n, text } : n) }));
  }, []);

  // Routines
  const addCustomRoutine = useCallback(async (routine) => {
    const { data, error } = await supabase
      .from('routines')
      .insert({ user_id: user.id, ...routine })
      .select()
      .maybeSingle();

    if (!error && data) {
      setState(prev => ({ ...prev, customRoutine: [...prev.customRoutine, { id: data.id, ...routine }] }));
    }
  }, [user]);

  const deleteCustomRoutine = useCallback(async (id) => {
    await supabase.from('routines').delete().eq('id', id);
    setState(prev => ({ ...prev, customRoutine: prev.customRoutine.filter(r => r.id !== id) }));
  }, []);

  const updateCustomRoutine = useCallback(async (id, data) => {
    await supabase.from('routines').update(data).eq('id', id);
    setState(prev => ({
      ...prev,
      customRoutine: prev.customRoutine.map(r => r.id === id ? { ...r, ...data } : r)
    }));
  }, []);

  // Archive month
  const archiveMonth = useCallback(async () => {
    const today = getTH();
    const key = getYearMonthKey(state.viewYear, state.viewMonth);
    const md = state.monthsData[key] || freshMonthData();
    const ws = md.weekState;
    const ts = md.trackerState;
    const d30 = getDay30Info(state.viewYear, state.viewMonth);
    const numWeeks = getNumWeeksInMonth(state.viewYear, state.viewMonth);

    let total = 0, done = 0, skipped = 0;
    const taskLog = [];

    const allRoutines = [...state.lockedRoutines, ...state.customRoutine];

    for (let w = 1; w <= numWeeks; w++) {
      const dates = getDatesForWeek(state.viewYear, state.viewMonth, w);
      dates.forEach(date => {
        const dayName = dowToName(date.getDay());
        if (dayName === 'Sunday') return;

        const routine = allRoutines.filter(r => {
          if (r.week === 'day30') {
            return d30.week === w && dayName === d30.dayName;
          }
          const weekOk = r.week === 'all' || r.week === String(w);
          const dayOk = r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(dayName);
          return weekOk && dayOk;
        });

        const dayState = ws[w]?.[dayName] || { routineDone: {}, editTasks: [] };

        routine.forEach((r, i) => {
          const isDone = !!dayState.routineDone[i];
          total++;
          if (isDone) done++;
          taskLog.push({ week: w, day: dayName, text: r.text, time: r.time, status: isDone ? 'done' : 'pending' });
        });
        dayState.editTasks.forEach(t => {
          total++;
          if (t.done) done++;
          taskLog.push({ week: w, day: dayName, text: t.text, time: t.time, status: t.done ? 'done' : 'pending' });
        });
      });
    }

    const pct = total ? Math.round(done / total * 100) : 0;

    const { data: archive, error } = await supabase
      .from('monthly_archives')
      .insert({
        user_id: user.id,
        year: state.viewYear,
        month: state.viewMonth + 1,
        label: `${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][state.viewMonth]} ${state.viewYear}`,
        total_tasks: total,
        done_tasks: done,
        skipped_tasks: skipped,
        percentage: pct,
        task_log: taskLog
      })
      .select()
      .maybeSingle();

    if (!error && archive) {
      // Reset month
      const fresh = freshMonthData();
      await supabase.from('months_data').upsert({
        user_id: user.id,
        year: state.viewYear,
        month: state.viewMonth + 1,
        week_state: fresh.weekState,
        tracker_state: fresh.trackerState
      }, { onConflict: 'user_id,year,month' });

      setState(prev => ({
        ...prev,
        monthlyArchive: [...prev.monthlyArchive, {
          id: archive.id,
          year: state.viewYear,
          month: state.viewMonth + 1,
          label: archive.label,
          total, done, skipped, pct,
          taskLog,
          closedAt: today.toISOString()
        }],
        monthsData: { ...prev.monthsData, [key]: fresh }
      }));
    }
  }, [state, user]);

  const deleteArchive = useCallback(async (year, month) => {
    await supabase.from('monthly_archives').delete().eq('user_id', user.id).eq('year', year).eq('month', month);
    setState(prev => ({
      ...prev,
      monthlyArchive: prev.monthlyArchive.filter(a => !(a.year === year && a.month === month))
    }));
  }, [user]);

  // Stats helpers
  const getDayStats = useCallback((week, day, routines, forYear, forMonth) => {
    if (day === 'Sunday') return { total: 0, done: 0 };
    const key = getYearMonthKey(forYear ?? state.viewYear, forMonth ?? state.viewMonth);
    const ws = state.monthsData[key]?.weekState;
    const s = ws?.[week]?.[day];
    if (!s) return { total: 0, done: 0 };
    const total = routines.length + s.editTasks.length;
    const done = routines.filter((_, i) => s.routineDone[i]).length + s.editTasks.filter(t => t.done).length;
    return { total, done };
  }, [state]);

  const getAllStats = useCallback(() => {
    const d30 = getDay30Info(state.viewYear, state.viewMonth);
    const numWeeks = getNumWeeksInMonth(state.viewYear, state.viewMonth);
    let total = 0, done = 0;
    const allRoutines = [...state.lockedRoutines, ...state.customRoutine];

    for (let w = 1; w <= numWeeks; w++) {
      const dates = getDatesForWeek(state.viewYear, state.viewMonth, w);
      dates.forEach(date => {
        const dayName = dowToName(date.getDay());
        if (dayName === 'Sunday') return;

        const routine = allRoutines.filter(r => {
          if (r.week === 'day30') {
            return d30.week === w && dayName === d30.dayName;
          }
          const weekOk = r.week === 'all' || r.week === String(w);
          const dayOk = r.day === 'all' || r.day.split(',').map(s => s.trim()).includes(dayName);
          return weekOk && dayOk;
        });

        const s = state.monthsData[getYearMonthKey(state.viewYear, state.viewMonth)]?.weekState?.[w]?.[dayName];
        if (s) {
          total += routine.length + s.editTasks.length;
          done += routine.filter((_, i) => s.routineDone[i]).length + s.editTasks.filter(t => t.done).length;
        }
      });
    }
    return { total, done };
  }, [state]);

  // Get current month data
  const getMonthData = useCallback(() => {
    const key = getYearMonthKey(state.viewYear, state.viewMonth);
    return state.monthsData[key] || freshMonthData();
  }, [state]);

  const exportSettings = useCallback(() => {
    const formatRoutine = (r, isLocked) => {
      const daysList = r.day === 'all'
        ? ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        : r.day.split(',').map(s => s.trim());
      return {
        text: r.text,
        time: r.time || '',
        cls: r.cls || 'tp-gen',
        week: r.week || 'all',
        day: r.day || 'all',
        flags: {
          isLocked: !!isLocked,
          isDaily: r.day === 'all',
          isAllWeeks: r.week === 'all',
          daysOfWeekFlag: daysList,
          weekCycleFlag: r.week || 'all',
          tagColorFlag: r.cls || 'tp-gen'
        }
      };
    };

    const formattedLocked = state.lockedRoutines.map(r => formatRoutine(r, true));
    const formattedCustom = state.customRoutine.map(r => formatRoutine(r, false));
    const formattedNotes = state.notes.map(n => ({
      icon: n.icon || '📌',
      text: n.text,
      flags: {
        isDefault: DEFAULT_NOTES.some(dn => dn.text === n.text)
      }
    }));

    let parsedWeekSettings = {};
    if (profile?.week_settings) {
      try {
        parsedWeekSettings = typeof profile.week_settings === 'string' ? JSON.parse(profile.week_settings) : profile.week_settings;
      } catch (e) {}
    }

    const exportData = {
      version: '1.1',
      exportedAt: new Date().toISOString(),
      themeMode: state.themeMode,
      weekSettings: parsedWeekSettings,
      offDays: profile?.off_days || 'Sunday',
      language: profile?.language || 'en',
      summary: {
        totalLockedRoutines: formattedLocked.length,
        totalCustomRoutines: formattedCustom.length,
        totalNotes: formattedNotes.length,
      },
      allRoutines: [...formattedLocked, ...formattedCustom],
      lockedRoutines: formattedLocked,
      customRoutines: formattedCustom,
      notes: formattedNotes,
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `schaduler-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state.themeMode, state.lockedRoutines, state.customRoutine, state.notes, profile]);

  const importSettings = useCallback(async (jsonData, mode = 'merge') => {
    if (!user) return false;
    try {
      // 1. Import Routines
      let rawRoutines = jsonData.customRoutines || jsonData.custom_routines || jsonData.allRoutines || jsonData.routines || [];
      if (Array.isArray(rawRoutines)) {
        const routinesToImport = rawRoutines.filter(r => !r.flags?.isLocked && !r.isLocked);
        if (routinesToImport.length > 0) {
          if (mode === 'replace') {
            await supabase.from('routines').delete().eq('user_id', user.id);
          }
          const toInsert = routinesToImport.map((r, idx) => ({
            user_id: user.id,
            text: r.text || r.title || 'Imported Task',
            time: r.time || '',
            cls: r.cls || r.flags?.tagColorFlag || 'tp-gen',
            week: r.week || r.flags?.weekCycleFlag || 'all',
            day: r.day || (Array.isArray(r.flags?.daysOfWeekFlag) ? r.flags.daysOfWeekFlag.join(', ') : 'all'),
            sort_order: idx + (mode === 'replace' ? 0 : state.customRoutine.length)
          }));
          await supabase.from('routines').insert(toInsert);
        }
      }

      // 2. Import Notes
      const importedNotes = jsonData.notes || [];
      if (Array.isArray(importedNotes) && importedNotes.length > 0) {
        if (mode === 'replace') {
          await supabase.from('notes').delete().eq('user_id', user.id);
        }
        const notesToInsert = importedNotes.map((n, idx) => ({
          user_id: user.id,
          icon: n.icon || '📌',
          text: n.text || '',
          sort_order: idx + (mode === 'replace' ? 0 : state.notes.length)
        }));
        await supabase.from('notes').insert(notesToInsert);
      }

      // 3. Profile settings (Theme, Week Settings, Off Days, Language)
      const profileUpdates = {};
      if (jsonData.themeMode === 'light' || jsonData.themeMode === 'dark') {
        profileUpdates.theme_mode = jsonData.themeMode;
      }
      const rawWeekSettings = jsonData.weekSettings || jsonData.week_settings;
      if (rawWeekSettings) {
        profileUpdates.week_settings = typeof rawWeekSettings === 'string'
          ? rawWeekSettings
          : JSON.stringify(rawWeekSettings);
      }
      if (jsonData.offDays || jsonData.off_days) {
        profileUpdates.off_days = jsonData.offDays || jsonData.off_days;
      }
      if (jsonData.language) {
        profileUpdates.language = jsonData.language;
      }
      if (Object.keys(profileUpdates).length > 0 && updateProfile) {
        await updateProfile(profileUpdates);
      }

      // 4. Reload from DB
      const [notesRes, routinesRes] = await Promise.all([
        supabase.from('notes').select('*').eq('user_id', user.id).order('sort_order'),
        supabase.from('routines').select('*').eq('user_id', user.id).order('sort_order'),
      ]);

      setState(prev => ({
        ...prev,
        themeMode: jsonData.themeMode || prev.themeMode,
        notes: (notesRes.data || []).map(n => ({ id: n.id, icon: n.icon, text: n.text })),
        customRoutine: (routinesRes.data || []).map(r => ({
          id: r.id,
          text: r.text,
          time: r.time,
          cls: r.cls,
          week: r.week,
          day: r.day
        })),
        lockedRoutines: []
      }));
      return true;
    } catch (err) {
      console.error('Import error:', err);
      return false;
    }
  }, [user, state.customRoutine.length, state.notes.length, updateProfile]);

  const resetUserData = useCallback(async () => {
    if (!user) return false;
    try {
      await Promise.all([
        supabase.from('notes').delete().eq('user_id', user.id),
        supabase.from('routines').delete().eq('user_id', user.id),
        supabase.from('monthly_archives').delete().eq('user_id', user.id),
        supabase.from('months_data').delete().eq('user_id', user.id),
      ]);

      if (updateProfile) {
        await updateProfile({ week_settings: '{}', off_days: 'Sunday' });
      }

      const today = getTH();
      const cycleInfo = getCycleInfoForDate(today);
      const curKey = getYearMonthKey(cycleInfo.year, cycleInfo.month);

      setState(prev => ({
        ...prev,
        notes: [],
        customRoutine: [],
        lockedRoutines: [],
        monthlyArchive: [],
        monthsData: { [curKey]: freshMonthData() },
      }));

      return true;
    } catch (err) {
      console.error('Reset error:', err);
      return false;
    }
  }, [user, updateProfile]);

  return {
    state, saveStatus, loading, update, toggleTheme,
    navMonth, goToToday,
    getMonthData,
    toggleRoutine, toggleEditTask, addEditTask, deleteEditTask, updateEditTask,
    setTrackerStatus,
    addNote, deleteNote, updateNote,
    addCustomRoutine, deleteCustomRoutine, updateCustomRoutine,
    archiveMonth, deleteArchive,
    getDayStats, getAllStats,
    exportSettings, importSettings, resetUserData,
  };
}
