import type { Activity, ActivitySamples, Settings } from '../types';
import { deriveActivity, emptySamples, manualDerived } from './derived';
import { getManySamples, makeId, splitLegacyActivity } from './storage';

/** Getting the log off the device, and back onto one.
 *
 *  Everything here is local: a file the browser hands to the person, and a file they
 *  hand back. It is the only way a training log survives a cleared site, a lost phone or
 *  a move to a new one, and the only route out to anything else — which for a training
 *  file means GPX. */

export const EXPORT_FORMAT = 'contour-log';
export const EXPORT_VERSION = 1;

export interface LogExport {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: number;
  settings?: Settings;
  activities: (Activity & { samples: ActivitySamples })[];
}

export async function buildExport(activities: Activity[], settings: Settings): Promise<LogExport> {
  const samplesById = await getManySamples(activities.filter((a) => a.hasSamples).map((a) => a.id));
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: Date.now(),
    settings,
    activities: activities.map((a) => ({ ...a, samples: samplesById.get(a.id) ?? emptySamples(a.id) })),
  };
}

export interface ImportResult {
  entries: { activity: Activity; samples: ActivitySamples | null }[];
  settings: Settings | null;
  skipped: number;
}

/** What an import of any supported file amounts to — a backup, or a single GPX track. */
export type ImportOutcome = ImportResult;

function isFiniteNumber(v: unknown): v is number {
  return typeof v === 'number' && isFinite(v);
}

/** Reads a file this app wrote, or the raw array an early build kept in `localStorage`.
 *
 *  Every activity is re-derived from whatever samples it carries rather than trusting
 *  the figures in the file: an export written by an older build was derived by an older
 *  build, and a hand-edited one may not have been derived at all. */
export function parseExport(text: string): ImportResult {
  const parsed: unknown = JSON.parse(text);
  const raw: unknown[] = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as LogExport)?.activities)
      ? (parsed as LogExport).activities
      : [];
  if (raw.length === 0 && !Array.isArray(parsed)) throw new Error('This file has no activities in it.');

  const settings = !Array.isArray(parsed) && (parsed as LogExport).settings ? ((parsed as LogExport).settings as Settings) : null;

  const entries: ImportResult['entries'] = [];
  let skipped = 0;
  for (const item of raw) {
    const a = item as Partial<Activity> & { samples?: ActivitySamples; points?: ActivitySamples['points'] };
    if (!a || typeof a !== 'object' || !isFiniteNumber(a.startedAt) || !isFiniteNumber(a.distance) || (a.sport !== 'run' && a.sport !== 'ride')) {
      skipped++;
      continue;
    }

    // An export carries its samples in a nested object; the log an early build kept in
    // `localStorage` carried them on the activity itself.
    if (a.samples) {
      const samples: ActivitySamples = { ...a.samples, id: a.id ?? makeId() };
      const startedAt = a.startedAt;
      const endedAt = isFiniteNumber(a.endedAt) ? a.endedAt : startedAt;
      const hasSamples = samples.points.length > 0;
      entries.push({
        activity: {
          id: samples.id,
          sport: a.sport,
          startedAt,
          endedAt,
          title: a.title ?? 'Imported activity',
          notes: a.notes ?? '',
          effort: a.effort ?? 5,
          gearId: a.gearId ?? null,
          laps: a.laps ?? [],
          distance: a.distance,
          ascent: a.ascent ?? 0,
          source: a.source ?? 'imported',
          hasSamples,
          derived: hasSamples
            ? deriveActivity({ sport: a.sport, startedAt, endedAt, samples })
            : manualDerived({ movingS: (endedAt - startedAt) / 1000 }),
          demo: a.demo,
        },
        samples: hasSamples ? samples : null,
      });
      continue;
    }

    const split = splitLegacyActivity({
      id: a.id ?? makeId(),
      sport: a.sport,
      startedAt: a.startedAt,
      endedAt: isFiniteNumber(a.endedAt) ? a.endedAt : a.startedAt,
      title: a.title ?? 'Imported activity',
      notes: a.notes ?? '',
      effort: a.effort ?? 5,
      gearId: a.gearId ?? null,
      points: a.points ?? [],
      laps: a.laps ?? [],
      distance: a.distance,
      ascent: a.ascent ?? 0,
      demo: a.demo,
    });
    entries.push({ activity: { ...split.activity, source: 'imported' }, samples: split.samples.points.length ? split.samples : null });
  }

  if (entries.length === 0) throw new Error('No readable activities in this file.');
  return { entries, settings, skipped };
}

// ── GPX ───────────────────────────────────────────────────────────
function xmlEscape(value: string): string {
  return value.replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c] as string);
}

/** Nearest sample at or before `t` from a time-ordered stream, walked with a cursor the
 *  caller keeps — the track and its sensor streams are both in time order, so pairing
 *  them is one pass, not a search per point. */
function makeSampleWalker<T extends { t: number }>(samples: T[]) {
  let i = 0;
  return (t: number): T | null => {
    while (i < samples.length - 1 && samples[i + 1].t <= t) i++;
    const s = samples[i];
    return s && Math.abs(s.t - t) <= 30000 ? s : null;
  };
}

/** GPX 1.1 with Garmin's TrackPointExtension, which is what every other training tool
 *  reads heart rate, cadence and power out of. */
export function toGpx(activity: Activity, samples: ActivitySamples): string {
  const hrAt = makeSampleWalker(samples.hr);
  const cadenceAt = makeSampleWalker(samples.cadence);
  const powerAt = makeSampleWalker(samples.power);

  const points = samples.points
    .map((p) => {
      const hr = hrAt(p.t);
      const cadence = cadenceAt(p.t);
      const power = powerAt(p.t);
      const extensions: string[] = [];
      if (power) extensions.push(`<power>${Math.round(power.watts)}</power>`);
      const trackPoint: string[] = [];
      if (hr) trackPoint.push(`<gpxtpx:hr>${Math.round(hr.bpm)}</gpxtpx:hr>`);
      if (cadence) trackPoint.push(`<gpxtpx:cad>${Math.round(cadence.rpm)}</gpxtpx:cad>`);
      if (trackPoint.length) extensions.push(`<gpxtpx:TrackPointExtension>${trackPoint.join('')}</gpxtpx:TrackPointExtension>`);
      return [
        `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lon.toFixed(7)}">`,
        p.ele != null ? `        <ele>${p.ele.toFixed(1)}</ele>` : null,
        `        <time>${new Date(p.t).toISOString()}</time>`,
        extensions.length ? `        <extensions>${extensions.join('')}</extensions>` : null,
        '      </trkpt>',
      ]
        .filter(Boolean)
        .join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Contour" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <metadata>
    <name>${xmlEscape(activity.title)}</name>
    <time>${new Date(activity.startedAt).toISOString()}</time>
  </metadata>
  <trk>
    <name>${xmlEscape(activity.title)}</name>
    <type>${activity.sport === 'run' ? 'running' : 'cycling'}</type>
    <trkseg>
${points}
    </trkseg>
  </trk>
</gpx>
`;
}

const TRKPT_RE = /<trkpt\b[^>]*\blat="([-\d.]+)"[^>]*\blon="([-\d.]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
const TAG_RE = (tag: string) => new RegExp(`<(?:\\w+:)?${tag}[^>]*>([^<]*)<`);

/** Reads a GPX track back in.
 *
 *  Scanned rather than DOM-parsed: a track point is a flat, predictable element, and a
 *  scan works the same in a browser and in a test without pulling in a parser or a DOM
 *  for the app to carry offline. Anything it cannot read it skips, and says how many. */
export function parseGpx(text: string, fallbackName = 'Imported activity'): {
  name: string;
  sport: 'run' | 'ride';
  samples: ActivitySamples;
} {
  const id = makeId();
  const samples = emptySamples(id);
  let match: RegExpExecArray | null;
  TRKPT_RE.lastIndex = 0;
  while ((match = TRKPT_RE.exec(text)) != null) {
    const lat = Number(match[1]);
    const lon = Number(match[2]);
    const body = match[3];
    const timeText = TAG_RE('time').exec(body)?.[1];
    const t = timeText ? Date.parse(timeText) : NaN;
    if (!isFinite(lat) || !isFinite(lon) || !isFinite(t)) continue;
    const ele = Number(TAG_RE('ele').exec(body)?.[1]);
    samples.points.push({ t, lat, lon, ele: isFinite(ele) ? ele : undefined });

    const hr = Number(TAG_RE('hr').exec(body)?.[1]);
    if (isFinite(hr) && hr > 0) samples.hr.push({ t, bpm: hr });
    const cadence = Number(TAG_RE('cad').exec(body)?.[1]);
    if (isFinite(cadence) && cadence > 0) samples.cadence.push({ t, rpm: cadence });
    const watts = Number(TAG_RE('power').exec(body)?.[1]);
    if (isFinite(watts) && watts > 0) samples.power.push({ t, watts });
  }
  if (samples.points.length < 2) throw new Error('No track points in this GPX file.');
  samples.points.sort((a, b) => a.t - b.t);

  const typeText = TAG_RE('type').exec(text)?.[1]?.toLowerCase() ?? '';
  const sport = /cycl|bike|ride/.test(typeText) ? 'ride' : 'run';
  const name = TAG_RE('name').exec(text)?.[1]?.trim() || fallbackName;
  return { name, sport, samples };
}

// ── handing files to the browser ──────────────────────────────────
export function downloadFile(name: string, mime: string, contents: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type: mime }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = name;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Revoked on the next turn of the loop rather than immediately: Safari has not
  // finished with the URL when `click()` returns.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportFileName(prefix: string, at = Date.now(), extension = 'json'): string {
  const d = new Date(at);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${prefix}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${extension}`;
}
