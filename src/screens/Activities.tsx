import { useMemo, useState } from 'react';
import { color, font } from '../theme';
import * as S from '../styles';
import { Label, ScreenHeader } from '../components/primitives';
import { ActivityRow } from '../components/ActivityRow';
import { awardMedals } from '../lib/medals';
import { useUnits } from '../hooks/useUnits';
import { fmtEuroDate, hoursMinutes, startOfWeek } from '../lib/stats';
import { MAX_COMPARE } from '../lib/compare';
import type { Activity, Sport } from '../types';

type Filter = 'all' | Sport;

/** Everything recorded, in one list.
 *
 *  The Overview shows the three newest sessions because that is what an overview is for;
 *  this is the log itself — every session, searchable, grouped by the week it belongs
 *  to, and the way into reading, editing or deleting any one of them. */
export function Activities({
  activities,
  onBack,
  onActivity,
  onCompare,
  onManual,
}: {
  activities: Activity[];
  onBack: () => void;
  onActivity: (id: string) => void;
  onCompare: (ids: string[]) => void;
  onManual: () => void;
}) {
  const units = useUnits();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [picking, setPicking] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  const medals = useMemo(() => awardMedals(activities), [activities]);
  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return activities.filter((a) => {
      if (filter !== 'all' && a.sport !== filter) return false;
      if (!needle) return true;
      return (
        a.title.toLowerCase().includes(needle) ||
        a.notes.toLowerCase().includes(needle) ||
        fmtEuroDate(a.startedAt).includes(needle)
      );
    });
  }, [activities, query, filter]);

  // Weeks, newest first — the same unit every other screen counts in, so scrolling the
  // log and reading the volume chart are the same mental picture.
  const weeks = useMemo(() => {
    const byWeek = new Map<number, Activity[]>();
    for (const a of matches) {
      const week = startOfWeek(a.startedAt);
      const list = byWeek.get(week) ?? [];
      list.push(a);
      byWeek.set(week, list);
    }
    return [...byWeek.entries()].sort((a, b) => b[0] - a[0]);
  }, [matches]);

  const totalKm = matches.reduce((sum, a) => sum + a.distance, 0);
  const totalS = matches.reduce((sum, a) => sum + (a.endedAt - a.startedAt) / 1000, 0);

  // A comparison needs one sport: pace against speed is not a comparison.
  const pickedSport = picked.length > 0 ? activities.find((a) => a.id === picked[0])?.sport : undefined;

  const togglePick = (a: Activity) => {
    setPicked((current) => {
      if (current.includes(a.id)) return current.filter((id) => id !== a.id);
      if (current.length >= MAX_COMPARE) return current;
      if (pickedSport && a.sport !== pickedSport) return current;
      return [...current, a.id];
    });
  };

  const filters: { value: Filter; label: string }[] = [
    { value: 'all', label: 'ALL' },
    { value: 'run', label: 'RUNS' },
    { value: 'ride', label: 'RIDES' },
  ];

  return (
    <div style={S.screen}>
      <ScreenHeader
        title="History"
        onBack={onBack}
        right={
          <button onClick={onManual} style={{ ...S.linkButton, fontSize: 13 }}>
            + Manual
          </button>
        }
      />

      <div style={{ padding: '0 16px 10px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles, notes or a date"
          aria-label="Search the log"
          style={{ ...S.input, fontSize: 14 }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: '5px 11px',
                borderRadius: 999,
                cursor: 'pointer',
                fontFamily: font.mono,
                fontSize: 11,
                letterSpacing: '.06em',
                background: 'none',
                border: `1px solid ${filter === f.value ? color.accent : color.border}`,
                color: filter === f.value ? color.accent : color.textMuted,
              }}
            >
              {f.label}
            </button>
          ))}
          <span style={{ flex: 1 }} />
          <button
            onClick={() => {
              setPicking((p) => !p);
              setPicked([]);
            }}
            style={{ ...S.linkButton, fontSize: 12 }}
          >
            {picking ? 'Cancel' : 'Compare'}
          </button>
        </div>
        <span style={{ ...S.caption, color: color.textFaint }}>
          {matches.length} {matches.length === 1 ? 'session' : 'sessions'} · {units.fmtDistance(totalKm, 1)} {units.distanceUnit} ·{' '}
          {hoursMinutes(totalS)} h
        </span>
      </div>

      <div className="ct-scroll" style={{ ...S.scrollArea, paddingBottom: picking ? 96 : 24 }}>
        {matches.length === 0 ? (
          <span style={{ display: 'block', padding: '8px 16px', ...S.body, color: color.textMuted }}>
            {activities.length === 0
              ? 'Nothing recorded yet. Tap RECORD on the Overview, or add a session you did without the phone.'
              : 'No session matches that.'}
          </span>
        ) : (
          weeks.map(([weekStart, weekActivities]) => {
            const weekKm = weekActivities.reduce((sum, a) => sum + a.distance, 0);
            return (
              <div key={weekStart} style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ ...S.tableHeaderRow, justifyContent: 'space-between' }}>
                  <Label>Week of {fmtEuroDate(weekStart)}</Label>
                  <span style={{ ...S.monoTick, color: color.textFaint }}>
                    {weekActivities.length} · {units.fmtDistance(weekKm, 1)} {units.distanceUnit.toUpperCase()}
                  </span>
                </div>
                {weekActivities.map((a) => {
                  const on = picked.includes(a.id);
                  const selectable = !pickedSport || a.sport === pickedSport;
                  return picking ? (
                    <button
                      key={a.id}
                      className="ct-row"
                      onClick={() => togglePick(a)}
                      disabled={!selectable && !on}
                      style={{
                        ...S.listRow,
                        width: '100%',
                        border: 'none',
                        borderTop: `1px solid ${color.dividerHairline}`,
                        background: 'none',
                        textAlign: 'left',
                        cursor: selectable || on ? 'pointer' : 'default',
                        opacity: selectable || on ? 1 : 0.4,
                      }}
                    >
                      <span
                        style={{
                          width: 16,
                          height: 16,
                          flex: 'none',
                          borderRadius: 4,
                          boxSizing: 'border-box',
                          border: `1px solid ${on ? color.accent : color.borderStrong}`,
                          background: on ? color.accent : 'transparent',
                        }}
                      />
                      <span style={{ flex: 1, minWidth: 0, fontSize: 13, color: color.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {a.title}
                      </span>
                      <span style={{ ...S.tableNum, color: color.textMuted }}>
                        {units.fmtDistance(a.distance, 1)} {units.distanceUnit}
                      </span>
                    </button>
                  ) : (
                    <ActivityRow key={a.id} activity={a} medals={medals.get(a.id) ?? []} onOpen={() => onActivity(a.id)} />
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      {picking && (
        <div style={S.bottomBar}>
          <button
            onClick={() => onCompare(picked)}
            disabled={picked.length < 2}
            style={{
              width: '100%',
              height: 48,
              borderRadius: 999,
              border: 'none',
              cursor: picked.length < 2 ? 'default' : 'pointer',
              background: picked.length < 2 ? color.surfaceRaised : color.accent,
              color: picked.length < 2 ? color.textFaint : color.onAccent,
              fontFamily: font.mono,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: '.1em',
            }}
          >
            {picked.length < 2 ? 'PICK TWO OR THREE' : `COMPARE ${picked.length}`}
          </button>
        </div>
      )}
    </div>
  );
}
