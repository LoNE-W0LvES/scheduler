import { useState, useCallback, useRef, useEffect } from 'react';
import {
  uid, getTH, getCycleInfoForDate, getYearMonthKey,
  buildDefaultWeekState, DEFAULT_NOTES, ALL_DAYS, WEEK_EXTRA,
  getDay30Info, getRoutinesForDay, getDatesForWeek, getNumWeeksInMonth, dowToName,
} from '../lib/constants';
import { apiLoad, apiSave } from '../lib/api';

// ── ensure all week/day slots exist ─────────────────────────────────────────
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

// ── initial state factory ────────────────────────────────────────────────────
function makeInitial() {
  const today     = getTH();
  const cycleInfo = getCycleInfoForDate(today);
  return {
    notes:          [...DEFAULT_NOTES],
    customRoutine:  [],
    monthlyArchive: [],
    themeMode:      'light',
    monthsData:     {},
    // transient view state
    viewYear:   cycleInfo.year,
    viewMonth:  cycleInfo.month,
    currentWeek: cycleInfo.week,
  };
}

export function useAppState() {
  const [state, setState] = useState(makeInitial);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const saveTimer  = useRef(null);
  const saveDebounce = useRef(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', state.themeMode === 'dark');
  }, [state.themeMode]);

  const applyServerData = useCallback((data, keepCurrentView = false) => {
    if (!data) return;
    setState(prev => {
      const today     = getTH();
      const cycleInfo = getCycleInfoForDate(today);

      let viewYear  = keepCurrentView ? prev.viewYear  : cycleInfo.year;
      let viewMonth = keepCurrentView ? prev.viewMonth : cycleInfo.month;

      if (!keepCurrentView && data.lastViewMonthKey) {
        const [y, m] = data.lastViewMonthKey.split('-').map(Number);
        if (!isNaN(y) && !isNaN(m)) { viewYear = y; viewMonth = m - 1; }
      }

      // normalise monthsData
      const monthsData = data.monthsData || {};
      if (!data.monthsData && (data.weekState || data.trackerState)) {
        const legacyKey = getYearMonthKey(viewYear, viewMonth);
        monthsData[legacyKey] = {
          weekState:    ensureWeekState(data.weekState || buildDefaultWeekState()),
          trackerState: data.trackerState || {},
        };
      }

      // make sure current month slot exists
      const curKey = getYearMonthKey(viewYear, viewMonth);
      if (!monthsData[curKey]) monthsData[curKey] = freshMonthData();
      monthsData[curKey].weekState = ensureWeekState(monthsData[curKey].weekState || {});

      const cycleView = getCycleInfoForDate(today);
      const currentWeek = keepCurrentView
        ? prev.currentWeek
        : (viewYear === cycleView.year && viewMonth === cycleView.month ? cycleView.week : 1);

      return {
        ...prev,
        notes:          data.notes?.length ? data.notes : prev.notes,
        customRoutine:  data.customRoutine  || [],
        monthlyArchive: data.monthlyArchive || [],
        themeMode:      data.themeMode      || prev.themeMode || 'light',
        monthsData,
        viewYear, viewMonth, currentWeek,
      };
    });
  }, []);

  // ── load on mount + listen to SSE updates ──────────────────────────────────
  useEffect(() => {
    apiLoad().then(data => applyServerData(data, false)).catch(err => console.warn('Load error', err));

    const es = new EventSource('/api/events');
    es.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.type === 'update' && payload.data) {
          applyServerData(payload.data, true);
        }
      } catch (e) {}
    };
    return () => es.close();
  }, [applyServerData]);

  // ── helpers for current month data ────────────────────────────────────────
  const getMonthKey = useCallback((st = null) => {
    const s = st || state;
    return getYearMonthKey(s.viewYear, s.viewMonth);
  }, [state]);

  const getMonthData = useCallback((st = null) => {
    const s = st || state;
    const key = getYearMonthKey(s.viewYear, s.viewMonth);
    return s.monthsData[key] || freshMonthData();
  }, [state]);

  // ── auto-save (debounced 600 ms) ──────────────────────────────────────────
  const scheduleSave = useCallback((nextState) => {
    clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(async () => {
      setSaveStatus('saving');
      try {
        const key = getYearMonthKey(nextState.viewYear, nextState.viewMonth);
        await apiSave({
          notes:           nextState.notes,
          customRoutine:   nextState.customRoutine,
          monthlyArchive:  nextState.monthlyArchive,
          themeMode:       nextState.themeMode,
          monthsData:      nextState.monthsData,
          lastViewMonthKey: key,
          savedAt:         new Date().toISOString(),
        });
        setSaveStatus('saved');
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error('Save error', e);
        setSaveStatus('error');
      }
    }, 600);
  }, []);

  // ── generic updater ───────────────────────────────────────────────────────
  const update = useCallback((updater, skipSave = false) => {
    setState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      // ensure current month exists
      const key = getYearMonthKey(next.viewYear, next.viewMonth);
      if (!next.monthsData[key]) {
        next.monthsData = { ...next.monthsData, [key]: freshMonthData() };
      }
      if (!skipSave) {
        scheduleSave(next);
      }
      return next;
    });
  }, [scheduleSave]);

  const toggleTheme = useCallback(() => {
    update(prev => ({
      ...prev,
      themeMode: prev.themeMode === 'dark' ? 'light' : 'dark'
    }));
  }, [update]);

  // ── navigate month ────────────────────────────────────────────────────────
  const navMonth = useCallback((dir) => {
    update(prev => {
      let m = prev.viewMonth + dir;
      let y = prev.viewYear;
      if (m < 0)  { m = 11; y--; }
      if (m > 11) { m = 0;  y++; }

      if (y !== prev.viewYear) {
        apiLoad(y).then(data => applyServerData(data, true)).catch(()=>{});
      }

      const key = getYearMonthKey(y, m);
      const monthsData = { ...prev.monthsData };
      if (!monthsData[key]) monthsData[key] = freshMonthData();
      monthsData[key] = { ...monthsData[key], weekState: ensureWeekState(monthsData[key].weekState || {}) };

      const today     = getTH();
      const cycleInfo = getCycleInfoForDate(today);
      const currentWeek = (y === cycleInfo.year && m === cycleInfo.month) ? cycleInfo.week : 1;

      return { ...prev, viewYear: y, viewMonth: m, monthsData, currentWeek };
    }, true);
  }, [update, applyServerData]);

  const goToToday = useCallback(() => {
    const today     = getTH();
    const cycleInfo = getCycleInfoForDate(today);
    update(prev => {
      if (cycleInfo.year !== prev.viewYear) {
        apiLoad(cycleInfo.year).then(data => applyServerData(data, true)).catch(()=>{});
      }
      return {
        ...prev,
        viewYear:    cycleInfo.year,
        viewMonth:   cycleInfo.month,
        currentWeek: cycleInfo.week,
      };
    }, true);
  }, [update, applyServerData]);

  // ── routine toggle ────────────────────────────────────────────────────────
  const toggleRoutine = useCallback((week, day, routineIdx) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ws  = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day], routineDone: { ...ws[week][day].routineDone } };
      dayState.routineDone[routineIdx] = !dayState.routineDone[routineIdx];
      ws[week] = { ...ws[week], [day]: dayState };
      return {
        ...prev,
        monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } },
      };
    });
  }, [update]);

  // ── edit task toggle ──────────────────────────────────────────────────────
  const toggleEditTask = useCallback((week, day, taskId) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ws  = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.map(t =>
        t.id === taskId ? { ...t, done: !t.done } : t
      );
      ws[week] = { ...ws[week], [day]: dayState };
      return { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
    });
  }, [update]);

  // ── add edit task ─────────────────────────────────────────────────────────
  const addEditTask = useCallback((week, day, text, time) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ws  = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = [...dayState.editTasks, { id: uid(), text, time, done: false }];
      ws[week] = { ...ws[week], [day]: dayState };
      return { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
    });
  }, [update]);

  // ── delete edit task ──────────────────────────────────────────────────────
  const deleteEditTask = useCallback((week, day, taskId) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ws  = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.filter(t => t.id !== taskId);
      ws[week] = { ...ws[week], [day]: dayState };
      return { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
    });
  }, [update]);

  // ── update edit task ──────────────────────────────────────────────────────
  const updateEditTask = useCallback((week, day, taskId, text, time) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ws  = ensureWeekState({ ...md.weekState });
      const dayState = { ...ws[week][day] };
      dayState.editTasks = dayState.editTasks.map(t =>
        t.id === taskId ? { ...t, text, time } : t
      );
      ws[week] = { ...ws[week], [day]: dayState };
      return { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, weekState: ws } } };
    });
  }, [update]);

  // ── tracker status ────────────────────────────────────────────────────────
  const setTrackerStatus = useCallback((id, status) => {
    update(prev => {
      const key = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md  = prev.monthsData[key] || freshMonthData();
      const ts  = { ...md.trackerState, [id]: status };
      return { ...prev, monthsData: { ...prev.monthsData, [key]: { ...md, trackerState: ts } } };
    });
  }, [update]);

  // ── notes ─────────────────────────────────────────────────────────────────
  const addNote = useCallback((icon, text) => {
    update(prev => ({ ...prev, notes: [...prev.notes, { id: uid(), icon, text }] }));
  }, [update]);
  const deleteNote = useCallback((id) => {
    update(prev => ({ ...prev, notes: prev.notes.filter(n => n.id !== id) }));
  }, [update]);
  const updateNote = useCallback((id, text) => {
    update(prev => ({ ...prev, notes: prev.notes.map(n => n.id === id ? { ...n, text } : n) }));
  }, [update]);

  // ── custom routines ───────────────────────────────────────────────────────
  const addCustomRoutine = useCallback((routine) => {
    update(prev => ({ ...prev, customRoutine: [...prev.customRoutine, { ...routine, id: uid() }] }));
  }, [update]);
  const deleteCustomRoutine = useCallback((id) => {
    update(prev => ({ ...prev, customRoutine: prev.customRoutine.filter(r => r.id !== id) }));
  }, [update]);
  const updateCustomRoutine = useCallback((id, data) => {
    update(prev => ({ ...prev, customRoutine: prev.customRoutine.map(r => r.id === id ? { ...r, ...data } : r) }));
  }, [update]);

  // ── archive ───────────────────────────────────────────────────────────────
  const archiveMonth = useCallback(() => {
    update(prev => {
      const today = getTH();
      const key   = getYearMonthKey(prev.viewYear, prev.viewMonth);
      const md    = prev.monthsData[key] || freshMonthData();
      const ws    = md.weekState;
      const ts    = md.trackerState;
      const d30   = getDay30Info(prev.viewYear, prev.viewMonth);
      const numWeeks = getNumWeeksInMonth(prev.viewYear, prev.viewMonth);

      let total = 0, done = 0, skipped = 0;
      const taskLog = [];

      for (let w = 1; w <= numWeeks; w++) {
        const dates = getDatesForWeek(prev.viewYear, prev.viewMonth, w);
        dates.forEach(date => {
          const dayName = dowToName(date.getDay());
          if (dayName === 'Sunday') return;
          const routine = getRoutinesForDay(dayName, w, d30, prev.customRoutine);
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
      const arc = {
        year: prev.viewYear, month: prev.viewMonth,
        label: `${['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน','กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม'][prev.viewMonth]} ${prev.viewYear}`,
        total, done, skipped, pct, taskLog,
        closedAt: today.toISOString(),
      };

      const existing = prev.monthlyArchive.filter(a => !(a.year === prev.viewYear && a.month === prev.viewMonth));

      // Reset the month
      const fresh = freshMonthData();
      const newMonthsData = { ...prev.monthsData, [key]: fresh };

      return {
        ...prev,
        monthlyArchive: [...existing, arc],
        monthsData: newMonthsData,
      };
    });
  }, [update]);

  const deleteArchive = useCallback((year, month) => {
    update(prev => ({
      ...prev,
      monthlyArchive: prev.monthlyArchive.filter(a => !(a.year === year && a.month === month)),
    }));
  }, [update]);

  // ── stats helpers ─────────────────────────────────────────────────────────
  const getDayStats = useCallback((week, day, routines, forYear, forMonth) => {
    if (day === 'Sunday') return { total: 0, done: 0 };
    const key = getYearMonthKey(forYear ?? state.viewYear, forMonth ?? state.viewMonth);
    const ws  = state.monthsData[key]?.weekState;
    const s   = ws?.[week]?.[day];
    if (!s) return { total: 0, done: 0 };
    const total = routines.length + s.editTasks.length;
    const done  = routines.filter((_, i) => s.routineDone[i]).length + s.editTasks.filter(t => t.done).length;
    return { total, done };
  }, [state]);

  const getAllStats = useCallback(() => {
    const d30 = getDay30Info(state.viewYear, state.viewMonth);
    const numWeeks = getNumWeeksInMonth(state.viewYear, state.viewMonth);
    let total = 0, done = 0;
    for (let w = 1; w <= numWeeks; w++) {
      const dates = getDatesForWeek(state.viewYear, state.viewMonth, w);
      dates.forEach(date => {
        const dayName = dowToName(date.getDay());
        if (dayName === 'Sunday') return;
        const routines = getRoutinesForDay(dayName, w, d30, state.customRoutine);
        const st = getDayStats(w, dayName, routines);
        total += st.total;
        done  += st.done;
      });
    }
    return { total, done };
  }, [state, getDayStats]);

  return {
    state, saveStatus, update, toggleTheme,
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
