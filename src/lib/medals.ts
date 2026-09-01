import type { Activity, RouteSignature, Sport } from '../types';
import { PB_DISTANCES, POWER_DURATIONS } from './derived';
import { isSameRoute, routeDirection } from './routes';

/** Marking the sessions, and the stretches inside them, that were an improvement.
 *
 *  A training log full of numbers still leaves the one question a person actually opens
 *  it with — *was that any good?* — to be answered by reading a table. A medal answers
 *  it before the table is read: this was your fastest five kilometres, this was the
 *  third quickest you have ever covered the fourth kilometre of this loop.
 *
 *  Three rules hold everywhere in here, and they are what keep a medal worth having:
 *
 *  - **A medal is earned against what came before it.** Every effort is ranked against
 *    the sessions *older* than it, never against the whole log. So a medal is what the
 *    session was worth on the day, it never appears on an old session because of
 *    something recorded since, and — the point — it never disappears from one either.
 *  - **It takes a field to win.** Nothing is awarded until there are `MIN_PRIOR`
 *    earlier attempts to beat: a first run is not a personal best, it is a first run.
 *  - **Only like against like.** Best efforts are ranked against the same distance,
 *    sections against the same section of the same route covered the same way round.
 *    Nothing here compares one hill with another and calls the difference form.
 *
 *  Everything is read out of the stored derivation — the best efforts, the power curve,
 *  the per-kilometre splits, the route signature — so a season's worth of medals is a
 *  pass over the summaries, with not one sample stream loaded. */

export type MedalTier = 'gold' | 'silver' | 'bronze';

/** What a medal was won at. The kinds are ordered by how much of the session they
 *  speak for, which is the order they are listed in. */
export type MedalKind = 'effort' | 'route' | 'segment';

export interface Medal {
  /** Stable within an activity, so React has a key and a test has a handle. */
  key: string;
  tier: MedalTier;
  kind: MedalKind;
  /** What was won: 'Best 5 km', 'Pöstlingberg Climb', 'Kilometre 4'. */
  label: string;
  /** The reading under it: the time, and what it beat. */
  detail: string;
  /** 1-based kilometre, on a segment medal — what pins it to a splits row and to a
   *  place on the map. */
  km?: number;
  /** 1 = nothing older was better, 2 = one thing was, 3 = two were. */
  rank: number;
}

/** How many earlier attempts there must be before the fastest of them is worth beating.
 *
 *  Three is the smallest number that makes a gold mean something: it is faster than
 *  everything in a field, rather than faster than the one other time you tried. */
export const MIN_PRIOR = 3;

const TIERS: MedalTier[] = ['gold', 'silver', 'bronze'];

/** Where a value ranks among earlier ones, or null when it has not earned a medal.
 *
 *  A placing alone is not enough. Third of four is a placing; it is also, necessarily, a
 *  session slower than most of the ones before it, and a bronze on it would be a medal
 *  for a bad day in a thin field — which is exactly the noise that makes an achievement
 *  worth nothing. So a medal is a top-three placing **that also beat what you usually
 *  do**: better than the median of everything before it.
 *
 *  With a season of attempts the second condition never binds — anything in the top
 *  three is far above the median. It binds early, which is when it matters. */
function placeAmong(value: number, earlier: number[], better: 'lower' | 'higher'): number | null {
  if (earlier.length < MIN_PRIOR) return null;
  const beaten = earlier.filter((v) => (better === 'lower' ? value < v : value > v)).length;
  const rank = earlier.length - beaten + 1;
  if (rank > TIERS.length) return null;
  return beaten * 2 > earlier.length ? rank : null;
}

function clockDelta(seconds: number): string {
  const t = Math.round(Math.abs(seconds));
  if (t < 60) return `${t} s`;
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function clock(seconds: number): string {
  const t = Math.max(0, Math.round(seconds));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = t % 60;
  const p = (n: number) => String(n).padStart(2, '0');
  return h ? `${h}:${p(m)}:${p(s)}` : `${m}:${p(s)}`;
}

/** What a rank is worth saying about the field it was won in. */
function against(rank: number, value: number, earlier: number[], better: 'lower' | 'higher', fmt: (v: number) => string): string {
  const sorted = [...earlier].sort((a, b) => (better === 'lower' ? a - b : b - a));
  const previousBest = sorted[0];
  if (rank === 1) {
    const margin = Math.abs(value - previousBest);
    return margin > 0.5
      ? `${fmt(value)} · ${clockDelta(margin)} ${better === 'lower' ? 'faster' : 'more'} than the previous best`
      : `${fmt(value)} · your best over ${earlier.length + 1} attempts`;
  }
  return `${fmt(value)} · ${rank === 2 ? 'second' : 'third'} best of ${earlier.length + 1}, behind ${fmt(previousBest)}`;
}

// ── the accumulators one pass through the log carries ──────────────
interface RouteGroup {
  representative: RouteSignature;
  sport: Sport;
  name: string;
  /** Elapsed seconds of each earlier repeat. */
  times: number[];
  /** Seconds over each kilometre of each earlier forward repeat, by kilometre index. */
  kmTimes: number[][];
}

function elapsedS(a: Activity): number {
  return Math.max(0, (a.endedAt - a.startedAt) / 1000);
}

/** The route's name as the log knows it: whatever follows the separator in the title,
 *  which is where the save screen puts a nearby session's name. */
function routeName(a: Activity): string {
  const tail = a.title.includes('·') ? a.title.split('·').slice(1).join('·').trim() : a.title.trim();
  return tail || `${(a.distance / 1000).toFixed(1)} km route`;
}

/** Every medal in the log, keyed by activity id.
 *
 *  One chronological pass: each session is ranked against the accumulators as they
 *  stand — which is exactly the history that existed when it was recorded — and then
 *  folded into them for the sessions that follow. That is what makes a screenful of
 *  medals cost one walk of the log rather than one walk per session. */
export function awardMedals(activities: Activity[]): Map<string, Medal[]> {
  const chronological = [...activities].sort((a, b) => a.startedAt - b.startedAt);
  const efforts = new Map<string, number[]>(); // 'run:5k' / 'ride:20m' → earlier values
  const groups: RouteGroup[] = [];
  const out = new Map<string, Medal[]>();

  for (const activity of chronological) {
    const medals: Medal[] = [];
    const d = activity.derived;

    // ── best efforts, over the distances a run is measured in and the windows a ride is
    if (activity.sport === 'run') {
      for (const distance of PB_DISTANCES) {
        const seconds = d.pbEfforts?.[distance.key];
        if (!seconds) continue;
        const key = `run:${distance.key}`;
        const earlier = efforts.get(key) ?? [];
        const rank = placeAmong(seconds, earlier, 'lower');
        if (rank) {
          medals.push({
            key: `effort-${distance.key}`,
            tier: TIERS[rank - 1],
            kind: 'effort',
            label: `Fastest ${distance.label}`,
            detail: against(rank, seconds, earlier, 'lower', clock),
            rank,
          });
        }
        efforts.set(key, [...earlier, seconds]);
      }
    } else {
      for (const window of POWER_DURATIONS) {
        const watts = d.powerBests?.[window.key];
        if (!watts) continue;
        const key = `ride:${window.key}`;
        const earlier = efforts.get(key) ?? [];
        const rank = placeAmong(watts, earlier, 'higher');
        if (rank) {
          medals.push({
            key: `power-${window.key}`,
            tier: TIERS[rank - 1],
            kind: 'effort',
            label: `Best ${window.key} power`,
            detail:
              rank === 1
                ? `${Math.round(watts)} W · ${Math.round(watts - Math.max(...earlier))} W over the previous best`
                : `${Math.round(watts)} W · ${rank === 2 ? 'second' : 'third'} best of ${earlier.length + 1}`,
            rank,
          });
        }
        efforts.set(key, [...earlier, watts]);
      }
    }

    // ── the route, and the sections of it
    const signature = d.route;
    if (signature) {
      const group = groups.find((g) => g.sport === activity.sport && isSameRoute(g.representative, signature));
      const direction = group ? routeDirection(group.representative, signature) : null;
      const time = elapsedS(activity);

      if (group) {
        const rank = placeAmong(time, group.times, 'lower');
        if (rank) {
          medals.push({
            key: 'route',
            tier: TIERS[rank - 1],
            kind: 'route',
            label: group.name,
            detail: against(rank, time, group.times, 'lower', clock),
            rank,
          });
        }

        // A kilometre of a loop run the other way round is a different stretch of road,
        // so sections are only ranked against repeats covered the same way.
        if (direction === 'forward') {
          d.kmSplitS?.forEach((seconds, i) => {
            const earlier = group.kmTimes[i] ?? [];
            const rank = placeAmong(seconds, earlier, 'lower');
            if (!rank) return;
            medals.push({
              key: `segment-${i + 1}`,
              tier: TIERS[rank - 1],
              kind: 'segment',
              label: `Kilometre ${i + 1}`,
              detail: against(rank, seconds, earlier, 'lower', clock),
              km: i + 1,
              rank,
            });
          });
        }

        group.times.push(time);
        if (direction === 'forward') {
          d.kmSplitS?.forEach((seconds, i) => {
            if (!group.kmTimes[i]) group.kmTimes[i] = [];
            group.kmTimes[i].push(seconds);
          });
        }
      } else {
        groups.push({
          representative: signature,
          sport: activity.sport,
          name: routeName(activity),
          times: [time],
          kmTimes: (d.kmSplitS ?? []).map((seconds) => [seconds]),
        });
      }
    }

    if (medals.length > 0) out.set(activity.id, sortMedals(medals));
  }

  return out;
}

/** Gold before silver before bronze, and within a tier the whole session before a
 *  stretch of it — a personal best is not one line among ten kilometre marks. */
export function sortMedals(medals: Medal[]): Medal[] {
  const kindOrder: Record<MedalKind, number> = { effort: 0, route: 1, segment: 2 };
  return [...medals].sort(
    (a, b) => a.rank - b.rank || kindOrder[a.kind] - kindOrder[b.kind] || (a.km ?? 0) - (b.km ?? 0) || a.label.localeCompare(b.label),
  );
}

/** The medals of one session. Convenience over `awardMedals` for the screen that shows
 *  a single session; it still walks the log, because a medal is only meaningful
 *  against the log. */
export function medalsFor(activity: Activity, activities: Activity[]): Medal[] {
  return awardMedals(activities).get(activity.id) ?? [];
}

/** The section medals worth pinning on a map, at most `max` of them.
 *
 *  A session where every kilometre of a loop was the quickest that kilometre has been
 *  is a real thing — and fifty pins along one line is not a map. The best tiers are kept
 *  first, and what is left is thinned evenly along the route rather than truncated, so
 *  the pins stay spread over the ground they were won on. Nothing is lost by it: the
 *  splits table marks every one of them. */
export function mapPins(medals: Medal[], max = 12): Medal[] {
  const sections = medals.filter((m) => m.km != null);
  if (sections.length <= max) return sections;
  const order: MedalTier[] = ['gold', 'silver', 'bronze'];
  for (const tier of order) {
    const kept = sections.filter((m) => m.tier === tier);
    if (kept.length === 0) continue;
    if (kept.length <= max) return kept;
    const stride = kept.length / max;
    return Array.from({ length: max }, (_, i) => kept[Math.floor(i * stride)]);
  }
  return sections.slice(0, max);
}

/** How many of each tier, for the count a card or a header carries. */
export function medalTally(medals: Medal[]): { gold: number; silver: number; bronze: number; total: number } {
  const tally = { gold: 0, silver: 0, bronze: 0, total: medals.length };
  for (const medal of medals) tally[medal.tier] += 1;
  return tally;
}
