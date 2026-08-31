import { useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font, HR_ZONE_BOUNDS } from '../theme';
import * as S from '../styles';
import { Label } from '../components/primitives';
import { TrackMap } from '../components/charts';
import { useRecorder } from '../hooks/useRecorder';
import { useWakeLock } from '../hooks/useWakeLock';
import { fmtClock, fmtPace } from '../lib/stats';
import type { GeoSample, HrSample, PowerSample, CadenceSample, Lap, Sport, Settings } from '../types';
import type { SensorSet } from '../App';

export interface ActivityDraft {
  sport: Sport;
  startedAt: number;
  endedAt: number;
  points: GeoSample[];
  laps: Lap[];
  hr: HrSample[];
  power: PowerSample[];
  cadence: CadenceSample[];
  distance: number;
  ascent: number;
}

const controlButton: CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: 999,
  background: 'none',
  border: `1px solid ${color.border}`,
  color: color.textMuted,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  cursor: 'pointer',
};

export function RecordingSession({
  sport,
  sensors,
  settings,
  onFinish,
}: {
  sport: Sport;
  sensors: SensorSet;
  settings: Settings;
  onFinish: (draft: ActivityDraft) => void;
}) {
  const { snapshot, actions } = useRecorder(sport, true);
  useWakeLock(true);
  const [mapOpen, setMapOpen] = useState(false);
  const autoPausedSince = useRef<number | null>(null);
  const [, forceTick] = useState(0);

  // Feed live BLE readings into the recording as they arrive. Keyed on the sensor's
  // notification tick, so an unchanged reading still records a sample.
  const hrValue = sensors.hr.value;
  const powerValue = sensors.power.value;
  const cadenceValueLive = sensors.cadence.value;
  useEffect(() => {
    if (hrValue != null) actions.feedHr(hrValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensors.hr.tick]);
  useEffect(() => {
    if (powerValue != null) actions.feedPower(powerValue);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensors.power.tick]);
  useEffect(() => {
    if (cadenceValueLive != null) actions.feedCadence(cadenceValueLive);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sensors.cadence.tick]);

  useEffect(() => {
    if (snapshot.status === 'autoPaused') {
      if (autoPausedSince.current == null) autoPausedSince.current = Date.now();
    } else {
      autoPausedSince.current = null;
    }
  }, [snapshot.status]);

  // A once-a-second repaint so the clock keeps moving even between GPS fixes.
  useEffect(() => {
    const h = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(h);
  }, []);

  const run = sport === 'run';
  const paused = snapshot.status === 'paused' || snapshot.status === 'autoPaused';
  const dim = paused;
  const bigStyle: CSSProperties = { ...S.metricHero, color: dim ? color.textMuted : color.textCapture };

  const hrConnected = sensors.hr.state === 'connected' && snapshot.liveHr != null;
  const powerConnected = sensors.power.state === 'connected' && snapshot.livePower != null;
  const cadenceValue = snapshot.liveCadence;

  const speed = snapshot.liveSpeedMps;
  const avgSpeed = snapshot.elapsedS > 0 ? snapshot.distanceM / snapshot.elapsedS : 0;
  const paceSec = speed && speed > 0.2 ? 1000 / speed : null;
  const avgPaceSec = avgSpeed > 0.2 ? 1000 / avgSpeed : null;

  const heroLabel = run ? 'Pace' : powerConnected ? 'Power' : 'Speed';
  const heroValue = run
    ? paceSec
      ? fmtPace(paceSec)
      : '—:—'
    : powerConnected
      ? String(Math.round(snapshot.livePower ?? 0))
      : speed != null
        ? (speed * 3.6).toFixed(1)
        : '—';
  const heroUnit = run ? '/km' : powerConnected ? 'W' : 'km/h';
  const heroSub = run
    ? `avg ${avgPaceSec ? fmtPace(avgPaceSec) : '—:—'} · ${Math.round(snapshot.ascentM)} m ascent`
    : powerConnected
      ? `avg ${Math.round(avgWatts(snapshot.power))} W · ${Math.round(snapshot.ascentM)} m ascent`
      : `avg ${(avgSpeed * 3.6).toFixed(1)} km/h · no power meter paired`;

  const hrPct = snapshot.liveHr ? snapshot.liveHr / settings.maxHr : 0;
  const hrZoneIdx = HR_ZONE_BOUNDS.slice(0, 5).reduce((acc, bound, i) => (hrPct >= bound ? i : acc), 0);
  const waitingForFix = snapshot.points.length === 0 || !snapshot.gpsOk;

  const finish = () => {
    actions.finish();
    onFinish({
      sport,
      startedAt: snapshot.startedAt ?? Date.now(),
      endedAt: Date.now(),
      points: snapshot.points,
      laps: snapshot.laps,
      hr: snapshot.hr,
      power: snapshot.power,
      cadence: snapshot.cadence,
      distance: snapshot.distanceM,
      ascent: snapshot.ascentM,
    });
  };

  const autoPauseSeconds = autoPausedSince.current ? Math.round((Date.now() - autoPausedSince.current) / 1000) : 0;

  return (
    <div style={{ height: '100%', background: color.captureBase, display: 'flex', flexDirection: 'column', boxSizing: 'border-box', padding: 'max(20px, env(safe-area-inset-top)) 0 40px', position: 'relative' }}>

      {snapshot.status === 'autoPaused' && (
        <Banner text={`AUTO-PAUSED · NO MOVEMENT ${fmtClock(autoPauseSeconds)}`} />
      )}
      {snapshot.status !== 'autoPaused' && waitingForFix && <Banner text="ACQUIRING FIX · DISTANCE HELD" />}

      <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Label>{heroLabel}</Label>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ ...S.metricCapture, color: dim ? color.textMuted : color.textCapture }}>{heroValue}</span>
          <span style={{ fontFamily: font.mono, fontSize: 20, fontWeight: 500, color: color.textMuted }}>{heroUnit}</span>
        </div>
        <span style={{ fontFamily: font.mono, fontSize: 13, color: color.textFaint, fontFeatureSettings: "'tnum' 1, 'zero' 1" }}>{heroSub}</span>
      </div>

      <div style={{ marginTop: 22, padding: '0 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 20, columnGap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Label>Distance</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={bigStyle}>{(snapshot.distanceM / 1000).toFixed(2)}</span>
            <span style={{ fontFamily: font.mono, fontSize: 15, color: color.textMuted }}>km</span>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Label>Elapsed</Label>
          <span style={bigStyle}>{fmtClock(snapshot.elapsedS)}</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Label>Heart rate</Label>
          {hrConnected ? (
            <>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ ...S.metricHero, color: dim ? color.textMuted : color.metricHr }}>{snapshot.liveHr}</span>
                <span style={{ fontFamily: font.mono, fontSize: 15, color: color.textMuted }}>bpm</span>
              </div>
              <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>
                zone {hrZoneIdx + 1} · {Math.round(hrPct * 100)} % max
              </span>
            </>
          ) : (
            <>
              <span style={{ ...S.metricHero, color: color.borderStrong }}>- -</span>
              <span style={{ fontSize: 12, color: color.textFaint }}>No strap paired</span>
            </>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Label>Cadence</Label>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={cadenceValue != null ? bigStyle : { ...S.metricHero, color: color.borderStrong }}>
              {cadenceValue != null ? Math.round(cadenceValue) : '- -'}
            </span>
            <span style={{ fontFamily: font.mono, fontSize: 15, color: color.textMuted }}>{run ? 'spm' : 'rpm'}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 20, padding: '9px 16px', display: 'flex', alignItems: 'center', gap: 12, ...S.sunkWell }}>
        <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: '.06em', color: color.textFaint }}>LAP {snapshot.currentLapNo}</span>
        <span style={{ ...S.tableNum, color: color.text }}>{(snapshot.currentLapDistM / 1000).toFixed(2)} km</span>
        <span style={{ ...S.tableNum, color: color.text }}>{fmtClock(snapshot.currentLapDurationS)}</span>
        <span style={{ flex: 1 }} />
        <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>
          prev {snapshot.prevLapDurationS != null ? fmtClock(snapshot.prevLapDurationS) : '—'}
        </span>
      </div>

      <div
        onClick={() => setMapOpen((o) => !o)}
        style={{
          marginTop: 16,
          position: 'relative',
          overflow: 'hidden',
          cursor: 'pointer',
          background: color.surfaceSunk,
          borderTop: `1px solid ${color.dividerHairline}`,
          borderBottom: `1px solid ${color.dividerHairline}`,
          transition: 'height 200ms cubic-bezier(0.2,0,0,1)',
          height: mapOpen ? 260 : 96,
        }}
      >
        <TrackMap points={snapshot.points} height={mapOpen ? 260 : 96} />
        <span style={{ position: 'absolute', left: 16, bottom: 10, fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: '.06em', color: color.textFaint }}>
          {mapOpen ? `TAP TO COLLAPSE · ${(snapshot.distanceM / 1000).toFixed(1)} KM TRACKED` : 'TAP TO EXPAND MAP'}
        </span>
      </div>

      <span style={{ flex: 1 }} />

      <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button onClick={actions.lock} style={controlButton} aria-label="Lock screen">
          <LockGlyph />
          <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: '.08em' }}>LOCK</span>
        </button>
        <button
          onClick={actions.togglePause}
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            cursor: 'pointer',
            fontFamily: font.mono,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '.1em',
            ...(paused
              ? { background: color.accent, border: 'none', color: color.onAccent }
              : { background: 'none', border: `1px solid ${color.critical}`, color: color.critical }),
          }}
        >
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
        <button onClick={actions.addLap} style={controlButton} aria-label="Split lap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 21V4h9l-1.2 3.4L14 11H5" />
          </svg>
          <span style={{ fontFamily: font.mono, fontSize: 9, letterSpacing: '.08em' }}>LAP</span>
        </button>
      </div>

      {paused && (
        <div style={{ padding: '14px 16px 0', display: 'flex', justifyContent: 'center' }}>
          <button
            onClick={finish}
            style={{
              padding: '0 22px',
              height: 44,
              borderRadius: 999,
              background: 'none',
              border: `1px solid ${color.critical}`,
              color: color.critical,
              fontFamily: font.mono,
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '.08em',
              cursor: 'pointer',
            }}
          >
            FINISH &amp; SAVE
          </button>
        </div>
      )}

      {snapshot.locked && (
        <div
          onDoubleClick={actions.unlock}
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0,0,0,0.96)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 26,
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Label>Elapsed</Label>
            <span style={{ ...S.metricCapture, color: color.textCapture }}>{fmtClock(snapshot.elapsedS)}</span>
          </div>
          <div style={{ display: 'flex', gap: 28 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Label>Distance</Label>
              <span style={{ ...S.metricLarge, color: color.textCapture }}>{(snapshot.distanceM / 1000).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <Label>{heroLabel}</Label>
              <span style={{ ...S.metricLarge, color: color.textCapture }}>{heroValue}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '10px 16px', border: `1px dashed ${color.borderStrong}`, borderRadius: 999 }}>
            <LockGlyph stroke={color.textMuted} />
            <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: color.textMuted }}>DOUBLE-TAP TO UNLOCK</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Banner({ text }: { text: string }) {
  return (
    <div
      style={{
        margin: '0 16px 12px',
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'rgba(201,144,60,0.14)',
        border: `1px solid ${color.warning}`,
        borderRadius: 4,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color.warning} strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4" />
        <path d="M12 16h.01" />
      </svg>
      <span style={{ fontFamily: font.mono, fontSize: 12, fontWeight: 500, letterSpacing: '.06em', color: color.warning }}>{text}</span>
    </div>
  );
}

function LockGlyph({ stroke = 'currentColor' }: { stroke?: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round">
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

function avgWatts(samples: PowerSample[]): number {
  if (samples.length === 0) return 0;
  return samples.reduce((s, p) => s + p.watts, 0) / samples.length;
}
