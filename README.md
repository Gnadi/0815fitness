# Contour

A single-user training log for running and cycling — records activities on the device
and analyses them in depth. No feed, no sharing, no upsell. Built from a Claude Design
handoff (`Contour Capture.dc.html`) and its accompanying design system brief, which
define the dark-only palette, the mono numeral type scale and every screen here.

React + TypeScript + Vite. Everything is stored locally; there is no backend. It
installs to a home screen and runs with no network at all — see **Installing it** below.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run lint
npm run test       # vitest over the pure logic
npm run smoke      # drives the built app in Chromium with a simulated GPS track
npm run pwa        # asserts the worker installs and the app boots with the network cut
npm run icons      # re-renders the PNG icons from public/logo.svg
```

`npm run smoke` and `npm run pwa` need `npm run preview` running on port 4173 (or
`BASE_URL` set); `smoke` writes screenshots to `scripts/shots/`.

## Installing it

The app is meant to be opened at a trailhead, so it is a PWA that works with no network:
add it to a home screen and it runs without browser chrome, off a cache, against a
training log that already lived on the device.

- **The shell is precached.** `src/sw.js` caches the document, script, stylesheet, fonts
  and icons at install and serves them cache-first. There is nothing to sync — every
  activity is in IndexedDB on the device — so offline is the same app, not a degraded one.
- **An update never interrupts a recording.** The worker deliberately does not
  `skipWaiting()`: a new build installs in the background and takes over the next time
  the app is opened cold, so the shell can never be swapped out from under a session
  that is capturing. There is no update prompt to dismiss.
- **The precache list is generated at build time** by the `contourServiceWorker` plugin
  in `vite.config.ts`, and the cache is versioned by a hash of the precached files'
  *contents* — so an unhashed icon or the manifest still invalidates when it changes,
  and a rebuild that changes nothing emits a byte-identical worker with no update to
  install.
- **The icon carries a Record shortcut**, which opens the app straight at pre-start with
  the GPS fix already acquiring.
- **Installed, the app asks for persistent storage**, so the history stops being
  evictable cache. Only when installed: in a tab it would be a permission prompt for a
  visitor who has recorded nothing.

The mark in `public/logo.svg` is the app's own signature element — a recorded elevation
profile in straight segments over the contour intervals the name comes from — and the
PNG icons are rendered from it by `npm run icons`.

## What's real

The prototype simulated its sensor data. This implementation reads the actual hardware:

| Screen data | Source |
| --- | --- |
| Distance, pace, speed, elevation, route | `navigator.geolocation.watchPosition`, haversine over accepted fixes |
| GPS fix state and accuracy | `GeolocationPosition.coords.accuracy` |
| Heart rate | Web Bluetooth, Heart Rate Service `0x180D` / measurement `0x2A37` |
| Cycling power | Web Bluetooth, Cycling Power `0x1818` / `0x2A63` |
| Bike cadence | Web Bluetooth, CSC `0x1816` / `0x2A5B`, RPM derived from crank revolutions |
| Running cadence | Web Bluetooth, RSC `0x1814` / `0x2A53` |
| Week volume, streak, load ratio, zones, PBs, power curve, decoupling | Computed from stored activities in `src/lib/stats.ts` |
| Training stress, normalised power, grade-adjusted pace, cadence distribution | Derived per activity in `src/lib/derived.ts`, aggregated in `src/lib/stats.ts` |
| Route repeats | Track shape matching in `src/lib/routes.ts` |
| Stat details behind each Overview figure | Twelve-week rollups in `src/lib/statDetails.ts` |
| Session comparison: metrics, pace/elevation/HR overlays, splits | Per-second traces off the recorded track in `src/lib/compare.ts` |

Two honest deviations from the prototype's copy:

- **No satellite count.** No web API exposes one, so the pre-start card shows real
  accuracy in metres and derives the signal bars from it (`fixStrengthFromAccuracy`).
- **The recording map draws no tiles.** It renders the actual recorded track in the
  prototype's line-and-terrain style. A saved session's map can show an OpenStreetMap
  basemap under the track — see **The basemap** below — but recording never fetches
  anything, because that is the screen used where there is no signal.

## Browser support

- **GPS** works anywhere with the Geolocation API, over HTTPS or `localhost`.
- **Web Bluetooth** is Chromium-only (Chrome/Edge on desktop and Android, not iOS Safari
  or Firefox) and needs HTTPS. Where it's missing, the sensor chips say so and the app
  degrades to GPS-only — pace, distance, elevation and route all still record, and the
  heart-rate field shows its designed absent state rather than a lock.
- A screen wake lock is held while recording where `navigator.wakeLock` exists.

## Layout

```
src/
  theme.ts          design tokens from the brief (colour, type, spacing, zones)
  styles.ts         shared style atoms (label, mono numerals, table rows, wells)
  types.ts          Activity summary / samples / derived figures / laps / settings
  lib/
    geo.ts          haversine, ascent, track projection, route silhouettes
    recorder.ts     recording state machine: distance, laps, auto-pause, checkpoints
    ble.ts          GATT parsing + connection for HR, power, CSC, RSC
    derived.ts      everything swept out of one activity's samples, once, on save
    stats.ts        weekly rollups, streaks, load, stress, zones, PBs, power curve
    statDetails.ts  the model behind each Overview figure's detail screen
    compare.ts      per-second traces, distance-axis series, splits, metric rows
    routes.ts       matching a track against the routes already in the log
    tiles.ts        Web Mercator, the zoom that fits a track, and the tile grid
    units.ts        metric or imperial, applied on the way to the screen
    db.ts           the IndexedDB store: summaries, samples, key/value
    storage.ts      the store's facade, settings, and migration from older builds
    session.ts      the checkpoint a session in progress is recovered from
    backup.ts       export and import: the whole log as JSON, one session as GPX
    demoSeed.ts     synthetic sample history behind the empty-state action
    pwa.ts          service-worker registration and the persistent-storage request
  hooks/            useGpsFix, useRecorder, useBleSensors, useWakeLock, useNavStack,
                    useUnits / UnitsProvider
  components/       PhoneFrame, primitives, ActivityRow, charts, TileMap
  screens/          Overview, Activities, ActivityDetail, ManualEntry, Settings,
                    Analyse (load/zones/records/routes/plan), RouteDetail, StatDetail,
                    Compare, PreStart, RecordingSession, Save
  sw.js             the service worker; its precache list is injected at build time
public/
  logo.svg          the Contour mark, and the source the PNG icons are rendered from
  manifest.webmanifest
```

## Getting back

The app is one document, so the browser only knows the history entries it is given.
`useNavStack` gives it one per screen the app opens: back — the button, the gesture or
the hardware key — pops the app's own stack, so a stat detail returns to the Overview
and a comparison opened from a detail returns to that detail. The in-app back buttons
go through the same history, so the two never drift apart. Recording and Save are the
exception: they are steps of one session with no way out but FINISH or DISCARD, so they
replace rather than stack and hold their position against a back press.

## Reading a figure, comparing two sessions

Every number on the Overview opens its own detail: the week distance, the four cards
(time, ascent, ride, sessions), the streak, the volume bars and the load ratio. Each
detail shows the figure in its window, the twelve weeks behind it, a table of the last
eight, and the sessions that add up to it — plus a note on how it is computed, because
a number nobody can account for is not worth showing.

Two or three sessions of the same sport can be read side by side, from the Overview's
*Compare*, from any session row, or from a stat detail's contributors. The first one
picked is the reference every difference is measured against. The comparison puts them
on one distance axis — pace (or speed), elevation and heart rate overlaid — with a
metric table and per-kilometre splits under it. Pace comes from the time it took to
cross each bucket of the track, not an instantaneous speed, so a stop reads as the slow
kilometre it was; a GPS jump the recorder refused to count is discarded here too.
Sports are never mixed: pace against speed is not a comparison.

## The basemap

Opening a saved session draws its track over OpenStreetMap raster tiles. It is the only
thing in the app that talks to the network, and it is built to stay that way:

- **It is a setting.** Settings → *Map* switches it to the drawn track, and with it off
  the app makes no network requests at all. A tile request tells a third-party server
  roughly where you were; that is a choice worth leaving to the person making it.
- **Recording never fetches.** The tiles are on the detail screen only. The screen used
  at a trailhead with no signal draws the track and nothing else.
- **Failure is not a grey hole.** If the tiles do not arrive — offline, blocked, the
  server saying no — the map falls back to the line-and-contour drawing, which is what
  the app showed before there were tiles and needs nothing.
- **The service worker does not touch them.** It returns early on any cross-origin
  request, so tiles never enter the precache and the offline guarantee is unchanged.
- **No map library.** `src/lib/tiles.ts` is the Web Mercator projection, the zoom that
  fits a track to the viewport, and the tile grid that covers it — about a hundred lines,
  against a dependency whose stylesheet the app would have to carry offline for a
  basemap that only ever appears online. The zoom is chosen rather than offered: this is
  a picture of one recorded session, not something to pan around.
- **Standard OSM tiles are a light map** in a dark-only app, so they are inverted through
  a CSS filter into the palette rather than swapped for a dark tile server that would
  need an account and a key. Attribution is on the map, as the tile server's terms
  require.

## Where the log lives

Activities are stored in IndexedDB, split in two: a **summary** per activity — the
metadata, plus every figure derived from its samples — and the **sample streams**
themselves, in a separate store.

The split is the point. An hour of riding with a strap, a meter and a cadence sensor is
four streams at roughly 1 Hz, which is some hundreds of kilobytes; the summary is
hundreds of bytes. The aggregate screens read only summaries, so a season of history is
read without parsing a season of samples, and only the screens that draw one session —
its detail, a comparison, a GPX export — load the streams, and only for the sessions they
draw.

Everything in `derived` is computed once, in `src/lib/derived.ts`, when an activity is
saved or imported, and everything in it is settings-**independent**. That distinction is
what makes changing a setting safe: the time at each heart rate is stored, not the time
in each zone, so moving a max heart rate or switching to threshold zones re-cuts the
whole season correctly rather than leaving every past session bucketed against the
setting of the day it was saved. The same holds for FTP against normalised power, and for
threshold against the heart-rate histogram. `DERIVED_VERSION` stamps each blob, and a
launch that finds an older one re-derives it from its samples in the background.

A log written by an earlier build — one `localStorage` string holding every activity —
is migrated on the first launch, and the old key is only cleared once the database
transaction has committed.

## Getting it off the device

`localStorage` was also the only copy: a cleared browser, an eviction or a new phone took
the log with it. Settings → *Your data* exports every session — full track and sensor
streams, plus the settings — as one JSON file, and reads one back; a single session
exports as GPX 1.1 with Garmin's TrackPointExtension, which is what every other training
tool reads heart rate, cadence and power out of. GPX comes back in too, so a file from a
watch can be added to the log. Imports merge rather than replace, so a backup restored
onto a phone that has also been recording loses nothing.

Nothing is sent anywhere. The export is a file the browser hands to the person.

## When a recording is interrupted

A session in progress used to live only in memory, so a reload, a tab evicted under
memory pressure or a crash two hours into a long ride took the whole thing — the one
moment in the app where the data cannot be recovered by any other means.

The recorder now writes a checkpoint every five seconds, and again the moment the app is
backgrounded, to a single key it overwrites. The next launch offers it back on the
Overview: **carry on**, **save what was captured**, or **discard**. Resuming comes back
*paused*, with everything between the last checkpoint and now counted as paused time —
the app was not recording during the gap, and a session that resumed itself would
silently claim minutes it never measured.

## Load: distance, or what it cost

Weekly load is run kilometres plus ride kilometres ÷ 3 by default — a fixed exchange rate
that cannot tell a recovery spin from a threshold ride, and says so. Settings can switch
it to **training stress**, where an hour at threshold is 100 points, scored from whatever
the session actually measured:

- **power** against FTP, via normalised power — the 30 s rolling average raised to the
  fourth, meaned, rooted, which is what reads surges the way the body does;
- **heart rate** against threshold, from the stored per-bpm histogram, weighted by the
  square of intensity;
- **duration times perceived effort**, when the session carries neither.

Which of the three a figure came from is always reported with it, because a number
derived from a guess should never be displayed as though it were measured.

## Scope

This build covers the screens in the handed-off design — Overview, Analyse, Pre-start,
Recording (live, auto-paused, paused, screen-locked, ride without a power meter) and Save
— plus the stat details and the session comparison above, and the screens the design file
did not cover: the activity list, a single activity on its own (splits, laps, zones,
cadence, its own charts, and the only place a saved session can be edited or deleted),
manual entry for a session done without the phone, settings, and route repeats.

Analyse has five tabs: **Load**, **Zones** (with the cadence distribution), **Records**,
**Routes**, and **Plan** — which now scores the week that has just finished against the
plan it was written for.

## Reading a route against itself

Two sessions side by side say which was faster. A whole cluster of the same loop says
whether the loop is getting easier, which is the question a training log is kept to
answer.

Every activity stores a **route signature**: its track reduced to thirty-two points
spaced evenly *along the path* — not evenly in time, so the same loop run easy and run
hard has the same shape, and a two-minute wait at a crossing does not put a dozen points
on one spot — as offsets in metres from the start. Two sessions are the same route when
they are the same sport, within 15 % of each other's length, and stay within a tolerance
of the same line; the tolerance scales with the route between 60 m and 250 m, because a
2 % wander is what a phone's fix and a different side of the road amount to. The
comparison is tried in both directions, so an out-and-back run the other way is the same
route. Sixty-four numbers per activity is small enough to hold for the whole log, so a
season groups itself in milliseconds without touching a sample stream.

## Grade-adjusted pace

A hilly run and a flat one were compared as though they were the same effort. Elevation
was recorded and never used for it.

Each activity now also stores a **flat-equivalent distance**: what the run would have
measured on the level for the same energetic cost, from Minetti's measured
cost-of-transport curve — a 10 % climb costs roughly 1.66 times the level, a gentle
descent slightly less, a steep one more again because braking is work too. Gradients are
read over stretches of at least 25 m, because a metre of altitude noise between two fixes
four metres apart is a 25 % gradient the ground never had. GAP appears on a session's
splits, in a comparison's metrics, and per repeat on a route.

## What a day is

A day is the epoch millisecond its **local** midnight falls on, and days are stepped by
calendar arithmetic rather than by adding 86 400 000. Both matter, and neither is
theoretical: keyed off the UTC date, an evening session lands on tomorrow east of
Greenwich and this morning's on yesterday west of it, and stepped by a fixed number of
milliseconds, the day the clocks change is 23 or 25 hours long and the walk misses it.
Either one silently shortens a streak — the first for anyone outside UTC, the second for
everyone in a DST country, twice a year.

## Sample history

A first launch has nothing to analyse, so the Overview empty state offers *Load 13 weeks
of sample history*. It generates synthetic activities (marked `demo: true`) with
realistic paces, power and heart rate so the aggregate screens can be evaluated. It is
never seeded automatically, and recording your own activities appends to whatever is
there.
