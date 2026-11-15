#!/usr/bin/env bash
# Schneidet die Schriften auf das zu, was die Seite braucht (einmalig ausführen, Ergebnis liegt in src/fonts).
# Voraussetzung: pip install fonttools brotli; npm install -D @fontsource-variable/newsreader @fontsource-variable/shantell-sans
set -euo pipefail
QUELLE=node_modules/@fontsource-variable
ZIEL=src/fonts
TMP=$(mktemp -d)
ZEICHEN="U+0020-007E,U+00A0-00FF,U+2009,U+2013-2014,U+2018-201E,U+2022,U+2026,U+202F,U+20AC,U+2190-2193,U+21BB"
FEATURES="kern,liga,clig,calt,ccmp,locl,mark,mkmk,onum,lnum,tnum,pnum"

# Fließtext: optische Größe 16; Titel: optische Größe 72 und nur Gewicht 500 (große Überschrift)
python3 -m fontTools.varLib.instancer "$QUELLE/newsreader/files/newsreader-latin-opsz-normal.woff2" wght=400:700 opsz=16 -o "$TMP/nr.ttf" -q
python3 -m fontTools.varLib.instancer "$QUELLE/newsreader/files/newsreader-latin-opsz-normal.woff2" wght=500 opsz=72 -o "$TMP/nrt.ttf" -q
python3 -m fontTools.varLib.instancer "$QUELLE/newsreader/files/newsreader-latin-opsz-italic.woff2" wght=400:600 opsz=16 -o "$TMP/nri.ttf" -q
python3 -m fontTools.varLib.instancer "$QUELLE/shantell-sans/files/shantell-sans-latin-full-normal.woff2" INFM=100 BNCE=30 SPAC=0 wght=400:600 -o "$TMP/sh.ttf" -q

for n in nr:zettel-serif nrt:zettel-titel nri:zettel-serif-kursiv sh:zettel-hand; do
  python3 -m fontTools.subset "$TMP/${n%%:*}.ttf" --unicodes="$ZEICHEN" --layout-features="$FEATURES" \
    --flavor=woff2 --output-file="$ZIEL/${n##*:}.woff2"
done
rm -rf "$TMP"
ls -la "$ZIEL"
