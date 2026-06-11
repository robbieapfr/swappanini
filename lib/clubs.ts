export interface ClubLeague {
  league: string
  country: string
  clubs: string[]
}

export const CLUB_LEAGUES: ClubLeague[] = [
  {
    league: 'Premier League',
    country: '🏴󠁧󠁢󠁥󠁮󠁧󠁿 Angleterre',
    clubs: [
      'Arsenal', 'Aston Villa', 'Brentford', 'Brighton & Hove Albion',
      'Chelsea', 'Crystal Palace', 'Everton', 'Fulham', 'Ipswich Town',
      'Leicester City', 'Liverpool', 'Manchester City', 'Manchester United',
      'Newcastle United', 'Nottingham Forest', 'Southampton', 'Tottenham Hotspur',
      'West Ham United', 'Wolverhampton Wanderers', 'AFC Bournemouth',
    ],
  },
  {
    league: 'La Liga',
    country: '🇪🇸 Espagne',
    clubs: [
      'Athletic Club', 'Atlético de Madrid', 'FC Barcelona', 'Celta de Vigo',
      'Getafe CF', 'Girona FC', 'CD Leganés', 'RCD Mallorca', 'CA Osasuna',
      'Rayo Vallecano', 'Real Betis', 'Real Madrid', 'Real Sociedad',
      'Sevilla FC', 'Valencia CF', 'Villarreal CF', 'Real Valladolid',
      'UD Las Palmas', 'Deportivo Alavés', 'Espanyol',
    ],
  },
  {
    league: 'Bundesliga',
    country: '🇩🇪 Allemagne',
    clubs: [
      'Bayern Munich', 'Borussia Dortmund', 'Bayer Leverkusen', 'RB Leipzig',
      'Eintracht Frankfurt', 'SC Freiburg', 'VfB Stuttgart', 'Wolfsburg',
      'Borussia Mönchengladbach', 'TSG Hoffenheim', 'Mainz 05', 'Werder Bremen',
      'FC Augsburg', 'VfL Bochum', 'FC St. Pauli', 'Holstein Kiel',
      'Heidenheim', 'Union Berlin',
    ],
  },
  {
    league: 'Serie A',
    country: '🇮🇹 Italie',
    clubs: [
      'AC Milan', 'Inter Milan', 'Juventus', 'AS Roma', 'SSC Napoli',
      'Atalanta', 'Lazio', 'Fiorentina', 'Bologna', 'Torino',
      'Udinese', 'Cagliari', 'Genoa', 'Hellas Verona', 'Lecce',
      'Monza', 'Empoli', 'Como', 'Parma', 'Venezia',
    ],
  },
  {
    league: 'Ligue 1',
    country: '🇫🇷 France',
    clubs: [
      'Paris Saint-Germain', 'Olympique de Marseille', 'Olympique Lyonnais',
      'AS Monaco', 'OGC Nice', 'RC Lens', 'LOSC Lille', 'Stade Rennais',
      'Stade Brestois', 'Toulouse FC', 'RC Strasbourg', 'Stade de Reims',
      'Montpellier HSC', 'FC Nantes', 'Le Havre AC', 'Angers SCO',
      'Saint-Étienne', 'Auxerre',
    ],
  },
  {
    league: 'Eredivisie',
    country: '🇳🇱 Pays-Bas',
    clubs: [
      'Ajax', 'PSV Eindhoven', 'Feyenoord', 'AZ Alkmaar', 'FC Utrecht',
      'FC Twente', 'SC Heerenveen', 'Vitesse', 'Sparta Rotterdam',
      'Go Ahead Eagles', 'NEC Nijmegen', 'FC Groningen',
    ],
  },
  {
    league: 'Primeira Liga',
    country: '🇵🇹 Portugal',
    clubs: [
      'SL Benfica', 'FC Porto', 'Sporting CP', 'SC Braga',
      'Vitória SC', 'Casa Pia', 'Gil Vicente', 'Moreirense',
      'Rio Ave', 'Estoril Praia', 'Famalicão', 'Boavista',
    ],
  },
  {
    league: 'Super Lig',
    country: '🇹🇷 Turquie',
    clubs: [
      'Galatasaray', 'Fenerbahçe', 'Beşiktaş', 'Trabzonspor',
      'Başakşehir', 'Sivasspor', 'Kayserispor', 'Antalyaspor',
      'Konyaspor', 'Alanyaspor', 'Kasımpaşa', 'Rizespor',
    ],
  },
  {
    league: 'Pro League',
    country: '🇧🇪 Belgique',
    clubs: [
      'Club Brugge', 'RSC Anderlecht', 'KAA Gent', 'Standard de Liège',
      'Royal Antwerp', 'KRC Genk', 'Union Saint-Gilloise', 'Cercle Brugge',
      'OH Leuven', 'Beerschot',
    ],
  },
  {
    league: 'Scottish Premiership',
    country: '🏴󠁧󠁢󠁳󠁣󠁴󠁿 Écosse',
    clubs: [
      'Celtic', 'Rangers', 'Heart of Midlothian', 'Hibernian',
      'Aberdeen', 'Kilmarnock', 'Motherwell', 'St Mirren',
    ],
  },
  {
    league: 'Liga MX',
    country: '🇲🇽 Mexique',
    clubs: [
      'Club América', 'Chivas Guadalajara', 'Cruz Azul', 'UNAM Pumas',
      'Tigres UANL', 'CF Monterrey', 'Toluca', 'Atlas',
      'Santos Laguna', 'León', 'Necaxa', 'Pachuca',
    ],
  },
  {
    league: 'MLS',
    country: '🇺🇸 États-Unis',
    clubs: [
      'Inter Miami CF', 'LA Galaxy', 'LAFC', 'Seattle Sounders',
      'New York City FC', 'New York Red Bulls', 'Atlanta United',
      'Portland Timbers', 'Austin FC', 'Columbus Crew',
      'FC Cincinnati', 'Nashville SC', 'St. Louis City SC',
    ],
  },
  {
    league: 'Brasileirão',
    country: '🇧🇷 Brésil',
    clubs: [
      'Flamengo', 'Palmeiras', 'Corinthians', 'São Paulo FC',
      'Santos', 'Atlético Mineiro', 'Fluminense', 'Grêmio',
      'Internacional', 'Vasco da Gama', 'Botafogo', 'Fortaleza',
    ],
  },
  {
    league: 'Primera División',
    country: '🇦🇷 Argentine',
    clubs: [
      'River Plate', 'Boca Juniors', 'Racing Club', 'Independiente',
      'San Lorenzo', 'Estudiantes', 'Vélez Sársfield', 'Huracán',
      'Lanús', 'Banfield', 'Talleres', 'Belgrano',
    ],
  },
  {
    league: 'Saudi Pro League',
    country: '🇸🇦 Arabie Saoudite',
    clubs: [
      'Al-Hilal', 'Al-Nassr', 'Al-Ittihad', 'Al-Ahli',
      'Al-Qadsiah', 'Al-Shabab', 'Al-Fayha', 'Al-Taawoun',
    ],
  },
]
