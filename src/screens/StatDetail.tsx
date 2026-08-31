import { useMemo, useState } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, RouteSilhouette, SectionHeader } from '../components/primitives';
import { StatTrendBars, LoadRatioBar } from '../components/charts';
import { elevationProfile, fmtDayMonth, type TrainedDay } from '../lib/stats';
import { buildStatDetail, type StatKey, type Tone } from '../lib/statDetails';
import { MAX_COMPARE } from '../lib/compare';
import type { Activity, Settings } from '../types';

const TONE_COLORS: Record<Tone, string> = {
  text: color.text,
  muted: color.textMuted,
  faint: color.textFaint,
  positive: color.positive,
  warning: color.warning,
};

const WEEKDAYS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

export function StatDetail({
  statKey,
  activities,
  settings,
  onBack,
  onCompare,
}: {
  statKey: StatKey;
  activities: Activity[];
  settings: Settings;
  onBack: () => void;
  onCompare: (ids: string[]) => void;
}) {
  // One stable reference time per mount, so the figures cannot drift under the reader.
  const [now] = useState(() => Date.now());
  const detail = useMemo(() => buildStatDetail(statKey, activities, settings, now), [statKey, activities, settings, now]);

  // Comparison only makes sense within one sport: pace and speed are different axes.
  const comparable = useMemo(() => {
    const sport = detail.contributors[0]?.activity.sport;
    return detail.contributors.filter((c) => c.activity.sport === sport).map((c) => c.activity);
  }, [detail]);

  return (
    <div style={S.screen}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 10px' }}>
        <button
          onClick={onBack}
          aria-label="Back to overview"
          style={{ background: 'none', border: 'none', color: color.textFaint, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: '0 6px 0 0' }}
        >
          ‹
        </button>
        <span style={S.title}>{detail.title}</span>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 40, display: 'flex', flexDirection: 'column', gap: 22 }}>
        <div style={{ padding: '6px 16px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Label>{detail.scope}</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ ...S.metricHero, color: color.text }}>{detail.value}</span>
            <span style={{ fontFamily: font.mono, fontSize: 18, color: color.textMuted }}>{detail.unit}</span>
          </div>
          <span style={{ fontSize: 13, lineHeight: 1.4, color: TONE_COLORS[detail.subTone] }}>{detail.sub}</span>
          {detail.ratio != null && detail.ratio > 0 && (
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <LoadRatioBar ratio={detail.ratio} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 10, color: color.textFaint }}>
                <span>0.6 detraining</span>
                <span>0.8–1.3 steady</span>
                <span>1.6 spike</span>
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <Label style={{ padding: '0 16px' }}>{detail.trendLabel}</Label>
          <div style={{ padding: '0 16px' }}>
            <StatTrendBars points={detail.trend} format={detail.trendFormat} />
          </div>
          <span style={{ padding: '0 16px', fontSize: 12, color: color.textFaint }}>Dashed line is the twelve-week average. This week is the lit bar.</span>
        </div>

        {detail.grid && <DayGrid days={detail.grid} />}

        {detail.rows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={S.tableHeaderRow}>
              {detail.columns.map((c, i) => (
                <span
                  key={c.label}
                  style={{
                    ...S.monoTick,
                    flex: c.width ? 'none' : 1,
                    width: c.width,
                    textAlign: i === 0 ? 'left' : 'right',
                  }}
                >
                  {c.label}
                </span>
              ))}
            </div>
            {detail.rows.map((row) => (
              <div key={row.key} style={{ ...S.tableRow, background: row.current ? 'rgba(139,132,247,0.08)' : undefined }}>
                {row.values.map((v, i) => {
                  const c = detail.columns[i];
                  const tone = row.tones?.[i];
                  return (
                    <span
                      key={c?.label ?? i}
                      style={{
                        ...S.tableNum,
                        flex: c?.width ? 'none' : 1,
                        width: c?.width,
                        textAlign: i === 0 ? 'left' : 'right',
                        color: tone ? TONE_COLORS[tone] : i === 0 ? color.textMuted : color.text,
                      }}
                    >
                      {v}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <SectionHeader
            right={
              comparable.length >= 2 ? (
                <button onClick={() => onCompare(comparable.slice(0, MAX_COMPARE).map((a) => a.id))} style={S.linkButton}>
                  Compare →
                </button>
              ) : undefined
            }
          >
            {detail.contributorsLabel}
          </SectionHeader>
          {detail.contributors.length === 0 ? (
            <span style={{ padding: '0 16px', ...S.body, color: color.textMuted }}>Nothing recorded in this window yet.</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {detail.contributors.map((c) => (
                <button
                  key={c.activity.id}
                  onClick={() => onCompare([c.activity.id])}
                  style={{ ...S.listRow, width: '100%', background: 'none', border: 'none', borderTop: `1px solid ${color.dividerHairline}`, cursor: 'pointer', textAlign: 'left' }}
                >
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 34, fontFeatureSettings: "'tnum' 1" }}>
                    {fmtDayMonth(c.activity.startedAt)}
                  </span>
                  <RouteSilhouette elevations={elevationProfile(c.activity)} width={56} />
                  <span style={{ flex: 1, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {c.activity.title}
                  </span>
                  <span style={{ ...S.tableNum, color: color.textMuted, whiteSpace: 'nowrap' }}>{c.contribution}</span>
                </button>
              ))}
            </div>
          )}
          <span style={{ padding: '0 16px', fontSize: 12, color: color.textFaint }}>Tap a session to take it into a comparison.</span>
        </div>

        <span style={{ padding: '0 16px', fontSize: 12, lineHeight: 1.45, color: color.textFaint, textWrap: 'pretty' }}>{detail.note}</span>
      </div>
    </div>
  );
}

/** Eight weeks of recorded days, weeks down the page and weekdays across it. */
function DayGrid({ days }: { days: TrainedDay[] }) {
  const lead = (new Date(days[0].day).getDay() + 6) % 7;
  const cells: (TrainedDay | null)[] = [...new Array(lead).fill(null), ...days];
  const rows: (TrainedDay | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const maxLoad = Math.max(1, ...days.map((d) => d.loadKm));

  return (
    <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <Label>Recorded days · 8 weeks</Label>
      <div style={{ display: 'flex', gap: 4 }}>
        {WEEKDAYS.map((w) => (
          <span key={w} style={{ ...S.monoTick, flex: 1, textAlign: 'center' }}>
            {w}
          </span>
        ))}
      </div>
      {rows.map((row, ri) => (
        <div key={ri} style={{ display: 'flex', gap: 4 }}>
          {row.map((cell, ci) => (
            <span
              key={ci}
              title={cell ? `${fmtDayMonth(cell.day)} · ${cell.sessions} session${cell.sessions === 1 ? '' : 's'}` : undefined}
              style={{
                flex: 1,
                height: 18,
                borderRadius: 2,
                background: !cell
                  ? 'transparent'
                  : cell.trained
                    ? `rgba(232,234,235,${(0.22 + 0.68 * Math.min(1, cell.loadKm / maxLoad)).toFixed(2)})`
                    : color.dividerHairline,
                boxShadow: cell?.isToday ? `inset 0 0 0 1px ${color.accent}` : undefined,
              }}
            />
          ))}
          {row.length < 7 && new Array(7 - row.length).fill(0).map((_, i) => <span key={`pad${i}`} style={{ flex: 1 }} />)}
        </div>
      ))}
      <span style={{ fontSize: 12, color: color.textFaint }}>Brighter is a bigger day. The outlined cell is today.</span>
    </div>
  );
}
