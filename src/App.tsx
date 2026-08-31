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
import type { StatKey } from './lib/statDetails';
import type { Activity, Settings, Sport } from './types';
import {
  useBikeCadenceSensor,
  useCyclingPowerSensor,
  useHeartRateSensor,
  useRunCadenceSensor,
  type BleSensorApi,
} from './hooks/useBleSensors';

type Screen = 'ovw' | 'ana' | 'pre' | 'rec' | 'save' | 'stat' | 'cmp';

export interface SensorSet {
  hr: BleSensorApi;
  power: BleSensorApi;
  cadence: BleSensorApi;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('ovw');
  const [sport, setSport] = useState<Sport>('run');
  const [activities, setActivities] = useState<Activity[]>(() => loadActivities());
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [draft, setDraft] = useState<ActivityDraft | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [statKey, setStatKey] = useState<StatKey>('runKm');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  // A comparison opened from a stat detail returns to it, not past it to the Overview.
  const [compareOrigin, setCompareOrigin] = useState<Screen>('ovw');

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

  const openStat = useCallback((key: StatKey) => {
    setStatKey(key);
    setScreen('stat');
  }, []);

  const openCompare = useCallback((ids: string[], from: Screen) => {
    setCompareIds(ids);
    setCompareOrigin(from);
    setScreen('cmp');
  }, []);

  const handleStart = useCallback(() => {
    setSessionKey((k) => k + 1);
    setScreen('rec');
  }, []);

  const handleFinish = useCallback((d: ActivityDraft) => {
    setDraft(d);
    setScreen('save');
  }, []);

  const handleSave = useCallback((activity: Activity) => {
    setActivities(addActivity(activity));
    setDraft(null);
    setScreen('ovw');
  }, []);

  const handleDiscard = useCallback(() => {
    setDraft(null);
    setScreen('ovw');
  }, []);

  const replaceActivities = useCallback((next: Activity[]) => {
    saveActivities(next);
    setActivities(next);
  }, []);

  return (
    <PhoneFrame>
      {screen === 'ovw' && (
        <Overview
          activities={activities}
          settings={settings}
          onRecord={() => setScreen('pre')}
          onAnalyse={() => setScreen('ana')}
          onStat={openStat}
          onCompare={(ids) => openCompare(ids, 'ovw')}
          onReplaceActivities={replaceActivities}
        />
      )}
      {screen === 'ana' && <Analyse activities={activities} settings={settings} onSettings={setSettings} onBack={() => setScreen('ovw')} />}
      {screen === 'stat' && (
        <StatDetail
          statKey={statKey}
          activities={activities}
          settings={settings}
          onBack={() => setScreen('ovw')}
          onCompare={(ids) => openCompare(ids, 'stat')}
        />
      )}
      {screen === 'cmp' && (
        <Compare activities={activities} initialIds={compareIds} onBack={() => setScreen(compareOrigin)} />
      )}
      {screen === 'pre' && (
        <PreStart sport={sport} onSport={setSport} sensors={sensors} onStart={handleStart} onBack={() => setScreen('ovw')} />
      )}
      {screen === 'rec' && (
        <RecordingSession key={sessionKey} sport={sport} sensors={sensors} settings={settings} onFinish={handleFinish} />
      )}
      {screen === 'save' && draft && (
        <SaveScreen draft={draft} settings={settings} activities={activities} onSave={handleSave} onDiscard={handleDiscard} />
      )}
    </PhoneFrame>
  );
}
