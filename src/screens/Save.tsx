import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label } from '../components/primitives';
import { ElevationProfile } from '../components/charts';
import { fmtClock } from '../lib/stats';
import { haversineMeters } from '../lib/geo';
import { deriveActivity, thinElevation } from '../lib/derived';
import { makeId } from '../lib/storage';
import { useUnits } from '../hooks/useUnits';
import type { Activity, ActivitySamples, Settings } from '../types';
import type { ActivityDraft } from './RecordingSession';

const EFFORT_WORDS = ['Recovery', 'Very easy', 'Easy', 'Steady', 'Moderate', 'Comfortably hard', 'Hard', 'Very hard', 'Near maximal', 'All out'];

function prefersReducedMotion(): boolean {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Reuses the name of a previously recorded activity that started within ~250 m of
 *  this one — the closest thing to a route name we can derive on-device without
 *  calling out to a geocoder. The start point comes from the stored route signature,
 *  so this costs no sample stream to read. */
function autoTitle(draft: ActivityDraft, activities: Activity[]): string {
  const hour = new Date(draft.startedAt).getHours();
  const timeOfDay = hour < 11 ? 'Morning' : hour < 17 ? 'Midday' : 'Evening';
  const base = `${timeOfDay} ${draft.sport === 'run' ? 'Run' : 'Ride'}`;
  const start = draft.points[0];
  if (!start) return base;
  const near = activities.find((a) => {
    const route = a.derived.route;
    if (!route || a.sport !== draft.sport) return false;
    return haversineMeters(route, start) < 250 && a.title.includes('·');
  });
  if (!near) return base;
  const routeName = near.title.split('·').slice(1).join('·').trim();
  return routeName ? `${base} · ${routeName}` : base;
}

export function SaveScreen({
  draft,
  settings,
  activities,
  onSave,
  onDiscard,
}: {
  draft: ActivityDraft;
  settings: Settings;
  activities: Activity[];
  onSave: (a: Activity, samples: ActivitySamples | null) => void;
  onDiscard: () => void;
}) {
  const units = useUnits();
  const gearForSport = settings.gear.filter((g) => g.sport === draft.sport && !g.retired);
  const [title, setTitle] = useState(() => autoTitle(draft, activities));
  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState(6);
  const [gearId, setGearId] = useState<string | null>(gearForSport[0]?.id ?? null);
  const [count, setCount] = useState(() => (prefersReducedMotion() ? 1 : 0));
  const raf = useRef<number | null>(null);

  // The one orchestrated moment in the system: summary fields count up once, 320ms.
  useEffect(() => {
    if (prefersReducedMotion()) return;
    const t0 = performance.now();
    const step = () => {
      const p = Math.min(1, (performance.now() - t0) / 320);
      setCount(p);
      if (p < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, []);

  const run = draft.sport === 'run';
  const durationS = (draft.endedAt - draft.startedAt) / 1000;
  const avgSpeed = durationS > 0 ? draft.distance / durationS : 0;
  const avgPaceSec = avgSpeed > 0.2 ? 1000 / avgSpeed : null;

  const summary = [
    { label: 'Distance', value: units.fmtDistance(draft.distance * count, 2), unit: units.distanceUnit },
    { label: 'Time', value: fmtClock(durationS * count), unit: run ? 'moving' : 'elapsed' },
    {
      label: run ? 'Avg pace' : 'Avg speed',
      value: run ? (avgPaceSec ? units.fmtPace(avgPaceSec) : '—:—') : units.fmtSpeed(avgSpeed),
      unit: run ? units.paceUnit.replace('/', 'min/') : units.speedUnit,
    },
  ];

  const gearKm = useMemo(() => {
    const totals = new Map<string, number>();
    for (const a of activities) {
      if (!a.gearId) continue;
      totals.set(a.gearId, (totals.get(a.gearId) ?? 0) + a.distance / 1000);
    }
    return totals;
  }, [activities]);

  const elevations = useMemo(() => thinElevation(draft.points), [draft.points]);
  const hasElevation = elevations.length > 2;

  const save = () => {
    const id = makeId();
    const samples: ActivitySamples = {
      id,
      points: draft.points,
      hr: draft.hr,
      power: draft.power,
      cadence: draft.cadence,
    };
    onSave(
      {
        id,
        sport: draft.sport,
        startedAt: draft.startedAt,
        endedAt: draft.endedAt,
        title: title.trim() || autoTitle(draft, activities),
        notes,
        effort,
        gearId,
        laps: draft.laps,
        distance: draft.distance,
        ascent: draft.ascent,
        source: 'recorded',
        hasSamples: samples.points.length > 0,
        // Everything the aggregate screens will read off this session is swept out of
        // its samples once, here, rather than on every screen that shows it.
        derived: deriveActivity({ sport: draft.sport, startedAt: draft.startedAt, endedAt: draft.endedAt, samples }),
      },
      samples.points.length > 0 ? samples : null,
    );
  };

  const sectionStyle: CSSProperties = { flex: 'none', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 };

  return (
    <div style={S.screen}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 12px', borderBottom: `1px solid ${color.dividerHairline}` }}>
        <button onClick={onDiscard} style={{ background: 'none', border: 'none', padding: 0, fontSize: 15, color: color.textMuted, cursor: 'pointer' }}>
          Discard
        </button>
        <span style={S.heading}>Save activity</span>
        <button
          onClick={save}
          style={{
            padding: '0 14px',
            height: 34,
            borderRadius: 999,
            background: 'none',
            border: `1px solid ${color.accent}`,
            color: color.accent,
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Save
        </button>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '16px 0 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {draft.recovered && (
          <div style={{ flex: 'none', margin: '0 16px', padding: 12, border: `1px solid ${color.warning}`, borderRadius: 8 }}>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: color.warning }}>
              Recovered from an interrupted recording. Everything captured up to the last checkpoint is here; anything after it is not.
            </span>
          </div>
        )}

        <div style={{ flex: 'none', margin: '0 16px', border: `1px solid ${color.border}`, borderRadius: 8, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, background: color.dividerHairline }}>
            {summary.map((m) => (
              <div key={m.label} style={{ background: color.surface, padding: '12px 12px 14px', display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Label>{m.label}</Label>
                <span style={{ ...S.metric, fontWeight: 600, color: color.text }}>{m.value}</span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{m.unit}</span>
              </div>
            ))}
          </div>
          <div style={{ background: color.surfaceSunk, borderTop: `1px solid ${color.dividerHairline}`, padding: '10px 12px 0' }}>
            <Label>Elevation · {units.fmtElevation(draft.ascent)} {units.elevationUnit} ascent</Label>
            {hasElevation ? (
              <ElevationProfile elevations={elevations} />
            ) : (
              <div style={{ padding: '14px 0 16px', fontSize: 12, color: color.textFaint }}>
                No altitude from this device's GPS — distance, pace and time were still recorded.
              </div>
            )}
          </div>
        </div>

        <div style={sectionStyle}>
          <Label>Title</Label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 12px',
              background: color.surface,
              border: `1px solid ${color.border}`,
              borderRadius: 4,
              color: color.text,
              fontSize: 15,
            }}
          />
          <span style={{ fontSize: 12, color: color.textFaint }}>Auto-titled from time of day, and the route name if you've run it before.</span>
        </div>

        <div style={sectionStyle}>
          <Label>Perceived effort</Label>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
              const on = n === effort;
              return (
                <button
                  key={n}
                  onClick={() => setEffort(n)}
                  style={{
                    flex: 1,
                    height: 38,
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontFamily: font.mono,
                    fontSize: 14,
                    fontWeight: 500,
                    ...(on
                      ? { background: color.accentWash, color: color.accent, border: `1px solid ${color.accent}` }
                      : { background: color.surface, color: color.textMuted, border: `1px solid ${color.border}` }),
                  }}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <span style={{ fontSize: 13, color: color.textMuted }}>
            {effort} / 10 · {EFFORT_WORDS[effort - 1]}
          </span>
        </div>

        <div style={sectionStyle}>
          <Label>{run ? 'Shoes' : 'Bike'}</Label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, background: color.dividerHairline, border: `1px solid ${color.border}`, borderRadius: 8, overflow: 'hidden' }}>
            {gearForSport.map((g) => (
              <button
                key={g.id}
                onClick={() => setGearId(g.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 12, border: 'none', background: color.surface, cursor: 'pointer' }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    flex: 'none',
                    boxSizing: 'border-box',
                    border: `1px solid ${gearId === g.id ? color.accent : color.borderStrong}`,
                    background: gearId === g.id ? color.accent : 'transparent',
                    boxShadow: gearId === g.id ? `inset 0 0 0 3px ${color.background}` : undefined,
                  }}
                />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: color.text }}>{g.name}</span>
                  <span style={{ ...S.tableNum, color: color.textMuted }}>
                  {units.fmtDistance((g.offsetKm + (gearKm.get(g.id) ?? 0)) * 1000, 0)} {units.distanceUnit}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div style={sectionStyle}>
          <Label>Notes</Label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional — how it felt, weather, anything worth remembering."
            style={{
              width: '100%',
              boxSizing: 'border-box',
              minHeight: 76,
              resize: 'none',
              padding: '11px 12px',
              background: color.surface,
              border: `1px solid ${color.border}`,
              borderRadius: 4,
              color: color.text,
              fontSize: 15,
              lineHeight: 1.45,
            }}
          />
        </div>

        <div style={{ ...sectionStyle, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, background: color.surface, border: `1px solid ${color.border}`, borderRadius: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color.positive} strokeWidth="2" strokeLinecap="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          <span style={{ fontSize: 13, color: color.textMuted }}>
            Saved on device. {run ? 'Splits and zones land in Analyse.' : draft.power.length > 1 ? 'Power curve updates in Analyse.' : 'Power curve needs a paired meter.'}
          </span>
        </div>
      </div>
    </div>
  );
}
