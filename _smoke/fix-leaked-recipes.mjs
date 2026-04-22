// Re-parse recipes from xlsx2 for cocktails whose ingredients/method got
// collapsed into a single line during the first seed (format uses "- " as
// ingredient delimiter + no clear method boundary).
//
// For each such cocktail:
//   1. Delete existing cocktail_ingredients rows
//   2. Re-parse the raw recipe into proper ingredient rows + method steps
//   3. Update method_steps
//
// Run: node --env-file=.env.local _smoke/fix-leaked-recipes.mjs

import { createClient } from '@supabase/supabase-js'
import { readFile } from 'node:fs/promises'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// ─── Load xlsx2 ──────────────────────────────────────────────────────
const xml = await readFile('/tmp/xlsx_dump2/xl/worksheets/sheet1.xml', 'utf8')
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

const bySlug = new Map()
const maxRow = Math.max(...Object.keys(rows).map(Number))
for (let r = 4; r <= maxRow; r++) {
  const row = rows[r]
  if (!row?.A) continue
  bySlug.set(slugify(row.A), row)
}

// ─── Better parser ───────────────────────────────────────────────────
const qtyHead = /^(?:[\d\s½¼¾⅓⅔.]+\s*(?:oz|tsp|tbsp|ml|g|cups?|dash(?:es)?|drops?|barspoon|bar\s*spoon|slices?|sprig|bsp|pinch|splash)\.?)/i
const methodVerbs =
  /^(?:shake|stir|pour|combine|add|strain|serve|garnish|mix|top|build|muddle|rim|line|rub|dry\s+shake|fine|chill|blend|roll|layer|hard\s+shake|smoke|double\s+strain|tear|infuse|steep|prepare|heat|warm|simmer|whisk|gently|slowly|spritz|spray|dash|drizzle|flame|torch|in a|into a|onto a|filled|over|cut|cover|refrigerate|store|place)/i

function isIngredientLike(s) {
  if (!s) return false
  if (methodVerbs.test(s)) return false
  if (qtyHead.test(s)) return true
  // Short non-method line that mentions a garnish-only ingredient
  if (s.length < 50 && /^(?:splash|pinch|dash|drops?|sprig|slice|rim|garnish|hoja|lemon|lime|orange|mint|basil|rosemary|cilantro|dill|salt|pepper|sugar|ice|edible|honey|edible gold|nutmeg|cloves?)/i.test(s)) return true
  return false
}

function parseRecipe(raw) {
  if (!raw || !raw.trim()) return { ingredients: [], methodSteps: [] }

  let normalized = raw
    .replace(/1⁄2/g, '½')
    .replace(/1⁄4/g, '¼')
    .replace(/3⁄4/g, '¾')
    .replace(/1⁄3/g, '⅓')
    .replace(/2⁄3/g, '⅔')

  // Prefer " - " as separator if present, else split on newlines.
  let parts
  if (/\s-\s+/.test(normalized)) {
    parts = normalized
      .replace(/\r?\n/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .split(/\s*-\s+/)
  } else {
    parts = normalized.split(/\r?\n/)
  }
  parts = parts.map((p) => p.trim()).filter(Boolean)

  const ingredients = []
  const methodLines = []
  let methodStarted = false

  for (const part of parts) {
    // Inside a single part, there may still be trailing method sentences after
    // the ingredient descriptor. If the part looks like "X ingredient. Shake and...",
    // split on the first sentence boundary when the second half starts with a verb.
    if (!methodStarted && isIngredientLike(part)) {
      // If this part has a method verb starting mid-way, split it.
      const sentSplit = part.split(/(?<=\.)\s+(?=[A-Z][a-z])/)
      if (sentSplit.length > 1 && methodVerbs.test(sentSplit[1])) {
        ingredients.push(sentSplit[0].trim())
        methodLines.push(sentSplit.slice(1).join(' '))
        methodStarted = true
        continue
      }
      ingredients.push(part)
      continue
    }
    // Method starts
    methodStarted = true
    methodLines.push(part)
  }

  // Clean ingredients: strip trailing periods, leading measurement numbers that leak
  const ingRows = ingredients.map((line) => {
    const cleaned = line.replace(/\*+$/, '').replace(/\.$/, '').trim()
    // Try to split amount from name
    const m = cleaned.match(/^([\d\s½¼¾⅓⅔.]+\s*(?:oz|tsp|tbsp|ml|g|cups?|dash(?:es)?|drops?|barspoon|bar\s*spoon|slices?|sprig|bsp|pinch|splash)\.?)\s+(.+)$/i)
    if (m) return { amount_text: m[1].trim(), name: m[2].trim() }
    return { amount_text: null, name: cleaned }
  })

  // Method: split into sentences
  const methodJoined = methodLines.join(' ').replace(/\s+/g, ' ').trim()
  const sentences = methodJoined.match(/[^.!?]+[.!?]?/g) ?? []
  const methodSteps = sentences
    .map((s) => s.trim())
    .filter((s) => s.length > 2)
    .slice(0, 8)

  return { ingredients: ingRows, methodSteps }
}

// ─── Find the leaked cocktails ───────────────────────────────────────
const { data: ws } = await admin
  .from('workspaces')
  .select('id')
  .eq('slug', 'casa-dragones')
  .maybeSingle()

const { data: cocktails } = await admin
  .from('cocktails')
  .select('id, slug, name, method_steps')
  .eq('workspace_id', ws.id)

const { data: allIngs } = await admin
  .from('cocktail_ingredients')
  .select('cocktail_id, custom_name, position')
  .in('cocktail_id', cocktails.map((c) => c.id))

const ingByCocktail = new Map()
for (const i of allIngs ?? []) {
  if (!ingByCocktail.has(i.cocktail_id)) ingByCocktail.set(i.cocktail_id, [])
  ingByCocktail.get(i.cocktail_id).push(i)
}

const qtyTokenRe = /\b(oz|tsp|tbsp|ml|dash|dashes|drops?|barspoon|slice|sprig|cups?)\b/gi
function leaked(line) {
  if (!line) return false
  const matches = line.match(qtyTokenRe)
  return (matches?.length ?? 0) >= 2
}

const targets = []
for (const c of cocktails) {
  const ings = ingByCocktail.get(c.id) ?? []
  const hasLeaked = ings.some((i) => leaked(i.custom_name))
  if (!hasLeaked) continue
  const xlsxRow = bySlug.get(c.slug)
  if (!xlsxRow) {
    console.warn(`! no xlsx row for ${c.slug} — skip`)
    continue
  }
  targets.push({ cocktail: c, xlsxRow })
}

console.log(`→ ${targets.length} cocktails to re-parse\n`)

// ─── Update each ─────────────────────────────────────────────────────
let fixed = 0
for (const { cocktail, xlsxRow } of targets) {
  const { ingredients, methodSteps } = parseRecipe(xlsxRow.E ?? '')
  if (ingredients.length === 0) {
    console.warn(`· ${cocktail.slug}: no ingredients parsed, skipping`)
    continue
  }

  // Delete existing ingredients
  await admin.from('cocktail_ingredients').delete().eq('cocktail_id', cocktail.id)
  // Insert new
  const ingRows = ingredients.map((ing, idx) => ({
    cocktail_id: cocktail.id,
    position: idx + 1,
    custom_name: ing.name,
    amount_text: ing.amount_text,
    amount: null,
    unit: null,
  }))
  const { error: ingErr } = await admin.from('cocktail_ingredients').insert(ingRows)
  if (ingErr) {
    console.error(`! ingredient insert failed for ${cocktail.slug}:`, ingErr.message)
    continue
  }
  // Update method_steps
  const steps = methodSteps.map((text, i) => ({ step: i + 1, text }))
  const { error: methodErr } = await admin
    .from('cocktails')
    .update({ method_steps: steps })
    .eq('id', cocktail.id)
  if (methodErr) {
    console.error(`! method update failed for ${cocktail.slug}:`, methodErr.message)
    continue
  }
  console.log(`✓ ${cocktail.name.padEnd(28)} · ${ingredients.length} ing · ${methodSteps.length} steps`)
  fixed++
}

console.log(`\n✓ ${fixed}/${targets.length} cocktails re-parsed`)
