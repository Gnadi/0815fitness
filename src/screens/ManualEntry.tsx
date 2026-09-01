import { useMemo, useState } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { ActionButton, Field, ScreenHeader, Segmented } from '../components/primitives';
import { useUnits } from '../hooks/useUnits';
import { manualDerived } from '../lib/derived';
import { makeId } from '../lib/storage';
import { fmtClock } from '../lib/stats';
import type { Activity, Settings, Sport } from '../types';

const EFFORT_WORDS = ['Recovery', 'Very easy', 'Easy', 'Steady', 'Moderate', 'Comfortably hard', 'Hard', 'Very hard', 'Near maximal', 'All out'];

function localInputValue(t: number): string {
  const d = new Date(t);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

/** A session that happened without the phone.
 *
 *  A treadmill hour, a run someone forgot to start, a session recorded on a watch that
 *  never made it here. Without a way to enter one, every such session is invisible to
 *  the week, the streak and the load — which does not make those figures conservative,
 *  it makes them wrong. */
export function ManualEntry({
  settings,
  onBack,
  onSave,
}: {
  settings: Settings;
  onBack: () => void;
  onSave: (activity: Activity) => void;
}) {
  const units = useUnits();
  const [sport, setSport] = useState<Sport>('run');
  const [when, setWhen] = useState(() => localInputValue(Date.now()));
  const [distance, setDistance] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('45');
  const [ascent, setAscent] = useState('');
  const [avgHr, setAvgHr] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [effort, setEffort] = useState(5);
  const [gearId, setGearId] = useState<string | null>(null);

  const gearForSport = settings.gear.filter((g) => g.sport === sport && !g.retired);
  const distanceM = units.toMetres(Number(distance) || 0);
  const durationS = (Number(hours) || 0) * 3600 + (Number(minutes) || 0) * 60;
  const startedAt = new Date(when).getTime();
  const valid = distanceM > 0 && durationS > 0 && isFinite(startedAt);

  const pace = useMemo(() => {
    if (!valid) return null;
    const speed = distanceM / durationS;
    return sport === 'run'
      ? `${units.fmtPace(1000 / speed)}${units.paceUnit}`
      : `${units.fmtSpeed(speed)} ${units.speedUnit}`;
  }, [valid, distanceM, durationS, sport, units]);

  const save = () => {
    if (!valid) return;
    const hr = Number(avgHr);
    const hour = new Date(startedAt).getHours();
    const timeOfDay = hour < 11 ? 'Morning' : hour < 17 ? 'Midday' : 'Evening';
    onSave({
      id: makeId(),
      sport,
      startedAt,
      endedAt: startedAt + durationS * 1000,
      title: title.trim() || `${timeOfDay} ${sport === 'run' ? 'Run' : 'Ride'}`,
      notes,
      effort,
      gearId: gearId ?? gearForSport[0]?.id ?? null,
      laps: [],
      distance: distanceM,
      ascent: units.units === 'metric' ? Number(ascent) || 0 : (Number(ascent) || 0) * 0.3048,
      source: 'manual',
      hasSamples: false,
      derived: manualDerived({ movingS: durationS, avgHr: isFinite(hr) && hr > 0 ? hr : null }),
    });
  };

  return (
    <div style={S.screen}>
      <ScreenHeader title="Add a session" onBack={onBack} />

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '6px 16px 40px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Field label="Sport">
          <Segmented
            ariaLabel="Sport"
            options={[
              { value: 'run', label: 'RUN' },
              { value: 'ride', label: 'RIDE' },
            ]}
            value={sport}
            onChange={(v) => {
              setSport(v);
              setGearId(null);
            }}
          />
        </Field>

        <Field label="When">
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} style={{ ...S.input, colorScheme: 'dark' }} />
        </Field>

        <Field label={`Distance (${units.distanceUnit})`}>
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            placeholder="0.00"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            style={S.input}
          />
        </Field>

        <Field label="Duration" hint={valid ? `${fmtClock(durationS)} · ${pace}` : 'Distance and duration are what everything else is computed from.'}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input type="number" inputMode="numeric" value={hours} onChange={(e) => setHours(e.target.value)} style={{ ...S.input, flex: 1 }} />
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>h</span>
            <input type="number" inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} style={{ ...S.input, flex: 1 }} />
            <span style={{ fontFamily: font.mono, fontSize: 12, color: color.textFaint }}>min</span>
          </div>
        </Field>

        <Field label={`Ascent (${units.elevationUnit}) — optional`}>
          <input type="number" inputMode="numeric" placeholder="0" value={ascent} onChange={(e) => setAscent(e.target.value)} style={S.input} />
        </Field>

        <Field
          label="Average heart rate — optional"
          hint="Entered here it counts towards the zone distribution and the load, at the one value you give it."
        >
          <input type="number" inputMode="numeric" placeholder="—" value={avgHr} onChange={(e) => setAvgHr(e.target.value)} style={S.input} />
        </Field>

        <Field label="Title — optional">
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Treadmill, track session, …" style={S.input} />
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
              {gearForSport.map((g) => {
                const on = (gearId ?? gearForSport[0]?.id) === g.id;
                return (
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
                        border: `1px solid ${on ? color.accent : color.borderStrong}`,
                        background: on ? color.accent : 'transparent',
                        boxShadow: on ? `inset 0 0 0 3px ${color.background}` : undefined,
                      }}
                    />
                    <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: color.text }}>{g.name}</span>
                  </button>
                );
              })}
            </div>
          </Field>
        )}

        <Field label="Notes — optional">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How it felt, where it was, anything worth remembering."
            style={{ ...S.input, minHeight: 76, resize: 'none', lineHeight: 1.45 }}
          />
        </Field>

        <ActionButton onClick={save} tone="accent" disabled={!valid}>
          Add to the log
        </ActionButton>
        <span style={{ ...S.caption, color: color.textFaint, textWrap: 'pretty' }}>
          A hand-entered session has no track, so it draws no map, no splits and no elevation — but it counts fully towards your week,
          your streak and your load, which is the point of entering it.
        </span>
      </div>
    </div>
  );
}
