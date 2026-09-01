// Synthetic sample history — used only behind an explicit "Load sample history" action
// on the empty-state screens, so Overview/Analyse have something real to compute over
// before the user has recorded anything themselves. Never seeded automatically.
import type { Activity, ActivitySamples, GeoSample, HrSample, PowerSample, CadenceSample, Sport } from '../types';
import { makeId } from './storage';
import { deriveActivity } from './derived';
import { cumulativeDistance, totalAscent } from './geo';

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const ORIGIN = { lat: 48.3069, lon: 14.2858 }; // Linz, Austria
const M_PER_DEG_LAT = 111320;
const SAMPLE_S = 20;

const ROUTE_NAMES: Record<Sport, string[]> = {
  run: ['Pöstlingberg Climb', 'Traunsee Runde', 'Donauufer Loop', 'Altstadt Runde', 'Freinberg Trail'],
  ride: ['Donauradweg Loop', 'Mühlviertel Loop', 'Traunsee Runde', 'Pöstlingberg Climb'],
};

/** Walks a route one sample at a time, stepping the real distance covered in each
 *  interval along a smoothly turning bearing, so the generated GPS track measures
 *  what it claims to and paces come out realistic. */
function genPath(distanceM: number, speedMps: number, startedAt: number, shapeSeed: number): GeoSample[] {
  const stepM = speedMps * SAMPLE_S;
  const n = Math.max(8, Math.round(distanceM / stepM));
  const baseBearing = (shapeSeed % 360) * (Math.PI / 180);
  const points: GeoSample[] = [];
  let lat = ORIGIN.lat + Math.sin(shapeSeed) * 0.004;
  let lon = ORIGIN.lon + Math.cos(shapeSeed) * 0.006;

  for (let i = 0; i <= n; i++) {
    const f = i / n;
    const ele =
      280 +
      Math.sin(shapeSeed + f * Math.PI * 2.2) * 42 +
      Math.sin(shapeSeed * 2 + f * 11) * 8 +
      (shapeSeed % 2 === 0 ? f * 12 : -f * 6);
    points.push({ t: startedAt + i * SAMPLE_S * 1000, lat, lon, ele, accuracy: 4 + (i % 3) });

    // Turn steadily so the track closes into a loop rather than running off in a line.
    const bearing = baseBearing + f * Math.PI * 2 + Math.sin(shapeSeed + f * 6) * 0.5;
    const mPerDegLon = M_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
    lat += (Math.sin(bearing) * stepM) / M_PER_DEG_LAT;
    lon += (Math.cos(bearing) * stepM) / mPerDegLon;
  }
  return points;
}

function genHr(startedAt: number, durationS: number, targetPct: number, maxHr: number, rand: () => number): HrSample[] {
  const n = Math.max(4, Math.round(durationS / SAMPLE_S));
  const samples: HrSample[] = [];
  const base = maxHr * targetPct;
  for (let i = 0; i <= n; i++) {
    const drift = Math.sin(i / 8) * 3 + (rand() - 0.5) * 4 + (i / n) * 4; // slow upward drift
    const warmup = i < n * 0.08 ? -(1 - i / (n * 0.08)) * 18 : 0;
    samples.push({ t: startedAt + i * SAMPLE_S * 1000, bpm: Math.round(base + drift + warmup) });
  }
  return samples;
}

function genPower(startedAt: number, durationS: number, targetW: number, rand: () => number): PowerSample[] {
  const n = Math.max(4, Math.round(durationS / SAMPLE_S));
  const samples: PowerSample[] = [];
  for (let i = 0; i <= n; i++) {
    const surge = rand() < 0.05 ? targetW * (0.5 + rand() * 1.1) : 0;
    samples.push({ t: startedAt + i * SAMPLE_S * 1000, watts: Math.max(0, Math.round(targetW + (rand() - 0.5) * 44 + surge)) });
  }
  return samples;
}

function genCadence(startedAt: number, durationS: number, targetRpm: number, rand: () => number): CadenceSample[] {
  const n = Math.max(4, Math.round(durationS / SAMPLE_S));
  const samples: CadenceSample[] = [];
  for (let i = 0; i <= n; i++) {
    samples.push({ t: startedAt + i * SAMPLE_S * 1000, rpm: Math.round(targetRpm + (rand() - 0.5) * 6) });
  }
  return samples;
}

interface SessionPlan {
  sport: Sport;
  km: number;
  paceSecPerKm?: number;
  speedKmh?: number;
  watts?: number;
  hrPct: number;
  startHour: number;
}

/** A believable amateur week: two quality runs, two easy runs, a long run, an
 *  endurance ride and a long ride, one or two rest days. Volumes track the brief —
 *  50–70 km running around 5:00–5:30/km, 120–200 km riding at 180–230 W. */
function sessionFor(dow: number, rand: () => number, ramp: number): SessionPlan | null {
  const skip = rand() < 0.12; // the occasional missed session
  switch (dow) {
    case 0:
      return skip ? null : { sport: 'run', km: 10 * ramp, paceSecPerKm: 318 + rand() * 18, hrPct: 0.62, startHour: 6.5 };
    case 1:
      return skip ? null : { sport: 'run', km: 12 * ramp, paceSecPerKm: 268 + rand() * 14, hrPct: 0.86, startHour: 17.5 };
    case 2:
      return rand() < 0.35 ? { sport: 'ride', km: 45 * ramp, speedKmh: 29 + rand() * 3, watts: 188 + rand() * 22, hrPct: 0.6, startHour: 17 } : null;
    case 3:
      return skip ? null : { sport: 'run', km: 9 * ramp, paceSecPerKm: 322 + rand() * 16, hrPct: 0.61, startHour: 6.5 };
    case 4:
      return skip ? null : { sport: 'run', km: 14 * ramp, paceSecPerKm: 300 + rand() * 14, hrPct: 0.75, startHour: 17 };
    case 5:
      return { sport: 'ride', km: (95 + rand() * 45) * ramp, speedKmh: 28 + rand() * 4, watts: 196 + rand() * 26, hrPct: 0.63, startHour: 9 };
    default:
      return { sport: 'run', km: (18 + rand() * 5) * ramp, paceSecPerKm: 312 + rand() * 16, hrPct: 0.66, startHour: 9 };
  }
}

export interface DemoEntry {
  activity: Activity;
  samples: ActivitySamples;
}

export function generateDemoHistory(maxHr: number, weeks = 13): DemoEntry[] {
  const rand = mulberry32(20260830);
  const entries: DemoEntry[] = [];
  const totalDays = weeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = totalDays - 1; dayOffset >= 0; dayOffset--) {
    const date = new Date(today);
    date.setDate(date.getDate() - dayOffset);
    const dow = (date.getDay() + 6) % 7; // Monday = 0
    const weekIdx = Math.floor((totalDays - 1 - dayOffset) / 7);
    // Three-weeks-up, one-week-down periodisation across the demo window.
    const ramp = (0.84 + (weekIdx / weeks) * 0.26) * (weekIdx % 4 === 3 ? 0.78 : 1);
    const plan = sessionFor(dow, rand, ramp);
    if (!plan) continue;

    const startedAt = date.getTime() + plan.startHour * 3600 * 1000 + rand() * 1800 * 1000;
    if (startedAt > Date.now()) continue; // never seed a session in the future

    const speedMps = plan.sport === 'run' ? 1000 / (plan.paceSecPerKm ?? 320) : ((plan.speedKmh ?? 30) * 1000) / 3600;
    const nominalM = plan.km * 1000;

    // The day of the week picks the route, and the route picks the shape — so the same
    // loop comes back week after week, at the distance that week's volume calls for,
    // and the sample history has real repeats in it to read.
    const names = ROUTE_NAMES[plan.sport];
    const nameIdx = dow % names.length;
    const name = names[nameIdx];
    const points = genPath(nominalM, speedMps, startedAt, nameIdx * 7 + (plan.sport === 'run' ? 0 : 3));
    const distance = cumulativeDistance(points);
    const durationS = (points[points.length - 1].t - startedAt) / 1000;

    const hour = new Date(startedAt).getHours();
    const timeOfDay = hour < 11 ? 'Morning' : hour < 17 ? 'Midday' : 'Evening';

    const id = makeId();
    const samples: ActivitySamples = {
      id,
      points,
      hr: genHr(startedAt, durationS, plan.hrPct, maxHr, rand),
      power: plan.sport === 'ride' ? genPower(startedAt, durationS, plan.watts ?? 210, rand) : [],
      cadence: genCadence(startedAt, durationS, plan.sport === 'run' ? 174 + rand() * 6 : 86 + rand() * 6, rand),
    };
    const endedAt = startedAt + durationS * 1000;

    entries.push({
      activity: {
        id,
        sport: plan.sport,
        startedAt,
        endedAt,
        title: `${timeOfDay} ${plan.sport === 'run' ? 'Run' : 'Ride'} · ${name}`,
        notes: '',
        effort: plan.hrPct > 0.82 ? 8 : plan.hrPct > 0.7 ? 6 : 4,
        gearId: plan.sport === 'run' ? 'g-run-1' : 'g-ride-1',
        laps: [],
        distance,
        ascent: Math.round(totalAscent(points)),
        source: 'recorded',
        hasSamples: true,
        derived: deriveActivity({ sport: plan.sport, startedAt, endedAt, samples }),
        demo: true,
      },
      samples,
    });
  }

  return entries.sort((a, b) => b.activity.startedAt - a.activity.startedAt);
}
