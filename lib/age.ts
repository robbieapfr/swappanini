// Shared helpers for the birth-year field (works on both client and server).

/** Age in years computed from a birth year, or null if missing/implausible. */
export function computeAge(birthYear: number | null | undefined): number | null {
  if (!birthYear) return null
  const age = new Date().getFullYear() - birthYear
  return age >= 0 && age <= 130 ? age : null
}

/** Parse free-text into a plausible birth year (age 4–120), or null. */
export function parseBirthYear(raw: string): number | null {
  const n = parseInt(raw, 10)
  const current = new Date().getFullYear()
  if (Number.isNaN(n) || n < current - 120 || n > current - 4) return null
  return n
}
