// GATT wiring for the three sensor kinds the brief calls out: heart rate strap, cycling
// power meter, and cadence (bike crank via CSC, or a running foot pod via RSC).
//
// The transport is native. Web Bluetooth does not exist in Android's System WebView, so
// the pivot would have taken heart rate, power and cadence with it had this stayed on
// `navigator.bluetooth`. What did not have to change is everything below the transport:
// the service UUIDs and the four parsers are the Bluetooth SIG's formats, not the
// browser's, and they read the same bytes off either stack.
//
// It is a fair trade rather than a loss. Web Bluetooth was Chromium-only and needed the
// page in front of you; the native client pairs from a real system scan, and because a
// recording holds a foreground service, notifications now keep arriving with the screen
// off — so a strap records the whole ride instead of the parts you looked at.
import { BleClient, numberToUUID } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

export const GATT = {
  heartRate: { service: 0x180d, measurement: 0x2a37 },
  cyclingPower: { service: 0x1818, measurement: 0x2a63 },
  csc: { service: 0x1816, measurement: 0x2a5b },
  runningSpeedCadence: { service: 0x1814, measurement: 0x2a53 },
};

/** Whether this build can talk to a sensor at all.
 *
 *  On a phone the answer is always yes — whether Bluetooth is switched *on* is a
 *  different question, and one the connect attempt asks. It is false only in a desktop
 *  browser running `npm run dev`, where the chips stay permanently absent. */
export function isBluetoothSupported(): boolean {
  return Capacitor.isNativePlatform();
}

export function parseHeartRate(data: DataView): number {
  const flags = data.getUint8(0);
  const is16bit = (flags & 0x1) !== 0;
  return is16bit ? data.getUint16(1, true) : data.getUint8(1);
}

export function parseCyclingPower(data: DataView): number {
  // Instantaneous Power (sint16) always sits right after the 2-byte Flags field.
  return data.getInt16(2, true);
}

export interface CrankReading {
  crankRevs: number;
  crankEventTime: number; // 1/1024 s, wraps at 65536
}

export function parseCscCrank(data: DataView): CrankReading | null {
  const flags = data.getUint8(0);
  let offset = 1;
  if (flags & 0x1) offset += 6; // wheel revolution data present, skip it
  if (!(flags & 0x2)) return null; // no crank revolution data
  const crankRevs = data.getUint16(offset, true);
  const crankEventTime = data.getUint16(offset + 2, true);
  return { crankRevs, crankEventTime };
}

export function parseRsc(data: DataView): { speedMps: number; cadenceSpm: number } {
  const speedMps = data.getUint16(1, true) / 256;
  const cadenceSpm = data.getUint8(3);
  return { speedMps, cadenceSpm };
}

/** Turns successive (cumulative revolutions, event-time) pairs from CSC/Cycling-Power
 *  crank data into an instantaneous RPM, handling the 16-bit event-time wraparound. */
export function makeCadenceTracker() {
  let last: CrankReading | null = null;
  return (reading: CrankReading): number | null => {
    if (!last) {
      last = reading;
      return null;
    }
    let dTime = reading.crankEventTime - last.crankEventTime;
    if (dTime < 0) dTime += 65536; // wrapped
    let dRevs = reading.crankRevs - last.crankRevs;
    if (dRevs < 0) dRevs += 65536;
    last = reading;
    if (dTime === 0) return null;
    const minutes = dTime / 1024 / 60;
    return Math.round(dRevs / minutes);
  };
}

export type BleState = 'absent' | 'searching' | 'connected';

export interface BleSensorHandle {
  disconnect: () => void;
}

interface ConnectOpts {
  serviceUuid: number;
  characteristicUuid: number;
  namePrefixFilters?: string[];
  onValue: (data: DataView) => void;
  onState: (state: BleState, deviceName: string | null) => void;
}

/** Requests a device advertising `serviceUuid`, connects it, and subscribes to
 *  notifications on `characteristicUuid`. Reports state transitions via onState so the
 *  UI can drive the same connected/searching/absent chip the design specifies.
 *
 *  The shape of this function is unchanged from the Web Bluetooth version, deliberately:
 *  `useBleSensors` and every screen above it never learned which stack was underneath,
 *  and they still have not. */
export async function connectBleSensor(opts: ConnectOpts): Promise<BleSensorHandle | null> {
  if (!isBluetoothSupported()) {
    opts.onState('absent', null);
    return null;
  }
  opts.onState('searching', null);

  const service = numberToUUID(opts.serviceUuid);
  const characteristic = numberToUUID(opts.characteristicUuid);

  try {
    // Asserted at the manifest too: the app never derives a position from a scan. It has
    // GPS, and saying so keeps the scan permission from dragging location in with it.
    await BleClient.initialize({ androidNeverForLocation: true });

    const device = await BleClient.requestDevice({ services: [service], optionalServices: [service] });
    const name = device.name ?? null;

    // A strap that has slipped, a meter that has gone to sleep between intervals: the
    // chip goes back to absent and the pairing button becomes available again, which is
    // the same thing gattserverdisconnected did.
    await BleClient.connect(device.deviceId, () => opts.onState('absent', name));
    await BleClient.startNotifications(device.deviceId, service, characteristic, opts.onValue);

    opts.onState('connected', name);
    return {
      disconnect: () => {
        void BleClient.stopNotifications(device.deviceId, service, characteristic).catch(() => {});
        void BleClient.disconnect(device.deviceId).catch(() => {});
        opts.onState('absent', name);
      },
    };
  } catch {
    // The chooser was dismissed, Bluetooth is off, the permission was refused, or no
    // matching device answered — all of which leave the session recording everything
    // else, so none of them is worth more than an absent chip.
    opts.onState('absent', null);
    return null;
  }
}
