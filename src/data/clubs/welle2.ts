import type { LandDaten } from './types'

export const NL: LandDaten = {
  land: 'NL', pokal: 'KNVB-Beker', europa: [2, 1, 2], national: 82,
  ligen: [
    { name: 'Eredivisie', ab: 2, vereine: [
      ['PSV Eindhoven', 82], ['Feyenoord Rotterdam', 77], ['Ajax Amsterdam', 77], ['AZ Alkmaar', 70],
      ['FC Twente', 69], ['FC Utrecht', 66], ['SC Heerenveen', 62], ['Go Ahead Eagles', 62],
      ['NEC Nijmegen', 62], ['Sparta Rotterdam', 60], ['FC Groningen', 57], ['Heracles Almelo', 57],
      ['NAC Breda', 56], ['Fortuna Sittard', 55], ['PEC Zwolle', 55], ['Excelsior Rotterdam', 55],
      ['Telstar', 52], ['FC Volendam', 52],
    ] },
    { name: 'Eerste Divisie', ab: 0, vereine: [
      ['Willem II', 50], ['ADO Den Haag', 48], ['De Graafschap', 48], ['SC Cambuur', 47],
      ['Roda JC Kerkrade', 47], ['VVV-Venlo', 45], ['Almere City', 47], ['FC Dordrecht', 44],
      ['FC Emmen', 47], ['Helmond Sport', 43], ['Jong Ajax', 46], ['Jong PSV', 46],
      ['Jong AZ', 43], ['Jong FC Utrecht', 42], ['MVV Maastricht', 42], ['TOP Oss', 42],
      ['FC Den Bosch', 43], ['FC Eindhoven', 43], ['VV Katwijk', 41], ['Vitesse Arnheim', 46],
    ] },
  ],
}

export const PT: LandDaten = {
  land: 'PT', pokal: 'Taça de Portugal', europa: [2, 1, 2], national: 83,
  ligen: [
    { name: 'Primeira Liga', ab: 2, vereine: [
      ['Sporting CP', 82], ['SL Benfica', 82], ['FC Porto', 82], ['SC Braga', 74],
      ['Vitória SC', 66], ['FC Famalicão', 62], ['Estoril Praia', 60], ['Gil Vicente', 60],
      ['Moreirense', 58], ['Casa Pia', 58], ['Arouca', 56], ['Rio Ave', 56],
      ['Santa Clara', 56], ['CD Nacional', 56], ['Estrela da Amadora', 54], ['AVS', 52],
      ['Tondela', 52], ['Alverca', 50],
    ] },
    { name: 'Liga Portugal 2', ab: 0, vereine: [
      ['Vizela', 50], ['Farense', 51], ['Boavista', 52], ['Marítimo', 50],
      ['Académico de Viseu', 46], ['Penafiel', 46], ['Leixões', 47], ['Chaves', 47],
      ['Paços de Ferreira', 48], ['Portimonense', 49], ['Torreense', 44], ['Feirense', 45],
      ['Mafra', 43], ['Académica', 45], ['Oliveirense', 43], ['Benfica B', 46],
      ['Porto B', 45], ['Sporting B', 45],
    ] },
  ],
}

export const BE: LandDaten = {
  land: 'BE', pokal: 'Croky Cup', europa: [2, 1, 1], national: 80,
  ligen: [
    { name: 'Jupiler Pro League', ab: 0, vereine: [
      ['Club Brügge', 76], ['Union Saint-Gilloise', 72], ['RSC Anderlecht', 72], ['KRC Genk', 70],
      ['KAA Gent', 68], ['Royal Antwerp', 66], ['Standard Lüttich', 62], ['Cercle Brügge', 62],
      ['KV Mechelen', 60], ['KVC Westerlo', 58], ['Sporting Charleroi', 58], ['OH Löwen', 56],
      ['Sint-Truiden', 56], ['Zulte Waregem', 54], ['FCV Dender', 52], ['RAAL La Louvière', 50],
    ] },
  ],
}

export const TR: LandDaten = {
  land: 'TR', pokal: 'Türkiye Kupası', europa: [1, 2, 1], national: 76,
  ligen: [
    { name: 'Süper Lig', ab: 0, vereine: [
      ['Galatasaray', 78], ['Fenerbahçe', 78], ['Beşiktaş', 72], ['Trabzonspor', 70],
      ['İstanbul Başakşehir', 66], ['Samsunspor', 62], ['Göztepe', 62], ['Konyaspor', 58],
      ['Çaykur Rizespor', 58], ['Kasımpaşa', 58], ['Alanyaspor', 58], ['Eyüpspor', 56],
      ['Gaziantep FK', 56], ['Antalyaspor', 56], ['Kayserispor', 55], ['Bodrum FK', 54],
      ['Kocaelispor', 54], ['Fatih Karagümrük', 54],
    ] },
  ],
}

export const SC: LandDaten = {
  land: 'SC', pokal: 'Scottish Cup', europa: [1, 1, 1], national: 70,
  ligen: [
    { name: 'Premiership', ab: 1, vereine: [
      ['Celtic Glasgow', 72], ['Glasgow Rangers', 68], ['Heart of Midlothian', 62], ['Aberdeen', 58],
      ['Hibernian', 58], ['Dundee United', 54], ['Motherwell', 54], ['Kilmarnock', 52],
      ['St Mirren', 52], ['Dundee FC', 52], ['Falkirk', 48], ['Livingston', 48],
    ] },
    { name: 'Championship', ab: 0, vereine: [
      ['Partick Thistle', 44], ['Raith Rovers', 42], ['Ayr United', 41], ['Dunfermline Athletic', 44],
      ['Inverness Caledonian Thistle', 43], ['Queen\'s Park', 40], ['Hamilton Academical', 40],
      ['Greenock Morton', 40], ['Arbroath', 39], ['Ross County', 44],
    ] },
  ],
}

export const GR: LandDaten = {
  land: 'GR', pokal: 'Griechischer Pokal', europa: [1, 1, 1], national: 70,
  ligen: [
    { name: 'Super League 1', ab: 0, vereine: [
      ['Olympiakos Piräus', 68], ['PAOK Thessaloniki', 66], ['AEK Athen', 66], ['Panathinaikos', 66],
      ['Aris Thessaloniki', 58], ['OFI Kreta', 52], ['Asteras Tripolis', 52], ['Volos NFC', 50],
      ['Atromitos', 50], ['Panetolikos', 48], ['Levadiakos', 48], ['PAS Giannina', 48],
      ['AE Larisa', 46], ['Kifisia', 46],
    ] },
  ],
}

export const DK: LandDaten = {
  land: 'DK', pokal: 'Dänischer Pokal', europa: [1, 1, 1], national: 74,
  ligen: [
    { name: 'Superliga', ab: 0, vereine: [
      ['FC Kopenhagen', 68], ['FC Midtjylland', 66], ['Brøndby IF', 64], ['AGF Aarhus', 60],
      ['FC Nordsjælland', 58], ['Viborg FF', 56], ['Silkeborg IF', 55], ['Randers FC', 54],
      ['SønderjyskE', 52], ['FC Fredericia', 50], ['Vejle BK', 50], ['Odense BK', 52],
    ] },
  ],
}

export const NO: LandDaten = {
  land: 'NO', pokal: 'Norwegischer Pokal', europa: [1, 1, 1], national: 70,
  ligen: [
    { name: 'Eliteserien', ab: 0, vereine: [
      ['FK Bodø/Glimt', 66], ['SK Brann', 62], ['Molde FK', 62], ['Viking FK', 60],
      ['Rosenborg BK', 60], ['Tromsø IL', 54], ['Fredrikstad FK', 52], ['Sarpsborg 08', 52],
      ['Vålerenga', 52], ['Strømsgodset', 50], ['Kristiansund BK', 48], ['FK Haugesund', 48],
      ['Sandefjord Fotball', 48], ['HamKam', 48], ['KFUM Oslo', 48], ['Aalesunds FK', 46],
    ] },
  ],
}

export const SE: LandDaten = {
  land: 'SE', pokal: 'Svenska Cupen', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'Allsvenskan', ab: 0, vereine: [
      ['Malmö FF', 62], ['Hammarby IF', 62], ['Djurgårdens IF', 60], ['BK Häcken', 60],
      ['AIK Stockholm', 58], ['IF Elfsborg', 58], ['IFK Göteborg', 56], ['Mjällby AIF', 56],
      ['IK Sirius', 54], ['GAIS Göteborg', 54], ['IFK Kalmar', 52], ['Halmstads BK', 50],
      ['Degerfors IF', 48], ['IF Brommapojkarna', 48], ['Västerås SK', 46], ['Örgryte IS', 46],
    ] },
  ],
}

export const PL: LandDaten = {
  land: 'PL', pokal: 'Polnischer Pokal', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'Ekstraklasa', ab: 0, vereine: [
      ['Lech Posen', 64], ['Legia Warschau', 62], ['Raków Częstochowa', 60], ['Jagiellonia Białystok', 60],
      ['Pogoń Stettin', 56], ['Cracovia', 54], ['Górnik Zabrze', 54], ['Widzew Łódź', 52],
      ['Lechia Danzig', 52], ['Piast Gliwice', 52], ['Zagłębie Lubin', 52], ['Korona Kielce', 50],
      ['Motor Lublin', 50], ['Radomiak Radom', 50], ['Śląsk Breslau', 50], ['Wisła Płock', 46],
      ['Arka Gdynia', 46], ['Termalica Nieciecza', 46],
    ] },
  ],
}

export const CZ: LandDaten = {
  land: 'CZ', pokal: 'Tschechischer Pokal', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'Fortuna Liga', ab: 0, vereine: [
      ['Slavia Prag', 66], ['Sparta Prag', 66], ['Viktoria Pilsen', 62], ['Baník Ostrava', 54],
      ['Sigma Olmütz', 52], ['Mladá Boleslav', 52], ['FK Jablonec', 52], ['Slovácko', 50],
      ['Hradec Králové', 50], ['Slovan Liberec', 50], ['FK Teplice', 48], ['Bohemians 1905', 48],
      ['FK Pardubice', 46], ['Karviná', 46], ['Dukla Prag', 44], ['Zlín', 44],
    ] },
  ],
}

export const HR: LandDaten = {
  land: 'HR', pokal: 'Kroatischer Pokal', europa: [1, 1, 1], national: 77,
  ligen: [
    { name: 'SuperSport HNL', ab: 0, vereine: [
      ['Dinamo Zagreb', 62], ['Hajduk Split', 58], ['HNK Rijeka', 56], ['NK Osijek', 52],
      ['NK Lokomotiva', 48], ['HNK Gorica', 46], ['NK Varaždin', 46], ['NK Istra 1961', 46],
      ['NK Slaven Belupo', 44], ['NK Vukovar', 44],
    ] },
  ],
}

export const RS: LandDaten = {
  land: 'RS', pokal: 'Serbischer Pokal', europa: [1, 1, 1], national: 73,
  ligen: [
    { name: 'SuperLiga', ab: 0, vereine: [
      ['Roter Stern Belgrad', 64], ['Partizan Belgrad', 58], ['TSC Bačka Topola', 52], ['FK Vojvodina', 50],
      ['FK Čukarički', 48], ['Radnički Niš', 46], ['FK Novi Pazar', 46], ['Mladost Lučani', 44],
      ['FK Napredak', 44], ['Železničar Pančevo', 44], ['Spartak Subotica', 44], ['IMT Novi Beograd', 42],
      ['Radnik Surdulica', 42], ['FK Javor', 42], ['OFK Belgrad', 42], ['FK Jedinstvo Ub', 40],
    ] },
  ],
}

export const UA: LandDaten = {
  land: 'UA', pokal: 'Ukrainischer Pokal', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'Premjer-Liha', ab: 0, vereine: [
      ['Schachtar Donezk', 68], ['Dynamo Kiew', 64], ['Kryvbas Kryvyi Rih', 52], ['Polissja Schytomyr', 50],
      ['Zorja Luhansk', 48], ['Oleksandrija', 48], ['Veres Riwne', 48], ['LNZ Tscherkassy', 46],
      ['Kolos Kowaliwka', 46], ['Rukh Lwiw', 46], ['Obolon Kiew', 44], ['Worskla Poltawa', 44],
      ['Metalist 1925', 44], ['Epizentr Kamjanez-Podilskyj', 44], ['Karpaty Lwiw', 44], ['Tschornomorez Odessa', 42],
    ] },
  ],
}

export const RO: LandDaten = {
  land: 'RO', pokal: 'Cupa României', europa: [1, 1, 1], national: 70,
  ligen: [
    { name: 'SuperLiga', ab: 0, vereine: [
      ['FCSB', 62], ['CFR Cluj', 58], ['Universitatea Craiova', 56], ['Rapid Bukarest', 54],
      ['Farul Constanța', 52], ['Dinamo Bukarest', 50], ['UTA Arad', 50], ['Sepsi Sfântu Gheorghe', 48],
      ['Petrolul Ploiești', 48], ['Hermannstadt', 48], ['Universitatea Cluj', 48], ['Oțelul Galați', 46],
      ['FC Botoșani', 46], ['Csíkszereda', 42], ['Metaloglobus', 42], ['Unirea Slobozia', 42],
    ] },
  ],
}

export const HU: LandDaten = {
  land: 'HU', pokal: 'Magyar Kupa', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'NB I', ab: 0, vereine: [
      ['Ferencváros', 62], ['Paksi FC', 54], ['Puskás Akadémia', 52], ['Debreceni VSC', 52],
      ['Győri ETO', 50], ['Zalaegerszegi TE', 50], ['Újpest FC', 50], ['MTK Budapest', 50],
      ['Diósgyőri VTK', 48], ['Kisvárda FC', 46], ['Nyíregyháza Spartacus', 44], ['Kazincbarcika', 42],
    ] },
  ],
}

export const IL: LandDaten = {
  land: 'IL', pokal: 'Toto Cup', europa: [1, 1, 1], national: 64,
  ligen: [
    { name: 'Ligat ha\'Al', ab: 0, vereine: [
      ['Maccabi Tel Aviv', 60], ['Hapoel Be\'er Scheva', 58], ['Maccabi Haifa', 58], ['Hapoel Tel Aviv', 54],
      ['Beitar Jerusalem', 52], ['Maccabi Netanja', 48], ['Hapoel Haifa', 46], ['Bnei Sachnin', 46],
      ['Ironi Kiryat Shmona', 44], ['Hapoel Jerusalem', 44], ['FC Ashdod', 44], ['Ironi Tiberias', 42],
      ['Hapoel Hadera', 42], ['Maccabi Bnei Reineh', 42],
    ] },
  ],
}
