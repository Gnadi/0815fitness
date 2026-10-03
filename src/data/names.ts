import type { Rng } from '../engine/rng'

interface Pool {
  vor: readonly string[]
  nach: readonly string[]
}

const POOLS: Record<string, Pool> = {
  de: {
    vor: ['Lukas', 'Jonas', 'Felix', 'Leon', 'Tim', 'Max', 'Paul', 'Niklas', 'Florian', 'Tobias', 'Stefan', 'Markus', 'Dennis', 'Kevin', 'Sven', 'Jan', 'Moritz', 'Fabian', 'Daniel', 'Patrick'],
    nach: ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Neumann', 'Schwarz', 'Krüger', 'Hartmann', 'Lange', 'Berger', 'Huber', 'Gruber', 'Steiner', 'Brunner', 'Keller'],
  },
  en: {
    vor: ['Jack', 'Harry', 'Oliver', 'Charlie', 'George', 'Tom', 'Jordan', 'Callum', 'Ryan', 'Connor', 'Liam', 'Declan', 'Marcus', 'Danny', 'Ben', 'Kyle', 'Scott', 'Craig', 'Aidan', 'Sean'],
    nach: ['Smith', 'Jones', 'Taylor', 'Walker', 'Wright', 'Evans', 'Thompson', 'Roberts', 'Hughes', 'Clarke', 'Morgan', 'Bennett', 'Cooper', 'Murphy', 'Kelly', 'Campbell', 'Stewart', 'Fraser', 'Barnes', 'Hall'],
  },
  es: {
    vor: ['Álvaro', 'Pablo', 'Sergio', 'Carlos', 'Diego', 'Javier', 'Marcos', 'Iván', 'Adrián', 'Raúl', 'Hugo', 'Mario', 'Rubén', 'Nacho', 'Jordi', 'Unai', 'Aitor', 'Borja', 'Dani', 'Víctor'],
    nach: ['García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Ramos', 'Vega', 'Iglesias', 'Molina', 'Castro', 'Ortega'],
  },
  it: {
    vor: ['Marco', 'Luca', 'Matteo', 'Andrea', 'Davide', 'Federico', 'Simone', 'Alessandro', 'Giorgio', 'Lorenzo', 'Stefano', 'Riccardo', 'Fabio', 'Nicola', 'Gianluca', 'Claudio', 'Paolo', 'Enrico', 'Daniele', 'Roberto'],
    nach: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'],
  },
  fr: {
    vor: ['Lucas', 'Hugo', 'Théo', 'Antoine', 'Maxime', 'Julien', 'Nicolas', 'Romain', 'Thomas', 'Quentin', 'Mathieu', 'Kylian', 'Adrien', 'Bastien', 'Florian', 'Clément', 'Yannick', 'Damien', 'Olivier', 'Baptiste'],
    nach: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'],
  },
  nl: {
    vor: ['Daan', 'Sem', 'Lars', 'Bram', 'Jesse', 'Thijs', 'Ruben', 'Sven', 'Joost', 'Niels', 'Stijn', 'Wout', 'Bas', 'Koen', 'Mats', 'Pieter', 'Gijs', 'Maarten', 'Tim', 'Rick'],
    nach: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'Kuipers'],
  },
  pt: {
    vor: ['João', 'Rui', 'Tiago', 'Bruno', 'Nuno', 'Diogo', 'Pedro', 'André', 'Miguel', 'Ricardo', 'Rafael', 'Gonçalo', 'Hélder', 'Fábio', 'Sérgio', 'Vítor', 'Bernardo', 'Rúben', 'Daniel', 'Francisco'],
    nach: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira'],
  },
  tr: {
    vor: ['Emre', 'Burak', 'Mehmet', 'Ahmet', 'Mustafa', 'Hakan', 'Cem', 'Okan', 'Kerem', 'Arda', 'Yusuf', 'Serkan', 'Volkan', 'Ozan', 'Berkay', 'Barış', 'Can', 'Selim', 'Tolga', 'Umut'],
    nach: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek'],
  },
  sl: {
    vor: ['Marko', 'Luka', 'Ivan', 'Nikola', 'Stefan', 'Milan', 'Dragan', 'Jakub', 'Tomasz', 'Piotr', 'Michał', 'Martin', 'Dejan', 'Mateusz', 'Petar', 'Vladimir', 'Andrej', 'Bogdan', 'Filip', 'Zoran'],
    nach: ['Kovač', 'Horvat', 'Novak', 'Jovanović', 'Petrović', 'Nowak', 'Kowalski', 'Wiśniewski', 'Novotný', 'Svoboda', 'Marković', 'Ilić', 'Kovalenko', 'Shevchenko', 'Popović', 'Babić', 'Lewandowski', 'Zieliński', 'Dvořák', 'Kos'],
  },
  nord: {
    vor: ['Erik', 'Magnus', 'Anders', 'Mikkel', 'Jonas', 'Oskar', 'Henrik', 'Lars', 'Mats', 'Emil', 'Sander', 'Kasper', 'Rasmus', 'Viktor', 'Johan', 'Axel', 'Joakim', 'Thomas', 'Simon', 'Eirik'],
    nach: ['Hansen', 'Johansen', 'Andersen', 'Nielsen', 'Larsen', 'Pedersen', 'Olsen', 'Lindqvist', 'Eriksson', 'Svensson', 'Karlsson', 'Nilsson', 'Berg', 'Haugen', 'Dahl', 'Holm', 'Strand', 'Virtanen', 'Korhonen', 'Gunnarsson'],
  },
  gr: {
    vor: ['Giorgos', 'Dimitris', 'Nikos', 'Kostas', 'Panagiotis', 'Vasilis', 'Christos', 'Thanasis', 'Sokratis', 'Andreas', 'Stelios', 'Manolis', 'Petros', 'Alexandros', 'Yiannis', 'Lazaros', 'Michalis', 'Tasos', 'Antonis', 'Pavlos'],
    nach: ['Papadopoulos', 'Georgiou', 'Nikolaidis', 'Karagounis', 'Antoniou', 'Dimitriou', 'Papadakis', 'Vlachos', 'Makris', 'Alexiou', 'Christodoulou', 'Ioannou', 'Stavrou', 'Kostopoulos', 'Mitroglou', 'Samaras', 'Zagorakis', 'Fetfatzidis', 'Siopis', 'Tziolis'],
  },
  hu: {
    vor: ['Péter', 'László', 'Gábor', 'Ádám', 'Dániel', 'Balázs', 'Zoltán', 'Attila', 'Márk', 'Dominik', 'Bence', 'Tamás', 'Máté', 'Norbert', 'Roland', 'Krisztián', 'Zsolt', 'András', 'Richárd', 'Levente'],
    nach: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete'],
  },
  ro: {
    vor: ['Andrei', 'Alexandru', 'Mihai', 'Florin', 'Cristian', 'Gabriel', 'Adrian', 'Marius', 'Răzvan', 'Ionuț', 'Bogdan', 'Dorin', 'Valentin', 'Sorin', 'Costel', 'Daniel', 'Ciprian', 'Nicolae', 'Radu', 'Vlad'],
    nach: ['Popescu', 'Ionescu', 'Popa', 'Stan', 'Dumitru', 'Gheorghe', 'Constantin', 'Marin', 'Mihai', 'Stoica', 'Radu', 'Dobre', 'Barbu', 'Matei', 'Tudor', 'Munteanu', 'Rusu', 'Moldovan', 'Lazăr', 'Neagu'],
  },
  il: {
    vor: ['Eran', 'Omer', 'Yossi', 'Dor', 'Tal', 'Ran', 'Noam', 'Itay', 'Amit', 'Gal', 'Shon', 'Ido', 'Lior', 'Barak', 'Nir', 'Guy', 'Ofer', 'Roei', 'Yoav', 'Elad'],
    nach: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman', 'Malka', 'Azulay', 'Katz', 'Yosef', 'Amar', 'Hadad', 'Gabay', 'Ben-David', 'Sharabi', 'Zehavi', 'Dayan', 'Bar'],
  },
  cau: {
    vor: ['Giorgi', 'Levan', 'Nika', 'Davit', 'Aram', 'Vahan', 'Rashad', 'Elnur', 'Murad', 'Timur', 'Daniyar', 'Aidos', 'Nodar', 'Tornike', 'Karen', 'Armen', 'Farid', 'Samir', 'Ruslan', 'Askar'],
    nach: ['Beridze', 'Kapanadze', 'Mamedov', 'Aliyev', 'Hakobyan', 'Petrosyan', 'Nurgaliev', 'Seitov', 'Gelashvili', 'Abdullayev', 'Sargsyan', 'Khachatryan', 'Zhakupov', 'Nazarov', 'Huseynov', 'Lomidze', 'Tkemaladze', 'Bekov', 'Rzayev', 'Voskanyan'],
  },
}

const REGION: Record<string, keyof typeof POOLS> = {
  DE: 'de', AT: 'de', CH: 'de', LI: 'de', LU: 'de',
  EN: 'en', SC: 'en', WA: 'en', NI: 'en', IE: 'en', MT: 'en', GI: 'en',
  ES: 'es', AD: 'es', IT: 'it', SM: 'it', FR: 'fr', NL: 'nl', BE: 'nl', PT: 'pt',
  TR: 'tr', GR: 'gr', CY: 'gr', HU: 'hu', RO: 'ro', MD: 'ro', IL: 'il',
  DK: 'nord', NO: 'nord', SE: 'nord', FI: 'nord', IS: 'nord', FO: 'nord', EE: 'nord', LV: 'nord', LT: 'nord',
  GE: 'cau', AM: 'cau', AZ: 'cau', KZ: 'cau',
}

export function zufallsName(land: string, rng: Rng): string {
  const pool = POOLS[REGION[land] ?? 'sl']
  return `${rng.pick(pool.vor)} ${rng.pick(pool.nach)}`
}
