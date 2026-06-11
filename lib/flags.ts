/**
 * Canonical country data keyed by the exact French name stored in the
 * `stickers.country` column. Keying by country name (instead of the DB `code`,
 * which uses inconsistent FIFA conventions like KSA / COD) makes flags and
 * display codes reliable.
 *
 * - code  : 3-letter code shown on the sticker (FIFA style, as printed on Panini)
 * - iso2  : ISO 3166-1 alpha-2 used by flagcdn.com (subdivisions use gb-xxx)
 * - emoji : used instead of a flag image for the special collections
 */
interface CountryInfo {
  code: string
  iso2?: string
  emoji?: string
}

const COUNTRIES: Record<string, CountryInfo> = {
  // Group A
  'Mexique': { code: 'MEX', iso2: 'mx' },
  'Afrique du Sud': { code: 'RSA', iso2: 'za' },
  'Corée du Sud': { code: 'KOR', iso2: 'kr' },
  'Tchéquie': { code: 'CZE', iso2: 'cz' },
  // Group B
  'Canada': { code: 'CAN', iso2: 'ca' },
  'Bosnie-Herzégovine': { code: 'BIH', iso2: 'ba' },
  'Qatar': { code: 'QAT', iso2: 'qa' },
  'Suisse': { code: 'SUI', iso2: 'ch' },
  // Group C
  'Brésil': { code: 'BRA', iso2: 'br' },
  'Maroc': { code: 'MAR', iso2: 'ma' },
  'Haïti': { code: 'HAI', iso2: 'ht' },
  'Écosse': { code: 'SCO', iso2: 'gb-sct' },
  // Group D
  'États-Unis': { code: 'USA', iso2: 'us' },
  'Paraguay': { code: 'PAR', iso2: 'py' },
  'Australie': { code: 'AUS', iso2: 'au' },
  'Türkiye': { code: 'TUR', iso2: 'tr' },
  // Group E
  'Allemagne': { code: 'GER', iso2: 'de' },
  'Curaçao': { code: 'CUW', iso2: 'cw' },
  "Côte d'Ivoire": { code: 'CIV', iso2: 'ci' },
  'Équateur': { code: 'ECU', iso2: 'ec' },
  // Group F
  'Pays-Bas': { code: 'NED', iso2: 'nl' },
  'Japon': { code: 'JPN', iso2: 'jp' },
  'Suède': { code: 'SWE', iso2: 'se' },
  'Tunisie': { code: 'TUN', iso2: 'tn' },
  // Group G
  'Belgique': { code: 'BEL', iso2: 'be' },
  'Égypte': { code: 'EGY', iso2: 'eg' },
  'Iran': { code: 'IRN', iso2: 'ir' },
  'Nouvelle-Zélande': { code: 'NZL', iso2: 'nz' },
  // Group H
  'Espagne': { code: 'ESP', iso2: 'es' },
  'Cap-Vert': { code: 'CPV', iso2: 'cv' },
  'Arabie Saoudite': { code: 'KSA', iso2: 'sa' },
  'Uruguay': { code: 'URU', iso2: 'uy' },
  // Group I
  'France': { code: 'FRA', iso2: 'fr' },
  'Sénégal': { code: 'SEN', iso2: 'sn' },
  'Irak': { code: 'IRQ', iso2: 'iq' },
  'Norvège': { code: 'NOR', iso2: 'no' },
  // Group J
  'Argentine': { code: 'ARG', iso2: 'ar' },
  'Algérie': { code: 'ALG', iso2: 'dz' },
  'Autriche': { code: 'AUT', iso2: 'at' },
  'Jordanie': { code: 'JOR', iso2: 'jo' },
  // Group K
  'Portugal': { code: 'POR', iso2: 'pt' },
  'RD Congo': { code: 'COD', iso2: 'cd' },
  'Ouzbékistan': { code: 'UZB', iso2: 'uz' },
  'Colombie': { code: 'COL', iso2: 'co' },
  // Group L
  'Angleterre': { code: 'ENG', iso2: 'gb-eng' },
  'Croatie': { code: 'CRO', iso2: 'hr' },
  'Ghana': { code: 'GHA', iso2: 'gh' },
  'Panama': { code: 'PAN', iso2: 'pa' },
  // Specials — rendered with an emoji emblem instead of a flag image
  'Spécial Coupe du Monde': { code: 'FWC', emoji: '🏆' },
  'Spécial Coca-Cola': { code: 'CC', emoji: '🥤' },
}

/** flagcdn.com image URL for a country (French name), or '' if none/special */
export function getFlagUrlByCountry(country: string): string {
  const info = COUNTRIES[country]
  if (!info?.iso2) return ''
  return `https://flagcdn.com/w40/${info.iso2}.png`
}

/** Emoji emblem for special collections (🏆 / 🥤), or '' for regular countries */
export function getCountryEmoji(country: string): string {
  return COUNTRIES[country]?.emoji ?? ''
}

/** 3-letter display code for a country, falling back to a provided code */
export function getDisplayCode(country: string, fallback = ''): string {
  return COUNTRIES[country]?.code ?? (fallback ? fallback.slice(0, 3).toUpperCase() : '')
}
