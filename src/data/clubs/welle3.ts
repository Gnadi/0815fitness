import type { LandDaten } from './types'

const liga = (name: string, vereine: [string, number][]) => ({ name, ab: 0, vereine })
const land = (
  l: string, pokal: string, europa: [number, number, number], national: number,
  ligaName: string, vereine: [string, number][], gesperrt = false,
): LandDaten => ({ land: l, pokal, europa, national, gesperrt, ligen: [liga(ligaName, vereine)] })

export const SK = land('SK', 'Slowakischer Pokal', [0, 1, 1], 70, 'Fortuna Liga', [
  ['Slovan Bratislava', 56], ['Spartak Trnava', 50], ['MŠK Žilina', 48], ['DAC Dunajská Streda', 50],
  ['Ružomberok', 46], ['Podbrezová', 44], ['Zemplín Michalovce', 42], ['Komárno', 42],
  ['Trenčín', 44], ['Skalica', 40], ['Tatran Prešov', 42], ['Košice', 42],
])
export const SI = land('SI', 'Slowenischer Pokal', [0, 1, 1], 66, 'PrvaLiga', [
  ['NK Olimpija Ljubljana', 50], ['NK Celje', 50], ['NK Maribor', 48], ['NŠ Mura', 44],
  ['NK Koper', 42], ['NK Bravo', 42], ['NK Radomlje', 40], ['NK Domžale', 40],
  ['NK Aluminij', 38], ['NK Primorje', 38],
])
export const BG = land('BG', 'Bulgarischer Pokal', [0, 1, 1], 66, 'efbet Liga', [
  ['Ludogorez Rasgrad', 54], ['Lewski Sofia', 52], ['ZSKA Sofia', 50], ['Lokomotive Plowdiw', 46],
  ['Botew Plowdiw', 46], ['Cherno More Warna', 44], ['Slavia Sofia', 44], ['Arda Kardschali', 44],
  ['Beroe Stara Sagora', 42], ['ZSKA 1948', 42], ['Levski Lom', 38], ['Montana', 38],
])
export const CY = land('CY', 'Zypriotischer Pokal', [0, 1, 1], 62, 'First Division', [
  ['APOEL Nikosia', 52], ['Omonia Nikosia', 52], ['Aris Limassol', 50], ['AEK Larnaka', 50],
  ['Pafos FC', 50], ['Apollon Limassol', 48], ['Anorthosis Famagusta', 46], ['Ethnikos Achna', 38],
  ['Olympiakos Nikosia', 38], ['Enosis Neon Paralimni', 38], ['Karmiotissa', 38], ['AEL Limassol', 40],
])
export const FI = land('FI', 'Finnischer Pokal', [0, 1, 1], 66, 'Veikkausliiga', [
  ['HJK Helsinki', 50], ['KuPS Kuopio', 46], ['Inter Turku', 44], ['FC Lahti', 42],
  ['SJK Seinäjoki', 42], ['FC Haka', 40], ['Ilves Tampere', 42], ['VPS Vaasa', 38],
  ['AC Oulu', 38], ['IFK Mariehamn', 36], ['Gnistan', 36], ['KTP Kotka', 34],
])
export const IE = land('IE', 'FAI Cup', [0, 1, 1], 64, 'League of Ireland Premier Division', [
  ['Shelbourne', 42], ['Shamrock Rovers', 44], ['Derry City', 42], ['Bohemians Dublin', 40],
  ['St Patrick\'s Athletic', 40], ['Sligo Rovers', 36], ['Drogheda United', 36], ['Waterford', 34],
  ['Galway United', 34], ['Cork City', 36],
])
export const IS = land('IS', 'Isländischer Pokal', [0, 1, 1], 58, 'Besta deild karla', [
  ['Víkingur Reykjavík', 40], ['Breiðablik', 42], ['Valur', 40], ['KR Reykjavík', 38],
  ['Stjarnan', 38], ['FH Hafnarfjörður', 38], ['KA Akureyri', 36], ['ÍA Akranes', 34],
  ['Fram Reykjavík', 36], ['Vestri', 32], ['ÍBV', 34], ['Afturelding', 30],
])
export const NI = land('NI', 'Irish Cup', [0, 1, 1], 62, 'NIFL Premiership', [
  ['Linfield', 40], ['Larne', 40], ['Cliftonville', 38], ['Glentoran', 38],
  ['Crusaders', 36], ['Coleraine', 36], ['Glenavon', 34], ['Dungannon Swifts', 32],
  ['Portadown', 32], ['Ballymena United', 32], ['Carrick Rangers', 30], ['Loughgall', 30],
])
export const WA = land('WA', 'Welsh Cup', [0, 1, 1], 66, 'Cymru Premier', [
  ['The New Saints', 40], ['Connah\'s Quay Nomads', 34], ['Bala Town', 32], ['Penybont', 32],
  ['Barry Town United', 30], ['Cardiff Metropolitan', 30], ['Haverfordwest County', 30], ['Caernarfon Town', 28],
  ['Colwyn Bay', 28], ['Llandudno', 28], ['Flint Town United', 26], ['Newtown', 26],
])
export const BA = land('BA', 'Bosnischer Pokal', [0, 1, 1], 66, 'Premijer Liga', [
  ['FK Borac Banja Luka', 44], ['FK Željezničar Sarajevo', 44], ['FK Sarajevo', 44], ['HŠK Zrinjski Mostar', 44],
  ['FK Velež Mostar', 40], ['FK Tuzla City', 38], ['FK Radnik Bijeljina', 36], ['NK Široki Brijeg', 36],
  ['FK Sloboda Tuzla', 36], ['NK Posušje', 34],
])
export const AL = land('AL', 'Albanischer Pokal', [0, 1, 1], 66, 'Kategoria Superiore', [
  ['KF Egnatia', 42], ['KF Vllaznia', 40], ['KF Partizani Tirana', 40], ['KF Tirana', 40],
  ['KF Dinamo City', 38], ['KF Teuta Durrës', 38], ['KF Elbasani', 34], ['KF Bylis', 34],
  ['KF Laçi', 32], ['KF Skënderbeu Korçë', 32],
])
export const MK = land('MK', 'Mazedonischer Pokal', [0, 1, 1], 62, 'Prva Liga', [
  ['FK Shkupi', 38], ['KF Struga', 36], ['FK Vardar Skopje', 36], ['FK Sileks', 34],
  ['FK Rabotnički', 34], ['FK Brera', 32], ['FK Makedonija Gjorče Petrov', 30], ['FK Tikvesh', 30],
  ['KF Shkëndija', 38], ['FK Bashkimi', 30],
])
export const ME = land('ME', 'Montenegrinischer Pokal', [0, 1, 1], 58, 'Prva CFL', [
  ['FK Buducnost Podgorica', 38], ['FK Decić Tuzi', 34], ['FK Sutjeska Nikšić', 34], ['FK Iskra Danilovgrad', 30],
  ['OFK Petrovac', 30], ['FK Mornar Bar', 32], ['FK Jedinstvo Bijelo Polje', 28], ['FK Dečić', 28],
  ['FK Podgorica', 30], ['FK Arsenal Tivat', 28],
])
export const XK = land('XK', 'Kosovarischer Pokal', [0, 1, 1], 60, 'Superliga e Kosovës', [
  ['FC Ballkani', 40], ['KF Drita', 38], ['FC Prishtina', 36], ['KF Malisheva', 32],
  ['KF Llapi', 32], ['KF Gjilani', 30], ['KF Dukagjini', 30], ['KF Arbëria', 28],
  ['KF Trepça\'89', 30], ['KF Ferizaj', 28],
])
export const AZ = land('AZ', 'Aserbaidschanischer Pokal', [0, 1, 1], 60, 'Premyer Liqa', [
  ['Qarabağ Ağdam', 56], ['FK Neftçi Baku', 44], ['FK Zira', 40], ['Sabah FK', 40],
  ['FK Araz-Naxçıvan', 38], ['Sumgayit FK', 38], ['FK Kapaz', 36], ['Turan Tovuz', 34],
])
export const AM = land('AM', 'Armenischer Pokal', [0, 1, 1], 58, 'Premier League', [
  ['FC Noah', 38], ['FC Ararat-Armenia', 38], ['FC Pyunik', 36], ['FC Urartu', 34],
  ['Shirak Gyumri', 32], ['FC Alashkert', 34], ['Van Yerevan', 30], ['Gandzasar Kapan', 28],
])
export const GE = land('GE', 'Georgischer Pokal', [0, 1, 1], 66, 'Erovnuli Liga', [
  ['Dinamo Tiflis', 40], ['Dinamo Batumi', 38], ['FC Iberia 1999', 34], ['Torpedo Kutaissi', 34],
  ['FC Samgurali', 30], ['Dila Gori', 30], ['FC Telavi', 30], ['Saburtalo Tiflis', 32],
  ['Spaeri', 28], ['FC Gagra', 28],
])
export const KZ = land('KZ', 'Kasachischer Pokal', [0, 1, 1], 62, 'Premjer-Liga', [
  ['FK Astana', 48], ['FC Kairat Almaty', 48], ['FK Aktobe', 40], ['Tobol Kostanai', 40],
  ['FC Ordabasy', 36], ['FK Kaisar', 34], ['FC Atyrau', 34], ['FC Zhetysu', 32],
  ['Okzhetpes', 30], ['FC Aksu', 30],
])
export const BY = land('BY', 'Belarussischer Pokal', [0, 1, 1], 58, 'Wyschejschaja Liha', [
  ['BATE Borissow', 42], ['Dinamo Brest', 40], ['FK Neman Grodno', 38], ['Dinamo Minsk', 38],
  ['Schachzjor Salihorsk', 38], ['Torpedo-BelAZ Schodsina', 34], ['FK Minsk', 34], ['Slavia Mosyr', 32],
  ['Isloch Minsk', 32], ['FK Gomel', 30],
])
export const MD = land('MD', 'Moldauischer Pokal', [0, 1, 1], 56, 'Super Liga', [
  ['FC Sheriff Tiraspol', 44], ['Petrocub Hîncești', 36], ['Zimbru Chișinău', 34], ['FC Milsami Orhei', 34],
  ['FC Bălți', 30], ['Dacia Buiucani', 30], ['FC Florești', 28], ['Sfântul Gheorghe', 28],
])
export const LT = land('LT', 'Litauischer Pokal', [0, 1, 1], 56, 'A Lyga', [
  ['FK Žalgiris Vilnius', 38], ['FK Panevėžys', 34], ['FA Šiauliai', 32], ['Kauno Žalgiris', 32],
  ['Hegelmann Litauen', 30], ['FK Riteriai', 30], ['Banga Gargždai', 28], ['Dainava Alytus', 26],
])
export const LV = land('LV', 'Lettischer Pokal', [0, 1, 1], 56, 'Virslīga', [
  ['Rīgas FS', 36], ['RFS Riga', 36], ['FK Auda', 32], ['FK Liepāja', 32],
  ['Valmiera FC', 32], ['Daugavpils', 28], ['Metta', 28], ['Jelgava', 28], ['Tukums 2000', 26], ['Grobiņa', 26],
])
export const EE = land('EE', 'Estnischer Pokal', [0, 1, 1], 54, 'Meistriliiga', [
  ['FC Flora Tallinn', 36], ['Nõmme Kalju', 34], ['FCI Levadia', 36], ['Paide Linnameeskond', 30],
  ['Tallinna Kalev', 28], ['Tartu Tammeka', 28], ['Narva Trans', 28], ['Pärnu Vaprus', 26],
  ['Harju JK', 24], ['Maardu Linnameeskond', 24],
])
export const LU = land('LU', 'Luxemburger Pokal', [0, 1, 1], 56, 'BGL Ligue', [
  ['F91 Düdelingen', 32], ['FC Differdingen 03', 32], ['Swift Hesperingen', 30], ['Union Titus Petingen', 28],
  ['FC Progrès Niederkorn', 28], ['FC Víkingur', 26], ['US Rumelange', 26], ['Racing FC Union', 28],
  ['Jeunesse Esch', 26], ['FC Mondercange', 24],
])
export const MT = land('MT', 'Maltesischer Pokal', [0, 1, 1], 50, 'Maltese Premier League', [
  ['Ħamrun Spartans', 32], ['Floriana', 28], ['Valletta', 28], ['Birkirkara', 28],
  ['Marsaxlokk', 24], ['Sirens', 24], ['Gżira United', 24], ['Mosta', 24],
  ['Hibernians Paola', 26], ['Balzan', 22], ['Tarxien Rainbows', 22], ['Żebbuġ Rangers', 22],
])
export const FO = land('FO', 'Färöischer Pokal', [0, 1, 1], 48, 'Betri deildin', [
  ['KÍ Klaksvík', 30], ['HB Tórshavn', 28], ['B36 Tórshavn', 26], ['NSÍ Runavík', 26],
  ['Víkingur Gøta', 24], ['EB/Streymur', 22], ['Skála ÍF', 22], ['07 Vestur', 20],
  ['TB Tvøroyri', 20], ['Argja Bóltfelag', 20],
])
export const GI = land('GI', 'Rock Cup', [0, 0, 1], 40, 'Gibraltar Football League', [
  ['Lincoln Red Imps', 24], ['Europa FC', 22], ['St Joseph\'s', 22], ['Bruno\'s Magpies', 20],
  ['Mons Calpe', 18], ['Lynx FC', 18], ['Glacis United', 18], ['Manchester 62', 18],
])
export const AD = land('AD', 'Copa Constitució', [0, 0, 1], 38, 'Primera Divisió', [
  ['Inter Club d\'Escaldes', 22], ['UE Santa Coloma', 22], ['FC Santa Coloma', 22], ['Atlètic Club d\'Escaldes', 20],
  ['FC Ordino', 18], ['UE Engordany', 18], ['Penya Encarnada', 18], ['FC Lusitanos', 16],
])
export const SM = land('SM', 'Coppa Titano', [0, 0, 1], 36, 'Campionato Sammarinese', [
  ['La Fiorita', 20], ['Tre Penne', 20], ['Virtus', 18], ['Folgore', 18],
  ['Pennarossa', 16], ['Cosmos', 16], ['Faetano', 16], ['Domagnano', 16],
])
export const LI = land('LI', 'Liechtensteiner Cup', [0, 0, 0], 38, 'Liechtensteiner Meisterschaft', [
  ['FC Vaduz II', 24], ['FC Balzers', 22], ['FC Triesen', 20], ['USV Eschen/Mauren', 22],
  ['FC Ruggell', 18], ['FC Schaan', 18], ['FC Triesenberg', 18], ['FC Balzers II', 16],
])
export const RU = land('RU', 'Russland-Pokal', [0, 0, 0], 70, 'Premjer-Liga', [
  ['Zenit St. Petersburg', 64], ['Krasnodar', 62], ['Spartak Moskau', 58], ['ZSKA Moskau', 58],
  ['Lokomotive Moskau', 56], ['Dynamo Moskau', 56], ['Rubin Kasan', 50], ['Achmat Grosny', 48],
  ['Orenburg', 46], ['Nischni Nowgorod', 44], ['Krylja Sowetow Samara', 46], ['Rostow', 46],
  ['Baltika Kaliningrad', 46], ['Sotschi', 44], ['Machatschkala', 44], ['Pari NN', 44],
], true)
