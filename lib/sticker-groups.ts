/**
 * FIFA World Cup 2026 — sticker album groups
 * Country names match the exact French strings in the `country` column of the `stickers` table.
 */

export interface WCGroup {
  id: string       // 'A' … 'L' | 'FWC'
  label: string    // 'GROUPE A' | 'SPÉCIAL COUPE DU MONDE'
  countries: string[]
}

export const WC_GROUPS: WCGroup[] = [
  {
    id: 'A',
    label: 'GROUPE A',
    countries: ['Mexique', 'Afrique du Sud', 'Corée du Sud', 'Tchéquie'],
  },
  {
    id: 'B',
    label: 'GROUPE B',
    countries: ['Canada', 'Bosnie-Herzégovine', 'Qatar', 'Suisse'],
  },
  {
    id: 'C',
    label: 'GROUPE C',
    countries: ['Brésil', 'Maroc', 'Haïti', 'Écosse'],
  },
  {
    id: 'D',
    label: 'GROUPE D',
    countries: ['États-Unis', 'Paraguay', 'Australie', 'Türkiye'],
  },
  {
    id: 'E',
    label: 'GROUPE E',
    countries: ['Allemagne', 'Curaçao', "Côte d'Ivoire", 'Équateur'],
  },
  {
    id: 'F',
    label: 'GROUPE F',
    countries: ['Pays-Bas', 'Japon', 'Suède', 'Tunisie'],
  },
  {
    id: 'G',
    label: 'GROUPE G',
    countries: ['Belgique', 'Égypte', 'Iran', 'Nouvelle-Zélande'],
  },
  {
    id: 'H',
    label: 'GROUPE H',
    countries: ['Espagne', 'Cap-Vert', 'Arabie Saoudite', 'Uruguay'],
  },
  {
    id: 'I',
    label: 'GROUPE I',
    countries: ['France', 'Sénégal', 'Irak', 'Norvège'],
  },
  {
    id: 'J',
    label: 'GROUPE J',
    countries: ['Argentine', 'Algérie', 'Autriche', 'Jordanie'],
  },
  {
    id: 'K',
    label: 'GROUPE K',
    countries: ['Portugal', 'RD Congo', 'Ouzbékistan', 'Colombie'],
  },
  {
    id: 'L',
    label: 'GROUPE L',
    countries: ['Angleterre', 'Croatie', 'Ghana', 'Panama'],
  },
  {
    id: 'FWC',
    label: 'SPÉCIAL COUPE DU MONDE',
    countries: ['Spécial Coupe du Monde'],
  },
  {
    id: 'CC',
    label: 'SPÉCIAL COCA-COLA',
    countries: ['Spécial Coca-Cola'],
  },
]

/** Returns the group for a given country name, or undefined */
export function getGroupForCountry(country: string): WCGroup | undefined {
  return WC_GROUPS.find((g) => g.countries.includes(country))
}

/** Returns the sort index (group position) for a country */
export function getCountrySortIndex(country: string): number {
  for (let gi = 0; gi < WC_GROUPS.length; gi++) {
    const idx = WC_GROUPS[gi].countries.indexOf(country)
    if (idx !== -1) return gi * 100 + idx
  }
  return 9999 // unknown country → end
}
