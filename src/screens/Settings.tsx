import { useEffect, useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { ActionButton, Field, Label, ScreenHeader, Segmented } from '../components/primitives';
import { useUnits } from '../hooks/useUnits';
import { buildExport, downloadFile, exportFileName, parseExport, parseGpx, type ImportOutcome } from '../lib/backup';
import { deriveActivity } from '../lib/derived';
import { storageUsage, makeId } from '../lib/storage';
import { cumulativeDistance, totalAscent } from '../lib/geo';
import { effectiveLthr, fmtEuroDate, gearUsage, powerCurve, zoneCuts } from '../lib/stats';
import type { Activity, ActivitySamples, GearItem, Settings, Sport } from '../types';

const sectionStyle: CSSProperties = { flex: 'none', margin: '0 16px', display: 'flex', flexDirection: 'column', gap: 12 };

function numberOrNull(text: string): number | null {
  const n = Number(text);
  return text.trim() !== '' && isFinite(n) && n > 0 ? n : null;
}

/** Everything the app was deciding on the person's behalf.
 *
 *  Zones were cut against a max heart rate nothing could change, gear was two fixed
 *  items, distance was always kilometres, and the only copy of the log was a database
 *  on one device with no way out of it. All of that lives here. */
export function SettingsScreen({
  settings,
  activities,
  onSettings,
  onBack,
  onAppend,
  onRemoveDemo,
  onEraseAll,
}: {
  settings: Settings;
  activities: Activity[];
  onSettings: (s: Settings) => void;
  onBack: () => void;
  onAppend: (entries: { activity: Activity; samples: ActivitySamples | null }[]) => Promise<void>;
  onRemoveDemo: () => Promise<void>;
  onEraseAll: () => Promise<void>;
}) {
  const units = useUnits();
  const [usage, setUsage] = useState<{ usedBytes: number | null; quotaBytes: number | null } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);
  const fileInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void storageUsage().then(setUsage);
  }, [activities.length]);

  const set = (patch: Partial<Settings>) => onSettings({ ...settings, ...patch });

  // The highest heart rate the log has ever seen, which is a better starting point for
  // a max than a number typed once and never revisited.
  const observedMax = useMemo(() => {
    let peak = 0;
    for (const a of activities) if (a.derived.maxHr && a.derived.maxHr > peak) peak = a.derived.maxHr;
    return peak;
  }, [activities]);

  // FTP is conventionally 95 % of the best twenty minutes, which the power curve knows.
  const suggestedFtp = useMemo(() => {
    const best20 = powerCurve(activities).find((p) => p.key === '20m')?.watts ?? 0;
    return best20 > 0 ? Math.round(best20 * 0.95) : 0;
  }, [activities]);

  const usedMb = usage?.usedBytes != null ? usage.usedBytes / 1048576 : null;
  const quotaMb = usage?.quotaBytes != null ? usage.quotaBytes / 1048576 : null;

  const doExport = async () => {
    setBusy(true);
    try {
      const payload = await buildExport(activities, settings);
      downloadFile(exportFileName('contour-log'), 'application/json', JSON.stringify(payload));
      setMessage(`Exported ${activities.length} ${activities.length === 1 ? 'session' : 'sessions'}.`);
    } catch {
      setMessage('The export could not be written.');
    } finally {
      setBusy(false);
    }
  };

  const doImport = async (file: File) => {
    setBusy(true);
    try {
      const text = await file.text();
      const outcome: ImportOutcome = file.name.toLowerCase().endsWith('.gpx')
        ? importGpx(text, file.name)
        : (() => {
            const parsed = parseExport(text);
            return { entries: parsed.entries, skipped: parsed.skipped, settings: parsed.settings };
          })();

      // Merging rather than replacing: a person importing a backup onto a phone they
      // have also been recording on should not lose what they recorded here.
      const existing = new Set(activities.map((a) => a.id));
      const fresh = outcome.entries.filter((e) => !existing.has(e.activity.id));
      await onAppend(fresh);
      if (outcome.settings) onSettings({ ...settings, ...outcome.settings, gear: outcome.settings.gear ?? settings.gear });
      const duplicates = outcome.entries.length - fresh.length;
      setMessage(
        `Imported ${fresh.length} ${fresh.length === 1 ? 'session' : 'sessions'}` +
          (duplicates ? `, skipped ${duplicates} already in the log` : '') +
          (outcome.skipped ? `, ${outcome.skipped} unreadable` : '') +
          '.',
      );
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'That file could not be read.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const gearFor = (sport: Sport) => settings.gear.filter((g) => g.sport === sport);
  const usageByGear = useMemo(() => gearUsage(activities), [activities]);

  const addGear = (sport: Sport) =>
    set({
      gear: [
        ...settings.gear,
        { id: makeId(), sport, name: sport === 'run' ? 'New shoes' : 'New bike', offsetKm: 0, limitKm: sport === 'run' ? 800 : null, retired: false },
      ],
    });

  const updateGear = (id: string, patch: Partial<GearItem>) =>
    set({ gear: settings.gear.map((g) => (g.id === id ? { ...g, ...patch } : g)) });

  const removeGear = (id: string) => set({ gear: settings.gear.filter((g) => g.id !== id) });

  const cuts = zoneCuts(settings);

  return (
    <div style={S.screen}>
      <ScreenHeader title="Settings" onBack={onBack} />

      <div className="ct-scroll" style={{ ...S.scrollArea, padding: '6px 0 48px', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* ── heart rate ── */}
        <div style={sectionStyle}>
          <Label>Heart rate</Label>
          <Field
            label="Max heart rate"
            hint={
              observedMax > 0
                ? `The highest this log has recorded is ${observedMax} bpm${observedMax > settings.maxHr ? ' — higher than the value set here.' : '.'}`
                : 'Nothing recorded yet to check this against.'
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                inputMode="numeric"
                value={settings.maxHr}
                onChange={(e) => set({ maxHr: Math.max(100, Math.min(240, Number(e.target.value) || settings.maxHr)) })}
                style={{ ...S.input, flex: 1 }}
              />
              {observedMax > settings.maxHr && (
                <button onClick={() => set({ maxHr: observedMax })} style={{ ...S.input, width: 'auto', color: color.accent, cursor: 'pointer' }}>
                  Use {observedMax}
                </button>
              )}
            </div>
          </Field>

          <Field
            label="Threshold heart rate"
            hint={
              settings.lthr
                ? 'Zones cut against threshold move with fitness; zones cut against max barely do.'
                : `Not set — an estimate of ${effectiveLthr(settings)} bpm (90 % of max) stands in wherever threshold is needed.`
            }
          >
            <input
              type="number"
              inputMode="numeric"
              placeholder={`${effectiveLthr(settings)} (estimated)`}
              value={settings.lthr ?? ''}
              onChange={(e) => set({ lthr: numberOrNull(e.target.value) })}
              style={S.input}
            />
          </Field>

          <Field
            label="Cut zones against"
            hint={`Z1 under ${Math.round(cuts[1])} · Z2 to ${Math.round(cuts[2])} · Z3 to ${Math.round(cuts[3])} · Z4 to ${Math.round(cuts[4])} · Z5 above. Changing this re-cuts every session you have ever recorded, because the time at each heart rate is what is stored.`}
          >
            <Segmented
              ariaLabel="Zone model"
              options={[
                { value: 'maxhr', label: '% OF MAX' },
                { value: 'lthr', label: '% OF THRESHOLD' },
              ]}
              value={settings.zoneModel}
              onChange={(v) => set({ zoneModel: v })}
            />
          </Field>
        </div>

        {/* ── power ── */}
        <div style={sectionStyle}>
          <Label>Power</Label>
          <Field
            label="FTP"
            hint={
              suggestedFtp > 0
                ? `95 % of your best twenty minutes is ${suggestedFtp} W. With an FTP set, rides are scored in training stress rather than distance.`
                : 'No ride long enough with a power meter to suggest one yet.'
            }
          >
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="number"
                inputMode="numeric"
                placeholder="not set"
                value={settings.ftp ?? ''}
                onChange={(e) => set({ ftp: numberOrNull(e.target.value) })}
                style={{ ...S.input, flex: 1 }}
              />
              {suggestedFtp > 0 && (
                <button onClick={() => set({ ftp: suggestedFtp })} style={{ ...S.input, width: 'auto', color: color.accent, cursor: 'pointer' }}>
                  Use {suggestedFtp}
                </button>
              )}
            </div>
          </Field>
        </div>

        {/* ── how things are measured ── */}
        <div style={sectionStyle}>
          <Label>Measurement</Label>
          <Field label="Units" hint="Everything is stored in metres and seconds; this only changes how it is shown.">
            <Segmented
              ariaLabel="Units"
              options={[
                { value: 'metric', label: 'KM · M' },
                { value: 'imperial', label: 'MI · FT' },
              ]}
              value={settings.units}
              onChange={(v) => set({ units: v })}
            />
          </Field>

          <Field
            label="Weekly load measured in"
            hint={
              settings.loadModel === 'stress'
                ? 'Training stress: an hour at threshold is 100 points, from power against FTP where there is a meter, heart rate against threshold where there is a strap, and duration times perceived effort where there is neither.'
                : 'Distance: run kilometres plus ride kilometres ÷ 3. Simple, and blind to how hard the session was — a recovery spin counts the same as a threshold ride.'
            }
          >
            <Segmented
              ariaLabel="Load model"
              options={[
                { value: 'distance', label: 'DISTANCE' },
                { value: 'stress', label: 'TRAINING STRESS' },
              ]}
              value={settings.loadModel}
              onChange={(v) => set({ loadModel: v })}
            />
          </Field>
        </div>

        {/* ── recording ── */}
        <div style={sectionStyle}>
          <Label>Recording</Label>
          <Field
            label="Auto-pause below"
            hint={`${units.fmtSpeed(settings.autoPauseMps)} ${units.speedUnit} — the recorder stops the clock after eight seconds under this, and starts again at nearly twice it, so a wobbling fix cannot flip the state back and forth.`}
          >
            <input
              type="range"
              min={0}
              max={1.5}
              step={0.1}
              value={settings.autoPauseMps}
              onChange={(e) => set({ autoPauseMps: Number(e.target.value) })}
              style={{ width: '100%', accentColor: color.accent }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: font.mono, fontSize: 10, color: color.textFaint }}>
              <span>off</span>
              <span>walking</span>
              <span>slow jog</span>
            </div>
          </Field>
        </div>

        {/* ── the map ── */}
        <div style={sectionStyle}>
          <Label>Map</Label>
          <Field
            label="Basemap under a saved track"
            hint={
              settings.mapTiles
                ? 'Tiles are fetched from openstreetmap.org when a saved session is opened, which tells that server roughly where you were. It is the only request this app makes. Recording never fetches anything, and a session opened with no signal falls back to the drawn track.'
                : 'Off — a saved track is drawn on its own, and the app makes no network requests at all.'
            }
          >
            <Segmented
              ariaLabel="Basemap"
              options={[
                { value: 'on', label: 'OPENSTREETMAP' },
                { value: 'off', label: 'DRAWN TRACK' },
              ]}
              value={settings.mapTiles ? 'on' : 'off'}
              onChange={(v) => set({ mapTiles: v === 'on' })}
            />
          </Field>
        </div>

        {/* ── gear ── */}
        {(['run', 'ride'] as Sport[]).map((sport) => (
          <div key={sport} style={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <Label>{sport === 'run' ? 'Shoes' : 'Bikes'}</Label>
              <button onClick={() => addGear(sport)} style={{ ...S.linkButton, fontSize: 12 }}>
                + Add
              </button>
            </div>
            {gearFor(sport).length === 0 ? (
              <span style={{ ...S.caption, color: color.textFaint }}>Nothing listed. Add one and it becomes selectable when a session is saved.</span>
            ) : (
              gearFor(sport).map((g) => {
                const use = usageByGear.get(g.id);
                const totalKm = g.offsetKm + (use?.km ?? 0);
                const share = g.limitKm ? Math.min(1, totalKm / g.limitKm) : 0;
                const spent = g.limitKm != null && totalKm >= g.limitKm;
                return (
                  <div
                    key={g.id}
                    style={{
                      border: `1px solid ${spent && !g.retired ? color.warning : color.border}`,
                      borderRadius: 8,
                      padding: 12,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      opacity: g.retired ? 0.55 : 1,
                    }}
                  >
                    <input value={g.name} onChange={(e) => updateGear(g.id, { name: e.target.value })} style={{ ...S.input, padding: '8px 10px' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ ...S.monoTick }}>ALREADY ON IT ({units.distanceUnit.toUpperCase()})</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={Math.round(units.distance(g.offsetKm * 1000))}
                          onChange={(e) => updateGear(g.id, { offsetKm: units.toMetres(Number(e.target.value) || 0) / 1000 })}
                          style={{ ...S.input, padding: '8px 10px' }}
                        />
                      </label>
                      <label style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <span style={{ ...S.monoTick }}>REPLACE AT ({units.distanceUnit.toUpperCase()})</span>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="no limit"
                          value={g.limitKm != null ? Math.round(units.distance(g.limitKm * 1000)) : ''}
                          onChange={(e) => {
                            const value = numberOrNull(e.target.value);
                            updateGear(g.id, { limitKm: value == null ? null : units.toMetres(value) / 1000 });
                          }}
                          style={{ ...S.input, padding: '8px 10px' }}
                        />
                      </label>
                    </div>
                    {g.limitKm != null && (
                      <div style={{ height: 6, borderRadius: 999, background: color.surfaceSunk, overflow: 'hidden' }}>
                        <span style={{ display: 'block', height: '100%', width: `${(share * 100).toFixed(1)}%`, background: spent ? color.warning : color.accent }} />
                      </div>
                    )}
                    <span style={{ fontSize: 12, color: spent && !g.retired ? color.warning : color.textFaint }}>
                      {units.fmtDistance(totalKm * 1000, 0)} {units.distanceUnit}
                      {g.limitKm != null ? ` of ${units.fmtDistance(g.limitKm * 1000, 0)}` : ''} · {use?.sessions ?? 0} sessions
                      {use?.lastUsed ? ` · last ${fmtEuroDate(use.lastUsed)}` : ''}
                      {spent && !g.retired ? ' · past its limit' : ''}
                      {g.retired ? ' · retired' : ''}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateGear(g.id, { retired: !g.retired })} style={{ ...S.linkButton, fontSize: 12 }}>
                        {g.retired ? 'Bring back' : 'Retire'}
                      </button>
                      <span style={{ flex: 1 }} />
                      {(use?.sessions ?? 0) === 0 && (
                        <button onClick={() => removeGear(g.id)} style={{ ...S.linkButton, fontSize: 12, color: color.critical }}>
                          Remove
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ))}

        {/* ── the log itself ── */}
        <div style={sectionStyle}>
          <Label>Your data</Label>
          <span style={{ fontSize: 13, lineHeight: 1.45, color: color.textMuted, textWrap: 'pretty' }}>
            {activities.length} {activities.length === 1 ? 'session' : 'sessions'} on this device
            {usedMb != null ? `, using ${usedMb.toFixed(1)} MB${quotaMb != null ? ` of about ${quotaMb.toFixed(0)} MB available` : ''}` : ''}.
            {' '}Uninstalling the app deletes it, so keep an export somewhere else.
          </span>
          {usedMb != null && quotaMb != null && quotaMb > 0 && (
            <div style={{ height: 6, borderRadius: 999, background: color.surfaceSunk, overflow: 'hidden' }}>
              <span style={{ display: 'block', height: '100%', width: `${Math.min(100, (usedMb / quotaMb) * 100).toFixed(2)}%`, background: color.accent }} />
            </div>
          )}

          <ActionButton onClick={() => void doExport()} disabled={busy || activities.length === 0}>
            Export the whole log
          </ActionButton>
          <ActionButton onClick={() => fileInput.current?.click()} disabled={busy}>
            Import a backup or a GPX file
          </ActionButton>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.gpx,application/json,application/gpx+xml"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void doImport(file);
            }}
            style={{ display: 'none' }}
          />
          {message && <span style={{ fontSize: 13, color: color.textMuted }}>{message}</span>}
          <span style={{ ...S.caption, color: color.textFaint, textWrap: 'pretty' }}>
            The export is one file holding every session with its full track and sensor streams, plus these settings. It is the only
            copy that survives a cleared browser or a new phone — nothing here is sent anywhere.
          </span>

          {activities.some((a) => a.demo) && (
            <ActionButton onClick={() => void onRemoveDemo()} disabled={busy}>
              Remove the sample history
            </ActionButton>
          )}

          {confirmWipe ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, lineHeight: 1.45, color: color.textMuted }}>
                This erases every session on this device. Export first if you have not.
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <ActionButton onClick={() => setConfirmWipe(false)}>Keep everything</ActionButton>
                <ActionButton
                  tone="critical"
                  onClick={() => {
                    void onEraseAll();
                    setConfirmWipe(false);
                    setMessage('The log is empty.');
                  }}
                >
                  Erase it all
                </ActionButton>
              </div>
            </div>
          ) : (
            <ActionButton onClick={() => setConfirmWipe(true)} tone="critical" disabled={activities.length === 0}>
              Erase the whole log
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

/** A GPX file from another tool, turned into a session this log can hold. */
function importGpx(text: string, fileName: string): ImportOutcome {
  const { name, sport, samples } = parseGpx(text, fileName.replace(/\.gpx$/i, ''));
  const startedAt = samples.points[0].t;
  const endedAt = samples.points[samples.points.length - 1].t;
  return {
    entries: [
      {
        activity: {
          id: samples.id,
          sport,
          startedAt,
          endedAt,
          title: name,
          notes: '',
          effort: 5,
          gearId: null,
          laps: [],
          distance: cumulativeDistance(samples.points),
          ascent: Math.round(totalAscent(samples.points)),
          source: 'imported',
          hasSamples: true,
          derived: deriveActivity({ sport, startedAt, endedAt, samples }),
        },
        samples,
      },
    ],
    skipped: 0,
    settings: null,
  };
}
