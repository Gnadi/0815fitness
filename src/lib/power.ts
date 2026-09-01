import { registerPlugin } from '@capacitor/core';

/** The app's half of BatteryOptimizationPlugin — see the Java for why it exists.
 *
 *  Short version: a location foreground service is exempt from Doze on stock Android,
 *  but several manufacturers add a layer above it that will stop one anyway. On those
 *  phones the exemption is the difference between a recorded ride and the old bug
 *  wearing a new hat. */
interface BatteryOptimizationPlugin {
  isExempt(): Promise<{ exempt: boolean }>;
  requestExemption(): Promise<{ opened: boolean }>;
}

const BatteryOptimization = registerPlugin<BatteryOptimizationPlugin>('BatteryOptimization');

/** Whether Android will leave a running recording alone. Errs towards `true`: a phone
 *  that cannot answer should not be nagged about a setting it may not have. */
export async function isBatteryExempt(): Promise<boolean> {
  try {
    const { exempt } = await BatteryOptimization.isExempt();
    return exempt;
  } catch {
    return true;
  }
}

/** Opens the exemption request. Resolves false when the device offers nowhere to ask. */
export async function requestBatteryExemption(): Promise<boolean> {
  try {
    const { opened } = await BatteryOptimization.requestExemption();
    return opened;
  } catch {
    return false;
  }
}
