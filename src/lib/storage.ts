import type { Activity, Settings, GearItem } from '../types';

const ACTIVITIES_KEY = 'contour.activities.v1';
const SETTINGS_KEY = 'contour.settings.v1';

const DEFAULT_GEAR: GearItem[] = [
  { id: 'g-run-1', sport: 'run', name: 'Running shoes' },
  { id: 'g-ride-1', sport: 'ride', name: 'Bike' },
];

const DEFAULT_SETTINGS: Settings = {
  maxHr: 188,
  gear: DEFAULT_GEAR,
  plan: [1, 3, 1, 5, 4, 6, 0],
};

export function loadActivities(): Activity[] {
  try {
    const raw = localStorage.getItem(ACTIVITIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Activity[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveActivities(activities: Activity[]): void {
  localStorage.setItem(ACTIVITIES_KEY, JSON.stringify(activities));
}

export function addActivity(activity: Activity): Activity[] {
  const all = [...loadActivities(), activity].sort((a, b) => b.startedAt - a.startedAt);
  saveActivities(all);
  return all;
}

export function clearDemoActivities(): Activity[] {
  const remaining = loadActivities().filter((a) => !a.demo);
  saveActivities(remaining);
  return remaining;
}

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function makeId(): string {
  return (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}
