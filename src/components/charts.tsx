import { useMemo } from 'react';
import { color, zoneColors, font } from '../theme';
import { projectTrackToViewBox, pathFromPoints, silhouettePath, resample } from '../lib/geo';
import type { GeoSample } from '../types';

// ── acute vs chronic load ─────────────────────────────────────────
export function LoadChart({
  acute,
  chronic,
  labels,
  hotIndices,
}: {
  acute: number[];
  chronic: number[];
  labels: { index: number; label: string }[];
  hotIndices: number[];
}) {
  const W = 390;
  const H = 150;
  const X0 = 14;
  const X1 = 376;
  const Y0 = 16;
  const Y1 = 124;
  const max = Math.max(1, ...acute, ...chronic) * 1.12;
  const lx = (i: number) => X0 + ((X1 - X0) * i) / Math.max(1, acute.length - 1);
  const ly = (v: number) => Y1 - ((Y1 - Y0) * v) / max;
  const pts = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${lx(i).toFixed(1)} ${ly(v).toFixed(1)}`).join(' ');
  const gridYs = [0, 0.25, 0.5, 0.75].map((f) => Y0 + f * (Y1 - Y0));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {gridYs.map((y, i) => (
        <line key={i} x1={0} x2={W} y1={y} y2={y} stroke={color.chartGrid} strokeWidth={1} />
      ))}
      <path d={`${pts(chronic)} L${X1} ${Y1} L${X0} ${Y1} Z`} fill="rgba(46,53,59,0.9)" />
      <path d={pts(chronic)} fill="none" stroke={color.textFaint} strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={pts(acute)} fill="none" stroke={color.metricPace} strokeWidth={2} strokeLinejoin="round" />
      {acute.map((v, i) => {
        const hot = hotIndices.includes(i);
        return <circle key={i} cx={lx(i)} cy={ly(v)} r={hot ? 4 : 2.5} fill={hot ? color.warning : color.metricPace} />;
      })}
      {labels.map((t) => (
        <text key={t.index} x={lx(t.index) - 10} y={144} fill={color.textFaint} fontFamily={font.mono} fontSize={10}>
          {t.label}
        </text>
      ))}
    </svg>
  );
}

// ── weekly volume bars, run over ride ÷ 3 ─────────────────────────
export function VolumeBars({ weeks }: { weeks: { label: string; runKm: number; rideKm: number }[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.runKm + w.rideKm / 3));
  const plotH = 62;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        height: 96,
        padding: '10px 10px 0',
        background: color.surfaceSunk,
        border: `1px solid ${color.dividerHairline}`,
        borderRadius: 8,
        boxSizing: 'border-box',
      }}
    >
      {weeks.map((w, i) => {
        const runH = (w.runKm / max) * plotH;
        const rideH = (w.rideKm / 3 / max) * plotH;
        const isLast = i === weeks.length - 1;
        return (
          <div key={w.label + i} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5, height: '100%' }}>
            <span style={{ width: '100%', borderRadius: '2px 2px 0 0', background: isLast ? '#FFFFFF' : color.metricPace, height: Math.round(runH) }} />
            <span style={{ width: '100%', background: color.metricSpeed, height: Math.round(rideH) }} />
            <span style={{ fontFamily: font.mono, fontSize: 10, textAlign: 'center', color: isLast ? color.text : color.textFaint }}>{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── zone mix, stacked per week ────────────────────────────────────
export function ZoneMixChart({ weeks }: { weeks: { label: string; mix: number[] }[] }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 7,
        height: 132,
        padding: '12px 16px 0',
        background: color.surfaceSunk,
        borderTop: `1px solid ${color.dividerHairline}`,
        borderBottom: `1px solid ${color.dividerHairline}`,
        boxSizing: 'border-box',
      }}
    >
      {weeks.map((w, wi) => {
        const total = w.mix.reduce((a, b) => a + b, 0);
        const segs = total > 0 ? w.mix.map((v) => (v / total) * 100) : [0, 0, 0, 0, 0];
        const isLast = wi === weeks.length - 1;
        return (
          <div key={w.label + wi} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%', gap: 4 }}>
            {[4, 3, 2, 1, 0].map((zi) => (
              <span
                key={zi}
                style={{
                  width: '100%',
                  height: `${(segs[zi] * 0.78).toFixed(1)}px`,
                  background: zoneColors[zi],
                  borderRadius: zi === 0 ? '0 0 2px 2px' : zi === 4 ? '2px 2px 0 0' : undefined,
                }}
              />
            ))}
            <span style={{ fontFamily: font.mono, fontSize: 10, textAlign: 'center', color: isLast ? color.text : color.textFaint }}>{w.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── power curve, 90 days against season best ──────────────────────
export function PowerCurveChart({
  now,
  season,
  labels,
}: {
  now: number[];
  season: number[];
  labels: string[];
}) {
  const W = 390;
  const H = 160;
  const X0 = 44;
  const X1 = 366;
  const Y0 = 20;
  const Y1 = 128;
  const all = [...now, ...season].filter((v) => v > 0);
  const max = Math.max(100, ...all) * 1.1;
  const min = 0;
  const px = (i: number) => X0 + ((X1 - X0) * i) / Math.max(1, now.length - 1);
  const py = (v: number) => Y1 - ((Y1 - Y0) * (v - min)) / (max - min);
  const curve = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)}`).join(' ');
  const yTicks = [max * 0.85, max * 0.5, max * 0.2].map((v) => Math.round(v / 50) * 50).filter((v) => v > 0);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{ display: 'block' }}>
      {[0.15, 0.4, 0.65, 0.9].map((f, i) => (
        <line key={i} x1={0} x2={W} y1={Y0 + f * (Y1 - Y0)} y2={Y0 + f * (Y1 - Y0)} stroke={color.chartGrid} strokeWidth={1} />
      ))}
      <path d={curve(season)} fill="none" stroke={color.textFaint} strokeWidth={1.5} strokeDasharray="4 3" />
      <path d={curve(now)} fill="none" stroke={color.metricPower} strokeWidth={2.5} strokeLinejoin="round" />
      {labels.map((l, i) => (
        <text key={l} x={px(i)} y={150} fill={color.textFaint} fontFamily={font.mono} fontSize={10} textAnchor="middle">
          {l}
        </text>
      ))}
      {yTicks.map((v) => (
        <text key={v} x={8} y={py(v) + 3} fill={color.textFaint} fontFamily={font.mono} fontSize={10}>
          {v}W
        </text>
      ))}
    </svg>
  );
}

// ── live track from the real recorded GPS points ──────────────────

/** The map is 358 units wide, so a path with more vertices than that has nothing left
 *  to say — but a two-hour ride hands it seven thousand, re-projected and re-rasterised
 *  every second the session runs. Striding keeps the newest fix, which is the one the
 *  current-position marker sits on. */
const MAX_TRACK_POINTS = 400;

function thinTrack(points: GeoSample[]): GeoSample[] {
  if (points.length <= MAX_TRACK_POINTS) return points;
  const stride = Math.ceil(points.length / MAX_TRACK_POINTS);
  const out: GeoSample[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  if ((points.length - 1) % stride !== 0) out.push(points[points.length - 1]);
  return out;
}

export function TrackMap({ points, height }: { points: GeoSample[]; height: number }) {
  const W = 358;
  const H = 260;
  // The recorder pushes into one array it keeps for the whole session, so its identity
  // never changes and its length is the only thing that says a fix has landed. The rule
  // reads that as a redundant dependency because it cannot see the mutation; without it
  // the track would be projected once and never again.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const projected = useMemo(() => projectTrackToViewBox(thinTrack(points), W, H, 18), [points, points.length]);
  const path = useMemo(() => pathFromPoints(projected), [projected]);
  const start = projected[0];
  const current = projected[projected.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
      <path d="M-10 210 C60 190 90 236 170 224 C250 212 300 250 380 236" stroke={color.chartGrid} strokeWidth={1} fill="none" />
      <path d="M-10 120 C70 104 120 148 190 130 C260 112 320 152 380 132" stroke={color.chartGrid} strokeWidth={1} fill="none" />
      <path d="M-10 52 C60 40 110 74 180 58 C250 42 310 72 380 56" stroke={color.chartGrid} strokeWidth={1} fill="none" />
      {path && <path d={path} stroke={color.metricPace} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />}
      {start && <circle cx={start.x} cy={start.y} r={5} fill={color.positive} />}
      {current && <circle cx={current.x} cy={current.y} r={5.5} fill={color.accent} stroke="#000000" strokeWidth={2} />}
    </svg>
  );
}

// ── elevation profile for the save screen ─────────────────────────
export function ElevationProfile({ elevations, height = 64 }: { elevations: number[]; height?: number }) {
  const W = 330;
  const profile = resample(elevations, Math.min(64, Math.max(2, elevations.length)));
  const min = Math.min(...profile);
  const max = Math.max(...profile);
  const span = Math.max(1, max - min);
  const line = profile
    .map((e, i) => {
      const x = (i / (profile.length - 1)) * W;
      const y = height - ((e - min) / span) * height * 0.82 - height * 0.06;
      return `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" width="100%" height={height} style={{ display: 'block' }}>
      <path d={silhouettePath(profile, W, height)} fill={color.metricElevation} />
      <path d={line} stroke={color.textFaint} strokeWidth={1} fill="none" />
    </svg>
  );
}

export function LoadRatioBar({ ratio }: { ratio: number }) {
  // 0.6 detraining … 0.8–1.3 steady … 1.6 spike, mapped onto the bar's width
  const pos = Math.max(0, Math.min(1, (ratio - 0.5) / 1.2));
  return (
    <div style={{ position: 'relative', height: 8, background: color.surfaceSunk, border: `1px solid ${color.dividerHairline}`, borderRadius: 999 }}>
      <span style={{ position: 'absolute', left: '25%', width: '41.6%', top: 0, bottom: 0, background: 'rgba(79,158,106,0.28)' }} />
      <span style={{ position: 'absolute', left: `calc(${(pos * 100).toFixed(1)}% - 1px)`, top: -4, bottom: -4, width: 2, background: color.text }} />
    </div>
  );
}

// ── one weekly figure over twelve weeks, for the stat detail screens ──
export function StatTrendBars({
  points,
  format,
  height = 108,
}: {
  points: { weekStart: number; label: string; value: number }[];
  format: (v: number) => string;
  height?: number;
}) {
  const max = Math.max(...points.map((p) => p.value), 0);
  const plotH = height - 34;
  const mean = points.length > 0 ? points.reduce((s, p) => s + p.value, 0) / points.length : 0;
  const scale = (v: number) => (max > 0 ? (v / max) * plotH : 0);

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 4,
        height,
        padding: '10px 12px 0',
        background: color.surfaceSunk,
        border: `1px solid ${color.dividerHairline}`,
        borderRadius: 8,
        boxSizing: 'border-box',
      }}
    >
      {max > 0 && (
        <span
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            bottom: 24 + scale(mean),
            borderTop: `1px dashed ${color.chartAxis}`,
            pointerEvents: 'none',
          }}
        />
      )}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <div key={p.weekStart} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', gap: 5, height: '100%' }}>
            {isLast && p.value > 0 && (
              <span style={{ fontFamily: font.mono, fontSize: 10, textAlign: 'center', color: color.text }}>{format(p.value)}</span>
            )}
            <span
              style={{
                width: '100%',
                borderRadius: '2px 2px 0 0',
                background: isLast ? '#FFFFFF' : color.metricPace,
                opacity: isLast ? 1 : 0.55,
                height: Math.max(p.value > 0 ? 2 : 0, Math.round(scale(p.value))),
              }}
            />
            <span style={{ fontFamily: font.mono, fontSize: 9, textAlign: 'center', color: isLast ? color.text : color.textFaint }}>
              {i % 2 === 0 || isLast ? p.label : ''}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── two or three sessions overlaid on one distance axis ──────────────
export function CompareSeriesChart({
  series,
  bucketM,
  invertY,
  fmtY,
  minSpan = 0,
  height = 150,
}: {
  series: { color: string; values: (number | null)[] }[];
  bucketM: number;
  /** Pace: a lower number is the better one, so it belongs higher up the axis. */
  invertY?: boolean;
  fmtY: (v: number) => string;
  /** Floor on the y range, so two nearly identical sessions do not get zoomed into a
   *  chart that dramatises a couple of seconds. */
  minSpan?: number;
  height?: number;
}) {
  const W = 390;
  const X0 = 40;
  const X1 = 380;
  const Y0 = 12;
  const Y1 = height - 24;
  const count = Math.max(1, ...series.map((s) => s.values.length));
  const flat = series.flatMap((s) => s.values).filter((v): v is number => v != null);
  const rawLo = flat.length > 0 ? Math.min(...flat) : 0;
  const rawHi = flat.length > 0 ? Math.max(...flat) : 1;
  const grow = Math.max(0, minSpan - (rawHi - rawLo)) / 2;
  const lo = rawLo - grow;
  const hi = rawHi + grow;
  const pad = Math.max(0.001, (hi - lo) * 0.12);
  const min = lo - pad;
  const max = hi + pad;

  const px = (i: number) => X0 + ((X1 - X0) * (i + 0.5)) / count;
  const py = (v: number) => {
    const f = (v - min) / (max - min);
    return invertY ? Y0 + f * (Y1 - Y0) : Y1 - f * (Y1 - Y0);
  };

  // Nulls are gaps in the data, not zeroes: lift the pen rather than drawing through them.
  const linePath = (values: (number | null)[]) => {
    let d = '';
    let pen = false;
    values.forEach((v, i) => {
      if (v == null) {
        pen = false;
        return;
      }
      d += `${pen ? 'L' : 'M'}${px(i).toFixed(1)} ${py(v).toFixed(1)} `;
      pen = true;
    });
    return d.trim();
  };

  const yTicks = [max - pad, (min + max) / 2, min + pad];
  const totalKm = (count * bucketM) / 1000;
  const xTicks = [0, 0.5, 1].map((f) => ({ f, km: totalKm * f }));

  return (
    <svg viewBox={`0 0 ${W} ${height}`} width="100%" height={height} style={{ display: 'block' }}>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={X0} x2={X1} y1={py(v)} y2={py(v)} stroke={color.chartGrid} strokeWidth={1} />
          <text x={4} y={py(v) + 3} fill={color.textFaint} fontFamily={font.mono} fontSize={10}>
            {fmtY(v)}
          </text>
        </g>
      ))}
      {series.map((s, i) => (
        <path key={i} d={linePath(s.values)} fill="none" stroke={s.color} strokeWidth={i === 0 ? 2 : 1.8} strokeLinejoin="round" strokeLinecap="round" />
      ))}
      {xTicks.map((t) => (
        <text
          key={t.f}
          x={X0 + (X1 - X0) * t.f}
          y={height - 6}
          fill={color.textFaint}
          fontFamily={font.mono}
          fontSize={10}
          textAnchor={t.f === 0 ? 'start' : t.f === 1 ? 'end' : 'middle'}
        >
          {t.km.toFixed(t.km >= 10 ? 0 : 1)} km
        </text>
      ))}
    </svg>
  );
}
