// Seed script: imports 980 stickers from panini_stickers_enriched.xlsx into Supabase
// Run: node supabase/seed_stickers.js

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env.local') })

const XLSX = require('xlsx')
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TYPE_MAP = {
  'Foil / Spécial': 'Foil/Spécial',
  "Photo d'équipe": "Photo d'équipe",
  'Joueur': 'Joueur',
}

function parseStickers() {
  const wb = XLSX.readFile(path.join(__dirname, '../panini_stickers_enriched.xlsx'))
  const ws = wb.Sheets[wb.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 })

  const stickers = []
  for (const row of rows) {
    // Valid sticker row: has code, country, number (numeric), type
    if (!Array.isArray(row) || row.length < 5) continue
    if (typeof row[2] !== 'number') continue

    const [code, country, number, name, rawType, , club] = row
    const type = TYPE_MAP[rawType]
    if (!type) continue

    stickers.push({
      code: String(code).trim(),
      country: String(country).trim(),
      number: Number(number),
      name: name ? String(name).trim() : null,
      type,
      club: club ? String(club).trim() : null,
      image_url: null,
    })
  }
  return stickers
}

async function seed() {
  console.log('Reading Excel file…')
  const stickers = parseStickers()
  console.log(`Found ${stickers.length} stickers`)

  // Insert in batches of 100
  const BATCH = 100
  let inserted = 0
  let errors = 0

  for (let i = 0; i < stickers.length; i += BATCH) {
    const batch = stickers.slice(i, i + BATCH)
    const { error } = await supabase
      .from('stickers')
      .upsert(batch, { onConflict: 'country,number' })

    if (error) {
      console.error(`Batch ${i / BATCH + 1} error:`, error.message)
      errors++
    } else {
      inserted += batch.length
      process.stdout.write(`\rInserted ${inserted}/${stickers.length}…`)
    }
  }

  console.log(`\nDone. ${inserted} stickers upserted, ${errors} batch errors.`)
}

seed().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
