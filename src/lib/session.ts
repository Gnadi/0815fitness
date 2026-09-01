import type { RecorderCheckpoint } from './recorder';
import { deleteKv, getKv, setKv } from './db';

/** The checkpoint of a session in progress.
 *
 *  One key, overwritten every few seconds — never appended to, so a long ride costs the
 *  same room as a short one, and never more than the session it is protecting. */
const KEY = 'session.inflight';

export const CHECKPOINT_INTERVAL_MS = 5000;

export async function saveCheckpoint(checkpoint: RecorderCheckpoint): Promise<void> {
  try {
    await setKv(KEY, checkpoint);
  } catch {
    // A checkpoint that cannot be written must not take the recording down with it:
    // the session in memory is still the real one, and it is still being recorded.
  }
}

export async function loadCheckpoint(): Promise<RecorderCheckpoint | null> {
  try {
    const found = await getKv<RecorderCheckpoint>(KEY);
    return found && found.version === 1 && found.startedAt > 0 ? found : null;
  } catch {
    return null;
  }
}

export async function clearCheckpoint(): Promise<void> {
  try {
    await deleteKv(KEY);
  } catch {
    // Nothing to do: at worst the next launch offers a session that was already saved,
    // and the recovery card can be dismissed.
  }
}

/** Whether a checkpoint holds enough to be worth offering back. A tap on RECORD that
 *  was abandoned before the fix landed is not an interrupted session. */
export function isWorthRecovering(checkpoint: RecorderCheckpoint | null): checkpoint is RecorderCheckpoint {
  if (!checkpoint) return false;
  return checkpoint.points.length > 5 || checkpoint.distanceM > 100;
}
