import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, SensorChip } from '../components/primitives';
import { useGpsFix } from '../hooks/useGpsFix';
import { isBluetoothSupported } from '../lib/ble';
import { openLocationSettings } from '../lib/location';
import { checkReadiness, requestBatteryExemption, requestNotifications, type Readiness } from '../lib/readiness';
import type { Sport } from '../types';
import type { SensorSet } from '../App';

const tabBase: CSSProperties = {
  flex: 1,
  height: 42,
  border: 'none',
  borderRadius: 999,
  cursor: 'pointer',
  fontFamily: font.mono,
  fontSize: 13,
  fontWeight: 600,
  letterSpacing: '.1em',
};
const tabOn: CSSProperties = { ...tabBase, background: color.accentWash, color: color.accent, boxShadow: `inset 0 0 0 1px ${color.accent}` };
const tabOff: CSSProperties = { ...tabBase, background: 'none', color: color.textFaint };

const BAR_HEIGHTS = [8, 14, 6, 18, 11, 16, 9, 13, 7, 15, 10, 12];

/** The line above the START button, and the only place the app now warns about
 *  recording at all. Three tones, because the three cases are genuinely different: a
 *  refusal that costs the whole track, a phone that may cut the session short, and the
 *  ordinary case, which deserves to be stated rather than left silent. */
function PreflightNote({
  tone,
  action,
  children,
}: {
  tone: 'good' | 'warn' | 'bad';
  action: { label: string; onClick: () => void } | null;
  children: React.ReactNode;
}) {
  const accent = tone === 'bad' ? color.critical : tone === 'warn' ? color.warning : color.positive;
  return (
    <div
      style={{
        display: 'flex',
        gap: 9,
        alignItems: 'flex-start',
        padding: '10px 12px',
        border: `1px solid ${tone === 'good' ? color.border : accent}`,
        background: tone === 'good' ? 'none' : `${accent}1a`,
        borderRadius: 8,
      }}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none', marginTop: 1 }}>
        <circle cx="12" cy="12" r="9" />
        {tone === 'good' ? <path d="M8.5 12.5l2.5 2.5 4.5-5" /> : <path d="M12 8v5M12 16.5v.01" />}
      </svg>
      <span style={{ flex: 1, fontSize: 12, lineHeight: 1.45, color: tone === 'good' ? color.textMuted : accent, textWrap: 'pretty' }}>{children}</span>
      {action && (
        <button
          onClick={action.onClick}
          style={{
            flex: 'none',
            alignSelf: 'center',
            border: `1px solid ${accent}`,
            background: 'none',
            color: accent,
            borderRadius: 999,
            padding: '5px 11px',
            cursor: 'pointer',
            fontFamily: font.mono,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '.08em',
          }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export function PreStart({
  sport,
  onSport,
  sensors,
  onStart,
  onBack,
}: {
  sport: Sport;
  onSport: (s: Sport) => void;
  sensors: SensorSet;
  onStart: () => void;
  onBack: () => void;
}) {
  const fix = useGpsFix(true);
  // Whether the phone will let a recording run is worth knowing before setting off
  // rather than after — the same argument the wake-lock warning used to make, about the
  // two things that can still stop or hide a session now that the screen cannot.
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const recheck = useCallback(() => void checkReadiness().then(setReadiness), []);
  useEffect(() => {
    recheck();
    // Answering a system dialog brings the app back, and the answer is the new state.
    const onVisible = () => {
      if (document.visibilityState === 'visible') recheck();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [recheck]);
  const run = sport === 'run';
  const locked = fix.status === 'locked';
  const bleOk = isBluetoothSupported();

  const gpsBlocked = fix.status === 'denied' || fix.status === 'disabled';
  const gpsLabel =
    fix.status === 'locked'
      ? 'LOCKED'
      : fix.status === 'denied'
        ? 'PERMISSION DENIED'
        : fix.status === 'disabled'
          ? 'LOCATION OFF'
          : 'ACQUIRING';
  const gpsColor = locked ? color.positive : gpsBlocked ? color.critical : color.warning;

  const hrMissing = sensors.hr.state !== 'connected';
  const powerMissing = sensors.power.state !== 'connected';

  const fields = [
    {
      label: run ? 'Pace' : 'Power',
      placeholder: run ? '—:—' : '— — —',
      note: run ? 'phone GPS, 25 s smoothed' : powerMissing ? 'meter absent → speed' : 'BLE power meter',
      warn: !run && powerMissing,
    },
    { label: 'Distance', placeholder: '— . — —', note: 'phone GPS', warn: false },
    { label: 'Elapsed', placeholder: '— : — —', note: 'auto-pause on', warn: false },
    {
      label: 'Heart rate',
      placeholder: '— — —',
      note: hrMissing ? 'strap absent → cadence' : 'BLE strap',
      warn: hrMissing,
    },
  ];

  const sensorChips = run
    ? [
        { name: 'HR strap', api: sensors.hr },
        { name: 'Foot pod', api: sensors.cadence },
      ]
    : [
        { name: 'HR strap', api: sensors.hr },
        { name: 'Power meter', api: sensors.power },
        { name: 'Bike cadence', api: sensors.cadence },
      ];

  return (
    <div style={{ height: '100%', background: color.captureBase, display: 'flex', flexDirection: 'column', padding: 'max(44px, calc(env(safe-area-inset-top) + 14px)) 16px max(32px, env(safe-area-inset-bottom))', boxSizing: 'border-box', gap: 14 }}>

      <div style={{ display: 'flex', alignItems: 'center', height: 36, marginLeft: -10 }}>
        <button
          onClick={onBack}
          aria-label="Back to overview"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            height: 36,
            padding: '0 10px',
            background: 'none',
            border: 'none',
            color: color.textFaint,
            cursor: 'pointer',
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 18, lineHeight: 1 }}>‹</span> Overview
        </button>
      </div>

      <div style={{ display: 'flex', padding: 3, border: `1px solid ${color.border}`, borderRadius: 999, gap: 3 }}>
        <button onClick={() => onSport('run')} style={run ? tabOn : tabOff}>
          RUN
        </button>
        <button onClick={() => onSport('ride')} style={run ? tabOff : tabOn}>
          RIDE
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '14px 14px 16px', background: color.surfaceSunk, border: `1px solid ${color.dividerHairline}`, borderRadius: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>GPS fix</Label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: gpsColor,
                animation: locked || fix.status === 'denied' ? undefined : 'ctSearch 1.6s ease-in-out infinite',
              }}
            />
            <span style={{ fontFamily: font.mono, fontSize: 11, fontWeight: 500, letterSpacing: '.08em', color: gpsColor }}>{gpsLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
          <span style={{ ...S.metricLarge, color: color.textCapture }}>{fix.accuracy != null ? `±${fix.accuracy.toFixed(0)}` : '—'}</span>
          <span style={{ fontSize: 12, color: color.textMuted, paddingBottom: 4 }}>m accuracy</span>
          <span style={{ flex: 1 }} />
          <span style={{ ...S.metric, color: color.text }}>{fix.coords ? `${fix.coords.lat.toFixed(3)}` : '—'}</span>
          <span style={{ fontSize: 12, color: color.textMuted, paddingBottom: 2 }}>lat</span>
        </div>
        <div style={{ display: 'flex', gap: 3, height: 18, alignItems: 'flex-end' }}>
          {BAR_HEIGHTS.map((h, i) => (
            <span
              key={i}
              style={{
                flex: 1,
                borderRadius: 1,
                height: h,
                background: i < fix.strength ? (locked ? color.positive : color.warning) : color.dividerHairline,
              }}
            />
          ))}
        </div>
        {fix.status === 'denied' && (
          <span style={{ ...S.caption, color: color.critical }}>Location permission is off. Grant it to record distance and pace.</span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <Label>Sensors</Label>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {sensorChips.map((c) => (
            <SensorChip
              key={c.name}
              name={c.name}
              state={c.api.state}
              onClick={c.api.toggle}
              disabled={!bleOk}
              detail={!bleOk ? 'no bluetooth' : c.api.state === 'connected' ? (c.api.deviceName ?? '') : undefined}
            />
          ))}
        </div>
        {!bleOk && (
          <span style={{ ...S.caption, color: color.textFaint }}>
            Sensors need the app on a phone. Pace, distance and elevation still record from GPS.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Label>Data fields</Label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, background: color.dividerHairline, border: `1px solid ${color.border}`, borderRadius: 8, overflow: 'hidden' }}>
          {fields.map((f) => (
            <div key={f.label} style={{ background: color.surface, padding: '11px 12px 13px', display: 'flex', flexDirection: 'column', gap: 3, minHeight: 64, boxSizing: 'border-box' }}>
              <Label>{f.label}</Label>
              <span style={{ ...S.metric, color: color.borderStrong }}>{f.placeholder}</span>
              <span style={{ fontSize: 11, color: f.warn ? color.warning : color.textFaint }}>{f.note}</span>
            </div>
          ))}
        </div>
      </div>

      <span style={{ flex: 1 }} />

      {/* What used to stand here was an apology: the browser only reported a position
          while the app was on screen, and the wake lock was the whole mitigation. The
          foreground service ended that, so this says the two things that can still
          stop a recording — a refused permission, and a manufacturer's battery care
          shutting the service down anyway — and offers the way to fix each. When
          neither applies it says so, because "you can pocket the phone" is the single
          most useful thing this screen can tell someone. */}
      {(() => {
        // In order of what it costs: no track at all, then a session the phone may cut
        // short, then a session that runs invisibly. Only the first one is shown at a
        // time — a stack of warnings above the START button is a screen nobody reads.
        const problem = gpsBlocked
          ? ('location' as const)
          : readiness?.batteryExempt === false
            ? ('battery' as const)
            : readiness?.notificationsAllowed === false
              ? ('notifications' as const)
              : null;
        const action =
          problem === 'location'
            ? { label: 'SETTINGS', onClick: () => void openLocationSettings() }
            : problem === 'battery'
              ? { label: 'ALLOW', onClick: () => void requestBatteryExemption().then(recheck) }
              : problem === 'notifications'
                ? { label: 'ALLOW', onClick: () => void requestNotifications().then(recheck) }
                : null;
        return (
          <PreflightNote tone={problem === 'location' ? 'bad' : problem ? 'warn' : 'good'} action={action}>
            {problem === 'location'
              ? fix.status === 'denied'
                ? 'Contour cannot see your location. Grant it, or this session records time and sensors but no track.'
                : 'Location is switched off on this phone. Turn it on, or this session records time and sensors but no track.'
              : problem === 'battery'
                ? 'This phone restricts Contour in the background, and some manufacturers stop a recording within minutes of the screen going off. Letting it run unrestricted is what keeps the track going.'
                : problem === 'notifications'
                  ? 'Notifications are off, so the session will record but will not show in the shade — there will be nothing to tap to get back to it, and no sign it is still running.'
                  : 'Lock the phone and put it away. Recording continues with the screen off, and the notification will show the session until you finish it.'}
          </PreflightNote>
        );
      })()}

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <button
          onClick={onStart}
          style={{
            width: 88,
            height: 88,
            borderRadius: 999,
            border: 'none',
            cursor: 'pointer',
            fontFamily: font.mono,
            fontSize: 15,
            fontWeight: 700,
            letterSpacing: '.12em',
            background: color.accent,
            color: color.onAccent,
            boxShadow: locked ? undefined : `0 0 0 1px #000000, 0 0 0 3px ${color.warning}`,
          }}
        >
          START
        </button>
        <span style={{ fontSize: 12, lineHeight: 1.25, color: color.textFaint, textAlign: 'center', maxWidth: 250 }}>
          {locked
            ? `Fix acquired · ${run ? 'run' : 'ride'} · fields set`
            : 'Recording will start now and correct the track once the fix lands.'}
        </span>
      </div>
    </div>
  );
}
