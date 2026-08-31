import { useCallback, useEffect, useRef, useState } from 'react';
import {
  GATT,
  type BleState,
  type BleSensorHandle,
  connectBleSensor,
  parseHeartRate,
  parseCyclingPower,
  parseCscCrank,
  parseRsc,
  makeCadenceTracker,
} from '../lib/ble';

export interface BleSensorApi {
  state: BleState;
  value: number | null;
  /** Increments on every notification, so consumers can record a sample even when
   *  two consecutive readings carry the same value. */
  tick: number;
  deviceName: string | null;
  toggle: () => void;
}

type DecoderFactory = () => (dv: DataView) => number | null;

function useBleSensor(serviceUuid: number, characteristicUuid: number, decoderFactory: DecoderFactory): BleSensorApi {
  const [state, setState] = useState<BleState>('absent');
  const [value, setValue] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const [deviceName, setDeviceName] = useState<string | null>(null);
  const handleRef = useRef<BleSensorHandle | null>(null);
  const decodeRef = useRef<(dv: DataView) => number | null>(() => null);

  const connect = useCallback(async () => {
    decodeRef.current = decoderFactory();
    const handle = await connectBleSensor({
      serviceUuid,
      characteristicUuid,
      onValue: (dv) => {
        const v = decodeRef.current(dv);
        if (v != null) {
          setValue(v);
          setTick((n) => n + 1);
        }
      },
      onState: (s, name) => {
        setState(s);
        setDeviceName(name);
        if (s === 'absent') setValue(null);
      },
    });
    handleRef.current = handle;
  }, [serviceUuid, characteristicUuid, decoderFactory]);

  const toggle = useCallback(() => {
    if (state === 'connected') {
      handleRef.current?.disconnect();
      handleRef.current = null;
    } else if (state === 'absent') {
      void connect();
    }
  }, [state, connect]);

  useEffect(
    () => () => {
      handleRef.current?.disconnect();
      handleRef.current = null;
    },
    [],
  );

  return { state, value, tick, deviceName, toggle };
}

const heartRateDecoder: DecoderFactory = () => parseHeartRate;
const powerDecoder: DecoderFactory = () => parseCyclingPower;
const bikeCadenceDecoder: DecoderFactory = () => {
  const track = makeCadenceTracker();
  return (dv) => {
    const reading = parseCscCrank(dv);
    return reading ? track(reading) : null;
  };
};
const runCadenceDecoder: DecoderFactory = () => (dv) => parseRsc(dv).cadenceSpm;

export function useHeartRateSensor(): BleSensorApi {
  return useBleSensor(GATT.heartRate.service, GATT.heartRate.measurement, heartRateDecoder);
}
export function useCyclingPowerSensor(): BleSensorApi {
  return useBleSensor(GATT.cyclingPower.service, GATT.cyclingPower.measurement, powerDecoder);
}
export function useBikeCadenceSensor(): BleSensorApi {
  return useBleSensor(GATT.csc.service, GATT.csc.measurement, bikeCadenceDecoder);
}
export function useRunCadenceSensor(): BleSensorApi {
  return useBleSensor(GATT.runningSpeedCadence.service, GATT.runningSpeedCadence.measurement, runCadenceDecoder);
}
