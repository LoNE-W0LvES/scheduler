// Thin wrapper around the local Express API

const BASE = '/api';

export async function apiLoad(year = null) {
  const url = year ? `${BASE}/load?year=${year}` : `${BASE}/load`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Load failed');
  const { data } = await res.json();
  return data; // null on first run
}

export async function apiSave(state) {
  const res = await fetch(`${BASE}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
  });
  if (!res.ok) throw new Error('Save failed');
  return res.json();
}
