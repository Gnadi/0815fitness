# Pivot Contour from PWA to a native Android app

## Context

Contour records runs and rides with `navigator.geolocation.watchPosition`. A browser only
delivers positions to a page that is **on screen**. Pocket the phone, lock it, or switch
apps mid-ride and the track stops — a 4 km ride comes back as two fixes twenty minutes
apart and a straight line across the city.

This is not a bug in the recorder. It is the platform. `README.md:220` already concedes it:

> There is no way around this on the web. The Geolocation API is exposed to `Window` only,
> never to a service worker… Installing to the home screen changes nothing — a standalone
> PWA is still a page, and it is suspended like one. The screen wake lock is the whole
> mitigation.

Two engineering cycles have already gone into this (`9e5c67e`, `9714393`) and both were
mitigation, not fix: keep uncertain fixes instead of discarding them, draw gaps as dashed
guesses, warn at pre-start, warn again mid-session. The app got very good at *confessing*
to a defect it cannot repair. The wake lock — the entire mitigation — is refused by Chrome
under battery saver, which is exactly what someone enables before a long ride.

**The pivot buys one capability: an Android foreground service that keeps receiving GPS
with the screen off.** That is the whole point. Everything else is carried across intact.

**Decisions taken:** Capacitor shell (keep the React app); Android-only, drop the shipped
PWA; distribute as a signed APK via GitHub Releases (no Play Console).

### Why the shell, and not a rewrite

The platform-coupled surface is tiny. Of ~12,350 lines of TS/TSX, browser-only code is:

| Surface | Where | Fate |
|---|---|---|
| Recording GPS watch | `src/hooks/useRecorder.ts:44-63` | replaced by native |
| Pre-start GPS watch | `src/hooks/useGpsFix.ts:29-51` | replaced by native |
| Screen wake lock | `src/hooks/useWakeLock.ts` (whole file) | deleted |
| Web Bluetooth transport | `src/lib/ble.ts:87-126` (`connectBleSensor`) | one function rewritten |
| Blob download | `src/lib/backup.ts:235-240` (`downloadFile`) | one function rewritten |
| Service worker / manifest | `src/lib/pwa.ts`, `src/sw.js`, `vite.config.ts:26-79` | deleted |

Everything else — `stats.ts` (630), `derived.ts` (475), `compare.ts` (504),
`statDetails.ts` (444), `routes.ts`, `tiles.ts`, `units.ts`, all 12 screens, `charts.tsx`
(466 lines of hand-rolled SVG), `TileMap.tsx`, and the whole IndexedDB layer — is
platform-agnostic and moves unchanged. IndexedDB works in the WebView and, unlike a
browser, is never evicted.

Crucially, `src/lib/ble.ts` **already** separates the pure GATT parsers (`parseHeartRate`,
`parseCyclingPower`, `parseCscCrank`, `parseRsc`, `makeCadenceTracker`) from the transport.
Only the transport is Web Bluetooth. The parsers and their tests survive untouched.

---

## Phase 0 — Native shell

1. `npm i @capacitor/core @capacitor/android && npm i -D @capacitor/cli`
2. `npx cap init Contour app.contour --web-dir dist`
3. `capacitor.config.ts`: `webDir: 'dist'`, `server.androidScheme: 'https'`,
   `android.backgroundColor: '#0B0C0D'` (matches `index.html`'s theme-color).
4. `npx cap add android` — creates `/android`, committed to the repo.
5. Launcher icons from the existing `public/icon-512.png` / `icon-maskable-512.png`
   into `android/app/src/main/res/mipmap-*`. `scripts/icons.mjs` already reasons about
   Android's 80% maskable safe zone, so reuse it.

**Retire the PWA shipping surface** — not the dev server. Vite still builds the bundle
Capacitor loads, and `npm run dev` stays as the fast iteration loop.

- Delete `src/sw.js`, `public/manifest.webmanifest`, `src/lib/pwa.ts`, `scripts/pwa-check.mjs`.
- Remove the `contourServiceWorker` plugin from `vite.config.ts:26-79`.
- Strip `registerServiceWorker()` / `requestPersistentStorage()` from `src/main.tsx:26-27`.
- Drop the `pwa` npm script; remove PWA meta from `index.html` but **keep**
  `viewport-fit=cover` — every screen pads with `env(safe-area-inset-*)`.
- Remove the storage-persistence readout from `src/lib/db.ts:171-183` or hard-code it
  as persistent; app-private storage is not evictable.

---

## Phase 1 — Background location *(the entire point of the pivot)*

Use **`@capacitor-community/background-geolocation`** (MIT). It runs a Kotlin foreground
service with an ongoing notification and `FusedLocationProviderClient`, which is precisely
the missing capability. Do not write a custom plugin first — escalate to one only if
Phase 1 field testing shows dropped fixes (see *Escalation* below).

**The permission trick that matters:** start the service from the Record button, while the
app is in the foreground, with `foregroundServiceType="location"`. A while-in-use
foreground service does **not** require `ACCESS_BACKGROUND_LOCATION`. Requesting that
permission is what triggers Google's background-location review; we skip it entirely.

Rewrite the watch in `src/hooks/useRecorder.ts:41-64`. The mapping into the recorder is
unchanged — same `GeoSample` shape, same call:

```ts
const watcher = await BackgroundGeolocation.addWatcher(
  {
    backgroundMessage: 'Recording your session',   // makes the service a foreground one
    backgroundTitle: 'Contour',
    requestPermissions: true,
    stale: false,
    distanceFilter: 0,
  },
  (location, error) => {
    if (error || !location) return;               // same posture as today's no-op handler
    recorder.addGeoSample({
      t: location.time ?? Date.now(),
      lat: location.latitude,
      lon: location.longitude,
      ele: location.altitude ?? undefined,
      accuracy: location.accuracy,
    });
  },
);
```

Do the same in `src/hooks/useGpsFix.ts` for the pre-start fix-quality watch — but there,
*without* `backgroundMessage`, so standing on the pre-start screen does not post a
notification. `LOCK_ACCURACY_M = 20` and `fixStrengthFromAccuracy` (`geo.ts:33-45`) stay.

Delete the `visibilitychange` track-loss block in `useRecorder.ts:76-94` and the
`trackLossS` / `dismissTrackLoss` values it returns. Keep the 5 s checkpoint interval —
crash recovery is still worth having.

**Escalation, only if needed:** if a real ride shows gaps, the cause is Android throttling
WebView JS timers even while the process lives. The fix is a thin Kotlin plugin that
buffers fixes in the service and exposes `drain(sinceT)`, which JS calls on resume and
feeds through `addGeoSamples()` (Phase 2). Phase 2 is written so this is a drop-in.

---

## Phase 2 — Make the recorder safe under late and batched fixes

`src/lib/recorder.ts` assumes fixes arrive live, one at a time. Once they come from a
service the app was not watching, two assumptions break.

1. **Auto-pause runs on the wall clock.** `evaluateAutoPause` (`recorder.ts:243-262`) uses
   `this.now()` for `belowThresholdSinceT`, so replaying a backlog in milliseconds
   mis-fires the 8 s threshold. Pass the sample's own timestamp:
   `evaluateAutoPause(speed, sample.t)` from `recorder.ts:236`, and use that parameter
   in place of `this.now()`. `AUTO_PAUSE_AFTER_S` then measures recorded time, which is
   what it always meant.

2. **No batch path.** Add `addGeoSamples(samples: GeoSample[])` that ingests in timestamp
   order and calls `sampled()`/`emit()` **once**. Per-sample emit on a drain of thousands
   of fixes would be thousands of React renders.

3. **`restore()` banks the whole gap as paused time** (`recorder.ts:346-370`) — correct for
   a crash, wrong when the service kept recording. Add
   `restore(cp, { resumeRecording = false })`: when the foreground service is still alive
   at launch, come back as `'recording'` with `pausedAccumS` unchanged, then drain the
   service's fixes. The existing paused behaviour stays the default for a true crash.

4. **Flagged, adjacent:** `MAX_PLAUSIBLE_SPEED_MPS = 14` (`recorder.ts:11`) is ~50 km/h, so
   any bike descent above that silently loses distance. It also appears in `derived.ts:94`,
   `:236`, `:388`. Native GPS reports genuine descent speeds where the browser rarely did,
   so this will start biting. Raise to ~25 m/s (90 km/h). Small fix, real under-reporting.

---

## Phase 3 — Delete the apology

The visible payoff, and the part that is easy to forget. The app is currently full of copy
explaining a limitation that no longer exists. Leaving it in would be worse than the bug.

- **Delete** `src/hooks/useWakeLock.ts` and every call site. The foreground service replaces
  it; the screen no longer has to stay on.
- `src/screens/PreStart.tsx:196-220` — remove all three wake-lock warning variants
  ("Turn battery saver off, or expect the map to join the gaps with straight lines",
  "Keep this screen open…"). Replace with a location-permission and
  battery-optimisation-exemption check (Phase 6).
- `src/screens/RecordingSession.tsx:156-164` — remove the
  `NO FIXES FOR {n} · APP WAS IN THE BACKGROUND` banner and
  "Keep this screen open and the track continues." A gap now means a tunnel or an urban
  canyon, so keep a banner but re-cause it.
- `src/screens/ActivityDetail.tsx:187-197` — rewrite the gap explanation for the same reason.
- `README.md:187-226` — rewrite the section titled *"What the app does not know about your
  route"*, including the "no way around this on the web" paragraph.

**Keep the data model exactly as it is.** `TrackQuality` (`types.ts:98-114`),
`trackQuality()` (`derived.ts:338-376`), `TRACK_GAP_S = 20`, the recorded/inferred path
split in `tiles.ts:124-182` and the dashed rendering in `TileMap.tsx:99-114` are all still
correct — a tunnel is a genuine gap. Only the *explanation* changes. `DERIVED_VERSION`
does not move, so no history is re-derived.

Also keep the three-tier accuracy policy (`TRUSTED_ACCURACY_M = 50`,
`KEEP_ACCURACY_M = 200`, `earnsDistance` at `recorder.ts:230`). Fused location still
returns coarse fixes indoors and at cold start.

---

## Phase 4 — BLE port *(mandatory, not optional)*

**Web Bluetooth does not exist in Android System WebView.** `isBluetoothSupported()`
(`ble.ts:15`) returns `false` forever inside Capacitor, so HR, power and cadence would go
permanently dead on day one of the pivot. This ships with Phase 1 or the app regresses.

Install `@capacitor-community/bluetooth-le`. Rewrite exactly two functions in `src/lib/ble.ts`:

- `isBluetoothSupported()` → `BleClient.initialize()` + `isEnabled()`.
- `connectBleSensor()` (`ble.ts:87-126`) → `requestDevice({ services: [uuid] })` → `connect`
  → `startNotifications(deviceId, service, characteristic, cb)`. The callback hands back a
  `DataView`, the same type `opts.onValue` already takes, so the `searching`/`connected`/
  `absent` state machine and the `BleSensorHandle` contract are preserved verbatim.

Add a `uuid16(n: number)` helper — the plugin wants 128-bit strings
(`0x180d` → `0000180d-0000-1000-8000-00805f9b34fb`) where `GATT` (`ble.ts:7-12`) holds
16-bit numbers. Keep `GATT` as the single source of truth.

Untouched: all five parsers, `makeCadenceTracker`, `src/hooks/useBleSensors.ts` (the
`BleSensorApi` interface is unchanged), and every screen that consumes them.

Because the foreground service keeps the process alive, BLE notifications now continue with
the screen off too — HR data through a whole ride, which the PWA also could not do.

---

## Phase 5 — Export and import

`downloadFile()` (`src/lib/backup.ts:235-240`) uses `URL.createObjectURL` + a synthetic
anchor click. That is inert in a WebView, which silently breaks the *only* way data leaves
the device — and `README.md:263` calls that out as the answer to a lost phone.

Rewrite it with `@capacitor/filesystem` (`writeFile` to `Directory.Cache`) +
`@capacitor/share` (`share({ url: uri })`), so JSON backups and GPX exports land in the
Android share sheet. `exportLog`, `exportGpx`, `parseGpx` and the whole
`format: 'contour-log'` schema are unchanged.

Import uses `<input type="file">`, which does work in Android WebView — verify it against a
real watch GPX rather than assuming.

---

## Phase 6 — Android integration

- **Back button.** `src/hooks/useNavStack.ts` drives `history.pushState`/`popstate`, and
  Android's back gesture maps onto WebView history, so the screen stack keeps working. But
  at the root it must not close the app mid-session. Add a `@capacitor/app` `backButton`
  listener that honours `holdsItsScreen` (`App.tsx:54`) and otherwise calls
  `App.minimizeApp()` at index 0.
- **System bars.** `@capacitor/status-bar` set to `#0B0C0D`, dark content. Safe-area padding
  already exists throughout.
- **Battery optimisation.** OEM killers (Xiaomi, Samsung, OnePlus) will stop even a
  foreground service. Surface a one-time prompt on PreStart pointing at
  `REQUEST_IGNORE_BATTERY_OPTIMIZATIONS` — this is the honest replacement for the wake-lock
  warning being deleted in Phase 3.
- **Record shortcut.** The manifest's `/?screen=record` shortcut is read at `App.tsx:119-127`.
  Port to `android/app/src/main/res/xml/shortcuts.xml` with an intent extra, and read it via
  `@capacitor/app` `getLaunchUrl()` so `App.tsx` needs only a small change.
- **Keep screen on** becomes an optional Setting (`android:keepScreenOn`), no longer
  load-bearing.

### Manifest permissions

```
ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION
FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION   (API 34+)
POST_NOTIFICATIONS                                 (API 33+)
BLUETOOTH_SCAN (neverForLocation), BLUETOOTH_CONNECT  (API 31+)
INTERNET                                           (OSM tiles)
```

**Deliberately absent: `ACCESS_BACKGROUND_LOCATION`.** Not needed for a
foreground-started while-in-use service, and adding it would invite a Play review we have
no reason to sit through. Record this as a decision in the README so nobody adds it later.

---

## Phase 7 — Build and release

There is **no CI in this repo at all** — no `.github/`. Add one workflow,
`.github/workflows/android.yml`, doing both jobs:

1. `npm ci` → `npm run lint` (oxlint) → `npm test` (vitest) → `npm run build`
2. `npx cap sync android` → `./gradlew assembleRelease`
3. Sign with a keystore held as a base64 repo secret (`ANDROID_KEYSTORE_B64`,
   `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS`), generated locally and **never**
   committed.
4. `versionCode` from `github.run_number`; attach the APK to a GitHub Release on tag.

Add `.gitignore` entries for `android/app/build/`, `android/.gradle/`, `*.keystore`,
`android/local.properties`. Keep `/android` itself committed — the Kotlin config is real
source.

---

## Verification

### Automated
- The 8 existing `src/lib/*.test.ts` suites must stay green. They run in `environment: 'node'`
  against pure logic, so they are the regression net for the Phase 2 recorder surgery —
  `recorder.test.ts` and `derived.test.ts` in particular.
- **New tests in `src/lib/recorder.test.ts`:** a batched `addGeoSamples` drain preserves
  distance and ascent identically to the same fixes fed one at a time; auto-pause fires off
  sample timestamps not wall clock; `restore(cp, { resumeRecording: true })` returns
  `'recording'` without inflating `pausedAccumS`.
- `scripts/smoke.mjs` (Playwright + `setGeolocation`, 40 synthetic fixes) currently runs
  against `npm run preview`. Retarget it to `npm run dev` so it survives the PWA removal —
  it still exercises the recording flow's logic, just not the native layer.

### Manual — the test that actually decides whether the pivot worked

Nothing above proves the fix. This does:

1. Start a run. **Lock the phone, pocket it, walk 20 minutes.**
2. Expect: a continuous track. `TrackQuality.coverage` ≈ 1.0, `longestGapS` < 20, `gaps` = 0,
   and **zero dashed inferred segments** on the detail map. That is the exact scenario that
   produced "two points and a straight line across the city".
3. Repeat with **battery saver ON** — the case that defeats the wake lock today, and the
   reason the pre-start warning exists.
4. Repeat while switching to another app for 5 minutes.
5. Wear an HR strap for all of the above; confirm the `hr` stream has no matching hole.
6. Kill the app from the recents switcher mid-session and relaunch — confirm the recovery
   card and that the service's fixes are drained rather than banked as paused time.
7. Export a session as GPX through the share sheet and re-import it.

---

## Sequencing

Phases 0, 1, 2 and 4 ship together as the first working APK — Phase 4 is not deferrable
without regressing sensors, and Phase 2 is what makes Phase 1 correct. Phase 3 follows
immediately once step 2 of the manual test passes, because the copy is only wrong once the
fix is real. Phases 5–7 are independent and can land in any order after that.

Rough effort: 2–3 weeks. Phase 1 is a day or two; the long poles are the BLE port and
field-testing across battery-saver and OEM power management.
