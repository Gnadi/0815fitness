import type { Activity, RouteSignature, Sport } from '../types';
import { ROUTE_POINTS } from './derived';

/** Finding the sessions that are the same route run again.
 *
 *  The comparison the app could not previously make is a route against itself: two runs
 *  read side by side say which was faster, but only a whole cluster of the same loop
 *  says whether the loop is getting easier. Everything here works off the fixed-length,
 *  start-relative shape each activity already stores, so a season groups itself in
 *  milliseconds without touching a single sample stream. */

interface Point {
  e: number;
  n: number;
}

export function signaturePoints(sig: RouteSignature): Point[] {
  const out: Point[] = [];
  for (let i = 0; i < sig.shape.length; i += 2) out.push({ e: sig.shape[i], n: sig.shape[i + 1] });
  return out;
}

/** The same track walked the other way: reversed, then re-anchored on what is now its
 *  first point. An out-and-back run in the opposite direction is the same route. */
function reversed(points: Point[]): Point[] {
  const back = [...points].reverse();
  const origin = back[0];
  return back.map((p) => ({ e: p.e - origin.e, n: p.n - origin.n }));
}

function meanOffset(a: Point[], b: Point[]): number {
  const n = Math.min(a.length, b.length);
  if (n === 0) return Infinity;
  let sum = 0;
  for (let i = 0; i < n; i++) sum += Math.hypot(a[i].e - b[i].e, a[i].n - b[i].n);
  return sum / n;
}

/** How far apart two tracks are on average, in metres, taking the better of the two
 *  directions. */
export function routeOffsetM(a: RouteSignature, b: RouteSignature): number {
  const pa = signaturePoints(a);
  const pb = signaturePoints(b);
  if (pa.length !== ROUTE_POINTS || pb.length !== ROUTE_POINTS) return Infinity;
  return Math.min(meanOffset(pa, pb), meanOffset(pa, reversed(pb)));
}

/** The tolerance scales with the route, because a 2 % wander is what a phone's fix and
 *  a different side of the road amount to — but it is floored and capped, so a short
 *  loop is not matched by proximity alone and a long one does not swallow its neighbour. */
export function matchToleranceM(totalM: number): number {
  return Math.min(250, Math.max(60, totalM * 0.02));
}

export function isSameRoute(a: RouteSignature, b: RouteSignature): boolean {
  const longer = Math.max(a.totalM, b.totalM);
  if (longer <= 0) return false;
  if (Math.abs(a.totalM - b.totalM) / longer > 0.15) return false;
  return routeOffsetM(a, b) <= matchToleranceM(longer);
}

export interface RouteCluster {
  id: string;
  name: string;
  sport: Sport;
  /** Newest first, like every other list in the app. */
  activities: Activity[];
  medianDistanceM: number;
  firstDate: number;
  lastDate: number;
}

/** The most-used title among the members, which is the closest thing to a route name
 *  the app knows — the save screen already reuses a nearby session's name. */
function clusterName(activities: Activity[]): string {
  const counts = new Map<string, number>();
  for (const a of activities) {
    const name = a.title.includes('·') ? a.title.split('·').slice(1).join('·').trim() : a.title.trim();
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  let best = '';
  let bestCount = 0;
  for (const [name, count] of counts) {
    if (count > bestCount) {
      best = name;
      bestCount = count;
    }
  }
  return best || `${(activities[0].distance / 1000).toFixed(1)} km route`;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** Groups a log into routes, greedily: each activity joins the first cluster whose
 *  representative it matches, or opens one of its own. Greedy rather than exhaustive
 *  because a training log's routes are well separated in practice — the same loop
 *  matches its own cluster long before it comes near anyone else's. */
export function clusterRoutes(activities: Activity[], minRepeats = 2): RouteCluster[] {
  const withRoutes = activities.filter((a) => a.derived.route != null).sort((a, b) => a.startedAt - b.startedAt);

  const groups: { representative: RouteSignature; members: Activity[] }[] = [];
  for (const activity of withRoutes) {
    const sig = activity.derived.route as RouteSignature;
    const group = groups.find((g) => g.members[0].sport === activity.sport && isSameRoute(g.representative, sig));
    if (group) group.members.push(activity);
    else groups.push({ representative: sig, members: [activity] });
  }

  return groups
    .filter((g) => g.members.length >= minRepeats)
    .map((g) => {
      const newestFirst = [...g.members].sort((a, b) => b.startedAt - a.startedAt);
      return {
        id: g.members[0].id,
        name: clusterName(newestFirst),
        sport: g.members[0].sport,
        activities: newestFirst,
        medianDistanceM: median(g.members.map((a) => a.distance)),
        firstDate: g.members[0].startedAt,
        lastDate: newestFirst[0].startedAt,
      };
    })
    .sort((a, b) => b.activities.length - a.activities.length || b.lastDate - a.lastDate);
}
