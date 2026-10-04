import type { Traits } from '../engine/types'

export type PrivatKategorie = 'Beziehung' | 'Familie' | 'Freizeit' | 'Gesundheit' | 'Status' | 'Wohnen'

export interface PrivatPosten {
  id: string
  name: string
  icon: string
  kategorie: PrivatKategorie
  text: string
  /** Aktivität (einmalige Ausgabe mit Wartezeit) oder Besitz (dauerhaft). */
  art: 'aktion' | 'besitz'
  kosten: number
  /** Laufende Kosten pro Jahr (Besitz). */
  laufend?: number
  /** Wochen, bis die Aktivität wieder möglich ist. */
  abkuehlung?: number
  /** Besitz einer Gruppe schließt sich aus (z. B. nur ein Auto). */
  gruppe?: string
  braucht?: 'partner' | 'kinder' | 'profi'
  /** Einmalige Wirkung beim Nutzen bzw. Kaufen. */
  sofort?: Partial<Traits>
  /** Wirkung pro Woche, solange der Besitz besteht. */
  passiv?: Partial<Traits>
}

export const PRIVAT_KATEGORIEN: PrivatKategorie[] = ['Beziehung', 'Familie', 'Freizeit', 'Gesundheit', 'Status', 'Wohnen']

export const PRIVAT: PrivatPosten[] = [
  // ---- Aktivitäten
  { id: 'date', name: 'Date-Abend', icon: '🍷', kategorie: 'Beziehung', art: 'aktion', kosten: 150, abkuehlung: 4, braucht: 'partner', text: 'Ein schönes Restaurant, Handy aus. Gemeinsame Zeit zählt.', sofort: { privatglueck: 5, moral: 2 } },
  { id: 'geschenk', name: 'Überraschungsgeschenk', icon: '🎁', kategorie: 'Beziehung', art: 'aktion', kosten: 2_000, abkuehlung: 12, braucht: 'partner', text: 'Blumen, Schmuck oder ein Wochenende, von dem sie nichts weiß.', sofort: { privatglueck: 7, moral: 2 } },
  { id: 'paartherapie', name: 'Paarberatung', icon: '🛋️', kategorie: 'Beziehung', art: 'aktion', kosten: 600, abkuehlung: 26, braucht: 'partner', text: 'Ein Profi hilft euch, besser zu reden. Das tut gut, auch ohne Krise.', sofort: { privatglueck: 7, selbstvertrauen: 2 } },
  { id: 'kurztrip', name: 'Wochenend-Trip', icon: '🧳', kategorie: 'Beziehung', art: 'aktion', kosten: 1_500, abkuehlung: 13, text: 'Zwei Tage raus: Städtetrip, Berge oder Meer.', sofort: { privatglueck: 8, fitness: 6, moral: 3 } },
  { id: 'urlaub', name: 'Luxusurlaub', icon: '🏝️', kategorie: 'Freizeit', art: 'aktion', kosten: 8_000, abkuehlung: 26, text: 'Eine Woche Malediven. Der Akku ist danach wieder ganz voll.', sofort: { privatglueck: 14, moral: 6, fitness: 10 } },
  { id: 'familie-besuch', name: 'Familie besuchen', icon: '👪', kategorie: 'Familie', art: 'aktion', kosten: 400, abkuehlung: 8, text: 'Ein Sonntag bei Mama und Papa. Mamas Essen ist unschlagbar.', sofort: { privatglueck: 5, moral: 3 } },
  { id: 'familienfeier', name: 'Familienfeier ausrichten', icon: '🎂', kategorie: 'Familie', art: 'aktion', kosten: 3_000, abkuehlung: 26, text: 'Geburtstag, Taufe, Jubiläum: Du lädst alle ein und übernimmst die Rechnung.', sofort: { privatglueck: 7, moral: 3, fanbeliebtheit: 1 } },
  { id: 'familie-ausflug', name: 'Ausflug mit den Kindern', icon: '🎡', kategorie: 'Familie', art: 'aktion', kosten: 300, abkuehlung: 6, braucht: 'kinder', text: 'Freizeitpark, Zoo oder einfach der Spielplatz um die Ecke.', sofort: { privatglueck: 6, moral: 3, fitness: 2 } },
  { id: 'freunde', name: 'Freunde treffen', icon: '🍻', kategorie: 'Freizeit', art: 'aktion', kosten: 200, abkuehlung: 3, text: 'Grillen, Zocken oder Bolzplatz wie früher.', sofort: { privatglueck: 3, moral: 1 } },
  { id: 'konzert', name: 'Konzert oder Festival', icon: '🎤', kategorie: 'Freizeit', art: 'aktion', kosten: 500, abkuehlung: 8, text: 'Laut, voll, genau das Richtige zum Abschalten.', sofort: { privatglueck: 4, moral: 2 } },
  { id: 'spende', name: 'Spenden', icon: '💝', kategorie: 'Status', art: 'aktion', kosten: 5_000, abkuehlung: 26, text: 'Du unterstützt ein Kinderprojekt in deiner Heimatstadt.', sofort: { ruf: 1, fanbeliebtheit: 2, privatglueck: 2 } },
  { id: 'wellness', name: 'Wellness-Wochenende', icon: '🧖', kategorie: 'Gesundheit', art: 'aktion', kosten: 1_200, abkuehlung: 8, text: 'Sauna, Massage und ein früher Schlaf.', sofort: { fitness: 8, privatglueck: 3, gesundheit: 1 } },
  { id: 'mentalcoach-session', name: 'Gespräch mit Sportpsychologe', icon: '🧠', kategorie: 'Gesundheit', art: 'aktion', kosten: 250, abkuehlung: 6, text: 'Einmal alles sortieren: Druck, Zweifel, Ziele.', sofort: { moral: 4, selbstvertrauen: 3 } },

  // ---- Besitz: Freizeit
  { id: 'hund', name: 'Hund', icon: '🐕', kategorie: 'Freizeit', art: 'besitz', kosten: 1_200, laufend: 1_500, text: 'Ein treuer Begleiter. Die Spaziergänge halten dich fit und erden dich.', sofort: { privatglueck: 6 }, passiv: { privatglueck: 0.12, fitness: 0.05 } },
  { id: 'gitarre', name: 'Gitarre', icon: '🎸', kategorie: 'Freizeit', art: 'besitz', kosten: 800, text: 'Abends ein paar Akkorde. Die Kabine hört zu und lacht freundlich.', sofort: { privatglueck: 2 }, passiv: { moral: 0.05, privatglueck: 0.05 } },
  { id: 'gaming', name: 'Gaming-Setup', icon: '🎮', kategorie: 'Freizeit', art: 'besitz', kosten: 3_000, text: 'Konsole, Bildschirm, Headset. Ideal, um mit Kumpels zu zocken.', sofort: { privatglueck: 2 }, passiv: { privatglueck: 0.07, kabine: 0.03 } },
  { id: 'golf', name: 'Golfclub-Mitgliedschaft', icon: '⛳', kategorie: 'Freizeit', art: 'besitz', kosten: 8_000, laufend: 4_000, text: 'Entspannung und die besten Kontakte für später.', sofort: { privatglueck: 3, ruf: 1 }, passiv: { privatglueck: 0.1, moral: 0.04 } },
  { id: 'boot', name: 'Segelboot', icon: '⛵', kategorie: 'Freizeit', art: 'besitz', kosten: 90_000, laufend: 8_000, text: 'Wind, Wasser und Ruhe. Ein teures, aber schönes Hobby.', sofort: { privatglueck: 6, ruf: 1 }, passiv: { privatglueck: 0.2, moral: 0.05 } },

  // ---- Besitz: Gesundheit
  { id: 'mentalcoach', name: 'Mentalcoach (Dauer)', icon: '🧘', kategorie: 'Gesundheit', art: 'besitz', kosten: 0, laufend: 6_000, text: 'Ein fester Ansprechpartner. Stärkt Moral und Selbstvertrauen.', passiv: { moral: 0.1, selbstvertrauen: 0.1 } },
  { id: 'physio', name: 'Physio-Abo', icon: '💆', kategorie: 'Gesundheit', art: 'besitz', kosten: 0, laufend: 9_000, text: 'Regelmäßige Behandlung hält Muskeln und Gelenke in Schuss.', passiv: { fitness: 0.15, gesundheit: 0.05 } },
  { id: 'koch', name: 'Privatkoch', icon: '👨‍🍳', kategorie: 'Gesundheit', art: 'besitz', kosten: 0, laufend: 18_000, text: 'Ernährung auf Profi-Niveau, jeden Tag frisch.', passiv: { fitness: 0.2, gesundheit: 0.07, professionalitaet: 0.03 } },

  // ---- Besitz: Familie
  { id: 'nanny', name: 'Kinderbetreuung', icon: '🧸', kategorie: 'Familie', art: 'besitz', kosten: 0, laufend: 24_000, braucht: 'kinder', text: 'Mehr Ruhe daheim und mehr Zeit für Training und Schlaf.', passiv: { privatglueck: 0.15, fitness: 0.1 } },
  { id: 'eltern-haus', name: 'Eltern ein Haus kaufen', icon: '🏡', kategorie: 'Familie', art: 'besitz', kosten: 150_000, text: 'Du gibst zurück, was deine Eltern für dich getan haben. Ein unbezahlbarer Moment.', sofort: { privatglueck: 12, ruf: 1, moral: 5 }, passiv: { privatglueck: 0.05 } },

  // ---- Besitz: Status
  { id: 'auto-klein', name: 'Kleinwagen', icon: '🚗', kategorie: 'Status', art: 'besitz', kosten: 18_000, laufend: 1_500, gruppe: 'auto', text: 'Zuverlässig und sparsam. Nicht auffällig, aber du kommst an.', sofort: { privatglueck: 2 } },
  { id: 'auto-sport', name: 'Sportwagen', icon: '🏎️', kategorie: 'Status', art: 'besitz', kosten: 130_000, laufend: 8_000, gruppe: 'auto', text: 'Laut, schnell, auffällig. Die Fans lieben es, die Zeitung auch.', sofort: { privatglueck: 6, fanbeliebtheit: 2 }, passiv: { privatglueck: 0.05 } },
  { id: 'auto-luxus', name: 'Supersportwagen', icon: '🚘', kategorie: 'Status', art: 'besitz', kosten: 400_000, laufend: 20_000, gruppe: 'auto', text: 'Eine Garage voller PS. Der ultimative Statussymbol-Moment.', sofort: { privatglueck: 10, fanbeliebtheit: 3, ruf: 1 }, passiv: { privatglueck: 0.1 } },
  { id: 'uhr', name: 'Luxusuhr', icon: '⌚', kategorie: 'Status', art: 'besitz', kosten: 25_000, text: 'Ein Stück, das mehr kostet als ein Neuwagen und trotzdem gut aussieht.', sofort: { privatglueck: 3, ruf: 1 } },
  { id: 'assistent', name: 'Persönlicher Assistent', icon: '📱', kategorie: 'Status', art: 'besitz', kosten: 0, laufend: 30_000, braucht: 'profi', text: 'Organisiert Termine, Reisen und Presseanfragen.', passiv: { professionalitaet: 0.08, privatglueck: 0.06 } },
  { id: 'stiftung', name: 'Eigene Stiftung', icon: '🌍', kategorie: 'Status', art: 'besitz', kosten: 250_000, laufend: 20_000, braucht: 'profi', text: 'Du förderst Kinder und Jugendliche. Das Image der Stiftung strahlt auf dich ab.', sofort: { ruf: 5, fanbeliebtheit: 5, privatglueck: 6 }, passiv: { ruf: 0.04, fanbeliebtheit: 0.05 } },

  // ---- Wohnen (Miete, schließt sich gegenseitig aus)
  { id: 'miete-schick', name: 'Schicke Mietwohnung', icon: '🏙️', kategorie: 'Wohnen', art: 'besitz', kosten: 6_000, laufend: 18_000, gruppe: 'wohnen', text: 'Modern, zentral, mit Balkon. Eine Kaution ist fällig.', sofort: { privatglueck: 4 }, passiv: { privatglueck: 0.1 } },
  { id: 'miete-penthouse', name: 'Penthouse', icon: '🌆', kategorie: 'Wohnen', art: 'besitz', kosten: 20_000, laufend: 60_000, gruppe: 'wohnen', text: 'Dachterrasse, Skyline, Concierge. Wer hier wohnt, wird bemerkt.', sofort: { privatglueck: 7, fanbeliebtheit: 1 }, passiv: { privatglueck: 0.18, ruf: 0.02 } },
]

export const PRIVAT_BY_ID: Record<string, PrivatPosten> = Object.fromEntries(PRIVAT.map((p) => [p.id, p]))
