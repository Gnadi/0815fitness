# Contour

A single-user training log for running and cycling — records activities on the device
and analyses them in depth. No feed, no sharing, no upsell. Built from a Claude Design
handoff (`Contour Capture.dc.html`) and its accompanying design system brief, which
define the dark-only palette, the mono numeral type scale and every screen here.

React + TypeScript + Vite. Everything is stored locally; there is no backend.

## Running it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + production build
npm run smoke      # drives the built app in Chromium with a simulated GPS track
```

`npm run smoke` needs `npm run preview` running on port 4173 (or `BASE_URL` set), and
writes screenshots to `scripts/shots/`.

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
    storage.ts      localStorage persistence
    demoSeed.ts     synthetic sample history behind the empty-state action
  hooks/            useGpsFix, useRecorder, useBleSensors, useWakeLock
  components/       PhoneFrame, primitives (DataField, SensorChip, silhouette), charts
  screens/          Overview, Analyse (load/zones/records/plan), PreStart, RecordingSession, Save
```

## Scope

This build covers the screens in the handed-off design: Overview, Analyse (Load, Zones,
Records, Plan), Pre-start, Recording (live, auto-paused, paused, screen-locked, ride
without a power meter) and Save. Screens 4–8 of the original brief — activity list, run
and ride detail, trends, route repeats — were not part of this design file and are not
built.

## Sample history

A first launch has nothing to analyse, so the Overview empty state offers *Load 13 weeks
of sample history*. It generates synthetic activities (marked `demo: true`) with
realistic paces, power and heart rate so the aggregate screens can be evaluated. It is
never seeded automatically, and recording your own activities appends to whatever is
there.
