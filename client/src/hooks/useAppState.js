import { useState, useCallback, useRef, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth.jsx';
import {
  uid, getTH, getCycleInfoForDate, getYearMonthKey,
  buildDefaultWeekState, ALL_DAYS, WEEK_EXTRA,
  getDay30Info, getDatesForWeek, getNumWeeksInMonth, dowToName,
} from '../lib/constants';

// Ensure all week/day slots exist
function ensureWeekState(ws) {
  const out = { ...ws };
  for (let w = 1; w <= 5; w++) {
    if (!out[w]) out[w] = {};
    ALL_DAYS.forEach(day => {
      if (!out[w][day]) {
        const extras = (WEEK_EXTRA[w] && WEEK_EXTRA[w][day]) || [];
        out[w][day] = {
          routineDone: {},
          editTasks: extras.map(t => ({ id: uid(), text: t.text, time: t.time, done: false })),
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
    themeMode: 'light',
    monthsData: {},
    viewYear: new Date().getFullYear(),
    viewMonth: new Date().getMonth(),
    currentWeek: 1,
  });
  const [saveStatus, setSaveStatus] = useState('idle');
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef(null);

  // Theme sync from profile
  useEffect(() => {
    if (profile?.theme_mode) {
      setState(prev => ({ ...prev, themeMode: profile.theme_mode }));
    }
  }, [profile]);

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

        // Parallel fetch
        const [notesRes, customRes, lockedRes, archivesRes, monthRes] = await Promise.all([
          supabase.from('notes').select('*').order('sort_order'),
          supabase.from('custom_routines').select('*').order('sort_order'),
          supabase.from('locked_routines').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('monthly_archives').select('*').order('closed_at', { ascending: false }),
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

        // If no notes, seed default notes
        let notes = notesRes.data || [];
        if (notes.length === 0) {
          const insertPromises = DEFAULT_NOTES.map((n, i) =>
            supabase.from('notes').insert({
              user_id: user.id,
              icon: n.icon,
              text: n.text,
              sort_order: i
            })
          );
          await Promise.all(insertPromises);
          const { data: newNotes } = await supabase.from('notes').select('*').order('sort_order');
          notes = newNotes || [];
        }

        setState(prev => ({
          ...prev,
          notes: notes.map(n => ({ id: n.id, icon: n.icon, text: n.text })),
          customRoutine: (customRes.data || []).map(r => ({
            id: r.id,
            text: r.text,
            time: r.time,
            cls: r.cls,
            week: r.week,
            day: r.day
          })),
          lockedRoutines: (lockedRes.data || []).map(r => ({
            id: r.id,
            text: r.text,
            time: r.time,
            cls: r.cls,
            week: r.week,
            day: r.day
          })),
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
          themeMode: profile?.theme_mode || 'light'
        }));
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

  // Custom routines
  const addCustomRoutine = useCallback(async (routine) => {
    const { data, error } = await supabase
      .from('custom_routines')
      .insert({ user_id: user.id, ...routine })
      .select()
      .maybeSingle();

    if (!error && data) {
      setState(prev => ({ ...prev, customRoutine: [...prev.customRoutine, { id: data.id, ...routine }] }));
    }
  }, [user]);

  const deleteCustomRoutine = useCallback(async (id) => {
    await supabase.from('custom_routines').delete().eq('id', id);
    setState(prev => ({ ...prev, customRoutine: prev.customRoutine.filter(r => r.id !== id) }));
  }, []);

  const updateCustomRoutine = useCallback(async (id, data) => {
    await supabase.from('custom_routines').update(data).eq('id', id);
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
  };
}
