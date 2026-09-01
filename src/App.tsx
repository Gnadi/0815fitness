import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppShell } from './components/AppShell';
import { Overview } from './screens/Overview';
import { Analyse } from './screens/Analyse';
import { StatDetail } from './screens/StatDetail';
import { Compare } from './screens/Compare';
import { PreStart } from './screens/PreStart';
import { RecordingSession, type ActivityDraft } from './screens/RecordingSession';
import { SaveScreen } from './screens/Save';
import { Activities } from './screens/Activities';
import { ActivityDetail } from './screens/ActivityDetail';
import { SettingsScreen } from './screens/Settings';
import { ManualEntry } from './screens/ManualEntry';
import { RouteDetail } from './screens/RouteDetail';
import { MapScreen } from './screens/MapScreen';
import {
  addActivity,
  clearDemoActivities,
  loadActivities,
  loadSettings,
  putManyActivities,
  refreshStaleDerived,
  removeActivity,
  replaceAllActivities,
  saveSettings,
  updateActivity,
} from './lib/storage';
import { clearCheckpoint, isWorthRecovering, loadCheckpoint } from './lib/session';
import type { RecorderCheckpoint } from './lib/recorder';
import { useNavStack } from './hooks/useNavStack';
import { UnitsProvider } from './hooks/UnitsProvider';
import type { StatKey } from './lib/statDetails';
import type { Activity, ActivitySamples, Settings, Sport } from './types';
import {
  useBikeCadenceSensor,
  useCyclingPowerSensor,
  useHeartRateSensor,
  useRunCadenceSensor,
  type BleSensorApi,
} from './hooks/useBleSensors';

/** A screen plus whatever it was opened with, so going back restores the view the
 *  browser returns to rather than the last thing the app happened to hold. */
type View =
  | { screen: 'ovw' | 'ana' | 'pre' | 'rec' | 'save' | 'list' | 'settings' | 'manual' }
  | { screen: 'stat'; statKey: StatKey }
  | { screen: 'cmp'; ids: string[] }
  | { screen: 'act'; id: string }
  | { screen: 'route'; id: string }
  | { screen: 'map'; id: string };

const ROOT: View = { screen: 'ovw' };

// Recording and saving own the screen until they are finished — there is no way out of
// them but FINISH or DISCARD — so a browser back inside them must not drop the session.
const holdsItsScreen = (view: View) => view.screen === 'rec' || view.screen === 'save';

export interface SensorSet {
  hr: BleSensorApi;
  power: BleSensorApi;
  cadence: BleSensorApi;
}

export default function App() {
  // Screen state is a stack shared with the browser's history: back — the button or the
  // gesture — pops it, so a detail returns to what it was opened from.
  const { view, push, replace, back, resetToRoot } = useNavStack(ROOT, holdsItsScreen);
  const [sport, setSport] = useState<Sport>('run');
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  // A session a previous launch was in the middle of recording, offered back rather
  // than resumed behind the person's back.
  const [recovery, setRecovery] = useState<RecorderCheckpoint | null>(null);
  const [resumeFrom, setResumeFrom] = useState<RecorderCheckpoint | null>(null);

  // Sensor connections live above the screens so a strap paired on pre-start stays
  // paired through recording and save.
  const hr = useHeartRateSensor();
  const power = useCyclingPowerSensor();
  const bikeCadence = useBikeCadenceSensor();
  const runCadence = useRunCadenceSensor();
  const sensors: SensorSet = useMemo(
    () => ({ hr, power, cadence: sport === 'run' ? runCadence : bikeCadence }),
    [hr, power, runCadence, bikeCadence, sport],
  );

  // The log comes out of IndexedDB, so the first paint happens before it arrives. Any
  // activity whose stored figures an older build computed is re-derived afterwards,
  // in the background — the app opens on the log it has rather than behind a
  // recomputation of it.
  useEffect(() => {
    let live = true;
    void (async () => {
      const loadedActivities = await loadActivities();
      if (!live) return;
      setActivities(loadedActivities);
      setLoaded(true);
      const refreshed = await refreshStaleDerived(loadedActivities);
      if (live && refreshed) setActivities(refreshed);
    })();
    void (async () => {
      const checkpoint = await loadCheckpoint();
      if (live && isWorthRecovering(checkpoint)) setRecovery(checkpoint);
    })();
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  // The installed app's icon carries a "Record" shortcut, which opens the app at
  // `?screen=record`. Push pre-start over the Overview rather than replacing it, so
  // backing out of a shortcut launch still lands somewhere, and drop the query so a
  // reload — or a later launch from the plain icon — opens the Overview.
  const shortcutHandled = useRef(false);
  useEffect(() => {
    if (shortcutHandled.current) return;
    shortcutHandled.current = true;
    const params = new URLSearchParams(window.location.search);
    if (params.get('screen') !== 'record') return;
    window.history.replaceState(window.history.state, '', window.location.pathname);
    push({ screen: 'pre' });
  }, [push]);

  const openStat = useCallback((statKey: StatKey) => push({ screen: 'stat', statKey }), [push]);
  const openCompare = useCallback((ids: string[]) => push({ screen: 'cmp', ids }), [push]);
  const openActivity = useCallback((id: string) => push({ screen: 'act', id }), [push]);
  const openRoute = useCallback((id: string) => push({ screen: 'route', id }), [push]);
  const openMap = useCallback((id: string) => push({ screen: 'map', id }), [push]);

  // The record flow replaces rather than stacks: pre-start, recording and save are steps
  // of one session, and none of them is a place back should land on.
  const handleStart = useCallback(() => {
    setResumeFrom(null);
    setSessionKey((k) => k + 1);
    replace({ screen: 'rec' });
  }, [replace]);

  const handleFinish = useCallback(
    (d: ActivityDraft) => {
      setDraft(d);
      replace({ screen: 'save' });
    },
    [replace],
  );

  const persist = useCallback(async (activity: Activity, samples: ActivitySamples | null) => {
    await addActivity(activity, samples);
    setActivities((current) => [activity, ...current].sort((a, b) => b.startedAt - a.startedAt));
  }, []);

  const handleSave = useCallback(
    (activity: Activity, samples: ActivitySamples | null) => {
      void persist(activity, samples);
      setDraft(null);
      setResumeFrom(null);
      resetToRoot();
    },
    [persist, resetToRoot],
  );

  const handleDiscard = useCallback(() => {
    setDraft(null);
    setResumeFrom(null);
    void clearCheckpoint();
    resetToRoot();
  }, [resetToRoot]);

  const handleEdit = useCallback((activity: Activity) => {
    void updateActivity(activity);
    setActivities((current) => current.map((a) => (a.id === activity.id ? activity : a)));
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      void removeActivity(id);
      setActivities((current) => current.filter((a) => a.id !== id));
      back();
    },
    [back],
  );

  const handleReplaceAll = useCallback(async (entries: { activity: Activity; samples: ActivitySamples | null }[]) => {
    await replaceAllActivities(entries);
    setActivities(entries.map((e) => e.activity).sort((a, b) => b.startedAt - a.startedAt));
  }, []);

  const handleAppend = useCallback(async (entries: { activity: Activity; samples: ActivitySamples | null }[]) => {
    await putManyActivities(entries);
    setActivities((current) => {
      const byId = new Map(current.map((a) => [a.id, a]));
      for (const e of entries) byId.set(e.activity.id, e.activity);
      return [...byId.values()].sort((a, b) => b.startedAt - a.startedAt);
    });
  }, []);

  const handleRemoveDemo = useCallback(async () => {
    await clearDemoActivities(activities);
    setActivities((current) => current.filter((a) => !a.demo));
  }, [activities]);

  const handleEraseAll = useCallback(async () => {
    await replaceAllActivities([]);
    setActivities([]);
  }, []);

  // ── the interrupted session ────────────────────────────────────
  const resumeRecovered = useCallback(() => {
    if (!recovery) return;
    setSport(recovery.sport);
    setResumeFrom(recovery);
    setRecovery(null);
    setSessionKey((k) => k + 1);
    push({ screen: 'rec' });
  }, [recovery, push]);

  const saveRecovered = useCallback(() => {
    if (!recovery) return;
    setSport(recovery.sport);
    setDraft({
      sport: recovery.sport,
      startedAt: recovery.startedAt,
      endedAt: recovery.savedAt,
      points: recovery.points,
      laps: recovery.laps,
      hr: recovery.hr,
      power: recovery.power,
      cadence: recovery.cadence,
      distance: recovery.distanceM,
      ascent: recovery.ascentM,
      recovered: true,
    });
    setRecovery(null);
    void clearCheckpoint();
    push({ screen: 'save' });
  }, [recovery, push]);

  const discardRecovered = useCallback(() => {
    setRecovery(null);
    void clearCheckpoint();
  }, []);

  const activityById = (id: string) => activities.find((a) => a.id === id) ?? null;

  return (
    <UnitsProvider units={settings.units}>
      <AppShell>
        {view.screen === 'ovw' && (
          <Overview
            activities={activities}
            settings={settings}
            loaded={loaded}
            recovery={recovery}
            onResumeRecovery={resumeRecovered}
            onSaveRecovery={saveRecovered}
            onDiscardRecovery={discardRecovered}
            onRecord={() => push({ screen: 'pre' })}
            onAnalyse={() => push({ screen: 'ana' })}
            onHistory={() => push({ screen: 'list' })}
            onSettings={() => push({ screen: 'settings' })}
            onStat={openStat}
            onCompare={openCompare}
            onActivity={openActivity}
            onSeedDemo={handleReplaceAll}
          />
        )}
        {view.screen === 'ana' && (
          <Analyse
            activities={activities}
            settings={settings}
            onSettings={setSettings}
            onBack={back}
            onRoute={openRoute}
            onActivity={openActivity}
            onStat={openStat}
          />
        )}
        {view.screen === 'list' && (
          <Activities
            activities={activities}
            onBack={back}
            onActivity={openActivity}
            onCompare={openCompare}
            onManual={() => push({ screen: 'manual' })}
          />
        )}
        {view.screen === 'act' && (
          <ActivityDetail
            activity={activityById(view.id)}
            activities={activities}
            settings={settings}
            onBack={back}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onCompare={openCompare}
            onMap={openMap}
          />
        )}
        {view.screen === 'map' && (
          <MapScreen activity={activityById(view.id)} activities={activities} settings={settings} onBack={back} />
        )}
        {view.screen === 'route' && (
          <RouteDetail routeId={view.id} activities={activities} onBack={back} onActivity={openActivity} onCompare={openCompare} />
        )}
        {view.screen === 'settings' && (
          <SettingsScreen
            settings={settings}
            activities={activities}
            onSettings={setSettings}
            onBack={back}
            onAppend={handleAppend}
            onRemoveDemo={handleRemoveDemo}
            onEraseAll={handleEraseAll}
          />
        )}
        {view.screen === 'manual' && (
          <ManualEntry settings={settings} onBack={back} onSave={(activity) => { void persist(activity, null); back(); }} />
        )}
        {view.screen === 'stat' && (
          <StatDetail statKey={view.statKey} activities={activities} settings={settings} onBack={back} onCompare={openCompare} onActivity={openActivity} />
        )}
        {view.screen === 'cmp' && <Compare activities={activities} initialIds={view.ids} onBack={back} />}
        {view.screen === 'pre' && (
          <PreStart sport={sport} onSport={setSport} sensors={sensors} onStart={handleStart} onBack={back} />
        )}
        {view.screen === 'rec' && (
          <RecordingSession
            key={sessionKey}
            sport={sport}
            sensors={sensors}
            settings={settings}
            restore={resumeFrom}
            onFinish={handleFinish}
          />
        )}
        {view.screen === 'save' && draft && (
          <SaveScreen draft={draft} settings={settings} activities={activities} onSave={handleSave} onDiscard={handleDiscard} />
        )}
      </AppShell>
    </UnitsProvider>
  );
}
