export type Kategorie = 'gebaeck' | 'brot' | 'suesses'

export interface Produkt {
  id: string
  name: string
  beschreibung: string
  preis: number // Euro
  kategorie: Kategorie
  emoji: string
  farbe: string // Hintergrund der Kachel
  hinweis?: string
}

export const KATEGORIEN: { id: Kategorie | 'alle'; label: string }[] = [
  { id: 'alle', label: 'Alles' },
  { id: 'gebaeck', label: 'Gebäck' },
  { id: 'brot', label: 'Brot' },
  { id: 'suesses', label: 'Süßes' },
]

export const PRODUKTE: Produkt[] = [
  { id: 'semmel', name: 'Kaisersemmel', beschreibung: 'Handgeschlagen, resch und luftig.', preis: 0.6, kategorie: 'gebaeck', emoji: '🥯', farbe: '#f3dcb8' },
  { id: 'brezel', name: 'Laugenbrezel', beschreibung: 'Mit grobem Salz, außen knusprig.', preis: 1.2, kategorie: 'gebaeck', emoji: '🥨', farbe: '#e8c7a0' },
  { id: 'dinkel', name: 'Dinkelweckerl', beschreibung: '100 % Dinkel, mit Sonnenblumenkernen.', preis: 0.9, kategorie: 'gebaeck', emoji: '🌾', farbe: '#eadfc2', hinweis: 'Vollkorn' },
  { id: 'mohnflesserl', name: 'Mohnflesserl', beschreibung: 'Geflochten und dick mit Mohn bestreut.', preis: 0.95, kategorie: 'gebaeck', emoji: '🥖', farbe: '#e6d7c3' },
  { id: 'koerndl', name: 'Körndlweckerl', beschreibung: 'Roggen, Leinsamen, Kürbiskerne.', preis: 1.1, kategorie: 'gebaeck', emoji: '🌻', farbe: '#e9d9b0' },
  { id: 'croissant', name: 'Buttercroissant', beschreibung: '27 Schichten, echte Butter.', preis: 1.6, kategorie: 'gebaeck', emoji: '🥐', farbe: '#f5d6a4' },
  { id: 'bauernbrot', name: 'Bauernbrot', beschreibung: 'Roggensauerteig, 36 h Teigführung. 750 g.', preis: 4.9, kategorie: 'brot', emoji: '🍞', farbe: '#dcc0a0' },
  { id: 'dinkelbrot', name: 'Dinkel-Walnuss-Laib', beschreibung: 'Saftig, mit Walnüssen. 500 g.', preis: 5.4, kategorie: 'brot', emoji: '🌰', farbe: '#e4cfb5', hinweis: 'Vegan' },
  { id: 'zopf', name: 'Sonntagszopf', beschreibung: 'Butterzopf mit Hagelzucker. 400 g.', preis: 4.5, kategorie: 'brot', emoji: '🍯', farbe: '#f6e2b9', hinweis: 'Nur sonntags' },
  { id: 'linzer', name: 'Linzer Schnitte', beschreibung: 'Mürbteig, Ribiselmarmelade, Gitter obendrauf.', preis: 2.9, kategorie: 'suesses', emoji: '🍓', farbe: '#f0c9b8', hinweis: 'Hausklassiker' },
  { id: 'golatsche', name: 'Topfengolatsche', beschreibung: 'Blätterteig mit cremiger Topfenfülle.', preis: 2.3, kategorie: 'suesses', emoji: '🧈', farbe: '#f7e6c2' },
  { id: 'zimtschnecke', name: 'Zimtschnecke', beschreibung: 'Hefeteig, Zimt, brauner Zucker.', preis: 2.4, kategorie: 'suesses', emoji: '🌀', farbe: '#ebcfae' },
]

export const PRODUKT_NACH_ID: Record<string, Produkt> = Object.fromEntries(PRODUKTE.map((p) => [p.id, p]))

export const LIEFERGEBIET: { plz: string; ort: string }[] = [
  { plz: '4020', ort: 'Linz Innenstadt & Süd' },
  { plz: '4030', ort: 'Linz Ebelsberg / Pichling' },
  { plz: '4040', ort: 'Linz Urfahr' },
  { plz: '4060', ort: 'Leonding' },
]

export const ZEITFENSTER = ['07:00 – 07:30', '07:30 – 08:00', '08:00 – 08:30', '08:30 – 09:00', '09:00 – 09:30', '09:30 – 10:00']

export const LIEFERGEBUEHR = 2.5
export const GRATIS_AB = 20
