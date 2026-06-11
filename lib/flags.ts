/**
 * Maps the 3-letter country codes used in the Panini WC 2026 sticker catalogue
 * to their ISO 3166-1 alpha-2 codes (used by flagcdn.com).
 * Subdivision flags (England, Scotland) use flagcdn.com's subdivision format.
 */
const CODE_TO_ISO2: Record<string, string> = {
  // North / Central America
  USA: 'us', CAN: 'ca', MEX: 'mx', CRC: 'cr', PAN: 'pa',
  HAI: 'ht', JAM: 'jm', HON: 'hn', SLV: 'sv', TRI: 'tt', CUW: 'cw',
  // South America
  BRA: 'br', ARG: 'ar', URU: 'uy', COL: 'co', CHI: 'cl',
  ECU: 'ec', PER: 'pe', PAR: 'py', VEN: 've', BOL: 'bo',
  // Europe
  FRA: 'fr', ESP: 'es', GER: 'de', ENG: 'gb-eng', POR: 'pt',
  NED: 'nl', BEL: 'be', CRO: 'hr', SUI: 'ch', AUT: 'at',
  DEN: 'dk', SWE: 'se', NOR: 'no', SCO: 'gb-sct', WAL: 'gb-wls',
  POL: 'pl', CZE: 'cz', SVK: 'sk', HUN: 'hu', ROU: 'ro',
  SRB: 'rs', SVN: 'si', ALB: 'al', TUR: 'tr', UKR: 'ua',
  GEO: 'ge', GRE: 'gr', BIH: 'ba',
  // Africa
  MAR: 'ma', SEN: 'sn', NGA: 'ng', EGY: 'eg', CMR: 'cm',
  GHA: 'gh', MLI: 'ml', CIV: 'ci', TUN: 'tn', ZAM: 'zm',
  ANG: 'ao', BFA: 'bf', GAB: 'ga', GUI: 'gn', DRC: 'cd',
  RSA: 'za', ZIM: 'zw', KEN: 'ke', ETH: 'et', TAN: 'tz',
  MOZ: 'mz', UGA: 'ug', RWA: 'rw', BEN: 'bj', TOG: 'tg',
  ALG: 'dz', CPV: 'cv',
  // Asia / Oceania
  JPN: 'jp', KOR: 'kr', SAU: 'sa', IRN: 'ir', AUS: 'au',
  QAT: 'qa', CHN: 'cn', UAE: 'ae', JOR: 'jo', IRQ: 'iq',
  UZB: 'uz', THA: 'th', VIE: 'vn', IND: 'in', IDN: 'id',
  NZL: 'nz', FIJ: 'fj',
}

/** Returns a flagcdn.com image URL for a 3-letter FIFA code, or '' if not found */
export function getFlagUrl(code: string): string {
  if (!code) return ''
  const iso2 = CODE_TO_ISO2[code.slice(0, 3).toUpperCase()]
  if (!iso2) return ''
  return `https://flagcdn.com/w40/${iso2}.png`
}

/** Legacy emoji fallback — may not render on Windows */
const CODE_TO_FLAG: Record<string, string> = {
  USA: '🇺🇸', CAN: '🇨🇦', MEX: '🇲🇽', FRA: '🇫🇷', ESP: '🇪🇸',
  GER: '🇩🇪', ENG: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', POR: '🇵🇹', NED: '🇳🇱', BEL: '🇧🇪',
  CRO: '🇭🇷', SUI: '🇨🇭', AUT: '🇦🇹', DEN: '🇩🇰', SWE: '🇸🇪',
  NOR: '🇳🇴', SCO: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', BRA: '🇧🇷', ARG: '🇦🇷', URU: '🇺🇾',
  COL: '🇨🇴', ECU: '🇪🇨', PAR: '🇵🇾', MAR: '🇲🇦', SEN: '🇸🇳',
  EGY: '🇪🇬', GHA: '🇬🇭', CIV: '🇨🇮', TUN: '🇹🇳', DRC: '🇨🇩',
  RSA: '🇿🇦', ALG: '🇩🇿', BIH: '🇧🇦', CPV: '🇨🇻', CUW: '🇨🇼',
  JPN: '🇯🇵', KOR: '🇰🇷', SAU: '🇸🇦', IRN: '🇮🇷', AUS: '🇦🇺',
  QAT: '🇶🇦', JOR: '🇯🇴', IRQ: '🇮🇶', UZB: '🇺🇿', NZL: '🇳🇿',
  PAN: '🇵🇦', HAI: '🇭🇹', CRC: '🇨🇷',
}

/** Returns flag emoji for a 3-letter sticker code, or '' if not found */
export function getFlag(code: string): string {
  if (!code) return ''
  return CODE_TO_FLAG[code.slice(0, 3).toUpperCase()] ?? ''
}
