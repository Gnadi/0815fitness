import { useCallback, useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from './components/PhoneFrame';
import { Overview } from './screens/Overview';
import { Analyse } from './screens/Analyse';
import { StatDetail } from './screens/StatDetail';
import { Compare } from './screens/Compare';
import { PreStart } from './screens/PreStart';
import { RecordingSession, type ActivityDraft } from './screens/RecordingSession';
import { SaveScreen } from './screens/Save';
import { addActivity, loadActivities, loadSettings, saveActivities, saveSettings } from './lib/storage';
import { useNavStack } from './hooks/useNavStack';
import type { StatKey } from './lib/statDetails';
import type { Activity, Settings, Sport } from './types';
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
  | { screen: 'ovw' | 'ana' | 'pre' | 'rec' | 'save' }
  | { screen: 'stat'; statKey: StatKey }
  | { screen: 'cmp'; ids: string[] };

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
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

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

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  const openStat = useCallback((statKey: StatKey) => push({ screen: 'stat', statKey }), [push]);

  const openCompare = useCallback((ids: string[]) => push({ screen: 'cmp', ids }), [push]);

  // The record flow replaces rather than stacks: pre-start, recording and save are steps
  // of one session, and none of them is a place back should land on.
  const handleStart = useCallback(() => {
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

  const handleSave = useCallback(
    (activity: Activity) => {
      setActivities(addActivity(activity));
      setDraft(null);
      resetToRoot();
    },
    [resetToRoot],
  );

  const handleDiscard = useCallback(() => {
    setDraft(null);
    resetToRoot();
  }, [resetToRoot]);

  const replaceActivities = useCallback((next: Activity[]) => {
    saveActivities(next);
    setActivities(next);
  }, []);

  return (
    <PhoneFrame>
      {view.screen === 'ovw' && (
        <Overview
          activities={activities}
          settings={settings}
          onRecord={() => push({ screen: 'pre' })}
          onAnalyse={() => push({ screen: 'ana' })}
          onStat={openStat}
          onCompare={openCompare}
          onReplaceActivities={replaceActivities}
        />
      )}
      {view.screen === 'ana' && <Analyse activities={activities} settings={settings} onSettings={setSettings} onBack={back} />}
      {view.screen === 'stat' && (
        <StatDetail statKey={view.statKey} activities={activities} settings={settings} onBack={back} onCompare={openCompare} />
      )}
      {view.screen === 'cmp' && <Compare activities={activities} initialIds={view.ids} onBack={back} />}
      {view.screen === 'pre' && (
        <PreStart sport={sport} onSport={setSport} sensors={sensors} onStart={handleStart} onBack={back} />
      )}
      {view.screen === 'rec' && (
        <RecordingSession key={sessionKey} sport={sport} sensors={sensors} settings={settings} onFinish={handleFinish} />
      )}
      {view.screen === 'save' && draft && (
        <SaveScreen draft={draft} settings={settings} activities={activities} onSave={handleSave} onDiscard={handleDiscard} />
      )}
    </PhoneFrame>
  );
}
