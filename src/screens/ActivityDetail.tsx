import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font, zoneColors, ZONE_NAMES } from '../theme';
import * as S from '../styles';
import { ActionButton, Field, Label, ScreenHeader, Segmented } from '../components/primitives';
import { CompareSeriesChart, ElevationProfile, HistogramBars, ZoneBar } from '../components/charts';
import { RouteMap } from '../components/RouteMap';
import { MedalIcon, MedalRow, MedalTally } from '../components/medals';
import { useUnits } from '../hooks/useUnits';
import { buildTrace, metricsFor, splitLengthForSport, splitsFor, type Split, type Trace } from '../lib/compare';
import { deriveActivity } from '../lib/derived';
import { mapPins, medalsFor, type Medal } from '../lib/medals';
import { downloadFile, exportFileName, toGpx } from '../lib/backup';
import { getSamples } from '../lib/storage';
import {
  activityStress,
  fmtClock,
  fmtEuroDate,
  fmtTimeOfDay,
  histogramPercentile,
  zoneSecondsForActivity,
} from '../lib/stats';
import type { Activity, ActivitySamples, FullActivity, Settings, Sport } from '../types';

const EFFORT_WORDS = ['Recovery', 'Very easy', 'Easy', 'Steady', 'Moderate', 'Comfortably hard', 'Hard', 'Very hard', 'Near maximal', 'All out'];

const sectionStyle: CSSProperties = { flex: 'none', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 };

/** One session, on its own.
 *
 *  The comparison screen answers what two sessions look like next to each other; this
 *  answers what one session was — its track, its splits, its laps, where the time in
 *  each zone went — and it is the only place a saved activity can be corrected or
 *  removed, which until now it could not be at all. */
export function ActivityDetail({
  activity,
  activities,
  settings,
  onBack,
  onEdit,
  onDelete,
  onCompare,
  onMap,
}: {
  activity: Activity | null;
  activities: Activity[];
  settings: Settings;
  onBack: () => void;
  onEdit: (a: Activity) => void;
  onDelete: (id: string) => void;
  onCompare: (ids: string[]) => void;
  onMap: (id: string) => void;
}) {
  const units = useUnits();
  // Keyed by the activity it was loaded for, so opening a second session never shows
  // the first one's track while the new one is still being read.
  const [loaded, setLoaded] = useState<{ id: string; samples: ActivitySamples | null } | null>(null);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const id = activity?.id;
  const hasSamples = activity?.hasSamples ?? false;
  useEffect(() => {
    if (!id || !hasSamples) return;
    let live = true;
    void getSamples(id).then((found) => {
      if (live) setLoaded({ id, samples: found });
    });
    return () => {
      live = false;
    };
  }, [id, hasSamples]);

  const samples = loaded && loaded.id === id ? loaded.samples : null;

  const full: FullActivity | null = useMemo(
    () => (activity ? { ...activity, samples: samples ?? { id: activity.id, points: [], hr: [], power: [], cadence: [] } } : null),
    [activity, samples],
  );

  const trace = useMemo(() => (full ? buildTrace(full) : null), [full]);
  const splitM = trace && activity ? splitLengthForSport(activity.sport, trace.totalM, units.splitM) : units.splitM;
  const splits = useMemo(() => (trace ? splitsFor(trace, splitM) : []), [trace, splitM]);
  const metrics = useMemo(() => (full ? metricsFor(full) : null), [full]);
  const zones = useMemo(() => (activity ? zoneSecondsForActivity(activity, settings) : []), [activity, settings]);
  const stress = useMemo(() => (activity ? activityStress(activity, settings) : null), [activity, settings]);
  // What this session was worth against the sessions that came before it. Read off the
  // stored derivations of the whole log, so it costs one pass and no sample streams.
  const medals = useMemo(() => (activity ? medalsFor(activity, activities) : []), [activity, activities]);
  const medalsByKm = useMemo(() => new Map(medals.filter((m) => m.km != null).map((m) => [m.km as number, m])), [medals]);
  const pins = useMemo(() => mapPins(medals).map((m) => ({ km: m.km as number, tier: m.tier, label: m.label })), [medals]);
  // Everything that speaks for the whole session, and only the first handful of the
  // kilometres inside it: a loop whose every section was a best is a wall of rows, and
  // the splits table below marks all of them anyway.
  const listedMedals = useMemo(() => {
    const sections = medals.filter((m) => m.kind === 'segment');
    return [...medals.filter((m) => m.kind !== 'segment'), ...sections.slice(0, 6)];
  }, [medals]);
  const hiddenSections = medals.filter((m) => m.kind === 'segment').length - 6;

  if (!activity || !metrics) {
    return (
      <div style={S.screen}>
        <ScreenHeader title="Session" onBack={onBack} />
        <span style={{ padding: '8px 16px', ...S.body, color: color.textMuted }}>This session is no longer in the log.</span>
      </div>
    );
  }

  const run = activity.sport === 'run';
  const zoneTotal = zones.reduce((a, b) => a + b, 0);
  const cadenceHist = activity.derived.cadenceHist;
  const track = activity.derived.track ?? { fixes: 0, longestGapS: 0, gaps: 0, coverage: 0, medianIntervalS: 0 };
  const sameSport = activities.filter((a) => a.sport === activity.sport && a.id !== activity.id);

  const headline: { label: string; value: string; unit: string }[] = [
    { label: 'Distance', value: units.fmtDistance(activity.distance, 2), unit: units.distanceUnit },
    { label: 'Time', value: fmtClock(metrics.durationS), unit: 'elapsed' },
    run
      ? { label: 'Avg pace', value: metrics.paceS ? units.fmtPace(metrics.paceS) : '—:—', unit: units.paceUnit }
      : { label: 'Avg speed', value: units.fmtSpeed(metrics.speedKmh / 3.6), unit: units.speedUnit },
  ];

  const detailRows: { label: string; value: string }[] = [
    { label: 'Moving time', value: fmtClock(metrics.movingS) },
    ...(run && metrics.gapS ? [{ label: 'Grade-adjusted pace', value: `${units.fmtPace(metrics.gapS)}${units.paceUnit}` }] : []),
    { label: 'Ascent', value: `${units.fmtElevation(activity.ascent)} ${units.elevationUnit}` },
    ...(metrics.avgHr ? [{ label: 'Avg heart rate', value: `${Math.round(metrics.avgHr)} bpm` }] : []),
    ...(metrics.peakHr ? [{ label: 'Peak heart rate', value: `${Math.round(metrics.peakHr)} bpm` }] : []),
    ...(metrics.avgPower ? [{ label: 'Avg power', value: `${Math.round(metrics.avgPower)} W` }] : []),
    ...(metrics.normalizedPower ? [{ label: 'Normalised power', value: `${Math.round(metrics.normalizedPower)} W` }] : []),
    ...(metrics.avgCadence ? [{ label: run ? 'Avg cadence' : 'Avg cadence', value: `${Math.round(metrics.avgCadence)} ${run ? 'spm' : 'rpm'}` }] : []),
    ...(metrics.best1kS ? [{ label: 'Best kilometre', value: fmtClock(metrics.best1kS) }] : []),
    ...(metrics.decouplingPct != null ? [{ label: 'Decoupling', value: `${metrics.decouplingPct.toFixed(1)} %` }] : []),
    ...(stress ? [{ label: 'Training stress', value: `${Math.round(stress.value)} pts · from ${stress.source === 'power' ? 'power' : stress.source === 'hr' ? 'heart rate' : 'effort'}` }] : []),
    { label: 'Effort', value: `${activity.effort}/10 · ${EFFORT_WORDS[activity.effort - 1]}` },
    ...(activity.hasSamples
      ? [
          {
            label: 'GPS fixes',
            value:
              track.medianIntervalS > 0
                ? `${track.fixes} · one every ${track.medianIntervalS < 1.5 ? 'second' : `${Math.round(track.medianIntervalS)} s`}`
                : String(track.fixes),
          },
        ]
      : []),
    ...(track.gaps > 0 ? [{ label: 'Longest GPS gap', value: fmtClock(track.longestGapS) }] : []),
    { label: 'Recorded', value: activity.source === 'manual' ? 'Entered by hand' : activity.source === 'imported' ? 'Imported' : 'On this device' },
  ];

  const exportGpx = () => {
    if (!samples || samples.points.length === 0) return;
    downloadFile(
      exportFileName(activity.sport === 'run' ? 'run' : 'ride', activity.startedAt, 'gpx'),
      'application/gpx+xml',
      toGpx(activity, samples),
    );
  };

  return (
    <div style={S.screen}>
      <ScreenHeader
        title={activity.title}
        onBack={onBack}
        right={
          <button onClick={() => setEditing((e) => !e)} style={{ ...S.linkButton, fontSize: 13 }}>
            {editing ? 'Done' : 'Edit'}
          </button>
        }
      />

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '4px 0 40px', display: 'flex', flexDirection: 'column', gap: 22 }}>
        <span style={{ padding: '0 16px', fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>
          {fmtEuroDate(activity.startedAt)} · {fmtTimeOfDay(activity.startedAt)} · {run ? 'Run' : 'Ride'}
        </span>

        {editing ? (
          <EditPanel
            activity={activity}
            samples={samples}
            settings={settings}
            onEdit={onEdit}
            onDelete={() => setConfirmDelete(true)}
            confirmDelete={confirmDelete}
            onConfirmDelete={() => onDelete(activity.id)}
            onCancelDelete={() => setConfirmDelete(false)}
          />
        ) : (
          <>
            {/* The session, the way it is actually read: the two or three figures
                anyone looks for, and then the map — full width, edge to edge, the
                largest thing on the screen. A tap opens it on a screen of its own. */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: '0 16px', display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', rowGap: 12 }}>
                {headline.map((m) => (
                  <div key={m.label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Label>{m.label}</Label>
                    <span style={{ ...S.metricLarge, color: color.text }}>{m.value}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{m.unit}</span>
                  </div>
                ))}
                {medals.length > 0 && (
                  <div style={{ marginLeft: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                    <Label>Achievements</Label>
                    <MedalTally medals={medals} size={20} />
                  </div>
                )}
              </div>

              {samples && samples.points.length >= 2 && (
                <div style={{ background: color.surfaceSunk, borderTop: `1px solid ${color.dividerHairline}`, borderBottom: `1px solid ${color.dividerHairline}` }}>
                  <RouteMap
                    points={samples.points}
                    height={300}
                    tiles={settings.mapTiles}
                    medals={pins}
                    onExpand={() => onMap(activity.id)}
                  />
                  {track.gaps > 0 && (
                    <div style={{ padding: '9px 12px 11px', borderTop: `1px solid ${color.dividerHairline}`, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <span style={{ ...S.caption, color: color.warning, lineHeight: 1.45, textWrap: 'pretty' }}>
                        {track.fixes === 2
                          ? 'Only two GPS fixes were recorded, so the dashed line is a straight guess between them, not the route you took.'
                          : `The GPS stopped reporting ${track.gaps} ${track.gaps === 1 ? 'time' : 'times'} — the longest for ${fmtClock(track.longestGapS)}. The dashed stretches are straight guesses, not recorded route.`}
                      </span>
                      <span style={{ ...S.caption, color: color.textFaint, lineHeight: 1.45, textWrap: 'pretty' }}>
                        A browser only receives locations while the app is on screen. Locking the phone or switching away stops the
                        track, and the distance for those stretches is the straight line, so it reads short.
                      </span>
                    </div>
                  )}
                </div>
              )}

              {activity.derived.elevation.length > 2 && (
                <div style={{ ...sectionStyle, gap: 4 }}>
                  <Label>Elevation · {units.fmtElevation(activity.ascent)} {units.elevationUnit} ascent</Label>
                  <ElevationProfile elevations={activity.derived.elevation} />
                </div>
              )}
            </div>

            {medals.length > 0 && (
              <div style={sectionStyle}>
                <Label>Achievements · against everything before this session</Label>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {listedMedals.map((medal, i) => (
                    <div key={medal.key} style={{ borderTop: i > 0 ? `1px solid ${color.dividerHairline}` : undefined }}>
                      <MedalRow medal={medal} />
                    </div>
                  ))}
                </div>
                {hiddenSections > 0 && (
                  <span style={{ ...S.caption, color: color.textMuted }}>
                    …and {hiddenSections} more {hiddenSections === 1 ? 'kilometre' : 'kilometres'}, marked on the map and in the splits.
                  </span>
                )}
                <span style={{ ...S.caption, color: color.textFaint, lineHeight: 1.45, textWrap: 'pretty' }}>
                  A medal is ranked against the sessions older than this one, and takes three earlier attempts before it is worth
                  awarding — so it is what the session was worth on the day, and nothing recorded since can take it away.
                </span>
              </div>
            )}

            {activity.notes && (
              <div style={sectionStyle}>
                <Label>Notes</Label>
                <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>{activity.notes}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {detailRows.map((row) => (
                <div key={row.label} style={{ ...S.listRow, height: 38 }}>
                  <span style={{ flex: 1, fontSize: 13, color: color.textMuted }}>{row.label}</span>
                  <span style={{ ...S.tableNum, color: color.text }}>{row.value}</span>
                </div>
              ))}
            </div>

            {zoneTotal > 0 && (
              <div style={sectionStyle}>
                <Label>Time in zone</Label>
                <ZoneBar seconds={zones} colors={zoneColors} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {ZONE_NAMES.map((name, i) =>
                    zones[i] > 0 ? (
                      <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, flex: 'none', borderRadius: 1, background: zoneColors[i] }} />
                        <span style={{ flex: 1, fontSize: 12, color: color.textMuted }}>{name}</span>
                        <span style={{ ...S.tableNum, color: color.text }}>{fmtClock(zones[i])}</span>
                        <span style={{ ...S.tableNum, color: color.textFaint, width: 44, textAlign: 'right' }}>
                          {((zones[i] / zoneTotal) * 100).toFixed(0)} %
                        </span>
                      </div>
                    ) : null,
                  )}
                </div>
              </div>
            )}

            {trace && trace.totalS > 0 && <SeriesSection trace={trace} run={run} />}

            {cadenceHist && (
              <div style={sectionStyle}>
                <Label>Cadence · time at each {run ? 'step rate' : 'crank speed'}</Label>
                <HistogramBars
                  hist={cadenceHist}
                  markers={[
                    { value: histogramPercentile(cadenceHist, 0.5) ?? cadenceHist.lo, label: 'median' },
                  ]}
                />
                <span style={{ fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>
                  The middle half of the session sat between {histogramPercentile(cadenceHist, 0.25)} and{' '}
                  {histogramPercentile(cadenceHist, 0.75)} {run ? 'spm' : 'rpm'}. A wide spread is a session that changed gear or
                  terrain; a narrow one is a steady rhythm.
                </span>
              </div>
            )}

            {splits.length > 1 && (
              <SplitsTable splits={splits} run={run} splitM={splitM} medalsByKm={splitM === 1000 ? medalsByKm : new Map()} />
            )}

            {activity.laps.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <Label style={{ padding: '0 16px 8px' }}>Laps</Label>
                <div style={S.tableHeaderRow}>
                  <span style={{ ...S.monoTick, width: 40 }}>LAP</span>
                  <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{units.distanceUnit.toUpperCase()}</span>
                  <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>TIME</span>
                  <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{run ? 'PACE' : 'SPEED'}</span>
                </div>
                {activity.laps.map((lap) => {
                  const lapM = lap.endDist - lap.startDist;
                  const lapS = (lap.endT - lap.startT) / 1000;
                  const speed = lapS > 0 ? lapM / lapS : 0;
                  return (
                    <div key={lap.lapNo} style={S.tableRow}>
                      <span style={{ ...S.tableNum, width: 40, color: color.textMuted }}>{lap.lapNo}</span>
                      <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{units.fmtDistance(lapM, 2)}</span>
                      <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>{fmtClock(lapS)}</span>
                      <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', color: color.text }}>
                        {speed > 0.2 ? (run ? units.fmtPace(1000 / speed) : units.fmtSpeed(speed)) : '—'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ ...sectionStyle, gap: 8 }}>
              {/* This session is the reference; which one it is read against is a
                  choice, not something to guess — so this opens the picker with it
                  already picked rather than pairing it with the newest of its sport. */}
              {sameSport.length > 0 && (
                <ActionButton onClick={() => onCompare([activity.id])}>Compare with another session…</ActionButton>
              )}
              {samples && samples.points.length > 0 && <ActionButton onClick={exportGpx}>Export this session as GPX</ActionButton>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── the pace / heart rate / cadence traces ────────────────────────
interface ChartSpec {
  label: string;
  values: (number | null)[];
  color: string;
  invert?: boolean;
  fmt: (v: number) => string;
  minSpan?: number;
}

function SeriesSection({ trace, run }: { trace: Trace; run: boolean }) {
  const units = useUnits();
  const bucketM = Math.max(50, Math.round(trace.totalM / 60 / 50) * 50);
  const count = Math.max(1, Math.ceil(trace.totalM / bucketM));
  const series = useMemo(() => {
    const buckets = { pace: [] as (number | null)[], hr: [] as (number | null)[], cadence: [] as (number | null)[] };
    // Reuses the same distance bucketing the comparison screen uses, at a finer grain,
    // because one session can afford more resolution than three overlaid ones.
    const sums = new Array(count).fill(0);
    const counts = new Array(count).fill(0);
    const hrSums = new Array(count).fill(0);
    const hrCounts = new Array(count).fill(0);
    const cadSums = new Array(count).fill(0);
    const cadCounts = new Array(count).fill(0);
    for (let s = 1; s <= trace.totalS; s++) {
      const b = Math.floor(trace.distM[s] / bucketM);
      if (b < 0 || b >= count) continue;
      const step = trace.distM[s] - trace.distM[s - 1];
      if (step > 0) {
        sums[b] += step;
        counts[b] += 1;
      }
      const h = trace.hr[s];
      if (h != null) {
        hrSums[b] += h;
        hrCounts[b] += 1;
      }
      const c = trace.cadence[s];
      if (c != null) {
        cadSums[b] += c;
        cadCounts[b] += 1;
      }
    }
    for (let b = 0; b < count; b++) {
      buckets.pace.push(sums[b] > 0 ? counts[b] / (sums[b] / 1000) : null);
      buckets.hr.push(hrCounts[b] > 0 ? hrSums[b] / hrCounts[b] : null);
      buckets.cadence.push(cadCounts[b] > 0 ? cadSums[b] / cadCounts[b] : null);
    }
    return buckets;
  }, [trace, bucketM, count]);

  const allCharts: ChartSpec[] = [
    {
      label: run ? 'Pace' : 'Speed',
      values: run ? series.pace : series.pace.map((v) => (v != null && v > 0 ? 3600 / v : null)),
      color: color.metricPace,
      invert: run,
      fmt: run ? (v: number) => units.fmtPace(v) : (v: number) => units.fmtSpeed(v / 3.6),
      minSpan: run ? 30 : 4,
    },
    { label: 'Heart rate', values: series.hr, color: color.metricHr, fmt: (v) => String(Math.round(v)), minSpan: 12 },
    { label: 'Cadence', values: series.cadence, color: color.metricCadence, fmt: (v) => String(Math.round(v)), minSpan: 8 },
  ];
  const charts = allCharts.filter((c) => c.values.some((v) => v != null));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {charts.map((chart) => (
        <div key={chart.label} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <Label style={{ padding: '0 16px' }}>{chart.label}</Label>
          <div style={S.sunkWell}>
            <CompareSeriesChart
              series={[{ color: chart.color, values: chart.values }]}
              bucketM={bucketM}
              invertY={chart.invert}
              fmtY={chart.fmt}
              minSpan={chart.minSpan}
              height={130}
              toXUnit={units.distance}
              xUnitLabel={units.distanceUnit}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** The splits, with the sections that earned a medal marked in the table they are read
 *  in — the medal belongs to a row here as much as to a pin on the map.
 *
 *  Only when the table is cut in kilometres, because that is the section a medal is
 *  awarded over: a table in miles, or in five-kilometre blocks for a long ride, is not
 *  the same stretch of road and must not claim to be. */
function SplitsTable({
  splits,
  run,
  splitM,
  medalsByKm,
}: {
  splits: Split[];
  run: boolean;
  splitM: number;
  medalsByKm: Map<number, Medal>;
}) {
  const units = useUnits();
  const perSplit = splitM / units.splitM;
  const paces = splits.map((s) => s.paceS).filter((p) => p > 0);
  const fastest = paces.length ? Math.min(...paces) : 0;
  const slowest = paces.length ? Math.max(...paces) : 1;
  const anyGap = splits.some((s) => s.gapS != null);
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <Label style={{ padding: '0 16px 8px' }}>
        Splits · per {perSplit > 1 ? `${Math.round(perSplit)} ` : ''}
        {units.distanceUnit}
      </Label>
      <div style={S.tableHeaderRow}>
        <span style={{ ...S.monoTick, width: 28 }}>#</span>
        {medalsByKm.size > 0 && <span style={{ ...S.monoTick, width: 16 }} aria-hidden />}
        <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>{run ? 'PACE' : 'SPEED'}</span>
        {anyGap && <span style={{ ...S.monoTick, flex: 1, textAlign: 'right' }}>GAP</span>}
        <span style={{ ...S.monoTick, width: 48, textAlign: 'right' }}>ASC</span>
        <span style={{ ...S.monoTick, width: 44, textAlign: 'right' }}>HR</span>
      </div>
      {splits.map((split) => {
        // The bar behind each row is the split's pace against the session's own range,
        // so a hard kilometre reads at a glance without reading the number.
        const span = Math.max(1, slowest - fastest);
        const share = split.paceS > 0 ? 1 - (split.paceS - fastest) / span : 0;
        const medal = medalsByKm.get(split.index);
        return (
          <div key={split.index} style={{ ...S.tableRow, position: 'relative', overflow: 'hidden' }}>
            <span style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(share * 100).toFixed(1)}%`, background: color.metricPace, opacity: 0.07 }} />
            <span style={{ ...S.tableNum, width: 28, position: 'relative', color: medal ? color.text : color.textMuted }}>{split.index}</span>
            {medalsByKm.size > 0 && (
              <span style={{ width: 16, position: 'relative', display: 'flex', alignItems: 'center' }} title={medal ? `${medal.label} · ${medal.detail}` : undefined}>
                {medal && <MedalIcon tier={medal.tier} size={12} />}
              </span>
            )}
            <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', position: 'relative', color: color.text }}>
              {run ? units.fmtPace(split.paceS) : units.fmtSpeed(1000 / split.paceS)}
            </span>
            {anyGap && (
              <span style={{ ...S.tableNum, flex: 1, textAlign: 'right', position: 'relative', color: color.textMuted }}>
                {split.gapS != null ? units.fmtPace(split.gapS) : '—'}
              </span>
            )}
            <span style={{ ...S.tableNum, width: 48, textAlign: 'right', position: 'relative', color: color.textMuted }}>
              {units.fmtElevation(split.ascentM)}
            </span>
            <span style={{ ...S.tableNum, width: 44, textAlign: 'right', position: 'relative', color: color.textMuted }}>
              {split.avgHr != null ? Math.round(split.avgHr) : '—'}
            </span>
          </div>
        );
      })}
      {anyGap && (
        <span style={{ padding: '10px 16px 0', fontSize: 12, lineHeight: 1.4, color: color.textFaint }}>
          GAP is the pace this split would have been on the level for the same effort — the honest way to read a hill.
        </span>
      )}
    </div>
  );
}

// ── editing ───────────────────────────────────────────────────────
function EditPanel({
  activity,
  samples,
  settings,
  onEdit,
  onDelete,
  confirmDelete,
  onConfirmDelete,
  onCancelDelete,
}: {
  activity: Activity;
  samples: ActivitySamples | null;
  settings: Settings;
  onEdit: (a: Activity) => void;
  onDelete: () => void;
  confirmDelete: boolean;
  onConfirmDelete: () => void;
  onCancelDelete: () => void;
}) {
  const [title, setTitle] = useState(activity.title);
  const [notes, setNotes] = useState(activity.notes);
  const [effort, setEffort] = useState(activity.effort);
  const [gearId, setGearId] = useState(activity.gearId);
  const [sport, setSport] = useState<Sport>(activity.sport);

  const gearForSport = settings.gear.filter((g) => g.sport === sport && !g.retired);

  const commit = () => {
    // Changing the sport changes what the stored figures mean — best efforts belong to
    // runs, the power curve to rides — so the derivation is redone from the samples
    // rather than carried over from the sport it was filed under before.
    const derived =
      sport !== activity.sport && samples
        ? deriveActivity({ sport, startedAt: activity.startedAt, endedAt: activity.endedAt, samples })
        : activity.derived;
    onEdit({
      ...activity,
      sport,
      derived,
      title: title.trim() || activity.title,
      notes,
      effort,
      gearId: gearForSport.some((g) => g.id === gearId) ? gearId : (gearForSport[0]?.id ?? null),
    });
  };

  return (
    <div style={{ ...sectionStyle, gap: 20 }}>
      <Field label="Title">
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={commit} style={S.input} />
      </Field>

      <Field label="Sport" hint={sport !== activity.sport ? 'Changing the sport re-derives this session’s best efforts and power curve.' : undefined}>
        <Segmented
          ariaLabel="Sport"
          options={[
            { value: 'run', label: 'RUN' },
            { value: 'ride', label: 'RIDE' },
          ]}
          value={sport}
          onChange={(v) => setSport(v)}
        />
      </Field>

      <Field label="Perceived effort" hint={`${effort} / 10 · ${EFFORT_WORDS[effort - 1]}`}>
        <div style={{ display: 'flex', gap: 4 }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
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
                ...(n === effort
                  ? { background: color.accentWash, color: color.accent, border: `1px solid ${color.accent}` }
                  : { background: color.surface, color: color.textMuted, border: `1px solid ${color.border}` }),
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </Field>

      {gearForSport.length > 0 && (
        <Field label={sport === 'run' ? 'Shoes' : 'Bike'}>
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
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Notes">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={commit}
          placeholder="How it felt, weather, anything worth remembering."
          style={{ ...S.input, minHeight: 76, resize: 'none', lineHeight: 1.45 }}
        />
      </Field>

      <ActionButton onClick={commit} tone="accent">
        Save changes
      </ActionButton>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 6, borderTop: `1px solid ${color.dividerHairline}` }}>
        {confirmDelete ? (
          <>
            <span style={{ fontSize: 13, lineHeight: 1.45, color: color.textMuted }}>
              Deleting removes this session and its track for good. It will stop counting towards your week, your streak, your load
              and your personal bests.
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <ActionButton onClick={onCancelDelete}>Keep it</ActionButton>
              <ActionButton onClick={onConfirmDelete} tone="critical">
                Delete for good
              </ActionButton>
            </div>
          </>
        ) : (
          <ActionButton onClick={onDelete} tone="critical">
            Delete this session
          </ActionButton>
        )}
      </div>
    </div>
  );
}
