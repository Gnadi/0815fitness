import { useMemo, useState } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, RouteSilhouette, SectionHeader } from '../components/primitives';
import { VolumeBars, LoadRatioBar } from '../components/charts';
import { StatusStrip } from '../components/PhoneFrame';
import {
  computeStreak,
  elevationProfile,
  fmtDayMonth,
  fmtPace,
  hoursMinutes,
  isoWeekLabel,
  lastNWeekStarts,
  loadBalance,
  rollupWeeks,
} from '../lib/stats';
import { generateDemoHistory } from '../lib/demoSeed';
import type { Activity, Settings } from '../types';

const WEEKDAYS = ['MO', 'DI', 'MI', 'DO', 'FR', 'SA', 'SO'];

export function Overview({
  activities,
  settings,
  onRecord,
  onAnalyse,
  onReplaceActivities,
}: {
  activities: Activity[];
  settings: Settings;
  onRecord: () => void;
  onAnalyse: () => void;
  onReplaceActivities: (next: Activity[]) => void;
}) {
  // One stable reference time per mount, so memoised aggregates don't churn.
  const [now] = useState(() => Date.now());
  const weekStarts = useMemo(() => lastNWeekStarts(8, now), [now]);
  const rollups = useMemo(() => rollupWeeks(activities, weekStarts), [activities, weekStarts]);
  const streak = useMemo(() => computeStreak(activities, now), [activities, now]);

  const thisWeek = rollups[rollups.length - 1];
  const lastWeek = rollups[rollups.length - 2];
  const balance = useMemo(() => loadBalance(activities, now), [activities, now]);
  const ratio = balance.ratio;
  const delta = thisWeek.runKm - lastWeek.runKm;

  const d = new Date(now);
  const dateLine = `${WEEKDAYS[(d.getDay() + 6) % 7]} ${fmtDayMonth(now)}.${d.getFullYear()} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

  const latest = activities.slice(0, 3);
  const empty = activities.length === 0;

  const daysElapsedThisWeek = Math.floor((now - thisWeek.weekStart) / 86400000) + 1;
  const restDaysThisWeek = Math.max(0, daysElapsedThisWeek - thisWeek.activeDays.size);
  const weekStats = [
    { label: 'Time', value: hoursMinutes(thisWeek.timeS), unit: 'hours' },
    { label: 'Ascent', value: String(Math.round(thisWeek.ascentM)), unit: 'metres' },
    { label: 'Ride', value: thisWeek.rideKm.toFixed(0), unit: 'km' },
    { label: 'Sessions', value: String(thisWeek.sessions), unit: `${restDaysThisWeek} rest` },
  ];

  const ratioNote =
    ratio === 0 ? 'no load recorded yet' : ratio > 1.3 ? 'ratio · above the steady band' : ratio < 0.8 ? 'ratio · below the steady band' : 'ratio · inside the steady band';

  return (
    <div style={S.screen}>
      <StatusStrip />
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 16px 12px' }}>
        <span style={S.title}>Overview</span>
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint, fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>{dateLine}</span>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 24 }}>
        {empty ? (
          <div style={{ padding: '8px 16px 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ ...S.body, color: color.textMuted, textWrap: 'pretty' }}>
              No activities recorded yet. Tap RECORD to start one — your week, streak and load build from what you record here.
            </span>
            <button
              onClick={() => onReplaceActivities(generateDemoHistory(settings.maxHr))}
              style={{ ...S.linkButton, alignSelf: 'flex-start', fontSize: 13 }}
            >
              Load 13 weeks of sample history →
            </button>
            <span style={{ ...S.caption, color: color.textFaint }}>Sample history is synthetic and marked as such; recording your own replaces nothing.</span>
          </div>
        ) : (
          <>
            <div style={{ padding: '0 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Label>
                  This week · {fmtDayMonth(weekStarts[weekStarts.length - 1])}–{fmtDayMonth(weekStarts[weekStarts.length - 1] + 6 * 86400000)}
                </Label>
                <span
                  style={{
                    fontFamily: font.mono,
                    fontSize: 11,
                    fontFeatureSettings: "'tnum' 1",
                    color: delta >= 0 ? color.positive : color.textMuted,
                  }}
                >
                  {delta >= 0 ? '+' : '−'}
                  {Math.abs(delta).toFixed(1)} km vs last
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ ...S.metricHero, color: color.text }}>{thisWeek.runKm.toFixed(2)}</span>
                <span style={{ fontFamily: font.mono, fontSize: 20, color: color.textMuted }}>km run</span>
              </div>
              <div style={{ ...S.cardGrid, marginTop: 14 }}>
                {weekStats.map((w) => (
                  <div key={w.label} style={S.cardCell}>
                    <Label>{w.label}</Label>
                    <span style={{ ...S.metric, fontWeight: 600, color: color.text }}>{w.value}</span>
                    <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint }}>{w.unit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Label>Consecutive days trained</Label>
                <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, fontFeatureSettings: "'tnum' 1" }}>longest {streak.longest}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}>
                <span style={{ ...S.metricLarge, color: color.text }}>{streak.current}</span>
                <span style={{ fontSize: 13, color: color.textMuted, paddingBottom: 3 }}>
                  days · {streak.restDaysLast21} rest days in the last 21
                </span>
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'flex-end', height: 50 }}>
                {streak.last14.map((day) => (
                  <div key={day.dayKey} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
                    <span
                      style={{
                        width: '100%',
                        height: day.trained ? 30 : 10,
                        borderRadius: 2,
                        background: day.isToday ? 'rgba(139,132,247,0.5)' : day.trained ? color.metricPace : color.dividerHairline,
                        boxShadow: day.isToday ? `inset 0 0 0 1px ${color.accent}` : undefined,
                      }}
                    />
                    <span style={{ fontFamily: font.mono, fontSize: 10, color: day.isToday ? color.accent : color.textFaint }}>{day.letter}</span>
                  </div>
                ))}
              </div>
              <span style={{ fontSize: 12, lineHeight: 1.35, color: color.textFaint }}>Recorded days, not a target. A rest day is not a broken anything.</span>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Label>Volume · last 8 weeks</Label>
              <VolumeBars weeks={rollups.map((r) => ({ label: isoWeekLabel(r.weekStart).slice(1), runKm: r.runKm, rideKm: r.rideKm }))} />
              <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                  <span style={{ width: 14, height: 2, background: color.metricPace }} />
                  run km
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: color.textMuted }}>
                  <span style={{ width: 14, height: 2, background: color.metricSpeed }} />
                  ride km ÷ 3
                </span>
              </div>
            </div>

            <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <Label>Load · 7 day vs 28 day</Label>
                <button onClick={onAnalyse} style={S.linkButton}>
                  Analyse →
                </button>
              </div>
              <div style={{ padding: 12, background: color.surface, border: `1px solid ${color.border}`, borderRadius: 8, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ ...S.metricLarge, color: color.text }}>{ratio.toFixed(2)}</span>
                  <span style={{ fontSize: 13, color: color.textMuted }}>{ratioNote}</span>
                </div>
                <LoadRatioBar ratio={ratio} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 10, color: color.textFaint }}>
                  <span>0.6 detraining</span>
                  <span>0.8–1.3 steady</span>
                  <span>1.6 spike</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <SectionHeader>Latest</SectionHeader>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {latest.map((a) => {
                  const durationS = (a.endedAt - a.startedAt) / 1000;
                  const avgSpeed = durationS > 0 ? a.distance / durationS : 0;
                  const metric =
                    a.sport === 'run'
                      ? `${(a.distance / 1000).toFixed(1)} km · ${avgSpeed > 0.2 ? fmtPace(1000 / avgSpeed) : '—:—'}`
                      : `${(a.distance / 1000).toFixed(1)} km · ${a.power.length > 1 ? `${Math.round(a.power.reduce((s, p) => s + p.watts, 0) / a.power.length)} W` : `${(avgSpeed * 3.6).toFixed(1)} km/h`}`;
                  return (
                    <div key={a.id} style={S.listRow}>
                      <span style={{ fontFamily: font.mono, fontSize: 11, color: color.textFaint, width: 34, fontFeatureSettings: "'tnum' 1" }}>{fmtDayMonth(a.startedAt)}</span>
                      <RouteSilhouette elevations={elevationProfile(a)} />
                      <span style={{ flex: 1, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.title}</span>
                      <span style={{ ...S.tableNum, color: color.textMuted }}>{metric}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 16px 24px', background: 'linear-gradient(to top,#0B0C0D 62%,rgba(11,12,13,0))' }}>
        <button
          onClick={onRecord}
          style={{
            width: '100%',
            height: 52,
            borderRadius: 999,
            background: color.accent,
            border: 'none',
            color: color.onAccent,
            fontFamily: font.mono,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.12em',
            cursor: 'pointer',
          }}
        >
          RECORD
        </button>
      </div>
    </div>
  );
}
