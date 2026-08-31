import type { CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, SensorChip } from '../components/primitives';
import { StatusStrip } from '../components/PhoneFrame';
import { useGpsFix } from '../hooks/useGpsFix';
import { isBluetoothSupported } from '../lib/ble';
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
  const run = sport === 'run';
  const locked = fix.status === 'locked';
  const bleOk = isBluetoothSupported();

  const gpsLabel =
    fix.status === 'locked' ? 'LOCKED' : fix.status === 'denied' ? 'PERMISSION DENIED' : fix.status === 'unsupported' ? 'NO GPS' : 'ACQUIRING';
  const gpsColor = locked ? color.positive : fix.status === 'denied' || fix.status === 'unsupported' ? color.critical : color.warning;

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
    <div style={{ height: '100%', background: color.captureBase, display: 'flex', flexDirection: 'column', padding: '44px 16px 32px', boxSizing: 'border-box', gap: 14 }}>
      <StatusStrip dark />

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
          <span style={{ ...S.caption, color: color.critical }}>Location permission is off. Grant it in the browser to record distance and pace.</span>
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
            This browser has no Web Bluetooth. Pace, distance and elevation still record from GPS.
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
