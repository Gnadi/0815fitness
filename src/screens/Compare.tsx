import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, RouteSilhouette, SectionHeader } from '../components/primitives';
import { CompareSeriesChart } from '../components/charts';
import { StatusStrip } from '../components/PhoneFrame';
import { elevationProfile, fmtClock, fmtDayMonth, fmtEuroDate, fmtPace } from '../lib/stats';
import {
  bestIndex,
  buildComparands,
  metricSpecs,
  seriesByDistance,
  MAX_COMPARE,
  type Comparand,
} from '../lib/compare';
import type { Activity, Sport } from '../types';

const BUCKETS = 56;
const FULL_SPLIT_M = 950; // a part-kilometre at the end is not a split to compare

export function Compare({
  activities,
  initialIds,
  onBack,
}: {
  activities: Activity[];
  initialIds: string[];
  onBack: () => void;
}) {
  const seed = useMemo(() => {
    const picked = initialIds.map((id) => activities.find((a) => a.id === id)).filter((a): a is Activity => a != null);
    const sport = picked[0]?.sport ?? 'run';
    return { sport, ids: picked.filter((a) => a.sport === sport).slice(0, MAX_COMPARE).map((a) => a.id) };
  }, [initialIds, activities]);

  const [sport, setSport] = useState<Sport>(seed.sport);
  const [selected, setSelected] = useState<string[]>(seed.ids);
  const [mode, setMode] = useState<'pick' | 'view'>(seed.ids.length >= 2 ? 'view' : 'pick');

  const pool = useMemo(
    () => activities.filter((a) => a.sport === sport).sort((a, b) => b.startedAt - a.startedAt),
    [activities, sport],
  );

  // Pick order is meaningful: the first session is the reference every delta is against.
  const chosen = useMemo(
    () => selected.map((id) => activities.find((a) => a.id === id)).filter((a): a is Activity => a != null),
    [selected, activities],
  );
  const comparands = useMemo(() => buildComparands(chosen), [chosen]);

  const toggle = (id: string) => {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : cur.length >= MAX_COMPARE ? cur : [...cur, id]));
  };

  const switchSport = (next: Sport) => {
    if (next === sport) return;
    setSport(next);
    setSelected([]); // pace against speed is not a comparison
  };

  const noun = sport === 'run' ? 'run' : 'ride';

  return (
    <div style={S.screen}>
      <StatusStrip />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            onClick={() => (mode === 'view' ? setMode('pick') : onBack())}
            aria-label={mode === 'view' ? 'Back to selection' : 'Back to overview'}
            style={{ background: 'none', border: 'none', color: color.textFaint, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 6px 0 0' }}
          >
            ‹
          </button>
          <span style={S.title}>Compare</span>
        </div>
        {mode === 'view' ? (
          <button onClick={() => setMode('pick')} style={S.linkButton}>
            EDIT
          </button>
        ) : (
          <div style={{ display: 'flex', border: `1px solid ${color.border}`, borderRadius: 999, overflow: 'hidden' }}>
            {(['run', 'ride'] as Sport[]).map((s) => (
              <button key={s} onClick={() => switchSport(s)} style={sportTabStyle(s === sport)}>
                {s.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      {mode === 'pick' ? (
        <PickList pool={pool} selected={selected} onToggle={toggle} noun={noun} onDone={() => setMode('view')} />
      ) : (
        <CompareView comparands={comparands} sport={sport} />
      )}
    </div>
  );
}

function sportTabStyle(active: boolean): CSSProperties {
  return {
    background: active ? color.accentWash : 'none',
    border: 'none',
    padding: '6px 13px',
    cursor: 'pointer',
    fontFamily: font.mono,
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '.08em',
    color: active ? color.text : color.textFaint,
  };
}

// ── picking the sessions ──────────────────────────────────────────
function PickList({
  pool,
  selected,
  onToggle,
  noun,
  onDone,
}: {
  pool: Activity[];
  selected: string[];
  onToggle: (id: string) => void;
  noun: string;
  onDone: () => void;
}) {
  const full = selected.length >= MAX_COMPARE;

  return (
    <>
      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 100 }}>
        <span style={{ display: 'block', padding: '0 16px 14px', fontSize: 13, lineHeight: 1.45, color: color.textMuted, textWrap: 'pretty' }}>
          Pick two or three {noun}s. The first one you pick is the reference — every difference below is measured against it.
        </span>
        {pool.length === 0 ? (
          <span style={{ padding: '0 16px', ...S.body, color: color.textMuted }}>Nothing recorded for this sport yet.</span>
        ) : (
          pool.map((a) => {
            const idx = selected.indexOf(a.id);
            const on = idx >= 0;
            const durationS = (a.endedAt - a.startedAt) / 1000;
            const speed = durationS > 0 ? a.distance / durationS : 0;
            const metric =
              a.sport === 'run'
                ? `${(a.distance / 1000).toFixed(1)} km · ${speed > 0.2 ? fmtPace(1000 / speed) : '—:—'}`
                : `${(a.distance / 1000).toFixed(1)} km · ${(speed * 3.6).toFixed(1)} km/h`;
            const blocked = !on && full;
            return (
              <button
                key={a.id}
                onClick={() => onToggle(a.id)}
                disabled={blocked}
                aria-pressed={on}
                style={{
                  ...S.listRow,
                  width: '100%',
                  background: on ? 'rgba(139,132,247,0.08)' : 'none',
                  border: 'none',
                  borderTop: `1px solid ${color.dividerHairline}`,
                  cursor: blocked ? 'default' : 'pointer',
                  opacity: blocked ? 0.4 : 1,
                  textAlign: 'left',
                }}
              >
                <span
                  style={{
                    flex: 'none',
                    width: 20,
                    height: 20,
                    borderRadius: 999,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: font.mono,
                    fontSize: 11,
                    fontWeight: 600,
                    color: on ? color.onAccent : 'transparent',
                    background: on ? color.accent : 'none',
                    border: on ? 'none' : `1px solid ${color.borderStrong}`,
                  }}
                >
                  {on ? idx + 1 : '·'}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 34, fontFeatureSettings: "'tnum' 1" }}>
                  {fmtDayMonth(a.startedAt)}
                </span>
                <RouteSilhouette elevations={elevationProfile(a)} width={44} />
                <span style={{ flex: 1, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                <span style={{ ...S.tableNum, color: color.textMuted, whiteSpace: 'nowrap' }}>{metric}</span>
              </button>
            );
          })
        )}
        {full && (
          <span style={{ display: 'block', padding: '12px 16px 0', fontSize: 12, color: color.textFaint }}>
            Three is the ceiling. Deselect one to swap it out.
          </span>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 24px', background: 'linear-gradient(to top,#0B0C0D 62%,rgba(11,12,13,0))' }}>
        <button
          onClick={onDone}
          disabled={selected.length < 2}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 999,
            background: selected.length < 2 ? color.surface : color.accent,
            border: selected.length < 2 ? `1px solid ${color.border}` : 'none',
            color: selected.length < 2 ? color.textFaint : color.onAccent,
            fontFamily: font.mono,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.12em',
            cursor: selected.length < 2 ? 'default' : 'pointer',
          }}
        >
          {selected.length < 2 ? `SELECT ${2 - selected.length} MORE` : `COMPARE ${selected.length}`}
        </button>
      </div>
    </>
  );
}

// ── the comparison itself ─────────────────────────────────────────
function CompareView({ comparands, sport }: { comparands: Comparand[]; sport: Sport }) {
  const run = sport === 'run';
  const maxM = Math.max(1, ...comparands.map((c) => c.trace.totalM));
  const bucketM = Math.max(100, Math.ceil(maxM / BUCKETS / 50) * 50);
  const bucketCount = Math.max(1, Math.ceil(maxM / bucketM));

  const series = useMemo(
    () => comparands.map((c) => ({ color: c.color, ...seriesByDistance(c.trace, bucketM, bucketCount) })),
    [comparands, bucketM, bucketCount],
  );

  const paceSeries = series.map((s) => ({
    color: s.color,
    values: run ? s.pace : s.pace.map((v) => (v != null && v > 0 ? 3600 / v : null)),
  }));
  const hasPace = paceSeries.some((s) => s.values.some((v) => v != null));
  const eleSeries = series.map((s) => ({ color: s.color, values: s.ele }));
  const hasEle = eleSeries.some((s) => s.values.some((v) => v != null));
  const hrSeries = series.map((s) => ({ color: s.color, values: s.hr }));
  const hasHr = hrSeries.some((s) => s.values.some((v) => v != null));

  const specs = useMemo(() => metricSpecs(sport, fmtClock, fmtPace), [sport]);
  const reference = comparands[0];

  const splitRows = Math.max(0, ...comparands.map((c) => c.splits.filter((s) => s.distanceM >= FULL_SPLIT_M).length));

  return (
    <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {comparands.map((c, i) => (
          <div key={c.activity.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: 'none', width: 14, height: 3, borderRadius: 2, background: c.color }} />
            <span style={{ flex: 1, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.activity.title}</span>
            <span style={{ fontFamily: font.mono, fontSize: 11, color: i === 0 ? color.accent : color.textFaint }}>
              {i === 0 ? 'reference · ' : ''}
              {fmtEuroDate(c.activity.startedAt)}
            </span>
          </div>
        ))}
      </div>

      {/* metrics */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ ...S.tableHeaderRow, height: 30 }}>
          <span style={{ ...S.monoTick, flex: 'none', width: 78 }} />
          {comparands.map((c) => (
            <span key={c.activity.id} style={{ ...S.monoTick, flex: 1, textAlign: 'right', color: c.color }}>
              {fmtDayMonth(c.activity.startedAt)}
            </span>
          ))}
        </div>
        {specs.map((spec) => {
          const values = comparands.map((c) => spec.value(c.metrics));
          if (values.every((v) => v == null)) return null;
          const best = bestIndex(values, spec.better);
          const ref = spec.value(reference.metrics);
          return (
            <div
              key={spec.key}
              style={{ display: 'flex', alignItems: 'center', minHeight: 44, padding: '6px 16px', boxSizing: 'border-box', borderBottom: `1px solid ${color.dividerHairline}` }}
            >
              <span style={{ ...S.label, flex: 'none', width: 78 }}>{spec.label}</span>
              {values.map((v, i) => {
                const delta = v != null && ref != null && i > 0 ? v - ref : null;
                return (
                  <span key={comparands[i].activity.id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1 }}>
                    <span style={{ ...S.tableNum, color: v == null ? color.textFaint : i === best ? color.positive : color.text, whiteSpace: 'nowrap' }}>
                      {v == null ? '—' : spec.fmt(v)}
                    </span>
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: color.textFaint, whiteSpace: 'nowrap' }}>
                      {i === 0 ? 'ref' : delta == null ? '' : Math.abs(delta) < 1e-9 ? 'level' : spec.fmtDelta(delta)}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
        <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
          Green marks the better figure where better has a direction — pace, best kilometre and decoupling. Distance, ascent and heart rate are shown
          without one, because they are context rather than a result.
        </span>
      </div>

      {hasPace && (
        <ChartBlock
          label={run ? 'Pace over distance' : 'Speed over distance'}
          note={
            run
              ? `Seconds spent in each ${bucketM} m of the track, read as a kilometre pace. Higher is faster. A stop shows up as the slow kilometre it was.`
              : `Average speed across each ${bucketM} m of the track.`
          }
        >
          <CompareSeriesChart
            series={paceSeries}
            bucketM={bucketM}
            invertY={run}
            fmtY={(v) => (run ? fmtPace(v) : v.toFixed(0))}
            minSpan={run ? 45 : 6}
          />
        </ChartBlock>
      )}

      {hasEle && (
        <ChartBlock label="Elevation over distance" note="Recorded altitude against distance covered, so the same climb on two days lines up.">
          <CompareSeriesChart series={eleSeries} bucketM={bucketM} fmtY={(v) => `${Math.round(v)}`} minSpan={40} height={130} />
        </ChartBlock>
      )}

      {hasHr && (
        <ChartBlock label="Heart rate over distance" note="Only the sessions with a paired strap draw a line here.">
          <CompareSeriesChart series={hrSeries} bucketM={bucketM} fmtY={(v) => `${Math.round(v)}`} minSpan={25} height={130} />
        </ChartBlock>
      )}

      {splitRows > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <SectionHeader>Splits</SectionHeader>
          <div style={{ ...S.tableHeaderRow, marginTop: 8 }}>
            <span style={{ ...S.monoTick, flex: 'none', width: 40 }}>KM</span>
            {comparands.map((c) => (
              <span key={c.activity.id} style={{ ...S.monoTick, flex: 1, textAlign: 'right', color: c.color }}>
                {fmtDayMonth(c.activity.startedAt)}
              </span>
            ))}
          </div>
          {new Array(splitRows).fill(0).map((_, row) => {
            const paces = comparands.map((c) => {
              const split = c.splits[row];
              return split && split.distanceM >= FULL_SPLIT_M ? split.paceS : null;
            });
            const best = bestIndex(paces, 'lower');
            return (
              <div key={row} style={S.tableRow}>
                <span style={{ ...S.tableNum, flex: 'none', width: 40, color: color.textMuted }}>{row + 1}</span>
                {paces.map((p, i) => (
                  <span
                    key={comparands[i].activity.id}
                    style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: p == null ? color.textFaint : i === best ? color.positive : color.text }}
                  >
                    {p == null ? '—' : run ? fmtPace(p) : `${(3600 / p).toFixed(1)}`}
                  </span>
                ))}
              </div>
            );
          })}
          <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>
            Full kilometres only — the part-kilometre each session ends on is left out rather than compared against a whole one. A dash means that
            session had already finished.
          </span>
        </div>
      )}
    </div>
  );
}

function ChartBlock({ label, note, children }: { label: string; note: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label style={{ padding: '0 16px' }}>{label}</Label>
      <div style={{ ...S.sunkWell, padding: '10px 0 4px' }}>{children}</div>
      <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.4, color: color.textFaint, textWrap: 'pretty' }}>{note}</span>
    </div>
  );
}
