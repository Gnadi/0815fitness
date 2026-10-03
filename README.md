# Karriere-Simulator

Textbasierter Fußball-Karriere-Simulator als mobile PWA (React + Vite + TypeScript, nur Deutsch).
Du startest mit 16 in der U19 eines echten Vereins aus einem der 55 UEFA-Länder und führst deinen Spieler
bis zum Karriereende: Training, Spiele mit Schlüsselszenen, Vereinswechsel, Kabine, Privatleben, Medien,
Wetten, Doping, Steuertricks – inklusive der Möglichkeit, damit durchzukommen.

Konzept, Regeln und Architektur: [docs/KONZEPT.md](docs/KONZEPT.md).

```bash
npm install
npm run dev        # Entwicklungsserver
npm test           # Unit-Tests, Welt-Checks und Fuzzing (Vitest)
npm run build      # Typecheck + Produktions-Build inkl. PWA
```

Alle Daten liegen im Browser (localStorage). Spielstände lassen sich im Hauptmenü als JSON exportieren/importieren.
