// Real Web Bluetooth GATT wiring for the three sensor kinds the brief calls out:
// heart rate strap, cycling power meter, and cadence (bike crank via CSC, or a
// running foot pod via RSC). Web Bluetooth only exists in Chromium browsers over
// HTTPS/localhost — callers should treat `isBluetoothSupported()` as the gate for
// showing anything beyond a permanently-absent chip.

export const GATT = {
  heartRate: { service: 0x180d, measurement: 0x2a37 },
  cyclingPower: { service: 0x1818, measurement: 0x2a63 },
  csc: { service: 0x1816, measurement: 0x2a5b },
  runningSpeedCadence: { service: 0x1814, measurement: 0x2a53 },
};

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
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

/** Requests a device advertising `serviceUuid`, connects GATT, and subscribes to
 *  notifications on `characteristicUuid`. Reports state transitions via onState so
 *  the UI can drive the same connected/searching/absent chip the design specifies. */
export async function connectBleSensor(opts: ConnectOpts): Promise<BleSensorHandle | null> {
  if (!isBluetoothSupported()) {
    opts.onState('absent', null);
    return null;
  }
  opts.onState('searching', null);
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [opts.serviceUuid] }],
      optionalServices: [opts.serviceUuid],
    });
    const name = device.name ?? null;

    const handleDisconnect = () => opts.onState('absent', name);
    device.addEventListener('gattserverdisconnected', handleDisconnect);

    if (!device.gatt) throw new Error('No GATT server on device');
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(opts.serviceUuid);
    const characteristic = await service.getCharacteristic(opts.characteristicUuid);
    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', () => {
      const value = characteristic.value;
      if (value) opts.onValue(value);
    });

    opts.onState('connected', name);
    return {
      disconnect: () => {
        device.removeEventListener('gattserverdisconnected', handleDisconnect);
        if (device.gatt?.connected) device.gatt.disconnect();
        opts.onState('absent', name);
      },
    };
  } catch {
    // User cancelled the chooser, or no matching/paired device — back to absent.
    opts.onState('absent', null);
    return null;
  }
}
