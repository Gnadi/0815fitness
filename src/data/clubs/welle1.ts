import type { LandDaten } from './types'

export const DE: LandDaten = {
  land: 'DE', pokal: 'DFB-Pokal', europa: [4, 2, 1], national: 84,
  ligen: [
    { name: 'Bundesliga', ab: 2, vereine: [
      ['FC Bayern München', 91], ['Bayer 04 Leverkusen', 84], ['Borussia Dortmund', 83], ['RB Leipzig', 82],
      ['Eintracht Frankfurt', 77], ['VfB Stuttgart', 77], ['SC Freiburg', 72], ['TSG Hoffenheim', 71],
      ['Borussia Mönchengladbach', 70], ['VfL Wolfsburg', 70], ['Werder Bremen', 69], ['1. FSV Mainz 05', 68],
      ['1. FC Union Berlin', 67], ['FC Augsburg', 66], ['FC St. Pauli', 65], ['1. FC Köln', 65],
      ['Hamburger SV', 64], ['1. FC Heidenheim', 63],
    ] },
    { name: '2. Bundesliga', ab: 3, vereine: [
      ['FC Schalke 04', 63], ['Hertha BSC', 62], ['Hannover 96', 61], ['Fortuna Düsseldorf', 61],
      ['1. FC Nürnberg', 60], ['Karlsruher SC', 59], ['VfL Bochum', 60], ['Holstein Kiel', 58],
      ['SC Paderborn 07', 59], ['SV Elversberg', 58], ['1. FC Kaiserslautern', 58], ['1. FC Magdeburg', 56],
      ['Eintracht Braunschweig', 55], ['SV Darmstadt 98', 58], ['SpVgg Greuther Fürth', 55], ['Preußen Münster', 53],
      ['Arminia Bielefeld', 54], ['Dynamo Dresden', 54],
    ] },
    { name: '3. Liga', ab: 0, vereine: [
      ['TSV 1860 München', 50], ['Alemannia Aachen', 48], ['Energie Cottbus', 49], ['Borussia Dortmund II', 47],
      ['MSV Duisburg', 49], ['Rot-Weiss Essen', 49], ['Hansa Rostock', 50], ['FC Ingolstadt 04', 50],
      ['Jahn Regensburg', 49], ['1. FC Saarbrücken', 48], ['SV Sandhausen', 47], ['VfB Stuttgart II', 46],
      ['SC Verl', 46], ['Viktoria Köln', 47], ['Waldhof Mannheim', 48], ['SV Wehen Wiesbaden', 47],
      ['Erzgebirge Aue', 47], ['SSV Ulm 1846', 46], ['VfL Osnabrück', 48], ['TSG Hoffenheim II', 45],
    ] },
  ],
}

export const AT: LandDaten = {
  land: 'AT', pokal: 'ÖFB-Cup', europa: [1, 1, 1], national: 72,
  ligen: [
    { name: 'Bundesliga', ab: 2, vereine: [
      ['FC Red Bull Salzburg', 74], ['SK Sturm Graz', 70], ['SK Rapid Wien', 67], ['LASK', 66],
      ['FK Austria Wien', 64], ['Wolfsberger AC', 62], ['TSV Hartberg', 55], ['SK Austria Klagenfurt', 54],
      ['SCR Altach', 53], ['FC Blau-Weiß Linz', 52], ['Grazer AK', 52], ['WSG Tirol', 53],
    ] },
    { name: '2. Liga', ab: 0, vereine: [
      ['SV Ried', 48], ['FC Liefering', 47], ['Kapfenberger SV', 44], ['SK Vorwärts Steyr', 46],
      ['SV Horn', 43], ['SC Austria Lustenau', 46], ['SV Stripfing', 42], ['SKN St. Pölten', 45],
      ['FC Dornbirn', 42], ['SV Lafnitz', 43], ['SC Amstetten', 42], ['SW Bregenz', 42],
      ['First Vienna FC', 42], ['FK Austria Wien Young Violets', 41], ['SK Sturm Graz II', 41], ['FC Wacker Innsbruck', 42],
    ] },
  ],
}

export const CH: LandDaten = {
  land: 'CH', pokal: 'Schweizer Cup', europa: [1, 1, 1], national: 76,
  ligen: [
    { name: 'Super League', ab: 1, vereine: [
      ['BSC Young Boys', 69], ['FC Basel 1893', 68], ['FC Lugano', 66], ['Servette FC', 64],
      ['FC St. Gallen', 64], ['FC Zürich', 62], ['FC Luzern', 62], ['FC Sion', 60],
      ['FC Lausanne-Sport', 60], ['Grasshopper Club Zürich', 58], ['FC Thun', 57], ['FC Winterthur', 54],
    ] },
    { name: 'Challenge League', ab: 0, vereine: [
      ['FC Aarau', 47], ['Neuchâtel Xamax', 45], ['FC Vaduz', 46], ['FC Wil', 44],
      ['FC Schaffhausen', 43], ['Stade Lausanne-Ouchy', 44], ['FC Rapperswil-Jona', 42], ['Étoile Carouge', 42],
      ['Yverdon-Sport', 46], ['Stade Nyonnais', 41],
    ] },
  ],
}

export const EN: LandDaten = {
  land: 'EN', pokal: 'FA Cup', europa: [4, 2, 1], national: 87,
  ligen: [
    { name: 'Premier League', ab: 3, vereine: [
      ['Manchester City', 90], ['Arsenal', 89], ['Liverpool', 89], ['Chelsea', 85],
      ['Tottenham Hotspur', 80], ['Newcastle United', 80], ['Manchester United', 80], ['Aston Villa', 79],
      ['Brighton & Hove Albion', 74], ['Crystal Palace', 73], ['West Ham United', 72], ['Fulham', 72],
      ['Brentford', 72], ['AFC Bournemouth', 72], ['Nottingham Forest', 71], ['Everton', 70],
      ['Wolverhampton Wanderers', 68], ['Leeds United', 66], ['Sunderland', 64], ['Burnley', 63],
    ] },
    { name: 'Championship', ab: 3, vereine: [
      ['Leicester City', 63], ['Southampton', 62], ['Ipswich Town', 62], ['Birmingham City', 61],
      ['Sheffield United', 61], ['Middlesbrough', 60], ['Norwich City', 60], ['Coventry City', 60],
      ['West Bromwich Albion', 59], ['Watford', 58], ['Stoke City', 58], ['Swansea City', 57],
      ['Blackburn Rovers', 57], ['Millwall', 57], ['Bristol City', 57], ['Queens Park Rangers', 56],
      ['Preston North End', 56], ['Derby County', 56], ['Hull City', 56], ['Portsmouth', 56],
      ['Charlton Athletic', 56], ['Oxford United', 55], ['Sheffield Wednesday', 54], ['Wrexham', 55],
    ] },
    { name: 'League One', ab: 4, vereine: [
      ['Cardiff City', 53], ['Luton Town', 54], ['Huddersfield Town', 52], ['Plymouth Argyle', 52],
      ['Reading', 52], ['Bolton Wanderers', 53], ['Wigan Athletic', 52], ['Stockport County', 52],
      ['Barnsley', 51], ['Peterborough United', 52], ['Blackpool', 51], ['Rotherham United', 51],
      ['Lincoln City', 51], ['Leyton Orient', 51], ['Wycombe Wanderers', 51], ['Mansfield Town', 50],
      ['Exeter City', 50], ['Bradford City', 50], ['Burton Albion', 49], ['Northampton Town', 49],
      ['Doncaster Rovers', 50], ['Port Vale', 49], ['Stevenage', 49], ['AFC Wimbledon', 48],
    ] },
    { name: 'League Two', ab: 0, vereine: [
      ['Notts County', 47], ['Walsall', 47], ['Chesterfield', 46], ['Swindon Town', 47],
      ['Milton Keynes Dons', 46], ['Bromley', 45], ['Salford City', 45], ['Gillingham', 45],
      ['Grimsby Town', 45], ['Crewe Alexandra', 45], ['Bristol Rovers', 45], ['Cambridge United', 44],
      ['Colchester United', 44], ['Cheltenham Town', 44], ['Fleetwood Town', 44], ['Harrogate Town', 43],
      ['Tranmere Rovers', 44], ['Accrington Stanley', 43], ['Barrow', 43], ['Newport County', 42],
      ['Oldham Athletic', 43], ['Barnet', 42], ['Crawley Town', 43], ['Shrewsbury Town', 43],
    ] },
  ],
}

export const ES: LandDaten = {
  land: 'ES', pokal: 'Copa del Rey', europa: [4, 2, 1], national: 88,
  ligen: [
    { name: 'La Liga', ab: 3, vereine: [
      ['Real Madrid', 90], ['FC Barcelona', 90], ['Atlético Madrid', 85], ['Athletic Bilbao', 78],
      ['Villarreal CF', 77], ['Real Sociedad', 76], ['Real Betis', 76], ['Sevilla FC', 72],
      ['Girona FC', 70], ['Valencia CF', 70], ['Celta de Vigo', 69], ['CA Osasuna', 67],
      ['Getafe CF', 66], ['Rayo Vallecano', 66], ['RCD Mallorca', 66], ['RCD Espanyol', 63],
      ['Deportivo Alavés', 63], ['Elche CF', 60], ['Levante UD', 60], ['Real Oviedo', 58],
    ] },
    { name: 'Segunda División', ab: 0, vereine: [
      ['UD Almería', 56], ['Granada CF', 56], ['UD Las Palmas', 57], ['Cádiz CF', 55],
      ['SD Eibar', 54], ['Málaga CF', 54], ['Deportivo La Coruña', 55], ['Sporting Gijón', 54],
      ['Real Valladolid', 55], ['CD Leganés', 56], ['Racing Santander', 53], ['Real Zaragoza', 53],
      ['Burgos CF', 50], ['CD Castellón', 52], ['CD Mirandés', 49], ['Córdoba CF', 51],
      ['Albacete Balompié', 50], ['SD Huesca', 51], ['Cultural Leonesa', 48], ['Real Sociedad B', 52],
      ['AD Ceuta', 48], ['FC Andorra', 49],
    ] },
  ],
}

export const IT: LandDaten = {
  land: 'IT', pokal: 'Coppa Italia', europa: [4, 2, 1], national: 83,
  ligen: [
    { name: 'Serie A', ab: 3, vereine: [
      ['Inter Mailand', 87], ['SSC Neapel', 86], ['Juventus Turin', 84], ['AC Mailand', 83],
      ['Atalanta Bergamo', 83], ['AS Rom', 80], ['Lazio Rom', 78], ['AC Florenz', 76],
      ['FC Bologna', 76], ['Como 1907', 70], ['FC Turin', 70], ['Udinese Calcio', 69],
      ['FC Genua', 68], ['Cagliari Calcio', 64], ['Hellas Verona', 63], ['AC Parma', 63],
      ['US Sassuolo', 63], ['US Lecce', 62], ['US Cremonese', 60], ['AC Pisa', 60],
    ] },
    { name: 'Serie B', ab: 0, vereine: [
      ['Palermo FC', 58], ['Sampdoria Genua', 57], ['Venezia FC', 57], ['Frosinone Calcio', 55],
      ['Modena FC', 53], ['US Catanzaro', 54], ['Cesena FC', 53], ['Juve Stabia', 51],
      ['Spezia Calcio', 54], ['AS Bari', 54], ['FC Südtirol', 52], ['Carrarese Calcio', 50],
      ['Mantova FC', 50], ['Reggiana', 51], ['Empoli FC', 56], ['AC Monza', 57],
      ['Calcio Padova', 50], ['US Avellino', 50], ['Virtus Entella', 49], ['Delfino Pescara', 51],
    ] },
  ],
}

export const FR: LandDaten = {
  land: 'FR', pokal: 'Coupe de France', europa: [3, 2, 1], national: 86,
  ligen: [
    { name: 'Ligue 1', ab: 3, vereine: [
      ['Paris Saint-Germain', 88], ['Olympique Marseille', 77], ['AS Monaco', 77], ['LOSC Lille', 76],
      ['Olympique Lyon', 75], ['RC Lens', 74], ['OGC Nizza', 73], ['Stade Rennes', 72],
      ['RC Straßburg', 68], ['FC Toulouse', 66], ['Stade Brest', 66], ['FC Nantes', 62],
      ['AJ Auxerre', 62], ['Le Havre AC', 60], ['SCO Angers', 58], ['FC Metz', 58],
      ['FC Lorient', 58], ['Paris FC', 58],
    ] },
    { name: 'Ligue 2', ab: 0, vereine: [
      ['AS Saint-Étienne', 56], ['Stade Reims', 58], ['HSC Montpellier', 57], ['ES Troyes', 54],
      ['EA Guingamp', 54], ['Rodez AF', 50], ['Red Star FC', 50], ['AS Nancy', 52],
      ['Pau FC', 50], ['USL Dunkerque', 50], ['Grenoble Foot 38', 49], ['Amiens SC', 51],
      ['SC Bastia', 52], ['Stade Laval', 49], ['Clermont Foot', 52], ['FC Annecy', 48], ['US Concarneau', 46],
      ['SM Caen', 52],
    ] },
  ],
}
