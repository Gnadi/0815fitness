export type GebaeckForm =
  | 'semmel' | 'dinkel' | 'brezel' | 'flesserl' | 'laib' | 'zopf' | 'linzer' | 'schnecke'

export interface Produkt {
  id: string
  name: string
  notiz: string // kurze Beschreibung, wie auf einem Zettel
  preis: number // Euro
  form: GebaeckForm
  kontingent: number // so viele passen pro Sonntag in den Ofen
  vergeben: number // Mockup: schon bestellt diese Woche
}

/** Bewusst klein: was ein Heimofen an einem Sonntagmorgen schafft. */
export const PRODUKTE: Produkt[] = [
  { id: 'semmel', name: 'Kaisersemmel', notiz: 'handgeschlagen, resch', preis: 0.6, form: 'semmel', kontingent: 160, vergeben: 94 },
  { id: 'dinkel', name: 'Dinkelweckerl', notiz: 'mit Sonnenblumenkernen', preis: 0.9, form: 'dinkel', kontingent: 80, vergeben: 41 },
  { id: 'brezel', name: 'Laugenbrezel', notiz: 'grobes Salz obendrauf', preis: 1.2, form: 'brezel', kontingent: 60, vergeben: 52 },
  { id: 'flesserl', name: 'Mohnflesserl', notiz: 'geflochten, dick Mohn', preis: 0.95, form: 'flesserl', kontingent: 60, vergeben: 23 },
  { id: 'bauernbrot', name: 'Bauernbrot', notiz: 'Roggensauerteig, 750 g', preis: 4.9, form: 'laib', kontingent: 20, vergeben: 13 },
  { id: 'zopf', name: 'Sonntagszopf', notiz: 'Butterzopf, Hagelzucker', preis: 4.5, form: 'zopf', kontingent: 14, vergeben: 11 },
  { id: 'linzer', name: 'Linzer Schnitte', notiz: 'Ribiselmarmelade, Gitter', preis: 2.9, form: 'linzer', kontingent: 30, vergeben: 17 },
  { id: 'zimt', name: 'Zimtschnecke', notiz: 'erst seit dieser Woche', preis: 2.4, form: 'schnecke', kontingent: 24, vergeben: 24 },
]

export const PRODUKT_NACH_ID: Record<string, Produkt> = Object.fromEntries(PRODUKTE.map((p) => [p.id, p]))

/** Platzhalter: die paar Gassen rund ums Haus, die das Rad am Sonntag abfährt. */
export const STRASSEN = ['Hauptstraße', 'Kirchengasse', 'Parkweg', 'Schulgasse', 'Am Bach']

export const ZEITFENSTER = ['7:00', '7:30', '8:00', '8:30', '9:00', '9:30']

export const LIEFERGEBUEHR = 2.5
export const GRATIS_AB = 20
export const SPENDE = 5

/** Höchstmenge pro Sonntag – mehr Sackerl schafft der Ofen zuhause nicht. */
export const KAPAZITAET = 45

/** Mockup: so viele Sackerl haben Nachbar:innen diese Woche schon spendiert. */
export const SCHON_SPENDIERT = 3

/** Mockup: die Bestellung „wie letzte Woche“ einer Stammkundin. */
export const LETZTE_WOCHE: Record<string, number> = { semmel: 4, bauernbrot: 1, linzer: 2 }

export const ARCHIV = [
  { nr: -1, notiz: 'Erster Frost. Die Zopf-Bleche waren um 6:40 leer.', sackerl: 41, neu: 'Sonntagszopf' },
  { nr: -2, notiz: 'Regen ab 8 Uhr – danke fürs Warten an der Tür!', sackerl: 38, neu: '' },
  { nr: -3, notiz: 'Kürbiskern-Weckerl als Gast. Kommt wieder.', sackerl: 35, neu: 'Kürbisweckerl' },
  { nr: -4, notiz: 'Neues Lastenrad. Die Kiste passt genau 30 Sackerl.', sackerl: 29, neu: '' },
]
