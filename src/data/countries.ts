/**
 * Alle 55 UEFA-Mitgliedsverbände. `welle` bestimmt, wann die Ligadaten (echte Vereine)
 * ergänzt werden – siehe docs/KONZEPT.md. Spielbar sind nur Länder mit `welle <= AKTIVE_WELLE`.
 */
export interface Country {
  id: string
  name: string
  flagge: string
  welle: 1 | 2 | 3
}

export const AKTIVE_WELLE = 3

const c = (id: string, name: string, flagge: string, welle: 1 | 2 | 3): Country => ({ id, name, flagge, welle })

export const COUNTRIES: readonly Country[] = [
  // Welle 1: DACH + Top-5-Ligen
  c('DE', 'Deutschland', '🇩🇪', 1),
  c('AT', 'Österreich', '🇦🇹', 1),
  c('CH', 'Schweiz', '🇨🇭', 1),
  c('EN', 'England', '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 1),
  c('ES', 'Spanien', '🇪🇸', 1),
  c('IT', 'Italien', '🇮🇹', 1),
  c('FR', 'Frankreich', '🇫🇷', 1),
  // Welle 2: weitere starke Ligen
  c('NL', 'Niederlande', '🇳🇱', 2),
  c('PT', 'Portugal', '🇵🇹', 2),
  c('BE', 'Belgien', '🇧🇪', 2),
  c('TR', 'Türkei', '🇹🇷', 2),
  c('SC', 'Schottland', '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 2),
  c('GR', 'Griechenland', '🇬🇷', 2),
  c('DK', 'Dänemark', '🇩🇰', 2),
  c('NO', 'Norwegen', '🇳🇴', 2),
  c('SE', 'Schweden', '🇸🇪', 2),
  c('PL', 'Polen', '🇵🇱', 2),
  c('CZ', 'Tschechien', '🇨🇿', 2),
  c('HR', 'Kroatien', '🇭🇷', 2),
  c('RS', 'Serbien', '🇷🇸', 2),
  c('UA', 'Ukraine', '🇺🇦', 2),
  c('RO', 'Rumänien', '🇷🇴', 2),
  c('HU', 'Ungarn', '🇭🇺', 2),
  c('IL', 'Israel', '🇮🇱', 2),
  // Welle 3: übrige UEFA-Verbände (nur 1. Liga)
  c('SK', 'Slowakei', '🇸🇰', 3),
  c('SI', 'Slowenien', '🇸🇮', 3),
  c('BG', 'Bulgarien', '🇧🇬', 3),
  c('CY', 'Zypern', '🇨🇾', 3),
  c('FI', 'Finnland', '🇫🇮', 3),
  c('IE', 'Irland', '🇮🇪', 3),
  c('IS', 'Island', '🇮🇸', 3),
  c('NI', 'Nordirland', '🇬🇧', 3),
  c('WA', 'Wales', '🏴󠁧󠁢󠁷󠁬󠁳󠁿', 3),
  c('BA', 'Bosnien-Herzegowina', '🇧🇦', 3),
  c('AL', 'Albanien', '🇦🇱', 3),
  c('MK', 'Nordmazedonien', '🇲🇰', 3),
  c('ME', 'Montenegro', '🇲🇪', 3),
  c('XK', 'Kosovo', '🇽🇰', 3),
  c('AZ', 'Aserbaidschan', '🇦🇿', 3),
  c('AM', 'Armenien', '🇦🇲', 3),
  c('GE', 'Georgien', '🇬🇪', 3),
  c('KZ', 'Kasachstan', '🇰🇿', 3),
  c('BY', 'Belarus', '🇧🇾', 3),
  c('MD', 'Moldau', '🇲🇩', 3),
  c('LT', 'Litauen', '🇱🇹', 3),
  c('LV', 'Lettland', '🇱🇻', 3),
  c('EE', 'Estland', '🇪🇪', 3),
  c('LU', 'Luxemburg', '🇱🇺', 3),
  c('MT', 'Malta', '🇲🇹', 3),
  c('FO', 'Färöer', '🇫🇴', 3),
  c('GI', 'Gibraltar', '🇬🇮', 3),
  c('AD', 'Andorra', '🇦🇩', 3),
  c('SM', 'San Marino', '🇸🇲', 3),
  c('LI', 'Liechtenstein', '🇱🇮', 3),
  c('RU', 'Russland', '🇷🇺', 3),
]

export const countryById = (id: string): Country | undefined => COUNTRIES.find((x) => x.id === id)
export const playableCountries = (): Country[] => COUNTRIES.filter((x) => x.welle <= AKTIVE_WELLE)
