import { FINANZEN } from './finanzen'
import { JUGEND } from './jugend'
import { KABINE } from './kabine'
import { KARRIERE } from './karriere'
import { MEDIEN } from './medien'
import { LEBENSPHASEN } from './lebensphasen'
import { NATIONALTEAM } from './nationalteam'
import { RIVALE } from './rivale'
import { SKANDALE } from './skandale'
import { TRANSFER } from './transfer'
import { VERLETZUNG } from './verletzung'
import { PAUSENJAHR } from './pausenjahr'
import { PRIVAT } from './privat'
import { RISIKO } from './risiko'
import { SAISON } from './saison'
import { SOCIAL } from './social'
import { TRAINER } from './trainer'
import type { EreignisDef } from './types'
import { VEREIN } from './verein'
import { VEREINSLEBEN } from './vereinsleben'

export const ALLE_EREIGNISSE: EreignisDef[] = [...JUGEND, ...KABINE, ...TRAINER, ...PRIVAT, ...MEDIEN, ...KARRIERE, ...RISIKO, ...VEREIN, ...FINANZEN, ...SAISON, ...LEBENSPHASEN, ...SOCIAL, ...VEREINSLEBEN, ...TRANSFER, ...VERLETZUNG, ...NATIONALTEAM, ...RIVALE, ...SKANDALE, ...PAUSENJAHR]

export const EREIGNIS_BY_ID: Record<string, EreignisDef> = Object.fromEntries(ALLE_EREIGNISSE.map((e) => [e.id, e]))
