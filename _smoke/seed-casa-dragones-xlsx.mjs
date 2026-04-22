// Seed the remaining Casa Dragones cocktails from the xlsx database export
// that aren't yet in the workspace. Parses the sheet inline from its already-
// unzipped xml at /tmp/xlsx_dump/xl/worksheets/sheet1.xml.
//
// Adds ~26 cocktails. Recipes are parsed into ingredients + method where
// present; entries without a recipe get tasting-notes venue context.
// Adds "Berenice Morales" as a new creator.
//
// Image URLs in the xlsx redirect to monday.com sign-in, so they're stored
// as-is (mostly useless) and hero images are left to the orb gradient.
//
// Idempotent: deletes existing rows by slug before insert.
// Run: node --env-file=.env.local _smoke/seed-casa-dragones-xlsx.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── 1. Workspace + existing catalog ─────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id, name')
  .eq('slug', 'casa-dragones')
  .maybeSingle()
if (!ws) {
  console.error('No workspace "casa-dragones"')
  process.exit(1)
}

const { data: products } = await admin
  .from('global_products')
  .select('id, expression')
  .eq('brand', 'Casa Dragones')
const productByExpr = new Map((products ?? []).map((p) => [p.expression, p.id]))
const blancoId = productByExpr.get('Blanco')
const anejoId = productByExpr.get('Añejo Barrel Blend')
const reposadoId = productByExpr.get('Reposado Mizunara')

const { data: existingCocktails } = await admin
  .from('cocktails')
  .select('slug')
  .eq('workspace_id', ws.id)
const existingSlugs = new Set((existingCocktails ?? []).map((c) => c.slug))

// ─── 2. Parse xlsx ──────────────────────────────────────────────────
const srcPath = process.argv[2] ?? '/tmp/xlsx_dump/xl/worksheets/sheet1.xml'
console.log(`→ reading ${srcPath}`)
const xml = await readFile(srcPath, 'utf8')
const rowRe = /<row r="(\d+)"[^>]*>(.*?)<\/row>/gs
const cellRe = /<c r="([A-Z]+)(\d+)"[^>]*>(?:<v>((?:(?!<\/v>).)*)<\/v>)?<\/c>/gs

const rows = {}
for (const m of xml.matchAll(rowRe)) {
  const cells = {}
  for (const c of [...m[2].matchAll(cellRe)]) {
    cells[c[1]] = (c[3] ?? '')
      .replace(/&amp;/g, '&')
      .replace(/&apos;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
  }
  rows[Number(m[1])] = cells
}

const slugify = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

// ─── 3. Build cocktail specs ────────────────────────────────────────
// Helpers ----------------------------------------------------------------
function seasonList(raw) {
  const s = raw.toLowerCase()
  const out = []
  if (s.includes('spring')) out.push('Spring')
  if (s.includes('summer')) out.push('Summer')
  if (s.includes('fall') || s.includes('autumn')) out.push('Fall')
  if (s.includes('winter')) out.push('Winter')
  return out
}
function occasions(raw) {
  const s = raw.toLowerCase()
  const out = []
  if (s.includes('mx independence') || s.includes('independence')) out.push('Independence')
  if (s.includes('reserve')) out.push('Reserve')
  if (s.includes('on-premise')) out.push('On-premise')
  if (s.includes('margarita')) out.push('Margarita')
  return out
}
function productId(raw) {
  const s = raw.toLowerCase()
  if (s.includes('añejo') || s.includes('anejo')) return anejoId
  if (s.includes('reposado')) return reposadoId
  return blancoId
}
function expressionLabel(raw) {
  const s = raw.toLowerCase()
  if (s.includes('añejo') || s.includes('anejo')) return 'Añejo Barrel Blend'
  if (s.includes('reposado')) return 'Reposado Mizunara'
  return 'Blanco'
}
// A generic orb per product to break the monotony in the grid view
function orbFor(raw) {
  const s = raw.toLowerCase()
  if (s.includes('añejo') || s.includes('anejo')) return { from: '#f8d296', to: '#a2652b' }
  if (s.includes('reposado')) return { from: '#f7e0b0', to: '#c08940' }
  return { from: '#f6f0da', to: '#cbb27a' }
}
function categoryFromName(name) {
  const n = name.toLowerCase()
  if (n.includes('margarita')) return 'Margarita'
  if (n.includes('martini')) return 'Martini'
  if (n.includes('highball')) return 'Highball'
  if (n.includes('paloma')) return 'Paloma'
  if (n.includes('mule')) return 'Mule'
  if (n.includes('toddy') || n.includes('hot toddy')) return 'Hot Cocktail'
  if (n.includes('sour') || n.includes('smash') || n.includes('sparkle')) return 'Sour'
  if (n.includes('punch')) return 'Punch'
  if (n.includes('clericot') || n.includes('sangria')) return 'Wine Cocktail'
  if (n.includes('michelada')) return 'Beer Cocktail'
  return 'Signature'
}
// Parse a recipe string into { ingredients: [...], methodSteps: [...] }
function parseRecipe(raw) {
  if (!raw || !raw.trim()) return { ingredients: [], methodSteps: [] }
  // Normalize fraction glyphs
  let text = raw
    .replace(/1⁄2/g, '½')
    .replace(/1⁄4/g, '¼')
    .replace(/3⁄4/g, '¾')
    .replace(/1⁄3/g, '⅓')
    .replace(/2⁄3/g, '⅔')

  // Split lines, drop empty ones
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  // Heuristic: an ingredient line starts with a quantity token (½, ¾, 1, 2, 3 oz/tsp/tbsp/dash/drops/bar spoon/barspoon, etc.)
  const qtyRe =
    /^(?:[\d\s½¼¾⅓⅔]+\s*)?(?:oz|tsp|tbsp|dash(?:es)?|drops?|barspoon|bar\s*spoon|cups?|litres?|g|ml|pc|slices?|sprig)/i
  // Or starts with "Slice of", "Lemon peel", "Garnish:" etc.
  const garnishHeadRe = /^(?:slice|garnish|lemon|lime|orange|grapefruit|pear|spiraled|skewer|hoja|cloves?|white flowers|basil leaves|mint|sprig|rim|peel|zest)/i

  const ingredients = []
  const methodLines = []
  for (const line of lines) {
    // Skip 'Glassware: X' or 'Garnish: X' pseudo-lines — they become notes on the dish
    if (/^(glassware|garnish|garnishes?):/i.test(line)) {
      methodLines.push(line)
      continue
    }
    // If line looks like ingredient (has an oz/etc. amount), add as ingredient
    if (qtyRe.test(line) || /^[\d\s½¼¾⅓⅔]+\s+[a-zA-Z]/.test(line)) {
      ingredients.push(line)
      continue
    }
    // Short line with a garnish-ish lead word, likely ingredient-style garnish
    if (line.length < 80 && garnishHeadRe.test(line)) {
      ingredients.push(line)
      continue
    }
    // Otherwise it's a method sentence
    methodLines.push(line)
  }

  // Map to ingredient rows with name + amount split
  const amountRe = /^([\d\s½¼¾⅓⅔]+\s*(?:oz|tsp|tbsp|dash(?:es)?|drops?|barspoon|bar\s*spoon|cups?|litres?|g|ml|pc|slices?|sprig)?)\s+(.+)$/i
  const ingRows = ingredients.map((line) => {
    // Remove asterisks or footnote markers at end
    const cleaned = line.replace(/\*+$/, '').trim()
    const m = cleaned.match(amountRe)
    if (m) {
      return { amount_text: m[1].trim(), name: m[2].trim() }
    }
    return { amount_text: null, name: cleaned }
  })

  // Join sentences into step blocks. Each sentence-ish line becomes a step.
  // Break long paragraphs into sentences (keep max 4 steps).
  const joined = methodLines.join(' ').replace(/\s+/g, ' ').trim()
  const rawSteps = joined ? joined.match(/[^.!?]+[.!?]?/g) : []
  const methodSteps = (rawSteps ?? [])
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 6)

  return { ingredients: ingRows, methodSteps }
}

// Name-level skip: placeholders and naming-variants of cocktails already in the DB.
const SKIP = new Set([
  'TBD',
  'Stuck in Summer Love', // alias for existing "Stuck in a Summer Love"
  'Winter Flowers',       // alias for existing "Winter Flower"
  'The Micheloma',        // alias for existing "Micheloma"
  'Casa Dragones Blanco Cocktail', // generic placeholder
])

// In-xlsx dedup: some rows repeat slugs (e.g. "La Catrina" appears twice).
const seenSlugs = new Set()

const maxRow = Math.max(...Object.keys(rows).map(Number))
const specs = []
for (let r = 4; r <= maxRow; r++) {
  const row = rows[r]
  if (!row) continue
  const name = row.A?.trim()
  if (!name || SKIP.has(name)) continue
  const slug = slugify(name)
  if (existingSlugs.has(slug)) {
    console.log(`· skip ${name} (${slug}) — already in workspace`)
    continue
  }
  if (seenSlugs.has(slug)) {
    console.log(`· skip ${name} (${slug}) — duplicate within xlsx`)
    continue
  }
  seenSlugs.add(slug)
  const { ingredients, methodSteps } = parseRecipe(row.E ?? '')
  const tequilaRaw = row.G ?? 'Casa Dragones Blanco'
  const creator = (row.H ?? '').trim()
  const venue = (row.K ?? '').trim()
  const market = (row.J ?? '').trim()
  const season = row.F ?? ''
  const orb = orbFor(tequilaRaw)
  const category = categoryFromName(name)

  // Build a short tasting-note from available signals
  const contextBits = []
  if (creator && creator !== 'NA') contextBits.push(`${creator}'s build`)
  if (venue && venue !== 'NA') contextBits.push(`at ${venue}`)
  if (market && market !== 'NA') contextBits.push(`(${market})`)
  const contextPrefix = contextBits.join(' ')
  const base = `${expressionLabel(tequilaRaw)} · ${season || 'Year-round'}.`
  const tasting_notes = ingredients.length === 0
    ? `${contextPrefix ? contextPrefix + ' — ' : ''}${base}`.trim()
    : (contextPrefix ? `${contextPrefix}. ${base}` : base)

  specs.push({
    slug,
    name,
    category,
    base_product_id: productId(tequilaRaw),
    season: seasonList(season),
    occasions: occasions(season),
    tasting_notes,
    flavor_profile: [],
    orb_from: orb.from,
    orb_to: orb.to,
    image_url: row.C || null,
    creator_name: (creator && creator !== 'NA') ? creator : null,
    venue: venue || null,
    ingredients,
    methodSteps,
  })
}

console.log(`\n→ seeding ${specs.length} new cocktails\n`)

// ─── 4. Ensure Berenice Morales creator exists ──────────────────────
const allCreatorNames = new Set(specs.map((s) => s.creator_name).filter(Boolean))
const { data: existingCreators } = await admin
  .from('creators')
  .select('id, name')
  .eq('workspace_id', ws.id)
  .is('deleted_at', null)
const creatorIdByName = new Map((existingCreators ?? []).map((c) => [c.name, c.id]))

for (const name of allCreatorNames) {
  if (creatorIdByName.has(name)) continue
  const { data: inserted, error } = await admin
    .from('creators')
    .insert({
      workspace_id: ws.id,
      name,
      role: 'Mixologist',
      city: 'Mexico City',
      country: 'Mexico',
      avatar_hue: 280,
      languages: ['Spanish', 'English'],
    })
    .select('id')
    .single()
  if (error) {
    console.error(`! creator insert failed for ${name}:`, error.message)
    continue
  }
  creatorIdByName.set(name, inserted.id)
  console.log(`+ creator ${name}`)
}

// ─── 5. Insert cocktails ────────────────────────────────────────────
for (const s of specs) {
  const creator_id = s.creator_name ? creatorIdByName.get(s.creator_name) ?? null : null
  const method_steps = s.methodSteps.map((text, i) => ({ step: i + 1, text }))

  const { data: inserted, error: insertErr } = await admin
    .from('cocktails')
    .insert({
      workspace_id: ws.id,
      slug: s.slug,
      name: s.name,
      status: 'published',
      category: s.category,
      spirit_base: 'Tequila',
      base_product_id: s.base_product_id,
      tasting_notes: s.tasting_notes,
      flavor_profile: s.flavor_profile,
      season: s.season,
      occasions: s.occasions,
      orb_from: s.orb_from,
      orb_to: s.orb_to,
      method_steps,
      creator_id,
      featured: false,
    })
    .select('id')
    .single()

  if (insertErr || !inserted) {
    console.error(`! insert failed for ${s.slug}:`, insertErr?.message)
    continue
  }

  if (s.ingredients.length > 0) {
    const ingRows = s.ingredients.map((ing, idx) => ({
      cocktail_id: inserted.id,
      position: idx + 1,
      custom_name: ing.name,
      amount_text: ing.amount_text,
      amount: null,
      unit: null,
    }))
    const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
    if (ingErr) console.error(`! ingredient insert failed for ${s.slug}:`, ingErr.message)
  }

  console.log(
    `+ ${s.name.padEnd(26)} · ${s.ingredients.length} ing · ${method_steps.length} steps${s.creator_name ? ' · ' + s.creator_name : ''}`,
  )
}

console.log('\n✓ done')
