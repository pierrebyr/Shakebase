// Promote cleaned cocktail_ingredients.custom_name values to the shared
// global_ingredients catalog (or workspace_ingredients for brand/house-
// specific items). Then rewrite cocktail_ingredients rows to reference
// the FK and null out custom_name.
//
// Idempotent. Run: node --env-file=.env.local _smoke/migrate-custom-names-to-global.mjs [--dry]

import { createClient } from '@supabase/supabase-js'

const DRY = process.argv.includes('--dry')

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } },
)

// Workspace-specific keywords. Any ingredient whose name (lowercased)
// matches these goes into the tenant's workspace_ingredients table
// instead of the shared global_ingredients catalog.
const WORKSPACE_KEYWORDS = [
  /\bhouse[- ]?made\b/,
  /\bhomemade\b/,
  /\bcasa dragones\b/,
  /\b200\s*copas\b/,
  /\bdragones\b/,
  /\bbatch\b/,
  /\binfused with\b/,
  /\bhousemade\b/,
  /\bcustom\b/,
  /\bsecret\b/,
]
// Explicit workspace-only names (house preparations / code names)
const EXPLICIT_WORKSPACE = new Set([
  'verdita',
  'zanamora',
  'petroleo mix',
  'ramona',
  'donnie vinaigrette',
  'cookie crumble',
  'taco mix',
  'sangrita ingredients',
  'mole vermouth',
  'dragones punch batch',
  'dropper grapefruit tincture',
  'spiced king ice',
])

function isWorkspaceSpecific(lowerName) {
  if (EXPLICIT_WORKSPACE.has(lowerName)) return true
  return WORKSPACE_KEYWORDS.some((re) => re.test(lowerName))
}

// Tiny inline category inferrer (mirrors lib/ingredient-slug.ts). Used so
// the new global_ingredients rows land with a sensible category hint.
function inferCategory(name) {
  const s = name.toLowerCase()
  if (/\bbitters?\b/.test(s)) return 'bitters'
  if (/\b(vinegars?|balsamic|citric acid|charcoal|tincture|rim\b|foam\b|dust|powder|flakes?|oils?|gels?|caviar|spheres?|ices?|cubes?|crystals?|garnish|salts?)\b/.test(s)) return 'garnish'
  if (/\b(liqueurs?|aperitifs?|amaros?|amer|chartreuse|cointreau|triple sec|curacao|curaçao|vermouths?|suze|benedictine|campari|aperol|cynar|fernet|sherry|ports?|lillet|limoncello|sambuca|pernod|absinthe|amaretto|disaronno|pimms?|cocchi|italicus|st[- ]germain|galliano|drambuie|frangelico|kirsch|averna|carpano|cinzano|xtabent[úu]n|dolin|giffards?|cappelletti|licor 43|falernums?|akvavit)\b/.test(s)) return 'liqueur'
  if (/\b(tequilas?|mezcals?|gins?|rums?|vodkas?|whisk(?:e)?ys?|bourbons?|ryes?|cognacs?|brandys?|brandies|pisco|sake|champagnes?|proseccos?|cavas?|wines?|blanco|reposado|añejo|anejo|joven|cristalino|zinfandel|rosé)\b/.test(s)) return 'spirit'
  if (/\b(tonics?|sodas?|club soda|sparkling|ginger beer|ginger ale|colas?|lemonades?|seltzers?|q soda)\b/.test(s)) return 'soda'
  if (/\b(milks?|creams?|crema|egg white|egg yolk|whole egg|eggs?|aquafaba|butter|yogurts?|kefir|buttermilk)\b/.test(s)) return 'dairy'
  if (/\b(syrups?|agave|nectars?|honey|sugars?|piloncillo|molasses|grenadine|cordials?|orgeats?|miel|demerara)\b/.test(s)) return 'sweetener'
  if (/\b(cold brew|pour[- ]over|atole|hibiscus tea|tea)\b/.test(s)) return 'brew'
  if (/\b(limes?|lemons?|yuzus?|grapefruits?|oranges?|mandarins?|tangerines?|kumquats?|bergamots?|citrus|limón)\b/.test(s)) return 'citrus'
  if (/\b(strawberry|strawberries|raspberry|raspberries|apples?|pears?|peach(?:es)?|pineapples?|piña|mangos?|papayas?|watermelons?|cucumbers?|guavas?|pomegranates?|cherry|cherries|figs?|grapes?|kiwis?|bananas?|passionfruit|hibiscus|coconuts?|avocados?|tomatos?|tomatoes?|tomates?|beets?|carrots?|celery|pumpkins?|arugulas?|plums?|currants?)\b/.test(s)) return 'fruit'
  if (/\b(juices?|jugos?|pur[eé]es?|pulps?|coulis|shrubs?|compotes?|jams?|jelly|jellies|marmalades?|infusions?)\b/.test(s)) return 'juice'
  if (/\b(mint|basil|cilantro|coriander|rosemary|thyme|sage|lavender|oregano|dill|tarragon|hoja santa|epazote|peppers?|cumin|cinnamon|cloves?|nutmeg|cardamom|vanilla|chil[ei]|jalape|serrano|habanero|ancho|cacao|cocoa|chocolate|coffee|espresso|teas?|ginger|garlic|lemongrass|masala|turmeric)\b/.test(s)) return 'herb'
  if (/\b(waters?|agua|brines?|saline)\b/.test(s)) return 'water'
  return 'other'
}

// ─── fetch all unlinked rows ─────────────────────────────────────────
let rows = []
for (let from = 0; ; from += 1000) {
  const { data, error } = await admin
    .from('cocktail_ingredients')
    .select('id, custom_name, cocktail_id, cocktails!inner(workspace_id)')
    .is('global_ingredient_id', null)
    .is('workspace_ingredient_id', null)
    .is('global_product_id', null)
    .not('custom_name', 'is', null)
    .range(from, from + 999)
  if (error) { console.error('!', error.message); process.exit(1) }
  if (!data || data.length === 0) break
  rows = rows.concat(data)
  if (data.length < 1000) break
}
console.log(`→ ${rows.length} unlinked rows to migrate`)

// ─── bucket by (workspace_id, name) ──────────────────────────────────
// Shape: Map<workspace_id, { workspace: Map<name, [rowIds]>, global: Map<name, [rowIds]> }>
const globalByName = new Map() // name → { category, rowIds: [...] }
const workspaceByWsName = new Map() // workspace_id → Map<name, rowIds[]>

for (const r of rows) {
  const raw = (r.custom_name ?? '').trim()
  if (!raw) continue
  const ws = r.cocktails.workspace_id
  const lower = raw.toLowerCase()

  if (isWorkspaceSpecific(lower)) {
    const inner = workspaceByWsName.get(ws) ?? new Map()
    const arr = inner.get(raw) ?? []
    arr.push(r.id)
    inner.set(raw, arr)
    workspaceByWsName.set(ws, inner)
  } else {
    const entry = globalByName.get(raw) ?? { category: inferCategory(raw), rowIds: [] }
    entry.rowIds.push(r.id)
    globalByName.set(raw, entry)
  }
}

console.log(`→ distinct names: ${globalByName.size} global · ${[...workspaceByWsName.values()].reduce((s, m) => s + m.size, 0)} workspace-only`)

if (DRY) {
  const sortedG = [...globalByName.entries()].sort((a, b) => b[1].rowIds.length - a[1].rowIds.length)
  console.log('\nTop 25 global:')
  for (const [name, entry] of sortedG.slice(0, 25)) console.log(`  [${entry.rowIds.length}] (${entry.category}) ${name}`)
  console.log(`\nTop workspace-only:`)
  for (const [ws, inner] of workspaceByWsName) {
    const sortedW = [...inner.entries()].sort((a, b) => b[1].length - a[1].length)
    for (const [name, ids] of sortedW.slice(0, 15)) console.log(`  [${ids.length}] (ws=${ws.slice(0, 8)}) ${name}`)
  }
  process.exit(0)
}

// ─── upsert global_ingredients, then map back to IDs ────────────────
async function upsertGlobals() {
  const names = [...globalByName.keys()]
  // Upsert by name (unique)
  const payload = names.map((name) => ({
    name,
    category: globalByName.get(name).category,
  }))

  // Chunk to avoid huge payloads
  const CHUNK = 100
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK)
    const { error } = await admin
      .from('global_ingredients')
      .upsert(slice, { onConflict: 'name', ignoreDuplicates: false })
    if (error) {
      console.error(`! upsert global chunk ${i}:`, error.message)
      process.exit(1)
    }
  }

  // Read back to get IDs
  const { data } = await admin
    .from('global_ingredients')
    .select('id, name')
    .in('name', names)
  const byName = new Map()
  for (const row of data ?? []) byName.set(row.name, row.id)
  return byName
}

async function upsertWorkspaceFor(ws, names) {
  const payload = names.map((name) => ({
    workspace_id: ws,
    name,
  }))
  const CHUNK = 100
  for (let i = 0; i < payload.length; i += CHUNK) {
    const slice = payload.slice(i, i + CHUNK)
    const { error } = await admin
      .from('workspace_ingredients')
      .upsert(slice, { onConflict: 'workspace_id,name', ignoreDuplicates: false })
    if (error) {
      console.error(`! upsert workspace chunk ${i}:`, error.message)
      process.exit(1)
    }
  }
  const { data } = await admin
    .from('workspace_ingredients')
    .select('id, name')
    .eq('workspace_id', ws)
    .in('name', names)
  const byName = new Map()
  for (const row of data ?? []) byName.set(row.name, row.id)
  return byName
}

console.log('→ upserting global_ingredients…')
const globalIds = await upsertGlobals()

console.log('→ upserting workspace_ingredients per tenant…')
const wsIds = new Map() // workspace_id → Map<name, id>
for (const [ws, inner] of workspaceByWsName) {
  wsIds.set(ws, await upsertWorkspaceFor(ws, [...inner.keys()]))
}

// ─── rewrite cocktail_ingredients rows ────────────────────────────────
console.log('→ rewriting cocktail_ingredients…')
let ok = 0
let fail = 0

async function updateRow(rowId, patch) {
  const { error } = await admin.from('cocktail_ingredients').update(patch).eq('id', rowId)
  if (error) { fail++; console.error('!', rowId, error.message) }
  else ok++
  if ((ok + fail) % 200 === 0) console.log(`  … ${ok + fail}`)
}

for (const [name, entry] of globalByName) {
  const fkId = globalIds.get(name)
  if (!fkId) { console.warn(`! no FK for global "${name}"`); continue }
  for (const rowId of entry.rowIds) {
    await updateRow(rowId, { global_ingredient_id: fkId, custom_name: null })
  }
}

for (const [ws, inner] of workspaceByWsName) {
  const byName = wsIds.get(ws)
  for (const [name, rowIds] of inner) {
    const fkId = byName?.get(name)
    if (!fkId) { console.warn(`! no FK for workspace "${name}"`); continue }
    for (const rowId of rowIds) {
      await updateRow(rowId, { workspace_ingredient_id: fkId, custom_name: null })
    }
  }
}

console.log(`\n✓ ${ok} rewritten · ${fail} failed`)
