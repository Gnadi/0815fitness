import type { Activity, ActivitySamples, GearItem, Settings } from '../types';
import { DERIVED_VERSION, deriveActivity } from './derived';
import * as db from './db';

const LEGACY_ACTIVITIES_KEY = 'contour.activities.v1';
const SETTINGS_KEY = 'contour.settings.v1';
const MIGRATION_FLAG = 'contour.migrated.idb';

const DEFAULT_GEAR: GearItem[] = [
  { id: 'g-run-1', sport: 'run', name: 'Running shoes', offsetKm: 0, limitKm: 800, retired: false },
  { id: 'g-ride-1', sport: 'ride', name: 'Bike', offsetKm: 0, limitKm: null, retired: false },
];

export const DEFAULT_SETTINGS: Settings = {
  maxHr: 188,
  lthr: null,
  zoneModel: 'maxhr',
  ftp: null,
  units: 'metric',
  loadModel: 'distance',
  gear: DEFAULT_GEAR,
  plan: [1, 3, 1, 5, 4, 6, 0],
  autoPauseMps: 0.5,
};

/** Fills in the fields gear grew after it was first saved, so a list written by an
 *  earlier build still reads as a list of gear rather than a list of holes. */
function withGearDefaults(g: Partial<GearItem> & Pick<GearItem, 'id' | 'sport' | 'name'>): GearItem {
  return {
    id: g.id,
    sport: g.sport,
    name: g.name,
    offsetKm: g.offsetKm ?? 0,
    limitKm: g.limitKm ?? null,
    retired: g.retired ?? false,
  };
}

export function makeId(): string {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ── settings ──────────────────────────────────────────────────────
/** Settings stay in `localStorage`: they are a kilobyte that every screen wants before
 *  its first paint, and the reason the log moved to IndexedDB — size — does not apply. */
export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    const gear = Array.isArray(parsed.gear)
      ? parsed.gear.map(withGearDefaults)
      : DEFAULT_SETTINGS.gear;
    return { ...DEFAULT_SETTINGS, ...parsed, gear };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Settings that cannot be written are settings that revert on the next launch —
    // worth nothing here, and not worth taking a screen down for.
  }
}

// ── the log ───────────────────────────────────────────────────────
/** Everything an activity carried before the samples were split out of it. */
interface LegacyActivity {
  id: string;
  sport: Activity['sport'];
  startedAt: number;
  endedAt: number;
  title: string;
  notes: string;
  effort: number;
  gearId: string | null;
  points?: ActivitySamples['points'];
  laps?: Activity['laps'];
  hr?: ActivitySamples['hr'];
  power?: ActivitySamples['power'];
  cadence?: ActivitySamples['cadence'];
  distance: number;
  ascent: number;
  demo?: boolean;
}

export function splitLegacyActivity(legacy: LegacyActivity): { activity: Activity; samples: ActivitySamples } {
  const samples: ActivitySamples = {
    id: legacy.id,
    points: legacy.points ?? [],
    hr: legacy.hr ?? [],
    power: legacy.power ?? [],
    cadence: legacy.cadence ?? [],
  };
  const activity: Activity = {
    id: legacy.id,
    sport: legacy.sport,
    startedAt: legacy.startedAt,
    endedAt: legacy.endedAt,
    title: legacy.title,
    notes: legacy.notes ?? '',
    effort: legacy.effort ?? 5,
    gearId: legacy.gearId ?? null,
    laps: legacy.laps ?? [],
    distance: legacy.distance,
    ascent: legacy.ascent,
    source: 'recorded',
    hasSamples: samples.points.length > 0,
    derived: deriveActivity({ sport: legacy.sport, startedAt: legacy.startedAt, endedAt: legacy.endedAt, samples }),
    demo: legacy.demo,
  };
  return { activity, samples };
}

/** Moves a log written by an earlier build out of `localStorage`.
 *
 *  The old key is only cleared once the database transaction has committed, so a
 *  migration interrupted halfway — a tab closed, a quota error — leaves the original
 *  where the next launch will find it rather than between two homes. */
async function migrateFromLocalStorage(): Promise<void> {
  let raw: string | null = null;
  try {
    if (localStorage.getItem(MIGRATION_FLAG)) return;
    raw = localStorage.getItem(LEGACY_ACTIVITIES_KEY);
  } catch {
    return;
  }
  if (!raw) {
    try {
      localStorage.setItem(MIGRATION_FLAG, '1');
    } catch {
      /* nothing to migrate and nowhere to note it: harmless */
    }
    return;
  }

  const parsed = JSON.parse(raw) as LegacyActivity[];
  if (!Array.isArray(parsed)) return;
  await db.putManyActivities(parsed.map(splitLegacyActivity));
  try {
    localStorage.removeItem(LEGACY_ACTIVITIES_KEY);
    localStorage.setItem(MIGRATION_FLAG, '1');
  } catch {
    /* the log is safely in the database; the old copy is only wasted space */
  }
}

/** Re-derives any activity whose stored figures were computed by an older build.
 *
 *  Runs after the log is on screen rather than before it, because it reads every
 *  sample stream of every stale activity — the app should open on the log it has, not
 *  wait behind a recomputation of it. */
export async function refreshStaleDerived(activities: Activity[]): Promise<Activity[] | null> {
  const stale = activities.filter((a) => a.hasSamples && (a.derived?.version ?? 0) < DERIVED_VERSION);
  if (stale.length === 0) return null;
  const samplesById = await db.getManySamples(stale.map((a) => a.id));
  const updated: { activity: Activity; samples: null }[] = [];
  for (const a of stale) {
    const samples = samplesById.get(a.id);
    if (!samples) continue;
    updated.push({
      activity: { ...a, derived: deriveActivity({ sport: a.sport, startedAt: a.startedAt, endedAt: a.endedAt, samples }) },
      samples: null,
    });
  }
  if (updated.length === 0) return null;
  await db.putManyActivities(updated);
  const byId = new Map(updated.map((u) => [u.activity.id, u.activity]));
  return activities.map((a) => byId.get(a.id) ?? a);
}

export async function loadActivities(): Promise<Activity[]> {
  await migrateFromLocalStorage();
  return db.getAllActivities();
}

export async function addActivity(activity: Activity, samples: ActivitySamples | null): Promise<void> {
  await db.putActivity(activity, samples);
}

export async function updateActivity(activity: Activity): Promise<void> {
  await db.putActivitySummary(activity);
}

export async function removeActivity(id: string): Promise<void> {
  await db.deleteActivity(id);
}

export async function replaceAllActivities(entries: { activity: Activity; samples: ActivitySamples | null }[]): Promise<void> {
  await db.clearActivities();
  await db.putManyActivities(entries);
}

export async function clearDemoActivities(activities: Activity[]): Promise<void> {
  await db.deleteActivities(activities.filter((a) => a.demo).map((a) => a.id));
}

export const putManyActivities = db.putManyActivities;
export const getSamples = db.getSamples;
export const getManySamples = db.getManySamples;
export const storageUsage = db.storageUsage;
