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
  activity is in `localStorage` — so offline is the same app, not a degraded one.
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
| Stat details behind each Overview figure | Twelve-week rollups in `src/lib/statDetails.ts` |
| Session comparison: metrics, pace/elevation/HR overlays, splits | Per-second traces off the recorded track in `src/lib/compare.ts` |

Two honest deviations from the prototype's copy:

- **No satellite count.** No web API exposes one, so the pre-start card shows real
  accuracy in metres and derives the signal bars from it (`fixStrengthFromAccuracy`).
- **No map tiles.** The recording map draws the actual recorded track rather than
  loading a third-party basemap, in the prototype's line-and-terrain style.

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
  types.ts          Activity / samples / laps / settings
  lib/
    geo.ts          haversine, ascent, track projection, route silhouettes
    recorder.ts     recording state machine: distance, laps, auto-pause, elapsed
    ble.ts          GATT parsing + connection for HR, power, CSC, RSC
    stats.ts        weekly rollups, streaks, load balance, zones, PBs, power curve
    statDetails.ts  the model behind each Overview figure's detail screen
    compare.ts      per-second traces, distance-axis series, splits, metric rows
    storage.ts      localStorage persistence
    demoSeed.ts     synthetic sample history behind the empty-state action
    pwa.ts          service-worker registration and the persistent-storage request
  hooks/            useGpsFix, useRecorder, useBleSensors, useWakeLock, useNavStack
  components/       PhoneFrame, primitives (DataField, SensorChip, silhouette), charts
  screens/          Overview, Analyse (load/zones/records/plan), StatDetail, Compare,
                    PreStart, RecordingSession, Save
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

## Scope

This build covers the screens in the handed-off design: Overview, Analyse (Load, Zones,
Records, Plan), Pre-start, Recording (live, auto-paused, paused, screen-locked, ride
without a power meter) and Save, plus the stat details and the session comparison above.
Screens 4–8 of the original brief — activity list, single-activity detail, trends, route
repeats — were not part of that design file; the comparison covers what two sessions
read like together rather than what one reads like alone.

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
