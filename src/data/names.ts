import type { Rng } from '../engine/rng'

interface Pool {
  vor: readonly string[]
  vorW: readonly string[]
  nach: readonly string[]
}

const POOLS: Record<string, Pool> = {
  de: {
    vor: ['Lukas', 'Jonas', 'Felix', 'Leon', 'Tim', 'Max', 'Paul', 'Niklas', 'Florian', 'Tobias', 'Stefan', 'Markus', 'Dennis', 'Kevin', 'Sven', 'Jan', 'Moritz', 'Fabian', 'Daniel', 'Patrick'],
    vorW: ['Anna', 'Lena', 'Laura', 'Julia', 'Sophie', 'Marie', 'Lisa', 'Katharina', 'Sarah', 'Nina', 'Jessica', 'Vanessa', 'Johanna', 'Hannah', 'Clara', 'Mia', 'Franziska', 'Carina', 'Melanie', 'Isabell'],
    nach: ['Müller', 'Schmidt', 'Weber', 'Wagner', 'Becker', 'Hoffmann', 'Koch', 'Richter', 'Wolf', 'Neumann', 'Schwarz', 'Krüger', 'Hartmann', 'Lange', 'Berger', 'Huber', 'Gruber', 'Steiner', 'Brunner', 'Keller'],
  },
  en: {
    vor: ['Jack', 'Harry', 'Oliver', 'Charlie', 'George', 'Tom', 'Jordan', 'Callum', 'Ryan', 'Connor', 'Liam', 'Declan', 'Marcus', 'Danny', 'Ben', 'Kyle', 'Scott', 'Craig', 'Aidan', 'Sean'],
    vorW: ['Emily', 'Olivia', 'Amelia', 'Chloe', 'Sophie', 'Charlotte', 'Megan', 'Jessica', 'Holly', 'Lucy', 'Grace', 'Ella', 'Katie', 'Abbie', 'Zoe', 'Hannah', 'Molly', 'Beth', 'Rebecca', 'Lauren'],
    nach: ['Smith', 'Jones', 'Taylor', 'Walker', 'Wright', 'Evans', 'Thompson', 'Roberts', 'Hughes', 'Clarke', 'Morgan', 'Bennett', 'Cooper', 'Murphy', 'Kelly', 'Campbell', 'Stewart', 'Fraser', 'Barnes', 'Hall'],
  },
  es: {
    vor: ['Álvaro', 'Pablo', 'Sergio', 'Carlos', 'Diego', 'Javier', 'Marcos', 'Iván', 'Adrián', 'Raúl', 'Hugo', 'Mario', 'Rubén', 'Nacho', 'Jordi', 'Unai', 'Aitor', 'Borja', 'Dani', 'Víctor'],
    vorW: ['Lucía', 'Marta', 'Carmen', 'Laura', 'Paula', 'Sara', 'Elena', 'Andrea', 'Claudia', 'Irene', 'Cristina', 'Alba', 'Noelia', 'Patricia', 'Rocío', 'Beatriz', 'Natalia', 'Ainhoa', 'Sofía', 'Inés'],
    nach: ['García', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Ruiz', 'Díaz', 'Moreno', 'Álvarez', 'Romero', 'Navarro', 'Torres', 'Ramos', 'Vega', 'Iglesias', 'Molina', 'Castro', 'Ortega'],
  },
  it: {
    vor: ['Marco', 'Luca', 'Matteo', 'Andrea', 'Davide', 'Federico', 'Simone', 'Alessandro', 'Giorgio', 'Lorenzo', 'Stefano', 'Riccardo', 'Fabio', 'Nicola', 'Gianluca', 'Claudio', 'Paolo', 'Enrico', 'Daniele', 'Roberto'],
    vorW: ['Giulia', 'Chiara', 'Francesca', 'Sara', 'Martina', 'Alessia', 'Elisa', 'Valentina', 'Federica', 'Silvia', 'Elena', 'Giorgia', 'Ilaria', 'Serena', 'Paola', 'Beatrice', 'Camilla', 'Roberta', 'Alice', 'Lucia'],
    nach: ['Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco', 'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti'],
  },
  fr: {
    vor: ['Lucas', 'Hugo', 'Théo', 'Antoine', 'Maxime', 'Julien', 'Nicolas', 'Romain', 'Thomas', 'Quentin', 'Mathieu', 'Kylian', 'Adrien', 'Bastien', 'Florian', 'Clément', 'Yannick', 'Damien', 'Olivier', 'Baptiste'],
    vorW: ['Camille', 'Léa', 'Chloé', 'Manon', 'Emma', 'Inès', 'Sarah', 'Julie', 'Marine', 'Pauline', 'Clara', 'Océane', 'Laura', 'Amélie', 'Margaux', 'Élodie', 'Justine', 'Lola', 'Mathilde', 'Charlotte'],
    nach: ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau', 'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier'],
  },
  nl: {
    vor: ['Daan', 'Sem', 'Lars', 'Bram', 'Jesse', 'Thijs', 'Ruben', 'Sven', 'Joost', 'Niels', 'Stijn', 'Wout', 'Bas', 'Koen', 'Mats', 'Pieter', 'Gijs', 'Maarten', 'Tim', 'Rick'],
    vorW: ['Sanne', 'Emma', 'Lotte', 'Fleur', 'Anouk', 'Femke', 'Eva', 'Julia', 'Iris', 'Lisa', 'Roos', 'Noor', 'Sophie', 'Maud', 'Britt', 'Lieke', 'Mila', 'Nienke', 'Laura', 'Isa'],
    nach: ['de Jong', 'Jansen', 'de Vries', 'van den Berg', 'van Dijk', 'Bakker', 'Visser', 'Smit', 'Meijer', 'de Boer', 'Mulder', 'de Groot', 'Bos', 'Vos', 'Peters', 'Hendriks', 'van Leeuwen', 'Dekker', 'Brouwer', 'Kuipers'],
  },
  pt: {
    vor: ['João', 'Rui', 'Tiago', 'Bruno', 'Nuno', 'Diogo', 'Pedro', 'André', 'Miguel', 'Ricardo', 'Rafael', 'Gonçalo', 'Hélder', 'Fábio', 'Sérgio', 'Vítor', 'Bernardo', 'Rúben', 'Daniel', 'Francisco'],
    vorW: ['Inês', 'Beatriz', 'Mariana', 'Carolina', 'Sofia', 'Joana', 'Catarina', 'Ana', 'Marta', 'Rita', 'Filipa', 'Daniela', 'Raquel', 'Patrícia', 'Andreia', 'Diana', 'Bárbara', 'Leonor', 'Teresa', 'Sara'],
    nach: ['Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Costa', 'Rodrigues', 'Martins', 'Sousa', 'Fernandes', 'Gonçalves', 'Gomes', 'Lopes', 'Marques', 'Alves', 'Almeida', 'Ribeiro', 'Pinto', 'Carvalho', 'Teixeira'],
  },
  tr: {
    vor: ['Emre', 'Burak', 'Mehmet', 'Ahmet', 'Mustafa', 'Hakan', 'Cem', 'Okan', 'Kerem', 'Arda', 'Yusuf', 'Serkan', 'Volkan', 'Ozan', 'Berkay', 'Barış', 'Can', 'Selim', 'Tolga', 'Umut'],
    vorW: ['Elif', 'Zeynep', 'Ayşe', 'Merve', 'Büşra', 'Selin', 'Esra', 'Derya', 'Defne', 'Ece', 'Gamze', 'Aylin', 'Seda', 'Pınar', 'Burcu', 'Ceren', 'Dilara', 'Yasemin', 'Nehir', 'İrem'],
    nach: ['Yılmaz', 'Kaya', 'Demir', 'Şahin', 'Çelik', 'Yıldız', 'Yıldırım', 'Öztürk', 'Aydın', 'Özdemir', 'Arslan', 'Doğan', 'Kılıç', 'Aslan', 'Çetin', 'Kara', 'Koç', 'Kurt', 'Özkan', 'Şimşek'],
  },
  sl: {
    vor: ['Marko', 'Luka', 'Ivan', 'Nikola', 'Stefan', 'Milan', 'Dragan', 'Jakub', 'Tomasz', 'Piotr', 'Michał', 'Martin', 'Dejan', 'Mateusz', 'Petar', 'Vladimir', 'Andrej', 'Bogdan', 'Filip', 'Zoran'],
    vorW: ['Ana', 'Marija', 'Katarina', 'Nina', 'Petra', 'Jelena', 'Ivana', 'Milica', 'Agnieszka', 'Katarzyna', 'Zofia', 'Tereza', 'Lucie', 'Natalia', 'Maja', 'Tanja', 'Sara', 'Anja', 'Tina', 'Olga'],
    nach: ['Kovač', 'Horvat', 'Novak', 'Jovanović', 'Petrović', 'Nowak', 'Kowalski', 'Wiśniewski', 'Novotný', 'Svoboda', 'Marković', 'Ilić', 'Kovalenko', 'Shevchenko', 'Popović', 'Babić', 'Lewandowski', 'Zieliński', 'Dvořák', 'Kos'],
  },
  nord: {
    vor: ['Erik', 'Magnus', 'Anders', 'Mikkel', 'Jonas', 'Oskar', 'Henrik', 'Lars', 'Mats', 'Emil', 'Sander', 'Kasper', 'Rasmus', 'Viktor', 'Johan', 'Axel', 'Joakim', 'Thomas', 'Simon', 'Eirik'],
    vorW: ['Emma', 'Ida', 'Astrid', 'Freja', 'Nora', 'Ingrid', 'Sofie', 'Maja', 'Linnea', 'Sara', 'Julie', 'Thea', 'Hanna', 'Kaisa', 'Elin', 'Signe', 'Camilla', 'Frida', 'Marte', 'Helena'],
    nach: ['Hansen', 'Johansen', 'Andersen', 'Nielsen', 'Larsen', 'Pedersen', 'Olsen', 'Lindqvist', 'Eriksson', 'Svensson', 'Karlsson', 'Nilsson', 'Berg', 'Haugen', 'Dahl', 'Holm', 'Strand', 'Virtanen', 'Korhonen', 'Gunnarsson'],
  },
  gr: {
    vor: ['Giorgos', 'Dimitris', 'Nikos', 'Kostas', 'Panagiotis', 'Vasilis', 'Christos', 'Thanasis', 'Sokratis', 'Andreas', 'Stelios', 'Manolis', 'Petros', 'Alexandros', 'Yiannis', 'Lazaros', 'Michalis', 'Tasos', 'Antonis', 'Pavlos'],
    vorW: ['Maria', 'Eleni', 'Katerina', 'Sofia', 'Dimitra', 'Georgia', 'Anna', 'Ioanna', 'Christina', 'Vasiliki', 'Evangelia', 'Nikoleta', 'Despina', 'Eirini', 'Angeliki', 'Konstantina', 'Athina', 'Zoi', 'Stavroula', 'Marina'],
    nach: ['Papadopoulos', 'Georgiou', 'Nikolaidis', 'Karagounis', 'Antoniou', 'Dimitriou', 'Papadakis', 'Vlachos', 'Makris', 'Alexiou', 'Christodoulou', 'Ioannou', 'Stavrou', 'Kostopoulos', 'Mitroglou', 'Samaras', 'Zagorakis', 'Fetfatzidis', 'Siopis', 'Tziolis'],
  },
  hu: {
    vor: ['Péter', 'László', 'Gábor', 'Ádám', 'Dániel', 'Balázs', 'Zoltán', 'Attila', 'Márk', 'Dominik', 'Bence', 'Tamás', 'Máté', 'Norbert', 'Roland', 'Krisztián', 'Zsolt', 'András', 'Richárd', 'Levente'],
    vorW: ['Anna', 'Réka', 'Eszter', 'Zsófia', 'Nóra', 'Boglárka', 'Fanni', 'Dóra', 'Kinga', 'Petra', 'Bianka', 'Viktória', 'Orsolya', 'Katalin', 'Hanna', 'Lilla', 'Vivien', 'Alexandra', 'Noémi', 'Dorina'],
    nach: ['Nagy', 'Kovács', 'Tóth', 'Szabó', 'Horváth', 'Varga', 'Kiss', 'Molnár', 'Németh', 'Farkas', 'Balogh', 'Papp', 'Takács', 'Juhász', 'Lakatos', 'Mészáros', 'Oláh', 'Simon', 'Rácz', 'Fekete'],
  },
  ro: {
    vor: ['Andrei', 'Alexandru', 'Mihai', 'Florin', 'Cristian', 'Gabriel', 'Adrian', 'Marius', 'Răzvan', 'Ionuț', 'Bogdan', 'Dorin', 'Valentin', 'Sorin', 'Costel', 'Daniel', 'Ciprian', 'Nicolae', 'Radu', 'Vlad'],
    vorW: ['Andreea', 'Ioana', 'Maria', 'Elena', 'Alexandra', 'Mihaela', 'Diana', 'Cristina', 'Roxana', 'Larisa', 'Bianca', 'Denisa', 'Raluca', 'Teodora', 'Daniela', 'Georgiana', 'Simona', 'Oana', 'Alina', 'Ana'],
    nach: ['Popescu', 'Ionescu', 'Popa', 'Stan', 'Dumitru', 'Gheorghe', 'Constantin', 'Marin', 'Mihai', 'Stoica', 'Radu', 'Dobre', 'Barbu', 'Matei', 'Tudor', 'Munteanu', 'Rusu', 'Moldovan', 'Lazăr', 'Neagu'],
  },
  il: {
    vor: ['Eran', 'Omer', 'Yossi', 'Dor', 'Tal', 'Ran', 'Noam', 'Itay', 'Amit', 'Gal', 'Shon', 'Ido', 'Lior', 'Barak', 'Nir', 'Guy', 'Ofer', 'Roei', 'Yoav', 'Elad'],
    vorW: ['Noa', 'Maya', 'Shir', 'Tamar', 'Yael', 'Michal', 'Hila', 'Adi', 'Lior', 'Dana', 'Roni', 'Talia', 'Neta', 'Gili', 'Ayelet', 'Keren', 'Shani', 'Moran', 'Liat', 'Orly'],
    nach: ['Cohen', 'Levi', 'Mizrahi', 'Peretz', 'Biton', 'Dahan', 'Avraham', 'Friedman', 'Malka', 'Azulay', 'Katz', 'Yosef', 'Amar', 'Hadad', 'Gabay', 'Ben-David', 'Sharabi', 'Zehavi', 'Dayan', 'Bar'],
  },
  cau: {
    vor: ['Giorgi', 'Levan', 'Nika', 'Davit', 'Aram', 'Vahan', 'Rashad', 'Elnur', 'Murad', 'Timur', 'Daniyar', 'Aidos', 'Nodar', 'Tornike', 'Karen', 'Armen', 'Farid', 'Samir', 'Ruslan', 'Askar'],
    vorW: ['Nino', 'Mariam', 'Tamar', 'Ani', 'Lilit', 'Narine', 'Aysel', 'Leyla', 'Nigar', 'Aigerim', 'Dana', 'Madina', 'Salome', 'Eka', 'Mane', 'Sevil', 'Gulnara', 'Aliya', 'Ketevan', 'Natia'],
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

export function zufallsName(land: string, rng: Rng, geschlecht: 'm' | 'w' = 'm'): string {
  const pool = POOLS[REGION[land] ?? 'sl']
  return `${rng.pick(geschlecht === 'w' ? pool.vorW : pool.vor)} ${rng.pick(pool.nach)}`
}
