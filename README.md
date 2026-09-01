# Contour

A single-user training log for running and cycling — records activities on the device
and analyses them in depth. No feed, no sharing, no upsell. Built from a Claude Design
handoff (`Contour Capture.dc.html`) and its accompanying design system brief, which
define the dark-only palette, the mono numeral type scale and every screen here.

An Android app: React + TypeScript + Vite inside a Capacitor shell. Everything is stored
on the device and there is no backend, no account and no network except an optional
basemap. Recording continues with the screen off — see **Recording in the background**,
which is the reason the app is native at all.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173 — the screens, in a desktop browser
npm run build      # typecheck + production build
npm run lint
npm run test       # vitest over the pure logic
npm run smoke      # drives the app in Chromium with a simulated GPS track
npm run icons      # re-renders the launcher icons from public/logo.svg

npm run sync       # build, then copy the web build into the Android project
npm run android    # sync, then open it in Android Studio
```

`npm run smoke` needs `npm run dev` running (or `BASE_URL` set) and writes screenshots to
`scripts/shots/`.

**What the desktop browser is and is not for.** `npm run dev` renders every screen and
runs the whole recorder, against a `navigator.geolocation` stand-in in
`src/lib/location.ts` — a development affordance, unreachable from the APK. It is how to
work on a chart without a phone. It cannot exercise the foreground service, the straps,
or the share sheet, and neither can the smoke run: those are verified on a phone, by
walking around with it.

### Building the APK

```bash
cd android && ./gradlew assembleRelease
```

Signing comes from `android/keystore.properties`, which is gitignored — copy
`keystore.properties.example` and follow the `keytool` line in it. Without it the build
still succeeds and produces an unsigned APK, which will not install.

Keep the key. An APK signed with a different one installs as a different app, which means
uninstalling the old one, which means losing the log.

CI (`.github/workflows/android.yml`) runs lint, typecheck and tests on every push, then
assembles the APK; pushing a `v*` tag attaches a signed one to a GitHub release.
`versionCode` comes from the run number, because it has to rise for every build a phone
is asked to install over the last.

## Installing it

Build the APK and sideload it — there is no Play listing. The app is single-user by
design, and a store listing would mean a Play Console account, a data-safety declaration
and a privacy policy for an app that sends nothing anywhere.

- **Everything is in the APK.** The document, script, fonts and icons are loaded from the
  app's own assets, so there is no network on the path to a first paint and nothing to
  precache. The service worker that used to do that job is gone with the web build.
- **The log is app-private storage.** IndexedDB inside the WebView is not the evictable
  cache it was in a browser: it survives updates and reboots, and only an uninstall or a
  deliberate "clear data" removes it. Nothing asks to be spared any more.
- **Backup is switched off.** Android's auto-backup would copy a season of tracks to a
  Google account, which is the opposite of what this app promises. `Settings → Your data`
  is the way off the phone, and it is a file handed to the share sheet.
- **The launcher icon carries a Record shortcut**, which opens the app straight at
  pre-start with the fix already acquiring.

The mark in `public/logo.svg` is the app's own signature element — a recorded elevation
profile in straight segments over the contour intervals the name comes from — and the
launcher icons are rendered from it by `npm run icons`, scaled into the 72 dp safe square
so a round launcher shaves the margin rather than the ridge.

## Recording in the background

This is why the app is native.

A browser only delivers positions to a page that is on screen. Lock the phone or switch
apps mid-ride and `watchPosition` stops: a 4 km ride came back as two fixes twenty
minutes apart and a straight line across the city. There was no way around it. The
Geolocation API is exposed to `Window` only, never to a service worker; Chromium's
*Intent to implement: Background Geolocation for Progressive Web-Apps* was filed in 2016
and never shipped; installing to a home screen changed nothing, because a standalone PWA
is still a page and is suspended like one. Two rounds of work went into the problem and
both were mitigation — keep the coarse fixes, draw the gaps as guesses, warn before and
during — with a screen wake lock as the entire defence, and Chrome refuses one under
battery saver, which is exactly what someone turns on before a long ride.

What replaces it is an Android **location foreground service**. It holds a notification
for as long as it runs, and in exchange Android keeps delivering positions with the
screen off and the phone in a pocket. Because the service holds the process, the strap
keeps reporting too — heart rate now covers the whole ride rather than the parts that
were looked at.

Three decisions in it are worth knowing:

- **The service starts from the Record button, with the app on screen**, which makes it a
  *while in use* service. That is why the app does not request
  `ACCESS_BACKGROUND_LOCATION`: a foreground-started location service does not need it,
  and requesting it is what puts an app in front of Google's background-location
  reviewers. There is a note in `AndroidManifest.xml` for whoever is tempted.
- **Fixes are taken in runs, and carry the time they were produced.** Android throttles a
  WebView's JavaScript while the app is off screen, so a pocketed stretch can arrive as a
  burst on return. `Recorder.addGeoSamples` orders it, drops what it already has, and
  renders once; every time decision in ingestion — the auto-pause clock, the kilometre
  markers — reads the fix's own timestamp rather than the wall clock, so a replayed
  stretch reaches the verdict it would have reached live.
- **Battery optimisation is the one thing left that can stop a ride.** Stock Android
  exempts a location foreground service from Doze; several manufacturers ship a layer
  above it that does not, and will stop a recording within minutes of the screen going
  off. Pre-start checks, says so, and offers the exemption once
  (`BatteryOptimizationPlugin`). It is the honest replacement for the wake-lock warning.

## What the app still cannot know about your route

A gap in a track is no longer the app's fault, but gaps still happen: a tunnel, a deep
valley, a street of towers. The receiver loses the sky and there is nothing to record.
So the distinction the app has always drawn — between what it recorded and what it
inferred — stays exactly as it was, and only the explanation changed.

- **An uncertain fix is kept, not discarded.** Accuracy decides whether a fix is trusted
  with *distance*, not whether it is recorded at all — a fix good to eighty metres still
  says which road you were on. Below 50 m it counts normally; between 50 m and 200 m it
  is drawn but only earns distance for movement larger than its own error, so a phone
  drifting inside its accuracy circle does not ride kilometres; past 200 m it is noise.
- **Stretches with no fixes are drawn as the guess they are** — thin, dashed and dimmed,
  with the recorded track lifting its pen across them. The distance across one is the
  straight line, so it reads short.
- **The session says so.** `TrackQuality` carries the fix count, the longest gap, how
  many there were and what share of the elapsed time the fixes actually cover.
- **And it says it during the session**, counting up live, naming a tunnel rather than
  asking for something the person cannot do anything about while they are in one.

One number moved with the pivot. The plausible-speed ceiling was 14 m/s — 50 km/h —
which a browser rarely met, because a pocketed phone was not reporting on the descent
anyway. A service that reports the whole way down would have had the app quietly discard
the fastest kilometres of every ride, so it is 25 m/s now.

## What's real

The prototype simulated its sensor data. This implementation reads the actual hardware:

| Screen data | Source |
| --- | --- |
| Distance, pace, speed, elevation, route | Android location foreground service (fused provider, 1 Hz, high accuracy), haversine over accepted fixes |
| GPS fix state and accuracy | The reported accuracy of each fix |
| Heart rate | Native BLE, Heart Rate Service `0x180D` / measurement `0x2A37` |
| Cycling power | Native BLE, Cycling Power `0x1818` / `0x2A63` |
| Bike cadence | Native BLE, CSC `0x1816` / `0x2A5B`, RPM derived from crank revolutions |
| Running cadence | Native BLE, RSC `0x1814` / `0x2A53` |
| Week volume, streak, load ratio, zones, PBs, power curve, decoupling | Computed from stored activities in `src/lib/stats.ts` |
| Training stress, normalised power, grade-adjusted pace, cadence distribution | Derived per activity in `src/lib/derived.ts`, aggregated in `src/lib/stats.ts` |
| Route repeats | Track shape matching in `src/lib/routes.ts` |
| Stat details behind each Overview figure | Twelve-week rollups in `src/lib/statDetails.ts` |
| Session comparison: metrics, pace/elevation/HR overlays, splits | Per-second traces off the recorded track in `src/lib/compare.ts` |

Two honest deviations from the prototype's copy:

- **No satellite count.** The platform does not expose one, so the pre-start card shows
  real accuracy in metres and derives the signal bars from it (`fixStrengthFromAccuracy`).
- **The recording map draws no tiles.** It renders the actual recorded track in the
  prototype's line-and-terrain style. A saved session's map can show an OpenStreetMap
  basemap under the track — see **The basemap** below — but recording never fetches
  anything, because that is the screen used where there is no signal.

## Platform

- **Android 7.0 (API 24) and up**, compiled against API 36.
- **Permissions asked for:** fine and coarse location, the foreground service and its
  location type, notifications, and Bluetooth scan/connect. Scanning is asserted
  `neverForLocation` — the app has GPS and never infers a position from a strap.
  `ACCESS_BACKGROUND_LOCATION` is deliberately not among them; see **Recording in the
  background**.
- **Refusing anything degrades rather than blocks.** Without location the session still
  records time and sensors and says why; without a strap the heart-rate field shows its
  designed absent state rather than a lock.
- **iOS is not built, but is not ruled out.** Capacitor and both plugins support it, and
  nothing above `src/lib/location.ts` and `src/lib/ble.ts` knows which platform it is on.

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
    location.ts     the location foreground service — the one seam onto the platform
    power.ts        whether Android will leave a running recording alone
    shell.ts        system bars, the back gesture, the launcher's Record shortcut
  hooks/            useGpsFix, useRecorder, useBleSensors, useNavStack,
                    useUnits / UnitsProvider
  components/       AppShell, primitives, ActivityRow, ActivityCard, charts, TileMap
  screens/          Overview, Activities, ActivityDetail, ManualEntry, Settings,
                    Analyse (load/zones/records/routes/plan), RouteDetail, StatDetail,
                    Compare, PreStart, RecordingSession, Save
public/
  logo.svg          the Contour mark, and the source the launcher icons come from
android/
  app/src/main/AndroidManifest.xml    permissions, and the note on the one not asked for
  app/src/main/java/app/contour/      MainActivity, BatteryOptimizationPlugin
  app/src/main/res/                   launcher icons, dark theme, the Record shortcut
  keystore.properties.example         how to sign a release
```

Only three files under `src/` know they are on Android: `location.ts`, `ble.ts` and
`shell.ts`. Everything else — every screen, every chart, the whole analysis layer —
is the same code that ran in a browser, which is why the pivot was a shell rather than
a rewrite.

## Getting back

The app is one document, so the browser only knows the history entries it is given.
`useNavStack` gives it one per screen the app opens: back — the button, the gesture or
the hardware key — pops the app's own stack, so a stat detail returns to the Overview
and a comparison opened from a detail returns to that detail. The in-app back buttons
go through the same history, so the two never drift apart. Recording and Save are the
exception: they are steps of one session with no way out but FINISH or DISCARD, so they
replace rather than stack and hold their position against a back press.

## Reading a figure, comparing two sessions

The Overview is the log's front page rather than its dashboard: the week in one strip,
then the last eight sessions as cards — what each one was, when it was, its distance,
time and pace or power, over its own elevation profile. Everything that goes deeper is
one screen away.

Every figure still opens its own detail. The week strip carries run, ride, time,
sessions and the streak; the load, volume and ascent windows hang off *Analyse → Load*,
where the charts they belong to already are. Each detail shows the figure in its window,
the twelve weeks behind it, a table of the last eight, and the sessions that add up to
it — plus a note on how it is computed, because a number nobody can account for is not
worth showing.

Two or three sessions of the same sport can be read side by side, from the Overview's
*Compare*, from any session row or card, or from a stat detail's contributors. The first
one picked is the reference every difference is measured against. *Compare with another
session* on a saved session opens the picker with that session held as the reference —
which one it is read against is a choice, not a guess the app makes. The comparison puts them
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
- **They are the only network the app does.** Everything else is in the APK or in the
  database, so switching the basemap off leaves an app that never opens a socket.
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

The database is the only copy, and an uninstall takes it. Settings → *Your data* exports every session — full track and sensor
streams, plus the settings — as one JSON file, and reads one back; a single session
exports as GPX 1.1 with Garmin's TrackPointExtension, which is what every other training
tool reads heart rate, cadence and power out of. GPX comes back in too, so a file from a
watch can be added to the log. Imports merge rather than replace, so a backup restored
onto a phone that has also been recording loses nothing.

Nothing is sent anywhere. The export is written to the app's cache and handed to the
Android share sheet, which is where the person decides whether it goes to a drive, a mail
draft or a cable. The blob-and-anchor download this used to do is ignored by a WebView
without complaining, so it would have been a button that silently did nothing.

## When a recording is interrupted

A session in progress used to live only in memory, so a crash two hours into a long ride
took the whole thing — the one
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
