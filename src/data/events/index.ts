import { FINANZEN } from './finanzen'
import { JUGEND } from './jugend'
import { KABINE } from './kabine'
import { KARRIERE } from './karriere'
import { MEDIEN } from './medien'
import { PRIVAT } from './privat'
import { RISIKO } from './risiko'
import { TRAINER } from './trainer'
import type { EreignisDef } from './types'
import { VEREIN } from './verein'

export const ALLE_EREIGNISSE: EreignisDef[] = [...JUGEND, ...KABINE, ...TRAINER, ...PRIVAT, ...MEDIEN, ...KARRIERE, ...RISIKO, ...VEREIN, ...FINANZEN]

export const EREIGNIS_BY_ID: Record<string, EreignisDef> = Object.fromEntries(ALLE_EREIGNISSE.map((e) => [e.id, e]))
