import { Capacitor, registerPlugin } from '@capacitor/core';

/** The app's half of RecordingReadinessPlugin — see the Java for the full argument.
 *
 *  Short version: the foreground service is the mechanism that keeps a recording alive,
 *  but two settings outside it can still stop one, and both belong to the person. A
 *  manufacturer's battery care will kill the service; a refused notification permission
 *  leaves it running invisibly, which makes pre-start's promise — pocket the phone, the
 *  notification will show the session — untrue. */
interface RecordingReadinessPlugin {
  check(): Promise<{ batteryExempt: boolean; notificationsAllowed: boolean }>;
  requestBatteryExemption(): Promise<{ opened: boolean }>;
  requestNotifications(): Promise<{ opened: boolean }>;
}

const RecordingReadiness = registerPlugin<RecordingReadinessPlugin>('RecordingReadiness');

export interface Readiness {
  batteryExempt: boolean;
  notificationsAllowed: boolean;
}

/** Errs towards ready. A phone that cannot answer should not be nagged about settings it
 *  may not have, and neither should a desktop browser running `npm run dev`. */
const READY: Readiness = { batteryExempt: true, notificationsAllowed: true };

export async function checkReadiness(): Promise<Readiness> {
  if (!Capacitor.isNativePlatform()) return READY;
  try {
    return await RecordingReadiness.check();
  } catch {
    return READY;
  }
}

export async function requestBatteryExemption(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await RecordingReadiness.requestBatteryExemption();
  } catch {
    // Nothing to offer beyond having tried.
  }
}

export async function requestNotifications(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    await RecordingReadiness.requestNotifications();
  } catch {
    // As above.
  }
}
